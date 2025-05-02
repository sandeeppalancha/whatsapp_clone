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
      allowNull: false,
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
    }
  }, {
    sequelize,
    modelName: 'Attachment',
  });
  
  return Attachment;
};