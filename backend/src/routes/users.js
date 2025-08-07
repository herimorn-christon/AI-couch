const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { User, Subscription, Trainer, WorkoutSession } = require('../database/models');
const logger = require('../utils/logger');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      include: [
        {
          model: Subscription,
          as: 'subscription'
        },
        {
          model: Trainer,
          as: 'trainer'
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('preferences').optional().isObject(),
  body('goals').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {};
    const allowedFields = ['firstName', 'lastName', 'avatar'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle nested objects
    if (req.body.preferences) {
      updateData.preferences = { ...user.preferences, ...req.body.preferences };
    }

    if (req.body.goals) {
      updateData.preferences = {
        ...user.preferences,
        goals: { ...user.preferences.goals, ...req.body.goals }
      };
    }

    await user.update(updateData);

    logger.info(`User profile updated: ${user.id}`);

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    logger.error('Update user profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Get user stats
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate current streak
    const sessions = await WorkoutSession.findAll({
      where: { 
        userId: req.userId,
        status: 'completed'
      },
      order: [['completedAt', 'DESC']],
      limit: 30
    });

    let currentStreak = 0;
    let lastWorkoutDate = null;

    for (const session of sessions) {
      const workoutDate = new Date(session.completedAt).toDateString();
      
      if (!lastWorkoutDate) {
        lastWorkoutDate = workoutDate;
        currentStreak = 1;
      } else {
        const daysDiff = Math.floor(
          (new Date(lastWorkoutDate) - new Date(workoutDate)) / (1000 * 60 * 60 * 24)
        );
        
        if (daysDiff === 1) {
          currentStreak++;
          lastWorkoutDate = workoutDate;
        } else {
          break;
        }
      }
    }

    // Update user stats
    const totalWorkouts = await WorkoutSession.count({
      where: { userId: req.userId, status: 'completed' }
    });

    const totalMinutes = await WorkoutSession.sum('duration', {
      where: { userId: req.userId, status: 'completed' }
    }) || 0;

    const averageRating = await WorkoutSession.findOne({
      where: { userId: req.userId, status: 'completed' },
      attributes: [
        [require('sequelize').fn('AVG', require('sequelize').col('rating')), 'avgRating']
      ]
    });

    const updatedStats = {
      totalWorkouts,
      totalMinutes: Math.round(totalMinutes / 60), // Convert to minutes
      currentStreak,
      longestStreak: Math.max(currentStreak, user.stats.longestStreak || 0),
      averageRating: Math.round((averageRating?.dataValues?.avgRating || 0) * 10) / 10
    };

    await user.update({
      stats: { ...user.stats, ...updatedStats }
    });

    res.json({ stats: updatedStats });
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({ message: 'Failed to fetch user stats' });
  }
});

// Delete user account
router.delete('/account', auth, [
  body('password').notEmpty().withMessage('Password is required for account deletion')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Cancel subscription if exists
    const subscription = await Subscription.findOne({
      where: { userId: req.userId, status: 'active' }
    });

    if (subscription) {
      // Cancel Stripe subscription
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      await stripe.subscriptions.del(subscription.stripeSubscriptionId);
      await subscription.update({ status: 'canceled' });
    }

    // Soft delete user (mark as inactive)
    await user.update({ isActive: false });

    logger.info(`User account deleted: ${user.id}`);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('Delete user account error:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

module.exports = router;