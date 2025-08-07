const express = require('express');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const { User, Workout, WorkoutSession, Subscription, Trainer } = require('../database/models');
const logger = require('../utils/logger');

const router = express.Router();

// User analytics dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const userId = req.userId;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get workout sessions in timeframe
    const sessions = await WorkoutSession.findAll({
      where: {
        userId,
        completedAt: {
          [Op.between]: [startDate, endDate],
          [Op.not]: null
        }
      },
      include: [{
        model: Workout,
        as: 'workout',
        attributes: ['name', 'category', 'difficulty']
      }],
      order: [['completedAt', 'ASC']]
    });

    // Calculate metrics
    const totalWorkouts = sessions.length;
    const totalDuration = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const totalCalories = sessions.reduce((sum, session) => sum + (session.caloriesBurned || 0), 0);
    const averageRating = sessions.length > 0 
      ? sessions.reduce((sum, session) => sum + (session.rating || 0), 0) / sessions.length 
      : 0;

    // Workout frequency by day
    const workoutsByDay = {};
    sessions.forEach(session => {
      const day = session.completedAt.toISOString().split('T')[0];
      workoutsByDay[day] = (workoutsByDay[day] || 0) + 1;
    });

    // Category breakdown
    const categoryBreakdown = {};
    sessions.forEach(session => {
      const category = session.workout?.category || 'unknown';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    // Progress trends
    const weeklyProgress = [];
    for (let i = 0; i < Math.ceil((endDate - startDate) / (7 * 24 * 60 * 60 * 1000)); i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekSessions = sessions.filter(session => 
        session.completedAt >= weekStart && session.completedAt < weekEnd
      );

      weeklyProgress.push({
        week: weekStart.toISOString().split('T')[0],
        workouts: weekSessions.length,
        duration: weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
        calories: weekSessions.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0)
      });
    }

    res.json({
      summary: {
        totalWorkouts,
        totalDuration: Math.round(totalDuration / 60), // Convert to minutes
        totalCalories,
        averageRating: Math.round(averageRating * 10) / 10
      },
      workoutsByDay,
      categoryBreakdown,
      weeklyProgress,
      timeframe
    });
  } catch (error) {
    logger.error('Analytics dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Admin analytics (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(timeframe.replace('d', '')));

    // User metrics
    const totalUsers = await User.count();
    const newUsers = await User.count({
      where: {
        createdAt: { [Op.gte]: startDate }
      }
    });

    // Subscription metrics
    const activeSubscriptions = await Subscription.count({
      where: { status: 'active' }
    });

    const subscriptionRevenue = await Subscription.sum('price', {
      where: { status: 'active' }
    });

    // Workout metrics
    const totalWorkouts = await WorkoutSession.count({
      where: {
        completedAt: { [Op.not]: null },
        createdAt: { [Op.gte]: startDate }
      }
    });

    // Trainer metrics
    const totalTrainers = await Trainer.count({
      where: { applicationStatus: 'approved' }
    });

    const pendingApplications = await Trainer.count({
      where: { applicationStatus: 'pending' }
    });

    // Daily active users
    const dailyActiveUsers = await WorkoutSession.findAll({
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
        [require('sequelize').fn('COUNT', require('sequelize').fn('DISTINCT', require('sequelize').col('userId'))), 'users']
      ],
      group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
      order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']]
    });

    res.json({
      users: {
        total: totalUsers,
        new: newUsers,
        dailyActive: dailyActiveUsers
      },
      subscriptions: {
        active: activeSubscriptions,
        revenue: subscriptionRevenue || 0
      },
      workouts: {
        total: totalWorkouts
      },
      trainers: {
        total: totalTrainers,
        pending: pendingApplications
      }
    });
  } catch (error) {
    logger.error('Admin analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch admin analytics' });
  }
});

// Trainer analytics (trainer only)
router.get('/trainer', auth, async (req, res) => {
  try {
    const trainer = await Trainer.findOne({ where: { userId: req.userId } });
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer profile not found' });
    }

    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(timeframe.replace('d', '')));

    // Mock trainer analytics (replace with actual booking/session data)
    const analytics = {
      earnings: {
        total: trainer.totalEarnings,
        thisMonth: 0, // Calculate from actual bookings
        lastMonth: 0,
        growth: 0
      },
      sessions: {
        total: 0, // Count from actual sessions
        thisMonth: 0,
        completed: 0,
        canceled: 0
      },
      clients: {
        total: trainer.clientCount,
        new: 0, // New clients this period
        returning: 0
      },
      rating: {
        average: trainer.rating,
        total: trainer.reviewCount,
        breakdown: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0
        }
      }
    };

    res.json(analytics);
  } catch (error) {
    logger.error('Trainer analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch trainer analytics' });
  }
});

module.exports = router;