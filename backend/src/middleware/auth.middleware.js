const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Access token is missing' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Invalid or expired token' 
      });
    }

    // Get user from database
    const user = db.prepare(`
      SELECT id, username, email, display_name, profile_picture 
      FROM users 
      WHERE id = ?
    `).get(decoded.userId);

    if (!user) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'User not found' 
      });
    }

    req.user = user;
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (!err) {
      const user = db.prepare(`
        SELECT id, username, email, display_name, profile_picture 
        FROM users 
        WHERE id = ?
      `).get(decoded.userId);
      
      if (user) {
        req.user = user;
      }
    }
    next();
  });
};

module.exports = {
  authenticateToken,
  optionalAuth
}; 