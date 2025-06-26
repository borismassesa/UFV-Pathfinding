import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FavoriteLocation {
  id: string;
  roomId: string;
  name: string;
  description: string;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  dateAdded: Date;
  visitCount: number;
  notes?: string;
}

interface QuickRoute {
  id: string;
  name: string;
  from: string;
  to: string;
  distance: string;
  duration: string;
  frequency: number;
  icon: keyof typeof Ionicons.glyphMap;
}

const FavoritesScreen: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [quickRoutes, setQuickRoutes] = useState<QuickRoute[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize with some sample favorites (in real app, would load from storage)
  useEffect(() => {
    const sampleFavorites: FavoriteLocation[] = [
      {
        id: '1',
        roomId: 'T001',
        name: 'Main Lecture Hall',
        description: 'Large Lecture Hall - 372.48m²',
        category: 'academic',
        icon: 'school',
        color: '#4CAF50',
        dateAdded: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        visitCount: 15,
        notes: 'Monday/Wednesday classes'
      },
      {
        id: '2',
        roomId: 'T033',
        name: 'Study Area',
        description: 'Quiet study space - 28.3m²',
        category: 'study',
        icon: 'library',
        color: '#9C27B0',
        dateAdded: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        visitCount: 8,
        notes: 'Great for group work'
      },
      {
        id: '3',
        roomId: 'T032',
        name: 'Tutorial Room',
        description: 'Medium Classroom - 35.53m²',
        category: 'academic',
        icon: 'desktop',
        color: '#FF9800',
        dateAdded: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        visitCount: 12,
        notes: 'Friday tutorials'
      },
      {
        id: '4',
        roomId: 'T002',
        name: 'Prof. Office',
        description: 'Faculty Office - 9.05m²',
        category: 'office',
        icon: 'briefcase',
        color: '#2196F3',
        dateAdded: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        visitCount: 5,
        notes: 'Office hours: M/W 2-4pm'
      },
    ];

    const sampleQuickRoutes: QuickRoute[] = [
      {
        id: '1',
        name: 'Morning Route',
        from: 'Main Entrance',
        to: 'T001 - Lecture Hall',
        distance: '45m',
        duration: '2 min',
        frequency: 12,
        icon: 'sunny'
      },
      {
        id: '2',
        name: 'Study Session',
        from: 'T001 - Lecture Hall',
        to: 'T033 - Study Area',
        distance: '28m',
        duration: '1 min',
        frequency: 8,
        icon: 'library'
      },
      {
        id: '3',
        name: 'Office Visit',
        from: 'T033 - Study Area',
        to: 'T002 - Prof. Office',
        distance: '35m',
        duration: '2 min',
        frequency: 5,
        icon: 'briefcase'
      },
    ];

    setFavorites(sampleFavorites);
    setQuickRoutes(sampleQuickRoutes);
  }, []);

  const categories = [
    { id: 'all', label: 'All', icon: 'apps' as keyof typeof Ionicons.glyphMap, color: '#666' },
    { id: 'academic', label: 'Academic', icon: 'school' as keyof typeof Ionicons.glyphMap, color: '#4CAF50' },
    { id: 'study', label: 'Study', icon: 'library' as keyof typeof Ionicons.glyphMap, color: '#9C27B0' },
    { id: 'office', label: 'Office', icon: 'briefcase' as keyof typeof Ionicons.glyphMap, color: '#2196F3' },
    { id: 'utility', label: 'Utility', icon: 'build' as keyof typeof Ionicons.glyphMap, color: '#FF9800' },
  ];

  // Filter favorites based on category and search
  const filteredFavorites = favorites.filter(fav => {
    const matchesCategory = selectedCategory === 'all' || fav.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      fav.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.roomId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleNavigateToFavorite = (favorite: FavoriteLocation) => {
    // Update visit count
    setFavorites(prev => prev.map(fav => 
      fav.id === favorite.id 
        ? { ...fav, visitCount: fav.visitCount + 1 }
        : fav
    ));

    Alert.alert(
      `🧭 Navigate to ${favorite.name}`,
      `Start navigation to ${favorite.description}?\n\nYou've visited this location ${favorite.visitCount} times.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Navigate!', 
          onPress: () => {
            Alert.alert('🚀 Navigation Started!', `Route to ${favorite.name} is being calculated...`);
          }
        }
      ]
    );
  };

  const handleUseQuickRoute = (route: QuickRoute) => {
    // Update frequency
    setQuickRoutes(prev => prev.map(r => 
      r.id === route.id 
        ? { ...r, frequency: r.frequency + 1 }
        : r
    ));

    Alert.alert(
      `🔄 Use ${route.name}`,
      `Navigate from ${route.from} to ${route.to}?\n\nDistance: ${route.distance} • Duration: ${route.duration}\nUsed ${route.frequency} times`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Go!', 
          onPress: () => {
            Alert.alert('🚀 Quick Route Started!', `Following your ${route.name} route...`);
          }
        }
      ]
    );
  };

  const handleDeleteFavorite = (favoriteId: string) => {
    const favorite = favorites.find(f => f.id === favoriteId);
    if (!favorite) return;

    Alert.alert(
      '🗑️ Remove Favorite',
      `Remove "${favorite.name}" from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
            Alert.alert('✅ Removed!', `${favorite.name} has been removed from favorites.`);
          }
        }
      ]
    );
  };

  const handleEditFavorite = (favorite: FavoriteLocation) => {
    Alert.alert(
      `✏️ Edit ${favorite.name}`,
      'What would you like to update?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add Notes', 
          onPress: () => {
            Alert.alert('📝 Feature Coming Soon!', 'Note editing will be available in the next update.');
          }
        },
        { 
          text: 'Change Category', 
          onPress: () => {
            Alert.alert('🏷️ Feature Coming Soon!', 'Category editing will be available in the next update.');
          }
        }
      ]
    );
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const getFavoritesStats = () => {
    const totalVisits = favorites.reduce((sum, fav) => sum + fav.visitCount, 0);
    const mostVisited = favorites.reduce((max, fav) => fav.visitCount > max.visitCount ? fav : max, favorites[0]);
    const recentlyAdded = favorites.filter(fav => {
      const daysSinceAdded = (new Date().getTime() - fav.dateAdded.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceAdded <= 7;
    }).length;

    return { totalVisits, mostVisited, recentlyAdded };
  };

  const stats = getFavoritesStats();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header Stats */}
      <View style={styles.headerStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{favorites.length}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalVisits}</Text>
          <Text style={styles.statLabel}>Total Visits</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.recentlyAdded}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search favorites..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        style={styles.categoryFilter}
        showsHorizontalScrollIndicator={false}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              { backgroundColor: selectedCategory === category.id ? category.color : '#f0f0f0' }
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons 
              name={category.icon} 
              size={16} 
              color={selectedCategory === category.id ? '#fff' : category.color} 
            />
            <Text style={[
              styles.categoryText,
              { color: selectedCategory === category.id ? '#fff' : category.color }
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Routes Section */}
        {quickRoutes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Quick Routes</Text>
            {quickRoutes.map((route) => (
              <TouchableOpacity
                key={route.id}
                style={styles.quickRouteCard}
                onPress={() => handleUseQuickRoute(route)}
              >
                <View style={styles.routeIcon}>
                  <Ionicons name={route.icon} size={24} color="#2196F3" />
                </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <Text style={styles.routePath}>{route.from} → {route.to}</Text>
                  <Text style={styles.routeStats}>{route.distance} • {route.duration} • Used {route.frequency}x</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#bbb" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Favorites Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ My Favorites</Text>
            <Text style={styles.sectionCount}>({filteredFavorites.length})</Text>
          </View>

          {filteredFavorites.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching favorites' : 'No favorites yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? 'Try adjusting your search or filter' 
                  : 'Add locations to quickly access them later'
                }
              </Text>
            </View>
          ) : (
            filteredFavorites.map((favorite) => (
              <View key={favorite.id} style={styles.favoriteCard}>
                <View style={styles.favoriteMain}>
                  <TouchableOpacity
                    style={styles.favoriteContent}
                    onPress={() => handleNavigateToFavorite(favorite)}
                  >
                    <View style={[styles.favoriteIcon, { backgroundColor: favorite.color }]}>
                      <Ionicons name={favorite.icon} size={24} color="#fff" />
                    </View>
                    <View style={styles.favoriteInfo}>
                      <Text style={styles.favoriteName}>{favorite.name}</Text>
                      <Text style={styles.favoriteDescription}>{favorite.description}</Text>
                      <Text style={styles.favoriteRoomId}>Room: {favorite.roomId}</Text>
                      {favorite.notes && (
                        <Text style={styles.favoriteNotes}>📝 {favorite.notes}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  <View style={styles.favoriteActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditFavorite(favorite)}
                    >
                      <Ionicons name="pencil" size={16} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteFavorite(favorite.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#E91E63" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.favoriteFooter}>
                  <Text style={styles.favoriteVisits}>🚶 {favorite.visitCount} visits</Text>
                  <Text style={styles.favoriteDate}>Added {formatDate(favorite.dateAdded)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Add New Favorite Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add New Favorite</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Modal (simplified for demo) */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📍 Add New Favorite</Text>
            <Text style={styles.modalSubtitle}>
              This feature will allow you to add any UFV Building T room to your favorites list.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1976D2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  categoryFilter: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  sectionCount: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  quickRouteCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  routeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  routePath: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  routeStats: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  favoriteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  favoriteMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  favoriteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  favoriteIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  favoriteDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  favoriteRoomId: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 4,
    fontWeight: '600',
  },
  favoriteNotes: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 4,
    fontStyle: 'italic',
  },
  favoriteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  favoriteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  favoriteVisits: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  favoriteDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 24,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  modalButtons: {
    marginTop: 24,
  },
  modalButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default FavoritesScreen; 