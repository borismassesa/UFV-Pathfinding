// Temporarily disabled database model imports for development
// import { NavigationNode, NodeType } from '../models/NavigationNode';
// import { NavigationEdge, EdgeType } from '../models/NavigationEdge';
// import { Room } from '../models/Room';
// import { Building } from '../models/Building';
import { 
  LocationPoint, 
  PathfindingOptions, 
  PathfindingResult, 
  NavigationNode as INavigationNode,
  RouteStep,
  Coordinates
} from '../types/NavigationTypes';

// Temporarily disabled legacy interfaces for development
// // Interface for route result
// export interface Route {
//   nodes: NavigationNode[];
//   edges: NavigationEdge[];
//   totalDistance: number;
//   estimatedTime: number;
//   instructions: RouteInstruction[];
//   metadata: RouteMetadata;
// }

// // Interface for route instructions  
// export interface RouteInstruction {
//   step: number;
//   type: 'start' | 'continue' | 'turn_left' | 'turn_right' | 'go_upstairs' | 'go_downstairs' | 'take_elevator' | 'arrive';
//   description: string;
//   node: NavigationNode;
//   edge?: NavigationEdge;
//   distance: number;
//   estimatedTime: number;
//   floor?: number;
// }

// Interface for route metadata
export interface RouteMetadata {
  algorithm: string;
  computationTime: number;
  nodesExplored: number;
  accessibility: boolean;
  buildings: string[];
  floors: number[];
  totalSteps: number;
}

// Priority queue node for A*
interface PriorityQueueNode {
  nodeId: string;
  fScore: number;
  gScore: number;
  hScore: number;
  parent?: string;
}

// A* algorithm implementation
class AStar {
  private openSet: Map<string, PriorityQueueNode> = new Map();
  private closedSet: Set<string> = new Set();
  private gScores: Map<string, number> = new Map();
  private fScores: Map<string, number> = new Map();
  private parents: Map<string, string> = new Map();
  private nodesExplored: number = 0;

  public async findPath(
    startNodeId: string,
    endNodeId: string,
    options: PathfindingOptions = {}
  ): Promise<{ path: string[]; distance: number; nodesExplored: number } | null> {
    this.reset();
    const startTime = Date.now();

    // Initialize start node
    this.gScores.set(startNodeId, 0);
    this.fScores.set(startNodeId, 0);
    this.openSet.set(startNodeId, {
      nodeId: startNodeId,
      fScore: 0,
      gScore: 0,
      hScore: 0,
    });

    while (this.openSet.size > 0) {
      // Get node with lowest f-score
      const current = this.getLowestFScore();
      if (!current) break;

      this.openSet.delete(current.nodeId);
      this.closedSet.add(current.nodeId);
      this.nodesExplored++;

      // Check if we reached the goal
      if (current.nodeId === endNodeId) {
        const path = this.reconstructPath(endNodeId);
        const distance = this.gScores.get(endNodeId) || 0;
        return { path, distance, nodesExplored: this.nodesExplored };
      }

      // Explore neighbors
      const neighbors = await this.getNeighbors(current.nodeId, options);
      
      for (const neighbor of neighbors) {
        if (this.closedSet.has(neighbor.neighborId)) {
          continue;
        }

        const tentativeGScore = (this.gScores.get(current.nodeId) || 0) + neighbor.weight;

        if (!this.openSet.has(neighbor.neighborId)) {
          this.openSet.set(neighbor.neighborId, {
            nodeId: neighbor.neighborId,
            fScore: Infinity,
            gScore: Infinity,
            hScore: 0,
          });
        }

        if (tentativeGScore >= (this.gScores.get(neighbor.neighborId) || Infinity)) {
          continue;
        }

        // This path is better
        this.parents.set(neighbor.neighborId, current.nodeId);
        this.gScores.set(neighbor.neighborId, tentativeGScore);
        
        const hScore = await this.calculateHeuristic(neighbor.neighborId, endNodeId);
        const fScore = tentativeGScore + hScore;
        
        this.fScores.set(neighbor.neighborId, fScore);
        
        const openNode = this.openSet.get(neighbor.neighborId)!;
        openNode.gScore = tentativeGScore;
        openNode.fScore = fScore;
        openNode.hScore = hScore;
      }
    }

    return null; // No path found
  }

  private reset(): void {
    this.openSet.clear();
    this.closedSet.clear();
    this.gScores.clear();
    this.fScores.clear();
    this.parents.clear();
    this.nodesExplored = 0;
  }

  private getLowestFScore(): PriorityQueueNode | null {
    let lowest: PriorityQueueNode | null = null;
    
    for (const node of this.openSet.values()) {
      if (!lowest || node.fScore < lowest.fScore) {
        lowest = node;
      }
    }
    
    return lowest;
  }

  private async getNeighbors(
    nodeId: string,
    options: PathfindingOptions
  ): Promise<{ neighborId: string; weight: number }[]> {
    // For now, return mock neighbors for testing
    // This will be replaced with actual database queries later
    const mockNeighbors = [
      { neighborId: 'node_' + (parseInt(nodeId.split('_')[1] || '0') + 1), weight: 10 },
      { neighborId: 'node_' + (parseInt(nodeId.split('_')[1] || '0') + 2), weight: 15 }
    ];
    
    return mockNeighbors.filter(n => n.neighborId !== nodeId);
  }

  private async calculateHeuristic(nodeId: string, targetNodeId: string): Promise<number> {
    // Simplified heuristic for testing
    // This will be replaced with actual coordinate-based calculation
    const nodeNum = parseInt(nodeId.split('_')[1] || '0') || 0;
    const targetNum = parseInt(targetNodeId.split('_')[1] || '0') || 0;
    return Math.abs(nodeNum - targetNum) * 5;
  }

  private reconstructPath(endNodeId: string): string[] {
    const path: string[] = [];
    let current = endNodeId;

    while (current) {
      path.unshift(current);
      current = this.parents.get(current) || '';
    }

    return path;
  }
}

// Main PathfindingService class
export class PathfindingService {
  private astar: AStar;

  constructor() {
    this.astar = new AStar();
  }

  /**
   * Main pathfinding method using new types
   */
  public async findPath(
    start: LocationPoint,
    end: LocationPoint,
    options: PathfindingOptions = {}
  ): Promise<PathfindingResult> {
    try {
      // For demo purposes, create a mock route
      const mockRoute: INavigationNode[] = [
        {
          id: 'start_node',
          coordinates: start.coordinates,
          type: 'entrance',
          accessibility: ['wheelchair_accessible']
        },
        {
          id: 'hallway_1',
          coordinates: { x: start.coordinates.x + 10, y: start.coordinates.y + 5 },
          type: 'hallway_intersection',
          accessibility: ['wheelchair_accessible']
        },
        {
          id: 'hallway_2', 
          coordinates: { x: end.coordinates.x - 10, y: end.coordinates.y - 5 },
          type: 'hallway_intersection',
          accessibility: ['wheelchair_accessible']
        },
        {
          id: 'end_node',
          coordinates: end.coordinates,
          type: 'room_center',
          accessibility: ['wheelchair_accessible']
        }
      ];

      const mockInstructions: RouteStep[] = [
        {
          nodeId: 'start_node',
          coordinates: start.coordinates,
          instruction: `Start at ${start.name || 'starting location'}`,
          distance: 0,
          direction: 'north'
        },
        {
          nodeId: 'hallway_1',
          coordinates: mockRoute[1].coordinates,
          instruction: 'Head north toward the main hallway',
          distance: 15,
          direction: 'north',
          landmark: 'Main entrance area'
        },
        {
          nodeId: 'hallway_2',
          coordinates: mockRoute[2].coordinates,
          instruction: 'Turn right and continue east',
          distance: 25,
          direction: 'east',
          landmark: 'Information desk'
        },
        {
          nodeId: 'end_node',
          coordinates: end.coordinates,
          instruction: `Arrive at ${end.name || 'destination'}`,
          distance: 10,
          direction: 'south',
          landmark: end.name || 'destination'
        }
      ];

      const totalDistance = mockInstructions.reduce((sum, step) => sum + step.distance, 0);
      const estimatedTime = Math.round(totalDistance / 1.4); // Average walking speed 1.4 m/s

      return {
        success: true,
        route: mockRoute,
        instructions: mockInstructions,
        totalDistance,
        estimatedTime,
        accessibility: {
          wheelchairAccessible: true,
          hasElevatorAccess: false,
          hasStairs: false,
          surfaceTypes: ['smooth', 'tile']
        }
      };

    } catch (error) {
      console.error('Pathfinding error:', error);
      return {
        success: false,
        error: 'Failed to calculate route'
      };
    }
  }

  /**
   * Find route between two rooms (legacy method)
   */
  public async findRouteByRooms(
    startRoomId: string,
    endRoomId: string,
    options: PathfindingOptions = {}
  ): Promise<any | null> {
    // This method will be implemented later when database is available
    console.log('findRouteByRooms called with:', { startRoomId, endRoomId, options });
    return null;
  }

  /**
   * Find route between two points by coordinates (legacy method)
   */
  public async findRouteByCoordinates(
    startX: number,
    startY: number,
    startBuildingId: string,
    startFloor: number,
    endX: number,
    endY: number,
    endBuildingId: string,
    endFloor: number,
    options: PathfindingOptions = {}
  ): Promise<any | null> {
    // This method will be implemented later when database is available
    console.log('findRouteByCoordinates called');
    return null;
  }

  /**
   * Find route between two navigation nodes (legacy method)
   */
  public async findRoute(
    startNodeId: string,
    endNodeId: string,
    options: PathfindingOptions = {}
  ): Promise<any | null> {
    // This method will be implemented later when database is available
    console.log('findRoute called with:', { startNodeId, endNodeId, options });
    return null;
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const dx = coord2.x - coord1.x;
    const dy = coord2.y - coord1.y;
    const floorDiff = Math.abs((coord2.floor || 0) - (coord1.floor || 0));
    
    // Euclidean distance plus floor penalty
    return Math.sqrt(dx * dx + dy * dy) + (floorDiff * 20);
  }

  /**
   * Find multiple routes for comparison
   */
  public async findMultipleRoutes(
    start: LocationPoint,
    end: LocationPoint,
    options: PathfindingOptions = {},
    maxRoutes: number = 3
  ): Promise<PathfindingResult[]> {
    // For now, return variations of the main route
    const results: PathfindingResult[] = [];
    
    for (let i = 0; i < maxRoutes; i++) {
      const result = await this.findPath(start, end, {
        ...options,
        algorithm: i === 0 ? 'astar' : 'dijkstra'
      });
      
      if (result.success) {
        // Add small variations to create different routes
        if (result.totalDistance) {
          result.totalDistance += i * 5; // Slight variation
          result.estimatedTime = Math.round(result.totalDistance! / 1.4);
        }
        results.push(result);
      }
    }
    
    return results;
  }
}

export default PathfindingService; 