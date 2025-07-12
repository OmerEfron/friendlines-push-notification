import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { Newsflash, User, Group } from '../types';
import { timeAgo } from '../utils/helpers';

interface NewsflashCardProps {
  newsflash: Newsflash;
  author: User;
  groups?: Group[];
  friends?: User[];
  isDarkMode: boolean;
  isFeatured?: boolean;
}

export const NewsflashCard: React.FC<NewsflashCardProps> = ({
  newsflash,
  author,
  groups = [],
  friends = [],
  isDarkMode,
  isFeatured = false,
}) => {
  const navigation = useNavigation<any>();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const handlePress = () => {
    // Navigate to full article view (future feature)
    navigation.navigate('Profile', { userId: author.id });
  };

  // For featured articles (first in feed)
  if (isFeatured) {
    return (
      <TouchableOpacity 
        style={[styles.featuredContainer, { backgroundColor: colors.secondary }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: `https://source.unsplash.com/800x400/?news,breaking,${newsflash.id}` }}
          style={styles.featuredImage}
        />
        <View style={styles.featuredContent}>
          {/* Category tags */}
          <View style={styles.categoryRow}>
            {groups.map(group => (
              <View
                key={`group-${group.id}`}
                style={[styles.categoryTag, { backgroundColor: group.color }]}
              >
                <Text style={styles.categoryText}>{group.name.toUpperCase()}</Text>
              </View>
            ))}
            <Text style={[styles.breakingBadge, { color: colors.accent }]}>
              BREAKING
            </Text>
          </View>

          {/* Headline */}
          <Text style={[styles.featuredHeadline, { color: colors.text }]}>
            {newsflash.text}
          </Text>

          {/* Byline */}
          <View style={styles.byline}>
            <Text style={[styles.bylineText, { color: colors.text }]}>
              By <Text style={styles.authorName}>{author.name}</Text>
            </Text>
            <Text style={[styles.dot, { color: colors.text }]}> • </Text>
            <Text style={[styles.timestamp, { color: colors.text }]}>
              {timeAgo(newsflash.created)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Regular news card (side-by-side layout)
  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.secondary }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.contentSection}>
        {/* Category */}
        {groups.length > 0 && (
          <Text style={[styles.category, { color: groups[0].color }]}>
            {groups[0].name.toUpperCase()}
          </Text>
        )}

        {/* Headline */}
        <Text 
          style={[styles.headline, { color: colors.text }]}
          numberOfLines={3}
        >
          {newsflash.text}
        </Text>

        {/* Meta info */}
        <View style={styles.metaRow}>
          <Text style={[styles.authorSmall, { color: colors.text }]}>
            {author.name}
          </Text>
          <Text style={[styles.timeSmall, { color: colors.text }]}>
            {timeAgo(newsflash.created)}
          </Text>
        </View>
      </View>

      {/* Thumbnail */}
      <Image
        source={{ uri: `https://source.unsplash.com/200x150/?news,${newsflash.id}` }}
        style={styles.thumbnail}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Featured article styles
  featuredContainer: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  featuredImage: {
    width: '100%',
    height: 220,
  },
  featuredContent: {
    padding: Spacing.lg,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 3,
    marginRight: Spacing.sm,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  breakingBadge: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  featuredHeadline: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: Spacing.sm,
    fontFamily: 'System',
  },
  byline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bylineText: {
    fontSize: 14,
    opacity: 0.7,
  },
  authorName: {
    fontWeight: '600',
  },
  dot: {
    opacity: 0.5,
  },
  timestamp: {
    fontSize: 14,
    opacity: 0.7,
  },

  // Regular article styles
  container: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  contentSection: {
    flex: 1,
    marginRight: Spacing.md,
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  headline: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: Spacing.sm,
    fontFamily: 'System',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorSmall: {
    fontSize: 13,
    opacity: 0.7,
  },
  timeSmall: {
    fontSize: 12,
    opacity: 0.6,
  },
  thumbnail: {
    width: 100,
    height: 80,
    borderRadius: BorderRadius.small,
    backgroundColor: '#f0f0f0',
  },
}); 