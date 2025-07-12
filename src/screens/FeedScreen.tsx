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
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import database from '../services/database';
import socketService from '../services/socket';
import { NewsflashCard } from '../components/NewsflashCard';
import { Colors, Spacing, Typography } from '../constants/theme';
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
    
    if (selectedSection !== 'all') {
      filtered = filtered.filter(n => {
        // Check if this newsflash belongs to the selected group
        // Since we're using recipients now, we need to check if group members are in recipients
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
        isFeatured={index === 0 && selectedSection === 'all'}
        onLike={() => handleLike(item.id)}
        onComment={() => handleComment(item.id)}
      />
    );
  };

  const filteredNewsflashes = getFilteredNewsflashes();

  // Section navigation
  const sections = [
    { id: 'all', name: 'Main', icon: '🏠' },
    ...groups.filter(g => currentUser?.groups?.includes(g.id) || false).map(g => ({
      id: g.id.toString(),
      name: g.name,
      icon: g.name === 'Friends' ? '👥' : '💼',
    })),
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Compact Header */}
      <View style={[styles.header, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.logoText, { color: colors.accent }]}>FRIENDLINES</Text>
      </View>

      {/* Section Navigation */}
      <View style={[styles.sectionNav, { backgroundColor: colors.secondary }]}>
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
                selectedSection === section.id && styles.sectionButtonActive,
              ]}
              onPress={() => setSelectedSection(section.id)}
            >
              <Text
                style={[
                  styles.sectionText,
                  { 
                    color: selectedSection === section.id ? colors.accent : colors.text,
                    fontWeight: selectedSection === section.id ? '700' : '400',
                  },
                ]}
              >
                {section.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

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
        ItemSeparatorComponent={() => null}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.accent,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  sectionNav: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sectionNavContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  sectionButtonActive: {
    backgroundColor: Colors.light.accent + '15',
  },
  sectionText: {
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.5,
  },
}); 