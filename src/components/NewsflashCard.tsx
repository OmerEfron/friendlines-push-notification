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
}

export const NewsflashCard: React.FC<NewsflashCardProps> = ({
  newsflash,
  author,
  groups = [],
  friends = [],
  isDarkMode,
}) => {
  const navigation = useNavigation<any>();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const handleAuthorPress = () => {
    navigation.navigate('Profile', { userId: author.id });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.secondary }]}>
      {/* Mock news image */}
      <Image
        source={{ uri: `https://source.unsplash.com/600x180/?news,${newsflash.id}` }}
        style={styles.image}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleAuthorPress} style={styles.authorInfo}>
          <Text style={styles.avatar}>{author.avatar}</Text>
          <Text style={[styles.authorName, { color: colors.text }]}>
            {author.name}
          </Text>
        </TouchableOpacity>

        {/* Recipients */}
        <View style={styles.recipients}>
          {newsflash.groupIds?.map(gid => {
            const group = groups.find(g => g.id === gid);
            if (!group) return null;
            return (
              <View
                key={`group-${gid}`}
                style={[styles.groupChip, { backgroundColor: group.color }]}
              >
                <Text style={styles.chipText}>{group.name}</Text>
              </View>
            );
          })}
          
          {newsflash.friendIds?.map(fid => {
            const friend = friends.find(f => f.id === fid);
            if (!friend) return null;
            return (
              <View
                key={`friend-${fid}`}
                style={[styles.friendChip]}
              >
                <Text style={styles.chipText}>{friend.name}</Text>
              </View>
            );
          })}
        </View>

        <Text style={[styles.time, { color: colors.text }]}>
          {timeAgo(newsflash.created)}
        </Text>
      </View>

      {/* Content */}
      <Text style={[styles.content, { color: colors.text }]}>
        {newsflash.text}
      </Text>

      {/* Meta */}
      <Text style={styles.meta}>@{author.username}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.small,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  authorName: {
    ...Typography.body,
    fontWeight: 'bold',
  },
  recipients: {
    flexDirection: 'row',
    marginLeft: Spacing.sm,
    flex: 1,
  },
  groupChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
    marginRight: Spacing.xs,
  },
  friendChip: {
    backgroundColor: '#0077cc',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
    marginRight: Spacing.xs,
  },
  chipText: {
    color: '#fff',
    fontSize: 12,
  },
  time: {
    ...Typography.caption,
    marginLeft: 'auto',
  },
  content: {
    ...Typography.body,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  meta: {
    ...Typography.caption,
    color: '#888',
  },
}); 