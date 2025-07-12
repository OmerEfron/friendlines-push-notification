import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Newsflash, User } from '../types';

interface SocketEvents {
  onNewsflash?: (newsflash: any) => void;
  onFriendRequest?: (request: any) => void;
  onFriendAccepted?: (friend: any) => void;
  onComment?: (comment: any) => void;
  onLike?: (data: { newsflashId: string; likeCount: number }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private events: SocketEvents = {};
  private isConnected: boolean = false;
  
  async connect() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token, skipping socket connection');
        return;
      }

      // Use the same base URL as the API
      const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://192.168.1.132:3000';
      
      this.socket = io(baseUrl, {
        auth: {
          token,
        },
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
        this.isConnected = false;
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      // Listen for real-time events
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to connect socket:', error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Newsflash events
    this.socket.on('newsflash:new', (data) => {
      console.log('New newsflash received:', data);
      if (this.events.onNewsflash) {
        this.events.onNewsflash(data);
      }
    });

    // Friend request events
    this.socket.on('friend:request', (data) => {
      console.log('New friend request:', data);
      if (this.events.onFriendRequest) {
        this.events.onFriendRequest(data);
      }
    });

    this.socket.on('friend:accepted', (data) => {
      console.log('Friend request accepted:', data);
      if (this.events.onFriendAccepted) {
        this.events.onFriendAccepted(data);
      }
    });

    // Comment events
    this.socket.on('comment:new', (data) => {
      console.log('New comment:', data);
      if (this.events.onComment) {
        this.events.onComment(data);
      }
    });

    // Like events
    this.socket.on('like:update', (data) => {
      console.log('Like update:', data);
      if (this.events.onLike) {
        this.events.onLike(data);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Register event handlers
  on(event: keyof SocketEvents, handler: any) {
    this.events[event] = handler;
  }

  // Remove event handlers
  off(event: keyof SocketEvents) {
    delete this.events[event];
  }

  // Emit events to server
  emit(event: string, data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  // Join a room (for group-specific updates)
  joinRoom(room: string) {
    this.emit('join:room', { room });
  }

  // Leave a room
  leaveRoom(room: string) {
    this.emit('leave:room', { room });
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export default new SocketService(); 