import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store/store';
import {
  addRecentSearch,
  clearRecentSearches,
  addFavoriteRoom,
  removeFavoriteRoom,
  setCurrentRoute,
} from '../../../store/slices/navigationSlice';
import { useLocationTracking } from '../../../hooks/useLocationTracking';
import apiService from '../../../services/ApiService';
import type { Room, Route } from '../../../types';

interface SearchResult {
  id: string;
  name: string;
  type: 'room' | 'facility' | 'poi';
  building: string;
  floor: number;
  distance?: number;
  coordinates: { lat: number; lng: number };
  description?: string;
  availability?: 'available' | 'busy' | 'unavailable';
}

interface RealTimeSearchProps {
  onLocationSelect?: (location: SearchResult) => void;
  onRouteRequest?: (route: Route) => void;
  placeholder?: string;
  showRecentSearches?: boolean;
  showFavorites?: boolean;
  autoFocus?: boolean;
}

export const RealTimeSearch: React.FC<RealTimeSearchProps> = ({
  onLocationSelect,
  onRouteRequest,
  placeholder = "Search for rooms, facilities, or places...",
  showRecentSearches = true,
  showFavorites = true,
  autoFocus = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  
  const {
    currentLocation,
    recentSearches,
    favoriteRooms,
    nearbyRooms,
    preferences,
  } = useSelector((state: RootState) => state.navigation);

  const { isTracking } = useLocationTracking();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isRequestingRoute, setIsRequestingRoute] = useState<string | null>(null);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowSuggestions(searchQuery.length > 0);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Perform search with real-time suggestions
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(true);

    try {
      const response = await apiService.searchRooms(query, {
        includeAvailability: true,
        includeDistance: !!currentLocation,
        userLocation: currentLocation?.coordinates,
        limit: 10,
      });

      const results: SearchResult[] = response.data.rooms.map((room: any) => ({
        id: room.id,
        name: room.name,
        type: room.type || 'room',
        building: room.building,
        floor: room.floor,
        distance: room.distance,
        coordinates: room.coordinates,
        description: room.description,
        availability: room.availability,
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [currentLocation]);

  // Handle search result selection
  const handleResultSelect = useCallback(async (result: SearchResult) => {
    // Add to recent searches
    dispatch(addRecentSearch(result.name));
    
    // Clear search
    setSearchQuery('');
    setShowSuggestions(false);
    Keyboard.dismiss();

    // Call onLocationSelect if provided
    onLocationSelect?.(result);

    // Request route if user has location
    if (currentLocation) {
      await handleRouteRequest(result);
    }
  }, [dispatch, onLocationSelect, currentLocation]);

  // Handle route request
  const handleRouteRequest = useCallback(async (destination: SearchResult) => {
    if (!currentLocation) {
      Alert.alert('Location Required', 'Please enable location services to get directions.');
      return;
    }

    setIsRequestingRoute(destination.id);

    try {
      const routeResponse = await apiService.calculateRoute({
        start: currentLocation.coordinates,
        end: destination.coordinates,
        preferences: preferences,
      });

      const route = routeResponse.data;
      dispatch(setCurrentRoute(route));
      
      onRouteRequest?.(route);
    } catch (error) {
      console.error('Route request failed:', error);
      Alert.alert('Route Error', 'Failed to calculate route. Please try again.');
    } finally {
      setIsRequestingRoute(null);
    }
  }, [currentLocation, preferences, dispatch, onRouteRequest]);

  // Toggle favorite
  const toggleFavorite = useCallback((roomId: string) => {
    if (favoriteRooms.includes(roomId)) {
      dispatch(removeFavoriteRoom(roomId));
    } else {
      dispatch(addFavoriteRoom(roomId));
    }
  }, [favoriteRooms, dispatch]);

  // Get availability color
  const getAvailabilityColor = (availability?: string) => {
    switch (availability) {
      case 'available': return '#34C759';
      case 'busy': return '#FF9500';
      case 'unavailable': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'room': return 'business-outline';
      case 'facility': return 'library-outline';
      case 'poi': return 'location-outline';
      default: return 'location-outline';
    }
  };

  // Render search result item
  const renderSearchResult = useCallback(({ item }: { item: SearchResult }) => {
    const isFavorite = favoriteRooms.includes(item.id);
    const isRequesting = isRequestingRoute === item.id;

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleResultSelect(item)}
        disabled={isRequesting}
      >
        <View style={styles.resultIcon}>
          <Ionicons
            name={getTypeIcon(item.type) as any}
            size={20}
            color="#007AFF"
          />
        </View>

        <View style={styles.resultContent}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultName}>{item.name}</Text>
            {item.availability && (
              <View style={[styles.availabilityDot, { backgroundColor: getAvailabilityColor(item.availability) }]} />
            )}
          </View>

          <Text style={styles.resultDetails}>
            {item.building} • Floor {item.floor}
            {item.distance && ` • ${Math.round(item.distance)}m away`}
          </Text>

          {item.description && (
            <Text style={styles.resultDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>

        <View style={styles.resultActions}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item.id)}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={18}
              color={isFavorite ? "#FF3B30" : "#8E8E93"}
            />
          </TouchableOpacity>

          {isRequesting ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <TouchableOpacity
              style={styles.routeButton}
              onPress={() => handleRouteRequest(item)}
            >
              <Ionicons name="navigate" size={18} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [favoriteRooms, isRequestingRoute, handleResultSelect, handleRouteRequest, toggleFavorite]);

  // Render recent searches
  const renderRecentSearches = useCallback(() => {
    if (!showRecentSearches || recentSearches.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <TouchableOpacity onPress={() => dispatch(clearRecentSearches())}>
            <Text style={styles.clearButton}>Clear</Text>
          </TouchableOpacity>
        </View>
        
        {recentSearches.map((search, index) => (
          <TouchableOpacity
            key={index}
            style={styles.recentItem}
            onPress={() => setSearchQuery(search)}
          >
            <Ionicons name="time-outline" size={16} color="#8E8E93" />
            <Text style={styles.recentText}>{search}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [showRecentSearches, recentSearches, dispatch]);

  // Render nearby rooms
  const renderNearbyRooms = useCallback(() => {
    if (!isTracking || nearbyRooms.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nearby Places</Text>
        
        {nearbyRooms.slice(0, 5).map((room) => (
          <TouchableOpacity
            key={room.id}
            style={styles.nearbyItem}
            onPress={() => handleResultSelect({
              id: room.id,
              name: room.name,
              type: 'room',
              building: room.building,
              floor: room.floor,
              coordinates: room.coordinates,
            })}
          >
            <Ionicons name="location" size={16} color="#34C759" />
            <View style={styles.nearbyContent}>
              <Text style={styles.nearbyName}>{room.name}</Text>
              <Text style={styles.nearbyDetails}>
                {room.building} • Floor {room.floor}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [isTracking, nearbyRooms, handleResultSelect]);

  const suggestionContent = useMemo(() => {
    if (searchQuery.length >= 2) {
      return (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id}
          style={styles.resultsList}
          ListEmptyComponent={
            isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            )
          }
        />
      );
    }

    return (
      <View style={styles.suggestionsContainer}>
        {renderRecentSearches()}
        {renderNearbyRooms()}
      </View>
    );
  }, [searchQuery, searchResults, renderSearchResult, isSearching, renderRecentSearches, renderNearbyRooms]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setShowSuggestions(true)}
            autoFocus={autoFocus}
            returnKeyType="search"
            onSubmitEditing={() => {
              if (searchResults.length > 0) {
                handleResultSelect(searchResults[0]);
              }
            }}
          />
          {(searchQuery.length > 0 || isSearching) && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => {
                setSearchQuery('');
                setShowSuggestions(false);
                setSearchResults([]);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showSuggestions && (
        <View style={styles.suggestionsOverlay}>
          {suggestionContent}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 142, 147, 0.2)',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#1C1C1E',
  },
  clearSearchButton: {
    padding: 4,
  },
  suggestionsOverlay: {
    flex: 1,
    backgroundColor: 'white',
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 142, 147, 0.1)',
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  resultDetails: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  resultDescription: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  resultActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 8,
    marginRight: 8,
  },
  routeButton: {
    padding: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  suggestionsContainer: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 142, 147, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  clearButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recentText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1C1C1E',
  },
  nearbyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  nearbyContent: {
    marginLeft: 8,
    flex: 1,
  },
  nearbyName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  nearbyDetails: {
    fontSize: 12,
    color: '#8E8E93',
  },
});

export default RealTimeSearch;