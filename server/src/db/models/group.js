'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    static associate(models) {
      Group.belongsToMany(models.User, { 
        through: 'GroupMembers',
        as: 'members',
        foreignKey: 'groupId'
      });
      Group.hasMany(models.Message, { 
        foreignKey: 'groupId',
        as: 'messages'
      });
      Group.belongsTo(models.User, { 
        foreignKey: 'adminId',
        as: 'admin'
      });
    }
  }
  
  Group.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    groupPicture: {
      type: DataTypes.STRING,
      allowNull: true
    },
    adminId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Group',
  });
  
  return Group;
};