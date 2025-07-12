import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import database from '../services/database';
import { NewsflashCard } from '../components/NewsflashCard';
import { Colors, Spacing, Typography } from '../constants/theme';
import { Newsflash, User, Group } from '../types';

interface FeedScreenProps {
  isDarkMode: boolean;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({ isDarkMode }) => {
  const [newsflashes, setNewsflashes] = useState<Newsflash[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('all');

  const colors = isDarkMode ? Colors.dark : Colors.light;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await database.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      const allUsers = await database.getUsers();
      const allGroups = await database.getGroups();
      const userNewsflashes = await database.getNewsflashesForUser(user.id);
      
      setUsers(allUsers);
      setGroups(allGroups);
      setNewsflashes(userNewsflashes);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getFilteredNewsflashes = () => {
    let filtered = [...newsflashes];
    
    if (selectedSection !== 'all') {
      filtered = filtered.filter(
        n => n.groupIds && n.groupIds.includes(Number(selectedSection))
      );
    }
    
    // Always sort by newest first for news sites
    filtered.sort((a, b) => b.created - a.created);
    
    return filtered;
  };

  const renderNewsflash = ({ item, index }: { item: Newsflash; index: number }) => {
    const author = users.find(u => u.id === item.userId);
    if (!author) return null;

    const itemGroups = item.groupIds
      ? groups.filter(g => item.groupIds!.includes(g.id))
      : [];
    
    const itemFriends = item.friendIds
      ? users.filter(u => item.friendIds!.includes(u.id))
      : [];

    return (
      <NewsflashCard
        newsflash={item}
        author={author}
        groups={itemGroups}
        friends={itemFriends}
        isDarkMode={isDarkMode}
        isFeatured={index === 0 && selectedSection === 'all'}
      />
    );
  };

  const filteredNewsflashes = getFilteredNewsflashes();

  // Section navigation
  const sections = [
    { id: 'all', name: 'Top Stories', icon: '🔥' },
    ...groups.filter(g => currentUser?.groups.includes(g.id)).map(g => ({
      id: g.id.toString(),
      name: g.name,
      icon: g.name === 'Friends' ? '👥' : '💼',
    })),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* News Header */}
      <View style={[styles.header, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.logoText, { color: colors.accent }]}>FRIENDLINES</Text>
        <Text style={[styles.tagline, { color: colors.text }]}>
          Your Personal News Network
        </Text>
      </View>

      {/* Section Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={[styles.sectionNav, { backgroundColor: colors.secondary }]}
        contentContainerStyle={styles.sectionNavContent}
      >
        {sections.map(section => (
          <TouchableOpacity
            key={section.id}
            style={[
              styles.sectionButton,
              selectedSection === section.id && styles.sectionButtonActive,
              selectedSection === section.id && { borderBottomColor: colors.accent },
            ]}
            onPress={() => setSelectedSection(section.id)}
          >
            <Text style={styles.sectionIcon}>{section.icon}</Text>
            <Text
              style={[
                styles.sectionText,
                { color: selectedSection === section.id ? colors.accent : colors.text },
              ]}
            >
              {section.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* News Feed */}
      <FlatList
        data={filteredNewsflashes}
        renderItem={renderNewsflash}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📰</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No News Yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Create a newsflash or wait for updates from your network
            </Text>
          </View>
        }
        ListHeaderComponent={
          filteredNewsflashes.length > 3 ? (
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {selectedSection === 'all' ? 'Latest Headlines' : 'Section News'}
              </Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
    letterSpacing: 0.5,
  },
  sectionNav: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  sectionNavContent: {
    paddingHorizontal: Spacing.sm,
  },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.xs,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  sectionButtonActive: {
    borderBottomWidth: 3,
  },
  sectionIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  sectionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.md,
  },
  sectionHeader: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    opacity: 0.2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    lineHeight: 20,
  },
}); 