const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
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

// POST /api/v1/auth/register
router.post('/register', registerValidation, handleValidationErrors, authController.register.bind(authController));

// POST /api/v1/auth/login
router.post('/login', loginValidation, handleValidationErrors, authController.login.bind(authController));

// POST /api/v1/auth/logout
router.post('/logout', authController.logout.bind(authController));

module.exports = router; 