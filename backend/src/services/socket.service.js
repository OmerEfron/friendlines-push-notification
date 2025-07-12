const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

// Store active connections
const activeConnections = new Map();

const socketHandler = (io) => {
  // Authentication middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error'));
      }

      // Get user from database
      const user = db.prepare(`
        SELECT id, username, display_name, profile_picture 
        FROM users 
        WHERE id = ?
      `).get(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected`);
    
    // Add to active connections
    activeConnections.set(socket.userId, socket.id);
    
    // Join user's personal room
    socket.join(`user:${socket.userId}`);
    
    // Emit online status to friends
    emitToFriends(socket.userId, 'friend:online', {
      userId: socket.userId,
      username: socket.user.username
    });

    // Handle joining newsflash rooms for real-time comments
    socket.on('newsflash:join', (newsflashId) => {
      socket.join(`newsflash:${newsflashId}`);
    });

    socket.on('newsflash:leave', (newsflashId) => {
      socket.leave(`newsflash:${newsflashId}`);
    });

    // Handle typing indicators
    socket.on('typing:start', (data) => {
      socket.to(`newsflash:${data.newsflashId}`).emit('typing:user', {
        userId: socket.userId,
        username: socket.user.username,
        newsflashId: data.newsflashId
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`newsflash:${data.newsflashId}`).emit('typing:user:stop', {
        userId: socket.userId,
        newsflashId: data.newsflashId
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.username} disconnected`);
      
      // Remove from active connections
      activeConnections.delete(socket.userId);
      
      // Emit offline status to friends
      emitToFriends(socket.userId, 'friend:offline', {
        userId: socket.userId,
        username: socket.user.username
      });
    });
  });

  // Helper function to emit events to user's friends
  function emitToFriends(userId, event, data) {
    const friends = db.prepare(`
      SELECT friend_id FROM friends WHERE user_id = ?
    `).all(userId);

    friends.forEach(friend => {
      const socketId = activeConnections.get(friend.friend_id);
      if (socketId) {
        io.to(socketId).emit(event, data);
      }
    });
  }

  // Public methods for emitting events from other parts of the application
  return {
    // Emit new newsflash notification
    emitNewsflash: (newsflash, recipientIds) => {
      recipientIds.forEach(recipientId => {
        const socketId = activeConnections.get(recipientId);
        if (socketId) {
          io.to(socketId).emit('newsflash:new', newsflash);
        }
      });
    },

    // Emit new comment notification
    emitComment: (comment, newsflashAuthorId) => {
      // Notify newsflash author
      const socketId = activeConnections.get(newsflashAuthorId);
      if (socketId && comment.author_id !== newsflashAuthorId) {
        io.to(socketId).emit('comment:new', comment);
      }

      // Broadcast to users viewing the newsflash
      io.to(`newsflash:${comment.newsflash_id}`).emit('comment:live', comment);
    },

    // Emit friend request notification
    emitFriendRequest: (request, receiverId) => {
      const socketId = activeConnections.get(receiverId);
      if (socketId) {
        io.to(socketId).emit('friend:request', request);
      }
    },

    // Emit friend request accepted notification
    emitFriendAccepted: (senderId, acceptedBy) => {
      const socketId = activeConnections.get(senderId);
      if (socketId) {
        io.to(socketId).emit('friend:accepted', acceptedBy);
      }
    },

    // Get online friends
    getOnlineFriends: (userId) => {
      const friends = db.prepare(`
        SELECT friend_id FROM friends WHERE user_id = ?
      `).all(userId);

      return friends
        .filter(friend => activeConnections.has(friend.friend_id))
        .map(friend => friend.friend_id);
    },

    // Check if user is online
    isUserOnline: (userId) => {
      return activeConnections.has(userId);
    }
  };
};

module.exports = socketHandler; 