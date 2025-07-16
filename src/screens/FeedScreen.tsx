import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import database from '../services/database';
import socketService from '../services/socket';
import { NewsflashCard } from '../components/NewsflashCard';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../constants/theme';
import { Newsflash, User, Group } from '../types';

interface FeedScreenProps {
  isDarkMode: boolean;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({ isDarkMode }) => {
  const navigation = useNavigation<any>();
  const [newsflashes, setNewsflashes] = useState<Newsflash[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
      const userNewsflashes = await database.getNewsflashes(user.id);
      
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
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(n => 
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedSection !== 'all') {
      filtered = filtered.filter(n => {
        // Check if this newsflash belongs to the selected group
        const group = groups.find(g => g.id === selectedSection);
        if (!group) return false;
        
        // Check if any group member is in the recipients
        return n.recipients.some(recipientId => 
          group.members.includes(recipientId)
        );
      });
    }
    
    // Always sort by newest first
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return filtered;
  };

  const handleLike = async (newsflashId: string) => {
    try {
      // TODO: Implement like API call
      console.log('Like newsflash:', newsflashId);
      // For now, just refresh the feed
      await loadData();
    } catch (error) {
      console.error('Failed to like newsflash:', error);
    }
  };

  const handleComment = (newsflashId: string) => {
    navigation.navigate('Comments', { newsflashId });
  };

  const handleShareThoughts = () => {
    navigation.navigate('Write');
  };

  const renderNewsflash = ({ item, index }: { item: Newsflash; index: number }) => {
    const author = users.find(u => u.id === item.authorId);
    if (!author) return null;

    // Find groups that this newsflash was sent to
    const itemGroups = groups.filter(g => 
      item.recipients.some(recipientId => g.members.includes(recipientId))
    );
    
    // Find individual friends this was sent to
    const itemFriends = users.filter(u => 
      item.recipients.includes(u.id)
    );

    return (
      <NewsflashCard
        newsflash={item}
        author={author}
        groups={itemGroups}
        friends={itemFriends}
        isDarkMode={isDarkMode}
        isFeatured={false}
        onLike={() => handleLike(item.id)}
        onComment={() => handleComment(item.id)}
      />
    );
  };

  const filteredNewsflashes = getFilteredNewsflashes();

  // Section navigation
  const sections = [
    { id: 'all', name: 'Group Feeds', icon: '👥' },
    { id: 'personal', name: 'Personal Feeds', icon: '👤' },
    ...groups.filter(g => currentUser?.groups?.includes(g.id) || false).map(g => ({
      id: g.id.toString(),
      name: g.name,
      icon: g.name === 'Friends' ? '👥' : '💼',
    })),
  ];

  const renderHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: colors.cardBackground }]}>
      {/* Main Header */}
      <View style={styles.mainHeader}>
        <Text style={[styles.logoText, { color: colors.text }]}>
          😊 FriendLines
        </Text>
        <TouchableOpacity style={styles.searchIcon}>
          <Text style={styles.searchIconText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search funny news"
          placeholderTextColor={colors.secondaryText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Section Navigation */}
      <View style={styles.sectionNav}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionNavContent}
        >
          {sections.map(section => (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.sectionButton,
                { backgroundColor: selectedSection === section.id ? colors.accent : colors.background },
              ]}
              onPress={() => setSelectedSection(section.id)}
            >
              <Text
                style={[
                  styles.sectionText,
                  { 
                    color: selectedSection === section.id ? '#FFFFFF' : colors.text,
                    fontWeight: selectedSection === section.id ? '600' : '400',
                  },
                ]}
              >
                {section.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footerContainer}>
      <TouchableOpacity
        style={[styles.shareButton, { backgroundColor: colors.accent }]}
        onPress={handleShareThoughts}
      >
        <Text style={styles.shareButtonText}>Share Your Thoughts!</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {renderHeader()}
      
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
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No posts yet! Share something fun! 🎉
            </Text>
          </View>
        }
        ListFooterComponent={renderFooter}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    ...Shadow.small,
  },
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  logoText: {
    ...Typography.h2,
    fontWeight: '700',
  },
  searchIcon: {
    padding: Spacing.sm,
  },
  searchIconText: {
    fontSize: 20,
  },
  searchContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  sectionNav: {
    paddingHorizontal: Spacing.lg,
  },
  sectionNavContent: {
    paddingRight: Spacing.lg,
  },
  sectionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionText: {
    ...Typography.captionMedium,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
  },
  footerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  shareButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    ...Shadow.medium,
  },
  shareButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMedium,
  },
}); 