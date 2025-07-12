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
    Feed: '📰',
    Create: '✏️',
    Friends: '👥',
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
        tabBarInactiveTintColor: colors.text + '80',
        tabBarStyle: {
          backgroundColor: colors.secondary,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.secondary,
          borderBottomWidth: 2,
          borderBottomColor: colors.accent,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Feed" 
        options={{ title: 'Feed' }}
      >
        {() => <FeedScreen isDarkMode={isDarkMode} />}
      </Tab.Screen>
      
      <Tab.Screen 
        name="Create" 
        options={{ title: 'New Newsflash' }}
      >
        {() => <CreateNewsflashScreen isDarkMode={isDarkMode} onNewsflashCreated={onNewsflashCreated} />}
      </Tab.Screen>
      
      <Tab.Screen 
        name="Friends" 
        options={{ title: 'Add Friends' }}
      >
        {() => <AddFriendScreen isDarkMode={isDarkMode} />}
      </Tab.Screen>
      
      <Tab.Screen 
        name="Profile" 
        options={{ title: 'My Profile' }}
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
          },
          headerTintColor: colors.text,
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
          options={{ title: 'Profile' }}
        >
          {() => <ProfileScreen isDarkMode={isDarkMode} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 