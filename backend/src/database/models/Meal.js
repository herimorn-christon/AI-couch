const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Meal = sequelize.define('Meal', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nutritionLogId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'NutritionLogs',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('breakfast', 'lunch', 'dinner', 'snack'),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    calories: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    protein: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0
    },
    carbs: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0
    },
    fat: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0
    },
    fiber: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0
    },
    loggedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  return Meal;
};