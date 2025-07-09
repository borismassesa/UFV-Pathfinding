import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Beacon } from '../../../entities/beacon.entity';
import { BeaconDataDto } from '../dto/navigation.dto';
import type { BeaconData, Coordinates } from '@ufv-pathfinding/shared';

export interface TriangulationResult {
  coordinates: Coordinates;
  accuracy: number;
  confidence: number;
  beaconsUsed: number;
}

@Injectable()
export class BeaconService {
  private readonly logger = new Logger(BeaconService.name);

  constructor(
    @InjectRepository(Beacon)
    private readonly beaconRepository: Repository<Beacon>,
  ) {}

  async findAll(buildingId?: string, floor?: number): Promise<Beacon[]> {
    const queryBuilder = this.beaconRepository
      .createQueryBuilder('beacon')
      .leftJoinAndSelect('beacon.building', 'building')
      .where('beacon.active = true');

    if (buildingId) {
      queryBuilder.andWhere('beacon.buildingId = :buildingId', { buildingId });
    }

    if (floor !== undefined) {
      queryBuilder.andWhere('beacon.floor = :floor', { floor });
    }

    return queryBuilder
      .orderBy('beacon.name', 'ASC')
      .getMany();
  }

  async findById(id: string): Promise<Beacon> {
    const beacon = await this.beaconRepository.findOne({
      where: { id },
      relations: ['building'],
    });

    if (!beacon) {
      throw new NotFoundException(`Beacon with ID ${id} not found`);
    }

    return beacon;
  }

  async findByUuid(uuid: string, major?: number, minor?: number): Promise<Beacon[]> {
    const queryBuilder = this.beaconRepository
      .createQueryBuilder('beacon')
      .leftJoinAndSelect('beacon.building', 'building')
      .where('beacon.uuid = :uuid', { uuid })
      .andWhere('beacon.active = true');

    if (major !== undefined) {
      queryBuilder.andWhere('beacon.major = :major', { major });
    }

    if (minor !== undefined) {
      queryBuilder.andWhere('beacon.minor = :minor', { minor });
    }

    return queryBuilder.getMany();
  }

  async findNearbyBeacons(lat: number, lng: number, radiusMeters: number = 100): Promise<Beacon[]> {
    return this.beaconRepository
      .createQueryBuilder('beacon')
      .leftJoinAndSelect('beacon.building', 'building')
      .where('beacon.active = true')
      .andWhere(
        'ST_DWithin(beacon.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius)',
        { lng, lat, radius: radiusMeters }
      )
      .orderBy(
        'ST_Distance(beacon.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))',
        'ASC'
      )
      .limit(20)
      .getMany();
  }

  async processBeaconScans(beaconScans: BeaconDataDto[]): Promise<TriangulationResult | null> {
    if (beaconScans.length < 3) {
      this.logger.warn('Insufficient beacons for triangulation (need at least 3)');
      return null;
    }

    try {
      // Find matching beacons in database
      const beaconPromises = beaconScans.map(scan =>
        this.findByUuid(scan.uuid, scan.major, scan.minor)
      );

      const beaconResults = await Promise.all(beaconPromises);
      const matchedBeacons: Array<{ beacon: Beacon; scan: BeaconDataDto }> = [];

      beaconResults.forEach((beacons, index) => {
        if (beacons.length > 0) {
          matchedBeacons.push({
            beacon: beacons[0], // Take first match
            scan: beaconScans[index],
          });
        }
      });

      if (matchedBeacons.length < 3) {
        this.logger.warn('Insufficient matched beacons for triangulation');
        return null;
      }

      // Perform trilateration
      const result = await this.performTrilateration(matchedBeacons);
      
      // Update beacon last seen timestamps
      await this.updateBeaconLastSeen(matchedBeacons.map(mb => mb.beacon.id));

      return result;
    } catch (error) {
      this.logger.error('Error processing beacon scans:', error);
      return null;
    }
  }

  private async performTrilateration(
    matchedBeacons: Array<{ beacon: Beacon; scan: BeaconDataDto }>
  ): Promise<TriangulationResult> {
    // Use weighted least squares trilateration algorithm
    const beaconData = matchedBeacons.map(({ beacon, scan }) => ({
      x: beacon.coordinates?.lng || 0,
      y: beacon.coordinates?.lat || 0,
      distance: beacon.calculateDistance(scan.rssi),
      weight: this.calculateWeight(scan.rssi, scan.accuracy),
    }));

    // Implement weighted least squares solution
    const result = this.weightedLeastSquares(beaconData);

    // Calculate confidence based on beacon consistency
    const confidence = this.calculateConfidence(matchedBeacons);

    // Estimate accuracy based on beacon distances and RSSI values
    const accuracy = this.estimateAccuracy(matchedBeacons);

    return {
      coordinates: {
        lat: result.y,
        lng: result.x,
      },
      accuracy,
      confidence,
      beaconsUsed: matchedBeacons.length,
    };
  }

  private weightedLeastSquares(beaconData: Array<{ x: number; y: number; distance: number; weight: number }>) {
    // Simplified weighted least squares implementation
    // In production, you'd use a more sophisticated algorithm like Gauss-Newton
    
    let sumX = 0, sumY = 0, sumWeight = 0;
    
    beaconData.forEach(({ x, y, weight }) => {
      sumX += x * weight;
      sumY += y * weight;
      sumWeight += weight;
    });

    return {
      x: sumX / sumWeight,
      y: sumY / sumWeight,
    };
  }

  private calculateWeight(rssi: number, accuracy: number): number {
    // Higher weight for stronger signals and better accuracy
    const rssiWeight = Math.max(0.1, (rssi + 100) / 100); // Normalize RSSI
    const accuracyWeight = Math.max(0.1, 1 / (accuracy + 1)); // Better accuracy = higher weight
    return rssiWeight * accuracyWeight;
  }

  private calculateConfidence(matchedBeacons: Array<{ beacon: Beacon; scan: BeaconDataDto }>): number {
    // Calculate confidence based on:
    // 1. Number of beacons
    // 2. Signal strength consistency
    // 3. Beacon distribution (geometric dilution of precision)

    const beaconCount = matchedBeacons.length;
    const countScore = Math.min(1.0, beaconCount / 5); // Optimal with 5+ beacons

    // Signal strength consistency
    const rssiValues = matchedBeacons.map(mb => mb.scan.rssi);
    const rssiMean = rssiValues.reduce((a, b) => a + b, 0) / rssiValues.length;
    const rssiVariance = rssiValues.reduce((sum, rssi) => sum + Math.pow(rssi - rssiMean, 2), 0) / rssiValues.length;
    const consistencyScore = Math.max(0, 1 - (rssiVariance / 1000)); // Lower variance = higher score

    return (countScore + consistencyScore) / 2;
  }

  private estimateAccuracy(matchedBeacons: Array<{ beacon: Beacon; scan: BeaconDataDto }>): number {
    // Estimate position accuracy based on beacon accuracy and signal quality
    const accuracies = matchedBeacons.map(mb => mb.scan.accuracy);
    const averageAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    
    // Add dilution of precision factor
    const gdop = this.calculateGDOP(matchedBeacons);
    
    return Math.min(averageAccuracy * gdop, 10); // Cap at 10 meters
  }

  private calculateGDOP(matchedBeacons: Array<{ beacon: Beacon; scan: BeaconDataDto }>): number {
    // Simplified Geometric Dilution of Precision calculation
    // Better beacon distribution = lower GDOP = better accuracy
    
    if (matchedBeacons.length < 3) return 10;

    const positions = matchedBeacons.map(mb => mb.beacon.coordinates).filter(Boolean);
    
    if (positions.length < 3) return 5;

    // Calculate area of triangle formed by beacons (larger = better distribution)
    const [p1, p2, p3] = positions;
    
    if (!p1 || !p2 || !p3) return 5;
    
    const area = Math.abs(
      (p1.lng * (p2.lat - p3.lat) + p2.lng * (p3.lat - p1.lat) + p3.lng * (p1.lat - p2.lat)) / 2
    );

    // Convert area to GDOP (inverse relationship)
    return Math.max(1.0, Math.min(5.0, 0.001 / (area + 0.0001)));
  }

  private async updateBeaconLastSeen(beaconIds: string[]): Promise<void> {
    await this.beaconRepository
      .createQueryBuilder()
      .update(Beacon)
      .set({ lastSeenAt: new Date() })
      .whereInIds(beaconIds)
      .execute();
  }

  async create(beaconData: Partial<Beacon>): Promise<Beacon> {
    const beacon = this.beaconRepository.create(beaconData);
    return this.beaconRepository.save(beacon);
  }

  async update(id: string, beaconData: Partial<Beacon>): Promise<Beacon> {
    await this.beaconRepository.update(id, beaconData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.beaconRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Beacon with ID ${id} not found`);
    }
  }

  async getBeaconStats(buildingId?: string): Promise<any> {
    const queryBuilder = this.beaconRepository
      .createQueryBuilder('beacon')
      .select([
        'COUNT(*) as total',
        'COUNT(CASE WHEN beacon.status = \'active\' THEN 1 END) as active',
        'COUNT(CASE WHEN beacon.status = \'inactive\' THEN 1 END) as inactive',
        'COUNT(CASE WHEN beacon.status = \'maintenance\' THEN 1 END) as maintenance',
        'COUNT(CASE WHEN beacon.lastSeenAt > NOW() - INTERVAL \'1 hour\' THEN 1 END) as recently_seen',
      ]);

    if (buildingId) {
      queryBuilder.where('beacon.buildingId = :buildingId', { buildingId });
    }

    const result = await queryBuilder.getRawOne();
    
    return {
      total: parseInt(result.total),
      active: parseInt(result.active),
      inactive: parseInt(result.inactive),
      maintenance: parseInt(result.maintenance),
      recentlySeen: parseInt(result.recently_seen),
      coverage: buildingId ? await this.calculateBuildingCoverage(buildingId) : null,
    };
  }

  private async calculateBuildingCoverage(buildingId: string): Promise<number> {
    // Calculate what percentage of the building has beacon coverage
    // This is a simplified implementation
    const beaconCount = await this.beaconRepository.count({
      where: { buildingId, active: true },
    });

    // Assume each beacon covers ~50m radius effectively
    // This would be more sophisticated in production
    const coveragePerBeacon = Math.PI * 50 * 50; // 50m radius coverage
    const totalCoverage = beaconCount * coveragePerBeacon;
    
    // This would come from building geometry in production
    const estimatedBuildingArea = 10000; // 10,000 sq meters for UFV Building T
    
    return Math.min(100, (totalCoverage / estimatedBuildingArea) * 100);
  }
}