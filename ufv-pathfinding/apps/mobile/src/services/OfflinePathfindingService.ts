import type { 
  Route, 
  Room, 
  NavigationInstruction, 
  UserLocation 
} from '../types';
import OfflineStorageService from './OfflineStorageService';

interface PathNode {
  id: string;
  coordinates: { lat: number; lng: number };
  room?: Room;
  gCost: number; // Distance from start
  hCost: number; // Heuristic distance to end
  fCost: number; // gCost + hCost
  parent?: PathNode;
  walkable: boolean;
}

interface OfflineRouteOptions {
  avoidStairs?: boolean;
  preferElevator?: boolean;
  accessibleOnly?: boolean;
  maxWalkingDistance?: number;
}

class OfflinePathfindingService {
  private nodeCache: Map<string, PathNode> = new Map();
  private adjacencyList: Map<string, string[]> = new Map();

  // Calculate route using cached map data
  async calculateOfflineRoute(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    buildingId: string,
    options: OfflineRouteOptions = {}
  ): Promise<Route | null> {
    try {
      console.log('Calculating offline route...');
      
      // Get cached map data
      const mapData = await OfflineStorageService.getCachedMapData(buildingId);
      if (!mapData) {
        throw new Error('No offline map data available');
      }

      // Build pathfinding graph from cached rooms
      await this.buildPathfindingGraph(mapData.rooms);

      // Find nearest start and end nodes
      const startNode = this.findNearestNode(start);
      const endNode = this.findNearestNode(end);

      if (!startNode || !endNode) {
        throw new Error('Could not find valid start or end points');
      }

      // Use A* algorithm to find path
      const path = this.findPath(startNode, endNode, options);
      
      if (!path || path.length === 0) {
        return null;
      }

      // Convert path to route with instructions
      const route = await this.pathToRoute(path, start, end, buildingId);
      
      console.log(`Offline route calculated: ${route.totalDistance.toFixed(1)}m`);
      return route;

    } catch (error) {
      console.error('Offline pathfinding failed:', error);
      return null;
    }
  }

  private async buildPathfindingGraph(rooms: Room[]): Promise<void> {
    this.nodeCache.clear();
    this.adjacencyList.clear();

    // Create nodes for each room
    for (const room of rooms) {
      const node: PathNode = {
        id: room.id,
        coordinates: room.coordinates,
        room,
        gCost: 0,
        hCost: 0,
        fCost: 0,
        walkable: true, // All rooms are walkable by default
      };

      this.nodeCache.set(room.id, node);
    }

    // Build adjacency list by connecting nearby rooms
    for (const room of rooms) {
      const connections = this.findNearbyRooms(room, rooms);
      this.adjacencyList.set(room.id, connections.map(r => r.id));
    }
  }

  private findNearbyRooms(room: Room, allRooms: Room[], maxDistance: number = 50): Room[] {
    const nearby: Room[] = [];

    for (const other of allRooms) {
      if (other.id === room.id) continue;

      const distance = this.calculateDistance(room.coordinates, other.coordinates);
      
      // Connect rooms on the same floor that are within reasonable distance
      if (room.floor === other.floor && distance <= maxDistance) {
        nearby.push(other);
      }
      
      // Connect rooms on adjacent floors (stairs/elevators) if very close
      if (Math.abs(room.floor - other.floor) === 1 && distance <= 10) {
        nearby.push(other);
      }
    }

    return nearby;
  }

  private findNearestNode(coordinates: { lat: number; lng: number }): PathNode | null {
    let nearest: PathNode | null = null;
    let minDistance = Infinity;

    for (const node of this.nodeCache.values()) {
      const distance = this.calculateDistance(coordinates, node.coordinates);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = node;
      }
    }

    return nearest;
  }

  private findPath(
    startNode: PathNode, 
    endNode: PathNode, 
    options: OfflineRouteOptions
  ): PathNode[] | null {
    const openSet: PathNode[] = [startNode];
    const closedSet: Set<string> = new Set();

    startNode.gCost = 0;
    startNode.hCost = this.calculateDistance(startNode.coordinates, endNode.coordinates);
    startNode.fCost = startNode.gCost + startNode.hCost;

    while (openSet.length > 0) {
      // Find node with lowest fCost
      openSet.sort((a, b) => a.fCost - b.fCost);
      const currentNode = openSet.shift()!;

      if (currentNode.id === endNode.id) {
        // Path found, reconstruct it
        return this.reconstructPath(currentNode);
      }

      closedSet.add(currentNode.id);

      // Check neighbors
      const neighbors = this.adjacencyList.get(currentNode.id) || [];
      
      for (const neighborId of neighbors) {
        if (closedSet.has(neighborId)) continue;

        const neighbor = this.nodeCache.get(neighborId);
        if (!neighbor || !neighbor.walkable) continue;

        // Apply route options
        if (options.accessibleOnly && !this.isAccessible(neighbor)) continue;
        if (options.avoidStairs && this.isStairs(currentNode, neighbor)) continue;

        const tentativeGCost = currentNode.gCost + this.calculateDistance(
          currentNode.coordinates, 
          neighbor.coordinates
        );

        const existingOpenNode = openSet.find(n => n.id === neighborId);
        
        if (!existingOpenNode) {
          neighbor.gCost = tentativeGCost;
          neighbor.hCost = this.calculateDistance(neighbor.coordinates, endNode.coordinates);
          neighbor.fCost = neighbor.gCost + neighbor.hCost;
          neighbor.parent = currentNode;
          openSet.push(neighbor);
        } else if (tentativeGCost < existingOpenNode.gCost) {
          existingOpenNode.gCost = tentativeGCost;
          existingOpenNode.fCost = existingOpenNode.gCost + existingOpenNode.hCost;
          existingOpenNode.parent = currentNode;
        }
      }
    }

    return null; // No path found
  }

  private reconstructPath(endNode: PathNode): PathNode[] {
    const path: PathNode[] = [];
    let current: PathNode | undefined = endNode;

    while (current) {
      path.unshift(current);
      current = current.parent;
    }

    return path;
  }

  private async pathToRoute(
    path: PathNode[], 
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    buildingId: string
  ): Promise<Route> {
    const instructions: NavigationInstruction[] = [];
    let totalDistance = 0;

    // Add start instruction
    if (path.length > 0) {
      const firstNode = path[0];
      instructions.push({
        id: `start-${firstNode.id}`,
        instruction: `Start navigation from ${firstNode.room?.name || 'starting point'}`,
        node: {
          id: firstNode.id,
          coordinates: firstNode.coordinates,
          type: 'room',
        },
        distance: 0,
        direction: 'start',
        estimatedTime: 0,
        floor: firstNode.room?.floor,
        landmark: firstNode.room?.name,
      });
    }

    // Generate turn-by-turn instructions
    for (let i = 1; i < path.length; i++) {
      const currentNode = path[i - 1];
      const nextNode = path[i];
      const distance = this.calculateDistance(currentNode.coordinates, nextNode.coordinates);
      
      totalDistance += distance;

      const direction = this.calculateDirection(currentNode, nextNode, path[i + 1]);
      const instruction = this.generateInstruction(currentNode, nextNode, direction);

      instructions.push({
        id: `step-${i}`,
        instruction,
        node: {
          id: nextNode.id,
          coordinates: nextNode.coordinates,
          type: 'room',
        },
        distance,
        direction,
        estimatedTime: Math.round(distance / 1.4), // 1.4 m/s walking speed
        floor: nextNode.room?.floor,
        landmark: nextNode.room?.name,
      });
    }

    // Add final instruction
    const lastNode = path[path.length - 1];
    instructions.push({
      id: 'destination',
      instruction: `You have arrived at ${lastNode.room?.name || 'your destination'}`,
      node: {
        id: lastNode.id,
        coordinates: lastNode.coordinates,
        type: 'room',
      },
      distance: 0,
      direction: 'arrive',
      estimatedTime: 0,
      floor: lastNode.room?.floor,
      landmark: lastNode.room?.name,
    });

    const route: Route = {
      id: `offline-${Date.now()}`,
      start,
      end,
      path: path.map(node => ({
        id: node.id,
        coordinates: node.coordinates,
        type: 'room',
      })),
      instructions,
      totalDistance,
      estimatedTime: Math.round(totalDistance / 1.4),
      buildingId,
      floors: [...new Set(path.map(node => node.room?.floor).filter(f => f !== undefined))],
      accessibility: {
        wheelchairAccessible: this.isRouteAccessible(path),
        hasElevator: this.hasElevator(path),
        hasStairs: this.hasStairs(path),
      },
      createdAt: new Date(),
    };

    // Cache the calculated route
    await OfflineStorageService.cacheRoute(route);

    return route;
  }

  private calculateDistance(
    coord1: { lat: number; lng: number }, 
    coord2: { lat: number; lng: number }
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateDirection(
    current: PathNode, 
    next: PathNode, 
    afterNext?: PathNode
  ): string {
    if (!afterNext) return 'straight';

    const angle1 = Math.atan2(
      next.coordinates.lng - current.coordinates.lng,
      next.coordinates.lat - current.coordinates.lat
    );
    
    const angle2 = Math.atan2(
      afterNext.coordinates.lng - next.coordinates.lng,
      afterNext.coordinates.lat - next.coordinates.lat
    );

    const angleDiff = angle2 - angle1;
    const normalizedAngle = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI;

    if (normalizedAngle > Math.PI / 4) return 'left';
    if (normalizedAngle < -Math.PI / 4) return 'right';
    if (current.room?.floor !== next.room?.floor) {
      return current.room?.floor < next.room?.floor ? 'up' : 'down';
    }
    return 'straight';
  }

  private generateInstruction(current: PathNode, next: PathNode, direction: string): string {
    const currentRoom = current.room?.name || 'current location';
    const nextRoom = next.room?.name || 'next location';

    if (current.room?.floor !== next.room?.floor) {
      if (direction === 'up') {
        return `Take stairs or elevator up to floor ${next.room?.floor}`;
      } else {
        return `Take stairs or elevator down to floor ${next.room?.floor}`;
      }
    }

    switch (direction) {
      case 'left':
        return `Turn left toward ${nextRoom}`;
      case 'right':
        return `Turn right toward ${nextRoom}`;
      case 'straight':
        return `Continue straight to ${nextRoom}`;
      default:
        return `Head toward ${nextRoom}`;
    }
  }

  private isAccessible(node: PathNode): boolean {
    // Check if room/path is wheelchair accessible
    return node.room?.accessibility?.wheelchairAccessible !== false;
  }

  private isStairs(current: PathNode, next: PathNode): boolean {
    // Detect if this is a stair connection (different floors, close proximity)
    return (
      current.room?.floor !== next.room?.floor &&
      this.calculateDistance(current.coordinates, next.coordinates) < 15
    );
  }

  private isRouteAccessible(path: PathNode[]): boolean {
    return path.every(node => this.isAccessible(node));
  }

  private hasElevator(path: PathNode[]): boolean {
    // Simple heuristic: if route changes floors but avoids close proximity connections
    for (let i = 1; i < path.length; i++) {
      const current = path[i - 1];
      const next = path[i];
      
      if (current.room?.floor !== next.room?.floor) {
        const distance = this.calculateDistance(current.coordinates, next.coordinates);
        if (distance > 20) { // Likely elevator connection
          return true;
        }
      }
    }
    return false;
  }

  private hasStairs(path: PathNode[]): boolean {
    for (let i = 1; i < path.length; i++) {
      if (this.isStairs(path[i - 1], path[i])) {
        return true;
      }
    }
    return false;
  }

  // Check if offline routing is available for a building
  async isOfflineRoutingAvailable(buildingId: string): Promise<boolean> {
    try {
      const mapData = await OfflineStorageService.getCachedMapData(buildingId);
      return mapData !== null && mapData.rooms.length > 0;
    } catch (error) {
      return false;
    }
  }

  // Get cached route if available
  async getCachedRoute(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number }
  ): Promise<Route | null> {
    try {
      const startLocation = `${start.lat.toFixed(6)},${start.lng.toFixed(6)}`;
      const endLocation = `${end.lat.toFixed(6)},${end.lng.toFixed(6)}`;
      
      return await OfflineStorageService.getCachedRoute(startLocation, endLocation);
    } catch (error) {
      console.error('Failed to get cached route:', error);
      return null;
    }
  }
}

export default new OfflinePathfindingService();