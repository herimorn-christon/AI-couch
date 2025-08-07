const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { User, Trainer, Workout, Exercise } = require('../database/models');
const logger = require('../utils/logger');

const router = express.Router();

// Get all trainers
router.get('/', async (req, res) => {
  try {
    const { 
      specialty, 
      minRate, 
      maxRate, 
      location, 
      rating, 
      page = 1, 
      limit = 20 
    } = req.query;

    const where = { isActive: true, applicationStatus: 'approved' };
    
    // Apply filters
    if (specialty) {
      where.specialties = { [require('sequelize').Op.contains]: [specialty] };
    }
    
    if (minRate || maxRate) {
      where.hourlyRate = {};
      if (minRate) where.hourlyRate[require('sequelize').Op.gte] = parseFloat(minRate);
      if (maxRate) where.hourlyRate[require('sequelize').Op.lte] = parseFloat(maxRate);
    }
    
    if (location) {
      where.location = { [require('sequelize').Op.iLike]: `%${location}%` };
    }
    
    if (rating) {
      where.rating = { [require('sequelize').Op.gte]: parseFloat(rating) };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const trainers = await Trainer.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'avatar']
      }],
      order: [['rating', 'DESC'], ['reviewCount', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      trainers: trainers.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: trainers.count,
        pages: Math.ceil(trainers.count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get trainers error:', error);
    res.status(500).json({ message: 'Failed to fetch trainers' });
  }
});

// Get featured trainers
router.get('/featured', async (req, res) => {
  try {
    const featuredTrainers = await Trainer.findAll({
      where: { 
        isActive: true, 
        applicationStatus: 'approved',
        rating: { [require('sequelize').Op.gte]: 4.5 }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'avatar']
      }],
      order: [['rating', 'DESC'], ['reviewCount', 'DESC']],
      limit: 6
    });

    res.json(featuredTrainers);
  } catch (error) {
    logger.error('Get featured trainers error:', error);
    res.status(500).json({ message: 'Failed to fetch featured trainers' });
  }
});

// Get trainer by ID
router.get('/:id', async (req, res) => {
  try {
    const trainer = await Trainer.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'avatar', 'email']
      }]
    });

    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    res.json(trainer);
  } catch (error) {
    logger.error('Get trainer error:', error);
    res.status(500).json({ message: 'Failed to fetch trainer' });
  }
});

// Apply to become a trainer
router.post('/apply', auth, [
  body('bio').isLength({ min: 50 }).withMessage('Bio must be at least 50 characters'),
  body('specialties').isArray({ min: 1 }).withMessage('At least one specialty is required'),
  body('experience').isInt({ min: 0 }).withMessage('Experience must be a positive number'),
  body('hourlyRate').isFloat({ min: 1 }).withMessage('Hourly rate must be at least $1'),
  body('location').notEmpty().withMessage('Location is required'),
  body('certifications').isArray().withMessage('Certifications must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      bio,
      specialties,
      experience,
      hourlyRate,
      location,
      certifications,
      availability
    } = req.body;

    // Check if user already has a trainer application
    const existingTrainer = await Trainer.findOne({ where: { userId: req.userId } });
    if (existingTrainer) {
      return res.status(400).json({ message: 'You have already applied to become a trainer' });
    }

    const trainer = await Trainer.create({
      userId: req.userId,
      bio,
      specialties,
      experience: parseInt(experience),
      hourlyRate: parseFloat(hourlyRate),
      location,
      certifications,
      availability: availability || {},
      applicationStatus: 'pending'
    });

    logger.info(`Trainer application submitted by user ${req.userId}`);

    res.status(201).json({
      message: 'Trainer application submitted successfully',
      trainer
    });
  } catch (error) {
    logger.error('Trainer application error:', error);
    res.status(500).json({ message: 'Failed to submit trainer application' });
  }
});

// Get trainer's workouts
router.get('/:id/workouts', async (req, res) => {
  try {
    const trainer = await Trainer.findByPk(req.params.id);
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    const workouts = await Workout.findAll({
      where: { 
        userId: trainer.userId,
        isPublic: true 
      },
      include: [{
        model: Exercise,
        as: 'exercises',
        through: { attributes: [] }
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(workouts);
  } catch (error) {
    logger.error('Get trainer workouts error:', error);
    res.status(500).json({ message: 'Failed to fetch trainer workouts' });
  }
});

// Book a session with trainer
router.post('/:id/book', auth, [
  body('sessionType').isIn(['consultation', 'training', 'nutrition']).withMessage('Invalid session type'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('duration').isInt({ min: 30, max: 180 }).withMessage('Duration must be between 30-180 minutes'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const trainer = await Trainer.findByPk(req.params.id);
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    const { sessionType, date, duration, notes } = req.body;

    // Calculate session cost
    const cost = (trainer.hourlyRate * duration / 60).toFixed(2);

    // Create booking (you would integrate with a booking system here)
    const booking = {
      id: require('crypto').randomUUID(),
      trainerId: trainer.id,
      clientId: req.userId,
      sessionType,
      date,
      duration,
      cost: parseFloat(cost),
      notes,
      status: 'pending',
      createdAt: new Date()
    };

    // In a real app, you would:
    // 1. Check trainer availability
    // 2. Process payment
    // 3. Send notifications
    // 4. Create calendar events

    logger.info(`Session booked with trainer ${trainer.id} by user ${req.userId}`);

    res.status(201).json({
      message: 'Session booked successfully',
      booking
    });
  } catch (error) {
    logger.error('Book session error:', error);
    res.status(500).json({ message: 'Failed to book session' });
  }
});

// Update trainer profile (trainer only)
router.put('/profile', auth, [
  body('bio').optional().isLength({ min: 50 }),
  body('hourlyRate').optional().isFloat({ min: 1 }),
  body('specialties').optional().isArray({ min: 1 }),
  body('availability').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const trainer = await Trainer.findOne({ where: { userId: req.userId } });
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer profile not found' });
    }

    const updateData = {};
    const allowedFields = ['bio', 'hourlyRate', 'specialties', 'availability', 'location'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await trainer.update(updateData);

    res.json({
      message: 'Trainer profile updated successfully',
      trainer
    });
  } catch (error) {
    logger.error('Update trainer profile error:', error);
    res.status(500).json({ message: 'Failed to update trainer profile' });
  }
});

// Get trainer earnings (trainer only)
router.get('/earnings', auth, async (req, res) => {
  try {
    const trainer = await Trainer.findOne({ where: { userId: req.userId } });
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer profile not found' });
    }

    // In a real app, you would fetch actual earnings data
    const earnings = {
      totalEarnings: trainer.totalEarnings,
      thisMonth: 0, // Calculate from actual bookings
      lastMonth: 0,
      pendingPayouts: 0,
      commissionRate: trainer.commissionRate,
      sessionsCompleted: 0 // Count from actual sessions
    };

    res.json(earnings);
  } catch (error) {
    logger.error('Get trainer earnings error:', error);
    res.status(500).json({ message: 'Failed to fetch earnings' });
  }
});

module.exports = router;