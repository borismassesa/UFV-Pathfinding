-- UFV Pathfinding Database - Migration 001
-- Create spatial extensions and schema

-- Create PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create spatial schema
CREATE SCHEMA IF NOT EXISTS spatial;

-- Grant permissions
GRANT USAGE ON SCHEMA spatial TO PUBLIC;
GRANT CREATE ON SCHEMA spatial TO postgres;

-- Create ENUM types for the application
CREATE TYPE spatial.room_type_enum AS ENUM (
    'classroom',
    'office',
    'laboratory', 
    'library',
    'restroom',
    'cafeteria',
    'auditorium',
    'meeting_room',
    'storage',
    'utility',
    'emergency',
    'entrance',
    'hallway',
    'stairway',
    'elevator',
    'unknown'
);

CREATE TYPE spatial.node_type_enum AS ENUM (
    'room_center',
    'doorway',
    'hallway_intersection',
    'elevator',
    'stairway', 
    'emergency_exit',
    'entrance',
    'junction'
);

CREATE TYPE spatial.edge_type_enum AS ENUM (
    'horizontal',
    'vertical',
    'doorway',
    'hallway',
    'outdoor',
    'emergency'
);

CREATE TYPE spatial.surface_type_enum AS ENUM (
    'smooth',
    'rough', 
    'carpet',
    'tile',
    'concrete',
    'gravel',
    'grass',
    'stairs'
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION spatial.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

COMMENT ON SCHEMA spatial IS 'UFV Pathfinding spatial data schema';
COMMENT ON FUNCTION spatial.update_updated_at_column() IS 'Updates the updated_at column to current timestamp'; 