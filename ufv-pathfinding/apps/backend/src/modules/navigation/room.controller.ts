import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import { RoomService } from './services/room.service';
import { RoomSearchDto } from './dto/navigation.dto';

@ApiTags('Rooms')
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  @ApiOperation({ summary: 'Get all rooms' })
  @ApiQuery({ name: 'buildingId', description: 'Filter by building ID', required: false })
  @ApiQuery({ name: 'floor', description: 'Filter by floor number', required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Rooms retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          roomNumber: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          floor: { type: 'number' },
          building: { type: 'object' },
          centerPoint: { type: 'string' },
          area: { type: 'number' },
          capacity: { type: 'number' },
          accessibility: { type: 'object' },
          amenities: { type: 'array' },
        },
      },
    },
  })
  async getAllRooms(
    @Query('buildingId') buildingId?: string,
    @Query('floor') floor?: number,
  ) {
    return this.roomService.findAll(buildingId, floor);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search rooms' })
  @ApiQuery({ name: 'q', description: 'Search query (room number, name, or keyword)' })
  @ApiQuery({ name: 'buildingId', description: 'Filter by building ID', required: false })
  @ApiQuery({ name: 'floor', description: 'Filter by floor number', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by room type', required: false })
  @ApiQuery({ name: 'limit', description: 'Maximum number of results', required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', example: 'room' },
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          building: { type: 'string' },
          floor: { type: 'number' },
          coordinates: { type: 'object' },
          relevance: { type: 'number' },
        },
      },
    },
  })
  async searchRooms(
    @Query('q') q: string,
    @Query('buildingId') buildingId?: string,
    @Query('floor') floor?: number,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
  ) {
    const searchDto: RoomSearchDto = { q, buildingId, floor, type, limit };
    return this.roomService.searchRooms(searchDto);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find rooms near location' })
  @ApiQuery({ name: 'lat', description: 'Latitude' })
  @ApiQuery({ name: 'lng', description: 'Longitude' })
  @ApiQuery({ name: 'radius', description: 'Search radius in meters', required: false })
  @ApiResponse({ status: 200, description: 'Nearby rooms found' })
  async findNearbyRooms(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 100,
  ) {
    return this.roomService.findRoomsNearPoint(lat, lng, radius);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get rooms by type' })
  @ApiQuery({ name: 'buildingId', description: 'Filter by building ID', required: false })
  @ApiResponse({ status: 200, description: 'Rooms found by type' })
  async getRoomsByType(
    @Param('type') type: string,
    @Query('buildingId') buildingId?: string,
  ) {
    return this.roomService.findRoomsByType(type, buildingId);
  }

  @Get('amenity/:amenity')
  @ApiOperation({ summary: 'Get rooms with specific amenity' })
  @ApiQuery({ name: 'buildingId', description: 'Filter by building ID', required: false })
  @ApiResponse({ status: 200, description: 'Rooms found with amenity' })
  async getRoomsWithAmenity(
    @Param('amenity') amenity: string,
    @Query('buildingId') buildingId?: string,
  ) {
    return this.roomService.findRoomsWithAmenity(amenity, buildingId);
  }

  @Get('accessible')
  @ApiOperation({ summary: 'Get accessible rooms' })
  @ApiQuery({ name: 'buildingId', description: 'Filter by building ID', required: false })
  @ApiResponse({ status: 200, description: 'Accessible rooms found' })
  async getAccessibleRooms(@Query('buildingId') buildingId?: string) {
    return this.roomService.findAccessibleRooms(buildingId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Room found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        roomNumber: { type: 'string' },
        name: { type: 'string' },
        type: { type: 'string' },
        floor: { type: 'number' },
        building: { type: 'object' },
        geometry: { type: 'string' },
        centerPoint: { type: 'string' },
        area: { type: 'number' },
        capacity: { type: 'number' },
        accessibility: { type: 'object' },
        amenities: { type: 'array' },
        hours: { type: 'object' },
        metadata: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async getRoomById(@Param('id') id: string) {
    return this.roomService.findById(id);
  }
}