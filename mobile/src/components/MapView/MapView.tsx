import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

interface Coordinates {
  x: number;
  y: number;
  latitude?: number;
  longitude?: number;
}

interface NavigationNode {
  id: string;
  coordinates: Coordinates;
  type: string;
  accessibility: string[];
}

interface RouteStep {
  nodeId: string;
  coordinates: Coordinates;
  instruction: string;
  distance: number;
  direction: string;
  landmark?: string;
}

interface MapViewProps {
  route?: NavigationNode[];
  instructions?: RouteStep[];
  currentStep?: number;
  buildingFloorPlan?: string;
  zoom?: number;
  onNodePress?: (node: NavigationNode) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const MapView: React.FC<MapViewProps> = ({
  route = [],
  instructions = [],
  currentStep = 0,
  onNodePress,
}) => {
  const [loading, setLoading] = useState(false);

  // Simple grid-based floor plan representation
  const renderFloorPlan = () => {
    const rooms = [
      { id: 'T-101', x: 1, y: 1, label: 'T-101', color: '#E3F2FD' },
      { id: 'T-102', x: 2, y: 1, label: 'T-102', color: '#E8F5E8' },
      { id: 'T-103', x: 3, y: 1, label: 'T-103', color: '#FFF3E0' },
      { id: 'T-123', x: 2, y: 3, label: 'T-123', color: '#F3E5F5' },
      { id: 'hallway', x: 1, y: 2, label: 'Hallway', color: '#F5F5F5' },
      { id: 'hallway2', x: 2, y: 2, label: 'Hallway', color: '#F5F5F5' },
      { id: 'hallway3', x: 3, y: 2, label: 'Hallway', color: '#F5F5F5' },
    ];

    return (
      <View style={styles.floorPlan}>
        {rooms.map(room => (
          <View
            key={room.id}
            style={[
              styles.room,
              {
                backgroundColor: room.color,
                left: (room.x - 1) * 100,
                top: (room.y - 1) * 80,
              }
            ]}
          >
            <Text style={styles.roomLabel}>{room.label}</Text>
          </View>
        ))}
        
        {/* Route visualization */}
        {route.map((node, index) => {
          // Map node coordinates to grid positions
          const gridX = Math.floor(node.coordinates.x / 50) * 100;
          const gridY = Math.floor(node.coordinates.y / 50) * 80;
          
          const getNodeColor = () => {
            if (index === 0) return '#4CAF50'; // Start - Green
            if (index === route.length - 1) return '#F44336'; // End - Red
            if (index === currentStep) return '#FF9800'; // Current - Orange
            if (index < currentStep) return '#9E9E9E'; // Passed - Gray
            return '#2196F3'; // Future - Blue
          };

          return (
            <TouchableOpacity
              key={node.id}
              style={[
                styles.routeNode,
                {
                  backgroundColor: getNodeColor(),
                  left: gridX + 40,
                  top: gridY + 30,
                }
              ]}
              onPress={() => onNodePress?.(node)}
            >
              <Text style={styles.nodeLabel}>{index + 1}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}
      
      <ScrollView
        style={styles.scrollView}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderFloorPlan()}
      </ScrollView>
      
      {/* Map legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Start</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>Current</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
          <Text style={styles.legendText}>Destination</Text>
        </View>
      </View>

      {/* Map info */}
      <View style={styles.mapControls}>
        <Text style={styles.mapInfo}>
          🏢 Building T Floor Plan • {route.length > 0 ? `${route.length} waypoints` : 'No route'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2196F3',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  floorPlan: {
    width: 400,
    height: 300,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  room: {
    position: 'absolute',
    width: 90,
    height: 70,
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  routeNode: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  nodeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  mapControls: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mapInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default MapView; 