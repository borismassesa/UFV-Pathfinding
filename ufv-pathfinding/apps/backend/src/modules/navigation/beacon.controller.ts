import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BeaconService, TriangulationResult } from './services/beacon.service';
import { BeaconDataDto } from './dto/navigation.dto';

@ApiTags('Beacons')
@Controller('beacons')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BeaconController {
  constructor(private readonly beaconService: BeaconService) {}

  @Get()
  @ApiOperation({ summary: 'Get all beacons' })
  @ApiQuery({ name: 'buildingId', description: 'Filter by building ID', required: false })
  @ApiQuery({ name: 'floor', description: 'Filter by floor number', required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Beacons retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          uuid: { type: 'string' },
          major: { type: 'number' },
          minor: { type: 'number' },
          name: { type: 'string' },
          description: { type: 'string' },
          location: { type: 'string' },
          floor: { type: 'number' },
          building: { type: 'object' },
          txPower: { type: 'number' },
          accuracy: { type: 'number' },
          status: { type: 'string' },
          active: { type: 'boolean' },
          lastSeenAt: { type: 'string' },
        },
      },
    },
  })
  async getAllBeacons(
    @Query('buildingId') buildingId?: string,
    @Query('floor') floor?: number,
  ) {
    return this.beaconService.findAll(buildingId, floor);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find beacons near location' })
  @ApiQuery({ name: 'lat', description: 'Latitude' })
  @ApiQuery({ name: 'lng', description: 'Longitude' })
  @ApiQuery({ name: 'radius', description: 'Search radius in meters', required: false })
  @ApiResponse({ status: 200, description: 'Nearby beacons found' })
  async findNearbyBeacons(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 100,
  ) {
    return this.beaconService.findNearbyBeacons(lat, lng, radius);
  }

  @Get('uuid/:uuid')
  @ApiOperation({ summary: 'Get beacons by UUID' })
  @ApiQuery({ name: 'major', description: 'Major value', required: false })
  @ApiQuery({ name: 'minor', description: 'Minor value', required: false })
  @ApiResponse({ status: 200, description: 'Beacons found by UUID' })
  async getBeaconsByUuid(
    @Param('uuid') uuid: string,
    @Query('major') major?: number,
    @Query('minor') minor?: number,
  ) {
    return this.beaconService.findByUuid(uuid, major, minor);
  }

  @Post('triangulate')
  @ApiOperation({ summary: 'Calculate position from beacon scans' })
  @ApiBody({
    description: 'Array of beacon scan data',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          uuid: { type: 'string' },
          major: { type: 'number' },
          minor: { type: 'number' },
          rssi: { type: 'number' },
          accuracy: { type: 'number' },
        },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Position calculated successfully',
    schema: {
      type: 'object',
      properties: {
        coordinates: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
          },
        },
        accuracy: { type: 'number' },
        confidence: { type: 'number' },
        beaconsUsed: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Insufficient beacon data for triangulation' })
  async triangulatePosition(@Body() beaconScans: BeaconDataDto[]): Promise<TriangulationResult | { error: string; message: string }> {
    const result = await this.beaconService.processBeaconScans(beaconScans);
    
    if (!result) {
      return {
        error: 'Unable to calculate position',
        message: 'Insufficient beacon data or no matching beacons found',
      };
    }

    return result;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get beacon statistics' })
  @ApiQuery({ name: 'buildingId', description: 'Filter by building ID', required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Beacon statistics',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        active: { type: 'number' },
        inactive: { type: 'number' },
        maintenance: { type: 'number' },
        recentlySeen: { type: 'number' },
        coverage: { type: 'number' },
      },
    },
  })
  async getBeaconStats(@Query('buildingId') buildingId?: string) {
    return this.beaconService.getBeaconStats(buildingId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get beacon by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Beacon found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        uuid: { type: 'string' },
        major: { type: 'number' },
        minor: { type: 'number' },
        name: { type: 'string' },
        description: { type: 'string' },
        location: { type: 'string' },
        floor: { type: 'number' },
        building: { type: 'object' },
        txPower: { type: 'number' },
        accuracy: { type: 'number' },
        status: { type: 'string' },
        metadata: { type: 'object' },
        active: { type: 'boolean' },
        lastSeenAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Beacon not found' })
  async getBeaconById(@Param('id') id: string) {
    return this.beaconService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new beacon' })
  @ApiBody({
    description: 'Beacon data',
    schema: {
      type: 'object',
      properties: {
        uuid: { type: 'string' },
        major: { type: 'number' },
        minor: { type: 'number' },
        name: { type: 'string' },
        description: { type: 'string' },
        location: { type: 'string' },
        floor: { type: 'number' },
        buildingId: { type: 'string' },
        txPower: { type: 'number' },
        accuracy: { type: 'number' },
        status: { type: 'string' },
        metadata: { type: 'object' },
      },
      required: ['uuid', 'major', 'minor', 'name', 'location', 'floor', 'buildingId'],
    },
  })
  @ApiResponse({ status: 201, description: 'Beacon created successfully' })
  async createBeacon(@Body() beaconData: any) {
    return this.beaconService.create(beaconData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update beacon' })
  @ApiBody({
    description: 'Updated beacon data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        location: { type: 'string' },
        floor: { type: 'number' },
        txPower: { type: 'number' },
        accuracy: { type: 'number' },
        status: { type: 'string' },
        metadata: { type: 'object' },
        active: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Beacon updated successfully' })
  @ApiResponse({ status: 404, description: 'Beacon not found' })
  async updateBeacon(@Param('id') id: string, @Body() beaconData: any) {
    return this.beaconService.update(id, beaconData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete beacon' })
  @ApiResponse({ status: 200, description: 'Beacon deleted successfully' })
  @ApiResponse({ status: 404, description: 'Beacon not found' })
  async deleteBeacon(@Param('id') id: string) {
    await this.beaconService.delete(id);
    return { message: 'Beacon deleted successfully' };
  }
}