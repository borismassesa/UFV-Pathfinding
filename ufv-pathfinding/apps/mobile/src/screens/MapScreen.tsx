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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  dimensions, 
  scale, 
  moderateScale, 
  verticalScale,
  scaleFontSize,
  isTablet,
  responsiveValue 
} from '../utils/responsive';

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
  const insets = useSafeAreaInsets();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [showDirectory, setShowDirectory] = useState(false);
  const [showBuildingInfo, setShowBuildingInfo] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapTransform, setMapTransform] = useState({ scale: 1 });
  
  // Building information data
  const buildingInfo = {
    name: 'UFV Building T',
    address: 'University of the Fraser Valley, Abbotsford Campus',
    floors: 3,
    totalRooms: REAL_UFV_ROOMS.length,
    yearBuilt: 1985,
    totalArea: REAL_UFV_ROOMS.reduce((sum, room) => sum + room.area, 0),
    hours: {
      weekdays: '7:00 AM - 10:00 PM',
      weekends: '8:00 AM - 6:00 PM',
      holidays: 'Closed'
    },
    services: [
      { name: 'WiFi', icon: 'wifi', available: true },
      { name: 'Elevators', icon: 'layers', available: true },
      { name: 'Accessibility', icon: 'accessibility', available: true },
      { name: 'Emergency Services', icon: 'medical', available: true },
      { name: 'Food Services', icon: 'cafe', available: true },
      { name: 'Study Areas', icon: 'library', available: true },
    ]
  };
  
  // Floor data
  const floors = [
    { level: 0, name: 'Ground Floor', rooms: REAL_UFV_ROOMS.filter(r => r.id.startsWith('T0')) },
    { level: 1, name: '1st Floor', rooms: REAL_UFV_ROOMS.filter(r => r.id.startsWith('T1')) },
    { level: 2, name: '2nd Floor', rooms: REAL_UFV_ROOMS.filter(r => r.id.startsWith('T2')) },
  ];

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

  // Zoom handlers
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 0.5, 3); // Max zoom 3x
    setZoomLevel(newZoom);
    setMapTransform({ scale: newZoom });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.5, 1); // Min zoom 1x
    setZoomLevel(newZoom);
    setMapTransform({ scale: newZoom });
  };

  const handleRecenterMap = () => {
    setZoomLevel(1);
    setMapTransform({ scale: 1 });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Modern Header */}
      <View style={[styles.modernHeader, { paddingTop: insets.top + dimensions.paddingM }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Building Directory</Text>
            <Text style={styles.headerSubtitle}>Explore UFV Building T</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowDirectory(!showDirectory)}
            >
              <Ionicons name="list" size={dimensions.iconM} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowBuildingInfo(true)}
            >
              <Ionicons name="information-circle" size={dimensions.iconM} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={dimensions.iconM} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rooms, facilities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={dimensions.iconM} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showDirectory ? (
        // Directory View
        <View style={styles.directoryContainer}>
          {/* Directory Header */}
          <View style={styles.directoryHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setShowDirectory(false)}
            >
              <Ionicons name="arrow-back" size={dimensions.iconM} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.directoryTitle}>Room Directory</Text>
          </View>
          
          {/* Category Filters */}
          <ScrollView 
            horizontal 
            style={styles.modernFilterBar}
            showsHorizontalScrollIndicator={false}
          >
            {roomFilters.map((filter) => (
              <TouchableOpacity
                key={filter.type}
                style={[
                  styles.modernFilterButton,
                  activeFilter === filter.type && styles.modernFilterButtonActive
                ]}
                onPress={() => setActiveFilter(filter.type)}
              >
                <View style={[
                  styles.filterIconContainer,
                  { backgroundColor: activeFilter === filter.type ? '#ffffff' : filter.color + '20' }
                ]}>
                  <Ionicons 
                    name={filter.icon} 
                    size={dimensions.iconS} 
                    color={activeFilter === filter.type ? filter.color : filter.color} 
                  />
                </View>
                <Text style={[
                  styles.modernFilterText,
                  { color: activeFilter === filter.type ? '#ffffff' : '#374151' }
                ]}>
                  {filter.label}
                </Text>
                <View style={styles.filterCount}>
                  <Text style={[
                    styles.filterCountText,
                    { color: activeFilter === filter.type ? '#ffffff' : '#6B7280' }
                  ]}>
                    {filter.type === 'all' ? REAL_UFV_ROOMS.length : REAL_UFV_ROOMS.filter(r => r.type === filter.type).length}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Room List */}
          <ScrollView style={styles.roomList} showsVerticalScrollIndicator={false}>
            {filteredRooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={styles.roomListItem}
                onPress={() => handleRoomPress(room)}
              >
                <View style={[styles.roomListIcon, { backgroundColor: room.color }]}>
                  <Ionicons name={getRoomIcon(room.type)} size={dimensions.iconM} color="#ffffff" />
                </View>
                <View style={styles.roomListContent}>
                  <Text style={styles.roomListNumber}>{room.id}</Text>
                  <Text style={styles.roomListDescription}>{room.desc}</Text>
                  <Text style={styles.roomListArea}>{room.area}m² • {room.type}</Text>
                </View>
                <Ionicons name="chevron-forward" size={dimensions.iconS} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        // Map Exploration View
        <View style={styles.mapExplorationContainer}>
          {/* Floor Selector */}
          <View style={styles.floorSelector}>
            <Text style={styles.floorSelectorTitle}>Select Floor</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {floors.map((floor) => (
                <TouchableOpacity
                  key={floor.level}
                  style={[
                    styles.floorButton,
                    selectedFloor === floor.level && styles.floorButtonActive
                  ]}
                  onPress={() => setSelectedFloor(floor.level)}
                >
                  <Text style={[
                    styles.floorButtonText,
                    selectedFloor === floor.level && styles.floorButtonTextActive
                  ]}>
                    {floor.name}
                  </Text>
                  <Text style={[
                    styles.floorRoomCount,
                    selectedFloor === floor.level && styles.floorRoomCountActive
                  ]}>
                    {floor.rooms.length} rooms
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Interactive Floor Plan */}
          <ScrollView 
            style={styles.modernMapContainer}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            <View style={[styles.modernMapCanvas, { transform: [{ scale: mapTransform.scale }] }]}>
              {/* Floor Plan Background */}
              <LinearGradient
                colors={['#F8FAFC', '#F1F5F9']}
                style={styles.floorPlanBackground}
              >
                <Text style={styles.floorPlanTitle}>
                  {floors[selectedFloor]?.name}
                </Text>
                <Text style={styles.floorPlanSubtitle}>
                  {floors[selectedFloor]?.rooms.length} rooms on this floor
                </Text>
              </LinearGradient>
              
              {/* Building Structure */}
              <View style={styles.buildingStructure}>
                {/* Main Corridor */}
                <View style={styles.mainCorridor} />
                {/* Secondary Corridors */}
                <View style={styles.eastWing} />
                <View style={styles.westWing} />
                {/* Entrance */}
                <View style={styles.mainEntrance}>
                  <Ionicons name="enter" size={dimensions.iconM} color="#10B981" />
                  <Text style={styles.entranceLabel}>Main Entrance</Text>
                </View>
              </View>

              {/* Room Markers for Selected Floor */}
              {floors[selectedFloor]?.rooms.map((room) => {
                const normalizedRoom = normalizedRooms.find(nr => nr.id === room.id);
                if (!normalizedRoom) return null;
                
                return (
                  <TouchableOpacity
                    key={room.id}
                    style={[
                      styles.modernRoomMarker,
                      {
                        left: normalizedRoom.displayX,
                        top: normalizedRoom.displayY,
                        width: Math.max(normalizedRoom.size, 24),
                        height: Math.max(normalizedRoom.size, 24),
                      }
                    ]}
                    onPress={() => handleRoomPress(room)}
                  >
                    <LinearGradient
                      colors={[room.color, room.color + 'CC']}
                      style={styles.roomMarkerGradient}
                    >
                      <Ionicons 
                        name={getRoomIcon(room.type)} 
                        size={normalizedRoom.size > 30 ? dimensions.iconM : dimensions.iconS} 
                        color="#ffffff" 
                      />
                    </LinearGradient>
                    <View style={styles.roomTooltip}>
                      <Text style={styles.roomTooltipText}>{room.id}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              
              {/* Legend */}
              <View style={styles.mapLegend}>
                <Text style={styles.legendTitle}>Legend</Text>
                {roomFilters.slice(1).map((filter) => (
                  <View key={filter.type} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: filter.color }]} />
                    <Text style={styles.legendText}>{filter.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
          
          {/* Map Controls */}
          <View style={styles.mapControls}>
            <TouchableOpacity 
              style={[styles.mapControlButton, zoomLevel >= 3 && styles.mapControlButtonDisabled]}
              onPress={handleZoomIn}
              disabled={zoomLevel >= 3}
            >
              <Ionicons name="add" size={dimensions.iconM} color={zoomLevel >= 3 ? "#9CA3AF" : "#374151"} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.mapControlButton, zoomLevel <= 1 && styles.mapControlButtonDisabled]}
              onPress={handleZoomOut}
              disabled={zoomLevel <= 1}
            >
              <Ionicons name="remove" size={dimensions.iconM} color={zoomLevel <= 1 ? "#9CA3AF" : "#374151"} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.mapControlButton}
              onPress={handleRecenterMap}
            >
              <Ionicons name="locate" size={dimensions.iconM} color="#4CAF50" />
            </TouchableOpacity>
            
            {/* Zoom Level Indicator */}
            <View style={styles.zoomIndicator}>
              <Text style={styles.zoomText}>{Math.round(zoomLevel * 100)}%</Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="business" size={dimensions.iconM} color="#4CAF50" />
            </View>
            <Text style={styles.statValue}>{REAL_UFV_ROOMS.length}</Text>
            <Text style={styles.statLabel}>Total Rooms</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="resize" size={dimensions.iconM} color="#2196F3" />
            </View>
            <Text style={styles.statValue}>{totalArea.toFixed(0)}m²</Text>
            <Text style={styles.statLabel}>Floor Area</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="layers" size={dimensions.iconM} color="#9C27B0" />
            </View>
            <Text style={styles.statValue}>{floors.length}</Text>
            <Text style={styles.statLabel}>Floors</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="time" size={dimensions.iconM} color="#FF9800" />
            </View>
            <Text style={styles.statValue}>Open</Text>
            <Text style={styles.statLabel}>Building Status</Text>
          </View>
        </View>
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
                    onPress={() => {
                      setShowRoomDetails(false);
                      // Navigate to Navigate tab with pre-selected destination
                      navigation.navigate('Navigate' as never, { 
                        destination: selectedRoom.id,
                        room: selectedRoom 
                      } as never);
                    }}
                  >
                    <Ionicons name="navigate" size={20} color="#fff" />
                    <Text style={styles.navigateButtonText}>Get Directions</Text>
                  </TouchableOpacity>
                  <View style={styles.secondaryActions}>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => {
                        Alert.alert('⭐ Added to Favorites!', `${selectedRoom.id} saved to your favorites.`);
                        setShowRoomDetails(false);
                      }}
                    >
                      <Ionicons name="heart-outline" size={18} color="#E91E63" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => {
                        Alert.alert('🔗 Share Room', `Sharing ${selectedRoom.id} location...`);
                      }}
                    >
                      <Ionicons name="share-outline" size={18} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => {
                        Alert.alert('📋 Room Details', `Viewing detailed information for ${selectedRoom.id}`);
                      }}
                    >
                      <Ionicons name="information-circle-outline" size={18} color="#FF9800" />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Building Information Modal */}
      <Modal
        visible={showBuildingInfo}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowBuildingInfo(false)}
      >
        <View style={styles.buildingInfoContainer}>
          {/* Header */}
          <View style={[styles.buildingInfoHeader, { paddingTop: insets.top + dimensions.paddingM }]}>
            <TouchableOpacity
              style={styles.closeInfoButton}
              onPress={() => setShowBuildingInfo(false)}
            >
              <Ionicons name="arrow-back" size={dimensions.iconM} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.buildingInfoTitle}>Building Information</Text>
          </View>
          
          <ScrollView style={styles.buildingInfoContent}>
            {/* Building Overview */}
            <View style={styles.buildingOverview}>
              <LinearGradient
                colors={['#4CAF50', '#2E7D32']}
                style={styles.buildingHeaderGradient}
              >
                <Ionicons name="business" size={dimensions.iconXL} color="#ffffff" />
                <Text style={styles.buildingName}>{buildingInfo.name}</Text>
                <Text style={styles.buildingAddress}>{buildingInfo.address}</Text>
              </LinearGradient>
            </View>
            
            {/* Quick Info */}
            <View style={styles.quickInfoGrid}>
              <View style={styles.quickInfoCard}>
                <Ionicons name="layers" size={dimensions.iconL} color="#2196F3" />
                <Text style={styles.quickInfoValue}>{buildingInfo.floors}</Text>
                <Text style={styles.quickInfoLabel}>Floors</Text>
              </View>
              <View style={styles.quickInfoCard}>
                <Ionicons name="door-open" size={dimensions.iconL} color="#4CAF50" />
                <Text style={styles.quickInfoValue}>{buildingInfo.totalRooms}</Text>
                <Text style={styles.quickInfoLabel}>Rooms</Text>
              </View>
              <View style={styles.quickInfoCard}>
                <Ionicons name="calendar" size={dimensions.iconL} color="#FF9800" />
                <Text style={styles.quickInfoValue}>{buildingInfo.yearBuilt}</Text>
                <Text style={styles.quickInfoLabel}>Built</Text>
              </View>
              <View style={styles.quickInfoCard}>
                <Ionicons name="resize" size={dimensions.iconL} color="#9C27B0" />
                <Text style={styles.quickInfoValue}>{buildingInfo.totalArea.toFixed(0)}m²</Text>
                <Text style={styles.quickInfoLabel}>Area</Text>
              </View>
            </View>
            
            {/* Building Hours */}
            <View style={styles.buildingSection}>
              <Text style={styles.sectionTitle}>Building Hours</Text>
              <View style={styles.hoursContainer}>
                <View style={styles.hoursItem}>
                  <Text style={styles.hoursDay}>Weekdays</Text>
                  <Text style={styles.hoursTime}>{buildingInfo.hours.weekdays}</Text>
                </View>
                <View style={styles.hoursItem}>
                  <Text style={styles.hoursDay}>Weekends</Text>
                  <Text style={styles.hoursTime}>{buildingInfo.hours.weekends}</Text>
                </View>
                <View style={styles.hoursItem}>
                  <Text style={styles.hoursDay}>Holidays</Text>
                  <Text style={styles.hoursTime}>{buildingInfo.hours.holidays}</Text>
                </View>
              </View>
            </View>
            
            {/* Available Services */}
            <View style={styles.buildingSection}>
              <Text style={styles.sectionTitle}>Available Services</Text>
              <View style={styles.servicesGrid}>
                {buildingInfo.services.map((service, index) => (
                  <View key={index} style={styles.serviceItem}>
                    <View style={[styles.serviceIcon, { backgroundColor: service.available ? '#E8F5E8' : '#FEE2E2' }]}>
                      <Ionicons 
                        name={service.icon as any} 
                        size={dimensions.iconM} 
                        color={service.available ? '#15803D' : '#DC2626'} 
                      />
                    </View>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Ionicons 
                      name={service.available ? 'checkmark-circle' : 'close-circle'} 
                      size={dimensions.iconS} 
                      color={service.available ? '#15803D' : '#DC2626'} 
                    />
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Modern Header
  modernHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: dimensions.paddingM,
    paddingBottom: dimensions.paddingM,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.paddingM,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: dimensions.fontXXL,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: dimensions.fontM,
    color: '#6B7280',
    marginTop: moderateScale(2),
  },
  headerActions: {
    flexDirection: 'row',
    gap: dimensions.paddingS,
  },
  headerButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: dimensions.radiusL,
    paddingHorizontal: dimensions.paddingM,
    paddingVertical: dimensions.paddingS,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: dimensions.fontM,
    color: '#111827',
    marginLeft: dimensions.paddingS,
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
  
  // Directory Styles
  directoryContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  directoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dimensions.paddingM,
    paddingVertical: dimensions.paddingM,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.paddingM,
  },
  directoryTitle: {
    fontSize: dimensions.fontXL,
    fontWeight: '700',
    color: '#111827',
  },
  modernFilterBar: {
    paddingHorizontal: dimensions.paddingM,
    paddingVertical: dimensions.paddingS,
  },
  modernFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dimensions.paddingM,
    paddingVertical: dimensions.paddingS,
    borderRadius: dimensions.radiusL,
    backgroundColor: '#F9FAFB',
    marginRight: dimensions.paddingS,
    minWidth: moderateScale(120),
  },
  modernFilterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterIconContainer: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.paddingS,
  },
  modernFilterText: {
    flex: 1,
    fontSize: dimensions.fontS,
    fontWeight: '600',
  },
  filterCount: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(8),
  },
  filterCountText: {
    fontSize: dimensions.fontXS,
    fontWeight: '600',
  },
  roomList: {
    flex: 1,
    paddingHorizontal: dimensions.paddingM,
  },
  roomListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: dimensions.paddingM,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  roomListIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.paddingM,
  },
  roomListContent: {
    flex: 1,
  },
  roomListNumber: {
    fontSize: dimensions.fontL,
    fontWeight: '700',
    color: '#111827',
  },
  roomListDescription: {
    fontSize: dimensions.fontM,
    color: '#374151',
    marginTop: moderateScale(2),
  },
  roomListArea: {
    fontSize: dimensions.fontS,
    color: '#6B7280',
    marginTop: moderateScale(2),
  },
  
  // Map Exploration Styles
  mapExplorationContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  floorSelector: {
    backgroundColor: '#ffffff',
    paddingHorizontal: dimensions.paddingM,
    paddingVertical: dimensions.paddingS,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  floorSelectorTitle: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#374151',
    marginBottom: dimensions.paddingS,
  },
  floorButton: {
    paddingHorizontal: dimensions.paddingM,
    paddingVertical: dimensions.paddingS,
    marginRight: dimensions.paddingS,
    borderRadius: dimensions.radiusL,
    backgroundColor: '#F3F4F6',
    minWidth: moderateScale(100),
  },
  floorButtonActive: {
    backgroundColor: '#10B981',
  },
  floorButtonText: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  floorButtonTextActive: {
    color: '#ffffff',
  },
  floorRoomCount: {
    fontSize: dimensions.fontXS,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: moderateScale(2),
  },
  floorRoomCountActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  modernMapContainer: {
    flex: 1,
    margin: dimensions.paddingM,
    borderRadius: dimensions.radiusL,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modernMapCanvas: {
    width: dimensions.screenWidth - (dimensions.paddingM * 2),
    height: moderateScale(400),
    position: 'relative',
  },
  floorPlanBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floorPlanTitle: {
    fontSize: dimensions.fontXXL,
    fontWeight: '800',
    color: '#1E293B',
    opacity: 0.6,
  },
  floorPlanSubtitle: {
    fontSize: dimensions.fontM,
    color: '#64748B',
    marginTop: moderateScale(4),
  },
  buildingStructure: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mainCorridor: {
    position: 'absolute',
    left: moderateScale(40),
    right: moderateScale(40),
    top: moderateScale(180),
    height: moderateScale(20),
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
    borderRadius: moderateScale(4),
  },
  eastWing: {
    position: 'absolute',
    right: moderateScale(20),
    top: moderateScale(80),
    bottom: moderateScale(80),
    width: moderateScale(15),
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
    borderRadius: moderateScale(4),
  },
  westWing: {
    position: 'absolute',
    left: moderateScale(20),
    top: moderateScale(120),
    right: moderateScale(180),
    height: moderateScale(12),
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
    borderRadius: moderateScale(4),
  },
  mainEntrance: {
    position: 'absolute',
    bottom: moderateScale(20),
    left: '50%',
    transform: [{ translateX: -moderateScale(40) }],
    width: moderateScale(80),
    height: moderateScale(40),
    backgroundColor: '#DCFCE7',
    borderRadius: dimensions.radiusM,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  entranceLabel: {
    fontSize: dimensions.fontXS,
    fontWeight: '600',
    color: '#15803D',
    marginTop: moderateScale(2),
  },
  modernRoomMarker: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomMarkerGradient: {
    width: '100%',
    height: '100%',
    borderRadius: dimensions.radiusS,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  roomTooltip: {
    position: 'absolute',
    top: -moderateScale(20),
    backgroundColor: '#1F2937',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
    opacity: 0,
  },
  roomTooltipText: {
    fontSize: dimensions.fontXS,
    color: '#ffffff',
    fontWeight: '600',
  },
  mapLegend: {
    position: 'absolute',
    top: dimensions.paddingM,
    left: dimensions.paddingM,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: dimensions.paddingS,
    borderRadius: dimensions.radiusM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  legendTitle: {
    fontSize: dimensions.fontS,
    fontWeight: '700',
    color: '#374151',
    marginBottom: moderateScale(4),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: moderateScale(2),
  },
  legendColor: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(2),
    marginRight: moderateScale(6),
  },
  legendText: {
    fontSize: dimensions.fontXS,
    color: '#6B7280',
  },
  mapControls: {
    position: 'absolute',
    top: dimensions.paddingM,
    right: dimensions.paddingM,
    gap: dimensions.paddingS,
  },
  mapControlButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  // Quick Stats
  quickStats: {
    backgroundColor: '#ffffff',
    paddingHorizontal: dimensions.paddingM,
    paddingVertical: dimensions.paddingM,
    paddingBottom: dimensions.tabBarHeight + dimensions.paddingM,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: dimensions.paddingS,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: dimensions.paddingS,
    backgroundColor: '#F9FAFB',
    borderRadius: dimensions.radiusM,
  },
  statIcon: {
    marginBottom: moderateScale(4),
  },
  statValue: {
    fontSize: dimensions.fontL,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: dimensions.fontXS,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: moderateScale(2),
  },
  
  // Modal Updates
  secondaryActions: {
    flexDirection: 'row',
    gap: dimensions.paddingS,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: dimensions.paddingM,
    borderRadius: dimensions.radiusM,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  // Building Info Modal
  buildingInfoContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  buildingInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dimensions.paddingM,
    paddingBottom: dimensions.paddingM,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeInfoButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.paddingM,
  },
  buildingInfoTitle: {
    fontSize: dimensions.fontXL,
    fontWeight: '700',
    color: '#111827',
  },
  buildingInfoContent: {
    flex: 1,
  },
  buildingOverview: {
    margin: dimensions.paddingM,
    borderRadius: dimensions.radiusL,
    overflow: 'hidden',
  },
  buildingHeaderGradient: {
    padding: dimensions.paddingL,
    alignItems: 'center',
  },
  buildingName: {
    fontSize: dimensions.fontXXL,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: dimensions.paddingS,
    textAlign: 'center',
  },
  buildingAddress: {
    fontSize: dimensions.fontM,
    color: 'rgba(255,255,255,0.9)',
    marginTop: moderateScale(4),
    textAlign: 'center',
  },
  quickInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dimensions.paddingS,
    paddingHorizontal: dimensions.paddingM,
  },
  quickInfoCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#F9FAFB',
    padding: dimensions.paddingM,
    borderRadius: dimensions.radiusL,
    alignItems: 'center',
  },
  quickInfoValue: {
    fontSize: dimensions.fontXL,
    fontWeight: '800',
    color: '#111827',
    marginTop: dimensions.paddingS,
  },
  quickInfoLabel: {
    fontSize: dimensions.fontS,
    color: '#6B7280',
    marginTop: moderateScale(2),
  },
  buildingSection: {
    margin: dimensions.paddingM,
  },
  sectionTitle: {
    fontSize: dimensions.fontXL,
    fontWeight: '700',
    color: '#111827',
    marginBottom: dimensions.paddingM,
  },
  hoursContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: dimensions.radiusL,
    padding: dimensions.paddingM,
  },
  hoursItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: dimensions.paddingS,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  hoursDay: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#374151',
  },
  hoursTime: {
    fontSize: dimensions.fontM,
    color: '#6B7280',
  },
  servicesGrid: {
    gap: dimensions.paddingS,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: dimensions.paddingM,
    borderRadius: dimensions.radiusL,
  },
  serviceIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.paddingM,
  },
  serviceName: {
    flex: 1,
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#374151',
  },
  
  // Zoom Controls
  mapControlButtonDisabled: {
    opacity: 0.5,
  },
  zoomIndicator: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(12),
    paddingHorizontal: dimensions.paddingS,
    paddingVertical: moderateScale(4),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: dimensions.paddingXS,
  },
  zoomText: {
    fontSize: dimensions.fontXS,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});

export default MapScreen; 