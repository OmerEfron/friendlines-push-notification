const { db } = require('../config/database');

class NotificationController {
  async getNotifications(req, res) {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    try {
      // Get friend requests
      const friendRequests = db.prepare(`
        SELECT 
          'friend_request' as type,
          fr.id,
          fr.created_at,
          u.id as sender_id,
          u.username as sender_username,
          u.display_name as sender_display_name,
          u.profile_picture as sender_profile_picture
        FROM friend_requests fr
        INNER JOIN users u ON fr.sender_id = u.id
        WHERE fr.receiver_id = ? AND fr.status = 'pending'
      `).all(userId);

      // Get group invitations
      const groupInvitations = db.prepare(`
        SELECT 
          'group_invitation' as type,
          gi.id,
          gi.created_at,
          g.id as group_id,
          g.name as group_name,
          g.profile_picture as group_picture,
          u.id as inviter_id,
          u.display_name as inviter_name
        FROM group_invitations gi
        INNER JOIN groups g ON gi.group_id = g.id
        INNER JOIN users u ON gi.inviter_id = u.id
        WHERE gi.invitee_id = ? AND gi.status = 'pending'
      `).all(userId);

      // Combine and sort notifications
      const notifications = [
        ...friendRequests.map(fr => ({
          type: 'friend_request',
          id: fr.id,
          created_at: fr.created_at,
          data: {
            sender_id: fr.sender_id,
            sender_username: fr.sender_username,
            sender_display_name: fr.sender_display_name,
            sender_profile_picture: fr.sender_profile_picture
          }
        })),
        ...groupInvitations.map(gi => ({
          type: 'group_invitation',
          id: gi.id,
          created_at: gi.created_at,
          data: {
            group_id: gi.group_id,
            group_name: gi.group_name,
            group_picture: gi.group_picture,
            inviter_id: gi.inviter_id,
            inviter_name: gi.inviter_name
          }
        }))
      ];

      // Sort by created_at descending
      notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Apply pagination
      const paginatedNotifications = notifications.slice(offset, offset + limit);

      res.json({
        notifications: paginatedNotifications,
        total: notifications.length,
        has_more: notifications.length > offset + limit
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch notifications'
      });
    }
  }

  async registerPushToken(req, res) {
    const { token, deviceId, platform } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Push token is required'
      });
    }

    try {
      // Deactivate old tokens for this user
      db.prepare(`
        UPDATE user_push_tokens 
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = ?
      `).run(userId);

      // Insert or update the push token
      db.prepare(`
        INSERT INTO user_push_tokens (user_id, push_token, device_id, platform, is_active)
        VALUES (?, ?, ?, ?, 1)
        ON CONFLICT(user_id, push_token) 
        DO UPDATE SET 
          device_id = excluded.device_id,
          platform = excluded.platform,
          is_active = 1,
          updated_at = CURRENT_TIMESTAMP
      `).run(userId, token, deviceId, platform);

      res.json({
        message: 'Push token registered successfully'
      });
    } catch (error) {
      console.error('Register push token error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to register push token'
      });
    }
  }

  async unregisterPushToken(req, res) {
    const { token } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Push token is required'
      });
    }

    try {
      db.prepare(`
        UPDATE user_push_tokens 
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = ? AND push_token = ?
      `).run(userId, token);

      res.json({
        message: 'Push token unregistered successfully'
      });
    } catch (error) {
      console.error('Unregister push token error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to unregister push token'
      });
    }
  }

  async markNotificationRead(req, res) {
    const { type, id } = req.body;
    const userId = req.user.id;

    if (!type || !id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Notification type and id are required'
      });
    }

    try {
      // For now, we don't have a general notifications table
      // This endpoint is a placeholder for future implementation
      res.json({
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to mark notification as read'
      });
    }
  }

  async testNotification(req, res) {
    const { type = 'test' } = req.body;
    const userId = req.user.id;

    try {
      // Get user's push tokens
      const tokens = db.prepare(`
        SELECT push_token FROM user_push_tokens 
        WHERE user_id = ? AND is_active = 1
      `).all(userId);

      if (tokens.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No active push tokens found'
        });
      }

      // Send test notification
      const NotificationService = require('../services/notification.service');
      await NotificationService.sendTestNotification(userId, type);

      res.json({
        message: 'Test notification sent',
        tokens_count: tokens.length
      });
    } catch (error) {
      console.error('Test notification error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to send test notification'
      });
    }
  }
}

module.exports = new NotificationController(); 