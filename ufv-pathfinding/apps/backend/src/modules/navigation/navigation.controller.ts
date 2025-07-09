import { Body, Controller, Get, Post, Query, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { NavigationService } from './services/navigation.service';
import { PathfindingService } from './services/pathfinding.service';
import { RouteRequestDto, LocationUpdateDto, NavigationAnalyticsDto } from './dto/navigation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser {
  user: any;
}

@ApiTags('Navigation')
@Controller('navigation')
export class NavigationController {
  constructor(
    private readonly navigationService: NavigationService,
    private readonly pathfindingService: PathfindingService,
  ) {}

  @Post('route')
  @ApiOperation({ summary: 'Calculate route between two points' })
  @ApiResponse({ 
    status: 200, 
    description: 'Route calculated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        from: { type: 'object' },
        to: { type: 'object' },
        path: { type: 'array' },
        totalDistance: { type: 'number' },
        estimatedTime: { type: 'number' },
        instructions: { type: 'array' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid route request' })
  async calculateRoute(@Body() routeRequest: RouteRequestDto) {
    return this.navigationService.calculateRoute(routeRequest);
  }

  @Post('route/authenticated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate route with user preferences' })
  @ApiResponse({ status: 200, description: 'Route calculated with user preferences' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async calculateRouteAuthenticated(
    @Body() routeRequest: RouteRequestDto,
    @Request() req: RequestWithUser,
  ) {
    return this.navigationService.calculateRoute(routeRequest, req.user.id);
  }

  @Post('location')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user location' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateLocation(
    @Body() locationUpdate: LocationUpdateDto,
    @Request() req: RequestWithUser,
  ) {
    await this.navigationService.updateUserLocation(req.user.id, locationUpdate);
    return { message: 'Location updated successfully' };
  }

  @Get('nodes')
  @ApiOperation({ summary: 'Get navigation nodes for a building' })
  @ApiQuery({ name: 'buildingId', description: 'Building ID' })
  @ApiQuery({ name: 'floor', description: 'Floor number', required: false })
  @ApiResponse({ status: 200, description: 'Navigation nodes retrieved successfully' })
  async getNavigationNodes(
    @Query('buildingId') buildingId: string,
    @Query('floor') floor?: number,
  ) {
    return this.navigationService.getNavigationNodes(buildingId, floor);
  }

  @Get('nodes/nearby')
  @ApiOperation({ summary: 'Find nearby navigation nodes' })
  @ApiQuery({ name: 'lat', description: 'Latitude' })
  @ApiQuery({ name: 'lng', description: 'Longitude' })
  @ApiQuery({ name: 'radius', description: 'Search radius in meters', required: false })
  @ApiResponse({ status: 200, description: 'Nearby nodes found' })
  async findNearbyNodes(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 50,
  ) {
    return this.navigationService.findNearbyNodes(lat, lng, radius);
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user favorite rooms' })
  @ApiResponse({ status: 200, description: 'Favorite rooms retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFavoriteRooms(@Request() req: RequestWithUser) {
    return this.navigationService.getFavoriteRooms(req.user.id);
  }

  @Post('favorites/:roomId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add room to favorites' })
  @ApiResponse({ status: 200, description: 'Room added to favorites' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async addFavoriteRoom(
    @Param('roomId') roomId: string,
    @Request() req: RequestWithUser,
  ) {
    await this.navigationService.addFavoriteRoom(req.user.id, roomId);
    return { message: 'Room added to favorites' };
  }

  @Post('favorites/:roomId/remove')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove room from favorites' })
  @ApiResponse({ status: 200, description: 'Room removed from favorites' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeFavoriteRoom(
    @Param('roomId') roomId: string,
    @Request() req: RequestWithUser,
  ) {
    await this.navigationService.removeFavoriteRoom(req.user.id, roomId);
    return { message: 'Room removed from favorites' };
  }

  @Get('recent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recent locations' })
  @ApiResponse({ status: 200, description: 'Recent locations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRecentLocations(@Request() req: RequestWithUser) {
    return this.navigationService.getRecentLocations(req.user.id);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user navigation statistics' })
  @ApiResponse({ status: 200, description: 'Navigation stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNavigationStats(@Request() req: RequestWithUser) {
    return this.navigationService.getNavigationStats(req.user.id);
  }

  @Post('analytics/track')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track navigation analytics event' })
  @ApiResponse({ status: 200, description: 'Event tracked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async trackEvent(
    @Body() analyticsData: NavigationAnalyticsDto,
    @Request() req: RequestWithUser,
  ) {
    await this.navigationService.trackEvent(
      req.user.id,
      analyticsData.eventType,
      analyticsData.data,
    );
    return { message: 'Event tracked successfully' };
  }
}