const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WorkoutExercise = sequelize.define('WorkoutExercise', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    workoutId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Workouts',
        key: 'id'
      }
    },
    exerciseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Exercises',
        key: 'id'
      }
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    sets: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3
    },
    reps: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    distance: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    restTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  return WorkoutExercise;
};