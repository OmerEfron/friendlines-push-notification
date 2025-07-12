import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import database from '../services/database';
import { NewsflashCard } from '../components/NewsflashCard';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { User, Group, Newsflash } from '../types';

interface ProfileScreenProps {
  isDarkMode: boolean;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ isDarkMode }) => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const userId = route.params?.userId;
  const isCurrentUser = route.params?.isCurrentUser || false;

  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newsflashes, setNewsflashes] = useState<Newsflash[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [bio, setBio] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);

  const colors = isDarkMode ? Colors.dark : Colors.light;

  useEffect(() => {
    loadData();
  }, [userId, isCurrentUser]);

  const loadData = async () => {
    const current = await database.getCurrentUser();
    setCurrentUser(current);

    let profileUser: User | null = null;
    if (isCurrentUser && current) {
      profileUser = current;
    } else if (userId) {
      profileUser = await database.getUser(userId);
    }

    if (profileUser) {
      setUser(profileUser);
      setBio(profileUser.bio);

      // Load user's newsflashes
      const userNewsflashes = await database.getNewsflashesForUser(profileUser.id);
      setNewsflashes(userNewsflashes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));

      // Load groups and users for newsflash display
      const allGroups = await database.getGroups();
      const users = await database.getUsers();
      setGroups(allGroups);
      setAllUsers(users);
    }
  };

  const handleSaveBio = async () => {
    if (!user || !isCurrentUser) return;

    try {
      await database.updateUser(user.id, { bio: bio.trim() });
      setUser({ ...user, bio: bio.trim() });
      setIsEditingBio(false);
      Alert.alert('Success', 'Bio updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update bio');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await database.logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' as never }],
            });
          },
        },
      ]
    );
  };

  const renderNewsflash = ({ item }: { item: Newsflash }) => {
    if (!user) return null;

    // Find groups that this newsflash was sent to
    const itemGroups = groups.filter(g => 
      item.recipients.some(recipientId => g.members.includes(recipientId))
    );
    
    // Find individual friends this was sent to
    const itemFriends = allUsers.filter(u => 
      item.recipients.includes(u.id)
    );

    return (
      <NewsflashCard
        newsflash={item}
        author={user}
        groups={itemGroups}
        friends={itemFriends}
        isDarkMode={isDarkMode}
      />
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Profile Header */}
      <View style={[styles.header, { backgroundColor: colors.secondary }]}>
        <Text style={styles.avatar}>👤</Text>
        <View style={styles.headerInfo}>
          <Text style={[styles.name, { color: colors.text }]}>{user.displayName}</Text>
          <Text style={[styles.username, { color: colors.text }]}>@{user.username}</Text>
          {!isEditingBio ? (
            <Text style={[styles.bio, { color: colors.text }]}>{user.bio || 'No bio yet'}</Text>
          ) : (
            <TextInput
              style={[
                styles.bioInput,
                {
                  backgroundColor: colors.muted,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="Enter your bio"
              placeholderTextColor={colors.text + '80'}
              maxLength={60}
              multiline
            />
          )}
        </View>
      </View>

      {/* Bio Edit Button */}
      {isCurrentUser && (
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.accent }]}
          onPress={isEditingBio ? handleSaveBio : () => setIsEditingBio(true)}
        >
          <Text style={styles.editButtonText}>
            {isEditingBio ? 'Save Bio' : 'Edit Bio'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Groups */}
      {user.groups && user.groups.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Groups</Text>
          <View style={styles.groupList}>
            {user.groups.map(gid => {
              const group = groups.find(g => g.id === gid);
              if (!group) return null;
              return (
                <View
                  key={group.id}
                  style={[styles.groupChip, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.groupChipText}>{group.name}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {newsflashes.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Newsflashes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {user.friends?.length || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Friends</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {user.groups?.length || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Groups</Text>
        </View>
      </View>

      {/* User's Newsflashes */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isCurrentUser ? 'My Newsflashes' : 'Newsflashes'}
        </Text>
        {newsflashes.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No newsflashes yet
          </Text>
        ) : (
          newsflashes.map(item => (
            <View key={item.id}>
              {renderNewsflash({ item })}
            </View>
          ))
        )}
      </View>

      {/* Logout Button */}
      {isCurrentUser && (
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.error }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutButtonText, { color: colors.error }]}>
            Logout
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    padding: Spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  avatar: {
    fontSize: 64,
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  username: {
    ...Typography.body,
    opacity: 0.7,
    marginBottom: Spacing.sm,
  },
  bio: {
    ...Typography.caption,
  },
  bioInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.small,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    minHeight: 50,
  },
  editButton: {
    margin: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  groupList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  groupChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  groupChipText: {
    color: '#fff',
    fontSize: 14,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h2,
  },
  statLabel: {
    ...Typography.caption,
    opacity: 0.7,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    opacity: 0.6,
    paddingVertical: Spacing.lg,
  },
  logoutButton: {
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontWeight: 'bold',
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
}); 