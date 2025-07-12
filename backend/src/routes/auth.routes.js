const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { db } = require('../config/database');
const { handleValidationErrors } = require('../middleware/validation.middleware');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Display name cannot exceed 50 characters')
];

const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Helper function to generate JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// POST /api/v1/auth/register
router.post('/register', registerValidation, handleValidationErrors, async (req, res) => {
  const { username, email, password, displayName } = req.body;

  try {
    // Check if user already exists
    const existingUser = db.prepare(`
      SELECT id FROM users WHERE username = ? OR email = ?
    `).get(username, email);

    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = db.prepare(`
      INSERT INTO users (username, email, password, display_name)
      VALUES (?, ?, ?, ?)
    `).run(username, email, hashedPassword, displayName || username);

    // Generate token
    const token = generateToken(result.lastInsertRowid);

    // Get created user
    const user = db.prepare(`
      SELECT id, username, email, display_name, profile_picture, created_at
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register user'
    });
  }
});

// POST /api/v1/auth/login
router.post('/login', loginValidation, handleValidationErrors, async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username or email
    const user = db.prepare(`
      SELECT id, username, email, password, display_name, profile_picture, created_at
      FROM users WHERE username = ? OR email = ?
    `).get(username, username);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Remove password from response
    delete user.password;

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to login'
    });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  // Since we're using stateless JWT, logout is handled client-side
  res.json({
    message: 'Logout successful'
  });
});

module.exports = router; 