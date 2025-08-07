const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { NutritionLog, Meal, Food } = require('../database/models');
const logger = require('../utils/logger');

const router = express.Router();

// Get nutrition log for a specific date
router.get('/log/:date', auth, async (req, res) => {
  try {
    const { date } = req.params;
    
    const nutritionLog = await NutritionLog.findOne({
      where: { 
        userId: req.userId, 
        date 
      },
      include: [{
        model: Meal,
        as: 'meals',
        include: [{
          model: Food,
          as: 'foods'
        }]
      }]
    });

    if (!nutritionLog) {
      // Create empty log for the date
      const newLog = await NutritionLog.create({
        userId: req.userId,
        date
      });
      
      return res.json({ nutritionLog: newLog, meals: [] });
    }

    res.json({ nutritionLog, meals: nutritionLog.meals });
  } catch (error) {
    logger.error('Get nutrition log error:', error);
    res.status(500).json({ message: 'Failed to fetch nutrition log' });
  }
});

// Add meal to nutrition log
router.post('/meals', auth, [
  body('date').isDate().withMessage('Valid date is required'),
  body('type').isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('foods').isArray({ min: 1 }).withMessage('At least one food item is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, type, name, foods } = req.body;

    // Find or create nutrition log for the date
    let nutritionLog = await NutritionLog.findOne({
      where: { userId: req.userId, date }
    });

    if (!nutritionLog) {
      nutritionLog = await NutritionLog.create({
        userId: req.userId,
        date
      });
    }

    // Calculate meal totals
    let mealCalories = 0;
    let mealProtein = 0;
    let mealCarbs = 0;
    let mealFat = 0;
    let mealFiber = 0;

    foods.forEach(food => {
      mealCalories += food.calories || 0;
      mealProtein += food.protein || 0;
      mealCarbs += food.carbs || 0;
      mealFat += food.fat || 0;
      mealFiber += food.fiber || 0;
    });

    // Create meal
    const meal = await Meal.create({
      nutritionLogId: nutritionLog.id,
      type,
      name,
      calories: mealCalories,
      protein: mealProtein,
      carbs: mealCarbs,
      fat: mealFat,
      fiber: mealFiber
    });

    // Add foods to meal
    for (const foodData of foods) {
      await Food.create({
        mealId: meal.id,
        name: foodData.name,
        brand: foodData.brand,
        quantity: foodData.quantity,
        unit: foodData.unit || 'g',
        calories: foodData.calories,
        protein: foodData.protein || 0,
        carbs: foodData.carbs || 0,
        fat: foodData.fat || 0,
        fiber: foodData.fiber || 0,
        sugar: foodData.sugar || 0,
        sodium: foodData.sodium || 0,
        barcode: foodData.barcode,
        imageUrl: foodData.imageUrl
      });
    }

    // Update nutrition log totals
    await updateNutritionLogTotals(nutritionLog.id);

    // Fetch complete meal with foods
    const completeMeal = await Meal.findByPk(meal.id, {
      include: [{ model: Food, as: 'foods' }]
    });

    logger.info(`Meal added to nutrition log: ${meal.id}`);

    res.status(201).json({
      message: 'Meal added successfully',
      meal: completeMeal
    });
  } catch (error) {
    logger.error('Add meal error:', error);
    res.status(500).json({ message: 'Failed to add meal' });
  }
});

// Update water intake
router.put('/water/:date', auth, [
  body('waterIntake').isInt({ min: 0 }).withMessage('Water intake must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date } = req.params;
    const { waterIntake } = req.body;

    let nutritionLog = await NutritionLog.findOne({
      where: { userId: req.userId, date }
    });

    if (!nutritionLog) {
      nutritionLog = await NutritionLog.create({
        userId: req.userId,
        date,
        waterIntake
      });
    } else {
      await nutritionLog.update({ waterIntake });
    }

    res.json({
      message: 'Water intake updated',
      waterIntake: nutritionLog.waterIntake
    });
  } catch (error) {
    logger.error('Update water intake error:', error);
    res.status(500).json({ message: 'Failed to update water intake' });
  }
});

// Search food database
router.get('/foods/search', async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Mock food database search (replace with actual food API)
    const mockFoods = [
      {
        id: '1',
        name: 'Chicken Breast',
        brand: 'Generic',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
        servingSize: '100g'
      },
      {
        id: '2',
        name: 'Brown Rice',
        brand: 'Generic',
        calories: 111,
        protein: 2.6,
        carbs: 23,
        fat: 0.9,
        fiber: 1.8,
        servingSize: '100g'
      },
      {
        id: '3',
        name: 'Broccoli',
        brand: 'Generic',
        calories: 34,
        protein: 2.8,
        carbs: 7,
        fat: 0.4,
        fiber: 2.6,
        servingSize: '100g'
      }
    ];

    const filteredFoods = mockFoods.filter(food =>
      food.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, parseInt(limit));

    res.json(filteredFoods);
  } catch (error) {
    logger.error('Food search error:', error);
    res.status(500).json({ message: 'Failed to search foods' });
  }
});

// Get nutrition analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    const nutritionLogs = await NutritionLog.findAll({
      where: {
        userId: req.userId,
        date: {
          [require('sequelize').Op.between]: [
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          ]
        }
      },
      include: [{
        model: Meal,
        as: 'meals',
        include: [{ model: Food, as: 'foods' }]
      }],
      order: [['date', 'ASC']]
    });

    // Calculate analytics
    const analytics = {
      averageCalories: 0,
      averageProtein: 0,
      averageCarbs: 0,
      averageFat: 0,
      averageWater: 0,
      dailyBreakdown: [],
      macroDistribution: { protein: 0, carbs: 0, fat: 0 }
    };

    if (nutritionLogs.length > 0) {
      const totals = nutritionLogs.reduce((acc, log) => {
        acc.calories += log.totalCalories;
        acc.protein += parseFloat(log.totalProtein);
        acc.carbs += parseFloat(log.totalCarbs);
        acc.fat += parseFloat(log.totalFat);
        acc.water += log.waterIntake;
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 });

      analytics.averageCalories = Math.round(totals.calories / nutritionLogs.length);
      analytics.averageProtein = Math.round(totals.protein / nutritionLogs.length);
      analytics.averageCarbs = Math.round(totals.carbs / nutritionLogs.length);
      analytics.averageFat = Math.round(totals.fat / nutritionLogs.length);
      analytics.averageWater = Math.round(totals.water / nutritionLogs.length);

      // Calculate macro distribution
      const totalMacroCalories = (totals.protein * 4) + (totals.carbs * 4) + (totals.fat * 9);
      if (totalMacroCalories > 0) {
        analytics.macroDistribution = {
          protein: Math.round((totals.protein * 4 / totalMacroCalories) * 100),
          carbs: Math.round((totals.carbs * 4 / totalMacroCalories) * 100),
          fat: Math.round((totals.fat * 9 / totalMacroCalories) * 100)
        };
      }

      analytics.dailyBreakdown = nutritionLogs.map(log => ({
        date: log.date,
        calories: log.totalCalories,
        protein: parseFloat(log.totalProtein),
        carbs: parseFloat(log.totalCarbs),
        fat: parseFloat(log.totalFat),
        water: log.waterIntake
      }));
    }

    res.json(analytics);
  } catch (error) {
    logger.error('Nutrition analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch nutrition analytics' });
  }
});

// Helper function to update nutrition log totals
async function updateNutritionLogTotals(nutritionLogId) {
  const meals = await Meal.findAll({
    where: { nutritionLogId }
  });

  const totals = meals.reduce((acc, meal) => {
    acc.calories += meal.calories;
    acc.protein += parseFloat(meal.protein);
    acc.carbs += parseFloat(meal.carbs);
    acc.fat += parseFloat(meal.fat);
    acc.fiber += parseFloat(meal.fiber);
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  await NutritionLog.update(totals, {
    where: { id: nutritionLogId }
  });
}

module.exports = router;