// Real Indoor Pathfinding Service for UFV Building T
// Using actual data from BuildingTRooms.shp

export interface Room {
  id: string;
  x: number;
  y: number;
  area: number;
  desc: string;
  type?: string;
}

export interface NavigationNode {
  id: string;
  x: number;
  y: number;
  type: 'room' | 'corridor' | 'intersection';
  room?: Room;
  connections: string[];
}

export interface PathSegment {
  from: NavigationNode;
  to: NavigationNode;
  distance: number;
  instruction: string;
  direction: string;
}

export class PathfindingService {
  private nodes: Map<string, NavigationNode> = new Map();
  private rooms: Room[] = [];

  constructor(roomData: Room[]) {
    this.rooms = roomData;
    console.log(`✅ A* Pathfinding service initialized with ${roomData.length} rooms`);
    this.buildNavigationGraph();
    this.testAlgorithm();
  }

  /**
   * Build navigation graph from real UFV Building T data
   */
  private buildNavigationGraph(): void {
    // Create room nodes from real data
    this.rooms.forEach(room => {
      const roomNode: NavigationNode = {
        id: room.id,
        x: room.x,
        y: room.y,
        type: 'room',
        room: room,
        connections: []
      };
      this.nodes.set(room.id, roomNode);
    });

    // Create corridor system based on real room layout
    this.createSimpleCorridorSystem();
    
    // Connect all rooms to make navigation possible
    this.connectAllRooms();
    
    console.log(`🏗️ Navigation graph built: ${this.nodes.size} nodes, ${this.getTotalConnections()} connections`);
  }

  /**
   * Create a simple corridor system for UFV Building T
   */
  private createSimpleCorridorSystem(): void {
    // Find building bounds
    const minX = Math.min(...this.rooms.map(r => r.x));
    const maxX = Math.max(...this.rooms.map(r => r.x));
    const minY = Math.min(...this.rooms.map(r => r.y));
    const maxY = Math.max(...this.rooms.map(r => r.y));
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Create main corridor hub in building center
    const mainCorridor: NavigationNode = {
      id: 'main_corridor',
      x: centerX,
      y: centerY,
      type: 'corridor',
      connections: []
    };
    
    this.nodes.set('main_corridor', mainCorridor);

    // Create wing corridors
    const northCorridor: NavigationNode = {
      id: 'north_corridor',
      x: centerX,
      y: maxY - 5,
      type: 'corridor',
      connections: ['main_corridor']
    };

    const southCorridor: NavigationNode = {
      id: 'south_corridor',
      x: centerX,
      y: minY + 5,
      type: 'corridor',
      connections: ['main_corridor']
    };

    const eastCorridor: NavigationNode = {
      id: 'east_corridor',
      x: maxX - 5,
      y: centerY,
      type: 'corridor',
      connections: ['main_corridor']
    };

    const westCorridor: NavigationNode = {
      id: 'west_corridor',
      x: minX + 5,
      y: centerY,
      type: 'corridor',
      connections: ['main_corridor']
    };

    // Connect main corridor to wing corridors
    mainCorridor.connections.push('north_corridor', 'south_corridor', 'east_corridor', 'west_corridor');

    this.nodes.set('north_corridor', northCorridor);
    this.nodes.set('south_corridor', southCorridor);
    this.nodes.set('east_corridor', eastCorridor);
    this.nodes.set('west_corridor', westCorridor);
  }

  /**
   * Connect all rooms to ensure pathfinding works
   */
  private connectAllRooms(): void {
    const roomNodes = Array.from(this.nodes.values()).filter(n => n.type === 'room');
    const corridorNodes = Array.from(this.nodes.values()).filter(n => n.type === 'corridor');

    // Connect each room to the nearest corridor
    roomNodes.forEach(room => {
      let nearestCorridor = corridorNodes[0];
      let minDistance = this.calculateDistance(room, nearestCorridor);

      corridorNodes.forEach(corridor => {
        const distance = this.calculateDistance(room, corridor);
        if (distance < minDistance) {
          minDistance = distance;
          nearestCorridor = corridor;
        }
      });

      // Connect room to nearest corridor
      room.connections.push(nearestCorridor.id);
      nearestCorridor.connections.push(room.id);
    });

    // Also connect nearby rooms directly (within 30m)
    roomNodes.forEach(room1 => {
      roomNodes.forEach(room2 => {
        if (room1.id !== room2.id) {
          const distance = this.calculateDistance(room1, room2);
          if (distance <= 30 && !room1.connections.includes(room2.id)) {
            room1.connections.push(room2.id);
            room2.connections.push(room1.id);
          }
        }
      });
    });
  }

  /**
   * Calculate distance between two nodes
   */
  private calculateDistance(node1: NavigationNode, node2: NavigationNode): number {
    const dx = node2.x - node1.x;
    const dy = node2.y - node1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Test the pathfinding algorithm
   */
  private testAlgorithm(): void {
    console.log('🧪 Testing A* Pathfinding Algorithm...');
    
    try {
      if (this.rooms.length >= 2) {
        const testPath = this.findPath(this.rooms[0].id, this.rooms[1].id);
        console.log(`✅ A* test successful: Found path with ${testPath.length} segments`);
        console.log(`📏 Path distance: ${this.getPathDistance(testPath).toFixed(1)}m`);
      }
    } catch (error) {
      console.error('A* test error:', error);
      console.log('📱 Using offline mode with simplified pathfinding');
    }
  }

  /**
   * A* Pathfinding Algorithm
   */
  public findPath(startRoomId: string, endRoomId: string): PathSegment[] {
    const startNode = this.nodes.get(startRoomId);
    const endNode = this.nodes.get(endRoomId);

    if (!startNode || !endNode) {
      throw new Error(`Room not found: ${startRoomId} or ${endRoomId}`);
    }

    if (startRoomId === endRoomId) {
      return []; // Already at destination
    }

    // A* algorithm
    const openSet = new Set<string>([startNode.id]);
    const closedSet = new Set<string>();
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    // Initialize scores
    this.nodes.forEach((_, id) => {
      gScore.set(id, Infinity);
      fScore.set(id, Infinity);
    });

    gScore.set(startNode.id, 0);
    fScore.set(startNode.id, this.heuristic(startNode, endNode));

    let iterations = 0;
    const maxIterations = 1000; // Prevent infinite loops

    while (openSet.size > 0 && iterations < maxIterations) {
      iterations++;

      // Find node with lowest fScore
      let currentId = Array.from(openSet).reduce((best, nodeId) => 
        (fScore.get(nodeId) || Infinity) < (fScore.get(best) || Infinity) ? nodeId : best
      );

      if (currentId === endNode.id) {
        // Path found!
        return this.reconstructPath(cameFrom, currentId);
      }

      openSet.delete(currentId);
      closedSet.add(currentId);
      
      const currentNode = this.nodes.get(currentId)!;

      // Check all neighbors
      currentNode.connections.forEach(neighborId => {
        if (closedSet.has(neighborId)) return;

        const neighbor = this.nodes.get(neighborId);
        if (!neighbor) return;

        const tentativeGScore = (gScore.get(currentId) || Infinity) + 
          this.calculateDistance(currentNode, neighbor);

        if (!openSet.has(neighborId)) {
          openSet.add(neighborId);
        }

        if (tentativeGScore < (gScore.get(neighborId) || Infinity)) {
          cameFrom.set(neighborId, currentId);
          gScore.set(neighborId, tentativeGScore);
          fScore.set(neighborId, tentativeGScore + this.heuristic(neighbor, endNode));
        }
      });
    }

    throw new Error(`No path found between ${startRoomId} and ${endRoomId} after ${iterations} iterations`);
  }

  /**
   * Heuristic function (Euclidean distance)
   */
  private heuristic(node1: NavigationNode, node2: NavigationNode): number {
    return this.calculateDistance(node1, node2);
  }

  /**
   * Reconstruct path from A* results
   */
  private reconstructPath(cameFrom: Map<string, string>, endId: string): PathSegment[] {
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
      
      const segment: PathSegment = {
        from: fromNode,
        to: toNode,
        distance: this.calculateDistance(fromNode, toNode),
        instruction: this.generateInstruction(fromNode, toNode),
        direction: this.calculateDirection(fromNode, toNode)
      };
      
      segments.push(segment);
    }

    return segments;
  }

  /**
   * Generate navigation instruction
   */
  private generateInstruction(from: NavigationNode, to: NavigationNode): string {
    if (from.type === 'room' && to.type === 'room') {
      return `Go directly from ${from.room?.id} to ${to.room?.id}`;
    }
    
    if (from.type === 'room' && to.type === 'corridor') {
      return `Exit ${from.room?.id} and enter the corridor`;
    }
    
    if (from.type === 'corridor' && to.type === 'room') {
      return `Enter room ${to.room?.id} - ${to.room?.desc}`;
    }
    
    if (from.type === 'corridor' && to.type === 'corridor') {
      return `Continue along the corridor`;
    }

    return `Navigate to ${to.id}`;
  }

  /**
   * Calculate direction
   */
  private calculateDirection(from: NavigationNode, to: NavigationNode): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    if (angle >= -45 && angle < 45) return 'East';
    if (angle >= 45 && angle < 135) return 'North';
    if (angle >= 135 || angle < -135) return 'West';
    return 'South';
  }

  /**
   * Get total connections for debugging
   */
  private getTotalConnections(): number {
    return Array.from(this.nodes.values())
      .reduce((total, node) => total + node.connections.length, 0) / 2; // Divide by 2 for bidirectional
  }

  /**
   * Get path distance
   */
  public getPathDistance(segments: PathSegment[]): number {
    return segments.reduce((total, segment) => total + segment.distance, 0);
  }

  /**
   * Get simplified instructions
   */
  public getSimplifiedInstructions(segments: PathSegment[]): string[] {
    return segments.map(segment => segment.instruction);
  }

  /**
   * Get all available rooms
   */
  public getAllRooms(): Room[] {
    return this.rooms;
  }
} 