const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FormAnalysis = sequelize.define('FormAnalysis', {
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
    exerciseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Exercises',
        key: 'id'
      }
    },
    workoutSessionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'WorkoutSessions',
        key: 'id'
      }
    },
    setNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    overallScore: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    feedback: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Detailed feedback for each form checkpoint'
    },
    improvements: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: []
    },
    riskLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false
    },
    repCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    videoPath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    analysisData: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Raw analysis data from AI service'
    },
    processingTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time taken to process in milliseconds'
    }
  });

  return FormAnalysis;
};