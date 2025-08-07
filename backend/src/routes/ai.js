const express = require('express');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { User, Workout, Exercise, FormAnalysis } = require('../database/models');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/videos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Generate AI Workout
router.post('/generate-workout', auth, [
  body('preferences').isObject(),
  body('duration').optional().isInt({ min: 10, max: 180 }),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('equipment').optional().isArray()
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

    // Check if user has AI coaching feature
    const hasAIFeature = ['premium', 'elite'].includes(user.role);
    if (!hasAIFeature) {
      return res.status(403).json({ message: 'AI coaching requires premium subscription' });
    }

    const { preferences, duration = 45, difficulty, equipment = [] } = req.body;

    // Call Python AI service
    const aiResponse = await axios.post(`${process.env.PYTHON_AI_SERVICE_URL}/generate-workout`, {
      user_preferences: {
        ...user.preferences,
        ...preferences
      },
      duration,
      difficulty: difficulty || user.preferences.goals.experienceLevel,
      equipment,
      user_history: await getUserWorkoutHistory(req.userId)
    });

    const workoutData = aiResponse.data;

    // Create workout in database
    const workout = await Workout.create({
      userId: req.userId,
      name: workoutData.name,
      description: workoutData.description,
      duration: workoutData.duration,
      difficulty: workoutData.difficulty,
      category: workoutData.category,
      aiCoachingNotes: workoutData.coaching_notes,
      createdBy: 'ai',
      calories: workoutData.estimated_calories,
      targetMuscles: workoutData.target_muscles,
      equipment: workoutData.equipment
    });

    // Add exercises to workout
    for (const exerciseData of workoutData.exercises) {
      let exercise = await Exercise.findOne({ where: { name: exerciseData.name } });
      
      if (!exercise) {
        exercise = await Exercise.create({
          name: exerciseData.name,
          category: exerciseData.category,
          targetMuscles: exerciseData.target_muscles,
          instructions: exerciseData.instructions,
          tips: exerciseData.tips,
          difficulty: exerciseData.difficulty,
          equipment: exerciseData.equipment,
          formCheckpoints: exerciseData.form_checkpoints
        });
      }

      await workout.addExercise(exercise, {
        through: {
          sets: exerciseData.sets,
          restTime: exerciseData.rest_time,
          order: exerciseData.order
        }
      });
    }

    // Fetch complete workout with exercises
    const completeWorkout = await Workout.findByPk(workout.id, {
      include: ['exercises']
    });

    logger.info(`AI workout generated for user ${req.userId}`);

    res.json({
      message: 'AI workout generated successfully',
      workout: completeWorkout
    });
  } catch (error) {
    logger.error('AI workout generation error:', error);
    if (error.response?.status === 503) {
      return res.status(503).json({ message: 'AI service temporarily unavailable' });
    }
    res.status(500).json({ message: 'Failed to generate AI workout' });
  }
});

// Analyze Exercise Form
router.post('/analyze-form', auth, upload.single('video'), [
  body('exerciseId').isUUID(),
  body('setNumber').isInt({ min: 1 })
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

    // Check if user has form analysis feature
    const hasFormAnalysis = ['premium', 'elite'].includes(user.role);
    if (!hasFormAnalysis) {
      return res.status(403).json({ message: 'Form analysis requires premium subscription' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Video file is required' });
    }

    const { exerciseId, setNumber } = req.body;

    const exercise = await Exercise.findByPk(exerciseId);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    // Call Python AI service for form analysis
    const formData = new FormData();
    formData.append('video', req.file.buffer, req.file.originalname);
    formData.append('exercise_name', exercise.name);
    formData.append('form_checkpoints', JSON.stringify(exercise.formCheckpoints));

    const aiResponse = await axios.post(
      `${process.env.PYTHON_AI_SERVICE_URL}/analyze-form`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    const analysisData = aiResponse.data;

    // Save form analysis to database
    const formAnalysis = await FormAnalysis.create({
      userId: req.userId,
      exerciseId,
      setNumber,
      overallScore: analysisData.overall_score,
      feedback: analysisData.feedback,
      improvements: analysisData.improvements,
      riskLevel: analysisData.risk_level,
      videoPath: req.file.path,
      analysisData: analysisData
    });

    logger.info(`Form analysis completed for user ${req.userId}, exercise ${exerciseId}`);

    res.json({
      message: 'Form analysis completed',
      analysis: {
        overallScore: formAnalysis.overallScore,
        feedback: formAnalysis.feedback,
        improvements: formAnalysis.improvements,
        riskLevel: formAnalysis.riskLevel
      }
    });
  } catch (error) {
    logger.error('Form analysis error:', error);
    if (error.response?.status === 503) {
      return res.status(503).json({ message: 'AI service temporarily unavailable' });
    }
    res.status(500).json({ message: 'Failed to analyze form' });
  }
});

// Get AI Coaching Feedback
router.post('/coaching-feedback', auth, [
  body('workoutId').isUUID(),
  body('performance').isObject()
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

    const hasAIFeature = ['premium', 'elite'].includes(user.role);
    if (!hasAIFeature) {
      return res.status(403).json({ message: 'AI coaching requires premium subscription' });
    }

    const { workoutId, performance } = req.body;

    const workout = await Workout.findByPk(workoutId, {
      include: ['exercises']
    });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    // Call Python AI service for coaching feedback
    const aiResponse = await axios.post(`${process.env.PYTHON_AI_SERVICE_URL}/coaching-feedback`, {
      workout: workout.toJSON(),
      performance,
      user_stats: user.stats,
      user_goals: user.preferences.goals
    });

    const feedback = aiResponse.data;

    logger.info(`AI coaching feedback generated for user ${req.userId}`);

    res.json({
      message: 'Coaching feedback generated',
      feedback: feedback.feedback,
      recommendations: feedback.recommendations,
      nextWorkoutSuggestions: feedback.next_workout_suggestions
    });
  } catch (error) {
    logger.error('AI coaching feedback error:', error);
    res.status(500).json({ message: 'Failed to generate coaching feedback' });
  }
});

// Predict Progress
router.get('/predict-progress', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hasAIFeature = ['premium', 'elite'].includes(user.role);
    if (!hasAIFeature) {
      return res.status(403).json({ message: 'Progress prediction requires premium subscription' });
    }

    const workoutHistory = await getUserWorkoutHistory(req.userId);

    // Call Python AI service for progress prediction
    const aiResponse = await axios.post(`${process.env.PYTHON_AI_SERVICE_URL}/predict-progress`, {
      user_stats: user.stats,
      user_goals: user.preferences.goals,
      workout_history: workoutHistory
    });

    const prediction = aiResponse.data;

    logger.info(`Progress prediction generated for user ${req.userId}`);

    res.json({
      message: 'Progress prediction generated',
      prediction
    });
  } catch (error) {
    logger.error('Progress prediction error:', error);
    res.status(500).json({ message: 'Failed to predict progress' });
  }
});

// Helper function to get user workout history
async function getUserWorkoutHistory(userId) {
  const workouts = await Workout.findAll({
    where: { 
      userId,
      completedAt: { [require('sequelize').Op.not]: null }
    },
    include: ['exercises'],
    order: [['completedAt', 'DESC']],
    limit: 50
  });

  return workouts.map(workout => workout.toJSON());
}

module.exports = router;