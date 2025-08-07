const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Achievement = sequelize.define('Achievement', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('workout', 'streak', 'milestone', 'social', 'special'),
      allowNull: false
    },
    rarity: {
      type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
      defaultValue: 'common'
    },
    criteria: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'JSON object defining achievement criteria'
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });

  return Achievement;
};