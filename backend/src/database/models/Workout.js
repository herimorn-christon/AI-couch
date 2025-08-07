const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Workout = sequelize.define('Workout', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    difficulty: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM(
        'strength', 'cardio', 'flexibility', 'sports', 
        'rehabilitation', 'yoga', 'pilates', 'hiit', 'functional'
      ),
      allowNull: false
    },
    aiCoachingNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
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
    calories: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    createdBy: {
      type: DataTypes.ENUM('user', 'ai', 'trainer'),
      defaultValue: 'user'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    equipment: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    targetMuscles: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    isTemplate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    templateId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Workouts',
        key: 'id'
      }
    }
  });

  return Workout;
};