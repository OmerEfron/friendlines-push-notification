import React, { useState, useEffect, useRef } from 'react';
import { View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { InAppNotification } from './src/components/InAppNotification';
import database from './src/services/database';
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
      />
      
      <View style={{ flex: 1 }}>
        <AppNavigator
          isDarkMode={isDarkMode}
          onNewsflashCreated={handleNewsflashCreated}
        />
        
        <InAppNotification
          visible={notification.visible}
          title={notification.title}
          message={notification.message}
          onDismiss={dismissNotification}
          isDarkMode={isDarkMode}
        />
      </View>
    </SafeAreaProvider>
  );
}
