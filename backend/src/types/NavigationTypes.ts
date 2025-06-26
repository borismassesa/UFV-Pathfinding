export interface Coordinates {
    x: number;
    y: number;
    floor?: number;
}

export interface LocationPoint {
    coordinates: Coordinates;
    type: 'room' | 'entrance' | 'landmark' | 'coordinates';
    identifier?: string; // room number, building code, etc.
    name?: string;
}

export interface PathfindingOptions {
    avoidStairs?: boolean;
    preferElevators?: boolean;
    maxWalkingDistance?: number; // in meters
    algorithm?: 'astar' | 'dijkstra';
    accessibilityRequired?: boolean;
    surfaceType?: 'any' | 'smooth' | 'rough';
}

export interface NavigationRequest {
    start: LocationPoint;
    end: LocationPoint;
    options?: PathfindingOptions;
}

export interface NavigationNode {
    id: string;
    coordinates: Coordinates;
    type: 'room_center' | 'doorway' | 'hallway_intersection' | 'elevator' | 'stairway' | 'entrance' | 'junction';
    buildingId?: string;
    roomId?: string;
    accessibility: string[];
}

export interface NavigationEdge {
    id: string;
    fromNodeId: string;
    toNodeId: string;
    distance: number; // in meters
    type: 'horizontal' | 'vertical' | 'doorway' | 'hallway' | 'outdoor' | 'emergency';
    surfaceType: 'smooth' | 'rough' | 'carpet' | 'tile' | 'concrete' | 'gravel' | 'grass' | 'stairs';
    accessibilityCompliant: boolean;
    estimatedTime: number; // in seconds
}

export interface RouteStep {
    nodeId: string;
    coordinates: Coordinates;
    instruction: string;
    distance: number;
    direction: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'southeast' | 'northwest' | 'southwest';
    landmark?: string;
}

export interface PathfindingResult {
    success: boolean;
    route?: NavigationNode[];
    instructions?: RouteStep[];
    totalDistance?: number;
    estimatedTime?: number;
    accessibility?: {
        wheelchairAccessible: boolean;
        hasElevatorAccess: boolean;
        hasStairs: boolean;
        surfaceTypes: string[];
    };
    error?: string;
}

export interface Room {
    id: number;
    roomNumber: string;
    buildingCode: string;
    buildingName: string;
    floor: number;
    roomType: string;
    coordinates: Coordinates;
    accessibility: string[];
    area?: number;
}

export interface Building {
    id: number;
    code: string;
    name: string;
    address: string;
    floors: number;
    coordinates: Coordinates;
    amenities: string[];
}

export interface CampusAlert {
    id: number;
    type: 'maintenance' | 'construction' | 'emergency' | 'event' | 'closure';
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedAreas: string[];
    startTime: string;
    endTime?: string;
    isActive: boolean;
}

export interface SearchResult {
    query: string;
    results: Room[];
    totalResults: number;
}

export interface DirectionStep {
    step: number;
    instruction: string;
    distance: number;
    direction: string;
    landmark?: string;
} 