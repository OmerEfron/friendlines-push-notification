const express = require('express');
const { body, param, query } = require('express-validator');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { upload, processImage, cleanupFile } = require('../middleware/upload.middleware');
const NotificationService = require('../services/notification.service');

const router = express.Router();

// GET /api/v1/users/profile/:id
router.get('/profile/:id', 
  param('id').isInt().withMessage('Invalid user ID'),
  handleValidationErrors,
  (req, res) => {
    const userId = req.params.id;

    const user = db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.display_name,
        u.bio,
        u.profile_picture,
        u.created_at,
        COUNT(DISTINCT n.id) as newsflash_count,
        COUNT(DISTINCT f.friend_id) as friend_count
      FROM users u
      LEFT JOIN newsflashes n ON u.id = n.author_id
      LEFT JOIN friends f ON u.id = f.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `).get(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    res.json({ user });
  }
);

// GET /api/v1/users/me
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare(`
    SELECT 
      u.id,
      u.username,
      u.email,
      u.display_name,
      u.bio,
      u.profile_picture,
      u.created_at,
      COUNT(DISTINCT n.id) as newsflash_count,
      COUNT(DISTINCT f.friend_id) as friend_count
    FROM users u
    LEFT JOIN newsflashes n ON u.id = n.author_id
    LEFT JOIN friends f ON u.id = f.user_id
    WHERE u.id = ?
    GROUP BY u.id
  `).get(req.user.id);

  res.json({ user });
});

// PUT /api/v1/users/profile
router.put('/profile',
  authenticateToken,
  upload.single('profilePicture'),
  processImage({ width: 200, height: 200, folder: 'profile' }),
  cleanupFile,
  [
    body('displayName').optional().trim().isLength({ max: 50 }),
    body('bio').optional().trim().isLength({ max: 500 })
  ],
  handleValidationErrors,
  async (req, res) => {
    const { displayName, bio } = req.body;
    const profilePicture = req.file?.processedPath;

    try {
      // Build update query dynamically
      const updates = [];
      const values = [];

      if (displayName !== undefined) {
        updates.push('display_name = ?');
        values.push(displayName);
      }
      if (bio !== undefined) {
        updates.push('bio = ?');
        values.push(bio);
      }
      if (profilePicture) {
        updates.push('profile_picture = ?');
        values.push(profilePicture);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No fields to update'
        });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(req.user.id);

      db.prepare(`
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...values);

      // Get updated user
      const user = db.prepare(`
        SELECT id, username, email, display_name, bio, profile_picture, updated_at
        FROM users WHERE id = ?
      `).get(req.user.id);

      res.json({
        message: 'Profile updated successfully',
        user
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update profile'
      });
    }
  }
);

// GET /api/v1/users/search
router.get('/search',
  authenticateToken,
  [
    query('q').trim().isLength({ min: 2 }).withMessage('Search query must be at least 2 characters')
  ],
  handleValidationErrors,
  (req, res) => {
    const searchQuery = `%${req.query.q}%`;

    const users = db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.display_name,
        u.profile_picture,
        CASE 
          WHEN f.friend_id IS NOT NULL THEN 1
          ELSE 0
        END as is_friend,
        CASE
          WHEN fr.id IS NOT NULL THEN fr.status
          ELSE NULL
        END as friend_request_status
      FROM users u
      LEFT JOIN friends f ON u.id = f.friend_id AND f.user_id = ?
      LEFT JOIN friend_requests fr ON 
        (fr.sender_id = ? AND fr.receiver_id = u.id) OR
        (fr.sender_id = u.id AND fr.receiver_id = ?)
      WHERE u.id != ? AND (u.username LIKE ? OR u.email LIKE ? OR u.display_name LIKE ?)
      LIMIT 20
    `).all(req.user.id, req.user.id, req.user.id, req.user.id, searchQuery, searchQuery, searchQuery);

    res.json({ users });
  }
);

// GET /api/v1/users/friends
router.get('/friends', authenticateToken, (req, res) => {
  const friends = db.prepare(`
    SELECT 
      u.id,
      u.username,
      u.display_name,
      u.profile_picture,
      f.created_at as friends_since
    FROM friends f
    INNER JOIN users u ON f.friend_id = u.id
    WHERE f.user_id = ?
    ORDER BY u.display_name ASC
  `).all(req.user.id);

  res.json({ friends });
});

// POST /api/v1/users/friends/request
router.post('/friends/request',
  authenticateToken,
  [
    body('receiverId').isInt().withMessage('Invalid receiver ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    const { receiverId } = req.body;

    if (receiverId === req.user.id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot send friend request to yourself'
      });
    }

    try {
      // Check if users are already friends
      const existingFriend = db.prepare(`
        SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?
      `).get(req.user.id, receiverId);

      if (existingFriend) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Already friends with this user'
        });
      }

      // Check if request already exists
      const existingRequest = db.prepare(`
        SELECT * FROM friend_requests 
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      `).get(req.user.id, receiverId, receiverId, req.user.id);

      let requestId;

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return res.status(409).json({
            error: 'Conflict',
            message: 'Friend request already exists'
          });
        }
        
        // Update existing rejected request
        db.prepare(`
          UPDATE friend_requests 
          SET status = 'pending', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(existingRequest.id);
        
        requestId = existingRequest.id;
      } else {
        // Create new request
        const result = db.prepare(`
          INSERT INTO friend_requests (sender_id, receiver_id)
          VALUES (?, ?)
        `).run(req.user.id, receiverId);
        
        requestId = result.lastInsertRowid;
      }

      // Get request details for notification
      const request = {
        id: requestId,
        sender_id: req.user.id,
        sender_display_name: req.user.display_name
      };

      // Send push notification
      await NotificationService.notifyFriendRequest(request, receiverId);

      // Emit via Socket.IO
      if (global.socketService) {
        global.socketService.emitFriendRequest(request, receiverId);
      }

      res.status(201).json({
        message: 'Friend request sent successfully'
      });
    } catch (error) {
      console.error('Friend request error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to send friend request'
      });
    }
  }
);

// PUT /api/v1/users/friends/request/:id
router.put('/friends/request/:id',
  authenticateToken,
  [
    param('id').isInt().withMessage('Invalid request ID'),
    body('action').isIn(['accept', 'reject']).withMessage('Invalid action')
  ],
  handleValidationErrors,
  async (req, res) => {
    const requestId = req.params.id;
    const { action } = req.body;

    db.serialize(() => {
      try {
        db.run('BEGIN TRANSACTION');

        // Get request details
        const request = db.prepare(`
          SELECT * FROM friend_requests 
          WHERE id = ? AND receiver_id = ? AND status = 'pending'
        `).get(requestId, req.user.id);

        if (!request) {
          db.run('ROLLBACK');
          return res.status(404).json({
            error: 'Not Found',
            message: 'Friend request not found or already processed'
          });
        }

        // Update request status
        db.prepare(`
          UPDATE friend_requests 
          SET status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(action === 'accept' ? 'accepted' : 'rejected', requestId);

        // If accepted, create friendship
        if (action === 'accept') {
          // Add bidirectional friendship
          db.prepare(`
            INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)
          `).run(req.user.id, request.sender_id, request.sender_id, req.user.id);

          // Send notification to original sender
          NotificationService.notifyFriendRequestAccepted(req.user, request.sender_id);

          // Emit via Socket.IO
          if (global.socketService) {
            global.socketService.emitFriendAccepted(request.sender_id, req.user);
          }
        }

        db.run('COMMIT');

        res.json({
          message: `Friend request ${action}ed successfully`
        });
      } catch (error) {
        db.run('ROLLBACK');
        console.error('Friend request action error:', error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to process friend request'
        });
      }
    });
  }
);

// GET /api/v1/users/friends/requests
router.get('/friends/requests', authenticateToken, (req, res) => {
  const requests = db.prepare(`
    SELECT 
      fr.id,
      fr.status,
      fr.created_at,
      u.id as user_id,
      u.username,
      u.display_name,
      u.profile_picture,
      CASE 
        WHEN fr.sender_id = ? THEN 'sent'
        ELSE 'received'
      END as type
    FROM friend_requests fr
    INNER JOIN users u ON 
      CASE 
        WHEN fr.sender_id = ? THEN fr.receiver_id = u.id
        ELSE fr.sender_id = u.id
      END
    WHERE (fr.sender_id = ? OR fr.receiver_id = ?) AND fr.status = 'pending'
    ORDER BY fr.created_at DESC
  `).all(req.user.id, req.user.id, req.user.id, req.user.id);

  res.json({ requests });
});

// DELETE /api/v1/users/friends/:id
router.delete('/friends/:id',
  authenticateToken,
  param('id').isInt().withMessage('Invalid friend ID'),
  handleValidationErrors,
  (req, res) => {
    const friendId = req.params.id;

    try {
      // Remove bidirectional friendship
      const result = db.prepare(`
        DELETE FROM friends 
        WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
      `).run(req.user.id, friendId, friendId, req.user.id);

      if (result.changes === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Friend relationship not found'
        });
      }

      res.json({
        message: 'Friend removed successfully'
      });
    } catch (error) {
      console.error('Remove friend error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to remove friend'
      });
    }
  }
);

module.exports = router; 