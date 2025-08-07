const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Food = sequelize.define('Food', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    mealId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Meals',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: true
    },
    quantity: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'g'
    },
    calories: {
      type: DataTypes.INTEGER,
      allowNull: false
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
    sugar: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0
    },
    sodium: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0
    },
    barcode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  return Food;
};