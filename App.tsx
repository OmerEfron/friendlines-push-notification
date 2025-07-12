import React, { useState, useEffect } from 'react';
import { View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { InAppNotification } from './src/components/InAppNotification';
import database from './src/services/database';

export default function App() {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [notification, setNotification] = useState({
    visible: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    // Initialize database with mock data
    database.init();
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
