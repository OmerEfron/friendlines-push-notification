import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
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
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

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
    
    if (filterGroup !== 'all') {
      filtered = filtered.filter(
        n => n.groupIds && n.groupIds.includes(Number(filterGroup))
      );
    }
    
    filtered.sort((a, b) => {
      if (sortOrder === 'newest') {
        return b.created - a.created;
      } else {
        return a.created - b.created;
      }
    });
    
    return filtered;
  };

  const renderNewsflash = ({ item }: { item: Newsflash }) => {
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
      />
    );
  };

  const filteredNewsflashes = getFilteredNewsflashes();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.title, { color: colors.text }]}>Main Feed</Text>
        
        {/* Filters */}
        <View style={styles.filters}>
          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Group:</Text>
            <Picker
              selectedValue={filterGroup}
              onValueChange={setFilterGroup}
              style={[styles.picker, { color: colors.text }]}
            >
              <Picker.Item label="All Groups" value="all" />
              {currentUser?.groups.map(gid => {
                const group = groups.find(g => g.id === gid);
                return group ? (
                  <Picker.Item
                    key={group.id}
                    label={group.name}
                    value={group.id.toString()}
                  />
                ) : null;
              })}
            </Picker>
          </View>
          
          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Sort:</Text>
            <Picker
              selectedValue={sortOrder}
              onValueChange={setSortOrder}
              style={[styles.picker, { color: colors.text }]}
            >
              <Picker.Item label="Newest" value="newest" />
              <Picker.Item label="Oldest" value="oldest" />
            </Picker>
          </View>
        </View>
      </View>

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
              No newsflashes yet.
            </Text>
          </View>
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
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterItem: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  filterLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  picker: {
    height: 40,
  },
  listContent: {
    padding: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    opacity: 0.6,
  },
}); 