export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UTMCoordinates {
  x: number;
  y: number;
  zone: number;
  hemisphere: 'N' | 'S';
}

export interface Room {
  id: string;
  roomNumber: string;
  name: string;
  building: string;
  floor: number;
  type: RoomType;
  coordinates: Coordinates;
  utmCoordinates: UTMCoordinates;
  area: number;
  capacity?: number;
  accessibility: AccessibilityFeatures;
  amenities: string[];
  hours?: OpeningHours;
}

export enum RoomType {
  CLASSROOM = 'classroom',
  OFFICE = 'office',
  LAB = 'lab',
  STUDY_ROOM = 'study_room',
  WASHROOM = 'washroom',
  UTILITY = 'utility',
  COMMON_AREA = 'common_area',
  CAFETERIA = 'cafeteria',
  LIBRARY = 'library',
  AUDITORIUM = 'auditorium'
}

export interface AccessibilityFeatures {
  wheelchairAccessible: boolean;
  elevatorAccess: boolean;
  accessibleWashroom: boolean;
  automaticDoors: boolean;
  brailleSignage: boolean;
  hearingLoop: boolean;
}

export interface OpeningHours {
  monday: TimeRange;
  tuesday: TimeRange;
  wednesday: TimeRange;
  thursday: TimeRange;
  friday: TimeRange;
  saturday: TimeRange;
  sunday: TimeRange;
}

export interface TimeRange {
  open: string; // HH:MM format
  close: string; // HH:MM format
  closed?: boolean;
}

export interface NavigationNode {
  id: string;
  coordinates: Coordinates;
  floor: number;
  type: NodeType;
  connectedNodes: string[];
}

export enum NodeType {
  ROOM_ENTRANCE = 'room_entrance',
  CORRIDOR = 'corridor',
  INTERSECTION = 'intersection',
  STAIRS = 'stairs',
  ELEVATOR = 'elevator',
  ENTRANCE = 'entrance',
  EXIT = 'exit'
}

export interface NavigationEdge {
  id: string;
  from: string;
  to: string;
  distance: number;
  time: number; // seconds
  accessible: boolean;
  type: EdgeType;
}

export enum EdgeType {
  CORRIDOR = 'corridor',
  STAIRS = 'stairs',
  ELEVATOR = 'elevator',
  RAMP = 'ramp',
  OUTDOOR = 'outdoor'
}

export interface Route {
  id: string;
  from: NavigationNode;
  to: NavigationNode;
  path: NavigationNode[];
  edges: NavigationEdge[];
  totalDistance: number;
  estimatedTime: number;
  accessible: boolean;
  instructions: NavigationInstruction[];
}

export interface NavigationInstruction {
  step: number;
  instruction: string;
  distance: number;
  direction?: Direction;
  landmark?: string;
  floor?: number;
  node: NavigationNode;
}

export enum Direction {
  NORTH = 'north',
  SOUTH = 'south',
  EAST = 'east',
  WEST = 'west',
  NORTHEAST = 'northeast',
  NORTHWEST = 'northwest',
  SOUTHEAST = 'southeast',
  SOUTHWEST = 'southwest',
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  STRAIGHT = 'straight'
}

export interface Building {
  id: string;
  name: string;
  code: string;
  campus: string;
  coordinates: Coordinates;
  floors: Floor[];
  entrances: BuildingEntrance[];
  amenities: string[];
  accessibility: AccessibilityFeatures;
}

export interface Floor {
  number: number;
  name: string;
  mapUrl?: string;
  rooms: Room[];
  navigationNodes: NavigationNode[];
}

export interface BuildingEntrance {
  id: string;
  name: string;
  coordinates: Coordinates;
  accessible: boolean;
  mainEntrance: boolean;
}

export interface SearchResult {
  type: 'room' | 'building' | 'amenity';
  id: string;
  name: string;
  description: string;
  building?: string;
  floor?: number;
  coordinates: Coordinates;
  relevance: number;
}

export interface UserPreferences {
  avoidStairs: boolean;
  preferElevator: boolean;
  accessibleOnly: boolean;
  avoidCrowdedAreas: boolean;
  preferredWalkingSpeed: WalkingSpeed;
}

export enum WalkingSpeed {
  SLOW = 'slow',
  NORMAL = 'normal',
  FAST = 'fast'
}

export interface BeaconData {
  id: string;
  uuid: string;
  major: number;
  minor: number;
  coordinates: Coordinates;
  floor: number;
  building: string;
  rssi?: number;
  accuracy?: number;
}

export interface UserLocation {
  coordinates: Coordinates;
  floor: number;
  building: string;
  accuracy: number;
  timestamp: Date;
  source: LocationSource;
}

export enum LocationSource {
  GPS = 'gps',
  BEACON = 'beacon',
  WIFI = 'wifi',
  MANUAL = 'manual',
  QR_CODE = 'qr_code'
}