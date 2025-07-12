import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Group, Newsflash, FriendRequest } from '../types';
import pushNotificationService from './pushNotification';
import * as Notifications from 'expo-notifications';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.132:3000/api/v1';

interface Database {
  users: User[];
  groups: Group[];
  newsflashes: Newsflash[];
  friendRequests: FriendRequest[];
}

class DatabaseService {
  private db: Database = {
    users: [],
    groups: [],
    newsflashes: [],
    friendRequests: [],
  };

  private authToken: string | null = null;

  async init() {
    try {
      // Check if we have a stored auth token
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        this.authToken = token;
        // Register push token if available
        await this.registerPushTokenIfNeeded();
      }
      
      // Initialize with mock data for now
      await this.initMockData();
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  }

  private async registerPushTokenIfNeeded() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted' && this.authToken) {
        const token = await Notifications.getExpoPushTokenAsync();
        if (token) {
          await pushNotificationService.registerPushToken(token.data, this.authToken);
        }
      }
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  private async initMockData() {
    // Initialize with mock data
    this.db = {
      users: [
        {
          id: '1',
          username: 'noa',
          email: 'noa@example.com',
          displayName: 'Noa Cohen',
          bio: 'Tech journalist covering the latest in innovation',
          profilePicture: 'https://i.pravatar.cc/150?u=noa',
          friends: ['2', '3'],
          groups: ['1'],
        },
        {
          id: '2',
          username: 'amir',
          email: 'amir@example.com',
          displayName: 'Amir Levi',
          bio: 'Sports reporter and fitness enthusiast',
          profilePicture: 'https://i.pravatar.cc/150?u=amir',
          friends: ['1'],
          groups: ['1'],
        },
        {
          id: '3',
          username: 'maya',
          email: 'maya@example.com',
          displayName: 'Maya Shapira',
          bio: 'Business and finance correspondent',
          profilePicture: 'https://i.pravatar.cc/150?u=maya',
          friends: ['1'],
          groups: ['2'],
        },
      ],
      groups: [
        {
          id: '1',
          name: 'Friends',
          members: ['1', '2'],
        },
        {
          id: '2',
          name: 'Work',
          members: ['1', '3'],
        },
      ],
      newsflashes: [],
      friendRequests: [],
    };

    await this.saveDatabase();
  }

  private async saveDatabase() {
    try {
      await AsyncStorage.setItem('database', JSON.stringify(this.db));
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  private async loadDatabase() {
    try {
      const data = await AsyncStorage.getItem('database');
      if (data) {
        this.db = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load database:', error);
    }
  }

  // Auth methods
  async login(username: string, password: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      // Store auth token
      this.authToken = data.token;
      await AsyncStorage.setItem('authToken', data.token);
      
      // Store current user
      await AsyncStorage.setItem('currentUser', JSON.stringify(data.user));
      
      // Register push token after successful login
      await this.registerPushTokenIfNeeded();

      return {
        id: data.user.id.toString(),
        username: data.user.username,
        email: data.user.email,
        displayName: data.user.display_name,
        bio: data.user.bio || '',
        profilePicture: data.user.profile_picture || `https://i.pravatar.cc/150?u=${data.user.username}`,
        friends: [],
        groups: [],
      };
    } catch (error) {
      console.error('Login error:', error);
      // Fallback to mock login for development
      await this.loadDatabase();
      const user = this.db.users.find(u => u.username === username);
      if (user) {
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      }
      return user || null;
    }
  }

  async logout(): Promise<void> {
    try {
      // Unregister push token
      if (this.authToken) {
        await pushNotificationService.unregisterPushToken(this.authToken);
      }
      
      // Clear auth data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('currentUser');
      this.authToken = null;
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async register(username: string, email: string, password: string, displayName: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, displayName }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      // Store auth token
      this.authToken = data.token;
      await AsyncStorage.setItem('authToken', data.token);
      
      // Store current user
      await AsyncStorage.setItem('currentUser', JSON.stringify(data.user));
      
      // Register push token after successful registration
      await this.registerPushTokenIfNeeded();

      return {
        id: data.user.id.toString(),
        username: data.user.username,
        email: data.user.email,
        displayName: data.user.display_name,
        bio: '',
        profilePicture: `https://i.pravatar.cc/150?u=${data.user.username}`,
        friends: [],
        groups: [],
      };
    } catch (error) {
      console.error('Registration error:', error);
      // Fallback to mock registration
      await this.loadDatabase();
      const newUser: User = {
        id: Date.now().toString(),
        username,
        email,
        displayName,
        bio: '',
        profilePicture: `https://i.pravatar.cc/150?u=${username}`,
        friends: [],
        groups: [],
      };
      this.db.users.push(newUser);
      await this.saveDatabase();
      await AsyncStorage.setItem('currentUser', JSON.stringify(newUser));
      return newUser;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        // Ensure all required properties are present
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          bio: user.bio || '',
          profilePicture: user.profilePicture || `https://i.pravatar.cc/150?u=${user.username}`,
          friends: user.friends || [],
          groups: user.groups || [],
        };
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
    }
    return null;
  }

  // User methods
  async getUser(userId: string): Promise<User | null> {
    await this.loadDatabase();
    return this.db.users.find(u => u.id === userId) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    await this.loadDatabase();
    return this.db.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    await this.loadDatabase();
    return this.db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.getUser(userId);
  }

  async getUsers(): Promise<User[]> {
    await this.loadDatabase();
    return this.db.users;
  }

  async createUser(userData: {
    username: string;
    email: string;
    displayName: string;
    password?: string;
  }): Promise<User> {
    await this.loadDatabase();
    const newUser: User = {
      id: Date.now().toString(),
      username: userData.username,
      email: userData.email,
      displayName: userData.displayName,
      bio: '',
      profilePicture: `https://i.pravatar.cc/150?u=${userData.username}`,
      friends: [],
      groups: [],
    };
    this.db.users.push(newUser);
    await this.saveDatabase();
    return newUser;
  }

  async setCurrentUser(user: User): Promise<void> {
    await AsyncStorage.setItem('currentUser', JSON.stringify(user));
  }

  async clearCurrentUser(): Promise<void> {
    await AsyncStorage.removeItem('currentUser');
  }

  async searchUsers(query: string): Promise<User[]> {
    if (this.authToken) {
      try {
        const response = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          return data.users.map((u: any) => ({
            id: u.id.toString(),
            username: u.username,
            displayName: u.display_name,
            profilePicture: u.profile_picture || `https://i.pravatar.cc/150?u=${u.username}`,
            bio: '',
            friends: [],
            groups: [],
          }));
        }
      } catch (error) {
        console.error('Search users error:', error);
      }
    }

    // Fallback to local search
    await this.loadDatabase();
    const currentUser = await this.getCurrentUser();
    return this.db.users.filter(u => 
      u.id !== currentUser?.id &&
      (u.username.toLowerCase().includes(query.toLowerCase()) ||
       u.displayName.toLowerCase().includes(query.toLowerCase()) ||
       u.email.toLowerCase().includes(query.toLowerCase()))
    );
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    await this.loadDatabase();
    const index = this.db.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      this.db.users[index] = { ...this.db.users[index], ...updates };
      await this.saveDatabase();
      
      const currentUser = await this.getCurrentUser();
      if (currentUser?.id === userId) {
        await AsyncStorage.setItem('currentUser', JSON.stringify(this.db.users[index]));
      }
    }
  }

  // Friend methods
  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<void> {
    if (this.authToken) {
      try {
        const response = await fetch(`${API_URL}/users/friends/request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`,
          },
          body: JSON.stringify({ receiverId: parseInt(toUserId) }),
        });

        if (response.ok) {
          return;
        }
      } catch (error) {
        console.error('Send friend request error:', error);
      }
    }

    // Fallback to local
    await this.loadDatabase();
    const request: FriendRequest = {
      id: Date.now().toString(),
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: new Date(),
    };
    this.db.friendRequests.push(request);
    await this.saveDatabase();
  }

  async createFriendRequest(fromUserId: string, toUserId: string): Promise<void> {
    return this.sendFriendRequest(fromUserId, toUserId);
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    if (this.authToken) {
      try {
        const response = await fetch(`${API_URL}/users/friends/request/${requestId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`,
          },
          body: JSON.stringify({ action: 'accept' }),
        });

        if (response.ok) {
          return;
        }
      } catch (error) {
        console.error('Accept friend request error:', error);
      }
    }

    // Fallback to local
    await this.loadDatabase();
    const request = this.db.friendRequests.find(r => r.id === requestId);
    if (request) {
      request.status = 'accepted';
      
      // Add to friends lists
      const fromUser = this.db.users.find(u => u.id === request.fromUserId);
      const toUser = this.db.users.find(u => u.id === request.toUserId);
      
      if (fromUser && toUser) {
        if (!fromUser.friends) fromUser.friends = [];
        if (!toUser.friends) toUser.friends = [];
        
        if (!fromUser.friends.includes(request.toUserId)) {
          fromUser.friends.push(request.toUserId);
        }
        if (!toUser.friends.includes(request.fromUserId)) {
          toUser.friends.push(request.fromUserId);
        }
      }
      
      await this.saveDatabase();
    }
  }

  async getFriendRequests(userId: string): Promise<FriendRequest[]> {
    await this.loadDatabase();
    return this.db.friendRequests.filter(r => 
      (r.toUserId === userId || r.fromUserId === userId) && r.status === 'pending'
    );
  }

  // Newsflash methods
  async createNewsflash(
    authorId: string,
    content: string,
    sections: string[],
    recipients: string[]
  ): Promise<Newsflash> {
    if (this.authToken) {
      try {
        const response = await fetch(`${API_URL}/newsflashes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`,
          },
          body: JSON.stringify({
            content,
            sections,
            recipients: recipients.map(id => parseInt(id)),
            groups: [], // Add group support later
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            id: data.newsflash.id.toString(),
            authorId: data.newsflash.author_id.toString(),
            content: data.newsflash.content,
            sections: data.newsflash.sections || [],
            recipients,
            createdAt: new Date(data.newsflash.created_at),
            likes: 0,
            comments: 0,
          };
        }
      } catch (error) {
        console.error('Create newsflash error:', error);
      }
    }

    // Fallback to local
    await this.loadDatabase();
    const newsflash: Newsflash = {
      id: Date.now().toString(),
      authorId,
      content,
      sections,
      recipients,
      createdAt: new Date(),
      likes: 0,
      comments: 0,
    };
    this.db.newsflashes.unshift(newsflash);
    await this.saveDatabase();
    return newsflash;
  }

  async getNewsflashes(userId: string): Promise<Newsflash[]> {
    if (this.authToken) {
      try {
        const response = await fetch(`${API_URL}/newsflashes/feed`, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          return data.newsflashes.map((n: any) => ({
            id: n.id.toString(),
            authorId: n.author_id.toString(),
            content: n.content,
            sections: n.sections || [],
            recipients: [],
            createdAt: new Date(n.created_at),
            likes: n.like_count || 0,
            comments: n.comment_count || 0,
            image: n.image,
          }));
        }
      } catch (error) {
        console.error('Get newsflashes error:', error);
      }
    }

    // Fallback to local
    await this.loadDatabase();
    const user = await this.getUser(userId);
    if (!user) return [];

    return this.db.newsflashes.filter(n => 
      n.recipients.includes('all') ||
      n.recipients.includes(userId) ||
      (user.groups && n.recipients.some(r => user.groups.includes(r))) ||
      n.authorId === userId ||
      (user.friends && user.friends.includes(n.authorId))
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getNewsflashesForUser(userId: string): Promise<Newsflash[]> {
    await this.loadDatabase();
    return this.db.newsflashes.filter(n => n.authorId === userId);
  }

  // Group methods
  async getGroups(): Promise<Group[]> {
    if (this.authToken) {
      try {
        const response = await fetch(`${API_URL}/groups`, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          return data.groups.map((g: any) => ({
            id: g.id.toString(),
            name: g.name,
            members: [], // Would need another API call to get members
          }));
        }
      } catch (error) {
        console.error('Get groups error:', error);
      }
    }

    // Fallback to local
    await this.loadDatabase();
    return this.db.groups;
  }

  // Test notification
  async testNotification(type: 'newsflash' | 'friend_request' | 'group_invitation'): Promise<void> {
    if (this.authToken) {
      await pushNotificationService.testNotification(type, this.authToken);
    } else {
      throw new Error('Not authenticated');
    }
  }
}

export default new DatabaseService(); 