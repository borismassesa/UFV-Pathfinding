import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Room } from '../../../entities/room.entity';
import { RoomSearchDto } from '../dto/navigation.dto';
import type { SearchResult } from '@ufv-pathfinding/shared';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async findAll(buildingId?: string, floor?: number): Promise<Room[]> {
    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.building', 'building');

    if (buildingId) {
      queryBuilder.where('room.buildingId = :buildingId', { buildingId });
    }

    if (floor !== undefined) {
      queryBuilder.andWhere('room.floor = :floor', { floor });
    }

    return queryBuilder
      .orderBy('room.roomNumber', 'ASC')
      .getMany();
  }

  async findById(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['building'],
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return room;
  }

  async findByRoomNumber(roomNumber: string, buildingId?: string): Promise<Room[]> {
    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.building', 'building')
      .where('room.roomNumber ILIKE :roomNumber', { roomNumber: `%${roomNumber}%` });

    if (buildingId) {
      queryBuilder.andWhere('room.buildingId = :buildingId', { buildingId });
    }

    return queryBuilder
      .orderBy('room.roomNumber', 'ASC')
      .getMany();
  }

  async searchRooms(searchDto: RoomSearchDto): Promise<SearchResult[]> {
    const { q, buildingId, floor, type, limit = 20 } = searchDto;

    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.building', 'building')
      .select([
        'room.id',
        'room.roomNumber',
        'room.name',
        'room.type',
        'room.floor',
        'room.centerPoint',
        'room.amenities',
        'building.id',
        'building.name',
        'building.code',
      ]);

    // Full-text search on room number, name, and amenities
    if (q) {
      queryBuilder.where(
        `(
          room.roomNumber ILIKE :query OR 
          room.name ILIKE :query OR 
          room.type ILIKE :query OR
          array_to_string(room.amenities, ' ') ILIKE :query OR
          to_tsvector('english', room.roomNumber || ' ' || room.name || ' ' || room.type || ' ' || array_to_string(room.amenities, ' ')) @@ plainto_tsquery('english', :searchQuery)
        )`,
        { query: `%${q}%`, searchQuery: q }
      );
    }

    if (buildingId) {
      queryBuilder.andWhere('room.buildingId = :buildingId', { buildingId });
    }

    if (floor !== undefined) {
      queryBuilder.andWhere('room.floor = :floor', { floor });
    }

    if (type) {
      queryBuilder.andWhere('room.type = :type', { type });
    }

    const rooms = await queryBuilder
      .orderBy('room.roomNumber', 'ASC')
      .limit(limit)
      .getMany();

    // Transform to SearchResult format
    return rooms.map(room => ({
      type: 'room' as const,
      id: room.id,
      name: `${room.roomNumber} - ${room.name}`,
      description: `${room.type} in ${room.building.name} (Floor ${room.floor})`,
      building: room.building.name,
      floor: room.floor,
      coordinates: this.parsePointGeometry(room.centerPoint),
      relevance: this.calculateRelevance(room, q),
    }));
  }

  async findRoomsByType(type: string, buildingId?: string): Promise<Room[]> {
    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.building', 'building')
      .where('room.type = :type', { type });

    if (buildingId) {
      queryBuilder.andWhere('room.buildingId = :buildingId', { buildingId });
    }

    return queryBuilder
      .orderBy('room.roomNumber', 'ASC')
      .getMany();
  }

  async findRoomsWithAmenity(amenity: string, buildingId?: string): Promise<Room[]> {
    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.building', 'building')
      .where(':amenity = ANY(room.amenities)', { amenity });

    if (buildingId) {
      queryBuilder.andWhere('room.buildingId = :buildingId', { buildingId });
    }

    return queryBuilder
      .orderBy('room.roomNumber', 'ASC')
      .getMany();
  }

  async findAccessibleRooms(buildingId?: string): Promise<Room[]> {
    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.building', 'building')
      .where("room.accessibility->>'wheelchairAccessible' = 'true'");

    if (buildingId) {
      queryBuilder.andWhere('room.buildingId = :buildingId', { buildingId });
    }

    return queryBuilder
      .orderBy('room.roomNumber', 'ASC')
      .getMany();
  }

  async findRoomsNearPoint(lat: number, lng: number, radiusMeters: number = 100): Promise<Room[]> {
    return this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.building', 'building')
      .where(
        'ST_DWithin(room.centerPoint, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius)',
        { lng, lat, radius: radiusMeters }
      )
      .orderBy(
        'ST_Distance(room.centerPoint, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))',
        'ASC'
      )
      .getMany();
  }

  private parsePointGeometry(geometryString: string): { lat: number; lng: number } {
    // Parse PostGIS point geometry string (e.g., "POINT(-123.1207 49.2827)")
    try {
      const match = geometryString.match(/POINT\(([^)]+)\)/);
      if (match) {
        const [lng, lat] = match[1].split(' ').map(Number);
        return { lat, lng };
      }
    } catch (error) {
      console.error('Error parsing point geometry:', error);
    }
    
    // Return default coordinates if parsing fails
    return { lat: 0, lng: 0 };
  }

  private calculateRelevance(room: Room, query?: string): number {
    if (!query) return 1;

    const queryLower = query.toLowerCase();
    let relevance = 0;

    // Exact match on room number gets highest score
    if (room.roomNumber.toLowerCase() === queryLower) {
      relevance += 100;
    } else if (room.roomNumber.toLowerCase().includes(queryLower)) {
      relevance += 50;
    }

    // Exact match on name gets high score
    if (room.name.toLowerCase() === queryLower) {
      relevance += 80;
    } else if (room.name.toLowerCase().includes(queryLower)) {
      relevance += 30;
    }

    // Type match
    if (room.type.toLowerCase().includes(queryLower)) {
      relevance += 20;
    }

    // Amenities match
    if (room.amenities.some(amenity => amenity.toLowerCase().includes(queryLower))) {
      relevance += 10;
    }

    return Math.max(relevance, 1); // Minimum relevance of 1
  }
}