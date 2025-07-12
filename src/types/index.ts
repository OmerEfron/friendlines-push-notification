export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar: string;
  groups: number[];
  bio: string;
  friends: number[];
  createdAt: number;
}

export interface Group {
  id: number;
  name: string;
  color: string;
  members: number[];
  createdAt: number;
}

export interface Newsflash {
  id: number;
  userId: number;
  groupIds?: number[];
  friendIds?: number[];
  text: string;
  created: number;
}

export interface FriendRequest {
  id: number;
  fromUserId: number;
  toUserId: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface AppState {
  currentUser: User | null;
  theme: 'light' | 'dark';
} 