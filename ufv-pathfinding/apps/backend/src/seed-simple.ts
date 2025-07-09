import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🌱 Seeding database with Building T data...');

  try {
    // Insert Building T
    await dataSource.query(`
      INSERT INTO buildings (code, name, campus, location, floors, amenities)
      VALUES (
        'T',
        'Building T',
        'Chilliwack',
        ST_GeomFromText('POINT(-121.9447 49.0504)', 4326),
        '[{"level": 1, "name": "Ground Floor"}, {"level": 2, "name": "Second Floor"}, {"level": 3, "name": "Third Floor"}]'::jsonb,
        'wifi,parking,accessible_entrance,elevators'
      )
    `);

    // Get the building ID
    const buildingResult = await dataSource.query(`SELECT id FROM buildings WHERE code = 'T'`);
    const buildingId = buildingResult[0].id;

    console.log(`✅ Created Building T with ID: ${buildingId}`);

    // Insert sample rooms
    const rooms = [
      {
        roomNumber: 'T125',
        name: 'Computer Lab',
        floor: 1,
        type: 'lab',
        capacity: 30,
        amenities: 'computers,projector,whiteboard',
        centerPoint: 'POINT(-121.9447 49.0504)'
      },
      {
        roomNumber: 'T101',
        name: 'Lecture Hall',
        floor: 1,
        type: 'classroom',
        capacity: 100,
        amenities: 'projector,microphone,recording',
        centerPoint: 'POINT(-121.9446 49.0504)'
      },
      {
        roomNumber: 'T150',
        name: 'Student Lounge',
        floor: 1,
        type: 'common_area',
        capacity: 50,
        amenities: 'seating,vending_machines,microwave',
        centerPoint: 'POINT(-121.9448 49.0504)'
      },
      {
        roomNumber: 'T201',
        name: 'Faculty Office',
        floor: 2,
        type: 'office',
        capacity: 2,
        amenities: 'desk,computer',
        centerPoint: 'POINT(-121.9447 49.0504)'
      },
      {
        roomNumber: 'TWASH1',
        name: 'Washroom',
        floor: 1,
        type: 'washroom',
        capacity: 10,
        amenities: 'accessible,gender_neutral',
        centerPoint: 'POINT(-121.9447 49.0503)'
      }
    ];

    for (const room of rooms) {
      await dataSource.query(`
        INSERT INTO rooms ("roomNumber", name, "buildingId", floor, type, capacity, amenities, "centerPoint", geometry)
        VALUES (
          $1, $2, $3, $4, $5::rooms_type_enum, $6, $7,
          ST_GeomFromText($8, 4326),
          ST_Buffer(ST_GeomFromText($8, 4326), 0.00005)
        )
      `, [
        room.roomNumber,
        room.name,
        buildingId,
        room.floor,
        room.type,
        room.capacity,
        room.amenities,
        room.centerPoint
      ]);
    }

    console.log(`✅ Created ${rooms.length} rooms`);

    // Create main entrance
    await dataSource.query(`
      INSERT INTO building_entrances (name, "buildingId", location, accessible, "mainEntrance")
      VALUES (
        'Main Entrance',
        $1,
        ST_GeomFromText('POINT(-121.9447 49.0503)', 4326),
        true,
        true
      )
    `, [buildingId]);

    console.log('✅ Created main entrance');

    // Create navigation nodes
    const nodes = [
      { name: 'Main Entrance', type: 'entrance', floor: 1, location: 'POINT(-121.9447 49.0503)' },
      { name: 'Main Hallway', type: 'corridor', floor: 1, location: 'POINT(-121.9447 49.0504)' },
      { name: 'Stairway to Floor 2', type: 'stairs', floor: 1, location: 'POINT(-121.9447 49.0505)' },
      { name: 'Elevator', type: 'elevator', floor: 1, location: 'POINT(-121.9446 49.0505)' }
    ];

    const nodeIds = [];
    for (const node of nodes) {
      const result = await dataSource.query(`
        INSERT INTO navigation_nodes (name, "buildingId", floor, type, location)
        VALUES ($1, $2, $3, $4::navigation_nodes_type_enum, ST_GeomFromText($5, 4326))
        RETURNING id
      `, [node.name, buildingId, node.floor, node.type, node.location]);
      nodeIds.push(result[0].id);
    }

    console.log(`✅ Created ${nodes.length} navigation nodes`);

    // Create edges (connections)
    const edges = [
      { from: 0, to: 1, distance: 10, time: 15 }, // Entrance to hallway
      { from: 1, to: 2, distance: 20, time: 25 }, // Hallway to stairs
      { from: 1, to: 3, distance: 25, time: 30 }  // Hallway to elevator
    ];

    for (const edge of edges) {
      await dataSource.query(`
        INSERT INTO navigation_edges ("fromNodeId", "toNodeId", distance, "estimatedTime")
        VALUES ($1, $2, $3, $4)
      `, [nodeIds[edge.from], nodeIds[edge.to], edge.distance, edge.time]);
    }

    console.log(`✅ Created ${edges.length} navigation edges`);

    // Verify data was inserted
    const roomCount = await dataSource.query('SELECT COUNT(*) as count FROM rooms');
    const buildingCount = await dataSource.query('SELECT COUNT(*) as count FROM buildings');
    
    console.log('\n📊 Database seeded successfully!');
    console.log(`   - Buildings: ${buildingCount[0].count}`);
    console.log(`   - Rooms: ${roomCount[0].count}`);
    console.log('📍 Sample data is now available for the mobile app');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});