const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NutritionLog = sequelize.define('NutritionLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    totalCalories: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalProtein: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0
    },
    totalCarbs: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0
    },
    totalFat: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0
    },
    totalFiber: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0
    },
    waterIntake: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Water intake in ml'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  return NutritionLog;
};