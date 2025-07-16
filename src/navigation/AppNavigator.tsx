import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoginScreen } from '../screens/LoginScreen';
import { FeedScreen } from '../screens/FeedScreen';
import { CreateNewsflashScreen } from '../screens/CreateNewsflashScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AddFriendScreen } from '../screens/AddFriendScreen';
import { FriendRequestsScreen } from '../screens/FriendRequestsScreen';
import { CommentsScreen } from '../screens/CommentsScreen';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';

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
      <Text style={{ fontSize: focused ? 24 : 20, marginBottom: 2 }}>
        {icons[name] || '❓'}
      </Text>
    </View>
  );
};

const MainTabs = ({ isDarkMode, onNewsflashCreated }: AppNavigatorProps) => {
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.border,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 0),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          ...Shadow.medium,
        },
        tabBarLabelStyle: {
          ...Typography.small,
          fontWeight: '600',
          marginTop: -2,
        },
        headerShown: false,
        tabBarHideOnKeyboard: true,
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
        initialParams={{ isCurrentUser: true }}
      >
        {(props) => <ProfileScreen isDarkMode={isDarkMode} route={props.route} navigation={props.navigation} />}
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
            backgroundColor: colors.cardBackground,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            ...Typography.h4,
            color: colors.text,
          },
          headerBackTitleStyle: {
            ...Typography.body,
            color: colors.accent,
          },
          cardStyle: {
            backgroundColor: colors.background,
          },
          gestureEnabled: true,
          gestureDirection: 'horizontal',
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
          {(props) => <ProfileScreen isDarkMode={isDarkMode} route={props.route} navigation={props.navigation} />}
        </Stack.Screen>
        
        <Stack.Screen 
          name="FriendRequests" 
          options={{ 
            title: 'Friend Requests',
            headerBackTitle: 'Back',
          }}
        >
          {() => <FriendRequestsScreen isDarkMode={isDarkMode} />}
        </Stack.Screen>
        
        <Stack.Screen 
          name="Comments" 
          options={{ 
            title: 'Comments',
            headerBackTitle: 'Back',
          }}
        >
          {() => <CommentsScreen isDarkMode={isDarkMode} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 