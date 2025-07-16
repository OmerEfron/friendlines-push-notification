import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, ImagePickerResponse, MediaType, ImageLibraryOptions } from 'react-native-image-picker';
import database from '../services/database';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../constants/theme';
import { User, Group } from '../types';

interface CreateNewsflashScreenProps {
  isDarkMode: boolean;
  onNewsflashCreated: (title: string, message: string) => void;
}

export const CreateNewsflashScreen: React.FC<CreateNewsflashScreenProps> = ({
  isDarkMode,
  onNewsflashCreated,
}) => {
  const navigation = useNavigation();
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const colors = isDarkMode ? Colors.dark : Colors.light;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await database.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      
      const allGroups = await database.getGroups();
      const userGroups = allGroups.filter(g => user.groups?.includes(g.id) || false);
      setGroups(userGroups);
      
      const allUsers = await database.getUsers();
      const userFriends = allUsers.filter((u: User) => user.friends?.includes(u.id) || false);
      setFriends(userFriends);
    }
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const pickImage = async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as any,
      includeBase64: false,
      maxWidth: 1200,
      maxHeight: 1200,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }
      
      if (response.errorCode) {
        if (response.errorCode === 'permission') {
          Alert.alert(
            'Permission Needed 📸',
            'Please allow access to your photos in Settings to add images to your posts.'
          );
        } else {
          Alert.alert('Error', 'Failed to pick image');
        }
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        if (imageUri) {
          setSelectedImage(imageUri);
        }
      }
    });
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      Alert.alert('Missing Content', 'Please write something to share!');
      return;
    }

    if (text.trim().length < 10) {
      Alert.alert('Too Short', 'Your message needs to be at least 10 characters long.');
      return;
    }

    if (selectedGroups.length === 0 && selectedFriends.length === 0) {
      Alert.alert('Select Recipients', 'Please select at least one group or friend to share with');
      return;
    }

    setIsLoading(true);

    try {
      const recipients: string[] = [...selectedFriends];
      
      const newsflash = await database.createNewsflash(
        currentUser!.id,
        text.trim(),
        [], // sections - empty for now
        recipients,
        selectedImage || undefined
      );

      onNewsflashCreated(
        'Posted Successfully! 🎉',
        `Your post has been shared with ${selectedGroups.length} groups and ${selectedFriends.length} friends.`
      );

      navigation.goBack();
    } catch (error) {
      console.error('Create newsflash error:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Share Your Thoughts</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            What's on your mind today? ✨
          </Text>
        </View>

        {/* Message Input */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Message</Text>
          <TextInput
            style={[
              styles.messageInput,
              {
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Share something interesting, funny, or inspiring..."
            placeholderTextColor={colors.secondaryText}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={280}
            textAlignVertical="top"
          />
          <View style={styles.inputFooter}>
            <Text style={[styles.charCount, { color: colors.secondaryText }]}>
              {text.length}/280
            </Text>
          </View>
        </View>

        {/* Image Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Photo (Optional)</Text>
          
          {selectedImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={removeImage}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.imagePickerButton, { borderColor: colors.border }]}
              onPress={pickImage}
            >
              <Text style={styles.imagePickerIcon}>📷</Text>
              <Text style={[styles.imagePickerText, { color: colors.text }]}>
                Add a photo to your post
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recipients Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Share With</Text>
          
          {/* Groups */}
          {groups.length > 0 && (
            <View style={styles.recipientCategory}>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>Groups</Text>
              <View style={styles.chipContainer}>
                {groups.map(group => (
                  <TouchableOpacity
                    key={group.id}
                    style={[
                      styles.chip,
                      selectedGroups.includes(group.id.toString()) && [
                        styles.chipSelected,
                        { backgroundColor: colors.accent }
                      ],
                      { borderColor: colors.border }
                    ]}
                    onPress={() => toggleGroup(group.id.toString())}
                  >
                    <Text style={[
                      styles.chipText,
                      { color: selectedGroups.includes(group.id.toString()) ? '#FFFFFF' : colors.text }
                    ]}>
                      {group.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Friends */}
          {friends.length > 0 && (
            <View style={styles.recipientCategory}>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>Friends</Text>
              <View style={styles.chipContainer}>
                {friends.map(friend => (
                  <TouchableOpacity
                    key={friend.id}
                    style={[
                      styles.chip,
                      selectedFriends.includes(friend.id.toString()) && [
                        styles.chipSelected,
                        { backgroundColor: colors.accent }
                      ],
                      { borderColor: colors.border }
                    ]}
                    onPress={() => toggleFriend(friend.id.toString())}
                  >
                    <Text style={[
                      styles.chipText,
                      { color: selectedFriends.includes(friend.id.toString()) ? '#FFFFFF' : colors.text }
                    ]}>
                      {friend.displayName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.accent },
            (isLoading || !text.trim()) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={isLoading || !text.trim()}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Posting...' : 'Share Post'}
          </Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  section: {
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.small,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: Colors.light.background,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.sm,
  },
  charCount: {
    ...Typography.caption,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.medium,
  },
  removeImageButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: BorderRadius.round,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePickerButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.medium,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
  imagePickerIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  imagePickerText: {
    ...Typography.body,
    textAlign: 'center',
  },
  recipientCategory: {
    marginBottom: Spacing.lg,
  },
  categoryTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    backgroundColor: Colors.light.background,
  },
  chipSelected: {
    borderColor: 'transparent',
  },
  chipText: {
    ...Typography.captionMedium,
  },
  submitButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadow.medium,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMedium,
  },
}); 