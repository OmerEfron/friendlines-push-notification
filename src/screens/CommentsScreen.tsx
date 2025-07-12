import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import database from '../services/database';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { Newsflash, User } from '../types';

interface Comment {
  id: string;
  newsflashId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

interface CommentsScreenProps {
  isDarkMode: boolean;
}

export const CommentsScreen: React.FC<CommentsScreenProps> = ({ isDarkMode }) => {
  const route = useRoute<any>();
  const newsflashId = route.params?.newsflashId;
  
  const [newsflash, setNewsflash] = useState<Newsflash | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = isDarkMode ? Colors.dark : Colors.light;

  useEffect(() => {
    loadData();
  }, [newsflashId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await database.getCurrentUser();
      setCurrentUser(user);

      // Load newsflash
      const allNewsflashes = await database.getNewsflashes(user?.id || '');
      const foundNewsflash = allNewsflashes.find(n => n.id === newsflashId);
      setNewsflash(foundNewsflash || null);

      // Load comments (mock data for now)
      const mockComments: Comment[] = [
        {
          id: '1',
          newsflashId,
          authorId: '1',
          content: 'This is amazing! 🎉',
          createdAt: new Date(Date.now() - 1000 * 60 * 30),
        },
        {
          id: '2',
          newsflashId,
          authorId: '2',
          content: 'Love this update! Keep them coming 😊',
          createdAt: new Date(Date.now() - 1000 * 60 * 15),
        },
      ];
      setComments(mockComments);

      // Load users for comments
      const allUsers = await database.getUsers();
      const userMap: { [key: string]: User } = {};
      allUsers.forEach(u => {
        userMap[u.id] = u;
      });
      setUsers(userMap);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement comment API call
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        newsflashId,
        authorId: currentUser.id,
        content: newComment.trim(),
        createdAt: new Date(),
      };

      setComments([...comments, newCommentObj]);
      setNewComment('');
      
      // Update newsflash comment count
      if (newsflash) {
        setNewsflash({ ...newsflash, comments: newsflash.comments + 1 });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const author = users[item.authorId];
    if (!author) return null;

    return (
      <View style={[styles.commentContainer, { backgroundColor: colors.secondary }]}>
        {author.profilePicture ? (
          <Image source={{ uri: author.profilePicture }} style={styles.commentAvatar} />
        ) : (
          <Text style={styles.commentAvatarText}>👤</Text>
        )}
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={[styles.commentAuthor, { color: colors.text }]}>
              {author.displayName}
            </Text>
            <Text style={[styles.commentTime, { color: colors.text }]}>
              {timeAgo(item.createdAt.getTime())}
            </Text>
          </View>
          <Text style={[styles.commentText, { color: colors.text }]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No comments yet. Be the first! 💬
            </Text>
          </View>
        }
      />

      <View style={[styles.inputContainer, { backgroundColor: colors.secondary }]}>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.muted }]}
          placeholder="Add a comment..."
          placeholderTextColor={colors.text + '60'}
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={300}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: newComment.trim() ? colors.accent : colors.muted },
          ]}
          onPress={handleSubmitComment}
          disabled={!newComment.trim() || isSubmitting}
        >
          <Text style={styles.sendButtonText}>
            {isSubmitting ? '...' : '➤'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.md,
  },
  commentContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.medium,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.sm,
  },
  commentAvatarText: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  commentAuthor: {
    fontWeight: '600',
    fontSize: 14,
  },
  commentTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    opacity: 0.6,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 