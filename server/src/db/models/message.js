'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.User, { 
        foreignKey: 'senderId',
        as: 'sender'
      });
      Message.belongsTo(models.User, { 
        foreignKey: 'receiverId',
        as: 'receiver'
      });
      Message.belongsTo(models.Group, { 
        foreignKey: 'groupId',
        as: 'group'
      });
      Message.hasMany(models.Attachment, {
        foreignKey: 'messageId',
        as: 'attachments'
      });
    }
  }
  
  Message.init({
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Groups',
        key: 'id'
      }
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Message',
  });
  
  return Message;
};