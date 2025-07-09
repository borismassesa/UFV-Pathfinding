import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepository } from 'typeorm';
import { Building } from './entities/building.entity';
import { Room } from './entities/room.entity';
import { NavigationNode } from './entities/navigation-node.entity';
import { NavigationEdge } from './entities/navigation-edge.entity';
import { BuildingEntrance } from './entities/building-entrance.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get repositories
  const buildingRepo = app.get('BuildingRepository');
  const roomRepo = app.get('RoomRepository');
  const nodeRepo = app.get('NavigationNodeRepository');
  const edgeRepo = app.get('NavigationEdgeRepository');
  const entranceRepo = app.get('BuildingEntranceRepository');

  console.log('🌱 Seeding database...');

  // Create Building T
  const buildingT = await buildingRepo.save({
    code: 'T',
    name: 'Building T',
    address: '45190 Caen Avenue, Chilliwack, BC',
    totalFloors: 3,
    coordinates: {
      type: 'Point',
      coordinates: [-121.9447, 49.0504]
    },
    outline: {
      type: 'Polygon',
      coordinates: [[
        [-121.9448, 49.0505],
        [-121.9446, 49.0505],
        [-121.9446, 49.0503],
        [-121.9448, 49.0503],
        [-121.9448, 49.0505]
      ]]
    }
  });

  // Create main entrance
  const mainEntrance = await entranceRepo.save({
    building: buildingT,
    name: 'Main Entrance',
    type: 'main',
    location: {
      type: 'Point',
      coordinates: [-121.9447, 49.0503]
    },
    isAccessible: true,
    floor: 1
  });

  // Create sample rooms
  const rooms = [
    {
      building: buildingT,
      roomNumber: 'T125',
      name: 'Computer Lab',
      type: 'classroom',
      floor: 1,
      capacity: 30,
      isAccessible: true,
      amenities: ['computers', 'projector', 'whiteboard'],
      coordinates: {
        type: 'Point',
        coordinates: [-121.9447, 49.0504]
      }
    },
    {
      building: buildingT,
      roomNumber: 'T101',
      name: 'Lecture Hall',
      type: 'classroom',
      floor: 1,
      capacity: 100,
      isAccessible: true,
      amenities: ['projector', 'microphone', 'recording'],
      coordinates: {
        type: 'Point',
        coordinates: [-121.9446, 49.0504]
      }
    },
    {
      building: buildingT,
      roomNumber: 'T150',
      name: 'Student Lounge',
      type: 'lounge',
      floor: 1,
      capacity: 50,
      isAccessible: true,
      amenities: ['seating', 'vending_machines', 'microwave'],
      coordinates: {
        type: 'Point',
        coordinates: [-121.9448, 49.0504]
      }
    },
    {
      building: buildingT,
      roomNumber: 'T201',
      name: 'Faculty Office',
      type: 'office',
      floor: 2,
      capacity: 2,
      isAccessible: true,
      amenities: ['desk', 'computer'],
      coordinates: {
        type: 'Point',
        coordinates: [-121.9447, 49.0504]
      }
    },
    {
      building: buildingT,
      roomNumber: 'TWASH1',
      name: 'Washroom',
      type: 'washroom',
      floor: 1,
      capacity: 10,
      isAccessible: true,
      amenities: ['accessible', 'gender_neutral'],
      coordinates: {
        type: 'Point',
        coordinates: [-121.9447, 49.0503]
      }
    }
  ];

  const savedRooms = [];
  for (const roomData of rooms) {
    const room = await roomRepo.save(roomData);
    savedRooms.push(room);
  }

  // Create navigation nodes
  const entranceNode = await nodeRepo.save({
    building: buildingT,
    type: 'entrance',
    floor: 1,
    location: {
      type: 'Point',
      coordinates: [-121.9447, 49.0503]
    },
    name: 'Main Entrance',
    isAccessible: true
  });

  const hallwayNode = await nodeRepo.save({
    building: buildingT,
    type: 'hallway',
    floor: 1,
    location: {
      type: 'Point',
      coordinates: [-121.9447, 49.0504]
    },
    name: 'Main Hallway',
    isAccessible: true
  });

  const stairNode = await nodeRepo.save({
    building: buildingT,
    type: 'stair',
    floor: 1,
    location: {
      type: 'Point',
      coordinates: [-121.9447, 49.0505]
    },
    name: 'Stairway to Floor 2',
    isAccessible: false
  });

  const elevatorNode = await nodeRepo.save({
    building: buildingT,
    type: 'elevator',
    floor: 1,
    location: {
      type: 'Point',
      coordinates: [-121.9446, 49.0505]
    },
    name: 'Elevator',
    isAccessible: true
  });

  // Create room nodes
  const roomNodes = [];
  for (const room of savedRooms) {
    const node = await nodeRepo.save({
      building: buildingT,
      room: room,
      type: 'room',
      floor: room.floor,
      location: room.coordinates,
      name: `${room.roomNumber} - ${room.name}`,
      isAccessible: room.isAccessible
    });
    roomNodes.push(node);
  }

  // Create navigation edges (connections between nodes)
  // Connect entrance to hallway
  await edgeRepo.save({
    startNode: entranceNode,
    endNode: hallwayNode,
    distance: 10,
    estimatedTime: 15,
    isAccessible: true,
    pathType: 'indoor'
  });

  // Connect hallway to rooms on floor 1
  for (const roomNode of roomNodes.filter(n => n.floor === 1)) {
    await edgeRepo.save({
      startNode: hallwayNode,
      endNode: roomNode,
      distance: 15,
      estimatedTime: 20,
      isAccessible: true,
      pathType: 'indoor'
    });
  }

  // Connect hallway to stairs and elevator
  await edgeRepo.save({
    startNode: hallwayNode,
    endNode: stairNode,
    distance: 20,
    estimatedTime: 25,
    isAccessible: false,
    pathType: 'indoor'
  });

  await edgeRepo.save({
    startNode: hallwayNode,
    endNode: elevatorNode,
    distance: 25,
    estimatedTime: 30,
    isAccessible: true,
    pathType: 'indoor'
  });

  console.log('✅ Database seeded successfully!');
  console.log(`   - Created building: ${buildingT.name}`);
  console.log(`   - Created ${savedRooms.length} rooms`);
  console.log(`   - Created ${roomNodes.length + 4} navigation nodes`);
  console.log('📍 Sample data is now available for the mobile app');

  await app.close();
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});