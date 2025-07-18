import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import { PathfindingService } from '../../../services/PathfindingService';

interface NavigationMapProps {
  selectedRoom?: {
    id: string;
    name: string;
    type: string;
    floor: number;
  } | null;
  showNavigation?: boolean;
  onLocationPress?: (roomId: string) => void;
  onRecenter?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Initialize pathfinding service
const pathfindingService = new PathfindingService();

const NavigationMap: React.FC<NavigationMapProps> = ({
  selectedRoom,
  showNavigation = false,
  onLocationPress,
  onRecenter,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [userLocation, setUserLocation] = useState({ x: 50, y: 200 });
  const [buildingRooms, setBuildingRooms] = useState<any[]>([]);

  // Load real room data from pathfinding service
  useEffect(() => {
    const loadRooms = () => {
      const serviceRooms = pathfindingService.getAllRooms();
      const roomsWithLayout = serviceRooms.map((room: any) => ({
        ...room,
        // Convert room coordinates to map coordinates
        x: room.x * 2 + 100, // Scale and offset
        y: room.y * 2 + 100,
        width: Math.sqrt(room.area || 100) * 2,
        height: Math.sqrt(room.area || 100) * 2,
        name: room.desc || room.id,
        type: room.type || 'facility',
      }));
      setBuildingRooms(roomsWithLayout);
    };
    
    loadRooms();
  }, []);

  const animatedScale = new Animated.Value(1);
  const animatedX = new Animated.Value(0);
  const animatedY = new Animated.Value(0);

  // Pan responder for map interaction
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      setPanX(gestureState.dx);
      setPanY(gestureState.dy);
    },
    onPanResponderRelease: () => {
      setPanX(0);
      setPanY(0);
    },
  });

  // Get room color based on type
  const getRoomColor = (type: string) => {
    switch (type) {
      case 'lab': return '#3B82F6';
      case 'classroom': return '#10B981';
      case 'office': return '#F59E0B';
      case 'facility': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
    Animated.spring(animatedScale, {
      toValue: zoomLevel + 0.5,
      useNativeDriver: true,
    }).start();
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
    Animated.spring(animatedScale, {
      toValue: zoomLevel - 0.5,
      useNativeDriver: true,
    }).start();
  };

  // Recenter map
  const handleRecenter = () => {
    setPanX(0);
    setPanY(0);
    setZoomLevel(1);
    Animated.parallel([
      Animated.spring(animatedX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(animatedY, { toValue: 0, useNativeDriver: true }),
      Animated.spring(animatedScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onRecenter?.();
  };

  // Mock navigation path
  const navigationPath = selectedRoom ? [
    { x: userLocation.x, y: userLocation.y },
    { x: userLocation.x + 50, y: userLocation.y - 20 },
    { x: buildingRooms.find(r => r.id === selectedRoom.id)?.x || 100, y: buildingRooms.find(r => r.id === selectedRoom.id)?.y || 150 },
  ] : [];

  const pathString = navigationPath.length > 0 
    ? `M ${navigationPath[0].x} ${navigationPath[0].y} ${navigationPath.map(p => `L ${p.x} ${p.y}`).join(' ')}`
    : '';

  return (
    <View style={styles.container}>
      {/* Map Canvas */}
      <View style={styles.mapCanvas} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.mapContent,
            {
              transform: [
                { translateX: panX },
                { translateY: panY },
                { scale: zoomLevel },
              ],
            },
          ]}
        >
          <Svg width={screenWidth} height={screenHeight - 200} viewBox="0 0 400 400">
            {/* Building outline */}
            <Path
              d="M 50 50 L 350 50 L 350 350 L 50 350 Z"
              stroke="#9CA3AF"
              strokeWidth="2"
              fill="none"
            />

            {/* Navigation path */}
            {showNavigation && pathString && (
              <Path
                d={pathString}
                stroke="#4CAF50"
                strokeWidth="4"
                fill="none"
                strokeDasharray="8,4"
              />
            )}

            {/* Rooms */}
            {buildingRooms.map((room) => (
              <React.Fragment key={room.id}>
                <Path
                  d={`M ${room.x} ${room.y} L ${room.x + room.width} ${room.y} L ${room.x + room.width} ${room.y + room.height} L ${room.x} ${room.y + room.height} Z`}
                  fill={selectedRoom?.id === room.id ? '#4CAF50' : getRoomColor(room.type)}
                  stroke={selectedRoom?.id === room.id ? '#16A34A' : '#ffffff'}
                  strokeWidth="2"
                  opacity={selectedRoom?.id === room.id ? 1 : 0.7}
                />
                <SvgText
                  x={room.x + room.width / 2}
                  y={room.y + room.height / 2}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#ffffff"
                  fontWeight="bold"
                >
                  {room.id}
                </SvgText>
              </React.Fragment>
            ))}

            {/* User location */}
            <Circle
              cx={userLocation.x}
              cy={userLocation.y}
              r="8"
              fill="#2196F3"
              stroke="#ffffff"
              strokeWidth="2"
            />
            
            {/* Destination marker */}
            {selectedRoom && (
              <Circle
                cx={buildingRooms.find(r => r.id === selectedRoom.id)?.x || 100}
                cy={buildingRooms.find(r => r.id === selectedRoom.id)?.y || 150}
                r="12"
                fill="#EF4444"
                stroke="#ffffff"
                strokeWidth="2"
              />
            )}
          </Svg>
        </Animated.View>
      </View>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={[styles.controlButton, zoomLevel >= 3 && styles.controlButtonDisabled]}
          onPress={handleZoomIn}
          disabled={zoomLevel >= 3}
        >
          <Ionicons name="add" size={24} color={zoomLevel >= 3 ? "#9CA3AF" : "#374151"} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, zoomLevel <= 0.5 && styles.controlButtonDisabled]}
          onPress={handleZoomOut}
          disabled={zoomLevel <= 0.5}
        >
          <Ionicons name="remove" size={24} color={zoomLevel <= 0.5 ? "#9CA3AF" : "#374151"} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={handleRecenter}>
          <Ionicons name="locate" size={24} color="#4CAF50" />
        </TouchableOpacity>

        <View style={styles.zoomIndicator}>
          <Text style={styles.zoomText}>{Math.round(zoomLevel * 100)}%</Text>
        </View>
      </View>

      {/* Room info overlay */}
      {selectedRoom && (
        <View style={styles.roomInfo}>
          <View style={styles.roomInfoHeader}>
            <View style={[styles.roomTypeIcon, { backgroundColor: getRoomColor(selectedRoom.type) }]}>
              <Ionicons 
                name={selectedRoom.type === 'lab' ? 'library' : 
                      selectedRoom.type === 'classroom' ? 'school' : 
                      selectedRoom.type === 'office' ? 'person' : 'cafe'} 
                size={20} 
                color="#ffffff" 
              />
            </View>
            <View style={styles.roomInfoText}>
              <Text style={styles.roomInfoName}>{selectedRoom.name}</Text>
              <Text style={styles.roomInfoDetails}>
                {selectedRoom.id} • Floor {selectedRoom.floor}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Labs</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Classrooms</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>Offices</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Facilities</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  mapCanvas: {
    flex: 1,
    overflow: 'hidden',
  },
  mapContent: {
    flex: 1,
  },
  
  // Controls
  mapControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    gap: 8,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  zoomIndicator: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  zoomText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  
  // Room info
  roomInfo: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  roomInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roomInfoText: {
    flex: 1,
  },
  roomInfoName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  roomInfoDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Legend
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#374151',
  },
});

export default NavigationMap;