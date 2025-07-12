const express = require('express');
const { body, param, query } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { upload, processImage, cleanupFile } = require('../middleware/upload.middleware');

const router = express.Router();

// GET /api/v1/users/profile/:id
router.get('/profile/:id', 
  param('id').isInt().withMessage('Invalid user ID'),
  handleValidationErrors,
  userController.getProfile.bind(userController)
);

// GET /api/v1/users/me
router.get('/me', authenticateToken, userController.getMe.bind(userController));

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
  userController.updateProfile.bind(userController)
);

// GET /api/v1/users/search
router.get('/search',
  authenticateToken,
  [
    query('q').trim().isLength({ min: 2 }).withMessage('Search query must be at least 2 characters')
  ],
  handleValidationErrors,
  userController.searchUsers.bind(userController)
);

// GET /api/v1/users/friends
router.get('/friends', authenticateToken, userController.getFriends.bind(userController));

// POST /api/v1/users/friends/request
router.post('/friends/request',
  authenticateToken,
  [
    body('receiverId').isInt().withMessage('Invalid receiver ID')
  ],
  handleValidationErrors,
  userController.sendFriendRequest.bind(userController)
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
    const { action } = req.body;
    
    if (action === 'accept') {
      return userController.acceptFriendRequest(req, res);
    } else {
      return userController.rejectFriendRequest(req, res);
    }
  }
);

// GET /api/v1/users/friends/requests
router.get('/friends/requests', authenticateToken, userController.getFriendRequests.bind(userController));

// DELETE /api/v1/users/friends/:id
router.delete('/friends/:id',
  authenticateToken,
  param('id').isInt().withMessage('Invalid friend ID'),
  handleValidationErrors,
  userController.removeFriend.bind(userController)
);

module.exports = router; 