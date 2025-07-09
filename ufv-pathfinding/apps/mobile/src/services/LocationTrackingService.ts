import * as Location from 'expo-location';
import { Platform } from 'react-native';
import type { UserLocation, BeaconData } from '../types';
import apiService from './ApiService';
import webSocketService from './WebSocketService';
import beaconService from './BeaconService';

interface LocationOptions {
  enableHighAccuracy?: boolean;
  enableBeacons?: boolean;
  updateInterval?: number;
  beaconScanInterval?: number;
}

interface LocationState {
  isTracking: boolean;
  currentLocation: UserLocation | null;
  lastGPSLocation: Location.LocationObject | null;
  lastBeaconLocation: UserLocation | null;
  accuracy: number;
  source: 'gps' | 'beacon' | 'hybrid' | 'manual';
}

type LocationCallback = (location: UserLocation) => void;
type ErrorCallback = (error: Error) => void;

class LocationTrackingService {
  private locationState: LocationState = {
    isTracking: false,
    currentLocation: null,
    lastGPSLocation: null,
    lastBeaconLocation: null,
    accuracy: 0,
    source: 'gps',
  };

  private locationCallbacks: LocationCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  
  private gpsSubscription: Location.LocationSubscription | null = null;
  private beaconUnsubscribe: (() => void) | null = null;
  private webSocketUnsubscribes: (() => void)[] = [];

  private options: LocationOptions = {
    enableHighAccuracy: true,
    enableBeacons: true,
    updateInterval: 5000, // 5 seconds
    beaconScanInterval: 3000, // 3 seconds
  };

  async initialize(options?: Partial<LocationOptions>): Promise<void> {
    console.log('Initializing Location Tracking Service...');
    
    this.options = { ...this.options, ...options };

    try {
      // Request location permissions
      await this.requestLocationPermissions();

      // Initialize beacon service if enabled
      if (this.options.enableBeacons) {
        try {
          await beaconService.initialize();
          console.log('Beacon service initialized');
        } catch (error) {
          console.warn('Failed to initialize beacon service:', error);
          this.options.enableBeacons = false;
        }
      }

      // Set up WebSocket listeners
      this.setupWebSocketListeners();

      console.log('Location Tracking Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Location Tracking Service:', error);
      throw error;
    }
  }

  private async requestLocationPermissions(): Promise<void> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        throw new Error('Foreground location permission not granted');
      }

      // Request background permissions for continuous tracking
      if (Platform.OS === 'ios') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          console.warn('Background location permission not granted - tracking will be limited');
        }
      }

      console.log('Location permissions granted');
    } catch (error) {
      console.error('Failed to request location permissions:', error);
      throw error;
    }
  }

  private setupWebSocketListeners(): void {
    // Listen for location updates from WebSocket
    const unsubscribeLocationUpdate = () => {
      webSocketService.off('location_update', this.handleWebSocketLocationUpdate);
    };

    const unsubscribeLocationConfirmed = () => {
      webSocketService.off('location_confirmed', this.handleWebSocketLocationConfirmed);
    };

    webSocketService.on('location_update', this.handleWebSocketLocationUpdate);
    webSocketService.on('location_confirmed', this.handleWebSocketLocationConfirmed);

    this.webSocketUnsubscribes.push(unsubscribeLocationUpdate, unsubscribeLocationConfirmed);
  }

  private handleWebSocketLocationUpdate = (location: UserLocation): void => {
    console.log('Received location update from WebSocket:', location);
    this.updateLocationState(location, 'hybrid');
  };

  private handleWebSocketLocationConfirmed = (location: UserLocation): void => {
    console.log('Location confirmed by server:', location);
    this.updateLocationState(location, 'hybrid');
  };

  async startTracking(): Promise<void> {
    if (this.locationState.isTracking) {
      console.warn('Location tracking already started');
      return;
    }

    try {
      console.log('Starting location tracking...');
      this.locationState.isTracking = true;

      // Start GPS tracking
      await this.startGPSTracking();

      // Start beacon tracking if enabled
      if (this.options.enableBeacons) {
        await this.startBeaconTracking();
      }

      // Connect to WebSocket for real-time updates
      if (!webSocketService.isWebSocketConnected()) {
        try {
          await webSocketService.connect();
        } catch (error) {
          console.warn('Failed to connect to WebSocket:', error);
        }
      }

      console.log('Location tracking started successfully');
    } catch (error) {
      this.locationState.isTracking = false;
      console.error('Failed to start location tracking:', error);
      throw error;
    }
  }

  async stopTracking(): Promise<void> {
    if (!this.locationState.isTracking) {
      return;
    }

    console.log('Stopping location tracking...');
    this.locationState.isTracking = false;

    // Stop GPS tracking
    if (this.gpsSubscription) {
      this.gpsSubscription.remove();
      this.gpsSubscription = null;
    }

    // Stop beacon tracking
    if (this.beaconUnsubscribe) {
      this.beaconUnsubscribe();
      this.beaconUnsubscribe = null;
    }

    await beaconService.stopScanning();

    // Clean up WebSocket listeners
    this.webSocketUnsubscribes.forEach(unsubscribe => unsubscribe());
    this.webSocketUnsubscribes = [];

    console.log('Location tracking stopped');
  }

  private async startGPSTracking(): Promise<void> {
    try {
      const locationOptions: Location.LocationOptions = {
        accuracy: this.options.enableHighAccuracy 
          ? Location.Accuracy.BestForNavigation 
          : Location.Accuracy.Balanced,
        timeInterval: this.options.updateInterval,
        distanceInterval: 1, // Update every 1 meter
      };

      this.gpsSubscription = await Location.watchPositionAsync(
        locationOptions,
        this.handleGPSLocationUpdate
      );

      console.log('GPS tracking started');
    } catch (error) {
      console.error('Failed to start GPS tracking:', error);
      throw error;
    }
  }

  private async startBeaconTracking(): Promise<void> {
    try {
      // Set up beacon detection callback
      this.beaconUnsubscribe = beaconService.onBeaconsDetected(
        this.handleBeaconDetection
      );

      // Start beacon scanning
      await beaconService.startScanning(this.options.beaconScanInterval);

      console.log('Beacon tracking started');
    } catch (error) {
      console.error('Failed to start beacon tracking:', error);
      throw error;
    }
  }

  private handleGPSLocationUpdate = async (location: Location.LocationObject): Promise<void> => {
    console.log('GPS location update:', location);
    
    this.locationState.lastGPSLocation = location;

    try {
      // Create UserLocation from GPS data
      const userLocation: UserLocation = {
        coordinates: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
        floor: await this.determineFloor(location.coords.latitude, location.coords.longitude),
        building: await this.determineBuilding(location.coords.latitude, location.coords.longitude),
        accuracy: location.coords.accuracy || 10,
        timestamp: new Date(location.timestamp),
        source: 'gps',
      };

      // Update location via WebSocket
      if (webSocketService.isWebSocketConnected()) {
        try {
          await webSocketService.updateLocation({
            coordinates: userLocation.coordinates,
            floor: userLocation.floor,
            building: userLocation.building,
            accuracy: userLocation.accuracy,
            source: 'gps',
          });
        } catch (error) {
          console.warn('Failed to send location update via WebSocket:', error);
        }
      }

      // Update local state
      this.updateLocationState(userLocation, 'gps');

    } catch (error) {
      console.error('Error processing GPS location update:', error);
      this.emitError(error as Error);
    }
  };

  private handleBeaconDetection = async (beacons: BeaconData[]): Promise<void> => {
    if (beacons.length === 0) {
      return;
    }

    console.log(`Detected ${beacons.length} beacons:`, beacons);

    try {
      // Send beacon data to WebSocket for triangulation
      if (webSocketService.isWebSocketConnected()) {
        await webSocketService.sendBeaconScan(beacons);
      } else {
        // Fallback to API triangulation
        const triangulationResult = await apiService.triangulatePosition(beacons);
        
        if (triangulationResult && !('error' in triangulationResult)) {
          const userLocation: UserLocation = {
            coordinates: triangulationResult.coordinates,
            floor: await this.determineFloor(
              triangulationResult.coordinates.lat, 
              triangulationResult.coordinates.lng
            ),
            building: await this.determineBuilding(
              triangulationResult.coordinates.lat, 
              triangulationResult.coordinates.lng
            ),
            accuracy: triangulationResult.accuracy,
            timestamp: new Date(),
            source: 'beacon',
          };

          this.locationState.lastBeaconLocation = userLocation;
          this.updateLocationState(userLocation, 'beacon');
        }
      }
    } catch (error) {
      console.error('Error processing beacon detection:', error);
      this.emitError(error as Error);
    }
  };

  private updateLocationState(location: UserLocation, source: 'gps' | 'beacon' | 'hybrid'): void {
    // Apply location fusion if we have both GPS and beacon data
    const fusedLocation = this.fuseLocationData(location, source);
    
    this.locationState.currentLocation = fusedLocation;
    this.locationState.accuracy = fusedLocation.accuracy;
    this.locationState.source = source;

    // Emit to callbacks
    this.emitLocation(fusedLocation);
  }

  private fuseLocationData(newLocation: UserLocation, source: 'gps' | 'beacon' | 'hybrid'): UserLocation {
    const { lastGPSLocation, lastBeaconLocation } = this.locationState;

    // If we don't have both sources, return the new location as-is
    if (!lastGPSLocation || !lastBeaconLocation || source === 'hybrid') {
      return newLocation;
    }

    // Simple fusion: weight beacon location more heavily indoors, GPS outdoors
    const isIndoors = this.isIndoorLocation(newLocation);
    
    if (isIndoors && source === 'beacon') {
      // Trust beacon data more for indoor locations
      return {
        ...newLocation,
        accuracy: Math.min(newLocation.accuracy, 5), // Cap indoor accuracy at 5m
        source: 'beacon',
      };
    } else if (!isIndoors && source === 'gps') {
      // Trust GPS more for outdoor locations
      return {
        ...newLocation,
        source: 'gps',
      };
    }

    // Hybrid approach: average the coordinates weighted by accuracy
    const gpsWeight = 1 / (this.locationState.lastGPSLocation?.coords.accuracy || 10);
    const beaconWeight = 1 / (lastBeaconLocation.accuracy || 10);
    const totalWeight = gpsWeight + beaconWeight;

    return {
      coordinates: {
        lat: (newLocation.coordinates.lat * beaconWeight + 
              (this.locationState.lastGPSLocation?.coords.latitude || 0) * gpsWeight) / totalWeight,
        lng: (newLocation.coordinates.lng * beaconWeight + 
              (this.locationState.lastGPSLocation?.coords.longitude || 0) * gpsWeight) / totalWeight,
      },
      floor: newLocation.floor,
      building: newLocation.building,
      accuracy: Math.min(newLocation.accuracy, this.locationState.lastGPSLocation?.coords.accuracy || 10),
      timestamp: new Date(),
      source: 'hybrid',
    };
  }

  private isIndoorLocation(location: UserLocation): boolean {
    // Simple heuristic: if we have building/floor info, assume indoor
    return location.building !== 'unknown' && location.floor > 0;
  }

  private async determineFloor(lat: number, lng: number): Promise<number> {
    // In a real implementation, this would query the backend to determine floor
    // For now, return default floor
    return 1;
  }

  private async determineBuilding(lat: number, lng: number): Promise<string> {
    // In a real implementation, this would query the backend to determine building
    // For now, check if coordinates are near UFV Building T
    const ufvBuildingT = { lat: 49.2827, lng: -123.1207 };
    const distance = this.calculateDistance(lat, lng, ufvBuildingT.lat, ufvBuildingT.lng);
    
    return distance < 100 ? 'building-t' : 'unknown'; // Within 100m of Building T
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private emitLocation(location: UserLocation): void {
    this.locationCallbacks.forEach(callback => {
      try {
        callback(location);
      } catch (error) {
        console.error('Error in location callback:', error);
      }
    });
  }

  private emitError(error: Error): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });
  }

  // Public event handling methods
  onLocationUpdate(callback: LocationCallback): () => void {
    this.locationCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.locationCallbacks.indexOf(callback);
      if (index > -1) {
        this.locationCallbacks.splice(index, 1);
      }
    };
  }

  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  // Public getters
  getCurrentLocation(): UserLocation | null {
    return this.locationState.currentLocation;
  }

  getLocationState(): LocationState {
    return { ...this.locationState };
  }

  isTracking(): boolean {
    return this.locationState.isTracking;
  }

  // Manual location update
  async updateManualLocation(coordinates: { lat: number; lng: number }): Promise<void> {
    try {
      const userLocation: UserLocation = {
        coordinates,
        floor: await this.determineFloor(coordinates.lat, coordinates.lng),
        building: await this.determineBuilding(coordinates.lat, coordinates.lng),
        accuracy: 1, // High accuracy for manual input
        timestamp: new Date(),
        source: 'manual',
      };

      // Send to WebSocket
      if (webSocketService.isWebSocketConnected()) {
        await webSocketService.updateLocation({
          coordinates: userLocation.coordinates,
          floor: userLocation.floor,
          building: userLocation.building,
          accuracy: userLocation.accuracy,
          source: 'manual',
        });
      }

      // Update local state
      this.updateLocationState(userLocation, 'hybrid');

    } catch (error) {
      console.error('Failed to update manual location:', error);
      throw error;
    }
  }

  // Status and configuration
  getStatus(): {
    isTracking: boolean;
    hasGPS: boolean;
    hasBeacons: boolean;
    webSocketConnected: boolean;
    currentLocation: UserLocation | null;
    accuracy: number;
    source: string;
  } {
    return {
      isTracking: this.locationState.isTracking,
      hasGPS: !!this.locationState.lastGPSLocation,
      hasBeacons: !!this.locationState.lastBeaconLocation,
      webSocketConnected: webSocketService.isWebSocketConnected(),
      currentLocation: this.locationState.currentLocation,
      accuracy: this.locationState.accuracy,
      source: this.locationState.source,
    };
  }

  updateOptions(options: Partial<LocationOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

// Export singleton instance
export const locationTrackingService = new LocationTrackingService();
export default locationTrackingService;