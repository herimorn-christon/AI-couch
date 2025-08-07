const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100]
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('free', 'premium', 'elite', 'trainer', 'admin'),
      defaultValue: 'free'
    },
    subscriptionStatus: {
      type: DataTypes.ENUM('active', 'inactive', 'canceled'),
      defaultValue: 'inactive'
    },
    subscriptionTier: {
      type: DataTypes.ENUM('premium', 'elite'),
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        units: 'metric',
        notifications: true,
        voiceCoaching: true,
        formAnalysis: true,
        goals: {
          primaryGoal: 'general_fitness',
          weeklyWorkouts: 3,
          experienceLevel: 'beginner'
        }
      }
    },
    stats: {
      type: DataTypes.JSONB,
      defaultValue: {
        totalWorkouts: 0,
        totalMinutes: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageRating: 0
      }
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      }
    }
  });

  User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  return User;
};