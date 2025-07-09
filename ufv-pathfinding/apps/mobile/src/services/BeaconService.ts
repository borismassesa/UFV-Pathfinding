import { Platform, PermissionsAndroid, Alert } from 'react-native';
// import BleManager from 'react-native-ble-manager';
// import { BeaconsManager } from 'react-native-beacons-manager';
import type { BeaconData } from '../types';

interface BeaconRegion {
  identifier: string;
  uuid: string;
  major?: number;
  minor?: number;
}

interface ScannedBeacon {
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
  accuracy: number;
  proximity: 'immediate' | 'near' | 'far' | 'unknown';
  timestamp: number;
}

interface BeaconScanResult {
  beacons: BeaconData[];
  scanDuration: number;
  timestamp: number;
}

type BeaconCallback = (beacons: BeaconData[]) => void;
type ErrorCallback = (error: Error) => void;

class BeaconService {
  private isScanning = false;
  private scanCallbacks: BeaconCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private scanInterval: NodeJS.Timeout | null = null;
  private lastScanResults: BeaconData[] = [];
  private scanHistory: BeaconScanResult[] = [];

  // UFV Building T beacon regions - these would come from your backend
  private monitoredRegions: BeaconRegion[] = [
    {
      identifier: 'UFV-Building-T-Main',
      uuid: 'F7826DA6-4FA2-4E98-8024-BC5B71E0893E', // Example UUID
    },
    {
      identifier: 'UFV-Building-T-Floor1',
      uuid: 'F7826DA6-4FA2-4E98-8024-BC5B71E0893E',
      major: 1,
    },
    {
      identifier: 'UFV-Building-T-Floor2',
      uuid: 'F7826DA6-4FA2-4E98-8024-BC5B71E0893E',
      major: 2,
    },
  ];

  async initialize(): Promise<void> {
    try {
      console.log('Initializing Beacon Service (Mock Mode)...');

      // Request permissions
      await this.requestPermissions();

      // Mock initialization - no native libraries in Expo managed workflow
      console.log('Beacon Service initialized successfully (Mock Mode)');
    } catch (error) {
      console.error('Failed to initialize Beacon Service:', error);
      throw error;
    }
  }

  private async requestPermissions(): Promise<void> {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);

      const allPermissionsGranted = Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allPermissionsGranted) {
        throw new Error('Required permissions not granted');
      }
    }
  }

  async startScanning(interval: number = 5000): Promise<void> {
    if (this.isScanning) {
      console.warn('Beacon scanning already in progress');
      return;
    }

    try {
      console.log('Starting beacon scanning (Mock Mode)...');
      this.isScanning = true;

      // Start mock scanning
      this.scanInterval = setInterval(async () => {
        try {
          await this.performMockScan();
        } catch (error) {
          console.error('Mock scan error:', error);
          this.emitError(error as Error);
        }
      }, interval);

      console.log(`Beacon scanning started with ${interval}ms interval (Mock Mode)`);
    } catch (error) {
      this.isScanning = false;
      console.error('Failed to start beacon scanning:', error);
      throw error;
    }
  }

  async stopScanning(): Promise<void> {
    if (!this.isScanning) {
      return;
    }

    console.log('Stopping beacon scanning (Mock Mode)...');
    this.isScanning = false;

    // Clear scan interval
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    console.log('Beacon scanning stopped (Mock Mode)');
  }

  private async performMockScan(): Promise<void> {
    const scanStartTime = Date.now();
    
    try {
      // Generate mock beacon data
      const mockBeacons: BeaconData[] = [
        {
          id: 'mock-beacon-1',
          uuid: 'F7826DA6-4FA2-4E98-8024-BC5B71E0893E',
          major: 1,
          minor: 100,
          coordinates: { lat: 49.2827, lng: -123.1207 },
          floor: 1,
          building: 'building-t',
          rssi: -45 + Math.random() * 10 - 5, // Add some variation
          accuracy: 2.5 + Math.random() * 2,
        },
        {
          id: 'mock-beacon-2',
          uuid: 'F7826DA6-4FA2-4E98-8024-BC5B71E0893E',
          major: 1,
          minor: 101,
          coordinates: { lat: 49.2825, lng: -123.1205 },
          floor: 1,
          building: 'building-t',
          rssi: -52 + Math.random() * 10 - 5, // Add some variation
          accuracy: 4.1 + Math.random() * 2,
        },
      ];

      const scanResult: BeaconScanResult = {
        beacons: mockBeacons,
        scanDuration: Date.now() - scanStartTime,
        timestamp: Date.now(),
      };

      // Store scan results
      this.lastScanResults = mockBeacons;
      this.addScanToHistory(scanResult);

      // Emit results to callbacks
      this.emitBeacons(mockBeacons);

    } catch (error) {
      console.error('Mock scan failed:', error);
      throw error;
    }
  }

  // Removed native monitoring methods - using mock data instead

  // Removed native BLE processing methods - using mock data instead

  private addScanToHistory(scanResult: BeaconScanResult): void {
    this.scanHistory.push(scanResult);
    
    // Keep only last 100 scan results
    if (this.scanHistory.length > 100) {
      this.scanHistory = this.scanHistory.slice(-100);
    }
  }

  private emitBeacons(beacons: BeaconData[]): void {
    this.scanCallbacks.forEach(callback => {
      try {
        callback(beacons);
      } catch (error) {
        console.error('Error in beacon callback:', error);
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

  // Public methods for event handling
  onBeaconsDetected(callback: BeaconCallback): () => void {
    this.scanCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.scanCallbacks.indexOf(callback);
      if (index > -1) {
        this.scanCallbacks.splice(index, 1);
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
  getLastScanResults(): BeaconData[] {
    return [...this.lastScanResults];
  }

  getScanHistory(): BeaconScanResult[] {
    return [...this.scanHistory];
  }

  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }

  // Utility methods
  async testBeaconDetection(): Promise<BeaconData[]> {
    // For testing purposes - returns mock beacon data
    const mockBeacons: BeaconData[] = [
      {
        id: 'test-beacon-1',
        uuid: 'F7826DA6-4FA2-4E98-8024-BC5B71E0893E',
        major: 1,
        minor: 100,
        coordinates: { lat: 49.2827, lng: -123.1207 },
        floor: 1,
        building: 'building-t',
        rssi: -45,
        accuracy: 2.5,
      },
      {
        id: 'test-beacon-2',
        uuid: 'F7826DA6-4FA2-4E98-8024-BC5B71E0893E',
        major: 1,
        minor: 101,
        coordinates: { lat: 49.2825, lng: -123.1205 },
        floor: 1,
        building: 'building-t',
        rssi: -52,
        accuracy: 4.1,
      },
    ];

    console.log('Test beacon detection returning mock data');
    return mockBeacons;
  }

  getStatus(): {
    isScanning: boolean;
    lastScanTime: number;
    beaconCount: number;
    scanHistoryCount: number;
  } {
    return {
      isScanning: this.isScanning,
      lastScanTime: this.scanHistory.length > 0 
        ? this.scanHistory[this.scanHistory.length - 1].timestamp 
        : 0,
      beaconCount: this.lastScanResults.length,
      scanHistoryCount: this.scanHistory.length,
    };
  }
}

// Export singleton instance
export const beaconService = new BeaconService();
export default beaconService;