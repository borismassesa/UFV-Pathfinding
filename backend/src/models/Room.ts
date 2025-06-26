import { DataTypes, Model, Sequelize } from 'sequelize';
import { Point, Polygon } from 'geojson';

// Interface for Room attributes
export interface RoomAttributes {
  id: string;
  roomNumber?: string;
  roomName?: string;
  buildingId: string;
  floorLevel: number;
  roomType: string;
  areaSqm: number;
  centroidX: number;
  centroidY: number;
  isAccessible: boolean;
  geometry: Polygon;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for Room creation (without auto-generated fields)
export interface RoomCreationAttributes extends Omit<RoomAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Room model class
export class Room extends Model<RoomAttributes, RoomCreationAttributes> implements RoomAttributes {
  public id!: string;
  public roomNumber?: string;
  public roomName?: string;
  public buildingId!: string;
  public floorLevel!: number;
  public roomType!: string;
  public areaSqm!: number;
  public centroidX!: number;
  public centroidY!: number;
  public isAccessible!: boolean;
  public geometry!: Polygon;
  public metadata?: Record<string, any>;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Static method to initialize the model
  public static initialize(sequelize: Sequelize): typeof Room {
    Room.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        roomNumber: {
          type: DataTypes.STRING(50),
          allowNull: true,
          field: 'room_number',
        },
        roomName: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'room_name',
        },
        buildingId: {
          type: DataTypes.STRING(50),
          allowNull: false,
          field: 'building_id',
          references: {
            model: 'buildings',
            key: 'id',
          },
        },
        floorLevel: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
          field: 'floor_level',
        },
        roomType: {
          type: DataTypes.ENUM(
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
          ),
          allowNull: false,
          defaultValue: 'unknown',
          field: 'room_type',
        },
        areaSqm: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          field: 'area_sqm',
          validate: {
            min: 0,
          },
        },
        centroidX: {
          type: DataTypes.DECIMAL(12, 8),
          allowNull: false,
          field: 'centroid_x',
        },
        centroidY: {
          type: DataTypes.DECIMAL(12, 8),
          allowNull: false,
          field: 'centroid_y',
        },
        isAccessible: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'is_accessible',
        },
        geometry: {
          type: DataTypes.GEOMETRY('POLYGON'),
          allowNull: false,
        },
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {},
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'created_at',
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'updated_at',
        },
      },
      {
        sequelize,
        tableName: 'rooms',
        schema: 'spatial',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['building_id'],
          },
          {
            fields: ['floor_level'],
          },
          {
            fields: ['room_type'],
          },
          {
            fields: ['room_number'],
            unique: true,
            where: {
              room_number: {
                [DataTypes.Op.ne]: null,
              },
            },
          },
          {
            fields: ['is_accessible'],
          },
          {
            // Spatial index for geometry
            fields: ['geometry'],
            using: 'gist',
          },
          {
            // Composite index for building and floor
            fields: ['building_id', 'floor_level'],
          },
        ],
      }
    );

    return Room;
  }

  // Instance methods
  public getCentroid(): Point {
    return {
      type: 'Point',
      coordinates: [this.centroidX, this.centroidY],
    };
  }

  public isOnFloor(floorLevel: number): boolean {
    return this.floorLevel === floorLevel;
  }

  public isInBuilding(buildingId: string): boolean {
    return this.buildingId === buildingId;
  }

  // Static methods for common queries
  public static async findByRoomNumber(roomNumber: string): Promise<Room | null> {
    return Room.findOne({
      where: {
        roomNumber,
      },
    });
  }

  public static async findByBuilding(buildingId: string): Promise<Room[]> {
    return Room.findAll({
      where: {
        buildingId,
      },
      order: [['floorLevel', 'ASC'], ['roomNumber', 'ASC']],
    });
  }

  public static async findByFloor(buildingId: string, floorLevel: number): Promise<Room[]> {
    return Room.findAll({
      where: {
        buildingId,
        floorLevel,
      },
      order: [['roomNumber', 'ASC']],
    });
  }

  public static async findAccessibleRooms(buildingId?: string): Promise<Room[]> {
    const whereClause: any = {
      isAccessible: true,
    };

    if (buildingId) {
      whereClause.buildingId = buildingId;
    }

    return Room.findAll({
      where: whereClause,
      order: [['buildingId', 'ASC'], ['floorLevel', 'ASC'], ['roomNumber', 'ASC']],
    });
  }

  public static async searchRooms(query: string, buildingId?: string): Promise<Room[]> {
    const whereClause: any = {
      [DataTypes.Op.or]: [
        {
          roomNumber: {
            [DataTypes.Op.iLike]: `%${query}%`,
          },
        },
        {
          roomName: {
            [DataTypes.Op.iLike]: `%${query}%`,
          },
        },
      ],
    };

    if (buildingId) {
      whereClause.buildingId = buildingId;
    }

    return Room.findAll({
      where: whereClause,
      order: [['buildingId', 'ASC'], ['floorLevel', 'ASC'], ['roomNumber', 'ASC']],
      limit: 50, // Limit search results
    });
  }

  public static async findNear(
    longitude: number,
    latitude: number,
    radiusMeters: number = 100
  ): Promise<Room[]> {
    const sequelize = Room.sequelize!;
    
    return Room.findAll({
      where: sequelize.where(
        sequelize.fn(
          'ST_DWithin',
          sequelize.col('geometry'),
          sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', longitude, latitude), 4326),
          radiusMeters
        ),
        true
      ),
      order: [
        [
          sequelize.fn(
            'ST_Distance',
            sequelize.col('geometry'),
            sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', longitude, latitude), 4326)
          ),
          'ASC',
        ],
      ],
    });
  }
}

export default Room; 