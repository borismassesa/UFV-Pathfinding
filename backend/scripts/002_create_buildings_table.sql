-- UFV Pathfinding Database - Migration 002
-- Create buildings table

CREATE TABLE spatial.buildings (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(10),
    address VARCHAR(500),
    description TEXT,
    total_floors INTEGER NOT NULL DEFAULT 1 CHECK (total_floors >= 1 AND total_floors <= 50),
    is_accessible BOOLEAN NOT NULL DEFAULT true,
    operating_hours VARCHAR(255),
    contact_info JSONB DEFAULT '{}',
    geometry GEOMETRY(POLYGON, 4326),
    centroid_x DECIMAL(12, 8),
    centroid_y DECIMAL(12, 8),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_buildings_name ON spatial.buildings (name);
CREATE UNIQUE INDEX idx_buildings_short_name ON spatial.buildings (short_name) WHERE short_name IS NOT NULL;
CREATE INDEX idx_buildings_is_accessible ON spatial.buildings (is_accessible);
CREATE INDEX idx_buildings_geometry ON spatial.buildings USING GIST (geometry) WHERE geometry IS NOT NULL;

-- Create trigger for updated_at
CREATE TRIGGER trigger_buildings_updated_at
    BEFORE UPDATE ON spatial.buildings
    FOR EACH ROW
    EXECUTE FUNCTION spatial.update_updated_at_column();

-- Add comments
COMMENT ON TABLE spatial.buildings IS 'UFV campus buildings';
COMMENT ON COLUMN spatial.buildings.id IS 'Unique building identifier (e.g., T, A, B)';
COMMENT ON COLUMN spatial.buildings.name IS 'Full building name';
COMMENT ON COLUMN spatial.buildings.short_name IS 'Short building code';
COMMENT ON COLUMN spatial.buildings.total_floors IS 'Number of floors in the building';
COMMENT ON COLUMN spatial.buildings.is_accessible IS 'Whether the building has accessibility features';
COMMENT ON COLUMN spatial.buildings.geometry IS 'Building footprint polygon';
COMMENT ON COLUMN spatial.buildings.centroid_x IS 'Building center X coordinate';
COMMENT ON COLUMN spatial.buildings.centroid_y IS 'Building center Y coordinate';
COMMENT ON COLUMN spatial.buildings.metadata IS 'Additional building metadata';

-- Insert sample building data
INSERT INTO spatial.buildings (
    id, name, short_name, total_floors, is_accessible, 
    operating_hours, description, metadata
) VALUES (
    'T', 
    'UFV Building T', 
    'T', 
    1, 
    true,
    'Monday-Friday: 6:00 AM - 10:00 PM, Saturday-Sunday: 8:00 AM - 6:00 PM',
    'Main academic building with classrooms, labs, and offices',
    '{"coordinate_system": "EPSG:26910", "processed_date": "2024-01-15"}'
) ON CONFLICT (id) DO NOTHING; 