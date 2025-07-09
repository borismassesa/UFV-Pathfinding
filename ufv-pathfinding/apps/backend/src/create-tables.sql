-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Drop and recreate ENUM types
DROP TYPE IF EXISTS "users_role_enum" CASCADE;
DROP TYPE IF EXISTS "rooms_type_enum" CASCADE;
DROP TYPE IF EXISTS "navigation_nodes_type_enum" CASCADE;
DROP TYPE IF EXISTS "navigation_edges_type_enum" CASCADE;
DROP TYPE IF EXISTS "beacons_status_enum" CASCADE;

CREATE TYPE "users_role_enum" AS ENUM('student', 'faculty', 'staff', 'visitor', 'admin');
CREATE TYPE "rooms_type_enum" AS ENUM('classroom', 'office', 'lab', 'study_room', 'washroom', 'utility', 'common_area', 'cafeteria', 'library', 'auditorium');
CREATE TYPE "navigation_nodes_type_enum" AS ENUM('room_entrance', 'corridor', 'intersection', 'stairs', 'elevator', 'entrance', 'exit');
CREATE TYPE "navigation_edges_type_enum" AS ENUM('corridor', 'stairs', 'elevator', 'ramp', 'outdoor');
CREATE TYPE "beacons_status_enum" AS ENUM('active', 'inactive', 'maintenance');

-- Drop existing tables if any
DROP TABLE IF EXISTS navigation_edges CASCADE;
DROP TABLE IF EXISTS beacons CASCADE;
DROP TABLE IF EXISTS navigation_nodes CASCADE;
DROP TABLE IF EXISTS building_entrances CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create buildings table
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    campus VARCHAR NOT NULL DEFAULT 'Chilliwack',
    location GEOMETRY(Point, 4326) NOT NULL,
    floors JSONB NOT NULL DEFAULT '[]',
    accessibility JSONB NOT NULL DEFAULT '{}',
    amenities TEXT NOT NULL DEFAULT '',
    metadata JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_buildings_code ON buildings(code);
CREATE INDEX idx_buildings_location ON buildings USING GIST(location);

-- Create rooms table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "roomNumber" VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    "buildingId" UUID NOT NULL REFERENCES buildings(id),
    floor INTEGER NOT NULL,
    type rooms_type_enum NOT NULL DEFAULT 'classroom',
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    "centerPoint" GEOMETRY(Point, 4326) NOT NULL,
    area NUMERIC(10,2),
    capacity INTEGER,
    accessibility JSONB NOT NULL DEFAULT '{}',
    amenities TEXT NOT NULL DEFAULT '',
    hours JSONB,
    metadata JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    "searchVector" TSVECTOR
);

CREATE INDEX idx_rooms_room_number ON rooms("roomNumber");
CREATE INDEX idx_rooms_geometry ON rooms USING GIST(geometry);
CREATE INDEX idx_rooms_center_point ON rooms USING GIST("centerPoint");
CREATE INDEX idx_rooms_search_vector ON rooms("searchVector");

-- Create building_entrances table
CREATE TABLE building_entrances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    "buildingId" UUID NOT NULL REFERENCES buildings(id),
    location GEOMETRY(Point, 4326) NOT NULL,
    accessible BOOLEAN NOT NULL DEFAULT false,
    "mainEntrance" BOOLEAN NOT NULL DEFAULT false,
    description VARCHAR,
    metadata JSONB,
    active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_building_entrances_location ON building_entrances USING GIST(location);

-- Create navigation_nodes table
CREATE TABLE navigation_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "buildingId" UUID NOT NULL REFERENCES buildings(id),
    floor INTEGER NOT NULL,
    type navigation_nodes_type_enum NOT NULL DEFAULT 'corridor',
    location GEOMETRY(Point, 4326) NOT NULL,
    name VARCHAR,
    description VARCHAR,
    metadata JSONB,
    active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_navigation_nodes_location ON navigation_nodes USING GIST(location);

-- Create navigation_edges table
CREATE TABLE navigation_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "fromNodeId" UUID NOT NULL REFERENCES navigation_nodes(id),
    "toNodeId" UUID NOT NULL REFERENCES navigation_nodes(id),
    distance NUMERIC(10,2) NOT NULL,
    "estimatedTime" INTEGER NOT NULL,
    type navigation_edges_type_enum NOT NULL DEFAULT 'corridor',
    accessible BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_navigation_edges_active ON navigation_edges(active);

-- Create beacons table
CREATE TABLE beacons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid VARCHAR NOT NULL UNIQUE,
    major INTEGER NOT NULL,
    minor INTEGER NOT NULL,
    name VARCHAR NOT NULL,
    description VARCHAR,
    location GEOMETRY(Point, 4326) NOT NULL,
    floor INTEGER NOT NULL,
    "buildingId" UUID NOT NULL REFERENCES buildings(id),
    "txPower" INTEGER NOT NULL DEFAULT -70,
    accuracy INTEGER NOT NULL DEFAULT 5,
    status beacons_status_enum NOT NULL DEFAULT 'active',
    metadata JSONB NOT NULL DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    "lastSeenAt" TIMESTAMP
);

CREATE INDEX idx_beacons_uuid ON beacons(uuid);
CREATE INDEX idx_beacons_name ON beacons(name);
CREATE INDEX idx_beacons_location ON beacons USING GIST(location);
CREATE INDEX idx_beacons_building_id ON beacons("buildingId");

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR NOT NULL UNIQUE,
    username VARCHAR NOT NULL UNIQUE,
    password VARCHAR NOT NULL,
    role users_role_enum NOT NULL DEFAULT 'student',
    profile JSONB NOT NULL DEFAULT '{}',
    preferences JSONB NOT NULL DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);