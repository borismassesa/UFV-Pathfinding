import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested, IsUUID, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import type { Coordinates, UserPreferences, WalkingSpeed } from '@ufv-pathfinding/shared';

export class CoordinatesDto {
  @ApiProperty({ description: 'Latitude', example: 49.2827 })
  @IsNumber()
  lat: number;

  @ApiProperty({ description: 'Longitude', example: -123.1207 })
  @IsNumber()
  lng: number;
}

export class UserPreferencesDto {
  @ApiProperty({ description: 'Avoid stairs', default: false })
  @IsOptional()
  @IsBoolean()
  avoidStairs?: boolean;

  @ApiProperty({ description: 'Prefer elevator', default: false })
  @IsOptional()
  @IsBoolean()
  preferElevator?: boolean;

  @ApiProperty({ description: 'Accessible routes only', default: false })
  @IsOptional()
  @IsBoolean()
  accessibleOnly?: boolean;

  @ApiProperty({ description: 'Avoid crowded areas', default: false })
  @IsOptional()
  @IsBoolean()
  avoidCrowdedAreas?: boolean;

  @ApiProperty({ 
    description: 'Preferred walking speed',
    enum: ['slow', 'normal', 'fast'],
    default: 'normal'
  })
  @IsOptional()
  @IsEnum(['slow', 'normal', 'fast'])
  preferredWalkingSpeed?: WalkingSpeed;
}

export class RouteRequestDto {
  @ApiProperty({ 
    description: 'Starting location coordinates',
    type: CoordinatesDto
  })
  @ValidateNested()
  @Type(() => CoordinatesDto)
  from: CoordinatesDto;

  @ApiProperty({ 
    description: 'Destination coordinates',
    type: CoordinatesDto
  })
  @ValidateNested()
  @Type(() => CoordinatesDto)
  to: CoordinatesDto;

  @ApiProperty({ 
    description: 'User navigation preferences',
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserPreferencesDto)
  preferences?: UserPreferencesDto;
}

export class LocationUpdateDto {
  @ApiProperty({ 
    description: 'Current coordinates',
    type: CoordinatesDto
  })
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates: CoordinatesDto;

  @ApiProperty({ description: 'Floor number' })
  @IsNumber()
  floor: number;

  @ApiProperty({ description: 'Building identifier' })
  @IsString()
  building: string;

  @ApiProperty({ description: 'Location accuracy in meters' })
  @IsNumber()
  accuracy: number;

  @ApiProperty({ 
    description: 'Location source',
    enum: ['gps', 'beacon', 'wifi', 'manual', 'qr_code']
  })
  @IsEnum(['gps', 'beacon', 'wifi', 'manual', 'qr_code'])
  source: string;
}

export class RoomSearchDto {
  @ApiProperty({ 
    description: 'Search query (room number, name, or keyword)',
    example: 'T101'
  })
  @IsString()
  q: string;

  @ApiProperty({ 
    description: 'Building ID to search within',
    required: false
  })
  @IsOptional()
  @IsUUID()
  buildingId?: string;

  @ApiProperty({ 
    description: 'Floor number to search within',
    required: false
  })
  @IsOptional()
  @IsNumber()
  floor?: number;

  @ApiProperty({ 
    description: 'Room type filter',
    required: false
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ 
    description: 'Maximum number of results',
    default: 20
  })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class BeaconDataDto {
  @ApiProperty({ description: 'Beacon UUID' })
  @IsString()
  uuid: string;

  @ApiProperty({ description: 'Beacon major value' })
  @IsNumber()
  major: number;

  @ApiProperty({ description: 'Beacon minor value' })
  @IsNumber()
  minor: number;

  @ApiProperty({ description: 'Received signal strength indicator' })
  @IsNumber()
  rssi: number;

  @ApiProperty({ description: 'Estimated accuracy in meters' })
  @IsNumber()
  accuracy: number;
}

export class NavigationAnalyticsDto {
  @ApiProperty({ 
    description: 'Event type',
    example: 'route_request'
  })
  @IsString()
  eventType: string;

  @ApiProperty({ 
    description: 'Event data',
    example: { fromRoom: 'T101', toRoom: 'T201', duration: 120 }
  })
  data: Record<string, any>;
}