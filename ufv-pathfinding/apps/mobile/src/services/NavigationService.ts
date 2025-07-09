import axios from 'axios';

// API Base URL - Updated for mobile device access
// Using your computer's IP address: 192.168.1.24
const API_BASE_URL = 'http://192.168.1.24:3000/api/v1';

export interface Coordinates {
  x: number;
  y: number;
}

export interface RouteRequest {
  start: {
    coordinates: Coordinates;
    type: string;
    accessibility?: string[];
  };
  end: {
    coordinates: Coordinates;
    type: string;
    accessibility?: string[];
  };
  preferences: {
    wheelchair?: boolean;
    shortest?: boolean;
    avoidStairs?: boolean;
    language?: string;
  };
}

export interface NavigationNode {
  id: string;
  coordinates: Coordinates;
  type: string;
  accessibility: string[];
}

export interface RouteResponse {
  success: boolean;
  data: {
    routeId: string;
    route: NavigationNode[];
    totalDistance: number;
    estimatedTime: number;
    accessibility: string[];
  };
}

export interface DirectionsResponse {
  success: boolean;
  data: {
    routeId: string;
    directions: Array<{
      step: number;
      instruction: string;
      distance: number;
      direction: string;
      landmark?: string;
    }>;
    totalSteps: number;
    totalDistance: number;
  };
}

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  type: string;
  description?: string;
  coordinates: Coordinates;
}

export interface Building {
  id: string;
  name: string;
  coordinates: Coordinates;
  floors: number[];
  amenities: string[];
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  type: string;
  affectedAreas: string[];
  startTime: string;
  endTime?: string;
}

class NavigationService {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for debugging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log('✅ API Response:', response.status, response.config.url);
        return response;
      },
      (error) => {
        console.error('❌ API Error:', error.response?.data || error.message);
        console.error('Failed URL:', error.config?.url);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Calculate route between two points
   */
  async calculateRoute(request: RouteRequest): Promise<RouteResponse> {
    try {
      const response = await this.axiosInstance.post('/pathfinding/route', request);
      return response.data;
    } catch (error) {
      console.error('Route calculation failed:', error);
      throw new Error('Failed to calculate route - check network connection');
    }
  }

  /**
   * Get turn-by-turn directions for a route
   */
  async getDirections(routeId: string): Promise<DirectionsResponse> {
    try {
      const response = await this.axiosInstance.get(`/pathfinding/directions/${routeId}`);
      return response.data;
    } catch (error) {
      console.error('Directions fetch failed:', error);
      throw new Error('Failed to get directions - check network connection');
    }
  }

  /**
   * Search for rooms and locations
   */
  async searchRooms(query: string, filters?: {
    building?: string;
    floor?: number;
    type?: string;
  }): Promise<{ success: boolean; data: Room[] }> {
    try {
      const params = new URLSearchParams({ q: query });
      if (filters?.building) params.append('building', filters.building);
      if (filters?.floor) params.append('floor', filters.floor.toString());
      if (filters?.type) params.append('type', filters.type);

      const response = await this.axiosInstance.get(`/pathfinding/rooms/search?${params}`);
      return response.data;
    } catch (error) {
      console.error('Room search failed:', error);
      throw new Error('Failed to search rooms - check network connection');
    }
  }

  /**
   * Get all buildings
   */
  async getBuildings(): Promise<{ success: boolean; data: Building[] }> {
    try {
      const response = await this.axiosInstance.get('/pathfinding/buildings');
      return response.data;
    } catch (error) {
      console.error('Buildings fetch failed:', error);
      throw new Error('Failed to get buildings - check network connection');
    }
  }

  /**
   * Get campus alerts
   */
  async getAlerts(): Promise<{ success: boolean; data: Alert[] }> {
    try {
      const response = await this.axiosInstance.get('/pathfinding/alerts');
      return response.data;
    } catch (error) {
      console.error('Alerts fetch failed:', error);
      throw new Error('Failed to get alerts - check network connection');
    }
  }

  /**
   * Check API health - useful for testing connectivity
   */
  async checkApiHealth(): Promise<{ status: string; timestamp: string; version: string }> {
    try {
      const response = await this.axiosInstance.get('/health', {
        baseURL: API_BASE_URL.replace('/api/v1', ''), // Health check is at root
      });
      return response.data;
    } catch (error) {
      console.error('API health check failed:', error);
      throw new Error('Cannot connect to server - check network and server status');
    }
  }

  /**
   * Test connectivity to backend
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.checkApiHealth();
      console.log('✅ Server connection successful');
      return true;
    } catch (error) {
      console.error('❌ Server connection failed:', error);
      return false;
    }
  }

  /**
   * Mock method for offline testing
   */
  getMockRoute(): RouteResponse {
    console.log('📱 Using mock data (offline mode)');
    return {
      success: true,
      data: {
        routeId: 'mock-route-123',
        route: [
          {
            id: 'start-node',
            coordinates: { x: 100, y: 100 },
            type: 'entrance',
            accessibility: ['wheelchair', 'elevator'],
          },
          {
            id: 'hallway-node-1',
            coordinates: { x: 150, y: 100 },
            type: 'hallway',
            accessibility: ['wheelchair'],
          },
          {
            id: 'junction-node',
            coordinates: { x: 150, y: 150 },
            type: 'junction',
            accessibility: ['wheelchair'],
          },
          {
            id: 'destination-node',
            coordinates: { x: 150, y: 180 },
            type: 'room',
            accessibility: ['wheelchair'],
          },
        ],
        totalDistance: 75,
        estimatedTime: 53,
        accessibility: ['wheelchair'],
      },
    };
  }

  /**
   * Mock directions for offline testing
   */
  getMockDirections(): DirectionsResponse {
    console.log('📱 Using mock directions (offline mode)');
    return {
      success: true,
      data: {
        routeId: 'mock-route-123',
        directions: [
          {
            step: 1,
            instruction: 'Head north towards the main entrance',
            distance: 15,
            direction: 'north',
            landmark: 'Main entrance',
          },
          {
            step: 2,
            instruction: 'Turn right at the main hallway',
            distance: 25,
            direction: 'east',
            landmark: 'Information desk',
          },
          {
            step: 3,
            instruction: 'Continue straight for 30 meters',
            distance: 30,
            direction: 'east',
            landmark: 'Classroom corridor',
          },
          {
            step: 4,
            instruction: 'Your destination is on the right',
            distance: 5,
            direction: 'south',
            landmark: 'Room T-123',
          },
        ],
        totalSteps: 4,
        totalDistance: 75,
      },
    };
  }
}

// Export singleton instance
export const navigationService = new NavigationService();
export default NavigationService; 