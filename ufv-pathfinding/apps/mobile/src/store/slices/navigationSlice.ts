import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { 
  Route, 
  UserLocation, 
  UserPreferences,
  Room,
  NavigationInstruction,
  BeaconData
} from '../../types';

interface LocationTrackingState {
  isTracking: boolean;
  accuracy: number;
  source: 'gps' | 'beacon' | 'hybrid' | 'manual';
  lastBeaconScan: BeaconData[];
  connectionStatus: {
    webSocket: boolean;
    api: boolean;
  };
}

interface NavigationState {
  // Core navigation
  currentLocation: UserLocation | null;
  currentRoute: Route | null;
  isNavigating: boolean;
  currentStep: number;
  preferences: UserPreferences;
  
  // Location tracking
  locationTracking: LocationTrackingState;
  
  // Search and favorites
  recentSearches: string[];
  favoriteRooms: string[];
  nearbyRooms: Room[];
  
  // Map state
  selectedBuilding: string | null;
  selectedFloor: number | null;
  mapMode: 'overview' | 'navigation' | 'explore';
  mapCenter: { lat: number; lng: number } | null;
  mapZoom: number;
  
  // Real-time features
  nearbyUsers: Array<{
    userId: string;
    location: UserLocation;
    distance: number;
  }>;
  geofenceAlerts: Array<{
    type: 'enter' | 'exit';
    geofence: string;
    timestamp: Date;
  }>;
  
  // History and analytics
  navigationHistory: {
    id: string;
    route: Route;
    timestamp: Date;
    completed: boolean;
  }[];
  
  // UI preferences
  showBeacons: boolean;
  showNearbyUsers: boolean;
}

const initialState: NavigationState = {
  // Core navigation
  currentLocation: null,
  currentRoute: null,
  isNavigating: false,
  currentStep: 0,
  preferences: {
    avoidStairs: false,
    preferElevator: false,
    accessibleOnly: false,
    avoidCrowdedAreas: false,
    preferredWalkingSpeed: 'normal',
  },
  
  // Location tracking
  locationTracking: {
    isTracking: false,
    accuracy: 0,
    source: 'gps',
    lastBeaconScan: [],
    connectionStatus: {
      webSocket: false,
      api: false,
    },
  },
  
  // Search and favorites
  recentSearches: [],
  favoriteRooms: [],
  nearbyRooms: [],
  
  // Map state
  selectedBuilding: null,
  selectedFloor: null,
  mapMode: 'overview',
  mapCenter: null,
  mapZoom: 18,
  
  // Real-time features
  nearbyUsers: [],
  geofenceAlerts: [],
  
  // History and analytics
  navigationHistory: [],
  
  // UI preferences
  showBeacons: false,
  showNearbyUsers: true,
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setCurrentLocation: (state, action: PayloadAction<UserLocation>) => {
      state.currentLocation = action.payload;
    },
    
    setCurrentRoute: (state, action: PayloadAction<Route | null>) => {
      state.currentRoute = action.payload;
      if (action.payload) {
        state.isNavigating = true;
        state.currentStep = 0;
        state.mapMode = 'navigation';
      } else {
        state.isNavigating = false;
        state.currentStep = 0;
        state.mapMode = 'overview';
      }
    },
    
    updateNavigationStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    
    nextNavigationStep: (state) => {
      if (state.currentRoute && state.currentStep < state.currentRoute.instructions.length - 1) {
        state.currentStep += 1;
      }
    },
    
    completeNavigation: (state) => {
      if (state.currentRoute) {
        state.navigationHistory.unshift({
          id: state.currentRoute.id,
          route: state.currentRoute,
          timestamp: new Date(),
          completed: true,
        });
        // Keep only last 20 navigation sessions
        state.navigationHistory = state.navigationHistory.slice(0, 20);
      }
      state.currentRoute = null;
      state.isNavigating = false;
      state.currentStep = 0;
      state.mapMode = 'overview';
    },
    
    cancelNavigation: (state) => {
      if (state.currentRoute) {
        state.navigationHistory.unshift({
          id: state.currentRoute.id,
          route: state.currentRoute,
          timestamp: new Date(),
          completed: false,
        });
        state.navigationHistory = state.navigationHistory.slice(0, 20);
      }
      state.currentRoute = null;
      state.isNavigating = false;
      state.currentStep = 0;
      state.mapMode = 'overview';
    },
    
    updatePreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    
    addRecentSearch: (state, action: PayloadAction<string>) => {
      const search = action.payload;
      state.recentSearches = [
        search,
        ...state.recentSearches.filter(s => s !== search)
      ].slice(0, 10);
    },
    
    clearRecentSearches: (state) => {
      state.recentSearches = [];
    },
    
    setFavoriteRooms: (state, action: PayloadAction<string[]>) => {
      state.favoriteRooms = action.payload;
    },
    
    addFavoriteRoom: (state, action: PayloadAction<string>) => {
      if (!state.favoriteRooms.includes(action.payload)) {
        state.favoriteRooms.push(action.payload);
      }
    },
    
    removeFavoriteRoom: (state, action: PayloadAction<string>) => {
      state.favoriteRooms = state.favoriteRooms.filter(id => id !== action.payload);
    },
    
    setSelectedBuilding: (state, action: PayloadAction<string | null>) => {
      state.selectedBuilding = action.payload;
      if (!action.payload) {
        state.selectedFloor = null;
      }
    },
    
    setSelectedFloor: (state, action: PayloadAction<number | null>) => {
      state.selectedFloor = action.payload;
    },
    
    setMapMode: (state, action: PayloadAction<'overview' | 'navigation' | 'explore'>) => {
      state.mapMode = action.payload;
    },
    
    // Location tracking actions
    setLocationTracking: (state, action: PayloadAction<boolean>) => {
      state.locationTracking.isTracking = action.payload;
    },
    
    updateLocationAccuracy: (state, action: PayloadAction<{ accuracy: number; source: 'gps' | 'beacon' | 'hybrid' | 'manual' }>) => {
      state.locationTracking.accuracy = action.payload.accuracy;
      state.locationTracking.source = action.payload.source;
    },
    
    updateBeaconScan: (state, action: PayloadAction<BeaconData[]>) => {
      state.locationTracking.lastBeaconScan = action.payload;
    },
    
    updateConnectionStatus: (state, action: PayloadAction<{ webSocket: boolean; api: boolean }>) => {
      state.locationTracking.connectionStatus = action.payload;
    },
    
    // Map state actions
    setMapCenter: (state, action: PayloadAction<{ lat: number; lng: number }>) => {
      state.mapCenter = action.payload;
    },
    
    setMapZoom: (state, action: PayloadAction<number>) => {
      state.mapZoom = action.payload;
    },
    
    // Real-time features
    setNearbyRooms: (state, action: PayloadAction<Room[]>) => {
      state.nearbyRooms = action.payload;
    },
    
    updateNearbyUsers: (state, action: PayloadAction<Array<{ userId: string; location: UserLocation; distance: number }>>) => {
      state.nearbyUsers = action.payload;
    },
    
    addNearbyUser: (state, action: PayloadAction<{ userId: string; location: UserLocation; distance: number }>) => {
      const existingIndex = state.nearbyUsers.findIndex(user => user.userId === action.payload.userId);
      if (existingIndex >= 0) {
        state.nearbyUsers[existingIndex] = action.payload;
      } else {
        state.nearbyUsers.push(action.payload);
      }
    },
    
    removeNearbyUser: (state, action: PayloadAction<string>) => {
      state.nearbyUsers = state.nearbyUsers.filter(user => user.userId !== action.payload);
    },
    
    addGeofenceAlert: (state, action: PayloadAction<{ type: 'enter' | 'exit'; geofence: string }>) => {
      state.geofenceAlerts.unshift({
        ...action.payload,
        timestamp: new Date(),
      });
      // Keep only last 20 alerts
      state.geofenceAlerts = state.geofenceAlerts.slice(0, 20);
    },
    
    clearGeofenceAlerts: (state) => {
      state.geofenceAlerts = [];
    },
    
    // UI preferences
    toggleShowBeacons: (state) => {
      state.showBeacons = !state.showBeacons;
    },
    
    toggleShowNearbyUsers: (state) => {
      state.showNearbyUsers = !state.showNearbyUsers;
    },
    
    // Clear all real-time data
    clearRealTimeData: (state) => {
      state.nearbyUsers = [];
      state.geofenceAlerts = [];
      state.locationTracking.lastBeaconScan = [];
    },
  },
});

export const {
  // Core navigation
  setCurrentLocation,
  setCurrentRoute,
  updateNavigationStep,
  nextNavigationStep,
  completeNavigation,
  cancelNavigation,
  updatePreferences,
  
  // Search and favorites
  addRecentSearch,
  clearRecentSearches,
  setFavoriteRooms,
  addFavoriteRoom,
  removeFavoriteRoom,
  setNearbyRooms,
  
  // Map state
  setSelectedBuilding,
  setSelectedFloor,
  setMapMode,
  setMapCenter,
  setMapZoom,
  
  // Location tracking
  setLocationTracking,
  updateLocationAccuracy,
  updateBeaconScan,
  updateConnectionStatus,
  
  // Real-time features
  updateNearbyUsers,
  addNearbyUser,
  removeNearbyUser,
  addGeofenceAlert,
  clearGeofenceAlerts,
  
  // UI preferences
  toggleShowBeacons,
  toggleShowNearbyUsers,
  
  // Clear data
  clearRealTimeData,
} = navigationSlice.actions;

export default navigationSlice.reducer;