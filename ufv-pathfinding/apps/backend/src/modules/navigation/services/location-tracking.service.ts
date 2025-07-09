import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';
import { BeaconService } from './beacon.service';
import { NavigationService } from './navigation.service';
import { BeaconDataDto, LocationUpdateDto } from '../dto/navigation.dto';
import type { UserLocation, Coordinates } from '@ufv-pathfinding/shared';

interface LocationHistory {
  userId: string;
  locations: Array<{
    coordinates: Coordinates;
    timestamp: Date;
    accuracy: number;
    source: string;
  }>;
}

interface GeofenceAlert {
  userId: string;
  type: 'enter' | 'exit';
  area: string;
  timestamp: Date;
}

@Injectable()
export class LocationTrackingService {
  private readonly logger = new Logger(LocationTrackingService.name);
  private locationHistory = new Map<string, LocationHistory>();
  private userGeofences = new Map<string, string[]>(); // userId -> area IDs
  private trackingIntervals = new Map<string, NodeJS.Timeout>();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly beaconService: BeaconService,
    private readonly navigationService: NavigationService,
  ) {}

  async startTracking(userId: string): Promise<void> {
    this.logger.log(`Starting location tracking for user: ${userId}`);

    // Initialize location history
    if (!this.locationHistory.has(userId)) {
      this.locationHistory.set(userId, {
        userId,
        locations: [],
      });
    }

    // Set up periodic location smoothing and validation
    const interval = setInterval(async () => {
      await this.processLocationUpdates(userId);
    }, 5000); // Every 5 seconds

    this.trackingIntervals.set(userId, interval);
  }

  async stopTracking(userId: string): Promise<void> {
    this.logger.log(`Stopping location tracking for user: ${userId}`);

    const interval = this.trackingIntervals.get(userId);
    if (interval) {
      clearInterval(interval);
      this.trackingIntervals.delete(userId);
    }

    // Archive location history
    await this.archiveLocationHistory(userId);
    this.locationHistory.delete(userId);
  }

  async processBeaconUpdate(userId: string, beaconData: BeaconDataDto[]): Promise<UserLocation | null> {
    try {
      // Use beacon service for triangulation
      const triangulationResult = await this.beaconService.processBeaconScans(beaconData);
      
      if (!triangulationResult) {
        this.logger.warn(`Failed to triangulate position for user ${userId}`);
        return null;
      }

      // Apply Kalman filtering for location smoothing
      const smoothedLocation = await this.applyLocationFiltering(userId, {
        coordinates: triangulationResult.coordinates,
        accuracy: triangulationResult.accuracy,
        source: 'beacon',
        timestamp: new Date(),
      });

      // Update user location
      const locationUpdate: LocationUpdateDto = {
        coordinates: smoothedLocation.coordinates,
        floor: await this.determineFloor(triangulationResult.coordinates),
        building: await this.determineBuilding(triangulationResult.coordinates),
        accuracy: smoothedLocation.accuracy,
        source: 'beacon',
      };

      await this.navigationService.updateUserLocation(userId, locationUpdate);

      const userLocation: UserLocation = {
        ...locationUpdate,
        timestamp: new Date(),
        source: 'beacon' as any,
      };

      // Check geofences
      await this.checkGeofences(userId, userLocation);

      // Emit real-time update
      // TODO: Emit location update via event emitter
      // await this.locationGateway.emitToUser(userId, 'location_update', userLocation);

      return userLocation;
    } catch (error) {
      this.logger.error(`Error processing beacon update for user ${userId}:`, error);
      return null;
    }
  }

  async processManualUpdate(userId: string, locationUpdate: LocationUpdateDto): Promise<UserLocation> {
    // Apply basic validation and filtering
    const filteredLocation = await this.applyLocationFiltering(userId, {
      coordinates: locationUpdate.coordinates,
      accuracy: locationUpdate.accuracy,
      source: locationUpdate.source,
      timestamp: new Date(),
    });

    await this.navigationService.updateUserLocation(userId, {
      ...locationUpdate,
      coordinates: filteredLocation.coordinates,
      accuracy: filteredLocation.accuracy,
    });

    const userLocation: UserLocation = {
      ...locationUpdate,
      coordinates: filteredLocation.coordinates,
      accuracy: filteredLocation.accuracy,
      timestamp: new Date(),
      source: locationUpdate.source as any,
    };

    // Check geofences
    await this.checkGeofences(userId, userLocation);

    // Emit real-time update
    // TODO: Emit location update via event emitter
    // await this.locationGateway.emitToUser(userId, 'location_update', userLocation);

    return userLocation;
  }

  private async applyLocationFiltering(
    userId: string, 
    newLocation: {
      coordinates: Coordinates;
      accuracy: number;
      source: string;
      timestamp: Date;
    }
  ): Promise<{ coordinates: Coordinates; accuracy: number }> {
    const history = this.locationHistory.get(userId);
    
    if (!history || history.locations.length === 0) {
      // First location, no filtering needed
      history?.locations.push(newLocation);
      return {
        coordinates: newLocation.coordinates,
        accuracy: newLocation.accuracy,
      };
    }

    // Get recent locations for filtering
    const recentLocations = history.locations
      .filter(loc => Date.now() - loc.timestamp.getTime() < 30000) // Last 30 seconds
      .slice(-5); // Last 5 locations

    // Apply Kalman filter for location smoothing
    const filteredCoordinates = this.kalmanFilter(recentLocations, newLocation);

    // Apply outlier detection
    if (this.isLocationOutlier(recentLocations, newLocation)) {
      this.logger.warn(`Outlier location detected for user ${userId}, applying correction`);
      // Use weighted average of recent locations instead
      const weightedLocation = this.calculateWeightedAverage(recentLocations);
      filteredCoordinates.lat = weightedLocation.lat;
      filteredCoordinates.lng = weightedLocation.lng;
    }

    // Add to history
    history.locations.push(newLocation);
    
    // Keep only recent history (last 100 locations)
    if (history.locations.length > 100) {
      history.locations = history.locations.slice(-100);
    }

    return {
      coordinates: filteredCoordinates,
      accuracy: Math.min(newLocation.accuracy, 10), // Cap accuracy at 10m
    };
  }

  private kalmanFilter(
    recentLocations: Array<{ coordinates: Coordinates; accuracy: number; timestamp: Date }>,
    newLocation: { coordinates: Coordinates; accuracy: number; timestamp: Date }
  ): Coordinates {
    if (recentLocations.length === 0) {
      return newLocation.coordinates;
    }

    const lastLocation = recentLocations[recentLocations.length - 1];
    
    // Simplified Kalman filter implementation
    const processNoise = 0.01; // Process noise (movement uncertainty)
    const measurementNoise = newLocation.accuracy / 100; // Measurement noise based on accuracy

    // Prediction step (assume constant velocity model)
    const timeDelta = (newLocation.timestamp.getTime() - lastLocation.timestamp.getTime()) / 1000; // seconds
    const predictedLat = lastLocation.coordinates.lat;
    const predictedLng = lastLocation.coordinates.lng;

    // Update step
    const kalmanGainLat = processNoise / (processNoise + measurementNoise);
    const kalmanGainLng = processNoise / (processNoise + measurementNoise);

    const filteredLat = predictedLat + kalmanGainLat * (newLocation.coordinates.lat - predictedLat);
    const filteredLng = predictedLng + kalmanGainLng * (newLocation.coordinates.lng - predictedLng);

    return {
      lat: filteredLat,
      lng: filteredLng,
    };
  }

  private isLocationOutlier(
    recentLocations: Array<{ coordinates: Coordinates; accuracy: number }>,
    newLocation: { coordinates: Coordinates; accuracy: number }
  ): boolean {
    if (recentLocations.length < 3) return false;

    // Calculate average of recent locations
    const avgLocation = this.calculateWeightedAverage(recentLocations);
    
    // Calculate distance from average
    const distance = this.calculateDistance(avgLocation, newLocation.coordinates);
    
    // Consider outlier if distance is more than 3 times the average accuracy
    const avgAccuracy = recentLocations.reduce((sum, loc) => sum + loc.accuracy, 0) / recentLocations.length;
    const threshold = Math.max(avgAccuracy * 3, 20); // Minimum 20m threshold

    return distance > threshold;
  }

  private calculateWeightedAverage(
    locations: Array<{ coordinates: Coordinates; accuracy: number }>
  ): Coordinates {
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;

    locations.forEach(location => {
      const weight = 1 / (location.accuracy + 1); // Better accuracy = higher weight
      totalWeight += weight;
      weightedLat += location.coordinates.lat * weight;
      weightedLng += location.coordinates.lng * weight;
    });

    return {
      lat: weightedLat / totalWeight,
      lng: weightedLng / totalWeight,
    };
  }

  private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    // Haversine formula for distance calculation
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

  private async processLocationUpdates(userId: string): Promise<void> {
    // Periodic processing for location validation and notifications
    // TODO: Get user location from service instead of gateway
    const currentLocation = null; // this.locationGateway.getUserLocation(userId);
    
    if (!currentLocation) return;

    // Check for prolonged stays in one location
    await this.checkProlongedStay(userId, currentLocation);

    // Update location analytics
    await this.updateLocationAnalytics(userId, currentLocation);
  }

  private async checkProlongedStay(userId: string, currentLocation: UserLocation): Promise<void> {
    const history = this.locationHistory.get(userId);
    if (!history) return;

    const recentLocations = history.locations
      .filter(loc => Date.now() - loc.timestamp.getTime() < 300000) // Last 5 minutes
      .filter(loc => this.calculateDistance(loc.coordinates, currentLocation.coordinates) < 10); // Within 10m

    if (recentLocations.length >= 10) { // 10 location updates in same area
      // TODO: Emit prolonged stay alert via event emitter
      // await this.locationGateway.emitToUser(userId, 'prolonged_stay', {
      //   location: currentLocation,
      //   duration: 300, // 5 minutes
      // });
    }
  }

  private async updateLocationAnalytics(userId: string, location: UserLocation): Promise<void> {
    // Update user's location analytics
    await this.navigationService.trackEvent(userId, 'location_analytics', {
      building: location.building,
      floor: location.floor,
      source: location.source,
      accuracy: location.accuracy,
      timestamp: location.timestamp,
    });
  }

  private async checkGeofences(userId: string, location: UserLocation): Promise<void> {
    // Check if user entered or exited any geofenced areas
    const userGeofences = this.userGeofences.get(userId) || [];
    
    // For this implementation, we'll define some basic geofences
    const geofences = [
      {
        id: 'building_entrance',
        name: 'Building Entrance',
        coordinates: { lat: 49.2827, lng: -123.1207 },
        radius: 20,
      },
      {
        id: 'cafeteria',
        name: 'Cafeteria',
        coordinates: { lat: 49.2825, lng: -123.1205 },
        radius: 15,
      },
    ];

    for (const geofence of geofences) {
      const distance = this.calculateDistance(location.coordinates, geofence.coordinates);
      const isInside = distance <= geofence.radius;
      const wasInside = userGeofences.includes(geofence.id);

      if (isInside && !wasInside) {
        // Entered geofence
        userGeofences.push(geofence.id);
        // TODO: Emit geofence enter via event emitter
        // await this.locationGateway.emitToUser(userId, 'geofence_enter', {
        //   geofence: geofence.name,
        //   location,
        // });
      } else if (!isInside && wasInside) {
        // Exited geofence
        const index = userGeofences.indexOf(geofence.id);
        if (index > -1) {
          userGeofences.splice(index, 1);
        }
        // TODO: Emit geofence exit via event emitter
        // await this.locationGateway.emitToUser(userId, 'geofence_exit', {
        //   geofence: geofence.name,
        //   location,
        // });
      }
    }

    this.userGeofences.set(userId, userGeofences);
  }

  private async determineFloor(coordinates: Coordinates): Promise<number> {
    // In production, this would use spatial queries to determine floor
    // For now, return default floor
    return 1;
  }

  private async determineBuilding(coordinates: Coordinates): Promise<string> {
    // In production, this would use spatial queries to determine building
    // For now, return default building
    return 'building-t';
  }

  private async archiveLocationHistory(userId: string): Promise<void> {
    const history = this.locationHistory.get(userId);
    if (!history) return;

    // In production, you would save this to a time-series database
    this.logger.log(`Archiving ${history.locations.length} location records for user ${userId}`);
  }

  // Public methods for external use
  async getUserLocationHistory(userId: string, hours: number = 24): Promise<any[]> {
    const history = this.locationHistory.get(userId);
    if (!history) return [];

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return history.locations.filter(loc => loc.timestamp > cutoff);
  }

  async getActiveUsers(): Promise<string[]> {
    // TODO: Get active users from service instead of gateway
    return []; // this.locationGateway.getActiveUsers();
  }

  async getNearbyUsers(userId: string, radiusMeters: number = 50): Promise<any[]> {
    // TODO: Get user location from service instead of gateway
    const userLocation = null; // this.locationGateway.getUserLocation(userId);
    if (!userLocation) return [];

    const activeUsers = this.getActiveUsers();
    const nearbyUsers: any[] = [];

    for (const otherUserId of await Promise.resolve(activeUsers)) {
      if (otherUserId === userId) continue;

      // TODO: Get user location from service instead of gateway
      const otherLocation = null; // this.locationGateway.getUserLocation(otherUserId);
      if (!otherLocation) continue;

      // TODO: Calculate distance when location services are implemented
      // const distance = this.calculateDistance(userLocation.coordinates, otherLocation.coordinates);
      // if (distance <= radiusMeters) {
      //   nearbyUsers.push({
      //     userId: otherUserId,
      //     location: otherLocation,
      //     distance,
      //   });
      // }
    }

    return nearbyUsers;
  }
}