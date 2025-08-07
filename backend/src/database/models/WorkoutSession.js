const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WorkoutSession = sequelize.define('WorkoutSession', {
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
    workoutId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Workouts',
        key: 'id'
      }
    },
    startedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in seconds'
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed', 'paused', 'abandoned'),
      defaultValue: 'in_progress'
    },
    caloriesBurned: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    averageHeartRate: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    maxHeartRate: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    performance: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Performance metrics and statistics'
    }
  });

  return WorkoutSession;
};