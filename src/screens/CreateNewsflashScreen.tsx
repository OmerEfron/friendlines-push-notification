import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
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
      Alert.alert('Error', 'Please enter some text');
      return;
    }

    if (selectedGroups.length === 0 && selectedFriends.length === 0) {
      Alert.alert('Error', 'Please select at least one group or friend');
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
        'Newsflash Created!',
        `Your newsflash has been sent to ${selectedGroups.length} groups and ${selectedFriends.length} friends.`
      );

      // Navigate back
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create newsflash');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>Create Newsflash</Text>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Text</Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.muted,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="What's happening?"
          placeholderTextColor={colors.text + '80'}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={180}
        />
        <Text style={[styles.charCount, { color: colors.text }]}>
          {text.length}/180
        </Text>
      </View>

      {groups.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Send to Groups</Text>
          <View style={styles.optionsList}>
            {groups.map(group => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.option,
                  selectedGroups.includes(group.id) && styles.optionSelected,
                  { borderColor: colors.border },
                ]}
                onPress={() => toggleGroup(group.id)}
              >
                <View
                  style={[styles.checkbox, selectedGroups.includes(group.id) && styles.checkboxSelected]}
                />
                <Text style={[styles.optionText, { color: colors.text }]}>
                  {group.name}
                </Text>
                <View
                  style={[styles.colorIndicator, { backgroundColor: group.color }]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {friends.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Send to Friends</Text>
          <View style={styles.optionsList}>
            {friends.map(friend => (
              <TouchableOpacity
                key={friend.id}
                style={[
                  styles.option,
                  selectedFriends.includes(friend.id) && styles.optionSelected,
                  { borderColor: colors.border },
                ]}
                onPress={() => toggleFriend(friend.id)}
              >
                <View
                  style={[styles.checkbox, selectedFriends.includes(friend.id) && styles.checkboxSelected]}
                />
                <Text style={[styles.optionText, { color: colors.text }]}>
                  {friend.name}
                </Text>
                <Text style={styles.friendAvatar}>{friend.avatar}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: colors.accent },
          isLoading && styles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.submitButtonText}>Post</Text>
      </TouchableOpacity>
    </ScrollView>
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
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.body,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    borderWidth: 1,
  },
  charCount: {
    ...Typography.caption,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  optionsList: {
    gap: Spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  optionSelected: {
    borderColor: Colors.light.accent,
    backgroundColor: Colors.light.accent + '10',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.light.border,
    marginRight: Spacing.sm,
  },
  checkboxSelected: {
    backgroundColor: Colors.light.accent,
    borderColor: Colors.light.accent,
  },
  optionText: {
    ...Typography.body,
    flex: 1,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  friendAvatar: {
    fontSize: 24,
  },
  submitButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 