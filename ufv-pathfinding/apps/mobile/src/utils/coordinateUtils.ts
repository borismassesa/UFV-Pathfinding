// Coordinate conversion utilities for UFV Pathfinding

// UTM Zone 10N parameters (EPSG:26910) - used by UFV spatial data
const UTM_ZONE = 10;
const UTM_FALSE_EASTING = 500000;
const UTM_FALSE_NORTHING = 0;
const UTM_SCALE_FACTOR = 0.9996;
const EARTH_RADIUS = 6378137;
const EARTH_FLATTENING = 1/298.257223563;

// Central meridian for UTM Zone 10N
const CENTRAL_MERIDIAN = -123 * Math.PI / 180; // -123 degrees in radians

/**
 * Convert UTM coordinates (EPSG:26910) to Latitude/Longitude (WGS84)
 * UFV Building T rooms use UTM Zone 10N coordinates
 */
export function utmToLatLng(easting: number, northing: number): { latitude: number; longitude: number } {
  // Simplified conversion for UFV area
  // These are approximate formulas suitable for the UFV campus area
  
  // Remove false easting and northing
  const x = easting - UTM_FALSE_EASTING;
  const y = northing - UTM_FALSE_NORTHING;
  
  // Calculate longitude (simplified)
  const longitude = CENTRAL_MERIDIAN + (x / (UTM_SCALE_FACTOR * EARTH_RADIUS)) * (180 / Math.PI);
  
  // Calculate latitude (simplified)
  const latitude = (y / (UTM_SCALE_FACTOR * EARTH_RADIUS)) * (180 / Math.PI);
  
  return {
    latitude: latitude,
    longitude: longitude
  };
}

/**
 * Get UFV Building T bounds for map centering
 */
export function getBuildingTBounds(rooms: any[]) {
  const coordinates = rooms.map(room => utmToLatLng(room.centroid_x, room.centroid_y));
  
  const latitudes = coordinates.map(coord => coord.latitude);
  const longitudes = coordinates.map(coord => coord.longitude);
  
  return {
    center: {
      latitude: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
      longitude: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    },
    bounds: {
      north: Math.max(...latitudes),
      south: Math.min(...latitudes),
      east: Math.max(...longitudes),
      west: Math.min(...longitudes),
    }
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

export default {
  utmToLatLng,
  getBuildingTBounds,
  calculateDistance,
}; 