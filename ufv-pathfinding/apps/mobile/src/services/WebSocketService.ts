import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { UserLocation, BeaconData, Route } from '../types';

interface LocationUpdate {
  coordinates: { lat: number; lng: number };
  floor: number;
  building: string;
  accuracy: number;
  source: 'gps' | 'beacon' | 'wifi' | 'manual' | 'qr_code';
}

interface WebSocketEvents {
  // Outgoing events
  update_location: (data: LocationUpdate) => void;
  beacon_scan: (data: BeaconData[]) => void;
  request_route: (data: any) => void;
  join_area: (data: { building: string; floor?: number }) => void;
  leave_area: (data: { building: string; floor?: number }) => void;

  // Incoming events
  location_update: (data: UserLocation) => void;
  location_confirmed: (data: UserLocation) => void;
  route_calculated: (data: Route) => void;
  nearby_user_update: (data: { userId: string; location: UserLocation; distance: number }) => void;
  geofence_enter: (data: { geofence: string; location: UserLocation }) => void;
  geofence_exit: (data: { geofence: string; location: UserLocation }) => void;
  prolonged_stay: (data: { location: UserLocation; duration: number }) => void;
}

type EventCallback = (...args: any[]) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners = new Map<string, EventCallback[]>();
  private currentLocation: UserLocation | null = null;
  private currentArea: { building: string; floor?: number } | null = null;

  constructor() {
    this.setupEventListeners();
  }

  async connect(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const baseUrl = __DEV__ 
        ? 'http://192.168.1.24:3000'
        : 'https://your-production-api.com';

      this.socket = io(`${baseUrl}/location`, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });

      this.setupSocketEventListeners();

      return new Promise((resolve, reject) => {
        if (!this.socket) return reject(new Error('Socket not initialized'));

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        // Set connection timeout
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('WebSocket disconnected');
    }
  }

  private setupSocketEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;

      // Attempt to reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        return;
      }

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          this.connect().catch(console.error);
        }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emitToListeners('error', error);
    });

    // Location events
    this.socket.on('location_update', (data: UserLocation) => {
      console.log('Location update received:', data);
      this.currentLocation = data;
      this.emitToListeners('location_update', data);
    });

    this.socket.on('location_confirmed', (data: UserLocation) => {
      console.log('Location confirmed:', data);
      this.currentLocation = data;
      this.emitToListeners('location_confirmed', data);
    });

    // Route events
    this.socket.on('route_calculated', (data: Route) => {
      console.log('Route calculated:', data);
      this.emitToListeners('route_calculated', data);
    });

    // Proximity events
    this.socket.on('nearby_user_update', (data) => {
      console.log('Nearby user update:', data);
      this.emitToListeners('nearby_user_update', data);
    });

    // Geofence events
    this.socket.on('geofence_enter', (data) => {
      console.log('Geofence entered:', data);
      this.emitToListeners('geofence_enter', data);
    });

    this.socket.on('geofence_exit', (data) => {
      console.log('Geofence exited:', data);
      this.emitToListeners('geofence_exit', data);
    });

    this.socket.on('prolonged_stay', (data) => {
      console.log('Prolonged stay detected:', data);
      this.emitToListeners('prolonged_stay', data);
    });
  }

  private setupEventListeners(): void {
    // Initialize event listener map
    this.eventListeners.set('location_update', []);
    this.eventListeners.set('location_confirmed', []);
    this.eventListeners.set('route_calculated', []);
    this.eventListeners.set('nearby_user_update', []);
    this.eventListeners.set('geofence_enter', []);
    this.eventListeners.set('geofence_exit', []);
    this.eventListeners.set('prolonged_stay', []);
    this.eventListeners.set('error', []);
  }

  // Event listener management
  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitToListeners(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Location methods
  async updateLocation(locationUpdate: LocationUpdate): Promise<void> {
    if (!this.isConnected || !this.socket) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('update_location', locationUpdate, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to update location'));
        }
      });
    });
  }

  async sendBeaconScan(beaconData: BeaconData[]): Promise<void> {
    if (!this.isConnected || !this.socket) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('beacon_scan', beaconData, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to process beacon scan'));
        }
      });
    });
  }

  async requestRoute(routeRequest: any): Promise<void> {
    if (!this.isConnected || !this.socket) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('request_route', routeRequest, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to calculate route'));
        }
      });
    });
  }

  async joinArea(building: string, floor?: number): Promise<void> {
    if (!this.isConnected || !this.socket) {
      throw new Error('WebSocket not connected');
    }

    // Leave current area first
    if (this.currentArea) {
      await this.leaveArea(this.currentArea.building, this.currentArea.floor);
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('join_area', { building, floor }, (response: any) => {
        if (response.success) {
          this.currentArea = { building, floor };
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to join area'));
        }
      });
    });
  }

  async leaveArea(building: string, floor?: number): Promise<void> {
    if (!this.isConnected || !this.socket) {
      return; // Silently fail if not connected
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('leave_area', { building, floor }, (response: any) => {
        if (response.success) {
          this.currentArea = null;
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to leave area'));
        }
      });
    });
  }

  // Status methods
  isWebSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getCurrentLocation(): UserLocation | null {
    return this.currentLocation;
  }

  getCurrentArea(): { building: string; floor?: number } | null {
    return this.currentArea;
  }

  // Utility methods
  async reconnect(): Promise<void> {
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    return this.connect();
  }

  getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    currentLocation: UserLocation | null;
    currentArea: { building: string; floor?: number } | null;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      currentLocation: this.currentLocation,
      currentArea: this.currentArea,
    };
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;