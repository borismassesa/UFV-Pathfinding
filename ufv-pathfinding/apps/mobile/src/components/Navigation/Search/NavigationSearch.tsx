import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PathfindingService } from '../../../services/PathfindingService';

interface Room {
  id: string;
  name: string;
  type: 'classroom' | 'lab' | 'office' | 'facility';
  floor: number;
  building: string;
  description?: string;
}

interface NavigationSearchProps {
  onRoomSelect: (room: Room) => void;
  onClose: () => void;
}

// Initialize pathfinding service
const pathfindingService = new PathfindingService();

// Convert pathfinding room data to our Room interface
const convertToRoom = (serviceRoom: any): Room => ({
  id: serviceRoom.id,
  name: serviceRoom.desc || serviceRoom.id,
  type: serviceRoom.type || 'facility',
  floor: serviceRoom.floor || 1,
  building: 'T',
  description: serviceRoom.desc || `Room ${serviceRoom.id}`,
});

const NavigationSearch: React.FC<NavigationSearchProps> = ({ onRoomSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allRooms, setAllRooms] = useState<Room[]>([]);

  // Load rooms from pathfinding service
  useEffect(() => {
    const loadRooms = async () => {
      setIsLoading(true);
      try {
        const serviceRooms = pathfindingService.getAllRooms();
        const rooms = serviceRooms.map(convertToRoom);
        setAllRooms(rooms);
        setFilteredRooms(rooms);
      } catch (error) {
        console.error('Error loading rooms:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRooms();
  }, []);

  // Filter rooms based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRooms(allRooms);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      const filtered = allRooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRooms(filtered);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allRooms]);

  const getRoomIcon = (type: Room['type']) => {
    switch (type) {
      case 'lab': return 'library';
      case 'classroom': return 'school';
      case 'office': return 'person';
      case 'facility': return 'cafe';
      default: return 'location';
    }
  };

  const getRoomColor = (type: Room['type']) => {
    switch (type) {
      case 'lab': return '#3B82F6';
      case 'classroom': return '#10B981';
      case 'office': return '#F59E0B';
      case 'facility': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Destination</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rooms, labs, offices..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : filteredRooms.length > 0 ? (
          <>
            <Text style={styles.resultsHeader}>
              {searchQuery ? `${filteredRooms.length} results for "${searchQuery}"` : 'Popular Destinations'}
            </Text>
            
            {filteredRooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={styles.roomItem}
                onPress={() => onRoomSelect(room)}
                activeOpacity={0.7}
              >
                <View style={[styles.roomIcon, { backgroundColor: getRoomColor(room.type) }]}>
                  <Ionicons name={getRoomIcon(room.type) as any} size={24} color="#ffffff" />
                </View>
                
                <View style={styles.roomInfo}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <Text style={styles.roomId}>{room.id} • Floor {room.floor}</Text>
                  {room.description && (
                    <Text style={styles.roomDescription}>{room.description}</Text>
                  )}
                </View>
                
                <View style={styles.roomActions}>
                  <TouchableOpacity style={styles.favoriteButton}>
                    <Ionicons name="heart-outline" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color="#9CA3AF" />
            <Text style={styles.noResultsTitle}>No rooms found</Text>
            <Text style={styles.noResultsText}>
              Try searching for room numbers, types, or descriptions
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Filters */}
      <View style={styles.quickFilters}>
        <Text style={styles.quickFiltersTitle}>Quick Filters</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="library" size={20} color="#3B82F6" />
            <Text style={styles.filterButtonText}>Labs</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="school" size={20} color="#10B981" />
            <Text style={styles.filterButtonText}>Classrooms</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="person" size={20} color="#F59E0B" />
            <Text style={styles.filterButtonText}>Offices</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="cafe" size={20} color="#EF4444" />
            <Text style={styles.filterButtonText}>Facilities</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  
  // Search
  searchContainer: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  
  // Results
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  
  // Room Items
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  roomIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  roomId: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  roomDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  roomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    padding: 8,
  },
  
  // No Results
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Quick Filters
  quickFilters: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  quickFiltersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});

export default NavigationSearch;