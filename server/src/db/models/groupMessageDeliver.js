'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GroupMessageDelivery extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations
      GroupMessageDelivery.belongsTo(models.Message, {
        foreignKey: 'messageId',
        as: 'message'
      });
      
      GroupMessageDelivery.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  GroupMessageDelivery.init({
    messageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Messages',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'GroupMessageDelivery',
    tableName: 'GroupMessageDeliveries',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['messageId', 'userId']
      }
    ]
  });

  return GroupMessageDelivery;
};