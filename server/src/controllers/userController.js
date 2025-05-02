// server/src/controllers/userController.js
const { User } = require('../db/models');
const { Op } = require('sequelize');

/**
 * Get user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Server error while getting user profile'
    });
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, status, profilePicture } = req.body;
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    // Update fields
    if (username) user.username = username;
    if (status) user.status = status;
    if (profilePicture) user.profilePicture = profilePicture;
    
    await user.save();
    
    // Return updated user without password
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      status: user.status,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.json(userResponse);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Server error while updating user profile'
    });
  }
};

/**
 * Store push notification token
 */
exports.storePushToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        message: 'Token is required'
      });
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    // Store token in user model or a separate table
    // This is just a basic implementation
    user.pushToken = token;
    await user.save();
    
    res.json({
      message: 'Push token stored successfully'
    });
  } catch (error) {
    console.error('Store push token error:', error);
    res.status(500).json({
      message: 'Server error while storing push token'
    });
  }
};

/**
 * Search users
 */
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;
    
    if (!query) {
      return res.status(400).json({
        message: 'Search query is required'
      });
    }
    
    const users = await User.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              {
                username: {
                  [Op.iLike]: `%${query}%`
                }
              },
              {
                email: {
                  [Op.iLike]: `%${query}%`
                }
              }
            ]
          },
          {
            id: {
              [Op.ne]: userId // Exclude current user
            }
          }
        ]
      },
      attributes: ['id', 'username', 'email', 'profilePicture', 'status', 'isOnline', 'lastSeen']
    });
    
    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      message: 'Server error while searching users'
    });
  }
};