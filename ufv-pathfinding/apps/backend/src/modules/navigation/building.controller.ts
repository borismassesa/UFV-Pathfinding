import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import { BuildingService } from './services/building.service';

@ApiTags('Buildings')
@Controller('buildings')
export class BuildingController {
  constructor(private readonly buildingService: BuildingService) {}

  @Get()
  @ApiOperation({ summary: 'Get all buildings' })
  @ApiResponse({ 
    status: 200, 
    description: 'Buildings retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          code: { type: 'string' },
          campus: { type: 'string' },
          location: { type: 'string' },
          floors: { type: 'array' },
          accessibility: { type: 'object' },
        },
      },
    },
  })
  async getAllBuildings() {
    return this.buildingService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search buildings' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchBuildings(@Query('q') query: string) {
    return this.buildingService.searchBuildings(query);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find buildings near location' })
  @ApiQuery({ name: 'lat', description: 'Latitude' })
  @ApiQuery({ name: 'lng', description: 'Longitude' })
  @ApiQuery({ name: 'radius', description: 'Search radius in kilometers', required: false })
  @ApiResponse({ status: 200, description: 'Nearby buildings found' })
  async findNearbyBuildings(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 1,
  ) {
    return this.buildingService.getBuildingsNearLocation(lat, lng, radius);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get building by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Building found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        code: { type: 'string' },
        campus: { type: 'string' },
        location: { type: 'string' },
        floors: { type: 'array' },
        rooms: { type: 'array' },
        entrances: { type: 'array' },
        navigationNodes: { type: 'array' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Building not found' })
  async getBuildingById(@Param('id') id: string) {
    return this.buildingService.findById(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get building by code' })
  @ApiResponse({ status: 200, description: 'Building found' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  async getBuildingByCode(@Param('code') code: string) {
    return this.buildingService.findByCode(code);
  }

  @Get(':id/entrances')
  @ApiOperation({ summary: 'Get building entrances' })
  @ApiResponse({ 
    status: 200, 
    description: 'Building entrances retrieved',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          location: { type: 'string' },
          accessible: { type: 'boolean' },
          mainEntrance: { type: 'boolean' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Building not found' })
  async getBuildingEntrances(@Param('id') id: string) {
    return this.buildingService.getEntrances(id);
  }

  @Get(':id/entrances/main')
  @ApiOperation({ summary: 'Get main building entrance' })
  @ApiResponse({ status: 200, description: 'Main entrance found' })
  @ApiResponse({ status: 404, description: 'Building or main entrance not found' })
  async getMainEntrance(@Param('id') id: string) {
    return this.buildingService.getMainEntrance(id);
  }

  @Get(':id/entrances/accessible')
  @ApiOperation({ summary: 'Get accessible building entrances' })
  @ApiResponse({ status: 200, description: 'Accessible entrances found' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  async getAccessibleEntrances(@Param('id') id: string) {
    return this.buildingService.getAccessibleEntrances(id);
  }
}