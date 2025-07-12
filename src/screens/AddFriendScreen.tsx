import React, { useState } from 'react';
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
import database from '../services/database';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { validateEmail } from '../utils/helpers';
import { User } from '../types';

interface AddFriendScreenProps {
  isDarkMode: boolean;
}

export const AddFriendScreen: React.FC<AddFriendScreenProps> = ({ isDarkMode }) => {
  const [searchText, setSearchText] = useState('');
  const [searchType, setSearchType] = useState<'username' | 'email'>('username');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const colors = isDarkMode ? Colors.dark : Colors.light;

  React.useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const user = await database.getCurrentUser();
    setCurrentUser(user);
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      Alert.alert('Error', 'Please enter a username or email');
      return;
    }

    if (searchType === 'email' && !validateEmail(searchText)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      let foundUser: User | undefined;
      
      if (searchType === 'username') {
        foundUser = await database.getUserByUsername(searchText.trim());
      } else {
        foundUser = await database.getUserByEmail(searchText.trim().toLowerCase());
      }

      if (!foundUser) {
        Alert.alert('Not Found', `No user found with that ${searchType}`);
        return;
      }

      if (foundUser.id === currentUser?.id) {
        Alert.alert('Error', "You can't send a friend request to yourself");
        return;
      }

      if (currentUser?.friends.includes(foundUser.id)) {
        Alert.alert('Already Friends', `You're already friends with ${foundUser.name}`);
        return;
      }

      // Check if friend request already exists
      const requests = await database.getFriendRequests();
      const existingRequest = requests.find(r =>
        (r.fromUserId === currentUser?.id && r.toUserId === foundUser!.id) ||
        (r.fromUserId === foundUser!.id && r.toUserId === currentUser?.id)
      );

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          Alert.alert('Pending Request', 'A friend request is already pending');
        } else {
          Alert.alert('Request Exists', 'A friend request already exists');
        }
        return;
      }

      // Show confirmation
      Alert.alert(
        'Send Friend Request',
        `Send friend request to ${foundUser.name} (@${foundUser.username})?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send',
            onPress: async () => {
              try {
                await database.createFriendRequest(currentUser!.id, foundUser!.id);
                Alert.alert(
                  'Success',
                  `Friend request sent to ${foundUser!.name}`,
                  [{ text: 'OK', onPress: () => setSearchText('') }]
                );
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to send friend request');
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
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
        <Text style={[styles.title, { color: colors.text }]}>Add Friend</Text>
        
        <View style={styles.searchTypeContainer}>
          <TouchableOpacity
            style={[
              styles.searchTypeButton,
              searchType === 'username' && styles.searchTypeButtonActive,
              { borderColor: colors.border },
            ]}
            onPress={() => setSearchType('username')}
          >
            <Text
              style={[
                styles.searchTypeText,
                { color: searchType === 'username' ? colors.accent : colors.text },
              ]}
            >
              Username
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.searchTypeButton,
              searchType === 'email' && styles.searchTypeButtonActive,
              { borderColor: colors.border },
            ]}
            onPress={() => setSearchType('email')}
          >
            <Text
              style={[
                styles.searchTypeText,
                { color: searchType === 'email' ? colors.accent : colors.text },
              ]}
            >
              Email
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.muted,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder={`Enter ${searchType}`}
            placeholderTextColor={colors.text + '80'}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={searchType === 'email' ? 'email-address' : 'default'}
          />
        </View>

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
            {isLoading ? 'Searching...' : 'Search'}
          </Text>
        </TouchableOpacity>

        <View style={[styles.infoBox, { backgroundColor: colors.muted }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            How to add friends:
          </Text>
          <Text style={[styles.infoText, { color: colors.text }]}>
            • Search by their username or email
          </Text>
          <Text style={[styles.infoText, { color: colors.text }]}>
            • Send them a friend request
          </Text>
          <Text style={[styles.infoText, { color: colors.text }]}>
            • Once accepted, you can send newsflashes directly to them
          </Text>
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
    padding: Spacing.md,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.lg,
  },
  searchTypeContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  searchTypeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    alignItems: 'center',
  },
  searchTypeButtonActive: {
    borderColor: Colors.light.accent,
    backgroundColor: Colors.light.accent + '10',
  },
  searchTypeText: {
    ...Typography.body,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  input: {
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  searchButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
  },
  infoTitle: {
    ...Typography.body,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  infoText: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
}); 