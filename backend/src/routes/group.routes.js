const express = require('express');
const { body, param } = require('express-validator');
const groupController = require('../controllers/group.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { upload, processImage, cleanupFile } = require('../middleware/upload.middleware');

const router = express.Router();

// GET /api/v1/groups
router.get('/', authenticateToken, groupController.getGroups.bind(groupController));

// GET /api/v1/groups/:id
router.get('/:id',
  authenticateToken,
  param('id').isInt().withMessage('Invalid group ID'),
  handleValidationErrors,
  groupController.getGroup.bind(groupController)
);

// POST /api/v1/groups
router.post('/',
  authenticateToken,
  upload.single('profilePicture'),
  processImage({ width: 200, height: 200, folder: 'group' }),
  cleanupFile,
  [
    body('name')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Group name must be between 3 and 50 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Description cannot exceed 200 characters'),
    body('isPrivate')
      .optional()
      .isBoolean()
      .withMessage('isPrivate must be a boolean')
  ],
  handleValidationErrors,
  groupController.createGroup.bind(groupController)
);

// PUT /api/v1/groups/:id
router.put('/:id',
  authenticateToken,
  upload.single('profilePicture'),
  processImage({ width: 200, height: 200, folder: 'group' }),
  cleanupFile,
  [
    param('id').isInt().withMessage('Invalid group ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Group name must be between 3 and 50 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Description cannot exceed 200 characters')
  ],
  handleValidationErrors,
  groupController.updateGroup.bind(groupController)
);

// DELETE /api/v1/groups/:id
router.delete('/:id',
  authenticateToken,
  param('id').isInt().withMessage('Invalid group ID'),
  handleValidationErrors,
  (req, res) => {
    const groupId = req.params.id;

    try {
      // Check if user is creator
      const group = db.prepare(`
        SELECT creator_id FROM groups WHERE id = ?
      `).get(groupId);

      if (!group) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Group not found'
        });
      }

      if (group.creator_id !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only the group creator can delete the group'
        });
      }

      db.prepare('DELETE FROM groups WHERE id = ?').run(groupId);

      res.json({
        message: 'Group deleted successfully'
      });
    } catch (error) {
      console.error('Delete group error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete group'
      });
    }
  }
);

// POST /api/v1/groups/:id/invite
router.post('/:id/invite',
  authenticateToken,
  [
    param('id').isInt().withMessage('Invalid group ID'),
    body('userId').isInt().withMessage('Invalid user ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    const groupId = req.params.id;
    const { userId: inviteeId } = req.body;

    try {
      // Check if user is member of the group
      const membership = db.prepare(`
        SELECT role FROM group_members 
        WHERE group_id = ? AND user_id = ?
      `).get(groupId, req.user.id);

      if (!membership) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only group members can invite others'
        });
      }

      // Check if invitee is already a member
      const inviteeMembership = db.prepare(`
        SELECT 1 FROM group_members 
        WHERE group_id = ? AND user_id = ?
      `).get(groupId, inviteeId);

      if (inviteeMembership) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'User is already a member of this group'
        });
      }

      // Check if invitation already exists
      const existingInvite = db.prepare(`
        SELECT * FROM group_invitations 
        WHERE group_id = ? AND invitee_id = ?
      `).get(groupId, inviteeId);

      let invitationId;

      if (existingInvite) {
        if (existingInvite.status === 'pending') {
          return res.status(409).json({
            error: 'Conflict',
            message: 'Invitation already sent'
          });
        }

        // Update existing invitation
        db.prepare(`
          UPDATE group_invitations 
          SET status = 'pending', inviter_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(req.user.id, existingInvite.id);

        invitationId = existingInvite.id;
      } else {
        // Create new invitation
        const result = db.prepare(`
          INSERT INTO group_invitations (group_id, inviter_id, invitee_id)
          VALUES (?, ?, ?)
        `).run(groupId, req.user.id, inviteeId);

        invitationId = result.lastInsertRowid;
      }

      // Get group details for notification
      const group = db.prepare(`
        SELECT id, name FROM groups WHERE id = ?
      `).get(groupId);

      // Send notification
      await NotificationService.notifyGroupInvitation(group, req.user, inviteeId);

      res.status(201).json({
        message: 'Invitation sent successfully'
      });
    } catch (error) {
      console.error('Group invite error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to send invitation'
      });
    }
  }
);

// PUT /api/v1/groups/invitations/:id
router.put('/invitations/:id',
  authenticateToken,
  [
    param('id').isInt().withMessage('Invalid invitation ID'),
    body('action').isIn(['accept', 'reject']).withMessage('Invalid action')
  ],
  handleValidationErrors,
  (req, res) => {
    const invitationId = req.params.id;
    const { action } = req.body;

    db.serialize(() => {
      try {
        db.run('BEGIN TRANSACTION');

        // Get invitation details
        const invitation = db.prepare(`
          SELECT * FROM group_invitations 
          WHERE id = ? AND invitee_id = ? AND status = 'pending'
        `).get(invitationId, req.user.id);

        if (!invitation) {
          db.run('ROLLBACK');
          return res.status(404).json({
            error: 'Not Found',
            message: 'Invitation not found or already processed'
          });
        }

        // Update invitation status
        db.prepare(`
          UPDATE group_invitations 
          SET status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(action === 'accept' ? 'accepted' : 'rejected', invitationId);

        // If accepted, add user to group
        if (action === 'accept') {
          db.prepare(`
            INSERT INTO group_members (group_id, user_id, role)
            VALUES (?, ?, 'member')
          `).run(invitation.group_id, req.user.id);
        }

        db.run('COMMIT');

        res.json({
          message: `Invitation ${action}ed successfully`
        });
      } catch (error) {
        db.run('ROLLBACK');
        console.error('Invitation action error:', error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to process invitation'
        });
      }
    });
  }
);

// GET /api/v1/groups/invitations
router.get('/invitations', authenticateToken, (req, res) => {
  try {
    const invitations = db.prepare(`
      SELECT 
        gi.id,
        gi.status,
        gi.created_at,
        g.id as group_id,
        g.name as group_name,
        g.description as group_description,
        g.profile_picture as group_picture,
        u.id as inviter_id,
        u.display_name as inviter_name,
        u.profile_picture as inviter_picture
      FROM group_invitations gi
      INNER JOIN groups g ON gi.group_id = g.id
      INNER JOIN users u ON gi.inviter_id = u.id
      WHERE gi.invitee_id = ? AND gi.status = 'pending'
      ORDER BY gi.created_at DESC
    `).all(req.user.id);

    res.json({ invitations });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch invitations'
    });
  }
});

// DELETE /api/v1/groups/:id/leave
router.delete('/:id/leave',
  authenticateToken,
  param('id').isInt().withMessage('Invalid group ID'),
  handleValidationErrors,
  (req, res) => {
    const groupId = req.params.id;

    try {
      // Check if user is creator
      const group = db.prepare(`
        SELECT creator_id FROM groups WHERE id = ?
      `).get(groupId);

      if (group && group.creator_id === req.user.id) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Group creator cannot leave the group. Delete the group instead.'
        });
      }

      // Remove user from group
      const result = db.prepare(`
        DELETE FROM group_members 
        WHERE group_id = ? AND user_id = ?
      `).run(groupId, req.user.id);

      if (result.changes === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'You are not a member of this group'
        });
      }

      res.json({
        message: 'Left group successfully'
      });
    } catch (error) {
      console.error('Leave group error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to leave group'
      });
    }
  }
);

// PUT /api/v1/groups/:id/members/:userId/role
router.put('/:id/members/:userId/role',
  authenticateToken,
  [
    param('id').isInt().withMessage('Invalid group ID'),
    param('userId').isInt().withMessage('Invalid user ID'),
    body('role').isIn(['admin', 'member']).withMessage('Invalid role')
  ],
  handleValidationErrors,
  (req, res) => {
    const groupId = req.params.id;
    const targetUserId = req.params.userId;
    const { role } = req.body;

    try {
      // Check if user is admin
      const membership = db.prepare(`
        SELECT role FROM group_members 
        WHERE group_id = ? AND user_id = ?
      `).get(groupId, req.user.id);

      if (!membership || membership.role !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only group admins can change member roles'
        });
      }

      // Update target user's role
      const result = db.prepare(`
        UPDATE group_members 
        SET role = ?
        WHERE group_id = ? AND user_id = ?
      `).run(role, groupId, targetUserId);

      if (result.changes === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User is not a member of this group'
        });
      }

      res.json({
        message: 'Member role updated successfully'
      });
    } catch (error) {
      console.error('Update member role error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update member role'
      });
    }
  }
);

module.exports = router; 