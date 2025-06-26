import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Import your real UFV Building T room data
const REAL_UFV_ROOMS = [
  { id: "T001", x: 552312.848251, y: 5430800.48876, area: 372.48, desc: "Large Lecture Hall", type: "academic", color: "#4CAF50" },
  { id: "T002", x: 552297.100925, y: 5430796.951502, area: 9.05, desc: "Small Office", type: "office", color: "#2196F3" },
  { id: "T003", x: 552300.046514, y: 5430797.019896, area: 9.05, desc: "Small Office", type: "office", color: "#2196F3" },
  { id: "T004", x: 552302.992104, y: 5430797.08829, area: 9.05, desc: "Small Office", type: "office", color: "#2196F3" },
  { id: "T005", x: 552305.937694, y: 5430797.156684, area: 9.05, desc: "Small Office", type: "office", color: "#2196F3" },
  { id: "T006", x: 552308.881112, y: 5430797.225028, area: 9.06, desc: "Small Office", type: "office", color: "#2196F3" },
  { id: "T007", x: 552312.321022, y: 5430797.3049, area: 12.18, desc: "Medium Office", type: "office", color: "#2196F3" },
  { id: "T008", x: 552312.435118, y: 5430792.525814, area: 11.92, desc: "Medium Office", type: "office", color: "#2196F3" },
  { id: "T009", x: 552308.994252, y: 5430792.44592, area: 8.84, desc: "Small Office", type: "office", color: "#2196F3" },
  { id: "T010", x: 552306.048662, y: 5430792.377526, area: 8.84, desc: "Small Office", type: "office", color: "#2196F3" },
  { id: "T011", x: 552303.103072, y: 5430792.309132, area: 8.84, desc: "Small Office", type: "office", color: "#2196F3" },
  { id: "T012", x: 552300.157482, y: 5430792.240738, area: 8.84, desc: "Small Office", type: "office", color: "#2196F3" },
  { id: "T013", x: 552297.211893, y: 5430792.172344, area: 8.84, desc: "Small Office", type: "office", color: "#2196F3" },
  { id: "T014", x: 552315.697166, y: 5430792.527193, area: 6.65, desc: "Utility Room", type: "utility", color: "#FF9800" },
  { id: "T015", x: 552318.169693, y: 5430792.584603, area: 6.65, desc: "Utility Room", type: "utility", color: "#FF9800" },
  { id: "T032", x: 552309.652266, y: 5430794.708623, area: 35.53, desc: "Medium Classroom", type: "academic", color: "#4CAF50" },
  { id: "T033", x: 552318.361519, y: 5430806.730978, area: 28.3, desc: "Study Area", type: "study", color: "#9C27B0" },
];

interface Room {
  id: string;
  x: number;
  y: number;
  area: number;
  desc: string;
  type: string;
  color: string;
}

interface RoomFilter {
  type: string;
  label: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const MapScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Room type filters
  const roomFilters: RoomFilter[] = [
    { type: 'all', label: 'All Rooms', color: '#666', icon: 'apps' },
    { type: 'academic', label: 'Academic', color: '#4CAF50', icon: 'school' },
    { type: 'office', label: 'Offices', color: '#2196F3', icon: 'briefcase' },
    { type: 'study', label: 'Study Areas', color: '#9C27B0', icon: 'library' },
    { type: 'utility', label: 'Utilities', color: '#FF9800', icon: 'build' },
  ];

  // Coordinate normalization for display
  const normalizeCoordinates = () => {
    const minX = Math.min(...REAL_UFV_ROOMS.map(r => r.x));
    const maxX = Math.max(...REAL_UFV_ROOMS.map(r => r.x));
    const minY = Math.min(...REAL_UFV_ROOMS.map(r => r.y));
    const maxY = Math.max(...REAL_UFV_ROOMS.map(r => r.y));
    
    const mapWidth = width - 40;
    const mapHeight = 400;
    
    return REAL_UFV_ROOMS.map(room => ({
      ...room,
      displayX: ((room.x - minX) / (maxX - minX)) * mapWidth + 20,
      displayY: ((room.y - minY) / (maxY - minY)) * mapHeight + 50,
      size: Math.max(Math.sqrt(room.area) * 2, 12), // Minimum size for visibility
    }));
  };

  const normalizedRooms = normalizeCoordinates();

  // Filter rooms based on active filter and search
  const filteredRooms = normalizedRooms.filter(room => {
    const matchesFilter = activeFilter === 'all' || room.type === activeFilter;
    const matchesSearch = searchQuery === '' || 
      room.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleRoomPress = (room: Room) => {
    // Navigate to Room Detail screen with proper data
    const roomData = {
      id: room.id,
      name: room.desc,
      description: `${room.desc} - ${room.type.charAt(0).toUpperCase() + room.type.slice(1)} space`,
      type: room.type,
      area: room.area,
      capacity: room.type === 'academic' ? Math.floor(room.area / 2.5) : 
               room.type === 'office' ? Math.floor(room.area / 10) : 
               Math.floor(room.area / 4),
      coordinates: { x: room.x, y: room.y },
      facilities: room.type === 'academic' ? ['Projector', 'Audio System', 'Whiteboard', 'WiFi'] :
                 room.type === 'office' ? ['Desk', 'Chair', 'Computer', 'WiFi'] :
                 room.type === 'study' ? ['Tables', 'Chairs', 'WiFi', 'Power Outlets'] :
                 ['Basic Facilities'],
      accessibility: ['Wheelchair Access', 'Elevator Access'],
      hours: '7:00 AM - 10:00 PM',
      floor: 1,
    };
    
    navigation.navigate('RoomDetail' as never, { room: roomData } as never);
  };

  const handleNavigateToRoom = (room: Room) => {
    Alert.alert(
      `🧭 Navigate to ${room.id}`,
      `Start navigation to ${room.desc}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Navigate!', 
          onPress: () => {
            setShowRoomDetails(false);
            // Here you would navigate to the Navigate tab with pre-selected destination
            Alert.alert('🚀 Navigation Started!', 'Route calculation in progress...');
          }
        }
      ]
    );
  };

  const getRoomIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'academic': return 'school';
      case 'office': return 'briefcase';
      case 'study': return 'library';
      case 'utility': return 'build';
      default: return 'location';
    }
  };

  const getRoomStats = () => {
    const totalArea = REAL_UFV_ROOMS.reduce((sum, room) => sum + room.area, 0);
    const typeStats = roomFilters.slice(1).map(filter => ({
      ...filter,
      count: REAL_UFV_ROOMS.filter(room => room.type === filter.type).length
    }));
    
    return { totalArea, typeStats };
  };

  const { totalArea, typeStats } = getRoomStats();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Map Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>🏢 UFV Building T Floor Plan</Text>
          <Text style={styles.headerSubtitle}>{filteredRooms.length} of {REAL_UFV_ROOMS.length} rooms shown</Text>
        </View>
      </View>

      {/* Filter Bar */}
      <ScrollView 
        horizontal 
        style={styles.filterBar}
        showsHorizontalScrollIndicator={false}
      >
        {roomFilters.map((filter) => (
          <TouchableOpacity
            key={filter.type}
            style={[
              styles.filterButton,
              { backgroundColor: activeFilter === filter.type ? filter.color : '#f0f0f0' }
            ]}
            onPress={() => setActiveFilter(filter.type)}
          >
            <Ionicons 
              name={filter.icon} 
              size={16} 
              color={activeFilter === filter.type ? '#fff' : filter.color} 
            />
            <Text style={[
              styles.filterText,
              { color: activeFilter === filter.type ? '#fff' : filter.color }
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Interactive Map */}
      <ScrollView 
        style={styles.mapContainer}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        maximumZoomScale={3}
        minimumZoomScale={1}
        bouncesZoom={true}
      >
        <View style={styles.mapCanvas}>
          {/* Building Outline */}
          <View style={styles.buildingOutline}>
            <Text style={styles.buildingLabel}>Building T</Text>
          </View>
          
          {/* Corridor Lines */}
          <View style={styles.corridorSystem}>
            <View style={[styles.corridor, styles.mainCorridor]} />
            <View style={[styles.corridor, styles.eastCorridor]} />
            <View style={[styles.corridor, styles.northCorridor]} />
          </View>

          {/* Room Markers */}
          {filteredRooms.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={[
                styles.roomMarker,
                {
                  left: room.displayX,
                  top: room.displayY,
                  width: room.size,
                  height: room.size,
                  backgroundColor: room.color,
                }
              ]}
              onPress={() => handleRoomPress(room)}
            >
              <Text style={styles.roomLabel}>{room.id}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Map Stats */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{REAL_UFV_ROOMS.length}</Text>
            <Text style={styles.statLabel}>Total Rooms</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalArea.toFixed(0)}m²</Text>
            <Text style={styles.statLabel}>Total Area</Text>
          </View>
          {typeStats.map((stat) => (
            <View key={stat.type} style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name={stat.icon} size={16} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.count}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Room Details Modal */}
      <Modal
        visible={showRoomDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRoomDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedRoom && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.roomInfo}>
                    <View style={[styles.roomTypeIcon, { backgroundColor: selectedRoom.color }]}>
                      <Ionicons name={getRoomIcon(selectedRoom.type)} size={24} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.modalRoomNumber}>{selectedRoom.id}</Text>
                      <Text style={styles.modalRoomDesc}>{selectedRoom.desc}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowRoomDetails(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.roomDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="resize" size={20} color="#666" />
                    <Text style={styles.detailText}>Area: {selectedRoom.area}m²</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={20} color="#666" />
                    <Text style={styles.detailText}>
                      Coordinates: ({selectedRoom.x.toFixed(2)}, {selectedRoom.y.toFixed(2)})
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="business" size={20} color="#666" />
                    <Text style={styles.detailText}>Type: {selectedRoom.type}</Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.navigateButton}
                    onPress={() => handleNavigateToRoom(selectedRoom)}
                  >
                    <Ionicons name="navigate" size={20} color="#fff" />
                    <Text style={styles.navigateButtonText}>Navigate Here</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => {
                      Alert.alert('⭐ Added to Favorites!', `${selectedRoom.id} saved to your favorites.`);
                      setShowRoomDetails(false);
                    }}
                  >
                    <Ionicons name="heart-outline" size={20} color="#E91E63" />
                    <Text style={styles.favoriteButtonText}>Add to Favorites</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  filterBar: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 4,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  mapCanvas: {
    width: width,
    height: 500,
    position: 'relative',
  },
  buildingOutline: {
    position: 'absolute',
    left: 15,
    top: 45,
    right: 15,
    bottom: 45,
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 8,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buildingLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1976D2',
    opacity: 0.3,
  },
  corridorSystem: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  corridor: {
    position: 'absolute',
    backgroundColor: 'rgba(158, 158, 158, 0.3)',
  },
  mainCorridor: {
    left: 50,
    right: 50,
    top: 200,
    height: 20,
  },
  eastCorridor: {
    right: 30,
    top: 100,
    bottom: 100,
    width: 20,
  },
  northCorridor: {
    left: 30,
    right: 200,
    top: 150,
    height: 15,
  },
  roomMarker: {
    position: 'absolute',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  roomLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statCard: {
    alignItems: 'center',
    paddingHorizontal: 16,
    minWidth: 80,
  },
  statIcon: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976D2',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalRoomNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalRoomDesc: {
    fontSize: 16,
    color: '#666',
  },
  closeButton: {
    padding: 8,
  },
  roomDetails: {
    gap: 12,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
  },
  modalActions: {
    gap: 12,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  navigateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E91E63',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  favoriteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E91E63',
  },
});

export default MapScreen; 