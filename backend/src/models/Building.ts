import { DataTypes, Model, Sequelize } from 'sequelize';
import { Point, Polygon } from 'geojson';

// Interface for Building attributes
export interface BuildingAttributes {
  id: string;
  name: string;
  shortName?: string;
  address?: string;
  description?: string;
  totalFloors: number;
  isAccessible: boolean;
  operatingHours?: string;
  contactInfo?: Record<string, any>;
  geometry?: Polygon;
  centroidX?: number;
  centroidY?: number;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for Building creation
export interface BuildingCreationAttributes extends Omit<BuildingAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Building model class
export class Building extends Model<BuildingAttributes, BuildingCreationAttributes> implements BuildingAttributes {
  public id!: string;
  public name!: string;
  public shortName?: string;
  public address?: string;
  public description?: string;
  public totalFloors!: number;
  public isAccessible!: boolean;
  public operatingHours?: string;
  public contactInfo?: Record<string, any>;
  public geometry?: Polygon;
  public centroidX?: number;
  public centroidY?: number;
  public metadata?: Record<string, any>;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Static method to initialize the model
  public static initialize(sequelize: Sequelize): typeof Building {
    Building.init(
      {
        id: {
          type: DataTypes.STRING(50),
          primaryKey: true,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        shortName: {
          type: DataTypes.STRING(10),
          allowNull: true,
          field: 'short_name',
        },
        address: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        totalFloors: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
          field: 'total_floors',
          validate: {
            min: 1,
            max: 50,
          },
        },
        isAccessible: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'is_accessible',
        },
        operatingHours: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'operating_hours',
        },
        contactInfo: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {},
          field: 'contact_info',
        },
        geometry: {
          type: DataTypes.GEOMETRY('POLYGON'),
          allowNull: true,
        },
        centroidX: {
          type: DataTypes.DECIMAL(12, 8),
          allowNull: true,
          field: 'centroid_x',
        },
        centroidY: {
          type: DataTypes.DECIMAL(12, 8),
          allowNull: true,
          field: 'centroid_y',
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
        tableName: 'buildings',
        schema: 'spatial',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['name'],
          },
          {
            fields: ['short_name'],
            unique: true,
            where: {
              short_name: {
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
            where: {
              geometry: {
                [DataTypes.Op.ne]: null,
              },
            },
          },
        ],
      }
    );

    return Building;
  }

  // Instance methods
  public getCentroid(): Point | null {
    if (this.centroidX !== null && this.centroidY !== null) {
      return {
        type: 'Point',
        coordinates: [this.centroidX, this.centroidY],
      };
    }
    return null;
  }

  public getFloorRange(): number[] {
    return Array.from({ length: this.totalFloors }, (_, i) => i + 1);
  }

  public hasFloor(floorLevel: number): boolean {
    return floorLevel >= 1 && floorLevel <= this.totalFloors;
  }

  // Static methods for common queries
  public static async findByShortName(shortName: string): Promise<Building | null> {
    return Building.findOne({
      where: {
        shortName,
      },
    });
  }

  public static async findAccessibleBuildings(): Promise<Building[]> {
    return Building.findAll({
      where: {
        isAccessible: true,
      },
      order: [['name', 'ASC']],
    });
  }

  public static async searchBuildings(query: string): Promise<Building[]> {
    return Building.findAll({
      where: {
        [DataTypes.Op.or]: [
          {
            name: {
              [DataTypes.Op.iLike]: `%${query}%`,
            },
          },
          {
            shortName: {
              [DataTypes.Op.iLike]: `%${query}%`,
            },
          },
          {
            description: {
              [DataTypes.Op.iLike]: `%${query}%`,
            },
          },
        ],
      },
      order: [['name', 'ASC']],
      limit: 20,
    });
  }

  public static async findNear(
    longitude: number,
    latitude: number,
    radiusMeters: number = 1000
  ): Promise<Building[]> {
    const sequelize = Building.sequelize!;
    
    return Building.findAll({
      where: {
        geometry: {
          [DataTypes.Op.ne]: null,
        },
        [DataTypes.Op.and]: sequelize.where(
          sequelize.fn(
            'ST_DWithin',
            sequelize.col('geometry'),
            sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', longitude, latitude), 4326),
            radiusMeters
          ),
          true
        ),
      },
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

  // Association methods
  public async getRooms() {
    const { Room } = require('./Room');
    return Room.findByBuilding(this.id);
  }

  public async getFloorRooms(floorLevel: number) {
    const { Room } = require('./Room');
    return Room.findByFloor(this.id, floorLevel);
  }
}

export default Building; 