import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import database from '../services/database';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { FriendRequest, User } from '../types';

interface FriendRequestsScreenProps {
  isDarkMode: boolean;
}

export const FriendRequestsScreen: React.FC<FriendRequestsScreenProps> = ({ isDarkMode }) => {
  const navigation = useNavigation<any>();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const colors = isDarkMode ? Colors.dark : Colors.light;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await database.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      await loadRequests(user.id);
    }
  };

  const loadRequests = async (userId: string) => {
    try {
      const allRequests = await database.getFriendRequests(userId);
      const receivedRequests = allRequests.filter(r => r.toUserId === userId);
      setRequests(receivedRequests);

      // Load user data for each request
      const userMap: { [key: string]: User } = {};
      for (const request of receivedRequests) {
        const user = await database.getUser(request.fromUserId);
        if (user) {
          userMap[request.fromUserId] = user;
        }
      }
      setUsers(userMap);
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (currentUser) {
      await loadRequests(currentUser.id);
    }
    setRefreshing(false);
  };

  const handleAccept = async (request: FriendRequest) => {
    setIsLoading(true);
    try {
      await database.acceptFriendRequest(request.id);
      Alert.alert('Success! 🎉', 'Friend request accepted');
      await loadRequests(currentUser!.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (request: FriendRequest) => {
    Alert.alert(
      'Reject Request?',
      'Are you sure you want to reject this friend request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // For now, just remove from local list
              setRequests(prev => prev.filter(r => r.id !== request.id));
              Alert.alert('Request Rejected', 'Friend request has been rejected');
            } catch (error) {
              Alert.alert('Error', 'Failed to reject friend request');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderRequest = ({ item }: { item: FriendRequest }) => {
    const user = users[item.fromUserId];
    if (!user) return null;

    return (
      <View style={[styles.requestCard, { backgroundColor: colors.secondary }]}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => navigation.navigate('Profile', { userId: user.id })}
        >
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
          ) : (
            <Text style={styles.avatarText}>👤</Text>
          )}
          <View style={styles.userDetails}>
            <Text style={[styles.displayName, { color: colors.text }]}>
              {user.displayName}
            </Text>
            <Text style={[styles.username, { color: colors.text }]}>
              @{user.username}
            </Text>
            {user.bio && (
              <Text style={[styles.bio, { color: colors.text }]} numberOfLines={2}>
                {user.bio}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: colors.success }]}
            onPress={() => handleAccept(item)}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rejectButton, { borderColor: colors.error }]}
            onPress={() => handleReject(item)}
            disabled={isLoading}
          >
            <Text style={[styles.rejectButtonText, { color: colors.error }]}>
              Reject
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Friend Requests
        </Text>
      </View>

      <FlatList
        data={requests}
        renderItem={renderRequest}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No pending friend requests
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    ...Typography.h3,
  },
  listContent: {
    padding: Spacing.md,
  },
  requestCard: {
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  username: {
    ...Typography.caption,
    opacity: 0.7,
    marginBottom: Spacing.xs,
  },
  bio: {
    ...Typography.caption,
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  acceptButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  rejectButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  rejectButtonText: {
    fontWeight: 'bold',
  },
  emptyContainer: {
    paddingVertical: Spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    opacity: 0.6,
  },
}); 