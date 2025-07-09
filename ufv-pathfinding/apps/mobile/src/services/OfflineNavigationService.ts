import { Alert } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import apiService from './ApiService';
import webSocketService from './WebSocketService';
import OfflineStorageService from './OfflineStorageService';
import OfflinePathfindingService from './OfflinePathfindingService';
import type { 
  Route, 
  Room, 
  Building, 
  BeaconData,
  UserLocation 
} from '../types';

interface OfflineCapabilities {
  isOnline: boolean;
  hasOfflineData: boolean;
  canNavigate: boolean;
  canSearch: boolean;
  lastSync: Date | null;
}

interface SyncProgress {
  building: string;
  progress: number;
  total: number;
  status: 'downloading' | 'processing' | 'complete' | 'error';
}

class OfflineNavigationService {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private onCapabilityChangeCallbacks: Array<(capabilities: OfflineCapabilities) => void> = [];
  private onSyncProgressCallbacks: Array<(progress: SyncProgress) => void> = [];

  async initialize(): Promise<void> {
    try {
      console.log('Initializing offline navigation service...');

      // Initialize offline storage
      await OfflineStorageService.initialize();

      // Monitor network connectivity
      this.setupNetworkMonitoring();

      console.log('Offline navigation service initialized');
    } catch (error) {
      console.warn('Failed to initialize offline navigation service, continuing in demo mode:', error);
      // Continue without full offline support for demo mode
      this.setupNetworkMonitoring();
    }
  }

  private setupNetworkMonitoring(): void {
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected === true;

      if (wasOnline !== this.isOnline) {
        console.log(`Network status changed: ${this.isOnline ? 'Online' : 'Offline'}`);
        this.notifyCapabilityChange();

        if (this.isOnline) {
          this.onBackOnline();
        } else {
          this.onGoOffline();
        }
      }
    });
  }

  private async onBackOnline(): Promise<void> {
    console.log('Back online - checking for data sync...');
    
    // Automatically sync if data is old
    const metadata = await OfflineStorageService.getOfflineMetadata();
    if (!metadata || this.shouldAutoSync(metadata.lastSync)) {
      this.startAutoSync();
    }
  }

  private onGoOffline(): void {
    console.log('Gone offline - switching to offline mode');
    
    Alert.alert(
      'Offline Mode',
      'You are now offline. Navigation will use cached data when available.',
      [{ text: 'OK' }]
    );
  }

  private shouldAutoSync(lastSync: Date): boolean {
    if (!lastSync) return true;
    
    const daysSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceSync > 7; // Auto-sync if data is older than 7 days
  }

  // Data Synchronization
  async syncBuildingData(buildingId: string, force: boolean = false): Promise<void> {
    if (this.syncInProgress && !force) {
      throw new Error('Sync already in progress');
    }

    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    this.syncInProgress = true;

    try {
      console.log(`Starting sync for building: ${buildingId}`);

      // Check if we need to sync
      if (!force) {
        const existingData = await OfflineStorageService.getCachedMapData(buildingId);
        if (existingData && this.isDataFresh(existingData.lastUpdated)) {
          console.log('Data is fresh, skipping sync');
          this.syncInProgress = false;
          return;
        }
      }

      this.notifySyncProgress({
        building: buildingId,
        progress: 0,
        total: 100,
        status: 'downloading'
      });

      // Fetch building data
      const [buildingResponse, roomsResponse, beaconsResponse] = await Promise.all([
        apiService.getBuilding(buildingId),
        apiService.getRooms(buildingId),
        apiService.getBeacons(buildingId)
      ]);

      this.notifySyncProgress({
        building: buildingId,
        progress: 50,
        total: 100,
        status: 'processing'
      });

      // Cache the data
      const mapData = {
        building: buildingResponse.data,
        rooms: roomsResponse.data,
        beacons: beaconsResponse.data,
        lastUpdated: new Date(),
        version: '1.0.0'
      };

      await OfflineStorageService.cacheMapData(buildingId, mapData);

      // Update metadata
      const metadata = await OfflineStorageService.getOfflineMetadata() || {
        lastSync: new Date(),
        dataVersion: '1.0.0',
        totalSize: 0,
        buildings: []
      };

      if (!metadata.buildings.includes(buildingId)) {
        metadata.buildings.push(buildingId);
      }
      metadata.lastSync = new Date();
      metadata.totalSize = await OfflineStorageService.getCacheSize();

      await OfflineStorageService.updateOfflineMetadata(metadata);

      this.notifySyncProgress({
        building: buildingId,
        progress: 100,
        total: 100,
        status: 'complete'
      });

      console.log(`Sync completed for building: ${buildingId}`);

    } catch (error) {
      console.error(`Sync failed for building ${buildingId}:`, error);
      
      this.notifySyncProgress({
        building: buildingId,
        progress: 0,
        total: 100,
        status: 'error'
      });

      throw error;
    } finally {
      this.syncInProgress = false;
      this.notifyCapabilityChange();
    }
  }

  private async startAutoSync(): Promise<void> {
    try {
      // Get list of buildings to sync (could be configurable)
      const buildingsToSync = ['building-t']; // UFV Building T
      
      for (const buildingId of buildingsToSync) {
        await this.syncBuildingData(buildingId);
      }
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  }

  private isDataFresh(lastUpdated: Date): boolean {
    const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate < 24; // Data is fresh if updated within 24 hours
  }

  // Route Calculation (Online/Offline)
  async calculateRoute(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    preferences: any = {},
    buildingId: string = 'building-t'
  ): Promise<Route | null> {
    try {
      // Try online first if available
      if (this.isOnline) {
        try {
          console.log('Calculating route online...');
          const response = await apiService.calculateRoute({
            start,
            end,
            preferences
          });

          const route = response.data;
          
          // Cache the route for offline use
          await OfflineStorageService.cacheRoute(route);
          
          return route;
        } catch (error) {
          console.warn('Online route calculation failed, trying offline...', error);
        }
      }

      // Try cached route first
      const cachedRoute = await OfflinePathfindingService.getCachedRoute(start, end);
      if (cachedRoute) {
        console.log('Using cached route');
        return cachedRoute;
      }

      // Calculate offline route
      if (await OfflinePathfindingService.isOfflineRoutingAvailable(buildingId)) {
        console.log('Calculating route offline...');
        return await OfflinePathfindingService.calculateOfflineRoute(start, end, buildingId, preferences);
      }

      throw new Error('No route calculation method available');

    } catch (error) {
      console.error('Route calculation failed:', error);
      return null;
    }
  }

  // Search (Online/Offline)
  async searchRooms(
    query: string,
    buildingId: string = 'building-t'
  ): Promise<Room[]> {
    try {
      // Try online search first
      if (this.isOnline) {
        try {
          const response = await apiService.searchRooms(query, {
            buildingId,
            limit: 20
          });
          return response.data.rooms;
        } catch (error) {
          console.warn('Online search failed, trying offline...', error);
        }
      }

      // Fallback to offline search
      return await OfflineStorageService.searchRoomsOffline(query, buildingId);

    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  // Get offline capabilities
  async getOfflineCapabilities(): Promise<OfflineCapabilities> {
    const metadata = await OfflineStorageService.getOfflineMetadata();
    const hasOfflineData = metadata !== null && metadata.buildings.length > 0;

    return {
      isOnline: this.isOnline,
      hasOfflineData,
      canNavigate: this.isOnline || hasOfflineData,
      canSearch: this.isOnline || hasOfflineData,
      lastSync: metadata?.lastSync || null
    };
  }

  // Event handlers
  onCapabilityChange(callback: (capabilities: OfflineCapabilities) => void): () => void {
    this.onCapabilityChangeCallbacks.push(callback);
    
    // Call immediately with current state
    this.getOfflineCapabilities().then(callback);

    // Return unsubscribe function
    return () => {
      const index = this.onCapabilityChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.onCapabilityChangeCallbacks.splice(index, 1);
      }
    };
  }

  onSyncProgress(callback: (progress: SyncProgress) => void): () => void {
    this.onSyncProgressCallbacks.push(callback);

    return () => {
      const index = this.onSyncProgressCallbacks.indexOf(callback);
      if (index > -1) {
        this.onSyncProgressCallbacks.splice(index, 1);
      }
    };
  }

  private async notifyCapabilityChange(): Promise<void> {
    const capabilities = await this.getOfflineCapabilities();
    this.onCapabilityChangeCallbacks.forEach(callback => {
      try {
        callback(capabilities);
      } catch (error) {
        console.error('Error in capability change callback:', error);
      }
    });
  }

  private notifySyncProgress(progress: SyncProgress): void {
    this.onSyncProgressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in sync progress callback:', error);
      }
    });
  }

  // Cache management
  async getCacheStats(): Promise<{
    size: number;
    buildings: number;
    routes: number;
    lastSync: Date | null;
  }> {
    const stats = await OfflineStorageService.getOfflineStats();
    return {
      size: stats.cacheSize,
      buildings: stats.cachedBuildings,
      routes: stats.cachedRoutes,
      lastSync: stats.lastSync
    };
  }

  async clearOfflineData(): Promise<void> {
    try {
      await OfflineStorageService.clearCache();
      this.notifyCapabilityChange();
      
      Alert.alert(
        'Cache Cleared',
        'All offline data has been removed. You will need an internet connection to use navigation features.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }

  // Check if currently offline
  isOffline(): boolean {
    return !this.isOnline;
  }

  // Force sync
  async forceSyncAll(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    const metadata = await OfflineStorageService.getOfflineMetadata();
    const buildings = metadata?.buildings || ['building-t'];

    for (const buildingId of buildings) {
      await this.syncBuildingData(buildingId, true);
    }
  }

  // Check if building data is available offline
  async isBuildingAvailableOffline(buildingId: string): Promise<boolean> {
    return await OfflineStorageService.isOfflineDataAvailable(buildingId);
  }
}

export default new OfflineNavigationService();