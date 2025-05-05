// server/src/db/models/attachment.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Attachment extends Model {
    static associate(models) {
      Attachment.belongsTo(models.Message, {
        foreignKey: 'messageId',
        as: 'message'
      });
    }
  }
  
  Attachment.init({
    messageId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null during initial upload
      references: {
        model: 'Messages',
        key: 'id'
      }
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileCategory: {
      type: DataTypes.STRING, // image, video, audio, document, etc.
      allowNull: false
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileHash: {
      type: DataTypes.STRING,
      allowNull: true
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Attachment',
  });
  
  return Attachment;
};