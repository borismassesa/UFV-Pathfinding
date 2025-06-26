import { DataTypes, Model, Sequelize } from 'sequelize';
import { Point } from 'geojson';

// Enum for node types
export enum NodeType {
  ROOM_CENTER = 'room_center',
  DOORWAY = 'doorway',
  HALLWAY_INTERSECTION = 'hallway_intersection',
  ELEVATOR = 'elevator',
  STAIRWAY = 'stairway',
  EMERGENCY_EXIT = 'emergency_exit',
  ENTRANCE = 'entrance',
  JUNCTION = 'junction',
}

// Interface for NavigationNode attributes
export interface NavigationNodeAttributes {
  id: string;
  nodeType: NodeType;
  buildingId: string;
  floorLevel: number;
  x: number;
  y: number;
  roomId?: string;
  name?: string;
  description?: string;
  isAccessible: boolean;
  isActive: boolean;
  accessibilityFeatures?: string[];
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for NavigationNode creation
export interface NavigationNodeCreationAttributes extends Omit<NavigationNodeAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// NavigationNode model class
export class NavigationNode extends Model<NavigationNodeAttributes, NavigationNodeCreationAttributes> implements NavigationNodeAttributes {
  public id!: string;
  public nodeType!: NodeType;
  public buildingId!: string;
  public floorLevel!: number;
  public x!: number;
  public y!: number;
  public roomId?: string;
  public name?: string;
  public description?: string;
  public isAccessible!: boolean;
  public isActive!: boolean;
  public accessibilityFeatures?: string[];
  public metadata?: Record<string, any>;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Static method to initialize the model
  public static initialize(sequelize: Sequelize): typeof NavigationNode {
    NavigationNode.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        nodeType: {
          type: DataTypes.ENUM(...Object.values(NodeType)),
          allowNull: false,
          field: 'node_type',
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
          field: 'floor_level',
        },
        x: {
          type: DataTypes.DECIMAL(12, 8),
          allowNull: false,
        },
        y: {
          type: DataTypes.DECIMAL(12, 8),
          allowNull: false,
        },
        roomId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'room_id',
          references: {
            model: 'rooms',
            key: 'id',
          },
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        isAccessible: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'is_accessible',
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'is_active',
        },
        accessibilityFeatures: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
          defaultValue: [],
          field: 'accessibility_features',
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
        tableName: 'navigation_nodes',
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
            fields: ['node_type'],
          },
          {
            fields: ['room_id'],
          },
          {
            fields: ['is_accessible'],
          },
          {
            fields: ['is_active'],
          },
          {
            // Composite index for spatial queries
            fields: ['building_id', 'floor_level'],
          },
          {
            // Spatial coordinates index
            fields: ['x', 'y'],
          },
        ],
      }
    );

    return NavigationNode;
  }

  // Instance methods
  public getCoordinates(): Point {
    return {
      type: 'Point',
      coordinates: [this.x, this.y],
    };
  }

  public isOnFloor(floorLevel: number): boolean {
    return this.floorLevel === floorLevel;
  }

  public isInBuilding(buildingId: string): boolean {
    return this.buildingId === buildingId;
  }

  public isElevatorOrStairs(): boolean {
    return this.nodeType === NodeType.ELEVATOR || this.nodeType === NodeType.STAIRWAY;
  }

  public canConnectToFloor(targetFloor: number): boolean {
    return this.isElevatorOrStairs() || this.floorLevel === targetFloor;
  }

  public hasAccessibilityFeature(feature: string): boolean {
    return this.accessibilityFeatures?.includes(feature) || false;
  }

  // Static methods for common queries
  public static async findByBuilding(buildingId: string): Promise<NavigationNode[]> {
    return NavigationNode.findAll({
      where: {
        buildingId,
        isActive: true,
      },
      order: [['floorLevel', 'ASC'], ['nodeType', 'ASC']],
    });
  }

  public static async findByFloor(buildingId: string, floorLevel: number): Promise<NavigationNode[]> {
    return NavigationNode.findAll({
      where: {
        buildingId,
        floorLevel,
        isActive: true,
      },
      order: [['nodeType', 'ASC'], ['x', 'ASC'], ['y', 'ASC']],
    });
  }

  public static async findByRoom(roomId: string): Promise<NavigationNode[]> {
    return NavigationNode.findAll({
      where: {
        roomId,
        isActive: true,
      },
    });
  }

  public static async findByType(nodeType: NodeType, buildingId?: string): Promise<NavigationNode[]> {
    const whereClause: any = {
      nodeType,
      isActive: true,
    };

    if (buildingId) {
      whereClause.buildingId = buildingId;
    }

    return NavigationNode.findAll({
      where: whereClause,
      order: [['buildingId', 'ASC'], ['floorLevel', 'ASC']],
    });
  }

  public static async findAccessibleNodes(buildingId?: string, floorLevel?: number): Promise<NavigationNode[]> {
    const whereClause: any = {
      isAccessible: true,
      isActive: true,
    };

    if (buildingId) {
      whereClause.buildingId = buildingId;
    }

    if (floorLevel !== undefined) {
      whereClause.floorLevel = floorLevel;
    }

    return NavigationNode.findAll({
      where: whereClause,
      order: [['buildingId', 'ASC'], ['floorLevel', 'ASC'], ['nodeType', 'ASC']],
    });
  }

  public static async findNear(
    x: number,
    y: number,
    buildingId: string,
    floorLevel: number,
    radiusMeters: number = 50
  ): Promise<NavigationNode[]> {
    const sequelize = NavigationNode.sequelize!;
    
    return NavigationNode.findAll({
      where: {
        buildingId,
        floorLevel,
        isActive: true,
        [DataTypes.Op.and]: sequelize.where(
          sequelize.fn(
            'SQRT',
            sequelize.fn(
              '+',
              sequelize.fn('POW', sequelize.fn('-', sequelize.col('x'), x), 2),
              sequelize.fn('POW', sequelize.fn('-', sequelize.col('y'), y), 2)
            )
          ),
          { [DataTypes.Op.lte]: radiusMeters }
        ),
      },
      order: [
        [
          sequelize.fn(
            'SQRT',
            sequelize.fn(
              '+',
              sequelize.fn('POW', sequelize.fn('-', sequelize.col('x'), x), 2),
              sequelize.fn('POW', sequelize.fn('-', sequelize.col('y'), y), 2)
            )
          ),
          'ASC',
        ],
      ],
    });
  }

  // Multi-floor connection nodes (elevators and stairs)
  public static async findVerticalConnections(buildingId: string): Promise<NavigationNode[]> {
    return NavigationNode.findAll({
      where: {
        buildingId,
        nodeType: {
          [DataTypes.Op.in]: [NodeType.ELEVATOR, NodeType.STAIRWAY],
        },
        isActive: true,
      },
      order: [['floorLevel', 'ASC'], ['nodeType', 'ASC']],
    });
  }

  // Find entrance/exit nodes
  public static async findEntrances(buildingId: string): Promise<NavigationNode[]> {
    return NavigationNode.findAll({
      where: {
        buildingId,
        nodeType: {
          [DataTypes.Op.in]: [NodeType.ENTRANCE, NodeType.EMERGENCY_EXIT],
        },
        isActive: true,
      },
      order: [['floorLevel', 'ASC']],
    });
  }

  // Calculate distance to another node (Euclidean distance)
  public distanceTo(other: NavigationNode): number {
    if (this.buildingId !== other.buildingId || this.floorLevel !== other.floorLevel) {
      return Infinity; // Different buildings or floors
    }
    
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Check if this node can connect to another node
  public canConnectTo(other: NavigationNode): boolean {
    // Same building check
    if (this.buildingId !== other.buildingId) {
      return false;
    }

    // Same floor or vertical connection
    if (this.floorLevel === other.floorLevel) {
      return true;
    }

    // Vertical connections (elevators/stairs)
    return (
      (this.isElevatorOrStairs() && other.isElevatorOrStairs()) &&
      (this.nodeType === other.nodeType) // Same type of vertical connection
    );
  }
}

export default NavigationNode; 