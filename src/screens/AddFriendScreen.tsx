import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import database from '../services/database';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { validateEmail } from '../utils/helpers';
import { User, FriendRequest } from '../types';

interface AddFriendScreenProps {
  isDarkMode: boolean;
}

export const AddFriendScreen: React.FC<AddFriendScreenProps> = ({ isDarkMode }) => {
  const navigation = useNavigation<any>();
  const [searchText, setSearchText] = useState('');
  const [searchType, setSearchType] = useState<'username' | 'email'>('username');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const colors = isDarkMode ? Colors.dark : Colors.light;

  React.useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const user = await database.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      const requests = await database.getFriendRequests(user.id);
      const pendingCount = requests.filter(r => r.toUserId === user.id && r.status === 'pending').length;
      setPendingRequestsCount(pendingCount);
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      Alert.alert('Oops! 😊', 'Please enter a username or email');
      return;
    }

    if (searchType === 'email' && !validateEmail(searchText)) {
      Alert.alert('Invalid Email 📧', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      let foundUser: User | null = null;
      
      if (searchType === 'username') {
        foundUser = await database.getUserByUsername(searchText.trim());
      } else {
        foundUser = await database.getUserByEmail(searchText.trim().toLowerCase());
      }

      if (!foundUser) {
        Alert.alert('Not Found', `No friend found with that ${searchType}`);
        return;
      }

      if (foundUser.id === currentUser?.id) {
        Alert.alert('Silly! 😄', "You can't connect with yourself!");
        return;
      }

      if (currentUser?.friends?.includes(foundUser.id)) {
        Alert.alert('Already Friends! 🤝', `You're already friends with ${foundUser.displayName}`);
        return;
      }

      // Check if friend request already exists
      const requests = await database.getFriendRequests(currentUser!.id);
      const existingRequest = requests.find(r =>
        (r.fromUserId === currentUser?.id && r.toUserId === foundUser!.id) ||
        (r.fromUserId === foundUser!.id && r.toUserId === currentUser?.id)
      );

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          Alert.alert('Waiting! ⏳', 'A friend request is already pending');
        } else {
          Alert.alert('Already Sent! 📬', 'A friend request already exists');
        }
        return;
      }

      // Show confirmation
      Alert.alert(
        'Send Friend Request? 🤝',
        `Want to be friends with ${foundUser.displayName} (@${foundUser.username})?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send Request! 🚀',
            onPress: async () => {
              try {
                await database.createFriendRequest(currentUser!.id, foundUser!.id);
                Alert.alert(
                  'Request Sent! 🎉',
                  `Friend request sent to ${foundUser!.displayName}`,
                  [{ text: 'Awesome!', onPress: () => setSearchText('') }]
                );
              } catch (error: any) {
                Alert.alert('Oops! 😅', error.message || 'Failed to send request');
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Oops! 😅', 'Something went wrong. Please try again!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Find Your Squad</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Connect with awesome people and grow your friend circle! 🌟
          </Text>
        </View>

        {/* Friend Requests Button */}
        {pendingRequestsCount > 0 && (
          <TouchableOpacity
            style={[styles.requestsButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('FriendRequests')}
          >
            <Text style={styles.requestsButtonText}>
              {pendingRequestsCount} Pending Friend Request{pendingRequestsCount > 1 ? 's' : ''} 🔔
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Search Type Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              searchType === 'username' && [styles.tabActive, { borderColor: colors.accent }],
            ]}
            onPress={() => setSearchType('username')}
          >
            <Text
              style={[
                styles.tabText,
                { color: searchType === 'username' ? colors.accent : colors.text },
              ]}
            >
              Username
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              searchType === 'email' && [styles.tabActive, { borderColor: colors.accent }],
            ]}
            onPress={() => setSearchType('email')}
          >
            <Text
              style={[
                styles.tabText,
                { color: searchType === 'email' ? colors.accent : colors.text },
              ]}
            >
              Email
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchSection}>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: colors.secondary,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder={`Enter ${searchType}`}
            placeholderTextColor={colors.text + '60'}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={searchType === 'email' ? 'email-address' : 'default'}
          />
          
          <TouchableOpacity
            style={[
              styles.searchButton,
              { backgroundColor: colors.accent },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleSearch}
            disabled={isLoading}
          >
            <Text style={styles.searchButtonText}>
              {isLoading ? '...' : '🔍'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Cards */}
        <View style={[styles.infoCard, { backgroundColor: colors.secondary }]}>
          <Text style={styles.infoIcon}>🎉</Text>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            Why Find Friends?
          </Text>
          <View style={styles.infoList}>
            <Text style={[styles.infoItem, { color: colors.text }]}>
              • Get fun updates from your favorite people
            </Text>
            <Text style={[styles.infoItem, { color: colors.text }]}>
              • Share your thoughts with specific friends
            </Text>
            <Text style={[styles.infoItem, { color: colors.text }]}>
              • Build your awesome friend circle
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    lineHeight: 22,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchSection: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchButton: {
    width: 50,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    fontSize: 20,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  infoList: {
    gap: Spacing.sm,
  },
  infoItem: {
    fontSize: 15,
    lineHeight: 22,
  },
  tipCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    flexDirection: 'row',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  tipBold: {
    fontWeight: '600',
  },
  requestsButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  requestsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 