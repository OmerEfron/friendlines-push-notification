export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  bio: string;
  profilePicture: string;
  friends: string[];
  groups: string[];
  
  // Legacy fields for compatibility
  name?: string;
  avatar?: string;
  createdAt?: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[];
  profilePicture?: string;
  
  // Legacy fields
  color?: string;
  createdAt?: number;
}

export interface Newsflash {
  id: string;
  authorId: string;
  content: string;
  sections: string[];
  recipients: string[];
  createdAt: Date;
  likes: number;
  comments: number;
  image?: string;
  
  // Legacy fields
  userId?: number;
  groupIds?: number[];
  friendIds?: number[];
  text?: string;
  created?: number;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface AppState {
  currentUser: User | null;
  theme: 'light' | 'dark';
} 