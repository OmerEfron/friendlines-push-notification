import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Group, Newsflash, FriendRequest } from '../types';

const KEYS = {
  USERS: 'friendlines_users',
  GROUPS: 'friendlines_groups',
  NEWSFLASHES: 'friendlines_newsflashes',
  FRIEND_REQUESTS: 'friendlines_friend_requests',
  CURRENT_USER: 'friendlines_current_user',
};

class Database {
  // Initialize with mock data
  async init() {
    const hasData = await AsyncStorage.getItem(KEYS.USERS);
    if (!hasData) {
      await this.seedData();
    }
  }

  private async seedData() {
    const mockUsers: User[] = [
      {
        id: 1,
        username: "noa",
        name: "Noa Levi",
        email: "noa@example.com",
        avatar: "🦉",
        groups: [1, 2],
        bio: "Coffee lover. News junkie.",
        friends: [2, 3],
        createdAt: Date.now(),
      },
      {
        id: 2,
        username: "amir",
        name: "Amir Cohen",
        email: "amir@example.com",
        avatar: "🦁",
        groups: [1],
        bio: "Sports and tech.",
        friends: [1],
        createdAt: Date.now(),
      },
      {
        id: 3,
        username: "maya",
        name: "Maya Ben-David",
        email: "maya@example.com",
        avatar: "🦊",
        groups: [2],
        bio: "Travel & food.",
        friends: [1],
        createdAt: Date.now(),
      },
    ];

    const mockGroups: Group[] = [
      { id: 1, name: "Friends", color: "#e60000", members: [1, 2], createdAt: Date.now() },
      { id: 2, name: "Work", color: "#0077cc", members: [1, 3], createdAt: Date.now() },
    ];

    const mockNewsflashes: Newsflash[] = [
      {
        id: 1,
        userId: 2,
        groupIds: [1],
        text: "Big game tonight! Who's watching?",
        created: Date.now() - 1000 * 60 * 60,
      },
      {
        id: 2,
        userId: 1,
        groupIds: [2],
        text: "Project deadline moved to next week.",
        created: Date.now() - 1000 * 60 * 30,
      },
      {
        id: 3,
        userId: 3,
        groupIds: [2],
        text: "Lunch at the new place?",
        created: Date.now() - 1000 * 60 * 10,
      },
      {
        id: 4,
        userId: 1,
        friendIds: [2, 3],
        text: "Good morning everyone!",
        created: Date.now() - 1000 * 60 * 5,
      },
    ];

    await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(mockUsers));
    await AsyncStorage.setItem(KEYS.GROUPS, JSON.stringify(mockGroups));
    await AsyncStorage.setItem(KEYS.NEWSFLASHES, JSON.stringify(mockNewsflashes));
    await AsyncStorage.setItem(KEYS.FRIEND_REQUESTS, JSON.stringify([]));
  }

  // User operations
  async getUsers(): Promise<User[]> {
    const data = await AsyncStorage.getItem(KEYS.USERS);
    return data ? JSON.parse(data) : [];
  }

  async getUserById(id: number): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const users = await this.getUsers();
    const newUser: User = {
      ...user,
      id: Math.max(0, ...users.map(u => u.id)) + 1,
      createdAt: Date.now(),
      friends: [],
      groups: [],
    };
    users.push(newUser);
    await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    const users = await this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    users[index] = { ...users[index], ...updates };
    await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
    return users[index];
  }

  // Current user operations
  async getCurrentUser(): Promise<User | null> {
    const userId = await AsyncStorage.getItem(KEYS.CURRENT_USER);
    if (!userId) return null;
    const user = await this.getUserById(parseInt(userId));
    return user || null;
  }

  async setCurrentUser(user: User | null): Promise<void> {
    if (user) {
      await AsyncStorage.setItem(KEYS.CURRENT_USER, user.id.toString());
    } else {
      await AsyncStorage.removeItem(KEYS.CURRENT_USER);
    }
  }

  // Group operations
  async getGroups(): Promise<Group[]> {
    const data = await AsyncStorage.getItem(KEYS.GROUPS);
    return data ? JSON.parse(data) : [];
  }

  async getGroupById(id: number): Promise<Group | undefined> {
    const groups = await this.getGroups();
    return groups.find(g => g.id === id);
  }

  async updateGroup(id: number, updates: Partial<Group>): Promise<Group | null> {
    const groups = await this.getGroups();
    const index = groups.findIndex(g => g.id === id);
    if (index === -1) return null;
    
    groups[index] = { ...groups[index], ...updates };
    await AsyncStorage.setItem(KEYS.GROUPS, JSON.stringify(groups));
    return groups[index];
  }

  // Newsflash operations
  async getNewsflashes(): Promise<Newsflash[]> {
    const data = await AsyncStorage.getItem(KEYS.NEWSFLASHES);
    return data ? JSON.parse(data) : [];
  }

  async createNewsflash(newsflash: Omit<Newsflash, 'id' | 'created'>): Promise<Newsflash> {
    const newsflashes = await this.getNewsflashes();
    const newNewsflash: Newsflash = {
      ...newsflash,
      id: Math.max(0, ...newsflashes.map(n => n.id)) + 1,
      created: Date.now(),
    };
    newsflashes.push(newNewsflash);
    await AsyncStorage.setItem(KEYS.NEWSFLASHES, JSON.stringify(newsflashes));
    return newNewsflash;
  }

  async getNewsflashesForUser(userId: number): Promise<Newsflash[]> {
    const newsflashes = await this.getNewsflashes();
    const user = await this.getUserById(userId);
    if (!user) return [];

    return newsflashes.filter(flash => 
      flash.userId === userId ||
      (flash.groupIds && flash.groupIds.some(gid => user.groups.includes(gid))) ||
      (flash.friendIds && flash.friendIds.includes(userId))
    );
  }

  // Friend request operations
  async getFriendRequests(): Promise<FriendRequest[]> {
    const data = await AsyncStorage.getItem(KEYS.FRIEND_REQUESTS);
    return data ? JSON.parse(data) : [];
  }

  async createFriendRequest(fromUserId: number, toUserId: number): Promise<FriendRequest> {
    const requests = await this.getFriendRequests();
    
    // Check if request already exists
    const existing = requests.find(r => 
      (r.fromUserId === fromUserId && r.toUserId === toUserId) ||
      (r.fromUserId === toUserId && r.toUserId === fromUserId)
    );
    
    if (existing) {
      throw new Error('Friend request already exists');
    }

    const newRequest: FriendRequest = {
      id: Math.max(0, ...requests.map(r => r.id)) + 1,
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: Date.now(),
    };
    
    requests.push(newRequest);
    await AsyncStorage.setItem(KEYS.FRIEND_REQUESTS, JSON.stringify(requests));
    return newRequest;
  }

  async updateFriendRequest(id: number, status: 'accepted' | 'rejected'): Promise<void> {
    const requests = await this.getFriendRequests();
    const request = requests.find(r => r.id === id);
    if (!request) return;

    request.status = status;
    await AsyncStorage.setItem(KEYS.FRIEND_REQUESTS, JSON.stringify(requests));

    if (status === 'accepted') {
      // Add each user to the other's friends list
      const fromUser = await this.getUserById(request.fromUserId);
      const toUser = await this.getUserById(request.toUserId);
      
      if (fromUser && toUser) {
        await this.updateUser(fromUser.id, {
          friends: [...new Set([...fromUser.friends, toUser.id])],
        });
        await this.updateUser(toUser.id, {
          friends: [...new Set([...toUser.friends, fromUser.id])],
        });
      }
    }
  }

  async getPendingFriendRequestsForUser(userId: number): Promise<FriendRequest[]> {
    const requests = await this.getFriendRequests();
    return requests.filter(r => r.toUserId === userId && r.status === 'pending');
  }

  // Clear all data (for logout)
  async clearCurrentUser(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.CURRENT_USER);
  }
}

export default new Database(); 