export interface NavigationEvent {
  id: string;
  userId: string;
  type: EventType;
  timestamp: Date;
  data: EventData;
  sessionId: string;
}

export enum EventType {
  SEARCH = 'search',
  ROUTE_REQUEST = 'route_request',
  NAVIGATION_START = 'navigation_start',
  NAVIGATION_COMPLETE = 'navigation_complete',
  NAVIGATION_CANCEL = 'navigation_cancel',
  LOCATION_UPDATE = 'location_update',
  ROOM_VIEW = 'room_view',
  FAVORITE_ADD = 'favorite_add',
  FAVORITE_REMOVE = 'favorite_remove',
  FEEDBACK = 'feedback',
  ERROR = 'error'
}

export interface EventData {
  [key: string]: any;
}

export interface RouteAnalytics {
  routeId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  fromRoom: string;
  toRoom: string;
  distance: number;
  estimatedTime: number;
  actualTime?: number;
  completed: boolean;
  deviations: number;
  feedback?: RouteFeedback;
}

export interface RouteFeedback {
  rating: number; // 1-5
  accuracy: number; // 1-5
  clarity: number; // 1-5
  comments?: string;
  issues?: string[];
}

export interface HeatmapData {
  building: string;
  floor: number;
  timestamp: Date;
  data: HeatmapPoint[];
}

export interface HeatmapPoint {
  x: number;
  y: number;
  value: number; // traffic intensity
}

export interface UsageStatistics {
  date: Date;
  totalUsers: number;
  activeUsers: number;
  totalSearches: number;
  totalRoutes: number;
  completedRoutes: number;
  averageRouteTime: number;
  popularRooms: PopularRoom[];
  peakHours: PeakHour[];
}

export interface PopularRoom {
  roomId: string;
  roomName: string;
  visits: number;
  uniqueVisitors: number;
}

export interface PeakHour {
  hour: number;
  dayOfWeek: number;
  traffic: number;
}

export interface PerformanceMetrics {
  timestamp: Date;
  apiResponseTime: number;
  routeCalculationTime: number;
  searchResponseTime: number;
  activeConnections: number;
  errorRate: number;
  uptime: number;
}