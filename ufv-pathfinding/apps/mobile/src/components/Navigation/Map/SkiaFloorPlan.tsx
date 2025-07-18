import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import {
  Canvas,
  Path,
  Circle,
  Group,
  Text,
  Skia,
} from '@shopify/react-native-skia';
import { UFV_BUILDING_T_ROOMS, BUILDING_BOUNDS, UFVRoom } from '../../../data/ufvRoomData';

interface SkiaFloorPlanProps {
  selectedRoom?: {
    id: string;
    name: string;
    type: string;
    floor: number;
  } | null;
  showNavigation?: boolean;
  onRoomPress?: (roomId: string) => void;
  userLocation?: { x: number; y: number };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CANVAS_WIDTH = screenWidth;
const CANVAS_HEIGHT = screenHeight - 200;

// Coordinate transformer from UTM to screen coordinates
const utmToScreen = (utmX: number, utmY: number) => {
  const { minX, maxX, minY, maxY } = BUILDING_BOUNDS;
  
  // Add padding
  const padding = 40;
  const availableWidth = CANVAS_WIDTH - 2 * padding;
  const availableHeight = CANVAS_HEIGHT - 2 * padding;
  
  // Calculate scale to fit the building
  const buildingWidth = maxX - minX;
  const buildingHeight = maxY - minY;
  const scale = Math.min(availableWidth / buildingWidth, availableHeight / buildingHeight);
  
  return {
    x: padding + (utmX - minX) * scale,
    y: padding + (maxY - utmY) * scale, // Flip Y coordinate
  };
};

// Generate room path from coordinates and area
const generateRoomPath = (room: UFVRoom) => {
  const center = utmToScreen(room.x, room.y);
  const roomSize = Math.sqrt(room.area) * 0.8; // Scale room size
  
  const path = Skia.Path.Make();
  path.addRect(
    Skia.XYWHRect(
      center.x - roomSize / 2,
      center.y - roomSize / 2,
      roomSize,
      roomSize
    )
  );
  return path;
};

// Get room color based on type
const getRoomColor = (type: UFVRoom['type'], isSelected: boolean = false) => {
  const colors = {
    academic: isSelected ? '#2563EB' : '#3B82F6',
    office: isSelected ? '#DC2626' : '#EF4444',
    utility: isSelected ? '#7C2D12' : '#A16207',
    study: isSelected ? '#059669' : '#10B981',
    washroom: isSelected ? '#7C3AED' : '#8B5CF6',
    entrance: isSelected ? '#DC2626' : '#EF4444',
    hallway: isSelected ? '#374151' : '#6B7280',
  };
  return colors[type] || '#6B7280';
};

const SkiaFloorPlan: React.FC<SkiaFloorPlanProps> = ({
  selectedRoom,
  showNavigation = false,
  onRoomPress,
  userLocation,
}) => {

  // Generate room paths
  const roomPaths = useMemo(() => {
    return UFV_BUILDING_T_ROOMS.map(room => ({
      room,
      path: generateRoomPath(room),
      color: getRoomColor(room.type, selectedRoom?.id === room.id),
    }));
  }, [selectedRoom]);

  // Building outline path
  const buildingPath = useMemo(() => {
    const topLeft = utmToScreen(BUILDING_BOUNDS.minX, BUILDING_BOUNDS.maxY);
    const bottomRight = utmToScreen(BUILDING_BOUNDS.maxX, BUILDING_BOUNDS.minY);
    
    const path = Skia.Path.Make();
    path.addRect(
      Skia.XYWHRect(
        topLeft.x,
        topLeft.y,
        bottomRight.x - topLeft.x,
        bottomRight.y - topLeft.y
      )
    );
    return path;
  }, []);

  // User location
  const userLocationScreen = useMemo(() => {
    if (!userLocation) return null;
    return utmToScreen(userLocation.x, userLocation.y);
  }, [userLocation]);

  // Navigation path (if showing navigation)
  const navigationPath = useMemo(() => {
    if (!showNavigation || !selectedRoom || !userLocation) return null;
    
    const selectedRoomData = UFV_BUILDING_T_ROOMS.find(r => r.id === selectedRoom.id);
    if (!selectedRoomData) return null;
    
    const start = utmToScreen(userLocation.x, userLocation.y);
    const end = utmToScreen(selectedRoomData.x, selectedRoomData.y);
    
    const path = Skia.Path.Make();
    path.moveTo(start.x, start.y);
    path.lineTo(end.x, end.y);
    return path;
  }, [showNavigation, selectedRoom, userLocation]);

  // Handle room taps
  const handleRoomTap = (roomId: string) => {
    if (onRoomPress) {
      onRoomPress(roomId);
    }
  };

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        <Group>
          {/* Building outline */}
          <Path
            path={buildingPath}
            style="stroke"
            strokeWidth={2}
            color="#374151"
          />
          
          {/* Rooms */}
          {roomPaths.map(({ room, path, color }) => (
            <Group key={room.id}>
              <Path
                path={path}
                style="fill"
                color={color}
                opacity={0.8}
              />
              <Path
                path={path}
                style="stroke"
                strokeWidth={1}
                color="#ffffff"
              />
            </Group>
          ))}
          
          {/* Navigation path */}
          {navigationPath && (
            <Path
              path={navigationPath}
              style="stroke"
              strokeWidth={4}
              color="#10B981"
              strokeCap="round"
              strokeJoin="round"
              opacity={0.9}
            />
          )}
          
          {/* User location */}
          {userLocationScreen && (
            <Group>
              <Circle
                cx={userLocationScreen.x}
                cy={userLocationScreen.y}
                r={8}
                color="#2563EB"
                opacity={0.3}
              />
              <Circle
                cx={userLocationScreen.x}
                cy={userLocationScreen.y}
                r={4}
                color="#2563EB"
              />
            </Group>
          )}
          
          {/* Selected room highlight */}
          {selectedRoom && (
            <Group>
              {roomPaths
                .filter(({ room }) => room.id === selectedRoom.id)
                .map(({ room, path }) => (
                  <Path
                    key={`highlight-${room.id}`}
                    path={path}
                    style="stroke"
                    strokeWidth={3}
                    color="#10B981"
                    opacity={0.8}
                  />
                ))}
            </Group>
          )}
        </Group>
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  canvas: {
    flex: 1,
  },
});

export default SkiaFloorPlan;