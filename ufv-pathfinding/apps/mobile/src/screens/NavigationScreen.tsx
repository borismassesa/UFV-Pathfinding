import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NavigationSearch from '../components/Navigation/Search/NavigationSearch';
import NavigationMap from '../components/Navigation/Map/NavigationMap';
import NavigationPanel from '../components/Navigation/Panel/NavigationPanel';
import SkiaFloorPlan from '../components/Navigation/Map/SkiaFloorPlan';

interface NavigationScreenProps {
  navigation: any;
}

// Navigation App States
type NavigationState = 'search' | 'navigating' | 'searching';

interface Room {
  id: string;
  name: string;
  type: 'classroom' | 'lab' | 'office' | 'facility';
  floor: number;
  building: string;
  description?: string;
}

export const NavigationScreen: React.FC<NavigationScreenProps> = () => {
  const insets = useSafeAreaInsets();
  const [currentState, setCurrentState] = useState<NavigationState>('search');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Indoor Navigation</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {currentState === 'search' ? (
        <View style={styles.content}>
          <SearchMode 
            onStartNavigation={() => setCurrentState('navigating')} 
            onOpenSearch={() => setCurrentState('searching')}
            onRoomSelect={(room) => {
              setSelectedRoom(room);
              setCurrentState('navigating');
            }}
          />
        </View>
      ) : currentState === 'searching' ? (
        <NavigationSearch
          onRoomSelect={(room) => {
            setSelectedRoom(room);
            setCurrentState('navigating');
          }}
          onClose={() => setCurrentState('search')}
        />
      ) : (
        <NavigationMode 
          selectedRoom={selectedRoom}
          onExitNavigation={() => setCurrentState('search')}
          onRoomChange={setSelectedRoom}
        />
      )}
    </View>
  );
};

// Search Mode Component
const SearchMode: React.FC<{ 
  onStartNavigation: () => void; 
  onOpenSearch: () => void;
  onRoomSelect: (room: Room) => void;
}> = ({ 
  onStartNavigation, 
  onOpenSearch,
  onRoomSelect
}) => {
  return (
    <View style={styles.searchMode}>
      
      {/* Search Bar */}
      <TouchableOpacity style={styles.searchBar} onPress={onOpenSearch}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <Text style={styles.searchPlaceholder}>Search rooms, labs, offices...</Text>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickButton} onPress={onStartNavigation}>
          <Ionicons name="library" size={32} color="#4CAF50" />
          <Text style={styles.quickButtonText}>Computer Lab</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickButton} onPress={onStartNavigation}>
          <Ionicons name="school" size={32} color="#4CAF50" />
          <Text style={styles.quickButtonText}>Classroom</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickButton} onPress={onStartNavigation}>
          <Ionicons name="cafe" size={32} color="#4CAF50" />
          <Text style={styles.quickButtonText}>Cafeteria</Text>
        </TouchableOpacity>
      </View>

      {/* Map Preview */}
      <View style={styles.mapPreview}>
        <SkiaFloorPlan
          selectedRoom={null}
          showNavigation={false}
          onRoomPress={(roomId) => {
            // Find room data and start navigation
            const room = { 
              id: roomId, 
              name: roomId, 
              type: 'facility' as const, 
              floor: 1, 
              building: 'T',
              description: `Room ${roomId}`
            };
            onRoomSelect(room);
          }}
          userLocation={{ x: 552310, y: 5430798 }} // Main entrance
        />
        <View style={styles.mapPreviewOverlay}>
          <Text style={styles.mapPreviewText}>Building T - Floor Plan</Text>
          <TouchableOpacity style={styles.viewMapButton}>
            <Text style={styles.viewMapButtonText}>Tap rooms to navigate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Navigation Mode Component
const NavigationMode: React.FC<{ 
  selectedRoom: Room | null; 
  onExitNavigation: () => void;
  onRoomChange: (room: Room) => void;
}> = ({ selectedRoom, onExitNavigation, onRoomChange }) => {
  return (
    <View style={styles.navigationMode}>
      {/* Full Screen Map */}
      <View style={styles.fullScreenMap}>
        <SkiaFloorPlan
          selectedRoom={selectedRoom}
          showNavigation={true}
          onRoomPress={(roomId) => {
            // Allow changing destination during navigation
            const room = { 
              id: roomId, 
              name: roomId, 
              type: 'facility' as const, 
              floor: 1, 
              building: 'T',
              description: `Room ${roomId}`
            };
            onRoomChange(room);
          }}
          userLocation={{ x: 552310, y: 5430798 }} // Main entrance
        />
      </View>

      {/* Navigation Panel */}
      <NavigationPanel
        selectedRoom={selectedRoom}
        onClose={onExitNavigation}
        onRecenter={() => console.log('Map recentered')}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  settingsButton: {
    padding: 8,
  },
  
  // Content
  content: {
    flex: 1,
    padding: 20,
  },
  
  // Search Mode
  searchMode: {
    flex: 1,
  },
  stateTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 24,
    textAlign: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#9CA3AF',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  quickButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  quickButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#16A34A',
    textAlign: 'center',
  },
  mapPreview: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  mapPreviewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(249, 250, 251, 0.95)',
    padding: 16,
    alignItems: 'center',
  },
  mapPreviewText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
  },
  viewMapButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  viewMapButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Navigation Mode
  navigationMode: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  fullScreenMap: {
    flex: 1,
  },
});

export default NavigationScreen;