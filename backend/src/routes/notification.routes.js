const express = require('express');
const { body } = require('express-validator');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

const router = express.Router();

// POST /api/v1/notifications/register-token
router.post('/register-token',
  authenticateToken,
  [
    body('pushToken')
      .notEmpty()
      .withMessage('Push token is required'),
    body('deviceId')
      .optional()
      .trim(),
    body('platform')
      .optional()
      .isIn(['ios', 'android', 'web'])
      .withMessage('Platform must be ios, android, or web')
  ],
  handleValidationErrors,
  (req, res) => {
    const { pushToken, deviceId, platform } = req.body;
    const userId = req.user.id;

    try {
      // Check if token already exists for this user
      const existingToken = db.prepare(`
        SELECT id FROM user_push_tokens 
        WHERE user_id = ? AND push_token = ?
      `).get(userId, pushToken);

      if (existingToken) {
        // Update existing token
        db.prepare(`
          UPDATE user_push_tokens 
          SET is_active = 1, 
              device_id = ?, 
              platform = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND push_token = ?
        `).run(deviceId, platform, userId, pushToken);
      } else {
        // Deactivate other tokens for the same device if deviceId provided
        if (deviceId) {
          db.prepare(`
            UPDATE user_push_tokens 
            SET is_active = 0 
            WHERE user_id = ? AND device_id = ? AND push_token != ?
          `).run(userId, deviceId, pushToken);
        }

        // Insert new token
        db.prepare(`
          INSERT INTO user_push_tokens (user_id, push_token, device_id, platform)
          VALUES (?, ?, ?, ?)
        `).run(userId, pushToken, deviceId, platform);
      }

      res.json({
        message: 'Push token registered successfully'
      });
    } catch (error) {
      console.error('Push token registration error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to register push token'
      });
    }
  }
);

// DELETE /api/v1/notifications/unregister-token
router.delete('/unregister-token',
  authenticateToken,
  [
    body('pushToken')
      .notEmpty()
      .withMessage('Push token is required')
  ],
  handleValidationErrors,
  (req, res) => {
    const { pushToken } = req.body;
    const userId = req.user.id;

    try {
      // Deactivate the token
      const result = db.prepare(`
        UPDATE user_push_tokens 
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND push_token = ?
      `).run(userId, pushToken);

      if (result.changes === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Push token not found'
        });
      }

      res.json({
        message: 'Push token unregistered successfully'
      });
    } catch (error) {
      console.error('Push token unregistration error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to unregister push token'
      });
    }
  }
);

// GET /api/v1/notifications/test
router.post('/test',
  authenticateToken,
  [
    body('type')
      .isIn(['newsflash', 'friend_request', 'group_invitation'])
      .withMessage('Type must be newsflash, friend_request, or group_invitation')
  ],
  handleValidationErrors,
  async (req, res) => {
    const { type } = req.body;
    const userId = req.user.id;

    try {
      const NotificationService = require('../services/notification.service');

      // Get user's push token
      const token = db.prepare(`
        SELECT push_token 
        FROM user_push_tokens 
        WHERE user_id = ? AND is_active = 1
        LIMIT 1
      `).get(userId);

      if (!token) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No active push token found. Please register a push token first.'
        });
      }

      // Send test notification based on type
      let testData;
      switch (type) {
        case 'newsflash':
          testData = {
            title: 'Test Newsflash',
            body: 'This is a test newsflash notification',
            metadata: { type: 'newsflash', newsflashId: 0 }
          };
          break;
        case 'friend_request':
          testData = {
            title: 'Test Friend Request',
            body: 'Someone wants to be your friend (test)',
            metadata: { type: 'friend_request', requestId: 0 }
          };
          break;
        case 'group_invitation':
          testData = {
            title: 'Test Group Invitation',
            body: 'You have been invited to join a group (test)',
            metadata: { type: 'group_invitation', groupId: 0 }
          };
          break;
      }

      await NotificationService.sendPushNotifications([token.push_token], testData);

      res.json({
        message: 'Test notification sent successfully'
      });
    } catch (error) {
      console.error('Test notification error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to send test notification'
      });
    }
  }
);

module.exports = router; 