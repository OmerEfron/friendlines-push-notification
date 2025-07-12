const express = require('express');
const { body, param, query } = require('express-validator');
const { db } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { upload, processImage, cleanupFile } = require('../middleware/upload.middleware');
const NotificationService = require('../services/notification.service');

const router = express.Router();

// GET /api/v1/newsflashes/feed
router.get('/feed', optionalAuth, (req, res) => {
  const userId = req.user?.id;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const section = req.query.section;

  let query = `
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
  `;

  const params = [userId || 0];

  // Add section filter if provided
  if (section) {
    query += ` WHERE s.name = ?`;
    params.push(section);
  }

  // For authenticated users, show newsflashes from friends, groups, or direct recipients
  if (userId) {
    const whereClause = section ? ' AND' : ' WHERE';
    query += `${whereClause} (
      n.author_id = ? OR
      n.author_id IN (SELECT friend_id FROM friends WHERE user_id = ?) OR
      n.id IN (SELECT newsflash_id FROM newsflash_recipients WHERE user_id = ?) OR
      n.id IN (
        SELECT ng.newsflash_id 
        FROM newsflash_groups ng
        INNER JOIN group_members gm ON ng.group_id = gm.group_id
        WHERE gm.user_id = ?
      )
    )`;
    params.push(userId, userId, userId, userId);
  }

  query += `
    GROUP BY n.id
    ORDER BY n.created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  params.push(limit, offset);

  try {
    const newsflashes = db.prepare(query).all(...params);

    // Parse sections string into array
    newsflashes.forEach(newsflash => {
      newsflash.sections = newsflash.sections ? newsflash.sections.split(',') : [];
      newsflash.is_liked = Boolean(newsflash.is_liked);
    });

    res.json({ newsflashes });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch feed'
    });
  }
});

// GET /api/v1/newsflashes/:id
router.get('/:id',
  optionalAuth,
  param('id').isInt().withMessage('Invalid newsflash ID'),
  handleValidationErrors,
  (req, res) => {
    const newsflashId = req.params.id;
    const userId = req.user?.id;

    const newsflash = db.prepare(`
      SELECT 
        n.id,
        n.content,
        n.image,
        n.created_at,
        n.updated_at,
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
      WHERE n.id = ?
      GROUP BY n.id
    `).get(userId || 0, newsflashId);

    if (!newsflash) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Newsflash not found'
      });
    }

    // Parse sections
    newsflash.sections = newsflash.sections ? newsflash.sections.split(',') : [];
    newsflash.is_liked = Boolean(newsflash.is_liked);

    // Get comments
    const comments = db.prepare(`
      SELECT 
        c.id,
        c.content,
        c.created_at,
        u.id as author_id,
        u.username as author_username,
        u.display_name as author_display_name,
        u.profile_picture as author_profile_picture
      FROM comments c
      INNER JOIN users u ON c.author_id = u.id
      WHERE c.newsflash_id = ?
      ORDER BY c.created_at DESC
      LIMIT 10
    `).all(newsflashId);

    res.json({ 
      newsflash,
      comments 
    });
  }
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
  async (req, res) => {
    const { content, sections = [], recipients = [], groups = [] } = req.body;
    const image = req.file?.processedPath;

    try {
      db.prepare('BEGIN TRANSACTION').run();

      // Create newsflash
      const result = db.prepare(`
        INSERT INTO newsflashes (author_id, content, image)
        VALUES (?, ?, ?)
      `).run(req.user.id, content, image);

      const newsflashId = result.lastInsertRowid;

        // Add sections
        if (sections.length > 0) {
          const sectionStmt = db.prepare(`
            INSERT INTO newsflash_sections (newsflash_id, section_id)
            SELECT ?, id FROM sections WHERE name = ?
          `);

          sections.forEach(sectionName => {
            sectionStmt.run(newsflashId, sectionName);
          });
        }

        // Add individual recipients
        if (recipients.length > 0) {
          const recipientStmt = db.prepare(`
            INSERT INTO newsflash_recipients (newsflash_id, user_id)
            VALUES (?, ?)
          `);

          recipients.forEach(userId => {
            recipientStmt.run(newsflashId, userId);
          });
        }

        // Add group recipients
        if (groups.length > 0) {
          const groupStmt = db.prepare(`
            INSERT INTO newsflash_groups (newsflash_id, group_id)
            VALUES (?, ?)
          `);

          groups.forEach(groupId => {
            groupStmt.run(newsflashId, groupId);
          });
        }

      db.prepare('COMMIT').run();

      // Get created newsflash
      const newsflash = db.prepare(`
        SELECT 
          n.id,
          n.content,
          n.image,
          n.created_at,
          u.id as author_id,
          u.username as author_username,
          u.display_name as author_display_name,
          u.profile_picture as author_profile_picture,
          GROUP_CONCAT(DISTINCT s.name) as sections
        FROM newsflashes n
        INNER JOIN users u ON n.author_id = u.id
        LEFT JOIN newsflash_sections ns ON n.id = ns.newsflash_id
        LEFT JOIN sections s ON ns.section_id = s.id
        WHERE n.id = ?
        GROUP BY n.id
      `).get(newsflashId);

      newsflash.sections = newsflash.sections ? newsflash.sections.split(',') : [];
      newsflash.like_count = 0;
      newsflash.comment_count = 0;
      newsflash.is_liked = false;

      // Send push notifications
      const allRecipientIds = [...recipients];

      // Get members of groups
      if (groups.length > 0) {
        const groupMembers = db.prepare(`
          SELECT DISTINCT user_id 
          FROM group_members 
          WHERE group_id IN (${groups.map(() => '?').join(',')})
          AND user_id != ?
        `).all(...groups, req.user.id);

        allRecipientIds.push(...groupMembers.map(m => m.user_id));
      }

      // Get all friends if no specific recipients
      if (recipients.length === 0 && groups.length === 0) {
        const friends = db.prepare(`
          SELECT friend_id FROM friends WHERE user_id = ?
        `).all(req.user.id);

        allRecipientIds.push(...friends.map(f => f.friend_id));
      }

      // Remove duplicates
      const uniqueRecipientIds = [...new Set(allRecipientIds)];

      // Send notifications
      if (uniqueRecipientIds.length > 0) {
        NotificationService.notifyNewNewsflash(newsflash, uniqueRecipientIds);
      }

      // Emit via Socket.IO
      if (global.socketService) {
        global.socketService.emitNewsflash(newsflash, uniqueRecipientIds);
      }

      res.status(201).json({
        message: 'Newsflash created successfully',
        newsflash
      });
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Create newsflash error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create newsflash'
      });
    }
  }
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
  (req, res) => {
    const newsflashId = req.params.id;
    const { content } = req.body;
    const image = req.file?.processedPath;

    try {
      // Check ownership
      const newsflash = db.prepare(`
        SELECT author_id FROM newsflashes WHERE id = ?
      `).get(newsflashId);

      if (!newsflash) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Newsflash not found'
        });
      }

      if (newsflash.author_id !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only edit your own newsflashes'
        });
      }

      // Build update query
      const updates = [];
      const values = [];

      if (content !== undefined) {
        updates.push('content = ?');
        values.push(content);
      }
      if (image) {
        updates.push('image = ?');
        values.push(image);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No fields to update'
        });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(newsflashId);

      db.prepare(`
        UPDATE newsflashes 
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...values);

      res.json({
        message: 'Newsflash updated successfully'
      });
    } catch (error) {
      console.error('Update newsflash error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update newsflash'
      });
    }
  }
);

// DELETE /api/v1/newsflashes/:id
router.delete('/:id',
  authenticateToken,
  param('id').isInt().withMessage('Invalid newsflash ID'),
  handleValidationErrors,
  (req, res) => {
    const newsflashId = req.params.id;

    try {
      // Check ownership
      const newsflash = db.prepare(`
        SELECT author_id FROM newsflashes WHERE id = ?
      `).get(newsflashId);

      if (!newsflash) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Newsflash not found'
        });
      }

      if (newsflash.author_id !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only delete your own newsflashes'
        });
      }

      db.prepare('DELETE FROM newsflashes WHERE id = ?').run(newsflashId);

      res.json({
        message: 'Newsflash deleted successfully'
      });
    } catch (error) {
      console.error('Delete newsflash error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete newsflash'
      });
    }
  }
);

// POST /api/v1/newsflashes/:id/like
router.post('/:id/like',
  authenticateToken,
  param('id').isInt().withMessage('Invalid newsflash ID'),
  handleValidationErrors,
  (req, res) => {
    const newsflashId = req.params.id;

    try {
      // Check if already liked
      const existingLike = db.prepare(`
        SELECT 1 FROM likes WHERE newsflash_id = ? AND user_id = ?
      `).get(newsflashId, req.user.id);

      if (existingLike) {
        // Unlike
        db.prepare(`
          DELETE FROM likes WHERE newsflash_id = ? AND user_id = ?
        `).run(newsflashId, req.user.id);

        res.json({
          message: 'Newsflash unliked',
          liked: false
        });
      } else {
        // Like
        db.prepare(`
          INSERT INTO likes (newsflash_id, user_id) VALUES (?, ?)
        `).run(newsflashId, req.user.id);

        res.json({
          message: 'Newsflash liked',
          liked: true
        });
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
  async (req, res) => {
    const newsflashId = req.params.id;
    const { content } = req.body;

    try {
      // Check if newsflash exists and get author
      const newsflash = db.prepare(`
        SELECT author_id FROM newsflashes WHERE id = ?
      `).get(newsflashId);

      if (!newsflash) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Newsflash not found'
        });
      }

      // Create comment
      const result = db.prepare(`
        INSERT INTO comments (newsflash_id, author_id, content)
        VALUES (?, ?, ?)
      `).run(newsflashId, req.user.id, content);

      // Get created comment
      const comment = db.prepare(`
        SELECT 
          c.id,
          c.content,
          c.created_at,
          c.newsflash_id,
          u.id as author_id,
          u.username as author_username,
          u.display_name as author_display_name,
          u.profile_picture as author_profile_picture
        FROM comments c
        INNER JOIN users u ON c.author_id = u.id
        WHERE c.id = ?
      `).get(result.lastInsertRowid);

      // Send notification to newsflash author
      NotificationService.notifyNewComment(comment, newsflash.author_id);

      // Emit via Socket.IO
      if (global.socketService) {
        global.socketService.emitComment(comment, newsflash.author_id);
      }

      res.status(201).json({
        message: 'Comment added successfully',
        comment
      });
    } catch (error) {
      console.error('Comment error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to add comment'
      });
    }
  }
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