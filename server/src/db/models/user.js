// server/src/db/models/user.js
'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Define associations
      User.hasMany(models.Message, { foreignKey: 'senderId', as: 'sentMessages' });
      User.belongsToMany(User, { 
        through: 'Contacts',
        as: 'contacts',
        foreignKey: 'userId',
        otherKey: 'contactId'
      });
      User.belongsToMany(models.Group, { 
        through: 'GroupMembers',
        as: 'groups',
        foreignKey: 'userId'
      });
    }

    // Method to compare password - IMPORTANT: This needs to be a regular function, not an arrow function
    async validatePassword(password) {
      return await bcrypt.compare(password, this.password);
    }
  }
  
  User.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
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
      allowNull: false
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Hey there! I am using Chat App'
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    pushToken: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });
  
  return User;
};