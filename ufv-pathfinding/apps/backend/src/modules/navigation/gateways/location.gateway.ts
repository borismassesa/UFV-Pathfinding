import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { NavigationService } from '../services/navigation.service';
import { LocationTrackingService } from '../services/location-tracking.service';
import { LocationUpdateDto, BeaconDataDto } from '../dto/navigation.dto';
import type { UserLocation, BeaconData } from '@ufv-pathfinding/shared';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:8081",
    credentials: true,
  },
  namespace: '/location',
})
export class LocationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LocationGateway.name);
  private activeUsers = new Map<string, AuthenticatedSocket>();
  private userLocations = new Map<string, UserLocation>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly navigationService: NavigationService,
    private readonly locationTrackingService: LocationTrackingService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Location WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Client ${client.id} attempted to connect without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.user = payload;

      if (client.userId) {
        this.activeUsers.set(client.userId, client);
        
        this.logger.log(`User ${client.userId} connected to location tracking`);
        
        // Send current location if available
        const currentLocation = this.userLocations.get(client.userId);
        if (currentLocation) {
          client.emit('location_update', currentLocation);
        }

        // Join user to their personal room for targeted updates
        client.join(`user_${client.userId}`);

        // Start location tracking for this user
        await this.locationTrackingService.startTracking(client.userId);
      }
      
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.activeUsers.delete(client.userId);
      
      // Stop location tracking for this user
      await this.locationTrackingService.stopTracking(client.userId);
      
      this.logger.log(`User ${client.userId} disconnected from location tracking`);
    }
  }

  @SubscribeMessage('update_location')
  @UseGuards(WsJwtGuard)
  async handleLocationUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() locationUpdate: LocationUpdateDto,
  ) {
    if (!client.userId) {
      return { error: 'User not authenticated' };
    }

    try {
      // Use location tracking service for processing
      const userLocation = await this.locationTrackingService.processManualUpdate(client.userId, locationUpdate);

      // Store in memory for quick access
      this.userLocations.set(client.userId, userLocation);

      // Emit to user's personal room
      this.server.to(`user_${client.userId}`).emit('location_confirmed', userLocation);

      // Emit to nearby users if they want to share location
      await this.notifyNearbyUsers(client.userId, userLocation);

      this.logger.debug(`Location updated for user ${client.userId}`);
      
      return { success: true, location: userLocation };
    } catch (error) {
      this.logger.error(`Failed to update location for user ${client.userId}:`, error.message);
      return { error: 'Failed to update location' };
    }
  }

  @SubscribeMessage('beacon_scan')
  @UseGuards(WsJwtGuard)
  async handleBeaconScan(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() beaconData: BeaconDataDto[],
  ) {
    if (!client.userId) {
      return { error: 'User not authenticated' };
    }

    try {
      // Use location tracking service for beacon processing
      const userLocation = await this.locationTrackingService.processBeaconUpdate(client.userId, beaconData);
      
      if (userLocation) {
        this.userLocations.set(client.userId, userLocation);
        this.server.to(`user_${client.userId}`).emit('location_update', userLocation);
        return { success: true, location: userLocation };
      }

      return { success: false, error: 'Could not determine location from beacons' };
    } catch (error) {
      this.logger.error(`Failed to process beacon data for user ${client.userId}:`, error.message);
      return { error: 'Failed to process beacon data' };
    }
  }

  @SubscribeMessage('request_route')
  @UseGuards(WsJwtGuard)
  async handleRouteRequest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() routeRequest: any,
  ) {
    if (!client.userId) {
      return { error: 'User not authenticated' };
    }

    try {
      const route = await this.navigationService.calculateRoute(routeRequest, client.userId);
      
      // Send route back to requesting user
      client.emit('route_calculated', route);
      
      return { success: true, routeId: route.id };
    } catch (error) {
      this.logger.error(`Failed to calculate route for user ${client.userId}:`, error.message);
      return { error: 'Failed to calculate route' };
    }
  }

  @SubscribeMessage('join_area')
  async handleJoinArea(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { building: string; floor?: number },
  ) {
    if (!client.userId) {
      return { error: 'User not authenticated' };
    }

    const areaId = data.floor !== undefined 
      ? `${data.building}_floor_${data.floor}`
      : `${data.building}`;

    client.join(areaId);
    
    this.logger.debug(`User ${client.userId} joined area: ${areaId}`);
    return { success: true, area: areaId };
  }

  @SubscribeMessage('leave_area')
  async handleLeaveArea(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { building: string; floor?: number },
  ) {
    if (!client.userId) {
      return { error: 'User not authenticated' };
    }

    const areaId = data.floor !== undefined 
      ? `${data.building}_floor_${data.floor}`
      : `${data.building}`;

    client.leave(areaId);
    
    this.logger.debug(`User ${client.userId} left area: ${areaId}`);
    return { success: true };
  }

  // Public method to emit location updates to specific users
  async emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  // Public method to emit to all users in an area
  async emitToArea(building: string, floor: number | undefined, event: string, data: any) {
    const areaId = floor !== undefined 
      ? `${building}_floor_${floor}`
      : `${building}`;
    
    this.server.to(areaId).emit(event, data);
  }

  // Get list of active users
  getActiveUsers(): string[] {
    return Array.from(this.activeUsers.keys());
  }

  // Get current location of a user
  getUserLocation(userId: string): UserLocation | undefined {
    return this.userLocations.get(userId);
  }

  private async notifyNearbyUsers(userId: string, location: UserLocation) {
    // Find users in the same building and floor
    const nearbyUsers = Array.from(this.userLocations.entries())
      .filter(([otherUserId, otherLocation]) => 
        otherUserId !== userId &&
        otherLocation.building === location.building &&
        otherLocation.floor === location.floor
      );

    // Calculate distance and notify if within range
    for (const [nearbyUserId, nearbyLocation] of nearbyUsers) {
      const distance = this.calculateDistance(location.coordinates, nearbyLocation.coordinates);
      
      if (distance <= 50) { // Within 50 meters
        this.server.to(`user_${nearbyUserId}`).emit('nearby_user_update', {
          userId,
          location,
          distance,
        });
      }
    }
  }

  private calculateDistance(coord1: any, coord2: any): number {
    // Simple Euclidean distance calculation
    // In production, you'd use more sophisticated spatial calculations
    const dx = coord1.lng - coord2.lng;
    const dy = coord1.lat - coord2.lat;
    return Math.sqrt(dx * dx + dy * dy) * 111000; // Rough conversion to meters
  }

  private async processBeaconData(beaconData: BeaconDataDto[]): Promise<any | null> {
    // This is a simplified beacon triangulation
    // In production, you'd implement sophisticated trilateration algorithms
    
    if (beaconData.length < 3) {
      return null; // Need at least 3 beacons for triangulation
    }

    // For now, return a mock location based on strongest beacon
    const strongestBeacon = beaconData.reduce((prev, current) => 
      prev.rssi > current.rssi ? prev : current
    );

    // In production, you'd:
    // 1. Look up beacon coordinates in database
    // 2. Use trilateration algorithms (Weighted Least Squares, etc.)
    // 3. Apply Kalman filtering for smoothing
    // 4. Consider building layout and obstacles

    return {
      coordinates: { lat: 49.2827, lng: -123.1207 }, // Mock coordinates
      floor: 1,
      building: 'building-t',
      accuracy: Math.min(strongestBeacon.accuracy, 5), // Cap accuracy at 5m
    };
  }
}