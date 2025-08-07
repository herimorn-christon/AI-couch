const { Sequelize } = require('sequelize');
const config = require('../config');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Import models
const User = require('./User')(sequelize);
const Workout = require('./Workout')(sequelize);
const Exercise = require('./Exercise')(sequelize);
const WorkoutExercise = require('./WorkoutExercise')(sequelize);
const ExerciseSet = require('./ExerciseSet')(sequelize);
const NutritionLog = require('./NutritionLog')(sequelize);
const Meal = require('./Meal')(sequelize);
const Food = require('./Food')(sequelize);
const Subscription = require('./Subscription')(sequelize);
const Trainer = require('./Trainer')(sequelize);
const Achievement = require('./Achievement')(sequelize);
const UserAchievement = require('./UserAchievement')(sequelize);
const FormAnalysis = require('./FormAnalysis')(sequelize);
const WorkoutSession = require('./WorkoutSession')(sequelize);

// Define associations
User.hasMany(Workout, { foreignKey: 'userId', as: 'workouts' });
Workout.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(NutritionLog, { foreignKey: 'userId', as: 'nutritionLogs' });
NutritionLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Subscription, { foreignKey: 'userId', as: 'subscription' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Trainer, { foreignKey: 'userId', as: 'trainer' });
Trainer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Workout.belongsToMany(Exercise, { 
  through: WorkoutExercise, 
  foreignKey: 'workoutId',
  otherKey: 'exerciseId',
  as: 'exercises'
});

Exercise.belongsToMany(Workout, { 
  through: WorkoutExercise, 
  foreignKey: 'exerciseId',
  otherKey: 'workoutId',
  as: 'workouts'
});

WorkoutExercise.hasMany(ExerciseSet, { foreignKey: 'workoutExerciseId', as: 'sets' });
ExerciseSet.belongsTo(WorkoutExercise, { foreignKey: 'workoutExerciseId', as: 'workoutExercise' });

NutritionLog.hasMany(Meal, { foreignKey: 'nutritionLogId', as: 'meals' });
Meal.belongsTo(NutritionLog, { foreignKey: 'nutritionLogId', as: 'nutritionLog' });

Meal.hasMany(Food, { foreignKey: 'mealId', as: 'foods' });
Food.belongsTo(Meal, { foreignKey: 'mealId', as: 'meal' });

User.belongsToMany(Achievement, { 
  through: UserAchievement, 
  foreignKey: 'userId',
  otherKey: 'achievementId',
  as: 'achievements'
});

Achievement.belongsToMany(User, { 
  through: UserAchievement, 
  foreignKey: 'achievementId',
  otherKey: 'userId',
  as: 'users'
});

User.hasMany(FormAnalysis, { foreignKey: 'userId', as: 'formAnalyses' });
FormAnalysis.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Exercise.hasMany(FormAnalysis, { foreignKey: 'exerciseId', as: 'formAnalyses' });
FormAnalysis.belongsTo(Exercise, { foreignKey: 'exerciseId', as: 'exercise' });

User.hasMany(WorkoutSession, { foreignKey: 'userId', as: 'workoutSessions' });
WorkoutSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Workout.hasMany(WorkoutSession, { foreignKey: 'workoutId', as: 'sessions' });
WorkoutSession.belongsTo(Workout, { foreignKey: 'workoutId', as: 'workout' });

module.exports = {
  sequelize,
  User,
  Workout,
  Exercise,
  WorkoutExercise,
  ExerciseSet,
  NutritionLog,
  Meal,
  Food,
  Subscription,
  Trainer,
  Achievement,
  UserAchievement,
  FormAnalysis,
  WorkoutSession
};