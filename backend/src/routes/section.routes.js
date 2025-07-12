const express = require('express');
const { body } = require('express-validator');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

const router = express.Router();

// GET /api/v1/sections
router.get('/', (req, res) => {
  try {
    const sections = db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.description,
        s.created_at,
        COUNT(DISTINCT ns.newsflash_id) as newsflash_count
      FROM sections s
      LEFT JOIN newsflash_sections ns ON s.id = ns.section_id
      GROUP BY s.id
      ORDER BY s.name ASC
    `).all();

    res.json({ sections });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch sections'
    });
  }
});

// POST /api/v1/sections (Admin only - for now any authenticated user)
router.post('/',
  authenticateToken,
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage('Section name must be between 2 and 30 characters')
      .matches(/^[a-zA-Z0-9\s]+$/)
      .withMessage('Section name can only contain letters, numbers, and spaces'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Description cannot exceed 200 characters')
  ],
  handleValidationErrors,
  (req, res) => {
    const { name, description } = req.body;

    try {
      // Check if section already exists
      const existing = db.prepare(`
        SELECT id FROM sections WHERE LOWER(name) = LOWER(?)
      `).get(name);

      if (existing) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Section already exists'
        });
      }

      // Create section
      const result = db.prepare(`
        INSERT INTO sections (name, description)
        VALUES (?, ?)
      `).run(name, description);

      // Get created section
      const section = db.prepare(`
        SELECT id, name, description, created_at
        FROM sections WHERE id = ?
      `).get(result.lastInsertRowid);

      res.status(201).json({
        message: 'Section created successfully',
        section
      });
    } catch (error) {
      console.error('Create section error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create section'
      });
    }
  }
);

// GET /api/v1/sections/popular
router.get('/popular', (req, res) => {
  try {
    const sections = db.prepare(`
      SELECT 
        s.id,
        s.name,
        COUNT(ns.newsflash_id) as usage_count
      FROM sections s
      INNER JOIN newsflash_sections ns ON s.id = ns.section_id
      INNER JOIN newsflashes n ON ns.newsflash_id = n.id
      WHERE n.created_at > datetime('now', '-7 days')
      GROUP BY s.id
      ORDER BY usage_count DESC
      LIMIT 5
    `).all();

    res.json({ sections });
  } catch (error) {
    console.error('Get popular sections error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch popular sections'
    });
  }
});

module.exports = router; 