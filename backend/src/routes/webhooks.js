const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User, Subscription } = require('../database/models');
const logger = require('../utils/logger');

const router = express.Router();

// Stripe webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleSubscriptionCreated(subscription) {
  logger.info(`Subscription created: ${subscription.id}`);
  
  const customer = await stripe.customers.retrieve(subscription.customer);
  const user = await User.findOne({ where: { stripeCustomerId: customer.id } });
  
  if (user) {
    await user.update({
      subscriptionStatus: 'active',
      role: subscription.metadata.tier || 'premium'
    });
  }
}

async function handleSubscriptionUpdated(subscription) {
  logger.info(`Subscription updated: ${subscription.id}`);
  
  const localSubscription = await Subscription.findOne({
    where: { stripeSubscriptionId: subscription.id }
  });
  
  if (localSubscription) {
    await localSubscription.update({
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });
    
    const user = await User.findByPk(localSubscription.userId);
    if (user) {
      await user.update({
        subscriptionStatus: subscription.status === 'active' ? 'active' : 'inactive'
      });
    }
  }
}

async function handleSubscriptionDeleted(subscription) {
  logger.info(`Subscription deleted: ${subscription.id}`);
  
  const localSubscription = await Subscription.findOne({
    where: { stripeSubscriptionId: subscription.id }
  });
  
  if (localSubscription) {
    await localSubscription.update({ status: 'canceled' });
    
    const user = await User.findByPk(localSubscription.userId);
    if (user) {
      await user.update({
        subscriptionStatus: 'inactive',
        role: 'free'
      });
    }
  }
}

async function handlePaymentSucceeded(invoice) {
  logger.info(`Payment succeeded: ${invoice.id}`);
  
  if (invoice.subscription) {
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: invoice.subscription }
    });
    
    if (subscription) {
      await subscription.update({ status: 'active' });
      
      const user = await User.findByPk(subscription.userId);
      if (user) {
        await user.update({ subscriptionStatus: 'active' });
      }
    }
  }
}

async function handlePaymentFailed(invoice) {
  logger.info(`Payment failed: ${invoice.id}`);
  
  if (invoice.subscription) {
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: invoice.subscription }
    });
    
    if (subscription) {
      await subscription.update({ status: 'past_due' });
      
      const user = await User.findByPk(subscription.userId);
      if (user) {
        await user.update({ subscriptionStatus: 'past_due' });
      }
    }
  }
}

module.exports = router;