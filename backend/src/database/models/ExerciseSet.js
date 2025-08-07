const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExerciseSet = sequelize.define('ExerciseSet', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    workoutExerciseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'WorkoutExercises',
        key: 'id'
      }
    },
    setNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('reps', 'time', 'distance'),
      allowNull: false,
      defaultValue: 'reps'
    },
    targetReps: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    actualReps: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    targetWeight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    actualWeight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    targetDuration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    actualDuration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    targetDistance: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    actualDistance: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    restTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60
    },
    formScore: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  return ExerciseSet;
};