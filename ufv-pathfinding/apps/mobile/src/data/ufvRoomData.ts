// Real UFV Building T Room Data
// Based on actual coordinate data from UFV Building T

export interface UFVRoom {
  id: string;
  x: number;
  y: number;
  area: number;
  desc: string;
  type: 'academic' | 'office' | 'utility' | 'study' | 'washroom' | 'entrance' | 'hallway';
  floor: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  isAccessible: boolean;
  amenities?: string[];
}

// Convert UTM coordinates to approximate GPS coordinates for UFV Building T
const utmToGps = (x: number, y: number): { lat: number; lng: number } => {
  // Simplified conversion for UFV campus area
  const baseLat = 49.0504;
  const baseLng = -121.9447;
  const scaleX = 0.00001; // Approximate scale factors
  const scaleY = 0.00001;
  
  return {
    lat: baseLat + (y - 5430800) * scaleY,
    lng: baseLng + (x - 552312) * scaleX
  };
};

export const UFV_BUILDING_T_ROOMS: UFVRoom[] = [
  {
    id: "T001",
    x: 552312.848251,
    y: 5430800.48876,
    area: 372.48,
    desc: "Large Lecture Hall",
    type: "academic",
    floor: 1,
    coordinates: utmToGps(552312.848251, 5430800.48876),
    isAccessible: true,
    amenities: ["projector", "microphone", "recording", "100_seats"]
  },
  {
    id: "T002",
    x: 552297.100925,
    y: 5430796.951502,
    area: 9.05,
    desc: "Small Office",
    type: "office",
    floor: 1,
    coordinates: utmToGps(552297.100925, 5430796.951502),
    isAccessible: true,
    amenities: ["desk", "computer"]
  },
  {
    id: "T003",
    x: 552300.046514,
    y: 5430797.019896,
    area: 9.05,
    desc: "Small Office",
    type: "office",
    floor: 1,
    coordinates: utmToGps(552300.046514, 5430797.019896),
    isAccessible: true,
    amenities: ["desk", "computer"]
  },
  {
    id: "T004",
    x: 552302.992104,
    y: 5430797.08829,
    area: 9.05,
    desc: "Small Office",
    type: "office",
    floor: 1,
    coordinates: utmToGps(552302.992104, 5430797.08829),
    isAccessible: true,
    amenities: ["desk", "computer"]
  },
  {
    id: "T005",
    x: 552305.937694,
    y: 5430797.156684,
    area: 9.05,
    desc: "Small Office",
    type: "office",
    floor: 1,
    coordinates: utmToGps(552305.937694, 5430797.156684),
    isAccessible: true,
    amenities: ["desk", "computer"]
  },
  {
    id: "T006",
    x: 552308.881112,
    y: 5430797.225028,
    area: 9.06,
    desc: "Small Office",
    type: "office",
    floor: 1,
    coordinates: utmToGps(552308.881112, 5430797.225028),
    isAccessible: true,
    amenities: ["desk", "computer"]
  },
  {
    id: "T007",
    x: 552312.321022,
    y: 5430797.3049,
    area: 12.18,
    desc: "Medium Office",
    type: "office",
    floor: 1,
    coordinates: utmToGps(552312.321022, 5430797.3049),
    isAccessible: true,
    amenities: ["desk", "computer", "printer"]
  },
  {
    id: "T008",
    x: 552312.435118,
    y: 5430792.525814,
    area: 11.92,
    desc: "Medium Office",
    type: "office",
    floor: 1,
    coordinates: utmToGps(552312.435118, 5430792.525814),
    isAccessible: true,
    amenities: ["desk", "computer", "printer"]
  },
  {
    id: "T009",
    x: 552308.994252,
    y: 5430792.44592,
    area: 8.84,
    desc: "Small Office",
    type: "office",
    floor: 1,
    coordinates: utmToGps(552308.994252, 5430792.44592),
    isAccessible: true,
    amenities: ["desk", "computer"]
  },
  {
    id: "T010",
    x: 552306.048662,
    y: 5430792.377526,
    area: 8.84,
    desc: "Small Office",
    type: "office",
    floor: 1,
    coordinates: utmToGps(552306.048662, 5430792.377526),
    isAccessible: true,
    amenities: ["desk", "computer"]
  },
  {
    id: "T011",
    x: 552303.103072,
    y: 5430792.309132,
    area: 8.84,
    desc: "Small Office",
    type: "office",
    floor: 1,
    coordinates: utmToGps(552303.103072, 5430792.309132),
    isAccessible: true,
    amenities: ["desk", "computer"]
  },
  {
    id: "T012",
    x: 552300.157482,
    y: 5430792.240738,
    area: 8.84,
    desc: "Small Office",
    type: "office",
    floor: 1,
    coordinates: utmToGps(552300.157482, 5430792.240738),
    isAccessible: true,
    amenities: ["desk", "computer"]
  },
  {
    id: "T013",
    x: 552297.211893,
    y: 5430792.172344,
    area: 8.84,
    desc: "Small Office",
    type: "office",
    floor: 1,
    coordinates: utmToGps(552297.211893, 5430792.172344),
    isAccessible: true,
    amenities: ["desk", "computer"]
  },
  {
    id: "T014",
    x: 552315.697166,
    y: 5430792.527193,
    area: 6.65,
    desc: "Utility Room",
    type: "utility",
    floor: 1,
    coordinates: utmToGps(552315.697166, 5430792.527193),
    isAccessible: false,
    amenities: ["storage"]
  },
  {
    id: "T015",
    x: 552318.169693,
    y: 5430792.584603,
    area: 6.65,
    desc: "Utility Room",
    type: "utility",
    floor: 1,
    coordinates: utmToGps(552318.169693, 5430792.584603),
    isAccessible: false,
    amenities: ["storage"]
  },
  {
    id: "T032",
    x: 552309.652266,
    y: 5430794.708623,
    area: 35.53,
    desc: "Medium Classroom",
    type: "academic",
    floor: 1,
    coordinates: utmToGps(552309.652266, 5430794.708623),
    isAccessible: true,
    amenities: ["projector", "whiteboard", "30_seats"]
  },
  {
    id: "T033",
    x: 552318.361519,
    y: 5430806.730978,
    area: 28.3,
    desc: "Study Area",
    type: "study",
    floor: 1,
    coordinates: utmToGps(552318.361519, 5430806.730978),
    isAccessible: true,
    amenities: ["tables", "chairs", "quiet_zone"]
  },
  // Add main building features
  {
    id: "T-ENTRANCE",
    x: 552310,
    y: 5430795,
    area: 20,
    desc: "Main Entrance",
    type: "entrance",
    floor: 1,
    coordinates: utmToGps(552310, 5430795),
    isAccessible: true,
    amenities: ["automatic_doors", "accessible_entrance"]
  },
  {
    id: "T-WASHROOM-1",
    x: 552305,
    y: 5430798,
    area: 15,
    desc: "Washroom",
    type: "washroom",
    floor: 1,
    coordinates: utmToGps(552305, 5430798),
    isAccessible: true,
    amenities: ["accessible", "gender_neutral"]
  },
  {
    id: "T-HALL-MAIN",
    x: 552310,
    y: 5430798,
    area: 100,
    desc: "Main Hallway",
    type: "hallway",
    floor: 1,
    coordinates: utmToGps(552310, 5430798),
    isAccessible: true,
    amenities: ["wide_corridor"]
  }
];

// Popular destinations for quick access
export const POPULAR_DESTINATIONS = [
  {
    id: "T-ENTRANCE",
    name: "Main Entrance",
    icon: "enter",
    estimatedTime: "30s",
    priority: 1
  },
  {
    id: "T-WASHROOM-1",
    name: "Washroom",
    icon: "water",
    estimatedTime: "1 min",
    priority: 2
  },
  {
    id: "T001",
    name: "Large Lecture Hall",
    icon: "school",
    estimatedTime: "1 min",
    priority: 3
  },
  {
    id: "T032",
    name: "Medium Classroom",
    icon: "library",
    estimatedTime: "45s",
    priority: 4
  },
  {
    id: "T033",
    name: "Study Area",
    icon: "book",
    estimatedTime: "1 min",
    priority: 5
  }
];

export const BUILDING_BOUNDS = {
  minX: 552295,
  maxX: 552320,
  minY: 5430790,
  maxY: 5430810,
  center: {
    x: 552310,
    y: 5430800,
    lat: 49.0504,
    lng: -121.9447
  }
};

export default UFV_BUILDING_T_ROOMS;