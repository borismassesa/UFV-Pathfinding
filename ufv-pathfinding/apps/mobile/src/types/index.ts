// Coordinate types
export interface Coordinates {
  lat: number;
  lng: number;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Building and Room types
export interface Building {
  id: string;
  name: string;
  code: string;
  coordinates: Coordinates;
  floors: number;
  entrances: BuildingEntrance[];
  amenities: string[];
  hours?: BuildingHours;
}

export interface BuildingEntrance {
  id: string;
  name: string;
  coordinates: Coordinates;
  isAccessible: boolean;
  isMain: boolean;
}

export interface BuildingHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface Room {
  id: string;
  buildingId: string;
  name: string;
  number: string;
  floor: number;
  type: RoomType;
  coordinates: Coordinates;
  capacity?: number;
  amenities: string[];
  isAccessible: boolean;
  description?: string;
}

export enum RoomType {
  CLASSROOM = 'classroom',
  LAB = 'lab',
  OFFICE = 'office',
  WASHROOM = 'washroom',
  STAIRWELL = 'stairwell',
  ELEVATOR = 'elevator',
  ENTRANCE = 'entrance',
  HALLWAY = 'hallway',
  STUDY_AREA = 'study_area',
  CAFETERIA = 'cafeteria',
  OTHER = 'other'
}

// Navigation types
export interface NavigationNode {
  id: string;
  coordinates: Coordinates;
  floor: number;
  buildingId: string;
  type: string;
  isAccessible: boolean;
  connectedNodes: string[];
}

export interface Route {
  id: string;
  start: Coordinates;
  end: Coordinates;
  distance: number;
  duration: number;
  path: Coordinates[];
  instructions: NavigationInstruction[];
  floors: number[];
  isAccessible: boolean;
  avoidStairs?: boolean;
  avoidElevators?: boolean;
  timestamp?: Date;
}

export interface NavigationInstruction {
  id: string;
  type: InstructionType;
  text: string;
  distance: number;
  duration: number;
  floor: number;
  coordinates: Coordinates;
  landmark?: string;
  icon?: string;
}

export enum InstructionType {
  START = 'start',
  TURN_LEFT = 'turn_left',
  TURN_RIGHT = 'turn_right',
  GO_STRAIGHT = 'go_straight',
  TAKE_STAIRS = 'take_stairs',
  TAKE_ELEVATOR = 'take_elevator',
  CHANGE_FLOOR = 'change_floor',
  ARRIVE = 'arrive',
  ENTER_BUILDING = 'enter_building',
  EXIT_BUILDING = 'exit_building'
}

// Location and Beacon types
export interface UserLocation {
  coordinates: Coordinates;
  floor: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
  source: LocationSource;
  buildingId?: string;
}

export enum LocationSource {
  GPS = 'gps',
  WIFI = 'wifi',
  BEACON = 'beacon',
  MANUAL = 'manual',
  UNKNOWN = 'unknown'
}

export interface BeaconData {
  id: string;
  uuid: string;
  major: number;
  minor: number;
  coordinates: Coordinates;
  floor: number;
  building: string;
  rssi: number;
  accuracy: number;
  timestamp?: Date;
}

// User Preferences
export interface UserPreferences {
  avoidStairs: boolean;
  avoidElevators: boolean;
  preferAccessible: boolean;
  walkingSpeed: WalkingSpeed;
  notificationsEnabled: boolean;
  offlineMode: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export enum WalkingSpeed {
  SLOW = 'slow',
  NORMAL = 'normal',
  FAST = 'fast'
}

// Search types
export interface SearchResult {
  rooms: Room[];
  buildings: Building[];
  totalResults: number;
  query: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
}

// Offline data types
export interface OfflineMapData {
  building: Building;
  rooms: Room[];
  beacons: BeaconData[];
  lastUpdated: Date;
  version: string;
}

export interface CachedRoute {
  id: string;
  route: Route;
  timestamp: Date;
  expiresAt: Date;
}

// WebSocket event types
export interface LocationUpdateEvent {
  userId: string;
  location: UserLocation;
  timestamp: Date;
}

export interface BeaconDetectionEvent {
  userId: string;
  beacons: BeaconData[];
  timestamp: Date;
}

export interface NavigationUpdateEvent {
  userId: string;
  route: Route;
  currentLocation: UserLocation;
  remainingDistance: number;
  remainingDuration: number;
  nextInstruction: NavigationInstruction;
}