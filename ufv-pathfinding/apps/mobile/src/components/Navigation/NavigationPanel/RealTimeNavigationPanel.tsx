import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store/store';
import {
  nextNavigationStep,
  completeNavigation,
  cancelNavigation,
  updateNavigationStep,
} from '../../../store/slices/navigationSlice';
import { useLocationTracking } from '../../../hooks/useLocationTracking';
import type { NavigationInstruction, Route, UserLocation } from '../../../types';

interface RealTimeNavigationPanelProps {
  style?: any;
  onClose?: () => void;
  onRecenter?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const RealTimeNavigationPanel: React.FC<RealTimeNavigationPanelProps> = ({
  style,
  onClose,
  onRecenter,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  
  const {
    currentLocation,
    currentRoute,
    isNavigating,
    currentStep,
    locationTracking,
  } = useSelector((state: RootState) => state.navigation);

  const { accuracy, connectionStatus } = useLocationTracking();

  const [panelHeight] = useState(new Animated.Value(0));
  const [isExpanded, setIsExpanded] = useState(false);
  const [distanceToNext, setDistanceToNext] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);

  // Show/hide panel based on navigation state
  useEffect(() => {
    Animated.spring(panelHeight, {
      toValue: isNavigating ? (isExpanded ? 400 : 120) : 0,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [isNavigating, isExpanded, panelHeight]);

  // Calculate distance to next waypoint
  useEffect(() => {
    if (!currentLocation || !currentRoute || !isNavigating) return;

    const currentInstruction = currentRoute.instructions[currentStep];
    if (!currentInstruction) return;

    // Calculate distance to next waypoint
    const distance = calculateDistance(
      currentLocation.coordinates,
      currentInstruction.node.coordinates
    );

    setDistanceToNext(distance);

    // Auto-advance to next step if close enough
    if (distance < 5 && currentStep < currentRoute.instructions.length - 1) {
      dispatch(nextNavigationStep());
    } else if (distance < 5 && currentStep === currentRoute.instructions.length - 1) {
      // Reached destination
      handleNavigationComplete();
    }
  }, [currentLocation, currentRoute, isNavigating, currentStep, dispatch]);

  // Calculate estimated time remaining
  useEffect(() => {
    if (!currentRoute || !isNavigating) return;

    const remainingInstructions = currentRoute.instructions.slice(currentStep);
    const remainingDistance = remainingInstructions.reduce(
      (total, instruction) => total + instruction.distance,
      0
    );

    // Estimate time based on walking speed (1.4 m/s average)
    const estimatedTime = Math.round(remainingDistance / 1.4);
    setEstimatedTimeRemaining(estimatedTime);
  }, [currentRoute, currentStep, isNavigating]);

  const calculateDistance = (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRadians(coord2.lat - coord1.lat);
    const dLng = toRadians(coord2.lng - coord1.lng);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  const handleNavigationComplete = useCallback(() => {
    Alert.alert(
      'Navigation Complete',
      'You have arrived at your destination!',
      [
        {
          text: 'OK',
          onPress: () => {
            dispatch(completeNavigation());
            onClose?.();
          },
        },
      ]
    );
  }, [dispatch, onClose]);

  const handleCancelNavigation = useCallback(() => {
    Alert.alert(
      'Cancel Navigation',
      'Are you sure you want to stop navigation?',
      [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            dispatch(cancelNavigation());
            onClose?.();
          },
        },
      ]
    );
  }, [dispatch, onClose]);

  const togglePanel = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getDirectionIcon = (direction?: string): string => {
    switch (direction) {
      case 'left': return 'arrow-back';
      case 'right': return 'arrow-forward';
      case 'up': return 'arrow-up';
      case 'down': return 'arrow-down';
      case 'straight': return 'arrow-up';
      default: return 'arrow-up';
    }
  };

  const getCurrentInstruction = (): NavigationInstruction | null => {
    if (!currentRoute || currentStep >= currentRoute.instructions.length) return null;
    return currentRoute.instructions[currentStep];
  };

  const getUpcomingInstructions = (): NavigationInstruction[] => {
    if (!currentRoute) return [];
    return currentRoute.instructions.slice(currentStep + 1, currentStep + 4);
  };

  const renderCurrentStep = () => {
    const instruction = getCurrentInstruction();
    if (!instruction) return null;

    return (
      <View style={styles.currentStep}>
        <View style={styles.instructionRow}>
          <View style={styles.directionIconContainer}>
            <Ionicons
              name={getDirectionIcon(instruction.direction) as any}
              size={32}
              color="#007AFF"
            />
          </View>
          
          <View style={styles.instructionText}>
            <Text style={styles.instructionPrimary}>{instruction.instruction}</Text>
            {instruction.landmark && (
              <Text style={styles.instructionSecondary}>Near {instruction.landmark}</Text>
            )}
            {instruction.floor && (
              <Text style={styles.floorIndicator}>Floor {instruction.floor}</Text>
            )}
          </View>
          
          <View style={styles.distanceContainer}>
            <Text style={styles.distanceText}>{formatDistance(distanceToNext)}</Text>
            <Text style={styles.distanceLabel}>to turn</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderProgressBar = () => {
    if (!currentRoute) return null;

    const progress = (currentStep / Math.max(currentRoute.instructions.length - 1, 1)) * 100;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {currentRoute.instructions.length}
        </Text>
      </View>
    );
  };

  const renderRouteInfo = () => {
    if (!currentRoute) return null;

    return (
      <View style={styles.routeInfo}>
        <View style={styles.routeMetric}>
          <Ionicons name="time-outline" size={16} color="#8E8E93" />
          <Text style={styles.metricText}>{formatTime(estimatedTimeRemaining)}</Text>
        </View>
        
        <View style={styles.routeMetric}>
          <Ionicons name="walk-outline" size={16} color="#8E8E93" />
          <Text style={styles.metricText}>{formatDistance(currentRoute.totalDistance)}</Text>
        </View>
        
        <View style={styles.routeMetric}>
          <Ionicons name="location-outline" size={16} color="#8E8E93" />
          <Text style={styles.metricText}>±{accuracy.toFixed(1)}m</Text>
        </View>
      </View>
    );
  };

  const renderUpcomingSteps = () => {
    if (!isExpanded) return null;

    const upcomingSteps = getUpcomingInstructions();

    return (
      <ScrollView style={styles.upcomingSteps} showsVerticalScrollIndicator={false}>
        <Text style={styles.upcomingTitle}>Upcoming Directions</Text>
        
        {upcomingSteps.map((instruction, index) => (
          <View key={`upcoming-${index}`} style={styles.upcomingStep}>
            <View style={styles.upcomingStepNumber}>
              <Text style={styles.stepNumberText}>{currentStep + index + 2}</Text>
            </View>
            
            <Ionicons
              name={getDirectionIcon(instruction.direction) as any}
              size={20}
              color="#8E8E93"
              style={styles.upcomingIcon}
            />
            
            <View style={styles.upcomingText}>
              <Text style={styles.upcomingInstruction}>{instruction.instruction}</Text>
              {instruction.landmark && (
                <Text style={styles.upcomingLandmark}>Near {instruction.landmark}</Text>
              )}
            </View>
            
            <Text style={styles.upcomingDistance}>
              {formatDistance(instruction.distance)}
            </Text>
          </View>
        ))}
        
        {upcomingSteps.length === 0 && (
          <View style={styles.destinationReached}>
            <Ionicons name="flag" size={24} color="#34C759" />
            <Text style={styles.destinationText}>Destination ahead</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderControls = () => {
    return (
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={onRecenter}>
          <Ionicons name="locate" size={20} color="#007AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={togglePanel}>
          <Ionicons 
            name={isExpanded ? "chevron-down" : "chevron-up"} 
            size={20} 
            color="#007AFF" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.closeButton} onPress={handleCancelNavigation}>
          <Ionicons name="close" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    );
  };

  if (!isNavigating || !currentRoute) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { height: panelHeight }, style]}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)']}
        style={styles.gradient}
      >
        {/* Connection status indicator */}
        {!connectionStatus.webSocket && (
          <View style={styles.offlineIndicator}>
            <Ionicons name="cloud-offline" size={16} color="#FF9500" />
            <Text style={styles.offlineText}>Offline navigation</Text>
          </View>
        )}

        {/* Current step */}
        {renderCurrentStep()}
        
        {/* Progress bar */}
        {renderProgressBar()}
        
        {/* Route info */}
        {renderRouteInfo()}
        
        {/* Upcoming steps */}
        {renderUpcomingSteps()}
        
        {/* Controls */}
        {renderControls()}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    padding: 16,
    paddingBottom: 34, // Account for safe area
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  offlineText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
  },
  currentStep: {
    marginBottom: 16,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  directionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
  },
  instructionPrimary: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  instructionSecondary: {
    fontSize: 14,
    color: '#8E8E93',
  },
  floorIndicator: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  distanceContainer: {
    alignItems: 'flex-end',
  },
  distanceText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  distanceLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(142, 142, 147, 0.2)',
    borderRadius: 2,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(142, 142, 147, 0.2)',
    marginBottom: 16,
  },
  routeMetric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  upcomingSteps: {
    flex: 1,
    marginBottom: 16,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  upcomingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 142, 147, 0.1)',
  },
  upcomingStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 142, 147, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  upcomingIcon: {
    marginRight: 12,
  },
  upcomingText: {
    flex: 1,
  },
  upcomingInstruction: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  upcomingLandmark: {
    fontSize: 12,
    color: '#8E8E93',
  },
  upcomingDistance: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  destinationReached: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  destinationText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RealTimeNavigationPanel;