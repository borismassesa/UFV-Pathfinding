// Indoor Navigation Configuration for UFV Building T
// Using real shapefile data instead of external mapping services

// Mapbox access token (for future outdoor integration)
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiYm9yaXNtYXNzZXNhIiwiYSI6ImNtYmM0eXp4bDBzb3cyanExM2hycXh5eTcifQ.8enmu7F2iibuyoAswRn8YA';

// Initialize mapbox (simplified for indoor navigation)
export const initializeMapbox = () => {
  // For indoor navigation, we use the real shapefile data instead of Mapbox
  console.log('🏢 UFV Indoor Navigation initialized with real shapefile data');
  console.log('🗺️ Using BuildingTRooms.shp coordinate system: EPSG:26910 (NAD83 / UTM zone 10N)');
};

// UFV Campus coordinates (for outdoor context)
export const UFV_CAMPUS_COORDINATES = {
  ABBOTSFORD: {
    longitude: -122.286052,
    latitude: 49.028138,
  },
  BUILDING_T: {
    // Center of Building T from your shapefile data
    longitude: -122.286052,
    latitude: 49.028138,
    // UTM coordinates from your real data
    utm_x: 552312.85,
    utm_y: 5430800.49,
  },
};

// Real Building T data bounds (from your processed shapefile)
export const BUILDING_T_BOUNDS = {
  minX: 552297.1,
  maxX: 552321.7,
  minY: 5430792.2,
  maxY: 5430816.5,
  centerX: 552309.4,
  centerY: 5430804.35,
};

// Default map settings for indoor floor plan
export const DEFAULT_MAP_SETTINGS = {
  zoom: 1.2,
  pitch: 0,
  heading: 0,
  showCompass: true,
  showScale: true,
};

// Indoor navigation settings
export const INDOOR_NAV_SETTINGS = {
  roomLabelSize: 8,
  corridorWidth: 20,
  roomBorderWidth: 2,
  walkingSpeed: 1.4, // meters per second
  accessibilityMode: false,
};

export default {
  initializeMapbox,
  UFV_CAMPUS_COORDINATES,
  BUILDING_T_BOUNDS,
  DEFAULT_MAP_SETTINGS,
  INDOOR_NAV_SETTINGS,
}; 