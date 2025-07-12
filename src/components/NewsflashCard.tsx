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

  // For featured/top post
  if (isFeatured) {
    return (
      <TouchableOpacity 
        style={[styles.featuredContainer, { backgroundColor: colors.secondary }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: newsflash.image || `https://source.unsplash.com/600x300/?friends,fun,social,${newsflash.id}` }}
          style={styles.featuredImage}
          resizeMode="cover"
        />
        <View style={styles.featuredContent}>
          {groups.length > 0 && (
            <Text style={[styles.featuredCategory, { color: colors.primary }]}>
              {groups[0].name.toUpperCase()}
            </Text>
          )}
          <Text style={[styles.featuredHeadline, { color: colors.text }]}>
            {newsflash.content}
          </Text>
          <View style={styles.featuredMeta}>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                handleAuthorPress();
              }} 
              activeOpacity={0.7}
            >
              <Text style={[styles.featuredAuthor, { color: colors.text }]}>
                {author.displayName}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.featuredTime, { color: colors.text }]}>
              {timeAgo(newsflash.createdAt.getTime())}
            </Text>
          </View>
          
          {/* Interaction buttons */}
          <View style={styles.featuredActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={(e) => {
                e.stopPropagation();
                if (onLike) onLike();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>❤️</Text>
              <Text style={[styles.actionText, { color: colors.text }]}>
                {newsflash.likes}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={(e) => {
                e.stopPropagation();
                if (onComment) onComment();
                navigation.navigate('Comments', { newsflashId: newsflash.id });
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={[styles.actionText, { color: colors.text }]}>
                {newsflash.comments}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Compact news card (Ynet style)
  return (
    <TouchableOpacity 
      style={[styles.compactContainer, { backgroundColor: colors.secondary }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Content area */}
      <View style={styles.compactContent}>
        {/* Category label at top */}
        {groups.length > 0 && (
          <Text style={[styles.compactCategory, { color: colors.primary }]}>
            {groups[0].name.toUpperCase()}
          </Text>
        )}
        
        {/* Headline */}
        <Text 
          style={[styles.compactHeadline, { color: colors.text }]}
          numberOfLines={3}
        >
          {newsflash.content}
        </Text>

        {/* Bottom row with author and time */}
        <View style={styles.compactMeta}>
          <View style={styles.compactAuthorTime}>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                handleAuthorPress();
              }} 
              activeOpacity={0.7}
            >
              <Text style={[styles.compactAuthor, { color: colors.text }]}>
                {author.displayName}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.compactTime, { color: colors.text }]}>
              {timeAgo(newsflash.createdAt.getTime())}
            </Text>
          </View>
          
          <View style={styles.compactActions}>
            <TouchableOpacity 
              style={styles.compactActionButton} 
              onPress={(e) => {
                e.stopPropagation();
                if (onLike) onLike();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>❤️</Text>
              <Text style={[styles.compactActionText, { color: colors.text }]}>
                {newsflash.likes}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.compactActionButton} 
              onPress={(e) => {
                e.stopPropagation();
                if (onComment) onComment();
                navigation.navigate('Comments', { newsflashId: newsflash.id });
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={[styles.compactActionText, { color: colors.text }]}>
                {newsflash.comments}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Small thumbnail on the right if image exists */}
      {(newsflash.image || !newsflash.image) && (
        <Image
          source={{ uri: newsflash.image || `https://source.unsplash.com/120x80/?friends,fun,${newsflash.id}` }}
          style={styles.compactThumbnail}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Featured article styles
  featuredContainer: {
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: 180,
  },
  featuredContent: {
    padding: 12,
  },
  featuredCategory: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  featuredHeadline: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 6,
  },
  featuredMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredAuthor: {
    fontSize: 12,
    opacity: 0.7,
  },
  featuredTime: {
    fontSize: 11,
    opacity: 0.6,
  },

  // Compact card styles (Ynet-like)
  compactContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    minHeight: 100,
  },
  compactContent: {
    flex: 1,
    paddingRight: 12,
    justifyContent: 'space-between',
  },
  compactCategory: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  compactHeadline: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
    flex: 1,
  },
  compactMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  compactAuthor: {
    fontSize: 11,
    opacity: 0.6,
  },
  compactTime: {
    fontSize: 11,
    opacity: 0.5,
  },
  compactThumbnail: {
    width: 120,
    height: 80,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  featuredActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  compactAuthorTime: {
    flex: 1,
  },
  compactActions: {
    flexDirection: 'row',
    gap: 12,
  },
  compactActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  compactActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 