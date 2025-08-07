const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { Exercise } = require('../database/models');
const logger = require('../utils/logger');

const router = express.Router();

// Get all exercises
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      difficulty, 
      targetMuscle, 
      equipment,
      search,
      page = 1, 
      limit = 50 
    } = req.query;

    const where = {};
    
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (targetMuscle) {
      where.targetMuscles = { [require('sequelize').Op.contains]: [targetMuscle] };
    }
    if (equipment) {
      where.equipment = { [require('sequelize').Op.contains]: [equipment] };
    }
    if (search) {
      where.name = { [require('sequelize').Op.iLike]: `%${search}%` };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const exercises = await Exercise.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      exercises: exercises.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: exercises.count,
        pages: Math.ceil(exercises.count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get exercises error:', error);
    res.status(500).json({ message: 'Failed to fetch exercises' });
  }
});

// Get exercise by ID
router.get('/:id', async (req, res) => {
  try {
    const exercise = await Exercise.findByPk(req.params.id);
    
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    res.json(exercise);
  } catch (error) {
    logger.error('Get exercise error:', error);
    res.status(500).json({ message: 'Failed to fetch exercise' });
  }
});

// Create exercise (admin/trainer only)
router.post('/', auth, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required'),
  body('category').isIn(['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'full_body']).withMessage('Invalid category'),
  body('targetMuscles').isArray({ min: 1 }).withMessage('At least one target muscle is required'),
  body('instructions').isArray({ min: 1 }).withMessage('Instructions are required'),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user has permission to create exercises
    const user = await require('../database/models').User.findByPk(req.userId);
    if (!['admin', 'trainer'].includes(user.role)) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const {
      name,
      category,
      targetMuscles,
      instructions,
      tips = [],
      videoUrl,
      imageUrl,
      equipment = [],
      difficulty,
      formCheckpoints = [],
      commonMistakes = [],
      variations = [],
      isCompound = false,
      caloriesPerMinute
    } = req.body;

    const exercise = await Exercise.create({
      name,
      category,
      targetMuscles,
      instructions,
      tips,
      videoUrl,
      imageUrl,
      equipment,
      difficulty,
      formCheckpoints,
      commonMistakes,
      variations,
      isCompound,
      caloriesPerMinute
    });

    logger.info(`Exercise created: ${exercise.id} by user ${req.userId}`);

    res.status(201).json({
      message: 'Exercise created successfully',
      exercise
    });
  } catch (error) {
    logger.error('Create exercise error:', error);
    res.status(500).json({ message: 'Failed to create exercise' });
  }
});

// Update exercise (admin/trainer only)
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('category').optional().isIn(['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'full_body']),
  body('targetMuscles').optional().isArray({ min: 1 }),
  body('instructions').optional().isArray({ min: 1 }),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check permissions
    const user = await require('../database/models').User.findByPk(req.userId);
    if (!['admin', 'trainer'].includes(user.role)) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const exercise = await Exercise.findByPk(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    const updateData = {};
    const allowedFields = [
      'name', 'category', 'targetMuscles', 'instructions', 'tips',
      'videoUrl', 'imageUrl', 'equipment', 'difficulty', 'formCheckpoints',
      'commonMistakes', 'variations', 'isCompound', 'caloriesPerMinute'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await exercise.update(updateData);

    logger.info(`Exercise updated: ${exercise.id} by user ${req.userId}`);

    res.json({
      message: 'Exercise updated successfully',
      exercise
    });
  } catch (error) {
    logger.error('Update exercise error:', error);
    res.status(500).json({ message: 'Failed to update exercise' });
  }
});

// Get exercise categories
router.get('/meta/categories', (req, res) => {
  const categories = [
    { id: 'chest', name: 'Chest', description: 'Chest and pectoral exercises' },
    { id: 'back', name: 'Back', description: 'Back and latissimus dorsi exercises' },
    { id: 'shoulders', name: 'Shoulders', description: 'Shoulder and deltoid exercises' },
    { id: 'arms', name: 'Arms', description: 'Bicep, tricep, and forearm exercises' },
    { id: 'legs', name: 'Legs', description: 'Leg and glute exercises' },
    { id: 'core', name: 'Core', description: 'Abdominal and core exercises' },
    { id: 'cardio', name: 'Cardio', description: 'Cardiovascular exercises' },
    { id: 'full_body', name: 'Full Body', description: 'Full body compound exercises' }
  ];

  res.json(categories);
});

// Get muscle groups
router.get('/meta/muscles', (req, res) => {
  const muscles = [
    'pectorals', 'latissimus_dorsi', 'rhomboids', 'middle_trapezius',
    'deltoids', 'rotator_cuff', 'biceps', 'triceps', 'forearms',
    'quadriceps', 'hamstrings', 'glutes', 'calves', 'abs', 'obliques', 'lower_back'
  ];

  res.json(muscles);
});

module.exports = router;