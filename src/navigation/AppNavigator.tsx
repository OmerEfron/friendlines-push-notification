import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { LoginScreen } from '../screens/LoginScreen';
import { FeedScreen } from '../screens/FeedScreen';
import { CreateNewsflashScreen } from '../screens/CreateNewsflashScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AddFriendScreen } from '../screens/AddFriendScreen';
import { Colors } from '../constants/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

interface AppNavigatorProps {
  isDarkMode: boolean;
  onNewsflashCreated: (title: string, message: string) => void;
}

const TabIcon = ({ name, focused, color }: { name: string; focused: boolean; color: string }) => {
  const icons: { [key: string]: string } = {
    Home: '🏠',
    Write: '✍️',
    Network: '🌐',
    Profile: '👤',
  };
  
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: focused ? 24 : 20 }}>{icons[name] || '❓'}</Text>
    </View>
  );
};

const MainTabs = ({ isDarkMode, onNewsflashCreated }: AppNavigatorProps) => {
  const colors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text + '60',
        tabBarStyle: {
          backgroundColor: colors.secondary,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        options={{ title: 'Home' }}
      >
        {() => <FeedScreen isDarkMode={isDarkMode} />}
      </Tab.Screen>
      
      <Tab.Screen 
        name="Write" 
        options={{ title: 'Write' }}
      >
        {() => <CreateNewsflashScreen isDarkMode={isDarkMode} onNewsflashCreated={onNewsflashCreated} />}
      </Tab.Screen>
      
      <Tab.Screen 
        name="Network" 
        options={{ title: 'Network' }}
      >
        {() => <AddFriendScreen isDarkMode={isDarkMode} />}
      </Tab.Screen>
      
      <Tab.Screen 
        name="Profile" 
        options={{ title: 'Profile' }}
      >
        {() => <ProfileScreen isDarkMode={isDarkMode} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC<AppNavigatorProps> = ({ isDarkMode, onNewsflashCreated }) => {
  const colors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.secondary,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          cardStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        
        <Stack.Screen 
          name="Main" 
          options={{ headerShown: false }}
        >
          {() => <MainTabs isDarkMode={isDarkMode} onNewsflashCreated={onNewsflashCreated} />}
        </Stack.Screen>
        
        <Stack.Screen 
          name="Profile" 
          options={{ 
            title: 'Profile',
            headerBackTitle: 'Back',
          }}
        >
          {() => <ProfileScreen isDarkMode={isDarkMode} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 