import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  BackHandler,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { 
  setCurrentRoute,
  cancelNavigation,
  setMapCenter,
} from '../store/slices/navigationSlice';
import { useLocationTracking } from '../hooks/useLocationTracking';
import RealTimeMap from '../components/Map/RealTimeMap/RealTimeMap';
import RealTimeNavigationPanel from '../components/Navigation/NavigationPanel/RealTimeNavigationPanel';
import RealTimeSearch from '../components/Navigation/Search/RealTimeSearch';
import LocationStatusIndicator from '../components/UI/StatusIndicators/LocationStatusIndicator';
import { 
  dimensions, 
  scale, 
  moderateScale, 
  verticalScale,
  scaleFontSize,
  isTablet,
  responsiveValue 
} from '../utils/responsive';
import type { Route } from '../types';

const { width: screenWidth } = Dimensions.get('window');

interface NavigationScreenProps {
  navigation: any;
}

export const NavigationScreen: React.FC<NavigationScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  
  const {
    currentLocation,
    currentRoute,
    isNavigating,
    locationTracking,
  } = useSelector((state: RootState) => state.navigation);

  const { isTracking, startTracking, stopTracking } = useLocationTracking({
    enableHighAccuracy: true,
    enableBeacons: true,
    autoStart: true,
  });

  const [showSearch, setShowSearch] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState('Ground Floor');
  const [mapRef, setMapRef] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapTransform, setMapTransform] = useState({ scale: 1, translateX: 0, translateY: 0 });
  
  // Popular destinations for quick access
  const popularDestinations = [
    { id: '1', name: 'Main Entrance', icon: 'enter', room: 'Entrance', time: '30s' },
    { id: '2', name: 'Washrooms', icon: 'water', room: 'Near T125', time: '1 min' },
    { id: '3', name: 'Cafeteria', icon: 'cafe', room: 'T137', time: '2 min' },
    { id: '4', name: 'Library', icon: 'library', room: 'T125', time: '1 min' },
    { id: '5', name: 'Emergency Exit', icon: 'exit', room: 'Multiple', time: '45s' },
    { id: '6', name: 'Student Services', icon: 'school', room: 'T110', time: '2 min' },
  ];
  
  // Floor options for Building T
  const floors = [
    { id: 'ground', name: 'Ground Floor', level: 0 },
    { id: 'first', name: '1st Floor', level: 1 },
    { id: 'second', name: '2nd Floor', level: 2 },
  ];

  // Handle back button behavior
  useEffect(() => {
    const backAction = () => {
      if (isNavigating) {
        Alert.alert(
          'Exit Navigation',
          'Are you sure you want to exit navigation?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Exit', 
              style: 'destructive',
              onPress: () => {
                dispatch(cancelNavigation());
                navigation.goBack();
              }
            },
          ]
        );
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isNavigating, dispatch, navigation]);

  // Start location tracking on mount
  useEffect(() => {
    const initializeTracking = async () => {
      try {
        if (!isTracking) {
          await startTracking();
        }
      } catch (error) {
        console.error('Failed to start location tracking:', error);
        Alert.alert(
          'Location Required',
          'This app requires location access to provide navigation. Please enable location services.',
          [
            { text: 'Cancel', onPress: () => navigation.goBack() },
            { text: 'Settings', onPress: () => {
              // Open app settings - platform specific
            }},
          ]
        );
      }
    };

    initializeTracking();
  }, [isTracking, startTracking, navigation]);

  // Handle route selection
  const handleRouteRequest = useCallback((route: Route) => {
    dispatch(setCurrentRoute(route));
    setShowSearch(false);
    
    // Center map on route
    if (route.path.length > 0) {
      dispatch(setMapCenter(route.path[0].coordinates));
    }
  }, [dispatch]);

  // Handle location selection from search
  const handleLocationSelect = useCallback((location: any) => {
    // Center map on selected location
    dispatch(setMapCenter(location.coordinates));
    setShowSearch(false);
  }, [dispatch]);

  // Handle map location press for interactive navigation
  const handleMapLocationPress = useCallback((coordinates: { lat: number; lng: number }) => {
    Alert.alert(
      'Navigate Here',
      `Do you want to navigate to this location?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Navigate', 
          onPress: () => {
            // Create a route to the tapped location
            const destination = {
              id: 'custom-location',
              name: 'Selected Location',
              coordinates,
              floor: selectedFloor,
            };
            
            // Start navigation
            console.log('Starting navigation to tapped location:', destination);
            // Here you would typically call your pathfinding service
            Alert.alert('Navigation Started', 'Calculating route to selected location...');
          }
        },
      ]
    );
  }, [selectedFloor]);

  // Handle navigation panel close
  const handleNavigationClose = useCallback(() => {
    dispatch(cancelNavigation());
  }, [dispatch]);

  // Handle map recenter
  const handleMapRecenter = useCallback(() => {
    if (currentLocation) {
      dispatch(setMapCenter(currentLocation.coordinates));
    }
  }, [currentLocation, dispatch]);

  // Handle search toggle
  const handleSearchToggle = useCallback(() => {
    setShowSearch(!showSearch);
  }, [showSearch]);
  
  // Handle quick destination selection
  const handleQuickDestination = useCallback((destination: any) => {
    Alert.alert(
      'Start Navigation',
      `Navigate to ${destination.name}?\n\nEstimated time: ${destination.time}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Navigation', 
          onPress: () => {
            // Create route and start navigation
            const route = {
              id: `route-to-${destination.id}`,
              destination: destination.name,
              estimatedTime: destination.time,
              coordinates: destination.coordinates || { lat: 49.0276, lng: -122.2906 }, // UFV coordinates
              floor: selectedFloor,
            };
            
            dispatch(setCurrentRoute(route as any));
            console.log('Starting navigation to:', destination);
            
            // Show navigation started confirmation
            Alert.alert(
              'Navigation Started',
              `Calculating route to ${destination.name}...\nEstimated arrival: ${destination.time}`,
              [{ text: 'OK' }]
            );
          }
        },
      ]
    );
  }, [selectedFloor, dispatch]);

  // Handle location status press
  const handleLocationStatusPress = useCallback(() => {
    if (!isTracking) {
      Alert.alert(
        'Location Tracking',
        'Location tracking is currently disabled. Would you like to enable it?',
        [
          { text: 'Cancel' },
          { text: 'Enable', onPress: () => startTracking() },
        ]
      );
    }
  }, [isTracking, startTracking]);

  // Handle zoom in
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => {
      const newZoom = Math.min(prev + 0.5, 5); // Max zoom 5x
      setMapTransform(prevTransform => ({
        ...prevTransform,
        scale: newZoom
      }));
      console.log(`Zooming in to ${newZoom}x`);
      return newZoom;
    });
  }, []);

  // Handle zoom out
  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.5, 0.5); // Min zoom 0.5x
      setMapTransform(prevTransform => ({
        ...prevTransform,
        scale: newZoom
      }));
      console.log(`Zooming out to ${newZoom}x`);
      return newZoom;
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {!isNavigating ? (
        // Navigation Planning Mode
        <View style={styles.planningMode}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + dimensions.paddingM }]}>
            <Text style={styles.headerTitle}>Navigate Building T</Text>
            <TouchableOpacity
              style={styles.mapToggleButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Ionicons 
                name={showSearch ? "map" : "search"} 
                size={dimensions.iconM} 
                color="#4CAF50" 
              />
            </TouchableOpacity>
          </View>

          {showSearch ? (
            // Search Interface
            <View style={styles.searchInterface}>
              <View style={styles.searchHeader}>
                <TouchableOpacity
                  style={styles.backToMapButton}
                  onPress={() => setShowSearch(false)}
                >
                  <Ionicons name="arrow-back" size={dimensions.iconM} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.searchTitle}>Search Destinations</Text>
              </View>
              
              <ScrollView style={styles.searchContent} showsVerticalScrollIndicator={false}>
                {/* Search Bar */}
                <View style={styles.modernSearchBar}>
                  <Ionicons name="search" size={dimensions.iconM} color="#9CA3AF" />
                  <Text style={styles.searchPlaceholder}>Where do you want to go?</Text>
                  <TouchableOpacity style={styles.voiceButton}>
                    <Ionicons name="mic" size={dimensions.iconS} color="#4CAF50" />
                  </TouchableOpacity>
                </View>

                {/* Recent Searches */}
                <View style={styles.searchSection}>
                  <Text style={styles.sectionTitle}>Recent</Text>
                  <TouchableOpacity style={styles.recentItem}>
                    <View style={styles.recentIcon}>
                      <Ionicons name="time" size={dimensions.iconS} color="#6B7280" />
                    </View>
                    <View style={styles.recentContent}>
                      <Text style={styles.recentName}>Computer Lab T-239</Text>
                      <Text style={styles.recentTime}>2 hours ago</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Popular Destinations */}
                <View style={styles.searchSection}>
                  <Text style={styles.sectionTitle}>Popular Destinations</Text>
                  {popularDestinations.map((dest) => (
                    <TouchableOpacity
                      key={dest.id}
                      style={styles.destinationItem}
                      onPress={() => {
                        setShowSearch(false);
                        handleQuickDestination(dest);
                      }}
                    >
                      <View style={styles.destinationIcon}>
                        <Ionicons name={dest.icon as any} size={dimensions.iconM} color="#4CAF50" />
                      </View>
                      <View style={styles.destinationContent}>
                        <Text style={styles.destinationName}>{dest.name}</Text>
                        <Text style={styles.destinationDetails}>{dest.room} • {dest.time} walk</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={dimensions.iconS} color="#9CA3AF" />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          ) : (
            // Map Planning Interface
            <View style={styles.mapPlanningContainer}>
              {/* Floor Selector */}
              <View style={styles.floorSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {floors.map((floor) => (
                    <TouchableOpacity
                      key={floor.id}
                      style={[
                        styles.floorButton,
                        selectedFloor === floor.name && styles.floorButtonActive
                      ]}
                      onPress={() => setSelectedFloor(floor.name)}
                    >
                      <Text style={[
                        styles.floorButtonText,
                        selectedFloor === floor.name && styles.floorButtonTextActive
                      ]}>
                        {floor.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Quick Search Bar */}
              <TouchableOpacity
                style={styles.quickSearchBar}
                onPress={() => setShowSearch(true)}
              >
                <Ionicons name="search" size={dimensions.iconM} color="#9CA3AF" />
                <Text style={styles.quickSearchText}>Search for rooms, facilities...</Text>
                <TouchableOpacity style={styles.qrButton}>
                  <Ionicons name="qr-code" size={dimensions.iconS} color="#4CAF50" />
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Interactive Map Container */}
              <View style={styles.modernMapContainer}>
                <View style={[styles.mapWrapper, { transform: [{ scale: mapTransform.scale }] }]}>
                  <RealTimeMap
                    ref={setMapRef}
                    showControls={false}
                    followUser={isTracking}
                    onLocationPress={handleMapLocationPress}
                    onRouteComplete={() => {
                      Alert.alert(
                        'Navigation Complete',
                        'You have arrived at your destination!',
                        [{ text: 'OK' }]
                      );
                    }}
                  />
                </View>
                
                {/* Interactive Map Overlay */}
                <TouchableOpacity 
                  style={styles.mapInteractionOverlay}
                  activeOpacity={1}
                  onPress={(event) => {
                    // Handle map tap for navigation
                    const { locationX, locationY } = event.nativeEvent;
                    // Convert screen coordinates to map coordinates (simplified)
                    const mapCoords = {
                      lat: 49.0276 + (locationY - 200) * 0.0001, // Simplified conversion
                      lng: -122.2906 + (locationX - 200) * 0.0001
                    };
                    handleMapLocationPress(mapCoords);
                  }}
                >
                  {/* Room Markers */}
                  {popularDestinations.map((dest) => (
                    <TouchableOpacity
                      key={dest.id}
                      style={[
                        styles.roomMarker,
                        {
                          left: moderateScale((50 + parseInt(dest.id) * 60) * mapTransform.scale), // Scale-aware positioning
                          top: moderateScale((100 + parseInt(dest.id) * 40) * mapTransform.scale),
                          transform: [{ scale: 1 / mapTransform.scale }] // Keep marker size consistent
                        }
                      ]}
                      onPress={() => handleQuickDestination(dest)}
                    >
                      <View style={styles.markerIcon}>
                        <Ionicons name={dest.icon as any} size={dimensions.iconS} color="#ffffff" />
                      </View>
                      <Text style={styles.markerLabel}>{dest.name}</Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* User Location Indicator */}
                  {currentLocation && (
                    <View style={[
                      styles.userLocationMarker,
                      {
                        left: moderateScale(150 * mapTransform.scale), // Scale-aware positioning
                        top: moderateScale(200 * mapTransform.scale),
                        transform: [{ scale: 1 / mapTransform.scale }] // Keep location indicator size consistent
                      }
                    ]}>
                      <View style={styles.userLocationDot} />
                      <View style={styles.userLocationPulse} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Interactive Map Controls */}
                <View style={styles.mapControls}>
                  <TouchableOpacity 
                    style={styles.mapControlButton}
                    onPress={() => {
                      Alert.alert(
                        'Map Layers',
                        'Choose map display options:',
                        [
                          { text: 'Standard View' },
                          { text: 'Satellite View' },
                          { text: 'Indoor View' },
                          { text: 'Cancel', style: 'cancel' }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="layers" size={dimensions.iconM} color="#374151" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.mapControlButton} 
                    onPress={handleMapRecenter}
                  >
                    <Ionicons name="locate" size={dimensions.iconM} color="#4CAF50" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.mapControlButton, zoomLevel >= 5 && styles.mapControlButtonDisabled]}
                    onPress={handleZoomIn}
                    disabled={zoomLevel >= 5}
                  >
                    <Ionicons name="add" size={dimensions.iconM} color={zoomLevel >= 5 ? "#9CA3AF" : "#374151"} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.mapControlButton, zoomLevel <= 0.5 && styles.mapControlButtonDisabled]}
                    onPress={handleZoomOut}
                    disabled={zoomLevel <= 0.5}
                  >
                    <Ionicons name="remove" size={dimensions.iconM} color={zoomLevel <= 0.5 ? "#9CA3AF" : "#374151"} />
                  </TouchableOpacity>
                  
                  {/* Zoom Level Indicator */}
                  <View style={styles.zoomIndicator}>
                    <Text style={styles.zoomText}>{Math.round(zoomLevel * 100)}%</Text>
                  </View>
                </View>

                {/* Location Status */}
                <View style={styles.modernLocationStatus}>
                  <LocationStatusIndicator
                    onPress={handleLocationStatusPress}
                    showDetails={false}
                    compact={true}
                  />
                </View>
              </View>

              {/* Quick Actions Bottom Sheet */}
              <View style={styles.quickActionsContainer}>
                <View style={styles.quickActionsHeader}>
                  <Text style={styles.quickActionsTitle}>Quick Navigation</Text>
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() => setShowQuickActions(!showQuickActions)}
                  >
                    <Ionicons 
                      name={showQuickActions ? "chevron-down" : "chevron-up"} 
                      size={dimensions.iconS} 
                      color="#9CA3AF" 
                    />
                  </TouchableOpacity>
                </View>
                
                {showQuickActions && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.quickActionsGrid}>
                      {popularDestinations.slice(0, 4).map((dest) => (
                        <TouchableOpacity
                          key={dest.id}
                          style={styles.quickActionCard}
                          onPress={() => handleQuickDestination(dest)}
                        >
                          <LinearGradient
                            colors={['#F0FDF4', '#DCFCE7']}
                            style={styles.quickActionGradient}
                          >
                            <Ionicons name={dest.icon as any} size={dimensions.iconL} color="#15803D" />
                            <Text style={styles.quickActionText}>{dest.name}</Text>
                            <Text style={styles.quickActionTime}>{dest.time}</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>
            </View>
          )}
        </View>
      ) : (
        // Active Navigation Mode
        <View style={styles.navigationMode}>
          {/* Full Screen Interactive Map */}
          <View style={styles.fullScreenMap}>
            <RealTimeMap
              ref={setMapRef}
              showControls={false}
              followUser={true}
              onLocationPress={handleMapLocationPress}
              onRouteComplete={() => {
                Alert.alert(
                  'Navigation Complete',
                  'You have arrived at your destination!',
                  [{ text: 'OK', onPress: () => dispatch(cancelNavigation()) }]
                );
              }}
              interactive={true}
              zoomEnabled={true}
              scrollEnabled={true}
              rotateEnabled={false}
              pitchEnabled={false}
              showsUserLocation={true}
              showsMyLocationButton={false}
              followUserLocation={true}
              showsCompass={true}
              showsScale={true}
            />
            
            {/* Navigation Route Overlay */}
            {currentRoute && (
              <View style={styles.routeOverlay}>
                <View style={styles.routePath} />
                <TouchableOpacity 
                  style={styles.destinationMarker}
                  onPress={() => {
                    Alert.alert('Destination', `Arriving at ${currentRoute.destination}`);
                  }}
                >
                  <Ionicons name="flag" size={dimensions.iconM} color="#ffffff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Interactive Navigation Controls */}
            <View style={[styles.navigationControls, { top: insets.top + dimensions.paddingS }]}>
              <TouchableOpacity
                style={styles.exitNavigationButton}
                onPress={() => {
                  Alert.alert(
                    'Exit Navigation',
                    'Are you sure you want to exit navigation?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Exit', 
                        style: 'destructive',
                        onPress: () => dispatch(cancelNavigation())
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="close" size={dimensions.iconM} color="#374151" />
              </TouchableOpacity>
              
              <View style={styles.navigationActionButtons}>
                <TouchableOpacity 
                  style={styles.navigationSettingsButton}
                  onPress={() => {
                    Alert.alert(
                      'Voice Guidance',
                      'Voice guidance is currently enabled',
                      [
                        { text: 'Mute', onPress: () => console.log('Voice muted') },
                        { text: 'Settings', onPress: () => console.log('Voice settings') },
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <Ionicons name="volume-high" size={dimensions.iconM} color="#4CAF50" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.navigationSettingsButton}
                  onPress={handleMapRecenter}
                >
                  <Ionicons name="locate" size={dimensions.iconM} color="#4CAF50" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.navigationSettingsButton}
                  onPress={() => {
                    Alert.alert(
                      'Route Options',
                      'Choose an option:',
                      [
                        { text: 'Alternative Route' },
                        { text: 'Add Stop' },
                        { text: 'Share Location' },
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <Ionicons name="ellipsis-horizontal" size={dimensions.iconM} color="#4CAF50" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Navigation Panel */}
          <RealTimeNavigationPanel
            style={styles.modernNavigationPanel}
            onClose={handleNavigationClose}
            onRecenter={handleMapRecenter}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Planning Mode
  planningMode: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: dimensions.paddingM,
    paddingBottom: dimensions.paddingM,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: dimensions.fontXXL,
    fontWeight: '800',
    color: '#111827',
  },
  mapToggleButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Search Interface
  searchInterface: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dimensions.paddingM,
    paddingVertical: dimensions.paddingM,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backToMapButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.paddingM,
  },
  searchTitle: {
    fontSize: dimensions.fontXL,
    fontWeight: '700',
    color: '#111827',
  },
  searchContent: {
    flex: 1,
    paddingHorizontal: dimensions.paddingM,
  },
  modernSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: dimensions.radiusL,
    paddingHorizontal: dimensions.paddingM,
    paddingVertical: dimensions.paddingM,
    marginVertical: dimensions.paddingM,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: dimensions.fontM,
    color: '#9CA3AF',
    marginLeft: dimensions.paddingS,
  },
  voiceButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Search Sections
  searchSection: {
    marginVertical: dimensions.paddingM,
  },
  sectionTitle: {
    fontSize: dimensions.fontL,
    fontWeight: '700',
    color: '#374151',
    marginBottom: dimensions.paddingS,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: dimensions.paddingM,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recentIcon: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.paddingM,
  },
  recentContent: {
    flex: 1,
  },
  recentName: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#111827',
  },
  recentTime: {
    fontSize: dimensions.fontS,
    color: '#6B7280',
    marginTop: moderateScale(2),
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: dimensions.paddingM,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  destinationIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.paddingM,
  },
  destinationContent: {
    flex: 1,
  },
  destinationName: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#111827',
  },
  destinationDetails: {
    fontSize: dimensions.fontS,
    color: '#6B7280',
    marginTop: moderateScale(2),
  },
  
  // Map Planning Interface
  mapPlanningContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  floorSelector: {
    paddingHorizontal: dimensions.paddingM,
    paddingVertical: dimensions.paddingS,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  floorButton: {
    paddingHorizontal: dimensions.paddingM,
    paddingVertical: dimensions.paddingS,
    marginRight: dimensions.paddingS,
    borderRadius: dimensions.radiusL,
    backgroundColor: '#F3F4F6',
  },
  floorButtonActive: {
    backgroundColor: '#10B981',
  },
  floorButtonText: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#6B7280',
  },
  floorButtonTextActive: {
    color: '#ffffff',
  },
  quickSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: dimensions.radiusL,
    paddingHorizontal: dimensions.paddingM,
    paddingVertical: dimensions.paddingM,
    margin: dimensions.paddingM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickSearchText: {
    flex: 1,
    fontSize: dimensions.fontM,
    color: '#9CA3AF',
    marginLeft: dimensions.paddingS,
  },
  qrButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
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
  mapControls: {
    position: 'absolute',
    top: dimensions.paddingM,
    right: dimensions.paddingM,
    gap: dimensions.paddingS,
  },
  mapControlButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modernLocationStatus: {
    position: 'absolute',
    top: dimensions.paddingM,
    left: dimensions.paddingM,
  },
  
  // Quick Actions
  quickActionsContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: dimensions.radiusXL,
    borderTopRightRadius: dimensions.radiusXL,
    paddingHorizontal: dimensions.paddingM,
    paddingTop: dimensions.paddingM,
    paddingBottom: dimensions.tabBarHeight + dimensions.paddingM,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  quickActionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.paddingS,
  },
  quickActionsTitle: {
    fontSize: dimensions.fontL,
    fontWeight: '700',
    color: '#111827',
  },
  expandButton: {
    padding: dimensions.paddingS,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: dimensions.paddingM,
    paddingVertical: dimensions.paddingS,
  },
  quickActionCard: {
    width: moderateScale(120),
    borderRadius: dimensions.radiusL,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: dimensions.paddingM,
    alignItems: 'center',
    minHeight: moderateScale(100),
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#14532D',
    textAlign: 'center',
    marginTop: dimensions.paddingS,
  },
  quickActionTime: {
    fontSize: dimensions.fontXS,
    color: '#16A34A',
    marginTop: moderateScale(2),
  },
  
  // Navigation Mode
  navigationMode: {
    flex: 1,
  },
  fullScreenMap: {
    flex: 1,
  },
  navigationControls: {
    position: 'absolute',
    left: dimensions.paddingM,
    right: dimensions.paddingM,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  exitNavigationButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  navigationSettingsButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modernNavigationPanel: {
    // Styles handled by component
  },
  
  // Interactive Map Elements
  mapInteractionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  roomMarker: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 20,
  },
  markerIcon: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  markerLabel: {
    fontSize: dimensions.fontXS,
    fontWeight: '600',
    color: '#111827',
    backgroundColor: '#ffffff',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(8),
    marginTop: moderateScale(4),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userLocationMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  userLocationDot: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  userLocationPulse: {
    position: 'absolute',
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
    zIndex: -1,
  },
  
  // Navigation Route Overlay
  routeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
  },
  routePath: {
    position: 'absolute',
    top: moderateScale(200),
    left: moderateScale(150),
    width: moderateScale(200),
    height: moderateScale(4),
    backgroundColor: '#4CAF50',
    borderRadius: moderateScale(2),
    transform: [{ rotate: '45deg' }],
  },
  destinationMarker: {
    position: 'absolute',
    top: moderateScale(120),
    right: moderateScale(80),
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  
  // Enhanced Navigation Controls
  navigationActionButtons: {
    flexDirection: 'row',
    gap: dimensions.paddingS,
  },
  
  // Zoom Controls
  mapWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
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

export default NavigationScreen; 