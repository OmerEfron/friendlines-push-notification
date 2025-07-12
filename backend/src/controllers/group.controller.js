const { db } = require('../config/database');
const NotificationService = require('../services/notification.service');

class GroupController {
  async getGroups(req, res) {
    try {
      const groups = db.prepare(`
        SELECT 
          g.id,
          g.name,
          g.description,
          g.profile_picture,
          g.is_private,
          g.created_at,
          u.display_name as creator_name,
          COUNT(DISTINCT gm.user_id) as member_count,
          CASE 
            WHEN gm2.user_id IS NOT NULL THEN 1
            ELSE 0
          END as is_member,
          gm2.role as user_role
        FROM groups g
        INNER JOIN users u ON g.creator_id = u.id
        LEFT JOIN group_members gm ON g.id = gm.group_id
        LEFT JOIN group_members gm2 ON g.id = gm2.group_id AND gm2.user_id = ?
        GROUP BY g.id
        ORDER BY g.created_at DESC
      `).all(req.user.id);

      res.json({ groups });
    } catch (error) {
      console.error('Get groups error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch groups'
      });
    }
  }

  async getGroup(req, res) {
    const groupId = req.params.id;

    try {
      // Get group details
      const group = db.prepare(`
        SELECT 
          g.*,
          u.display_name as creator_name,
          CASE 
            WHEN gm.user_id IS NOT NULL THEN 1
            ELSE 0
          END as is_member,
          gm.role as user_role
        FROM groups g
        INNER JOIN users u ON g.creator_id = u.id
        LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.user_id = ?
        WHERE g.id = ?
      `).get(req.user.id, groupId);

      if (!group) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Group not found'
        });
      }

      // Get group members
      const members = db.prepare(`
        SELECT 
          u.id,
          u.username,
          u.display_name,
          u.profile_picture,
          gm.role,
          gm.joined_at
        FROM group_members gm
        INNER JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ?
        ORDER BY gm.role DESC, gm.joined_at ASC
      `).all(groupId);

      res.json({ 
        group: {
          ...group,
          is_member: Boolean(group.is_member)
        },
        members 
      });
    } catch (error) {
      console.error('Get group error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch group'
      });
    }
  }

  async createGroup(req, res) {
    const { name, description, isPrivate = false } = req.body;
    const profilePicture = req.file?.processedPath;

    db.serialize(() => {
      try {
        db.run('BEGIN TRANSACTION');

        // Create group
        const result = db.prepare(`
          INSERT INTO groups (name, description, creator_id, profile_picture, is_private)
          VALUES (?, ?, ?, ?, ?)
        `).run(name, description, req.user.id, profilePicture, isPrivate ? 1 : 0);

        const groupId = result.lastInsertRowid;

        // Add creator as admin
        db.prepare(`
          INSERT INTO group_members (group_id, user_id, role)
          VALUES (?, ?, 'admin')
        `).run(groupId, req.user.id);

        db.run('COMMIT');

        // Get created group
        const group = db.prepare(`
          SELECT g.*, u.display_name as creator_name
          FROM groups g
          INNER JOIN users u ON g.creator_id = u.id
          WHERE g.id = ?
        `).get(groupId);

        res.status(201).json({
          message: 'Group created successfully',
          group
        });
      } catch (error) {
        db.run('ROLLBACK');
        console.error('Create group error:', error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to create group'
        });
      }
    });
  }

  async updateGroup(req, res) {
    const groupId = req.params.id;
    const { name, description } = req.body;
    const profilePicture = req.file?.processedPath;

    try {
      // Check if user is admin
      const membership = db.prepare(`
        SELECT role FROM group_members WHERE group_id = ? AND user_id = ?
      `).get(groupId, req.user.id);

      if (!membership || membership.role !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only group admins can update group details'
        });
      }

      // Build update query
      const updates = [];
      const values = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
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
      values.push(groupId);

      db.prepare(`
        UPDATE groups SET ${updates.join(', ')} WHERE id = ?
      `).run(...values);

      // Get updated group
      const group = db.prepare(`
        SELECT g.*, u.display_name as creator_name
        FROM groups g
        INNER JOIN users u ON g.creator_id = u.id
        WHERE g.id = ?
      `).get(groupId);

      res.json({
        message: 'Group updated successfully',
        group
      });
    } catch (error) {
      console.error('Update group error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update group'
      });
    }
  }

  async joinGroup(req, res) {
    const groupId = req.params.id;

    try {
      // Check if group exists
      const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
      if (!group) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Group not found'
        });
      }

      // Check if already member
      const existingMember = db.prepare(`
        SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?
      `).get(groupId, req.user.id);

      if (existingMember) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'You are already a member of this group'
        });
      }

      // Add user to group
      db.prepare(`
        INSERT INTO group_members (group_id, user_id, role)
        VALUES (?, ?, 'member')
      `).run(groupId, req.user.id);

      res.json({
        message: 'Successfully joined group'
      });
    } catch (error) {
      console.error('Join group error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to join group'
      });
    }
  }

  async leaveGroup(req, res) {
    const groupId = req.params.id;

    try {
      // Check if user is member
      const membership = db.prepare(`
        SELECT role FROM group_members WHERE group_id = ? AND user_id = ?
      `).get(groupId, req.user.id);

      if (!membership) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'You are not a member of this group'
        });
      }

      // Check if user is the only admin
      if (membership.role === 'admin') {
        const adminCount = db.prepare(`
          SELECT COUNT(*) as count FROM group_members 
          WHERE group_id = ? AND role = 'admin'
        `).get(groupId).count;

        if (adminCount === 1) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Cannot leave group - you are the only admin'
          });
        }
      }

      // Remove user from group
      db.prepare(`
        DELETE FROM group_members WHERE group_id = ? AND user_id = ?
      `).run(groupId, req.user.id);

      res.json({
        message: 'Successfully left group'
      });
    } catch (error) {
      console.error('Leave group error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to leave group'
      });
    }
  }

  async inviteToGroup(req, res) {
    const groupId = req.params.id;
    const { userId } = req.body;

    db.serialize(() => {
      try {
        db.run('BEGIN TRANSACTION');

        // Check if user is member of group
        const membership = db.prepare(`
          SELECT role FROM group_members WHERE group_id = ? AND user_id = ?
        `).get(groupId, req.user.id);

        if (!membership) {
          db.run('ROLLBACK');
          return res.status(403).json({
            error: 'Forbidden',
            message: 'You must be a member to invite others'
          });
        }

        // Check if invitee exists
        const invitee = db.prepare('SELECT display_name FROM users WHERE id = ?').get(userId);
        if (!invitee) {
          db.run('ROLLBACK');
          return res.status(404).json({
            error: 'Not Found',
            message: 'User not found'
          });
        }

        // Check if invitee is already member
        const existingMember = db.prepare(`
          SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?
        `).get(groupId, userId);

        if (existingMember) {
          db.run('ROLLBACK');
          return res.status(400).json({
            error: 'Bad Request',
            message: 'User is already a member of this group'
          });
        }

        // Check for existing invitation
        const existingInvite = db.prepare(`
          SELECT 1 FROM group_invitations 
          WHERE group_id = ? AND invitee_id = ? AND status = 'pending'
        `).get(groupId, userId);

        if (existingInvite) {
          db.run('ROLLBACK');
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invitation already sent'
          });
        }

        // Create invitation
        db.prepare(`
          INSERT INTO group_invitations (group_id, inviter_id, invitee_id)
          VALUES (?, ?, ?)
        `).run(groupId, req.user.id, userId);

        db.run('COMMIT');

        // Send notification
        const group = db.prepare('SELECT name FROM groups WHERE id = ?').get(groupId);
        const inviter = db.prepare('SELECT display_name FROM users WHERE id = ?').get(req.user.id);
        
        NotificationService.sendGroupInvitationNotification({
          groupId,
          groupName: group.name,
          inviterId: req.user.id,
          inviterName: inviter.display_name,
          inviteeId: userId
        });

        res.json({
          message: 'Invitation sent successfully'
        });
      } catch (error) {
        db.run('ROLLBACK');
        console.error('Invite to group error:', error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to send invitation'
        });
      }
    });
  }
}

module.exports = new GroupController(); 