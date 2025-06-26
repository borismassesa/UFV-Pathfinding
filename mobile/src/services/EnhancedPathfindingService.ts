// Enhanced Indoor Pathfinding using REAL UFV Building T Map Data
// Analyzes spatial patterns from actual shapefile coordinates

export interface Room {
  room_id: string;
  room_number: string;
  centroid_x: number;
  centroid_y: number;
  area_sqm: number;
  description: string;
  is_accessible: boolean;
}

export interface NavigationNode {
  id: string;
  x: number;
  y: number;
  type: 'room' | 'corridor' | 'intersection' | 'doorway';
  room?: Room;
  connections: string[];
  spatialCluster?: string; // From real map analysis
}

export interface PathSegment {
  from: NavigationNode;
  to: NavigationNode;
  distance: number;
  instruction: string;
  direction: string;
  estimatedTime: number; // Walking time in seconds
}

export class EnhancedPathfindingService {
  private nodes: Map<string, NavigationNode> = new Map();
  private rooms: Room[] = [];
  private spatialClusters: Map<string, Room[]> = new Map();
  private roomAdjacencies: Map<string, string[]> = new Map();

  constructor(roomData: Room[]) {
    this.rooms = roomData;
    this.analyzeRealSpatialPatterns();
    this.buildNavigationGraphFromRealMap();
  }

  /**
   * Analyze actual spatial patterns from the real indoor map data
   */
  private analyzeRealSpatialPatterns(): void {
    console.log('🗺️ Analyzing real UFV Building T spatial patterns...');
    
    // Analyze coordinate patterns from real map data
    this.identifyRoomClusters();
    this.calculateRoomAdjacencies();
    this.identifyCorridorPatterns();
    
    console.log(`✅ Found ${this.spatialClusters.size} spatial clusters from real map`);
  }

  /**
   * Identify room clusters based on real coordinate proximity
   */
  private identifyRoomClusters(): void {
    const CLUSTER_DISTANCE = 10; // 10 meter clustering from real coordinates
    const processed = new Set<string>();
    let clusterIndex = 0;

    this.rooms.forEach(room => {
      if (processed.has(room.room_id)) return;

      const cluster: Room[] = [room];
      processed.add(room.room_id);

      // Find all rooms within cluster distance using real coordinates
      this.rooms.forEach(otherRoom => {
        if (processed.has(otherRoom.room_id)) return;
        
        const distance = this.calculateRealDistance(room, otherRoom);
        if (distance <= CLUSTER_DISTANCE) {
          cluster.push(otherRoom);
          processed.add(otherRoom.room_id);
        }
      });

      if (cluster.length > 1) {
        const clusterName = `wing_${clusterIndex++}`;
        this.spatialClusters.set(clusterName, cluster);
        
        // Tag rooms with their spatial cluster
        cluster.forEach(r => {
          const node = this.nodes.get(r.room_id);
          if (node) node.spatialCluster = clusterName;
        });
      }
    });
  }

  /**
   * Calculate room adjacencies from real map coordinates
   */
  private calculateRoomAdjacencies(): void {
    const ADJACENCY_THRESHOLD = 15; // 15 meters for adjacency from real coordinates

    this.rooms.forEach(room => {
      const adjacent: string[] = [];
      
      this.rooms.forEach(otherRoom => {
        if (room.room_id === otherRoom.room_id) return;
        
        const distance = this.calculateRealDistance(room, otherRoom);
        if (distance <= ADJACENCY_THRESHOLD) {
          adjacent.push(otherRoom.room_id);
        }
      });

      this.roomAdjacencies.set(room.room_id, adjacent);
    });
  }

  /**
   * Identify corridor patterns from real room layouts
   */
  private identifyCorridorPatterns(): void {
    // Analyze room coordinate patterns to identify logical corridor paths
    const xCoords = this.rooms.map(r => r.centroid_x).sort((a, b) => a - b);
    const yCoords = this.rooms.map(r => r.centroid_y).sort((a, b) => a - b);
    
    // Find major axis alignments in real coordinates
    const xClusters = this.findCoordinateAlignments(xCoords, 5); // 5m tolerance
    const yClusters = this.findCoordinateAlignments(yCoords, 5);
    
    console.log(`🏗️ Real map analysis: ${xClusters.length} X-axis corridors, ${yClusters.length} Y-axis corridors`);
  }

  /**
   * Find coordinate alignments (corridors) in real map data
   */
  private findCoordinateAlignments(coords: number[], tolerance: number): number[][] {
    const clusters: number[][] = [];
    const used = new Set<number>();

    coords.forEach(coord => {
      if (used.has(coord)) return;
      
      const cluster = [coord];
      used.add(coord);
      
      coords.forEach(otherCoord => {
        if (used.has(otherCoord)) return;
        if (Math.abs(coord - otherCoord) <= tolerance) {
          cluster.push(otherCoord);
          used.add(otherCoord);
        }
      });
      
      if (cluster.length >= 3) { // At least 3 rooms aligned = corridor
        clusters.push(cluster);
      }
    });

    return clusters;
  }

  /**
   * Build navigation graph from real indoor map analysis
   */
  private buildNavigationGraphFromRealMap(): void {
    // Create room nodes from real map data
    this.rooms.forEach(room => {
      const roomNode: NavigationNode = {
        id: room.room_id,
        x: room.centroid_x,
        y: room.centroid_y,
        type: 'room',
        room: room,
        connections: []
      };
      this.nodes.set(room.room_id, roomNode);
    });

    // Create corridor network based on real spatial analysis
    this.createCorridorNetworkFromRealMap();
    
    // Connect rooms based on real adjacencies
    this.connectRoomsFromRealMap();
    
    console.log(`🏗️ Built navigation graph: ${this.nodes.size} nodes from real indoor map`);
  }

  /**
   * Create corridor network from real map spatial analysis
   */
  private createCorridorNetworkFromRealMap(): void {
    this.spatialClusters.forEach((cluster, clusterName) => {
      if (cluster.length < 2) return;

      // Calculate cluster bounds from real coordinates
      const minX = Math.min(...cluster.map(r => r.centroid_x));
      const maxX = Math.max(...cluster.map(r => r.centroid_x));
      const minY = Math.min(...cluster.map(r => r.centroid_y));
      const maxY = Math.max(...cluster.map(r => r.centroid_y));
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Create corridor hub for this cluster
      const corridorHub: NavigationNode = {
        id: `corridor_${clusterName}`,
        x: centerX,
        y: centerY,
        type: 'corridor',
        connections: [],
        spatialCluster: clusterName
      };

      this.nodes.set(corridorHub.id, corridorHub);

      // Create doorway nodes for larger rooms (based on real areas)
      cluster.forEach(room => {
        if (room.area_sqm > 20) { // Larger rooms likely have doorways
          const doorwayNode: NavigationNode = {
            id: `doorway_${room.room_id}`,
            x: room.centroid_x + (centerX - room.centroid_x) * 0.3, // 30% towards corridor
            y: room.centroid_y + (centerY - room.centroid_y) * 0.3,
            type: 'doorway',
            connections: [room.room_id, corridorHub.id]
          };

          this.nodes.set(doorwayNode.id, doorwayNode);
          
          // Connect room to doorway, doorway to corridor
          const roomNode = this.nodes.get(room.room_id)!;
          roomNode.connections.push(doorwayNode.id);
          corridorHub.connections.push(doorwayNode.id);
        } else {
          // Small rooms connect directly to corridor
          const roomNode = this.nodes.get(room.room_id)!;
          roomNode.connections.push(corridorHub.id);
          corridorHub.connections.push(room.room_id);
        }
      });
    });
  }

  /**
   * Connect rooms based on real map adjacencies
   */
  private connectRoomsFromRealMap(): void {
    this.roomAdjacencies.forEach((adjacentIds, roomId) => {
      const roomNode = this.nodes.get(roomId);
      if (!roomNode) return;

      adjacentIds.forEach(adjacentId => {
        const adjacentNode = this.nodes.get(adjacentId);
        if (!adjacentNode) return;

        // Connect rooms that are truly adjacent in real map
        if (!roomNode.connections.includes(adjacentId)) {
          roomNode.connections.push(adjacentId);
        }
        if (!adjacentNode.connections.includes(roomId)) {
          adjacentNode.connections.push(roomId);
        }
      });
    });
  }

  /**
   * Calculate real distance using actual coordinates from indoor map
   */
  private calculateRealDistance(room1: Room, room2: Room): number {
    const dx = room2.centroid_x - room1.centroid_x;
    const dy = room2.centroid_y - room1.centroid_y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Enhanced A* pathfinding using real indoor map data
   */
  public findOptimalPath(startRoomId: string, endRoomId: string): PathSegment[] {
    const startNode = this.nodes.get(startRoomId);
    const endNode = this.nodes.get(endRoomId);

    if (!startNode || !endNode) {
      throw new Error('Start or end room not found in real map data');
    }

    // A* algorithm with real coordinate heuristics
    const openSet = new Set<string>([startNode.id]);
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    // Initialize scores
    this.nodes.forEach((_, id) => {
      gScore.set(id, Infinity);
      fScore.set(id, Infinity);
    });

    gScore.set(startNode.id, 0);
    fScore.set(startNode.id, this.enhancedHeuristic(startNode, endNode));

    while (openSet.size > 0) {
      // Find node with lowest fScore
      let currentId = Array.from(openSet).reduce((best, nodeId) => 
        (fScore.get(nodeId) || Infinity) < (fScore.get(best) || Infinity) ? nodeId : best
      );

      if (currentId === endNode.id) {
        return this.reconstructEnhancedPath(cameFrom, currentId);
      }

      openSet.delete(currentId);
      const currentNode = this.nodes.get(currentId)!;

      // Check neighbors with real map penalties
      currentNode.connections.forEach(neighborId => {
        const neighbor = this.nodes.get(neighborId);
        if (!neighbor) return;

        const moveCost = this.calculateMoveCost(currentNode, neighbor);
        const tentativeGScore = (gScore.get(currentId) || Infinity) + moveCost;

        if (tentativeGScore < (gScore.get(neighborId) || Infinity)) {
          cameFrom.set(neighborId, currentId);
          gScore.set(neighborId, tentativeGScore);
          fScore.set(neighborId, tentativeGScore + this.enhancedHeuristic(neighbor, endNode));

          if (!openSet.has(neighborId)) {
            openSet.add(neighborId);
          }
        }
      });
    }

    throw new Error('No path found in real indoor map');
  }

  /**
   * Enhanced heuristic using real map characteristics
   */
  private enhancedHeuristic(node1: NavigationNode, node2: NavigationNode): number {
    const dx = node2.x - node1.x;
    const dy = node2.y - node1.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    // Bonus for same spatial cluster (real map analysis)
    if (node1.spatialCluster && node1.spatialCluster === node2.spatialCluster) {
      distance *= 0.8; // 20% bonus for same wing
    }

    return distance;
  }

  /**
   * Calculate movement cost based on real map characteristics
   */
  private calculateMoveCost(from: NavigationNode, to: NavigationNode): number {
    let distance = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);

    // Real map-based cost adjustments
    if (from.type === 'room' && to.type === 'corridor') {
      distance += 2; // Cost of exiting room
    }
    if (from.type === 'corridor' && to.type === 'room') {
      distance += 2; // Cost of entering room
    }
    if (from.type === 'doorway' || to.type === 'doorway') {
      distance += 1; // Door opening cost
    }

    // Accessibility penalty from real room data
    if (to.room && !to.room.is_accessible) {
      distance += 10; // Higher cost for non-accessible rooms
    }

    return distance;
  }

  /**
   * Reconstruct path with enhanced real map instructions
   */
  private reconstructEnhancedPath(cameFrom: Map<string, string>, endId: string): PathSegment[] {
    const path: string[] = [endId];
    let current = endId;

    while (cameFrom.has(current)) {
      current = cameFrom.get(current)!;
      path.unshift(current);
    }

    const segments: PathSegment[] = [];
    
    for (let i = 0; i < path.length - 1; i++) {
      const fromNode = this.nodes.get(path[i])!;
      const toNode = this.nodes.get(path[i + 1])!;
      
      const distance = Math.sqrt((toNode.x - fromNode.x) ** 2 + (toNode.y - fromNode.y) ** 2);
      
      const segment: PathSegment = {
        from: fromNode,
        to: toNode,
        distance: distance,
        instruction: this.generateEnhancedInstruction(fromNode, toNode),
        direction: this.calculateDirection(fromNode, toNode),
        estimatedTime: this.calculateWalkingTime(distance, fromNode, toNode)
      };
      
      segments.push(segment);
    }

    return segments;
  }

  /**
   * Generate enhanced instructions based on real map analysis
   */
  private generateEnhancedInstruction(from: NavigationNode, to: NavigationNode): string {
    // Use real room data for better instructions
    if (from.type === 'room' && to.type === 'doorway') {
      return `Exit ${from.room?.room_number} (${from.room?.description}) and approach the doorway`;
    }
    
    if (from.type === 'doorway' && to.type === 'corridor') {
      const cluster = from.spatialCluster || 'main';
      return `Enter the ${cluster} corridor system`;
    }
    
    if (from.type === 'corridor' && to.type === 'room') {
      const area = to.room?.area_sqm || 0;
      const sizeDesc = area > 50 ? 'large' : area > 20 ? 'medium' : 'small';
      return `Enter ${to.room?.room_number} - ${sizeDesc} ${to.room?.description}`;
    }
    
    if (from.spatialCluster && to.spatialCluster && from.spatialCluster !== to.spatialCluster) {
      return `Navigate from ${from.spatialCluster} to ${to.spatialCluster} wing`;
    }

    return `Navigate from ${from.type} to ${to.type}`;
  }

  /**
   * Calculate direction between nodes
   */
  private calculateDirection(from: NavigationNode, to: NavigationNode): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    if (angle >= -45 && angle < 45) return 'east';
    if (angle >= 45 && angle < 135) return 'north';
    if (angle >= 135 || angle < -135) return 'west';
    return 'south';
  }

  /**
   * Calculate walking time based on real distances and obstacles
   */
  private calculateWalkingTime(distance: number, from: NavigationNode, to: NavigationNode): number {
    const WALKING_SPEED = 1.4; // meters per second (normal walking)
    let baseTime = distance / WALKING_SPEED;

    // Add time for door opening, room navigation, etc.
    if (from.type === 'room' || to.type === 'room') {
      baseTime += 3; // 3 seconds for room entry/exit
    }
    if (from.type === 'doorway' || to.type === 'doorway') {
      baseTime += 2; // 2 seconds for door
    }

    return Math.round(baseTime);
  }

  /**
   * Get spatial analysis results
   */
  public getSpatialAnalysis(): object {
    return {
      totalRooms: this.rooms.length,
      spatialClusters: Array.from(this.spatialClusters.keys()),
      clusterSizes: Array.from(this.spatialClusters.values()).map(cluster => cluster.length),
      totalNodes: this.nodes.size,
      roomAdjacencies: this.roomAdjacencies.size
    };
  }
} 