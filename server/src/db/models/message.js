// server/src/db/models/message.js - Updated
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      // Define associations
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
      
      // Self-association for replies
      Message.belongsTo(models.Message, {
        foreignKey: 'replyToId',
        as: 'replyTo'
      });
      
      Message.hasMany(models.Message, {
        foreignKey: 'replyToId',
        as: 'replies'
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
    replyToId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Messages',
        key: 'id'
      }
    },
    isForwarded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    originalSenderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'Original sender for forwarded messages'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isDelivered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'Messages',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  return Message;
};