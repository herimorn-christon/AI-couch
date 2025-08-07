const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    tier: {
      type: DataTypes.ENUM('premium', 'elite'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'canceled', 'past_due', 'trialing'),
      allowNull: false,
      defaultValue: 'active'
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    stripeSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    currentPeriodStart: {
      type: DataTypes.DATE,
      allowNull: false
    },
    currentPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: false
    },
    cancelAtPeriodEnd: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    trialEnd: {
      type: DataTypes.DATE,
      allowNull: true
    },
    features: {
      type: DataTypes.JSONB,
      defaultValue: {
        ai_coaching: true,
        form_analysis: true,
        nutrition_ai: false,
        personal_trainer: false,
        advanced_analytics: true,
        custom_workouts: true
      }
    },
    price: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    }
  });

  return Subscription;
};