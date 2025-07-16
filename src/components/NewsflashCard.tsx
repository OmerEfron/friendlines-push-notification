import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../constants/theme';
import { Newsflash, User, Group } from '../types';
import { timeAgo } from '../utils/helpers';

interface NewsflashCardProps {
  newsflash: Newsflash;
  author: User;
  groups?: Group[];
  friends?: User[];
  isDarkMode: boolean;
  isFeatured?: boolean;
  onLike?: () => void;
  onComment?: () => void;
}

export const NewsflashCard: React.FC<NewsflashCardProps> = ({
  newsflash,
  author,
  groups = [],
  friends = [],
  isDarkMode,
  isFeatured = false,
  onLike,
  onComment,
}) => {
  const navigation = useNavigation<any>();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const handlePress = () => {
    navigation.navigate('Comments', { newsflashId: newsflash.id });
  };

  const handleAuthorPress = () => {
    navigation.navigate('Profile', { userId: author.id });
  };

  const handleShare = () => {
    // Handle share functionality
    console.log('Share newsflash:', newsflash.id);
  };

  return (
    <View style={[styles.cardContainer, { backgroundColor: colors.cardBackground }]}>
      {/* Post Image */}
      {newsflash.image && (
        <Image
          source={{ uri: newsflash.image }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      {/* Card Content */}
      <View style={styles.cardContent}>
        {/* Category/Group Tag */}
        {groups.length > 0 && (
          <View style={[styles.categoryTag, { backgroundColor: colors.accent + '20' }]}>
            <Text style={[styles.categoryText, { color: colors.accent }]}>
              {groups[0].name.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Post Title/Content */}
        <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
          <Text style={[styles.postTitle, { color: colors.text }]}>
            {newsflash.content}
          </Text>
        </TouchableOpacity>

        {/* Author and Time */}
        <View style={styles.authorSection}>
          <TouchableOpacity 
            onPress={handleAuthorPress} 
            activeOpacity={0.7}
            style={styles.authorInfo}
          >
            <View style={[styles.authorAvatar, { backgroundColor: colors.accent }]}>
              <Text style={styles.authorAvatarText}>
                {author.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.authorDetails}>
              <Text style={[styles.authorName, { color: colors.text }]}>
                {author.displayName}
              </Text>
              <Text style={[styles.postTime, { color: colors.secondaryText }]}>
                {timeAgo(newsflash.createdAt.getTime())}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.background }]}
            onPress={onLike}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>❤️</Text>
            <Text style={[styles.actionText, { color: colors.text }]}>
              Like
            </Text>
            {newsflash.likes > 0 && (
              <Text style={[styles.actionCount, { color: colors.secondaryText }]}>
                {newsflash.likes}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.background }]}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={[styles.actionText, { color: colors.text }]}>
              Share
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.background }]}
            onPress={onComment}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={[styles.actionText, { color: colors.text }]}>
              Comment
            </Text>
            {newsflash.comments > 0 && (
              <Text style={[styles.actionCount, { color: colors.secondaryText }]}>
                {newsflash.comments}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    ...Shadow.medium,
  },
  postImage: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: Spacing.lg,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.small,
    marginBottom: Spacing.sm,
  },
  categoryText: {
    ...Typography.small,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  postTitle: {
    ...Typography.h4,
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  authorSection: {
    marginBottom: Spacing.lg,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  authorAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    ...Typography.bodyMedium,
  },
  postTime: {
    ...Typography.caption,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.small,
    marginHorizontal: Spacing.xs,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  actionText: {
    ...Typography.captionMedium,
  },
  actionCount: {
    ...Typography.caption,
    marginLeft: Spacing.xs,
  },
}); 