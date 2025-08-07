const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { User, Workout, Exercise, WorkoutExercise, ExerciseSet, WorkoutSession } = require('../database/models');
const logger = require('../utils/logger');

const router = express.Router();

// Get user's workouts
router.get('/', auth, async (req, res) => {
  try {
    const { category, difficulty, page = 1, limit = 20 } = req.query;
    const where = { userId: req.userId };
    
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const workouts = await Workout.findAndCountAll({
      where,
      include: [{
        model: Exercise,
        as: 'exercises',
        through: { attributes: ['sets', 'reps', 'weight', 'restTime'] }
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      workouts: workouts.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: workouts.count,
        pages: Math.ceil(workouts.count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get workouts error:', error);
    res.status(500).json({ message: 'Failed to fetch workouts' });
  }
});

// Get workout by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const workout = await Workout.findOne({
      where: { id: req.params.id },
      include: [{
        model: Exercise,
        as: 'exercises',
        through: { 
          attributes: ['sets', 'reps', 'weight', 'restTime', 'order'],
          as: 'workoutExercise'
        }
      }]
    });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    // Check if user has access to this workout
    if (workout.userId !== req.userId && !workout.isPublic) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(workout);
  } catch (error) {
    logger.error('Get workout error:', error);
    res.status(500).json({ message: 'Failed to fetch workout' });
  }
});

// Create workout
router.post('/', auth, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive number'),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty'),
  body('category').isIn(['strength', 'cardio', 'flexibility', 'sports', 'rehabilitation', 'yoga', 'pilates', 'hiit', 'functional']).withMessage('Invalid category'),
  body('exercises').isArray({ min: 1 }).withMessage('At least one exercise is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      duration,
      difficulty,
      category,
      exercises,
      isPublic = false
    } = req.body;

    // Create workout
    const workout = await Workout.create({
      userId: req.userId,
      name,
      description,
      duration,
      difficulty,
      category,
      isPublic,
      createdBy: 'user'
    });

    // Add exercises to workout
    for (let i = 0; i < exercises.length; i++) {
      const exerciseData = exercises[i];
      
      // Find or create exercise
      let exercise = await Exercise.findByPk(exerciseData.exerciseId);
      if (!exercise) {
        return res.status(400).json({ message: `Exercise not found: ${exerciseData.exerciseId}` });
      }

      // Create workout-exercise relationship
      await WorkoutExercise.create({
        workoutId: workout.id,
        exerciseId: exercise.id,
        order: i + 1,
        sets: exerciseData.sets || 3,
        reps: exerciseData.reps,
        weight: exerciseData.weight,
        duration: exerciseData.duration,
        restTime: exerciseData.restTime || 60
      });
    }

    // Fetch complete workout with exercises
    const completeWorkout = await Workout.findByPk(workout.id, {
      include: [{
        model: Exercise,
        as: 'exercises',
        through: { attributes: ['sets', 'reps', 'weight', 'restTime', 'order'] }
      }]
    });

    logger.info(`Workout created: ${workout.id} by user ${req.userId}`);

    res.status(201).json({
      message: 'Workout created successfully',
      workout: completeWorkout
    });
  } catch (error) {
    logger.error('Create workout error:', error);
    res.status(500).json({ message: 'Failed to create workout' });
  }
});

// Start workout session
router.post('/:id/start', auth, async (req, res) => {
  try {
    const workout = await Workout.findByPk(req.params.id);
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    // Check if user has access
    if (workout.userId !== req.userId && !workout.isPublic) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create workout session
    const session = await WorkoutSession.create({
      userId: req.userId,
      workoutId: workout.id,
      status: 'in_progress'
    });

    logger.info(`Workout session started: ${session.id}`);

    res.status(201).json({
      message: 'Workout session started',
      session
    });
  } catch (error) {
    logger.error('Start workout session error:', error);
    res.status(500).json({ message: 'Failed to start workout session' });
  }
});

// Complete workout session
router.post('/sessions/:sessionId/complete', auth, [
  body('duration').isInt({ min: 1 }).withMessage('Duration is required'),
  body('caloriesBurned').optional().isInt({ min: 0 }),
  body('rating').optional().isFloat({ min: 1, max: 5 }),
  body('notes').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const session = await WorkoutSession.findOne({
      where: { id: req.params.sessionId, userId: req.userId }
    });

    if (!session) {
      return res.status(404).json({ message: 'Workout session not found' });
    }

    const { duration, caloriesBurned, rating, notes, performance } = req.body;

    await session.update({
      status: 'completed',
      completedAt: new Date(),
      duration,
      caloriesBurned,
      rating,
      notes,
      performance: performance || {}
    });

    // Update workout completion
    await Workout.update(
      { completedAt: new Date() },
      { where: { id: session.workoutId } }
    );

    logger.info(`Workout session completed: ${session.id}`);

    res.json({
      message: 'Workout session completed',
      session
    });
  } catch (error) {
    logger.error('Complete workout session error:', error);
    res.status(500).json({ message: 'Failed to complete workout session' });
  }
});

// Get workout history
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const sessions = await WorkoutSession.findAndCountAll({
      where: { 
        userId: req.userId,
        status: 'completed'
      },
      include: [{
        model: Workout,
        as: 'workout',
        attributes: ['name', 'category', 'difficulty', 'duration']
      }],
      order: [['completedAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      sessions: sessions.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: sessions.count,
        pages: Math.ceil(sessions.count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get workout history error:', error);
    res.status(500).json({ message: 'Failed to fetch workout history' });
  }
});

module.exports = router;