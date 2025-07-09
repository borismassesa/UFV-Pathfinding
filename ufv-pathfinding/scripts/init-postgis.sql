-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;

-- Create spatial reference systems
INSERT INTO spatial_ref_sys (srid, auth_name, auth_srid, proj4text, srtext) 
SELECT 26910, 'EPSG', 26910, '+proj=utm +zone=10 +ellps=GRS80 +datum=NAD83 +units=m +no_defs', 'PROJCS["NAD83 / UTM zone 10N",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6269"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4269"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-123],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],AUTHORITY["EPSG","26910"]]'
WHERE NOT EXISTS (SELECT 1 FROM spatial_ref_sys WHERE srid = 26910);

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE ufv_pathfinding_db TO ufv_pathfinding;
GRANT ALL ON SCHEMA public TO ufv_pathfinding;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ufv_pathfinding;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ufv_pathfinding;

-- Create database functions for pathfinding
CREATE OR REPLACE FUNCTION calculate_distance(point1 geometry, point2 geometry)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ST_Distance(point1, point2);
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION points_within_distance(center_point geometry, max_distance DECIMAL)
RETURNS TABLE(id UUID, location geometry, distance DECIMAL) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.location,
        ST_Distance(center_point, n.location) as distance
    FROM navigation_nodes n
    WHERE ST_DWithin(center_point, n.location, max_distance)
    ORDER BY ST_Distance(center_point, n.location);
END;
$$ LANGUAGE plpgsql STABLE;

-- Full-text search function
CREATE OR REPLACE FUNCTION update_room_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.room_number, '') || ' ' ||
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.type, '') || ' ' ||
        array_to_string(NEW.amenities, ' ')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Performance optimization indexes will be created after table creation