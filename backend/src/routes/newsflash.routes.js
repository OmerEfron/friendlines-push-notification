const express = require('express');
const { body, param, query } = require('express-validator');
const newsflashController = require('../controllers/newsflash.controller');
const { authenticateToken, optionalAuth } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { upload, processImage, cleanupFile } = require('../middleware/upload.middleware');

const router = express.Router();

// GET /api/v1/newsflashes/feed
router.get('/feed', optionalAuth, newsflashController.getFeed.bind(newsflashController));

// GET /api/v1/newsflashes/:id
router.get('/:id',
  optionalAuth,
  param('id').isInt().withMessage('Invalid newsflash ID'),
  handleValidationErrors,
  newsflashController.getNewsflash.bind(newsflashController)
);

// POST /api/v1/newsflashes
router.post('/',
  authenticateToken,
  upload.single('image'),
  processImage({ width: 1200, height: 800, folder: 'newsflash' }),
  cleanupFile,
  [
    body('content')
      .trim()
      .isLength({ min: 10, max: 180 })
      .withMessage('Content must be between 10 and 180 characters'),
    body('sections')
      .optional()
      .isArray()
      .withMessage('Sections must be an array'),
    body('recipients')
      .optional()
      .isArray()
      .withMessage('Recipients must be an array'),
    body('groups')
      .optional()
      .isArray()
      .withMessage('Groups must be an array')
  ],
  handleValidationErrors,
  newsflashController.createNewsflash.bind(newsflashController)
);

// PUT /api/v1/newsflashes/:id  
router.put('/:id',
  authenticateToken,
  upload.single('image'),
  processImage({ width: 1200, height: 800, folder: 'newsflash' }),
  cleanupFile,
  [
    param('id').isInt().withMessage('Invalid newsflash ID'),
    body('content')
      .optional()
      .trim()
      .isLength({ min: 10, max: 180 })
      .withMessage('Content must be between 10 and 180 characters')
  ],
  handleValidationErrors,
  newsflashController.updateNewsflash.bind(newsflashController)
);

// DELETE /api/v1/newsflashes/:id
router.delete('/:id',
  authenticateToken,
  param('id').isInt().withMessage('Invalid newsflash ID'),
  handleValidationErrors,
  newsflashController.deleteNewsflash.bind(newsflashController)
);

// POST /api/v1/newsflashes/:id/like
router.post('/:id/like',
  authenticateToken,
  param('id').isInt().withMessage('Invalid newsflash ID'),
  handleValidationErrors,
  async (req, res) => {
    const newsflashId = req.params.id;
    const newsflashController = require('../controllers/newsflash.controller');

    try {
      // Check if already liked
      const { db } = require('../config/database');
      const existingLike = db.prepare(`
        SELECT 1 FROM likes WHERE newsflash_id = ? AND user_id = ?
      `).get(newsflashId, req.user.id);

      if (existingLike) {
        return newsflashController.unlikeNewsflash(req, res);
      } else {
        return newsflashController.likeNewsflash(req, res);
      }
    } catch (error) {
      console.error('Like error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process like'
      });
    }
  }
);

// POST /api/v1/newsflashes/:id/comment
router.post('/:id/comment',
  authenticateToken,
  [
    param('id').isInt().withMessage('Invalid newsflash ID'),
    body('content')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Comment must be between 1 and 500 characters')
  ],
  handleValidationErrors,
  newsflashController.commentOnNewsflash.bind(newsflashController)
);

// GET /api/v1/newsflashes/user/:userId
router.get('/user/:userId',
  optionalAuth,
  [
    param('userId').isInt().withMessage('Invalid user ID'),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  (req, res) => {
    const targetUserId = req.params.userId;
    const currentUserId = req.user?.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    try {
      const newsflashes = db.prepare(`
        SELECT 
          n.id,
          n.content,
          n.image,
          n.created_at,
          u.id as author_id,
          u.username as author_username,
          u.display_name as author_display_name,
          u.profile_picture as author_profile_picture,
          GROUP_CONCAT(DISTINCT s.name) as sections,
          COUNT(DISTINCT l.user_id) as like_count,
          COUNT(DISTINCT c.id) as comment_count,
          CASE WHEN ul.user_id IS NOT NULL THEN 1 ELSE 0 END as is_liked
        FROM newsflashes n
        INNER JOIN users u ON n.author_id = u.id
        LEFT JOIN newsflash_sections ns ON n.id = ns.newsflash_id
        LEFT JOIN sections s ON ns.section_id = s.id
        LEFT JOIN likes l ON n.id = l.newsflash_id
        LEFT JOIN comments c ON n.id = c.newsflash_id
        LEFT JOIN likes ul ON n.id = ul.newsflash_id AND ul.user_id = ?
        WHERE n.author_id = ?
        GROUP BY n.id
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
      `).all(currentUserId || 0, targetUserId, limit, offset);

      // Parse sections
      newsflashes.forEach(newsflash => {
        newsflash.sections = newsflash.sections ? newsflash.sections.split(',') : [];
        newsflash.is_liked = Boolean(newsflash.is_liked);
      });

      res.json({ newsflashes });
    } catch (error) {
      console.error('User newsflashes error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch user newsflashes'
      });
    }
  }
);

module.exports = router; 