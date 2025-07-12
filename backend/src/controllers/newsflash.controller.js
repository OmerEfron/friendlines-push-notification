const { db } = require('../config/database');
const NotificationService = require('../services/notification.service');

class NewsflashController {
  async getFeed(req, res) {
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
  }

  async getNewsflash(req, res) {
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

  async createNewsflash(req, res) {
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
          INSERT OR IGNORE INTO newsflash_sections (newsflash_id, section_id)
          SELECT ?, id FROM sections WHERE name = ?
        `);
        sections.forEach(section => sectionStmt.run(newsflashId, section));
      }

      // Add individual recipients
      if (recipients.length > 0) {
        const recipientStmt = db.prepare(`
          INSERT INTO newsflash_recipients (newsflash_id, user_id)
          VALUES (?, ?)
        `);
        recipients.forEach(recipientId => recipientStmt.run(newsflashId, recipientId));
      }

      // Add group recipients
      if (groups.length > 0) {
        const groupStmt = db.prepare(`
          INSERT INTO newsflash_groups (newsflash_id, group_id)
          VALUES (?, ?)
        `);
        groups.forEach(groupId => groupStmt.run(newsflashId, groupId));
      }

      db.prepare('COMMIT').run();

      // Send notifications - using the correct method
      try {
        const author = db.prepare('SELECT display_name FROM users WHERE id = ?').get(req.user.id);
        
        // Prepare newsflash object for notification
        const newsflashForNotification = {
          id: newsflashId,
          author_id: req.user.id,
          author_display_name: author.display_name,
          content
        };

        // Collect all recipient IDs (direct recipients + group members)
        let allRecipientIds = [...recipients];
        
        if (groups.length > 0) {
          const groupMembers = db.prepare(`
            SELECT DISTINCT user_id 
            FROM group_members 
            WHERE group_id IN (${groups.map(() => '?').join(',')})
            AND user_id != ?
          `).all(...groups, req.user.id);
          
          allRecipientIds = [...allRecipientIds, ...groupMembers.map(m => m.user_id)];
        }

        // Remove duplicates and filter out the author
        allRecipientIds = [...new Set(allRecipientIds)].filter(id => id !== req.user.id);

        // Call the correct notification method
        if (allRecipientIds.length > 0) {
          await NotificationService.notifyNewNewsflash(newsflashForNotification, allRecipientIds);
        }
      } catch (notificationError) {
        // Log notification error but don't fail the request
        console.error('Failed to send notifications:', notificationError);
      }

      // Return created newsflash
      const newsflash = this.getNewsflashById(newsflashId, req.user.id);

      res.status(201).json({
        message: 'Newsflash created successfully',
        newsflash
      });
    } catch (error) {
      // Wrap rollback in try-catch to handle auto-rollback scenarios
      try {
        db.prepare('ROLLBACK').run();
      } catch (rollbackError) {
        // Transaction was already rolled back automatically
        console.error('Rollback error (transaction may have auto-rolled back):', rollbackError);
      }
      
      console.error('Create newsflash error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create newsflash'
      });
    }
  }

  async likeNewsflash(req, res) {
    const newsflashId = req.params.id;

    try {
      db.prepare(`
        INSERT OR IGNORE INTO likes (newsflash_id, user_id)
        VALUES (?, ?)
      `).run(newsflashId, req.user.id);

      const likeCount = db.prepare(`
        SELECT COUNT(*) as count FROM likes WHERE newsflash_id = ?
      `).get(newsflashId).count;

      res.json({
        message: 'Newsflash liked',
        like_count: likeCount
      });
    } catch (error) {
      console.error('Like newsflash error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to like newsflash'
      });
    }
  }

  async unlikeNewsflash(req, res) {
    const newsflashId = req.params.id;

    try {
      db.prepare(`
        DELETE FROM likes WHERE newsflash_id = ? AND user_id = ?
      `).run(newsflashId, req.user.id);

      const likeCount = db.prepare(`
        SELECT COUNT(*) as count FROM likes WHERE newsflash_id = ?
      `).get(newsflashId).count;

      res.json({
        message: 'Newsflash unliked',
        like_count: likeCount
      });
    } catch (error) {
      console.error('Unlike newsflash error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to unlike newsflash'
      });
    }
  }

  async commentOnNewsflash(req, res) {
    const { content } = req.body;
    const newsflashId = req.params.id;

    try {
      const result = db.prepare(`
        INSERT INTO comments (newsflash_id, author_id, content)
        VALUES (?, ?, ?)
      `).run(newsflashId, req.user.id, content);

      const comment = db.prepare(`
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
        WHERE c.id = ?
      `).get(result.lastInsertRowid);

      res.status(201).json({
        message: 'Comment added',
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

  async updateNewsflash(req, res) {
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

  async deleteNewsflash(req, res) {
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

  // Helper method
  getNewsflashById(id, userId) {
    const newsflash = db.prepare(`
      SELECT 
        n.id,
        n.content,
        n.image,
        n.created_at,
        u.id as author_id,
        u.display_name as author_display_name,
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
    `).get(userId || 0, id);

    if (newsflash) {
      newsflash.sections = newsflash.sections ? newsflash.sections.split(',') : [];
      newsflash.is_liked = Boolean(newsflash.is_liked);
    }

    return newsflash;
  }
}

module.exports = new NewsflashController(); 