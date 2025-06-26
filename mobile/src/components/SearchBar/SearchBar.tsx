import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

interface SearchResult {
  id: string;
  name: string;
  type: 'room' | 'building' | 'service';
  building: string;
  floor?: number;
  description?: string;
  coordinates: {
    x: number;
    y: number;
  };
}

interface SearchBarProps {
  onLocationSelect: (location: SearchResult) => void;
  placeholder?: string;
  style?: any;
}

const { width } = Dimensions.get('window');

// Real UFV Building T room data (from your shapefile)
const REAL_UFV_ROOMS: SearchResult[] = [
  {
    id: "T001",
    name: "T001 - Large Lecture Hall",
    type: 'room',
    building: 'UFV Building T',
    floor: 1,
    description: "Large Lecture Hall (372.5 sqm)",
    coordinates: { x: 552312.848251, y: 5430800.48876 },
  },
  {
    id: "T002",
    name: "T002 - Small Office",
    type: 'room',
    building: 'UFV Building T',
    floor: 1,
    description: "Small Office (9.1 sqm)",
    coordinates: { x: 552297.100925, y: 5430796.951502 },
  },
  {
    id: "T003",
    name: "T003 - Small Office",
    type: 'room',
    building: 'UFV Building T',
    floor: 1,
    description: "Small Office (9.1 sqm)",
    coordinates: { x: 552300.046514, y: 5430797.019896 },
  },
  {
    id: "T004",
    name: "T004 - Small Office",
    type: 'room',
    building: 'UFV Building T',
    floor: 1,
    description: "Small Office (9.1 sqm)",
    coordinates: { x: 552302.992104, y: 5430797.08829 },
  },
  {
    id: "T005",
    name: "T005 - Small Office",
    type: 'room',
    building: 'UFV Building T',
    floor: 1,
    description: "Small Office (9.1 sqm)",
    coordinates: { x: 552305.937694, y: 5430797.156684 },
  },
  {
    id: "T032",
    name: "T032 - Medium Classroom",
    type: 'room',
    building: 'UFV Building T',
    floor: 1,
    description: "Medium Classroom (35.5 sqm)",
    coordinates: { x: 552309.652266, y: 5430794.708623 },
  },
  {
    id: "T033",
    name: "T033 - Study Area",
    type: 'room',
    building: 'UFV Building T',
    floor: 1,
    description: "Study Area (28.3 sqm)",
    coordinates: { x: 552318.361519, y: 5430806.730978 },
  },
  {
    id: "bathroom",
    name: "Washroom",
    type: 'service',
    building: 'UFV Building T',
    floor: 1,
    description: "Public Washroom",
    coordinates: { x: 552305, y: 5430798 },
  },
  {
    id: "emergency",
    name: "Emergency Exit",
    type: 'service',
    building: 'UFV Building T',
    floor: 1,
    description: "Emergency Exit Point",
    coordinates: { x: 552320, y: 5430810 },
  },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  onLocationSelect,
  placeholder = "Search UFV Building T rooms...",
  style,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);

  const searchLocations = async (searchQuery: string) => {
    if (searchQuery.length < 1) {
      setResults([]);
      return;
    }

    setLoading(true);
    
    // Search through real UFV room data
    setTimeout(() => {
      const filtered = REAL_UFV_ROOMS.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(filtered);
      setLoading(false);
    }, 200);
  };

  useEffect(() => {
    searchLocations(query);
  }, [query]);

  const handleSelectLocation = (location: SearchResult) => {
    setQuery(location.name);
    setShowResults(false);
    
    // Add to recent searches
    const updatedRecent = [location, ...recentSearches.filter(item => item.id !== location.id)].slice(0, 5);
    setRecentSearches(updatedRecent);
    
    console.log(`🎯 Selected location: ${location.name} (${location.id})`);
    onLocationSelect(location);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'room': return '🏛️';
      case 'building': return '🏢';
      case 'service': return '🚪';
      default: return '📍';
    }
  };

  const getRoomTypeColor = (description: string) => {
    if (description.includes('Lecture')) return '#4CAF50';
    if (description.includes('Office')) return '#2196F3';
    if (description.includes('Classroom')) return '#FF9800';
    if (description.includes('Study')) return '#9C27B0';
    if (description.includes('Washroom')) return '#607D8B';
    if (description.includes('Emergency')) return '#F44336';
    return '#666';
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectLocation(item)}
    >
      <View style={styles.resultContent}>
        <Text style={styles.resultIcon}>{getTypeIcon(item.type)}</Text>
        <View style={styles.resultDetails}>
          <Text style={styles.resultName}>{item.name}</Text>
          <Text style={styles.resultInfo}>
            {item.building}
            {item.floor && ` • Floor ${item.floor}`}
          </Text>
          {item.description && (
            <Text style={[styles.resultDescription, { color: getRoomTypeColor(item.description) }]}>
              {item.description}
            </Text>
          )}
          <Text style={styles.coordinateText}>
            📍 UTM: {item.coordinates.x.toFixed(0)}, {item.coordinates.y.toFixed(0)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRecentSearch = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.recentItem}
      onPress={() => handleSelectLocation(item)}
    >
      <Text style={styles.recentIcon}>🕐</Text>
      <Text style={styles.recentText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const showQuickAccess = query.length === 0 && recentSearches.length === 0;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchInputContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor="#999"
          onFocus={() => setShowResults(true)}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
            <Text style={styles.clearButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showResults}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResults(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowResults(false)}
        >
          <View style={styles.resultsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2196F3" />
                <Text style={styles.loadingText}>Searching UFV rooms...</Text>
              </View>
            ) : (
              <>
                {results.length > 0 ? (
                  <>
                    <Text style={styles.sectionTitle}>
                      🏢 UFV Building T Rooms ({results.length} found)
                    </Text>
                    <FlatList
                      data={results}
                      renderItem={renderSearchResult}
                      keyExtractor={(item) => item.id}
                      style={styles.resultsList}
                      showsVerticalScrollIndicator={false}
                    />
                  </>
                ) : query.length >= 1 ? (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>No rooms found</Text>
                    <Text style={styles.noResultsSubtext}>
                      Try searching for room numbers like "T001" or descriptions like "Lecture Hall"
                    </Text>
                  </View>
                ) : showQuickAccess ? (
                  <>
                    <Text style={styles.sectionTitle}>🚀 Quick Access</Text>
                    <TouchableOpacity style={styles.quickAccessItem} onPress={() => handleSelectLocation(REAL_UFV_ROOMS[0])}>
                      <Text style={styles.quickAccessIcon}>🎓</Text>
                      <Text style={styles.quickAccessText}>T001 - Main Lecture Hall</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickAccessItem} onPress={() => handleSelectLocation(REAL_UFV_ROOMS[6])}>
                      <Text style={styles.quickAccessIcon}>📚</Text>
                      <Text style={styles.quickAccessText}>T033 - Study Area</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickAccessItem} onPress={() => handleSelectLocation(REAL_UFV_ROOMS[7])}>
                      <Text style={styles.quickAccessIcon}>🚻</Text>
                      <Text style={styles.quickAccessText}>Washroom</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  recentSearches.length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>Recent Searches</Text>
                      <FlatList
                        data={recentSearches}
                        renderItem={renderRecentSearch}
                        keyExtractor={(item) => `recent-${item.id}`}
                        style={styles.recentsList}
                        showsVerticalScrollIndicator={false}
                      />
                    </>
                  )
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
    color: '#666',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 20,
    color: '#999',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    paddingTop: 100,
  },
  resultsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    maxHeight: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultsList: {
    maxHeight: 300,
  },
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  resultDetails: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  resultInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  resultDescription: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  coordinateText: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
  },
  quickAccessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  quickAccessIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  quickAccessText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  recentsList: {
    maxHeight: 200,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  recentIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  recentText: {
    fontSize: 14,
    color: '#333',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default SearchBar; 