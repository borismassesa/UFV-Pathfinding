import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NavigationNode } from '../../../entities/navigation-node.entity';
import { NavigationEdge } from '../../../entities/navigation-edge.entity';
import type { Route, NavigationInstruction, Coordinates, UserPreferences, Direction } from '@ufv-pathfinding/shared';
import { transformNavigationNode, transformNavigationEdge } from '../utils/entity-transformers';

interface PathNode {
  node: NavigationNode;
  gScore: number; // Cost from start
  fScore: number; // gScore + heuristic
  parent?: PathNode;
}

@Injectable()
export class PathfindingService {
  constructor(
    @InjectRepository(NavigationNode)
    private readonly nodeRepository: Repository<NavigationNode>,
    @InjectRepository(NavigationEdge)
    private readonly edgeRepository: Repository<NavigationEdge>,
  ) {}

  async findRoute(
    from: Coordinates,
    to: Coordinates,
    preferences?: UserPreferences,
  ): Promise<Route> {
    // Find nearest nodes to start and end points
    const startNode = await this.findNearestNode(from);
    const endNode = await this.findNearestNode(to);

    if (!startNode || !endNode) {
      throw new Error('Could not find navigation nodes near the specified coordinates');
    }

    // Run A* pathfinding
    const path = await this.findPath(startNode, endNode, preferences);

    if (!path.length) {
      throw new Error('No route found between the specified points');
    }

    // Get edges for the path
    const edges = await this.getEdgesForPath(path);

    // Calculate route metrics
    const totalDistance = edges.reduce((sum, edge) => sum + edge.distance, 0);
    const estimatedTime = this.calculateEstimatedTime(totalDistance, preferences);

    // Generate turn-by-turn instructions
    const instructions = this.generateInstructions(path, edges);

    return {
      id: this.generateRouteId(),
      from: transformNavigationNode(startNode),
      to: transformNavigationNode(endNode),
      path: path.map(transformNavigationNode),
      edges: edges.map(transformNavigationEdge),
      totalDistance,
      estimatedTime,
      accessible: this.isRouteAccessible(edges, preferences),
      instructions,
    };
  }

  private async findNearestNode(coordinates: Coordinates): Promise<NavigationNode | null> {
    const nodes = await this.nodeRepository
      .createQueryBuilder('node')
      .where('node.active = true')
      .orderBy(
        'ST_Distance(node.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))',
        'ASC'
      )
      .setParameters({ lng: coordinates.lng, lat: coordinates.lat })
      .limit(1)
      .getOne();

    return nodes;
  }

  private async findPath(
    startNode: NavigationNode,
    endNode: NavigationNode,
    preferences?: UserPreferences,
  ): Promise<NavigationNode[]> {
    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();
    const nodeMap = new Map<string, PathNode>();

    // Initialize start node
    const startPathNode: PathNode = {
      node: startNode,
      gScore: 0,
      fScore: this.heuristic(startNode, endNode),
    };

    openSet.push(startPathNode);
    nodeMap.set(startNode.id, startPathNode);

    while (openSet.length > 0) {
      // Get node with lowest fScore
      openSet.sort((a, b) => a.fScore - b.fScore);
      const current = openSet.shift()!;

      if (current.node.id === endNode.id) {
        // Reconstruct path
        return this.reconstructPath(current);
      }

      closedSet.add(current.node.id);

      // Get neighbors
      const neighbors = await this.getNeighbors(current.node.id, preferences);

      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor.node.id)) {
          continue;
        }

        const tentativeGScore = current.gScore + neighbor.distance;

        let neighborPathNode = nodeMap.get(neighbor.node.id);
        if (!neighborPathNode) {
          neighborPathNode = {
            node: neighbor.node,
            gScore: Infinity,
            fScore: Infinity,
          };
          nodeMap.set(neighbor.node.id, neighborPathNode);
        }

        if (tentativeGScore < neighborPathNode.gScore) {
          neighborPathNode.parent = current;
          neighborPathNode.gScore = tentativeGScore;
          neighborPathNode.fScore = tentativeGScore + this.heuristic(neighbor.node, endNode);

          if (!openSet.includes(neighborPathNode)) {
            openSet.push(neighborPathNode);
          }
        }
      }
    }

    return []; // No path found
  }

  private async getNeighbors(
    nodeId: string,
    preferences?: UserPreferences,
  ): Promise<Array<{ node: NavigationNode; distance: number }>> {
    const queryBuilder = this.edgeRepository
      .createQueryBuilder('edge')
      .leftJoinAndSelect('edge.toNode', 'node')
      .leftJoinAndSelect('node.building', 'building')
      .where('edge.fromNodeId = :nodeId', { nodeId })
      .andWhere('edge.active = true')
      .andWhere('node.active = true');

    // Apply preferences
    if (preferences?.accessibleOnly) {
      queryBuilder.andWhere('edge.accessible = true');
    }

    if (preferences?.avoidStairs) {
      queryBuilder.andWhere("edge.type != 'stairs'");
    }

    if (preferences?.preferElevator) {
      queryBuilder.orderBy("CASE WHEN edge.type = 'elevator' THEN 0 ELSE 1 END", 'ASC');
    }

    const edges = await queryBuilder.getMany();

    return edges.map(edge => ({
      node: edge.toNode,
      distance: edge.distance,
    }));
  }

  private heuristic(nodeA: NavigationNode, nodeB: NavigationNode): number {
    // Simple Euclidean distance heuristic
    // In a real implementation, you might want to use more sophisticated heuristics
    // that consider floor differences, building layouts, etc.
    
    // For now, we'll use a simple distance calculation
    // This would be enhanced with actual coordinate calculations
    return Math.abs(nodeA.floor - nodeB.floor) * 50 + 100; // Rough estimate
  }

  private reconstructPath(endNode: PathNode): NavigationNode[] {
    const path: NavigationNode[] = [];
    let current: PathNode | undefined = endNode;

    while (current) {
      path.unshift(current.node);
      current = current.parent;
    }

    return path;
  }

  private async getEdgesForPath(path: NavigationNode[]): Promise<NavigationEdge[]> {
    const edges: NavigationEdge[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const edge = await this.edgeRepository.findOne({
        where: {
          fromNodeId: path[i].id,
          toNodeId: path[i + 1].id,
        },
      });

      if (edge) {
        edges.push(edge);
      }
    }

    return edges;
  }

  private calculateEstimatedTime(distance: number, preferences?: UserPreferences): number {
    // Walking speeds in meters per second
    const speeds = {
      slow: 1.0,    // 3.6 km/h
      normal: 1.4,  // 5.0 km/h
      fast: 1.8,    // 6.5 km/h
    };

    const speed = speeds[preferences?.preferredWalkingSpeed || 'normal'];
    return Math.round(distance / speed); // Return time in seconds
  }

  private isRouteAccessible(edges: NavigationEdge[], preferences?: UserPreferences): boolean {
    if (!preferences?.accessibleOnly) {
      return true; // Route doesn't need to be accessible
    }

    return edges.every(edge => edge.accessible);
  }

  private generateInstructions(
    path: NavigationNode[],
    edges: NavigationEdge[],
  ): NavigationInstruction[] {
    const instructions: NavigationInstruction[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const fromNode = path[i];
      const toNode = path[i + 1];
      const edge = edges[i];

      if (!edge) continue;

      const instruction: NavigationInstruction = {
        step: i + 1,
        instruction: this.generateInstructionText(fromNode, toNode, edge),
        distance: edge.distance,
        direction: this.calculateDirection(fromNode, toNode),
        node: transformNavigationNode(toNode),
      };

      // Add floor information if changing floors
      if (fromNode.floor !== toNode.floor) {
        instruction.floor = toNode.floor;
      }

      // Add landmark information if available
      if (toNode.name) {
        instruction.landmark = toNode.name;
      }

      instructions.push(instruction);
    }

    return instructions;
  }

  private generateInstructionText(
    fromNode: NavigationNode,
    toNode: NavigationNode,
    edge: NavigationEdge,
  ): string {
    if (edge.type === 'stairs') {
      if (toNode.floor > fromNode.floor) {
        return `Take stairs up to floor ${toNode.floor}`;
      } else {
        return `Take stairs down to floor ${toNode.floor}`;
      }
    }

    if (edge.type === 'elevator') {
      if (toNode.floor !== fromNode.floor) {
        return `Take elevator to floor ${toNode.floor}`;
      } else {
        return 'Continue through elevator area';
      }
    }

    if (toNode.type === 'room_entrance') {
      return `Arrive at ${toNode.name || 'destination'}`;
    }

    if (toNode.type === 'intersection') {
      return `Continue straight to ${toNode.name || 'intersection'}`;
    }

    return `Continue ${Math.round(edge.distance)}m along corridor`;
  }

  private calculateDirection(fromNode: NavigationNode, toNode: NavigationNode): Direction {
    // This is a simplified direction calculation
    // In a real implementation, you would use the actual coordinates
    // to calculate precise directions
    
    if (toNode.floor > fromNode.floor) {
      return 'up' as Direction;
    } else if (toNode.floor < fromNode.floor) {
      return 'down' as Direction;
    }

    // For same floor, we'd calculate based on coordinates
    // For now, return a default direction
    return 'straight' as Direction;
  }

  private generateRouteId(): string {
    return `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}