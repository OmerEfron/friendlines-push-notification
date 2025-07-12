import React, { useState, useEffect, useRef } from 'react';
import { View, useColorScheme, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { InAppNotification } from './src/components/InAppNotification';
import database from './src/services/database';
import socketService from './src/services/socket';
import { usePushNotifications } from './usePushNotifications';
import pushNotificationService from './src/services/pushNotification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export default function App() {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [notification, setNotification] = useState({
    visible: false,
    title: '',
    message: '',
  });
  
  const { expoPushToken, notification: pushNotification } = usePushNotifications();
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Initialize database with mock data
    database.init();
    
    // Connect socket when app starts if authenticated
    const connectSocket = async () => {
      const authToken = await AsyncStorage.getItem('authToken');
      if (authToken) {
        await socketService.connect();
      }
    };
    
    connectSocket();
    
    // Clean up on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    // Register push token when available
    const registerToken = async () => {
      if (expoPushToken) {
        try {
          // Get auth token from storage
          const authToken = await AsyncStorage.getItem('authToken');
          if (authToken) {
            await pushNotificationService.registerPushToken(expoPushToken.data, authToken);
            console.log('Push token registered:', expoPushToken.data);
          }
        } catch (error) {
          console.error('Failed to register push token:', error);
        }
      }
    };

    registerToken();
  }, [expoPushToken]);

  useEffect(() => {
    // Handle notification responses (when user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // Navigation will be handled within AppNavigator
      console.log('Notification tapped:', response);
    });

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  useEffect(() => {
    // Handle foreground notifications
    if (pushNotification) {
      console.log('Push notification received:', pushNotification);
      // Show in-app notification
      const title = pushNotification.request.content.title || 'New Notification';
      const body = pushNotification.request.content.body || '';
      handleNewsflashCreated(title, body);
    }
  }, [pushNotification]);

  useEffect(() => {
    // Set up socket event listeners
    socketService.on('onNewsflash', (newsflash: any) => {
      handleNewsflashCreated('New Newsflash! 📰', 'Someone shared something new!');
    });

    socketService.on('onFriendRequest', (request: any) => {
      handleNewsflashCreated('Friend Request! 👋', 'Someone wants to be your friend!');
    });

    socketService.on('onComment', (comment: any) => {
      handleNewsflashCreated('New Comment! 💬', 'Someone commented on your post!');
    });

    return () => {
      // Clean up listeners
      socketService.off('onNewsflash');
      socketService.off('onFriendRequest');
      socketService.off('onComment');
    };
  }, []);

  const handleNewsflashCreated = (title: string, message: string) => {
    setNotification({
      visible: true,
      title,
      message,
    });
  };

  const dismissNotification = () => {
    setNotification(prev => ({ ...prev, visible: false }));
  };

  return (
    <SafeAreaProvider>
      <StatusBar
        style={isDarkMode ? 'light' : 'dark'}
        backgroundColor={isDarkMode ? '#1a1a1a' : '#f5f5f5'}
        translucent={false}
      />
      
      <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5' }} edges={['top']}>
        <AppNavigator
          isDarkMode={isDarkMode}
          onNewsflashCreated={handleNewsflashCreated}
        />
      </SafeAreaView>
      
      <InAppNotification
        visible={notification.visible}
        title={notification.title}
        message={notification.message}
        onDismiss={dismissNotification}
        isDarkMode={isDarkMode}
      />
    </SafeAreaProvider>
  );
}
