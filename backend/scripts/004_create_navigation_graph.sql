-- UFV Pathfinding Database - Migration 004
-- Create navigation graph tables (nodes and edges)

-- Create navigation_nodes table
CREATE TABLE spatial.navigation_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_type spatial.node_type_enum NOT NULL,
    building_id VARCHAR(50) NOT NULL REFERENCES spatial.buildings(id) ON DELETE CASCADE,
    floor_level INTEGER NOT NULL,
    x DECIMAL(12, 8) NOT NULL,
    y DECIMAL(12, 8) NOT NULL,
    room_id UUID REFERENCES spatial.rooms(id) ON DELETE SET NULL,
    name VARCHAR(255),
    description TEXT,
    is_accessible BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    accessibility_features TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create navigation_edges table
CREATE TABLE spatial.navigation_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_node_id UUID NOT NULL REFERENCES spatial.navigation_nodes(id) ON DELETE CASCADE,
    to_node_id UUID NOT NULL REFERENCES spatial.navigation_nodes(id) ON DELETE CASCADE,
    edge_type spatial.edge_type_enum NOT NULL,
    distance DECIMAL(10, 2) NOT NULL CHECK (distance >= 0),
    estimated_time INTEGER NOT NULL CHECK (estimated_time >= 0),
    is_accessible BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_bidirectional BOOLEAN NOT NULL DEFAULT true,
    difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 10),
    width DECIMAL(5, 2),
    surface_type spatial.surface_type_enum,
    incline DECIMAL(5, 2),
    accessibility_features TEXT[],
    restrictions TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent self-loops
    CONSTRAINT chk_no_self_loops CHECK (from_node_id != to_node_id)
);

-- Create indexes for navigation_nodes
CREATE INDEX idx_navigation_nodes_building_id ON spatial.navigation_nodes (building_id);
CREATE INDEX idx_navigation_nodes_floor_level ON spatial.navigation_nodes (floor_level);
CREATE INDEX idx_navigation_nodes_node_type ON spatial.navigation_nodes (node_type);
CREATE INDEX idx_navigation_nodes_room_id ON spatial.navigation_nodes (room_id);
CREATE INDEX idx_navigation_nodes_is_accessible ON spatial.navigation_nodes (is_accessible);
CREATE INDEX idx_navigation_nodes_is_active ON spatial.navigation_nodes (is_active);
CREATE INDEX idx_navigation_nodes_building_floor ON spatial.navigation_nodes (building_id, floor_level);
CREATE INDEX idx_navigation_nodes_coordinates ON spatial.navigation_nodes (x, y);

-- Create indexes for navigation_edges
CREATE INDEX idx_navigation_edges_from_node_id ON spatial.navigation_edges (from_node_id);
CREATE INDEX idx_navigation_edges_to_node_id ON spatial.navigation_edges (to_node_id);
CREATE INDEX idx_navigation_edges_edge_type ON spatial.navigation_edges (edge_type);
CREATE INDEX idx_navigation_edges_is_accessible ON spatial.navigation_edges (is_accessible);
CREATE INDEX idx_navigation_edges_is_active ON spatial.navigation_edges (is_active);
CREATE INDEX idx_navigation_edges_distance ON spatial.navigation_edges (distance);
CREATE INDEX idx_navigation_edges_pathfinding ON spatial.navigation_edges (from_node_id, is_active, is_accessible);
CREATE INDEX idx_navigation_edges_bidirectional ON spatial.navigation_edges (to_node_id, is_active, is_accessible);
CREATE UNIQUE INDEX idx_navigation_edges_unique ON spatial.navigation_edges (from_node_id, to_node_id);

-- Create triggers for updated_at
CREATE TRIGGER trigger_navigation_nodes_updated_at
    BEFORE UPDATE ON spatial.navigation_nodes
    FOR EACH ROW
    EXECUTE FUNCTION spatial.update_updated_at_column();

CREATE TRIGGER trigger_navigation_edges_updated_at
    BEFORE UPDATE ON spatial.navigation_edges
    FOR EACH ROW
    EXECUTE FUNCTION spatial.update_updated_at_column();

-- Add comments
COMMENT ON TABLE spatial.navigation_nodes IS 'Navigation graph nodes for pathfinding';
COMMENT ON COLUMN spatial.navigation_nodes.id IS 'Unique node identifier';
COMMENT ON COLUMN spatial.navigation_nodes.node_type IS 'Type of navigation node';
COMMENT ON COLUMN spatial.navigation_nodes.building_id IS 'Reference to building';
COMMENT ON COLUMN spatial.navigation_nodes.floor_level IS 'Floor number';
COMMENT ON COLUMN spatial.navigation_nodes.x IS 'X coordinate (UTM or local system)';
COMMENT ON COLUMN spatial.navigation_nodes.y IS 'Y coordinate (UTM or local system)';
COMMENT ON COLUMN spatial.navigation_nodes.room_id IS 'Associated room (if applicable)';
COMMENT ON COLUMN spatial.navigation_nodes.is_accessible IS 'Wheelchair accessible';
COMMENT ON COLUMN spatial.navigation_nodes.is_active IS 'Node is active for routing';
COMMENT ON COLUMN spatial.navigation_nodes.accessibility_features IS 'List of accessibility features';

COMMENT ON TABLE spatial.navigation_edges IS 'Navigation graph edges for pathfinding';
COMMENT ON COLUMN spatial.navigation_edges.id IS 'Unique edge identifier';
COMMENT ON COLUMN spatial.navigation_edges.from_node_id IS 'Starting node';
COMMENT ON COLUMN spatial.navigation_edges.to_node_id IS 'Ending node';
COMMENT ON COLUMN spatial.navigation_edges.edge_type IS 'Type of connection';
COMMENT ON COLUMN spatial.navigation_edges.distance IS 'Distance in meters';
COMMENT ON COLUMN spatial.navigation_edges.estimated_time IS 'Estimated traversal time in seconds';
COMMENT ON COLUMN spatial.navigation_edges.is_bidirectional IS 'Can be traversed in both directions';
COMMENT ON COLUMN spatial.navigation_edges.difficulty IS 'Difficulty level (1-10)';
COMMENT ON COLUMN spatial.navigation_edges.width IS 'Path width in meters';
COMMENT ON COLUMN spatial.navigation_edges.surface_type IS 'Surface material type';
COMMENT ON COLUMN spatial.navigation_edges.incline IS 'Incline in degrees (+ up, - down)';
COMMENT ON COLUMN spatial.navigation_edges.restrictions IS 'Access restrictions (e.g., staff_only)'; 