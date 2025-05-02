// server/src/db/models/groupMessageRead.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GroupMessageRead extends Model {
    static associate(models) {
      // Define associations if needed
      GroupMessageRead.belongsTo(models.User, {
        foreignKey: 'userId'
      });
      
      GroupMessageRead.belongsTo(models.Group, {
        foreignKey: 'groupId'
      });
    }
  }
  
  GroupMessageRead.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      primaryKey: true
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Groups',
        key: 'id'
      },
      primaryKey: true
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'GroupMessageRead',
    tableName: 'GroupMessageReads'
  });
  
  return GroupMessageRead;
};