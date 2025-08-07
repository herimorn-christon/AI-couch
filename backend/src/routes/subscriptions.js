const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { User, Subscription } = require('../database/models');
const logger = require('../utils/logger');

const router = express.Router();

// Subscription plans
const PLANS = {
  premium: {
    name: 'Premium',
    price: 9.99,
    features: {
      ai_coaching: true,
      form_analysis: true,
      nutrition_ai: false,
      personal_trainer: false,
      advanced_analytics: true,
      custom_workouts: true
    }
  },
  elite: {
    name: 'Elite',
    price: 39.99,
    features: {
      ai_coaching: true,
      form_analysis: true,
      nutrition_ai: true,
      personal_trainer: true,
      advanced_analytics: true,
      custom_workouts: true
    }
  }
};

// Get subscription plans
router.get('/plans', (req, res) => {
  res.json(PLANS);
});

// Get user's current subscription
router.get('/current', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.userId }
    });

    if (!subscription) {
      return res.json({ subscription: null, plan: 'free' });
    }

    res.json({ subscription, plan: subscription.tier });
  } catch (error) {
    logger.error('Get subscription error:', error);
    res.status(500).json({ message: 'Failed to fetch subscription' });
  }
});

// Create subscription
router.post('/create', auth, [
  body('tier').isIn(['premium', 'elite']).withMessage('Invalid subscription tier'),
  body('paymentMethodId').notEmpty().withMessage('Payment method is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tier, paymentMethodId } = req.body;
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already has a subscription
    const existingSubscription = await Subscription.findOne({
      where: { userId: req.userId }
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      return res.status(400).json({ message: 'User already has an active subscription' });
    }

    const plan = PLANS[tier];
    if (!plan) {
      return res.status(400).json({ message: 'Invalid subscription plan' });
    }

    // Create or retrieve Stripe customer
    let stripeCustomer;
    if (user.stripeCustomerId) {
      stripeCustomer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      stripeCustomer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: { userId: user.id }
      });

      await user.update({ stripeCustomerId: stripeCustomer.id });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomer.id,
    });

    // Set as default payment method
    await stripe.customers.update(stripeCustomer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `AI Workout Tracker ${plan.name}`,
          },
          unit_amount: Math.round(plan.price * 100),
          recurring: {
            interval: 'month',
          },
        },
      }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // Create subscription record
    const subscription = await Subscription.create({
      userId: req.userId,
      tier,
      status: stripeSubscription.status === 'active' ? 'active' : 'trialing',
      stripeCustomerId: stripeCustomer.id,
      stripeSubscriptionId: stripeSubscription.id,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      features: plan.features,
      price: plan.price
    });

    // Update user role
    await user.update({
      role: tier,
      subscriptionStatus: 'active'
    });

    logger.info(`Subscription created for user ${req.userId}: ${tier}`);

    res.status(201).json({
      subscription,
      clientSecret: stripeSubscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    logger.error('Create subscription error:', error);
    res.status(500).json({ message: 'Failed to create subscription' });
  }
});

// Cancel subscription
router.post('/cancel', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.userId, status: 'active' }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    // Cancel Stripe subscription at period end
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    // Update local subscription
    await subscription.update({
      cancelAtPeriodEnd: true
    });

    logger.info(`Subscription canceled for user ${req.userId}`);

    res.json({ message: 'Subscription will be canceled at the end of the current period' });
  } catch (error) {
    logger.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
});

// Reactivate subscription
router.post('/reactivate', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.userId }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    // Reactivate Stripe subscription
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    // Update local subscription
    await subscription.update({
      cancelAtPeriodEnd: false,
      status: 'active'
    });

    logger.info(`Subscription reactivated for user ${req.userId}`);

    res.json({ message: 'Subscription reactivated successfully' });
  } catch (error) {
    logger.error('Reactivate subscription error:', error);
    res.status(500).json({ message: 'Failed to reactivate subscription' });
  }
});

module.exports = router;