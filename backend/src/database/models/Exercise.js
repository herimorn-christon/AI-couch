const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Exercise = sequelize.define('Exercise', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100]
      }
    },
    category: {
      type: DataTypes.ENUM(
        'chest', 'back', 'shoulders', 'arms', 'legs', 
        'core', 'cardio', 'full_body'
      ),
      allowNull: false
    },
    targetMuscles: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false
    },
    instructions: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false
    },
    tips: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: []
    },
    videoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    equipment: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    difficulty: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: false
    },
    formCheckpoints: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    commonMistakes: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: []
    },
    variations: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    isCompound: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    caloriesPerMinute: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true
    }
  });

  return Exercise;
};