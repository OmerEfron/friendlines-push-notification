const { db } = require('../config/database');
const NotificationService = require('../services/notification.service');

class UserController {
  async getProfile(req, res) {
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

  async getMe(req, res) {
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
  }

  async updateProfile(req, res) {
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

  async searchUsers(req, res) {
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

  async getFriends(req, res) {
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
  }

  async sendFriendRequest(req, res) {
    const { receiverId } = req.body;

    db.serialize(() => {
      try {
        db.run('BEGIN TRANSACTION');

        // Check if users exist
        const receiver = db.prepare('SELECT id, display_name FROM users WHERE id = ?').get(receiverId);
        if (!receiver) {
          db.run('ROLLBACK');
          return res.status(404).json({
            error: 'Not Found',
            message: 'User not found'
          });
        }

        // Check if they're already friends
        const existingFriend = db.prepare(`
          SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?
        `).get(req.user.id, receiverId);

        if (existingFriend) {
          db.run('ROLLBACK');
          return res.status(400).json({
            error: 'Bad Request',
            message: 'You are already friends with this user'
          });
        }

        // Check for existing request
        const existingRequest = db.prepare(`
          SELECT * FROM friend_requests 
          WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        `).get(req.user.id, receiverId, receiverId, req.user.id);

        if (existingRequest) {
          db.run('ROLLBACK');
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Friend request already exists'
          });
        }

        // Create friend request
        db.prepare(`
          INSERT INTO friend_requests (sender_id, receiver_id, status)
          VALUES (?, ?, 'pending')
        `).run(req.user.id, receiverId);

        db.run('COMMIT');

        // Send notification
        const sender = db.prepare('SELECT display_name FROM users WHERE id = ?').get(req.user.id);
        NotificationService.sendFriendRequestNotification({
          senderId: req.user.id,
          senderName: sender.display_name,
          receiverId: receiverId
        });

        res.status(201).json({
          message: 'Friend request sent successfully'
        });
      } catch (error) {
        db.run('ROLLBACK');
        console.error('Send friend request error:', error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to send friend request'
        });
      }
    });
  }

  async acceptFriendRequest(req, res) {
    const requestId = req.params.id;

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
          SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(requestId);

        // Create friendship (bidirectional)
        db.prepare(`
          INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)
        `).run(request.sender_id, request.receiver_id, request.receiver_id, request.sender_id);

        db.run('COMMIT');

        // Send notification
        const accepter = db.prepare('SELECT display_name FROM users WHERE id = ?').get(req.user.id);
        NotificationService.sendFriendAcceptanceNotification({
          accepterId: req.user.id,
          accepterName: accepter.display_name,
          requesterId: request.sender_id
        });

        res.json({
          message: 'Friend request accepted'
        });
      } catch (error) {
        db.run('ROLLBACK');
        console.error('Accept friend request error:', error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to accept friend request'
        });
      }
    });
  }

  async rejectFriendRequest(req, res) {
    const requestId = req.params.id;

    try {
      const result = db.prepare(`
        UPDATE friend_requests 
        SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND receiver_id = ? AND status = 'pending'
      `).run(requestId, req.user.id);

      if (result.changes === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Friend request not found or already processed'
        });
      }

      res.json({
        message: 'Friend request rejected'
      });
    } catch (error) {
      console.error('Reject friend request error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to reject friend request'
      });
    }
  }

  async getFriendRequests(req, res) {
    const requests = db.prepare(`
      SELECT 
        fr.id,
        fr.status,
        fr.created_at,
        u.id as sender_id,
        u.username as sender_username,
        u.display_name as sender_display_name,
        u.profile_picture as sender_profile_picture
      FROM friend_requests fr
      INNER JOIN users u ON fr.sender_id = u.id
      WHERE fr.receiver_id = ? AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `).all(req.user.id);

    res.json({ requests });
  }

  async removeFriend(req, res) {
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
}

module.exports = new UserController(); 