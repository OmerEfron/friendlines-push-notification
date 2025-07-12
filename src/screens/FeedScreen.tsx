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
    
    // Always sort by newest first
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
    { id: 'all', name: 'ראשי', icon: '🏠' },
    ...groups.filter(g => currentUser?.groups.includes(g.id)).map(g => ({
      id: g.id.toString(),
      name: g.name,
      icon: g.name === 'Friends' ? '👥' : '💼',
    })),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
              אין חדשות עדיין
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => null}
        showsVerticalScrollIndicator={false}
      />
    </View>
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