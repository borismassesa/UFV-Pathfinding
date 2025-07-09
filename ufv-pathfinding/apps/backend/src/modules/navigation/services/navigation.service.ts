import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../../entities/user.entity';
import { NavigationNode as DbNavigationNode } from '../../../entities/navigation-node.entity';
import { PathfindingService } from './pathfinding.service';
import { RoomService } from './room.service';
import { BuildingService } from './building.service';
import { LocationUpdateDto, RouteRequestDto, NavigationAnalyticsDto } from '../dto/navigation.dto';
import type { Route, UserLocation } from '@ufv-pathfinding/shared';
import { transformUserPreferences, transformDbUserPreferences, transformNavigationNode } from '../utils/entity-transformers';

@Injectable()
export class NavigationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DbNavigationNode)
    private readonly nodeRepository: Repository<DbNavigationNode>,
    private readonly pathfindingService: PathfindingService,
    private readonly roomService: RoomService,
    private readonly buildingService: BuildingService,
  ) {}

  async calculateRoute(routeRequest: RouteRequestDto, userId?: string): Promise<Route> {
    const { from, to, preferences } = routeRequest;

    // Get user preferences if available
    let userPreferences = transformUserPreferences(preferences);
    if (userId && !preferences) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      userPreferences = user ? transformDbUserPreferences(user.preferences) : undefined;
    }

    // Calculate the route using A* pathfinding
    const route = await this.pathfindingService.findRoute(from, to, userPreferences);

    // Track analytics if user is provided
    if (userId) {
      await this.trackEvent(userId, 'route_request', {
        from,
        to,
        routeId: route.id,
        distance: route.totalDistance,
        estimatedTime: route.estimatedTime,
        accessible: route.accessible,
      });
    }

    return route;
  }

  async updateUserLocation(userId: string, locationUpdate: LocationUpdateDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found');
    }

    const userLocation: UserLocation = {
      coordinates: locationUpdate.coordinates,
      floor: locationUpdate.floor,
      building: locationUpdate.building,
      accuracy: locationUpdate.accuracy,
      timestamp: new Date(),
      source: locationUpdate.source as any,
    };

    // Update user's recent locations
    const recentLocations = user.preferences?.recentLocations || [];
    
    // Add new location or update frequency if exists
    const existingLocationIndex = recentLocations.findIndex(
      loc => loc.roomId === locationUpdate.building
    );

    if (existingLocationIndex >= 0) {
      recentLocations[existingLocationIndex].timestamp = new Date();
      recentLocations[existingLocationIndex].frequency += 1;
    } else {
      recentLocations.unshift({
        roomId: locationUpdate.building,
        timestamp: new Date(),
        frequency: 1,
      });
    }

    // Keep only last 50 locations
    user.preferences = { ...user.preferences, recentLocations: recentLocations.slice(0, 50) };

    await this.userRepository.save(user);

    // Track location update
    await this.trackEvent(userId, 'location_update', {
      location: userLocation,
      source: locationUpdate.source,
    });
  }

  async getNavigationNodes(buildingId: string, floor?: number): Promise<any[]> {
    const queryBuilder = this.nodeRepository
      .createQueryBuilder('node')
      .where('node.buildingId = :buildingId', { buildingId })
      .andWhere('node.active = true');

    if (floor !== undefined) {
      queryBuilder.andWhere('node.floor = :floor', { floor });
    }

    const nodes = await queryBuilder
      .orderBy('node.type', 'ASC')
      .addOrderBy('node.name', 'ASC')
      .getMany();

    return nodes.map(transformNavigationNode);
  }

  async findNearbyNodes(lat: number, lng: number, radiusMeters: number = 50): Promise<any[]> {
    const nodes = await this.nodeRepository
      .createQueryBuilder('node')
      .where(
        'ST_DWithin(node.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius)',
        { lng, lat, radius: radiusMeters }
      )
      .andWhere('node.active = true')
      .orderBy(
        'ST_Distance(node.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))',
        'ASC'
      )
      .limit(10)
      .getMany();

    return nodes.map(transformNavigationNode);
  }

  async getFavoriteRooms(userId: string): Promise<any[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user || !user.preferences?.favoriteLocations?.length) {
      return [];
    }

    const favoriteRooms = [];
    
    for (const roomId of user.preferences.favoriteLocations) {
      try {
        const room = await this.roomService.findById(roomId);
        favoriteRooms.push(room);
      } catch (error) {
        // Room might have been deleted, skip it
        continue;
      }
    }

    return favoriteRooms;
  }

  async addFavoriteRoom(userId: string, roomId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found');
    }

    // Verify room exists
    await this.roomService.findById(roomId);

    const favoriteLocations = user.preferences?.favoriteLocations || [];
    
    if (!favoriteLocations.includes(roomId)) {
      favoriteLocations.push(roomId);
      user.preferences = { ...user.preferences, favoriteLocations };
      await this.userRepository.save(user);

      await this.trackEvent(userId, 'favorite_add', { roomId });
    }
  }

  async removeFavoriteRoom(userId: string, roomId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found');
    }

    const favoriteLocations = user.preferences?.favoriteLocations || [];
    const updatedFavorites = favoriteLocations.filter(id => id !== roomId);
    
    if (updatedFavorites.length !== favoriteLocations.length) {
      user.preferences = { ...user.preferences, favoriteLocations: updatedFavorites };
      await this.userRepository.save(user);

      await this.trackEvent(userId, 'favorite_remove', { roomId });
    }
  }

  async getRecentLocations(userId: string): Promise<any[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user || !user.preferences?.recentLocations?.length) {
      return [];
    }

    const recentRooms = [];
    
    for (const recentLocation of user.preferences.recentLocations.slice(0, 10)) {
      try {
        const room = await this.roomService.findById(recentLocation.roomId);
        recentRooms.push({
          ...room,
          lastVisited: recentLocation.timestamp,
          visitFrequency: recentLocation.frequency,
        });
      } catch (error) {
        // Room might have been deleted, skip it
        continue;
      }
    }

    return recentRooms;
  }

  async trackEvent(userId: string, eventType: string, data: any): Promise<void> {
    // In a production environment, you would save this to an analytics database
    // or send it to an analytics service like Google Analytics, Mixpanel, etc.
    
    console.log(`Analytics Event - User: ${userId}, Event: ${eventType}`, data);
    
    // For now, we'll just log it. In the future, you might want to:
    // 1. Store in a separate analytics database
    // 2. Send to external analytics service
    // 3. Use a message queue for processing
  }

  async getNavigationStats(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate user navigation statistics
    // In a real implementation, you'd query from an analytics database
    
    return {
      totalRoutes: user.preferences?.recentLocations?.length || 0,
      favoriteRooms: user.preferences?.favoriteLocations?.length || 0,
      totalDistance: 0, // Would be calculated from route history
      successRate: 95, // Would be calculated from completed routes
      mostVisitedBuilding: 'Building T', // Would be calculated from location data
    };
  }
}