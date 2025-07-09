import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { useLocationTracking } from '../../../hooks/useLocationTracking';

interface LocationStatusIndicatorProps {
  style?: any;
  onPress?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}

export const LocationStatusIndicator: React.FC<LocationStatusIndicatorProps> = ({
  style,
  onPress,
  showDetails = true,
  compact = false,
}) => {
  const {
    locationTracking,
    currentLocation,
  } = useSelector((state: RootState) => state.navigation);

  const { accuracy, connectionStatus } = useLocationTracking();

  const getLocationStatusColor = (): string => {
    if (!locationTracking.isTracking) return '#8E8E93';
    if (accuracy < 5) return '#34C759';
    if (accuracy < 10) return '#FF9500';
    return '#FF3B30';
  };

  const getLocationStatusIcon = (): string => {
    if (!locationTracking.isTracking) return 'location-outline';
    if (accuracy < 5) return 'location';
    if (accuracy < 10) return 'location-outline';
    return 'location-outline';
  };

  const getLocationStatusText = (): string => {
    if (!locationTracking.isTracking) return 'Not tracking';
    if (accuracy < 5) return 'High accuracy';
    if (accuracy < 10) return 'Good accuracy';
    return 'Low accuracy';
  };

  const getConnectionStatusColor = (): string => {
    if (connectionStatus.webSocket && connectionStatus.api) return '#34C759';
    if (connectionStatus.api) return '#FF9500';
    return '#FF3B30';
  };

  const getConnectionStatusIcon = (): string => {
    if (connectionStatus.webSocket && connectionStatus.api) return 'wifi';
    if (connectionStatus.api) return 'wifi-outline';
    return 'wifi-outline';
  };

  const getConnectionStatusText = (): string => {
    if (connectionStatus.webSocket && connectionStatus.api) return 'Connected';
    if (connectionStatus.api) return 'API only';
    return 'Offline';
  };

  const getSourceIcon = (): string => {
    switch (locationTracking.source) {
      case 'gps': return 'satellite';
      case 'beacon': return 'radio';
      case 'hybrid': return 'layers';
      case 'manual': return 'hand-left';
      default: return 'location';
    }
  };

  const getSourceText = (): string => {
    switch (locationTracking.source) {
      case 'gps': return 'GPS';
      case 'beacon': return 'Beacon';
      case 'hybrid': return 'Hybrid';
      case 'manual': return 'Manual';
      default: return 'Unknown';
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Show detailed status alert
      Alert.alert(
        'Location Status',
        `Status: ${getLocationStatusText()}\n` +
        `Accuracy: ±${accuracy.toFixed(1)}m\n` +
        `Source: ${getSourceText()}\n` +
        `Connection: ${getConnectionStatusText()}\n` +
        `Last Update: ${currentLocation ? new Date(currentLocation.timestamp).toLocaleTimeString() : 'Never'}`,
        [{ text: 'OK' }]
      );
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, style]}
        onPress={handlePress}
      >
        <View style={[styles.compactDot, { backgroundColor: getLocationStatusColor() }]} />
        <Text style={styles.compactText}>
          ±{accuracy.toFixed(1)}m
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
    >
      {/* Location Status */}
      <View style={styles.statusItem}>
        <Ionicons
          name={getLocationStatusIcon() as any}
          size={16}
          color={getLocationStatusColor()}
        />
        {showDetails && (
          <View style={styles.statusDetails}>
            <Text style={styles.statusText}>{getLocationStatusText()}</Text>
            <Text style={styles.statusValue}>±{accuracy.toFixed(1)}m</Text>
          </View>
        )}
      </View>

      {/* Connection Status */}
      <View style={styles.statusItem}>
        <Ionicons
          name={getConnectionStatusIcon() as any}
          size={16}
          color={getConnectionStatusColor()}
        />
        {showDetails && (
          <Text style={styles.statusText}>{getConnectionStatusText()}</Text>
        )}
      </View>

      {/* Source Status */}
      {showDetails && (
        <View style={styles.statusItem}>
          <Ionicons
            name={getSourceIcon() as any}
            size={16}
            color="#8E8E93"
          />
          <Text style={styles.statusText}>{getSourceText()}</Text>
        </View>
      )}

      {/* Beacon Count */}
      {locationTracking.lastBeaconScan.length > 0 && showDetails && (
        <View style={styles.statusItem}>
          <Ionicons
            name="radio"
            size={16}
            color="#FF9500"
          />
          <Text style={styles.statusText}>{locationTracking.lastBeaconScan.length}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statusDetails: {
    marginLeft: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1C1C1E',
    marginLeft: 4,
  },
  statusValue: {
    fontSize: 10,
    color: '#8E8E93',
    marginLeft: 4,
  },
});

export default LocationStatusIndicator;