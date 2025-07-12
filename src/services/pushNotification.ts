import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.132:3000/api/v1';

export interface NotificationData {
  type: 'newsflash' | 'friend_request' | 'friend_accepted' | 'group_invitation' | 'comment';
  newsflashId?: number;
  requestId?: number;
  groupId?: number;
  senderId?: number;
  userId?: number;
  commentId?: number;
}

class PushNotificationService {
  private token: string | null = null;

  /**
   * Register push token with backend
   */
  async registerPushToken(expoPushToken: string, authToken: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          pushToken: expoPushToken,
          platform: Platform.OS,
          deviceId: await this.getDeviceId()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to register push token');
      }

      // Store token locally
      await AsyncStorage.setItem('pushToken', expoPushToken);
      this.token = expoPushToken;
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  }

  /**
   * Unregister push token
   */
  async unregisterPushToken(authToken: string): Promise<void> {
    try {
      const pushToken = await AsyncStorage.getItem('pushToken');
      if (!pushToken) return;

      const response = await fetch(`${API_URL}/notifications/unregister-token`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          pushToken
        })
      });

      if (!response.ok) {
        throw new Error('Failed to unregister push token');
      }

      await AsyncStorage.removeItem('pushToken');
      this.token = null;
    } catch (error) {
      console.error('Error unregistering push token:', error);
    }
  }

  /**
   * Handle notification response (when user taps on notification)
   */
  handleNotificationResponse(
    response: Notifications.NotificationResponse,
    navigation: any
  ): void {
    const data = response.notification.request.content.data as unknown as NotificationData;

    switch (data.type) {
      case 'newsflash':
        if (data.newsflashId) {
          navigation.navigate('NewsflashDetail', { newsflashId: data.newsflashId });
        }
        break;

      case 'friend_request':
        navigation.navigate('FriendRequests');
        break;

      case 'friend_accepted':
        if (data.userId) {
          navigation.navigate('Profile', { userId: data.userId });
        }
        break;

      case 'group_invitation':
        navigation.navigate('GroupInvitations');
        break;

      case 'comment':
        if (data.newsflashId) {
          navigation.navigate('NewsflashDetail', { 
            newsflashId: data.newsflashId,
            scrollToComments: true 
          });
        }
        break;
    }
  }

  /**
   * Test push notifications
   */
  async testNotification(
    type: 'newsflash' | 'friend_request' | 'group_invitation',
    authToken: string
  ): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ type })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  /**
   * Get or generate device ID
   */
  private async getDeviceId(): Promise<string> {
    let deviceId = await AsyncStorage.getItem('deviceId');
    
    if (!deviceId) {
      // Generate a unique device ID
      deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('deviceId', deviceId);
    }

    return deviceId;
  }

  /**
   * Check if push token is registered
   */
  async isTokenRegistered(): Promise<boolean> {
    const token = await AsyncStorage.getItem('pushToken');
    return !!token;
  }

  /**
   * Get stored push token
   */
  async getStoredToken(): Promise<string | null> {
    return await AsyncStorage.getItem('pushToken');
  }
}

export default new PushNotificationService(); 