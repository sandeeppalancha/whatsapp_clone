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
      allowNull: true, // Allow null for files not yet associated with messages
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
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileKey: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'S3 key for file deletion'
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    isTemporary: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Attachment',
  });
  
  return Attachment;
};