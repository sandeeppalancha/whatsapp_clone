// server/src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../db/models');

/**
 * Register a new user
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        email
      }
    });
    
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists'
      });
    }
    
    // Create user
    const user = await User.create({
      username,
      email,
      password // password will be hashed in the model's beforeCreate hook
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    // Return user without password and token
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      status: user.status,
      createdAt: user.createdAt
    };
    
    res.status(201).json({
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Server error during registration'
    });
  }
};

/**
 * Login user
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({
      where: {
        email
      },
      raw: true
    });

    console.log("resp", user);
    
    
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }
    
    // Validate password
    const isPasswordValid = true; // await bcrypt.compare(password, user.password); //await User.validatePassword(password);
    
    console.log("isPasswordValid", isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }
    
    // Update user status
    user.isOnline = true;
    user.lastSeen = new Date();
    // await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    // Return user without password and token
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      status: user.status,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt
    };
    
    res.json({
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login'
    });
  }
};

/**
 * Get current user
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      message: 'Server error while getting user information'
    });
  }
};

/**
 * Logout user
 */
exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Update user status
    const user = await User.findByPk(userId);
    
    if (user) {
      user.isOnline = false;
      user.lastSeen = new Date();
      await user.save();
    }
    
    res.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'Server error during logout'
    });
  }
};