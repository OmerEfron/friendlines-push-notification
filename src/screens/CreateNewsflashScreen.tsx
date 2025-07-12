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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
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
      const userGroups = allGroups.filter(g => user.groups.includes(g.id));
      setGroups(userGroups);
      
      const allUsers = await database.getUsers();
      const userFriends = allUsers.filter(u => user.friends.includes(u.id));
      setFriends(userFriends);
    }
  };

  const toggleGroup = (groupId: number) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleFriend = (friendId: number) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      Alert.alert('Missing Headline', 'Please write your news headline');
      return;
    }

    if (selectedGroups.length === 0 && selectedFriends.length === 0) {
      Alert.alert('Select Audience', 'Please select at least one section or contact');
      return;
    }

    setIsLoading(true);

    try {
      const newsflash = await database.createNewsflash({
        userId: currentUser!.id,
        text: text.trim(),
        groupIds: selectedGroups.length > 0 ? selectedGroups : undefined,
        friendIds: selectedFriends.length > 0 ? selectedFriends : undefined,
      });

      // Show notification
      onNewsflashCreated(
        'Published!',
        `Your headline has been published to ${selectedGroups.length} sections and ${selectedFriends.length} contacts.`
      );

      // Navigate back
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to publish headline');
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
          <Text style={[styles.title, { color: colors.text }]}>Write Headline</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Share breaking news with your network
          </Text>
        </View>

        {/* Headline Input */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.text }]}>Headline</Text>
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
            placeholder="Enter your news headline..."
            placeholderTextColor={colors.text + '60'}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={180}
          />
          <Text style={[styles.hint, { color: colors.text }]}>
            Make it concise and attention-grabbing
          </Text>
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
                        { backgroundColor: group.color },
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
                    <Text style={styles.friendAvatar}>{friend.avatar}</Text>
                    <Text style={[styles.selectionText, { color: colors.text }]}>
                      {friend.name}
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
            {isLoading ? 'Publishing...' : 'Publish Headline'}
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
}); 