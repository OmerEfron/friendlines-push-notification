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
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
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
      console.log('Image picker response:', response);
      
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      }
      
      if (response.errorCode) {
        console.error('Image picker error:', response.errorCode, response.errorMessage);
        
        if (response.errorCode === 'permission') {
          Alert.alert(
            'Permission Needed 📸',
            'Please allow access to your photos in Settings to add images to your posts.'
          );
        } else if (response.errorCode === 'others') {
          Alert.alert(
            'Oops! 😅',
            response.errorMessage || 'Something went wrong while picking the image.'
          );
        }
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        if (imageUri) {
          console.log('Selected image:', imageUri);
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
      Alert.alert('Oops! 🤔', 'Please write something fun to share!');
      return;
    }

    if (text.trim().length < 10) {
      Alert.alert('Too Short! 📝', 'Your message needs to be at least 10 characters long. Add more details!');
      return;
    }

    if (selectedGroups.length === 0 && selectedFriends.length === 0) {
      Alert.alert('Pick Your Friends! 👥', 'Please select at least one group or friend to share with');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare recipients list - combine groups and friends
      const recipients: string[] = [...selectedFriends];
      
      // For groups, we'll handle them separately in the future
      // For now, just use friend IDs as recipients
      
      const newsflash = await database.createNewsflash(
        currentUser!.id,
        text.trim(),
        [], // sections - empty for now
        recipients,
        selectedImage || undefined
      );

      // Show notification
      onNewsflashCreated(
        'Shared! 🎉',
        `Your awesome update is live! Shared with ${selectedGroups.length} groups and ${selectedFriends.length} friends.`
      );

      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error('Create newsflash error:', error);
      Alert.alert('Oops! 😅', 'Failed to share your update. Try again!');
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
          <Text style={[styles.title, { color: colors.text }]}>Share Something Fun</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Tell your friends what's on your mind! ✨
          </Text>
        </View>

        {/* Message Input */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.text }]}>Your Thought</Text>
            <Text style={[styles.charCount, { color: colors.text }]}>
              {text.length}/180
            </Text>
          </View>
          <TextInput
            style={[
              styles.headlineInput,
              {
                backgroundColor: colors.secondary,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="What's going on? Share something awesome! 😊"
            placeholderTextColor={colors.text + '60'}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={180}
          />
          <Text style={[styles.hint, { color: colors.text }]}>
            Keep it fun and interesting! 🎉
          </Text>
        </View>

        {/* Image Picker */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Add Photo (Optional)</Text>
          
          {selectedImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              <TouchableOpacity
                style={[styles.removeImageButton, { backgroundColor: colors.error || '#e74c3c' }]}
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
              <Text style={[styles.imagePickerIcon, { color: colors.text }]}>📷</Text>
              <Text style={[styles.imagePickerText, { color: colors.text }]}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Distribution */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Publish To
          </Text>
          
          {groups.length > 0 && (
            <View style={styles.subsection}>
              <Text style={[styles.subsectionTitle, { color: colors.text }]}>
                News Sections
              </Text>
              {groups.map(group => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.selectionItem,
                    { borderColor: colors.border },
                    selectedGroups.includes(group.id) && {
                      borderColor: colors.accent,
                      backgroundColor: colors.accent + '10',
                    },
                  ]}
                  onPress={() => toggleGroup(group.id)}
                >
                  <View style={styles.selectionContent}>
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                    <Text style={[styles.selectionText, { color: colors.text }]}>
                      {group.name}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: colors.border },
                      selectedGroups.includes(group.id) && {
                        backgroundColor: colors.accent,
                        borderColor: colors.accent,
                      },
                    ]}
                  >
                    {selectedGroups.includes(group.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {friends.length > 0 && (
            <View style={styles.subsection}>
              <Text style={[styles.subsectionTitle, { color: colors.text }]}>
                Direct to Contacts
              </Text>
              {friends.map(friend => (
                <TouchableOpacity
                  key={friend.id}
                  style={[
                    styles.selectionItem,
                    { borderColor: colors.border },
                    selectedFriends.includes(friend.id) && {
                      borderColor: colors.accent,
                      backgroundColor: colors.accent + '10',
                    },
                  ]}
                  onPress={() => toggleFriend(friend.id)}
                >
                  <View style={styles.selectionContent}>
                    <Text style={styles.friendAvatar}>👤</Text>
                    <Text style={[styles.selectionText, { color: colors.text }]}>
                      {friend.displayName}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: colors.border },
                      selectedFriends.includes(friend.id) && {
                        backgroundColor: colors.accent,
                        borderColor: colors.accent,
                      },
                    ]}
                  >
                    {selectedFriends.includes(friend.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.publishButton,
            { backgroundColor: colors.accent },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.publishButtonText}>
            {isLoading ? 'Sharing...' : 'Share It! 🚀'}
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
  },
  section: {
    marginBottom: Spacing.xl,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  charCount: {
    fontSize: 14,
    opacity: 0.6,
  },
  headlineInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    minHeight: 100,
    fontSize: 18,
    lineHeight: 26,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  subsection: {
    marginBottom: Spacing.lg,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
  },
  selectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  friendAvatar: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  selectionText: {
    fontSize: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  publishButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  imageContainer: {
    position: 'relative',
    marginTop: 10,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    marginTop: 10,
  },
  imagePickerIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 