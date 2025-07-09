import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { User } from '../../entities/user.entity';
import { Building } from '../../entities/building.entity';
import { Room } from '../../entities/room.entity';
import { NavigationNode } from '../../entities/navigation-node.entity';
import { NavigationEdge } from '../../entities/navigation-edge.entity';
import { BuildingEntrance } from '../../entities/building-entrance.entity';
import { Beacon } from '../../entities/beacon.entity';

import { NavigationController } from './navigation.controller';
import { BuildingController } from './building.controller';
import { RoomController } from './room.controller';
import { BeaconController } from './beacon.controller';

import { NavigationService } from './services/navigation.service';
import { PathfindingService } from './services/pathfinding.service';
import { BuildingService } from './services/building.service';
import { RoomService } from './services/room.service';
import { BeaconService } from './services/beacon.service';
import { LocationTrackingService } from './services/location-tracking.service';

import { LocationGateway } from './gateways/location.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Building,
      Room,
      NavigationNode,
      NavigationEdge,
      BuildingEntrance,
      Beacon,
    ]),
    JwtModule.register({}), // Import JwtModule for WebSocket authentication
  ],
  controllers: [
    NavigationController,
    BuildingController,
    RoomController,
    BeaconController,
  ],
  providers: [
    NavigationService,
    PathfindingService,
    BuildingService,
    RoomService,
    BeaconService,
    LocationTrackingService,
    LocationGateway,
  ],
  exports: [
    NavigationService,
    PathfindingService,
    BuildingService,
    RoomService,
    BeaconService,
    LocationTrackingService,
    LocationGateway,
  ],
})
export class NavigationModule {}