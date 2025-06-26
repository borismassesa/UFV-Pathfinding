-- UFV Pathfinding Database - Migration 003
-- Create rooms table

CREATE TABLE spatial.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number VARCHAR(50),
    room_name VARCHAR(255),
    building_id VARCHAR(50) NOT NULL REFERENCES spatial.buildings(id) ON DELETE CASCADE,
    floor_level INTEGER NOT NULL DEFAULT 1,
    room_type spatial.room_type_enum NOT NULL DEFAULT 'unknown',
    area_sqm DECIMAL(10, 2) NOT NULL CHECK (area_sqm >= 0),
    centroid_x DECIMAL(12, 8) NOT NULL,
    centroid_y DECIMAL(12, 8) NOT NULL,
    is_accessible BOOLEAN NOT NULL DEFAULT true,
    geometry GEOMETRY(POLYGON, 4326) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_rooms_building_id ON spatial.rooms (building_id);
CREATE INDEX idx_rooms_floor_level ON spatial.rooms (floor_level);
CREATE INDEX idx_rooms_room_type ON spatial.rooms (room_type);
CREATE UNIQUE INDEX idx_rooms_room_number ON spatial.rooms (room_number) WHERE room_number IS NOT NULL;
CREATE INDEX idx_rooms_is_accessible ON spatial.rooms (is_accessible);
CREATE INDEX idx_rooms_geometry ON spatial.rooms USING GIST (geometry);
CREATE INDEX idx_rooms_building_floor ON spatial.rooms (building_id, floor_level);

-- Create trigger for updated_at
CREATE TRIGGER trigger_rooms_updated_at
    BEFORE UPDATE ON spatial.rooms
    FOR EACH ROW
    EXECUTE FUNCTION spatial.update_updated_at_column();

-- Add comments
COMMENT ON TABLE spatial.rooms IS 'Individual rooms within buildings';
COMMENT ON COLUMN spatial.rooms.id IS 'Unique room identifier (UUID)';
COMMENT ON COLUMN spatial.rooms.room_number IS 'Room number (e.g., T001, T002)';
COMMENT ON COLUMN spatial.rooms.room_name IS 'Descriptive room name';
COMMENT ON COLUMN spatial.rooms.building_id IS 'Reference to building';
COMMENT ON COLUMN spatial.rooms.floor_level IS 'Floor number (1-based)';
COMMENT ON COLUMN spatial.rooms.room_type IS 'Type of room (classroom, office, etc.)';
COMMENT ON COLUMN spatial.rooms.area_sqm IS 'Room area in square meters';
COMMENT ON COLUMN spatial.rooms.centroid_x IS 'Room center X coordinate';
COMMENT ON COLUMN spatial.rooms.centroid_y IS 'Room center Y coordinate';
COMMENT ON COLUMN spatial.rooms.is_accessible IS 'Whether room is wheelchair accessible';
COMMENT ON COLUMN spatial.rooms.geometry IS 'Room boundary polygon';
COMMENT ON COLUMN spatial.rooms.metadata IS 'Additional room metadata (JSON)'; 