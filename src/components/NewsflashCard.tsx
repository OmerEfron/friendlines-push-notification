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
    navigation.navigate('Profile', { userId: author.id });
  };

  // For featured/top article
  if (isFeatured) {
    return (
      <TouchableOpacity 
        style={[styles.featuredContainer, { backgroundColor: colors.secondary }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: `https://source.unsplash.com/600x300/?news,breaking,${newsflash.id}` }}
          style={styles.featuredImage}
        />
        <View style={styles.featuredContent}>
          {groups.length > 0 && (
            <Text style={[styles.featuredCategory, { color: groups[0].color }]}>
              {groups[0].name.toUpperCase()}
            </Text>
          )}
          <Text style={[styles.featuredHeadline, { color: colors.text }]}>
            {newsflash.text}
          </Text>
          <View style={styles.featuredMeta}>
            <Text style={[styles.featuredAuthor, { color: colors.text }]}>
              {author.name}
            </Text>
            <Text style={[styles.featuredTime, { color: colors.text }]}>
              {timeAgo(newsflash.created)}
            </Text>
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
      {/* Category label at top */}
      {groups.length > 0 && (
        <Text style={[styles.compactCategory, { color: groups[0].color }]}>
          {groups[0].name.toUpperCase()}
        </Text>
      )}
      
      {/* Headline */}
      <Text 
        style={[styles.compactHeadline, { color: colors.text }]}
        numberOfLines={3}
      >
        {newsflash.text}
      </Text>

      {/* Bottom row with author and time */}
      <View style={styles.compactMeta}>
        <Text style={[styles.compactAuthor, { color: colors.text }]}>
          {author.name}
        </Text>
        <Text style={[styles.compactTime, { color: colors.text }]}>
          {timeAgo(newsflash.created)}
        </Text>
      </View>

      {/* Small thumbnail on the right */}
      <Image
        source={{ uri: `https://source.unsplash.com/120x80/?news,${newsflash.id}` }}
        style={styles.compactThumbnail}
      />
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
    position: 'relative',
  },
  compactCategory: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 2,
    position: 'absolute',
    top: 12,
    left: 12,
  },
  compactHeadline: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 16,
    marginBottom: 4,
    paddingRight: 130,
    flex: 1,
  },
  compactMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 140,
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
    position: 'absolute',
    right: 12,
    top: 12,
    width: 120,
    height: 80,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
}); 