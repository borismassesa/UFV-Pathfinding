import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import OfflineNavigationService from './OfflineNavigationService';
import type { 
  UserLocation, 
  Route, 
  Room, 
  Building, 
  BeaconData,
  UserPreferences,
  Coordinates 
} from '../types';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  role?: string;
  profile?: {
    firstName: string;
    lastName: string;
    studentId?: string;
    department?: string;
  };
}

interface AuthResponse {
  user: any;
  accessToken: string;
  refreshToken: string;
}

interface RouteRequest {
  from: Coordinates;
  to: Coordinates;
  preferences?: UserPreferences;
}

interface LocationUpdate {
  coordinates: Coordinates;
  floor: number;
  building: string;
  accuracy: number;
  source: 'gps' | 'beacon' | 'wifi' | 'manual' | 'qr_code';
}

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use different base URLs for development vs production
    this.baseURL = __DEV__ 
      ? 'http://192.168.1.24:3000/api'
      : 'https://your-production-api.com/api';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              await AsyncStorage.setItem('accessToken', response.data.accessToken);
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            await this.clearTokens();
            // You might want to emit an event here to trigger navigation to login
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Authentication Methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', credentials);
    
    // Store tokens
    await AsyncStorage.setItem('accessToken', response.data.accessToken);
    await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', userData);
    
    // Store tokens
    await AsyncStorage.setItem('accessToken', response.data.accessToken);
    await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      await this.clearTokens();
    }
  }

  private async refreshToken(refreshToken: string): Promise<AxiosResponse> {
    return this.client.post('/auth/refresh', { refreshToken });
  }

  private async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
  }

  async getCurrentUser(): Promise<any> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Navigation Methods
  async calculateRoute(request: RouteRequest): Promise<Route> {
    try {
      // Try online calculation first
      const response = await this.client.post<Route>('/navigation/route', request);
      return response.data;
    } catch (error) {
      console.warn('Online route calculation failed, trying offline fallback...', error);
      
      // Use offline navigation service as fallback
      const offlineRoute = await OfflineNavigationService.calculateRoute(
        request.from,
        request.to,
        request.preferences
      );
      
      if (offlineRoute) {
        return offlineRoute;
      }
      
      throw error;
    }
  }

  async updateLocation(locationUpdate: LocationUpdate): Promise<void> {
    await this.client.post('/navigation/location', locationUpdate);
  }

  async getNearbyNodes(lat: number, lng: number, radiusMeters?: number): Promise<any[]> {
    const response = await this.client.get('/navigation/nodes/nearby', {
      params: { lat, lng, radius: radiusMeters }
    });
    return response.data;
  }

  async getFavoriteRooms(): Promise<Room[]> {
    const response = await this.client.get<Room[]>('/navigation/favorites');
    return response.data;
  }

  async addFavoriteRoom(roomId: string): Promise<void> {
    await this.client.post(`/navigation/favorites/${roomId}`);
  }

  async removeFavoriteRoom(roomId: string): Promise<void> {
    await this.client.delete(`/navigation/favorites/${roomId}`);
  }

  async getRecentLocations(): Promise<any[]> {
    const response = await this.client.get('/navigation/recent');
    return response.data;
  }

  async getNavigationStats(): Promise<any> {
    const response = await this.client.get('/navigation/stats');
    return response.data;
  }

  // Room Methods
  async searchRooms(query: string, options?: { buildingId?: string; floor?: number; limit?: number; includeAvailability?: boolean; includeDistance?: boolean; userLocation?: { lat: number; lng: number } }): Promise<{ rooms: any[] }> {
    try {
      // Try online search first
      const response = await this.client.get('/rooms/search', {
        params: { 
          q: query, 
          buildingId: options?.buildingId, 
          floor: options?.floor,
          limit: options?.limit,
          includeAvailability: options?.includeAvailability,
          includeDistance: options?.includeDistance,
          userLat: options?.userLocation?.lat,
          userLng: options?.userLocation?.lng
        }
      });
      return { rooms: response.data };
    } catch (error) {
      console.warn('Online search failed, trying offline fallback...', error);
      
      // Use offline search as fallback
      const offlineResults = await OfflineNavigationService.searchRooms(query, options?.buildingId);
      return { rooms: offlineResults };
    }
  }

  async getAllRooms(buildingId?: string, floor?: number): Promise<Room[]> {
    const response = await this.client.get<Room[]>('/rooms', {
      params: { buildingId, floor }
    });
    return response.data;
  }

  async getRoomById(roomId: string): Promise<Room> {
    const response = await this.client.get<Room>(`/rooms/${roomId}`);
    return response.data;
  }

  async getRoomsNearby(lat: number, lng: number, radius?: number): Promise<Room[]> {
    const response = await this.client.get<Room[]>('/rooms/nearby', {
      params: { lat, lng, radius }
    });
    return response.data;
  }

  async getRoomsByType(type: string, buildingId?: string): Promise<Room[]> {
    const response = await this.client.get<Room[]>(`/rooms/type/${type}`, {
      params: { buildingId }
    });
    return response.data;
  }

  async getAccessibleRooms(buildingId?: string): Promise<Room[]> {
    const response = await this.client.get<Room[]>('/rooms/accessible', {
      params: { buildingId }
    });
    return response.data;
  }

  // Building Methods
  async getAllBuildings(): Promise<Building[]> {
    const response = await this.client.get<Building[]>('/buildings');
    return response.data;
  }

  async getBuildingById(buildingId: string): Promise<Building> {
    const response = await this.client.get<Building>(`/buildings/${buildingId}`);
    return response.data;
  }

  async getBuilding(buildingId: string): Promise<{ data: Building }> {
    const response = await this.client.get<Building>(`/buildings/${buildingId}`);
    return { data: response.data };
  }

  async getRooms(buildingId: string): Promise<{ data: Room[] }> {
    const response = await this.client.get<Room[]>('/rooms', {
      params: { buildingId }
    });
    return { data: response.data };
  }

  async getBeacons(buildingId: string): Promise<{ data: BeaconData[] }> {
    const response = await this.client.get<BeaconData[]>('/beacons', {
      params: { buildingId }
    });
    return { data: response.data };
  }

  async getBuildingFloors(buildingId: string): Promise<any[]> {
    const response = await this.client.get(`/buildings/${buildingId}/floors`);
    return response.data;
  }

  // Beacon Methods
  async getAllBeacons(buildingId?: string, floor?: number): Promise<any[]> {
    const response = await this.client.get('/beacons', {
      params: { buildingId, floor }
    });
    return response.data;
  }

  async getNearbyBeacons(lat: number, lng: number, radius?: number): Promise<any[]> {
    const response = await this.client.get('/beacons/nearby', {
      params: { lat, lng, radius }
    });
    return response.data;
  }

  async triangulatePosition(beaconScans: BeaconData[]): Promise<any> {
    const response = await this.client.post('/beacons/triangulate', beaconScans);
    return response.data;
  }

  async getBeaconStats(buildingId?: string): Promise<any> {
    const response = await this.client.get('/beacons/stats', {
      params: { buildingId }
    });
    return response.data;
  }

  // Utility Methods
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  getWebSocketUrl(): string {
    return this.baseURL.replace('/api', '').replace('http', 'ws');
  }

  // Error Handling
  isNetworkError(error: any): boolean {
    return !error.response && error.message === 'Network Error';
  }

  isServerError(error: any): boolean {
    return error.response?.status >= 500;
  }

  isUnauthorized(error: any): boolean {
    return error.response?.status === 401;
  }

  getErrorMessage(error: any): string {
    if (this.isNetworkError(error)) {
      return 'Network connection error. Please check your internet connection.';
    }

    if (this.isServerError(error)) {
      return 'Server error. Please try again later.';
    }

    return error.response?.data?.message || error.message || 'An unexpected error occurred.';
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;