const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Trainer = sequelize.define('Trainer', {
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
    bio: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    specialties: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: []
    },
    certifications: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    experience: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    hourlyRate: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5
      }
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    applicationStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    availability: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    responseTime: {
      type: DataTypes.STRING,
      defaultValue: '24 hours'
    },
    clientCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalEarnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    commissionRate: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.20 // 20% commission
    },
    profileImageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    coverImageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    socialLinks: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    languages: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ['English']
    },
    timezone: {
      type: DataTypes.STRING,
      defaultValue: 'UTC'
    }
  });

  return Trainer;
};