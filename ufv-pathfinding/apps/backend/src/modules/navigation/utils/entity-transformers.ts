import type { 
  NavigationNode as SharedNavigationNode,
  NavigationEdge as SharedNavigationEdge,
  Coordinates,
  UserPreferences,
  WalkingSpeed
} from '@ufv-pathfinding/shared';
import { NavigationNode } from '../../../entities/navigation-node.entity';
import { NavigationEdge } from '../../../entities/navigation-edge.entity';
import { UserPreferencesDto } from '../dto/navigation.dto';

export function transformNavigationNode(dbNode: NavigationNode): SharedNavigationNode {
  return {
    id: dbNode.id,
    coordinates: parsePointGeometry(dbNode.location),
    floor: dbNode.floor,
    type: dbNode.type as any,
    connectedNodes: [], // Would be populated separately if needed
  };
}

export function transformNavigationEdge(dbEdge: NavigationEdge): SharedNavigationEdge {
  return {
    id: dbEdge.id,
    from: dbEdge.fromNodeId,
    to: dbEdge.toNodeId,
    distance: dbEdge.distance,
    time: dbEdge.estimatedTime,
    accessible: dbEdge.accessible,
    type: dbEdge.type as any,
  };
}

export function transformUserPreferences(dto?: UserPreferencesDto): UserPreferences | undefined {
  if (!dto) return undefined;

  return {
    avoidStairs: dto.avoidStairs ?? false,
    preferElevator: dto.preferElevator ?? false,
    accessibleOnly: dto.accessibleOnly ?? false,
    avoidCrowdedAreas: dto.avoidCrowdedAreas ?? false,
    preferredWalkingSpeed: (dto.preferredWalkingSpeed ?? 'normal') as WalkingSpeed,
  };
}

export function parsePointGeometry(geometryString: string): Coordinates {
  try {
    const match = geometryString.match(/POINT\(([^)]+)\)/);
    if (match) {
      const [lng, lat] = match[1].split(' ').map(Number);
      return { lat, lng };
    }
  } catch (error) {
    console.error('Error parsing point geometry:', error);
  }
  
  return { lat: 0, lng: 0 };
}

export function transformDbUserPreferences(dbPreferences: any): UserPreferences {
  return {
    avoidStairs: dbPreferences?.avoidStairs ?? false,
    preferElevator: dbPreferences?.preferElevator ?? false,
    accessibleOnly: dbPreferences?.accessibleOnly ?? false,
    avoidCrowdedAreas: dbPreferences?.avoidCrowdedAreas ?? false,
    preferredWalkingSpeed: (dbPreferences?.preferredWalkingSpeed ?? 'normal') as WalkingSpeed,
  };
}