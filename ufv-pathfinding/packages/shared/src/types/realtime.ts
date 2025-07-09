export interface SocketEvents {
  // Client -> Server
  JOIN_ROOM: 'join_room';
  LEAVE_ROOM: 'leave_room';
  REQUEST_LOCATION_UPDATE: 'request_location_update';
  SHARE_LOCATION: 'share_location';
  NAVIGATION_UPDATE: 'navigation_update';
  EMERGENCY_ALERT: 'emergency_alert';
  
  // Server -> Client
  LOCATION_UPDATE: 'location_update';
  NAVIGATION_INSTRUCTION: 'navigation_instruction';
  CROWD_UPDATE: 'crowd_update';
  BUILDING_ALERT: 'building_alert';
  ROOM_STATUS_UPDATE: 'room_status_update';
  FRIEND_LOCATION: 'friend_location';
  EMERGENCY_BROADCAST: 'emergency_broadcast';
  
  // Bidirectional
  CONNECTION: 'connection';
  DISCONNECT: 'disconnect';
  ERROR: 'error';
}

export interface LocationUpdate {
  userId: string;
  location: {
    coordinates: { lat: number; lng: number };
    floor: number;
    building: string;
    accuracy: number;
  };
  timestamp: Date;
}

export interface NavigationUpdate {
  userId: string;
  routeId: string;
  currentStep: number;
  distanceRemaining: number;
  timeRemaining: number;
  deviation: boolean;
  currentLocation: LocationUpdate['location'];
}

export interface CrowdUpdate {
  building: string;
  floor: number;
  areas: CrowdArea[];
  timestamp: Date;
}

export interface CrowdArea {
  id: string;
  name: string;
  density: CrowdDensity;
  peopleCount: number;
  capacity: number;
}

export enum CrowdDensity {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export interface BuildingAlert {
  id: string;
  building: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  affectedAreas: string[];
  startTime: Date;
  endTime?: Date;
  active: boolean;
}

export enum AlertType {
  MAINTENANCE = 'maintenance',
  EMERGENCY = 'emergency',
  EVENT = 'event',
  CLOSURE = 'closure',
  WEATHER = 'weather'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface RoomStatusUpdate {
  roomId: string;
  status: RoomStatus;
  occupancy?: number;
  nextAvailable?: Date;
  message?: string;
}

export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  CLOSED = 'closed',
  RESERVED = 'reserved'
}

export interface EmergencyAlert {
  userId: string;
  location: LocationUpdate['location'];
  type: EmergencyType;
  message?: string;
  timestamp: Date;
}

export enum EmergencyType {
  MEDICAL = 'medical',
  SECURITY = 'security',
  FIRE = 'fire',
  OTHER = 'other'
}

export interface FriendLocation {
  friendId: string;
  name: string;
  location: LocationUpdate['location'];
  sharingExpiry: Date;
}