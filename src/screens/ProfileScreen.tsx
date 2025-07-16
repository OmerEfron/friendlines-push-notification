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
  Image,
} from 'react-native';
import { useRoute, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import { launchImageLibrary, ImagePickerResponse, MediaType, ImageLibraryOptions } from 'react-native-image-picker';
import database from '../services/database';
import { NewsflashCard } from '../components/NewsflashCard';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../constants/theme';
import { User, Group, Newsflash } from '../types';

interface ProfileScreenProps {
  isDarkMode: boolean;
  route?: RouteProp<any>;
  navigation?: NavigationProp<any>;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ isDarkMode, route: propRoute, navigation: propNavigation }) => {
  const navRoute = useRoute<any>();
  const navNavigation = useNavigation();
  
  // Use prop route/navigation if provided, otherwise use hooks
  const route = propRoute || navRoute;
  const navigation = propNavigation || navNavigation;
  
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
    } else if (!isCurrentUser && !userId && current) {
      profileUser = current;
    }

    if (profileUser) {
      setUser(profileUser);
      setBio(profileUser.bio);

      const userNewsflashes = await database.getNewsflashesForUser(profileUser.id);
      setNewsflashes(userNewsflashes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));

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

  const pickProfilePicture = async () => {
    if (!isCurrentUser) return;

    const options: ImageLibraryOptions = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as any,
      includeBase64: false,
      maxWidth: 500,
      maxHeight: 500,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }
      
      if (response.errorCode) {
        if (response.errorCode === 'permission') {
          Alert.alert(
            'Permission Needed',
            'Please allow access to your photos in Settings to change your profile picture.'
          );
        } else {
          Alert.alert('Error', 'Failed to pick image');
        }
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        if (imageUri) {
          try {
            database.updateUser(user!.id, { profilePicture: imageUri });
            setUser({ ...user!, profilePicture: imageUri });
            Alert.alert('Success', 'Profile picture updated successfully');
          } catch (error) {
            Alert.alert('Error', 'Failed to update profile picture');
          }
        }
      }
    });
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

    const itemGroups = groups.filter(g => 
      item.recipients.some(recipientId => g.members.includes(recipientId))
    );
    
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
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity 
          onPress={isCurrentUser ? pickProfilePicture : undefined} 
          disabled={!isCurrentUser}
          style={styles.profilePictureContainer}
        >
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
          ) : (
            <View style={[styles.avatarContainer, { backgroundColor: colors.accent }]}>
              <Text style={styles.avatarText}>
                {user.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isCurrentUser && (
            <View style={styles.editProfilePictureOverlay}>
              <Text style={styles.editProfilePictureText}>📷</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={[styles.name, { color: colors.text }]}>{user.displayName}</Text>
          <Text style={[styles.username, { color: colors.secondaryText }]}>@{user.username}</Text>
          
          {!isEditingBio ? (
            <Text style={[styles.bio, { color: colors.text }]}>
              {user.bio || 'No bio yet'}
            </Text>
          ) : (
            <View style={styles.bioEditContainer}>
              <TextInput
                style={[
                  styles.bioInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={bio}
                onChangeText={setBio}
                placeholder="Enter your bio"
                placeholderTextColor={colors.secondaryText}
                maxLength={120}
                multiline
              />
              <Text style={[styles.bioCharCount, { color: colors.secondaryText }]}>
                {bio.length}/120
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {isCurrentUser && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            onPress={isEditingBio ? handleSaveBio : () => setIsEditingBio(true)}
          >
            <Text style={styles.actionButtonText}>
              {isEditingBio ? 'Save Bio' : 'Edit Bio'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={[styles.statsContainer, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {newsflashes.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Posts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {user.friends?.length || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Friends</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {user.groups?.length || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Groups</Text>
        </View>
      </View>

      {/* Groups */}
      {user.groups && user.groups.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Groups</Text>
          <View style={styles.groupList}>
            {user.groups.map(gid => {
              const group = groups.find(g => g.id === gid);
              if (!group) return null;
              return (
                <View
                  key={group.id}
                  style={[styles.groupChip, { backgroundColor: colors.accent + '20' }]}
                >
                  <Text style={[styles.groupChipText, { color: colors.accent }]}>
                    {group.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* User's Posts */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isCurrentUser ? 'My Posts' : 'Posts'}
        </Text>
        {newsflashes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              No posts yet! Share something fun! 🎉
            </Text>
          </View>
        ) : (
          <View style={styles.postsContainer}>
            {newsflashes.map(item => (
              <View key={item.id} style={styles.postItem}>
                {renderNewsflash({ item })}
              </View>
            ))}
          </View>
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
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.large,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    ...Shadow.small,
  },
  profilePictureContainer: {
    position: 'relative',
    marginRight: Spacing.lg,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '600',
  },
  editProfilePictureOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: BorderRadius.round,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editProfilePictureText: {
    fontSize: 14,
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
    marginBottom: Spacing.sm,
  },
  bio: {
    ...Typography.body,
    lineHeight: 20,
  },
  bioEditContainer: {
    flex: 1,
  },
  bioInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    minHeight: 60,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  bioCharCount: {
    ...Typography.caption,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  actionButtons: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  actionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    ...Shadow.small,
  },
  actionButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMedium,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.large,
    ...Shadow.small,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
    marginVertical: Spacing.sm,
  },
  statValue: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.large,
    ...Shadow.small,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  groupList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  groupChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
  },
  groupChipText: {
    ...Typography.captionMedium,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
  },
  postsContainer: {
    marginTop: Spacing.sm,
  },
  postItem: {
    marginBottom: Spacing.md,
  },
  logoutButton: {
    margin: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    alignItems: 'center',
  },
  logoutButtonText: {
    ...Typography.bodyMedium,
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
}); 