import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Marker, Defs, G } from 'react-native-svg';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store/store';
import { setMapCenter, setMapZoom, toggleShowBeacons, toggleShowNearbyUsers } from '../../../store/slices/navigationSlice';
import { useLocationTracking } from '../../../hooks/useLocationTracking';
import type { UserLocation, Route, BeaconData } from '../../../types';

interface RealTimeMapProps {
  style?: any;
  showControls?: boolean;
  followUser?: boolean;
  onLocationPress?: (coordinates: { lat: number; lng: number }) => void;
  onRouteComplete?: () => void;
}

interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const RealTimeMap: React.FC<RealTimeMapProps> = ({
  style,
  showControls = true,
  followUser = true,
  onLocationPress,
  onRouteComplete,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  
  const {
    currentLocation,
    currentRoute,
    isNavigating,
    currentStep,
    mapCenter,
    mapZoom,
    showBeacons,
    showNearbyUsers,
    nearbyUsers,
    locationTracking,
  } = useSelector((state: RootState) => state.navigation);

  const { isTracking, accuracy, connectionStatus } = useLocationTracking({
    enableHighAccuracy: true,
    enableBeacons: true,
    autoStart: true,
  });

  const [mapBounds, setMapBounds] = useState<MapBounds>({
    minLat: 49.282,
    maxLat: 49.284,
    minLng: -123.122,
    maxLng: -123.120,
  });

  const svgRef = useRef<any>(null);
  const mapContainerRef = useRef<View>(null);

  // UFV Building T map bounds (approximate)
  const buildingBounds = {
    minLat: 49.2825,
    maxLat: 49.2830,
    minLng: -123.1210,
    maxLng: -123.1200,
  };

  // Initialize map center and bounds
  useEffect(() => {
    if (!mapCenter && currentLocation) {
      dispatch(setMapCenter(currentLocation.coordinates));
    }
    
    if (currentLocation && followUser) {
      dispatch(setMapCenter(currentLocation.coordinates));
    }
  }, [currentLocation, mapCenter, followUser, dispatch]);

  // Convert GPS coordinates to screen coordinates
  const coordinatesToScreen = useCallback((lat: number, lng: number) => {
    const bounds = mapBounds;
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * screenWidth;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * screenHeight * 0.7;
    return { x, y };
  }, [mapBounds]);

  // Convert screen coordinates to GPS coordinates
  const screenToCoordinates = useCallback((x: number, y: number) => {
    const bounds = mapBounds;
    const lng = bounds.minLng + (x / screenWidth) * (bounds.maxLng - bounds.minLng);
    const lat = bounds.maxLat - (y / (screenHeight * 0.7)) * (bounds.maxLat - bounds.minLat);
    return { lat, lng };
  }, [mapBounds]);

  // Handle map press
  const handleMapPress = useCallback((event: any) => {
    if (onLocationPress) {
      const { locationX, locationY } = event.nativeEvent;
      const coordinates = screenToCoordinates(locationX, locationY);
      onLocationPress(coordinates);
    }
  }, [onLocationPress, screenToCoordinates]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    dispatch(setMapZoom(Math.min(mapZoom + 1, 22)));
  }, [mapZoom, dispatch]);

  const zoomOut = useCallback(() => {
    dispatch(setMapZoom(Math.max(mapZoom - 1, 1)));
  }, [mapZoom, dispatch]);

  // Center on user location
  const centerOnUser = useCallback(() => {
    if (currentLocation) {
      dispatch(setMapCenter(currentLocation.coordinates));
    }
  }, [currentLocation, dispatch]);

  // Render user location indicator
  const renderUserLocation = () => {
    if (!currentLocation) return null;

    const screenPos = coordinatesToScreen(
      currentLocation.coordinates.lat,
      currentLocation.coordinates.lng
    );

    const accuracyRadius = Math.max(accuracy * mapZoom * 0.5, 10);

    return (
      <G key="user-location">
        {/* Accuracy circle */}
        <Circle
          cx={screenPos.x}
          cy={screenPos.y}
          r={accuracyRadius}
          fill="rgba(0, 122, 255, 0.2)"
          stroke="rgba(0, 122, 255, 0.5)"
          strokeWidth="2"
        />
        
        {/* User dot */}
        <Circle
          cx={screenPos.x}
          cy={screenPos.y}
          r="8"
          fill="#007AFF"
          stroke="white"
          strokeWidth="3"
        />
        
        {/* Direction indicator if moving */}
        {isTracking && (
          <Path
            d={`M ${screenPos.x} ${screenPos.y - 12} L ${screenPos.x - 4} ${screenPos.y - 6} L ${screenPos.x + 4} ${screenPos.y - 6} Z`}
            fill="white"
          />
        )}
      </G>
    );
  };

  // Render route path
  const renderRoute = () => {
    if (!currentRoute || !currentRoute.path.length) return null;

    const pathCoordinates = currentRoute.path.map(node => 
      coordinatesToScreen(node.coordinates.lat, node.coordinates.lng)
    );

    const pathData = pathCoordinates.reduce((path, point, index) => {
      return path + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
    }, '');

    return (
      <G key="route">
        {/* Route line */}
        <Path
          d={pathData}
          stroke="#007AFF"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={isNavigating ? "0" : "8,4"}
        />
        
        {/* Start marker */}
        <Circle
          cx={pathCoordinates[0].x}
          cy={pathCoordinates[0].y}
          r="6"
          fill="#34C759"
          stroke="white"
          strokeWidth="2"
        />
        
        {/* End marker */}
        <Circle
          cx={pathCoordinates[pathCoordinates.length - 1].x}
          cy={pathCoordinates[pathCoordinates.length - 1].y}
          r="6"
          fill="#FF3B30"
          stroke="white"
          strokeWidth="2"
        />
        
        {/* Current step indicator */}
        {isNavigating && currentStep < pathCoordinates.length && (
          <Circle
            cx={pathCoordinates[currentStep].x}
            cy={pathCoordinates[currentStep].y}
            r="8"
            fill="#FF9500"
            stroke="white"
            strokeWidth="3"
          />
        )}
      </G>
    );
  };

  // Render beacons
  const renderBeacons = () => {
    if (!showBeacons || !locationTracking.lastBeaconScan.length) return null;

    return locationTracking.lastBeaconScan.map((beacon, index) => {
      const screenPos = coordinatesToScreen(
        beacon.coordinates.lat,
        beacon.coordinates.lng
      );

      const signalStrength = Math.max(0, (beacon.rssi + 100) / 100);
      const opacity = Math.max(0.3, signalStrength);

      return (
        <G key={`beacon-${beacon.id}`}>
          <Circle
            cx={screenPos.x}
            cy={screenPos.y}
            r="6"
            fill={`rgba(255, 149, 0, ${opacity})`}
            stroke="white"
            strokeWidth="2"
          />
          
          {/* Signal strength rings */}
          {Array.from({ length: 3 }).map((_, ringIndex) => (
            <Circle
              key={`ring-${ringIndex}`}
              cx={screenPos.x}
              cy={screenPos.y}
              r={8 + ringIndex * 6}
              fill="none"
              stroke={`rgba(255, 149, 0, ${opacity * (0.5 - ringIndex * 0.1)})`}
              strokeWidth="1"
            />
          ))}
        </G>
      );
    });
  };

  // Render nearby users
  const renderNearbyUsers = () => {
    if (!showNearbyUsers || !nearbyUsers.length) return null;

    return nearbyUsers.map((user, index) => {
      const screenPos = coordinatesToScreen(
        user.location.coordinates.lat,
        user.location.coordinates.lng
      );

      return (
        <G key={`user-${user.userId}`}>
          <Circle
            cx={screenPos.x}
            cy={screenPos.y}
            r="8"
            fill="#30D158"
            stroke="white"
            strokeWidth="2"
          />
          
          {/* Distance indicator */}
          <Circle
            cx={screenPos.x}
            cy={screenPos.y}
            r={Math.max(12, user.distance * 2)}
            fill="none"
            stroke="rgba(48, 209, 88, 0.3)"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        </G>
      );
    });
  };

  // Render building layout (simplified)
  const renderBuildingLayout = () => {
    // Simplified UFV Building T layout
    const buildingOutline = [
      coordinatesToScreen(49.2825, -123.1210),
      coordinatesToScreen(49.2825, -123.1200),
      coordinatesToScreen(49.2830, -123.1200),
      coordinatesToScreen(49.2830, -123.1210),
    ];

    const pathData = buildingOutline.reduce((path, point, index) => {
      return path + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
    }, '') + ' Z';

    return (
      <G key="building">
        <Path
          d={pathData}
          fill="rgba(142, 142, 147, 0.1)"
          stroke="rgba(142, 142, 147, 0.5)"
          strokeWidth="2"
        />
      </G>
    );
  };

  // Connection status indicator
  const renderConnectionStatus = () => {
    const { webSocket, api } = connectionStatus;
    
    return (
      <View style={styles.connectionStatus}>
        <View style={[styles.statusDot, { backgroundColor: webSocket ? '#34C759' : '#FF3B30' }]} />
        <Text style={styles.statusText}>
          {webSocket ? 'Live' : 'Offline'}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]} ref={mapContainerRef}>
      {/* Map SVG */}
      <View style={styles.mapContainer} onTouchStart={handleMapPress}>
        <Svg
          ref={svgRef}
          width={screenWidth}
          height={screenHeight * 0.7}
          style={styles.map}
        >
          <Defs>
            {/* Define markers and patterns here if needed */}
          </Defs>
          
          {renderBuildingLayout()}
          {renderRoute()}
          {renderBeacons()}
          {renderNearbyUsers()}
          {renderUserLocation()}
        </Svg>
      </View>

      {/* Loading indicator */}
      {!isTracking && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      )}

      {/* Connection status */}
      {renderConnectionStatus()}

      {/* Map controls */}
      {showControls && (
        <View style={styles.controls}>
          {/* Zoom controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.controlButton} onPress={zoomIn}>
              <Ionicons name="add" size={24} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={zoomOut}>
              <Ionicons name="remove" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* Center on user */}
          <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
            <Ionicons 
              name="locate" 
              size={24} 
              color={currentLocation ? "#007AFF" : "#8E8E93"} 
            />
          </TouchableOpacity>

          {/* Layer toggles */}
          <View style={styles.layerControls}>
            <TouchableOpacity 
              style={[styles.layerButton, showBeacons && styles.layerButtonActive]} 
              onPress={() => dispatch(toggleShowBeacons())}
            >
              <Ionicons name="radio" size={20} color={showBeacons ? "white" : "#8E8E93"} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.layerButton, showNearbyUsers && styles.layerButtonActive]} 
              onPress={() => dispatch(toggleShowNearbyUsers())}
            >
              <Ionicons name="people" size={20} color={showNearbyUsers ? "white" : "#8E8E93"} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Accuracy indicator */}
      {isTracking && (
        <View style={styles.accuracyIndicator}>
          <View style={[styles.accuracyDot, { 
            backgroundColor: accuracy < 5 ? '#34C759' : accuracy < 10 ? '#FF9500' : '#FF3B30' 
          }]} />
          <Text style={styles.accuracyText}>±{accuracy.toFixed(1)}m</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  connectionStatus: {
    position: 'absolute',
    top: 60,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  controls: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    alignItems: 'flex-end',
  },
  zoomControls: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  layerControls: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  layerButton: {
    padding: 8,
    borderRadius: 4,
    marginVertical: 2,
  },
  layerButtonActive: {
    backgroundColor: '#007AFF',
  },
  accuracyIndicator: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accuracyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});

export default RealTimeMap;