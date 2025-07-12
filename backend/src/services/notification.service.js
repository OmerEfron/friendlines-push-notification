const { Expo } = require('expo-server-sdk');
const { db } = require('../config/database');

// Create a new Expo SDK client
const expo = new Expo();

class NotificationService {
  /**
   * Send push notifications to multiple recipients
   * @param {Array} pushTokens - Array of Expo push tokens
   * @param {Object} data - Notification data
   * @returns {Promise}
   */
  static async sendPushNotifications(pushTokens, data) {
    // Create the messages that you want to send to clients
    const messages = [];
    
    for (const pushToken of pushTokens) {
      // Check that all push tokens appear to be valid Expo push tokens
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        continue;
      }

      // Construct a message
      messages.push({
        to: pushToken,
        sound: 'default',
        title: data.title,
        body: data.body,
        data: data.metadata || {},
        priority: data.priority || 'default',
        badge: data.badge || 0,
      });
    }

    // Split messages into chunks to avoid rate limits
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    // Send the chunks to the Expo push notification service
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    return tickets;
  }

  /**
   * Send notification for new newsflash
   * @param {Object} newsflash - Newsflash object with author info
   * @param {Array} recipientIds - Array of user IDs to notify
   */
  static async notifyNewNewsflash(newsflash, recipientIds) {
    if (!recipientIds || recipientIds.length === 0) return;

    // Get push tokens for recipients
    const tokens = db.prepare(`
      SELECT push_token 
      FROM user_push_tokens 
      WHERE user_id IN (${recipientIds.map(() => '?').join(',')})
      AND is_active = 1
    `).all(...recipientIds);

    if (tokens.length === 0) return;

    const pushTokens = tokens.map(t => t.push_token);
    
    await this.sendPushNotifications(pushTokens, {
      title: `${newsflash.author_display_name} posted a newsflash`,
      body: newsflash.content.substring(0, 100) + (newsflash.content.length > 100 ? '...' : ''),
      metadata: {
        type: 'newsflash',
        newsflashId: newsflash.id,
        authorId: newsflash.author_id
      },
      badge: 1
    });
  }

  /**
   * Send notification for new friend request
   * @param {Object} request - Friend request object with sender info
   * @param {Number} receiverId - User ID of the receiver
   */
  static async notifyFriendRequest(request, receiverId) {
    // Get push token for receiver
    const token = db.prepare(`
      SELECT push_token 
      FROM user_push_tokens 
      WHERE user_id = ? AND is_active = 1
    `).get(receiverId);

    if (!token) return;

    await this.sendPushNotifications([token.push_token], {
      title: 'New Friend Request',
      body: `${request.sender_display_name} wants to be your friend`,
      metadata: {
        type: 'friend_request',
        requestId: request.id,
        senderId: request.sender_id
      },
      badge: 1
    });
  }

  /**
   * Send notification for friend request accepted
   * @param {Object} acceptedBy - User who accepted the request
   * @param {Number} originalSenderId - User ID of the original sender
   */
  static async notifyFriendRequestAccepted(acceptedBy, originalSenderId) {
    // Get push token for original sender
    const token = db.prepare(`
      SELECT push_token 
      FROM user_push_tokens 
      WHERE user_id = ? AND is_active = 1
    `).get(originalSenderId);

    if (!token) return;

    await this.sendPushNotifications([token.push_token], {
      title: 'Friend Request Accepted',
      body: `${acceptedBy.display_name} accepted your friend request`,
      metadata: {
        type: 'friend_accepted',
        userId: acceptedBy.id
      }
    });
  }

  /**
   * Send notification for group invitation
   * @param {Object} group - Group object
   * @param {Object} inviter - User who sent the invitation
   * @param {Number} inviteeId - User ID of the invitee
   */
  static async notifyGroupInvitation(group, inviter, inviteeId) {
    // Get push token for invitee
    const token = db.prepare(`
      SELECT push_token 
      FROM user_push_tokens 
      WHERE user_id = ? AND is_active = 1
    `).get(inviteeId);

    if (!token) return;

    await this.sendPushNotifications([token.push_token], {
      title: 'Group Invitation',
      body: `${inviter.display_name} invited you to join "${group.name}"`,
      metadata: {
        type: 'group_invitation',
        groupId: group.id,
        inviterId: inviter.id
      },
      badge: 1
    });
  }

  /**
   * Send notification for new comment on user's newsflash
   * @param {Object} comment - Comment object with author info
   * @param {Number} newsflashAuthorId - User ID of the newsflash author
   */
  static async notifyNewComment(comment, newsflashAuthorId) {
    // Don't notify if commenting on own newsflash
    if (comment.author_id === newsflashAuthorId) return;

    // Get push token for newsflash author
    const token = db.prepare(`
      SELECT push_token 
      FROM user_push_tokens 
      WHERE user_id = ? AND is_active = 1
    `).get(newsflashAuthorId);

    if (!token) return;

    await this.sendPushNotifications([token.push_token], {
      title: `${comment.author_display_name} commented`,
      body: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : ''),
      metadata: {
        type: 'comment',
        commentId: comment.id,
        newsflashId: comment.newsflash_id,
        authorId: comment.author_id
      },
      badge: 1
    });
  }

  /**
   * Update user's notification badge count
   * @param {Number} userId - User ID
   * @param {Number} count - Badge count
   */
  static async updateBadgeCount(userId, count) {
    const token = db.prepare(`
      SELECT push_token 
      FROM user_push_tokens 
      WHERE user_id = ? AND is_active = 1
    `).get(userId);

    if (!token) return;

    await this.sendPushNotifications([token.push_token], {
      title: null,
      body: null,
      badge: count
    });
  }
}

module.exports = NotificationService; 