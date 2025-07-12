const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

class AuthController {
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  }

  async register(req, res) {
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
      const token = this.generateToken(result.lastInsertRowid);

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
  }

  async login(req, res) {
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
      const token = this.generateToken(user.id);

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
  }

  async logout(req, res) {
    // Since we're using stateless JWT, logout is handled client-side
    res.json({
      message: 'Logout successful'
    });
  }
}

module.exports = new AuthController(); 