import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import {
  setCurrentLocation,
  setLocationTracking,
  updateLocationAccuracy,
  updateBeaconScan,
  updateConnectionStatus,
  addNearbyUser,
  removeNearbyUser,
  addGeofenceAlert,
} from '../store/slices/navigationSlice';
import locationTrackingService from '../services/LocationTrackingService';
import webSocketService from '../services/WebSocketService';
import apiService from '../services/ApiService';
import type { UserLocation, BeaconData } from '../types';

interface UseLocationTrackingOptions {
  enableHighAccuracy?: boolean;
  enableBeacons?: boolean;
  updateInterval?: number;
  beaconScanInterval?: number;
  autoStart?: boolean;
}

interface LocationTrackingState {
  isTracking: boolean;
  currentLocation: UserLocation | null;
  accuracy: number;
  source: string;
  connectionStatus: {
    webSocket: boolean;
    api: boolean;
  };
  lastBeaconScan: BeaconData[];
}

interface LocationTrackingActions {
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  updateManualLocation: (coordinates: { lat: number; lng: number }) => Promise<void>;
  reconnectWebSocket: () => Promise<void>;
  getStatus: () => LocationTrackingState;
}

export const useLocationTracking = (
  options: UseLocationTrackingOptions = {}
): LocationTrackingActions & LocationTrackingState => {
  const dispatch = useDispatch<AppDispatch>();
  
  const navigationState = useSelector((state: RootState) => state.navigation);
  const authState = useSelector((state: RootState) => state.auth);
  
  const {
    enableHighAccuracy = true,
    enableBeacons = true,
    updateInterval = 5000,
    beaconScanInterval = 3000,
    autoStart = false,
  } = options;

  const unsubscribeRefs = useRef<Array<() => void>>([]);
  const isInitialized = useRef(false);

  // Initialize services and set up event listeners
  useEffect(() => {
    const initializeServices = async () => {
      if (isInitialized.current || !authState.isAuthenticated) return;

      try {
        console.log('Initializing location tracking services...');

        // Initialize location tracking service
        await locationTrackingService.initialize({
          enableHighAccuracy,
          enableBeacons,
          updateInterval,
          beaconScanInterval,
        });

        // Set up location tracking callbacks
        const locationUnsubscribe = locationTrackingService.onLocationUpdate(
          handleLocationUpdate
        );
        const locationErrorUnsubscribe = locationTrackingService.onError(
          handleLocationError
        );

        unsubscribeRefs.current.push(locationUnsubscribe, locationErrorUnsubscribe);

        // Set up WebSocket event listeners
        setupWebSocketListeners();

        // Update connection status
        updateConnectionStatusState();

        isInitialized.current = true;

        // Auto-start tracking if enabled
        if (autoStart) {
          await startTracking();
        }

        console.log('Location tracking services initialized successfully');
      } catch (error) {
        console.error('Failed to initialize location tracking services:', error);
      }
    };

    initializeServices();

    return () => {
      // Cleanup on unmount
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current = [];
      isInitialized.current = false;
    };
  }, [authState.isAuthenticated, enableHighAccuracy, enableBeacons, updateInterval, beaconScanInterval, autoStart]);

  const setupWebSocketListeners = useCallback(() => {
    // Location update events
    const unsubscribeLocationUpdate = () => {
      webSocketService.off('location_update', handleWebSocketLocationUpdate);
    };

    const unsubscribeLocationConfirmed = () => {
      webSocketService.off('location_confirmed', handleWebSocketLocationConfirmed);
    };

    // Nearby user events
    const unsubscribeNearbyUser = () => {
      webSocketService.off('nearby_user_update', handleNearbyUserUpdate);
    };

    // Geofence events
    const unsubscribeGeofenceEnter = () => {
      webSocketService.off('geofence_enter', handleGeofenceEnter);
    };

    const unsubscribeGeofenceExit = () => {
      webSocketService.off('geofence_exit', handleGeofenceExit);
    };

    // Error events
    const unsubscribeError = () => {
      webSocketService.off('error', handleWebSocketError);
    };

    webSocketService.on('location_update', handleWebSocketLocationUpdate);
    webSocketService.on('location_confirmed', handleWebSocketLocationConfirmed);
    webSocketService.on('nearby_user_update', handleNearbyUserUpdate);
    webSocketService.on('geofence_enter', handleGeofenceEnter);
    webSocketService.on('geofence_exit', handleGeofenceExit);
    webSocketService.on('error', handleWebSocketError);

    unsubscribeRefs.current.push(
      unsubscribeLocationUpdate,
      unsubscribeLocationConfirmed,
      unsubscribeNearbyUser,
      unsubscribeGeofenceEnter,
      unsubscribeGeofenceExit,
      unsubscribeError
    );
  }, []);

  // Event handlers
  const handleLocationUpdate = useCallback((location: UserLocation) => {
    console.log('Location update received:', location);
    dispatch(setCurrentLocation(location));
    
    const status = locationTrackingService.getStatus();
    dispatch(updateLocationAccuracy({
      accuracy: status.accuracy,
      source: status.source as any,
    }));
  }, [dispatch]);

  const handleLocationError = useCallback((error: Error) => {
    console.error('Location tracking error:', error);
    // You might want to show a toast or notification here
  }, []);

  const handleWebSocketLocationUpdate = useCallback((location: UserLocation) => {
    console.log('WebSocket location update:', location);
    dispatch(setCurrentLocation(location));
  }, [dispatch]);

  const handleWebSocketLocationConfirmed = useCallback((location: UserLocation) => {
    console.log('WebSocket location confirmed:', location);
    dispatch(setCurrentLocation(location));
  }, [dispatch]);

  const handleNearbyUserUpdate = useCallback((data: { userId: string; location: UserLocation; distance: number }) => {
    console.log('Nearby user update:', data);
    dispatch(addNearbyUser(data));
    
    // Auto-remove after 30 seconds if no update
    setTimeout(() => {
      dispatch(removeNearbyUser(data.userId));
    }, 30000);
  }, [dispatch]);

  const handleGeofenceEnter = useCallback((data: { geofence: string; location: UserLocation }) => {
    console.log('Geofence entered:', data);
    dispatch(addGeofenceAlert({ type: 'enter', geofence: data.geofence }));
  }, [dispatch]);

  const handleGeofenceExit = useCallback((data: { geofence: string; location: UserLocation }) => {
    console.log('Geofence exited:', data);
    dispatch(addGeofenceAlert({ type: 'exit', geofence: data.geofence }));
  }, [dispatch]);

  const handleWebSocketError = useCallback((error: any) => {
    console.error('WebSocket error:', error);
    updateConnectionStatusState();
  }, []);

  // Actions
  const startTracking = useCallback(async () => {
    try {
      console.log('Starting location tracking...');
      dispatch(setLocationTracking(true));

      // Start location tracking service
      await locationTrackingService.startTracking();

      // Connect WebSocket if not connected
      if (!webSocketService.isWebSocketConnected()) {
        await webSocketService.connect();
      }

      updateConnectionStatusState();
      console.log('Location tracking started successfully');
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      dispatch(setLocationTracking(false));
      throw error;
    }
  }, [dispatch]);

  const stopTracking = useCallback(async () => {
    try {
      console.log('Stopping location tracking...');
      dispatch(setLocationTracking(false));

      await locationTrackingService.stopTracking();
      updateConnectionStatusState();
      
      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Failed to stop location tracking:', error);
      throw error;
    }
  }, [dispatch]);

  const updateManualLocation = useCallback(async (coordinates: { lat: number; lng: number }) => {
    try {
      await locationTrackingService.updateManualLocation(coordinates);
    } catch (error) {
      console.error('Failed to update manual location:', error);
      throw error;
    }
  }, []);

  const reconnectWebSocket = useCallback(async () => {
    try {
      await webSocketService.reconnect();
      updateConnectionStatusState();
    } catch (error) {
      console.error('Failed to reconnect WebSocket:', error);
      throw error;
    }
  }, []);

  const updateConnectionStatusState = useCallback(() => {
    const status = {
      webSocket: webSocketService.isWebSocketConnected(),
      api: true, // Assume API is available (could be enhanced with health checks)
    };
    dispatch(updateConnectionStatus(status));
  }, [dispatch]);

  const getStatus = useCallback((): LocationTrackingState => {
    return {
      isTracking: navigationState.locationTracking.isTracking,
      currentLocation: navigationState.currentLocation,
      accuracy: navigationState.locationTracking.accuracy,
      source: navigationState.locationTracking.source,
      connectionStatus: navigationState.locationTracking.connectionStatus,
      lastBeaconScan: navigationState.locationTracking.lastBeaconScan,
    };
  }, [navigationState]);

  // Update beacon scan data when it changes
  useEffect(() => {
    const updateBeaconData = async () => {
      if (navigationState.locationTracking.isTracking && enableBeacons) {
        try {
          const beaconStatus = locationTrackingService.getStatus();
          // This would typically come from the beacon service
          // For now, we'll simulate beacon updates
        } catch (error) {
          console.warn('Failed to get beacon status:', error);
        }
      }
    };

    const interval = setInterval(updateBeaconData, beaconScanInterval);
    return () => clearInterval(interval);
  }, [navigationState.locationTracking.isTracking, enableBeacons, beaconScanInterval]);

  // Periodically update connection status
  useEffect(() => {
    const interval = setInterval(updateConnectionStatusState, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [updateConnectionStatusState]);

  return {
    // State
    isTracking: navigationState.locationTracking.isTracking,
    currentLocation: navigationState.currentLocation,
    accuracy: navigationState.locationTracking.accuracy,
    source: navigationState.locationTracking.source,
    connectionStatus: navigationState.locationTracking.connectionStatus,
    lastBeaconScan: navigationState.locationTracking.lastBeaconScan,

    // Actions
    startTracking,
    stopTracking,
    updateManualLocation,
    reconnectWebSocket,
    getStatus,
  };
};

export default useLocationTracking;