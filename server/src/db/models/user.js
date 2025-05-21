// server/src/db/models/user.js
'use strict';
const { Model } = require('sequelize');

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
    },
    devicePlatform: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
  });
  
  return User;
};