import { DataTypes, Model, Sequelize } from 'sequelize';

// Enum for edge types
export enum EdgeType {
  HORIZONTAL = 'horizontal', // Same floor movement
  VERTICAL = 'vertical',     // Between floors (elevator/stairs)
  DOORWAY = 'doorway',       // Through a door
  HALLWAY = 'hallway',       // Corridor movement
  OUTDOOR = 'outdoor',       // Outside building
  EMERGENCY = 'emergency',   // Emergency route only
}

// Interface for NavigationEdge attributes
export interface NavigationEdgeAttributes {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  edgeType: EdgeType;
  distance: number;
  estimatedTime: number;
  isAccessible: boolean;
  isActive: boolean;
  isBidirectional: boolean;
  difficulty: number;
  width?: number;
  surfaceType?: string;
  incline?: number;
  accessibilityFeatures?: string[];
  restrictions?: string[];
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for NavigationEdge creation
export interface NavigationEdgeCreationAttributes extends Omit<NavigationEdgeAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// NavigationEdge model class
export class NavigationEdge extends Model<NavigationEdgeAttributes, NavigationEdgeCreationAttributes> implements NavigationEdgeAttributes {
  public id!: string;
  public fromNodeId!: string;
  public toNodeId!: string;
  public edgeType!: EdgeType;
  public distance!: number;
  public estimatedTime!: number;
  public isAccessible!: boolean;
  public isActive!: boolean;
  public isBidirectional!: boolean;
  public difficulty!: number;
  public width?: number;
  public surfaceType?: string;
  public incline?: number;
  public accessibilityFeatures?: string[];
  public restrictions?: string[];
  public metadata?: Record<string, any>;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Static method to initialize the model
  public static initialize(sequelize: Sequelize): typeof NavigationEdge {
    NavigationEdge.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        fromNodeId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'from_node_id',
          references: {
            model: 'navigation_nodes',
            key: 'id',
          },
        },
        toNodeId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'to_node_id',
          references: {
            model: 'navigation_nodes',
            key: 'id',
          },
        },
        edgeType: {
          type: DataTypes.ENUM(...Object.values(EdgeType)),
          allowNull: false,
          field: 'edge_type',
        },
        distance: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: {
            min: 0,
          },
        },
        estimatedTime: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'estimated_time',
          validate: {
            min: 0,
          },
          comment: 'Estimated time in seconds',
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
        isBidirectional: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'is_bidirectional',
        },
        difficulty: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
          validate: {
            min: 1,
            max: 10,
          },
          comment: 'Difficulty level from 1 (easy) to 10 (very difficult)',
        },
        width: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
          comment: 'Width in meters',
        },
        surfaceType: {
          type: DataTypes.ENUM('smooth', 'rough', 'carpet', 'tile', 'concrete', 'gravel', 'grass', 'stairs'),
          allowNull: true,
          field: 'surface_type',
        },
        incline: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
          comment: 'Incline in degrees (positive for upward, negative for downward)',
        },
        accessibilityFeatures: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
          defaultValue: [],
          field: 'accessibility_features',
        },
        restrictions: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
          defaultValue: [],
          comment: 'Access restrictions (e.g., staff_only, key_required)',
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
        tableName: 'navigation_edges',
        schema: 'spatial',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['from_node_id'],
          },
          {
            fields: ['to_node_id'],
          },
          {
            fields: ['edge_type'],
          },
          {
            fields: ['is_accessible'],
          },
          {
            fields: ['is_active'],
          },
          {
            fields: ['distance'],
          },
          {
            // Composite index for pathfinding queries
            fields: ['from_node_id', 'is_active', 'is_accessible'],
          },
          {
            // Bidirectional lookup
            fields: ['to_node_id', 'is_active', 'is_accessible'],
          },
          {
            // Prevent duplicate edges
            fields: ['from_node_id', 'to_node_id'],
            unique: true,
          },
        ],
      }
    );

    return NavigationEdge;
  }

  // Instance methods
  public isVertical(): boolean {
    return this.edgeType === EdgeType.VERTICAL;
  }

  public hasAccessibilityFeature(feature: string): boolean {
    return this.accessibilityFeatures?.includes(feature) || false;
  }

  public hasRestriction(restriction: string): boolean {
    return this.restrictions?.includes(restriction) || false;
  }

  public getWeight(accessibilityRequired: boolean = false): number {
    if (!this.isActive) {
      return Infinity;
    }

    if (accessibilityRequired && !this.isAccessible) {
      return Infinity;
    }

    // Base weight is distance
    let weight = parseFloat(this.distance.toString());

    // Add difficulty multiplier
    weight *= (1 + (this.difficulty - 1) * 0.1);

    // Add incline penalty
    if (this.incline) {
      const inclineAbs = Math.abs(parseFloat(this.incline.toString()));
      weight *= (1 + inclineAbs * 0.02); // 2% penalty per degree of incline
    }

    // Add vertical movement penalty
    if (this.isVertical()) {
      weight *= 1.5; // 50% penalty for vertical movement
    }

    return weight;
  }

  public getEstimatedWalkingSpeed(): number {
    // Base walking speed in meters per second
    let speed = 1.4; // Average walking speed

    // Adjust for surface type
    switch (this.surfaceType) {
      case 'stairs':
        speed = 0.7;
        break;
      case 'rough':
      case 'gravel':
        speed = 1.0;
        break;
      case 'carpet':
        speed = 1.2;
        break;
      case 'smooth':
      case 'tile':
      case 'concrete':
        speed = 1.4;
        break;
    }

    // Adjust for incline
    if (this.incline) {
      const inclineAbs = Math.abs(parseFloat(this.incline.toString()));
      speed *= Math.max(0.3, 1 - inclineAbs * 0.05); // Reduce speed by 5% per degree
    }

    // Adjust for difficulty
    speed *= Math.max(0.5, 1 - (this.difficulty - 1) * 0.05);

    return speed;
  }

  // Static methods for common queries
  public static async findByFromNode(fromNodeId: string): Promise<NavigationEdge[]> {
    return NavigationEdge.findAll({
      where: {
        fromNodeId,
        isActive: true,
      },
      order: [['distance', 'ASC']],
    });
  }

  public static async findByToNode(toNodeId: string): Promise<NavigationEdge[]> {
    return NavigationEdge.findAll({
      where: {
        toNodeId,
        isActive: true,
      },
      order: [['distance', 'ASC']],
    });
  }

  public static async findConnectedEdges(nodeId: string): Promise<NavigationEdge[]> {
    return NavigationEdge.findAll({
      where: {
        [DataTypes.Op.or]: [
          { fromNodeId: nodeId },
          { toNodeId: nodeId, isBidirectional: true },
        ],
        isActive: true,
      },
      order: [['distance', 'ASC']],
    });
  }

  public static async findAccessibleEdges(accessibilityRequired: boolean = true): Promise<NavigationEdge[]> {
    const whereClause: any = {
      isActive: true,
    };

    if (accessibilityRequired) {
      whereClause.isAccessible = true;
    }

    return NavigationEdge.findAll({
      where: whereClause,
      order: [['distance', 'ASC']],
    });
  }

  public static async findByType(edgeType: EdgeType): Promise<NavigationEdge[]> {
    return NavigationEdge.findAll({
      where: {
        edgeType,
        isActive: true,
      },
      order: [['distance', 'ASC']],
    });
  }

  public static async findVerticalConnections(): Promise<NavigationEdge[]> {
    return NavigationEdge.findByType(EdgeType.VERTICAL);
  }

  // Create bidirectional edge (creates two edges)
  public static async createBidirectional(
    edgeData: Omit<NavigationEdgeCreationAttributes, 'isBidirectional'>
  ): Promise<NavigationEdge[]> {
    const edges: NavigationEdge[] = [];

    // Create forward edge
    const forwardEdge = await NavigationEdge.create({
      ...edgeData,
      isBidirectional: true,
    });
    edges.push(forwardEdge);

    // Create reverse edge
    const reverseEdge = await NavigationEdge.create({
      ...edgeData,
      fromNodeId: edgeData.toNodeId,
      toNodeId: edgeData.fromNodeId,
      isBidirectional: true,
    });
    edges.push(reverseEdge);

    return edges;
  }

  // Get the opposite node ID
  public getOppositeNodeId(nodeId: string): string | null {
    if (this.fromNodeId === nodeId) {
      return this.toNodeId;
    } else if (this.toNodeId === nodeId && this.isBidirectional) {
      return this.fromNodeId;
    }
    return null;
  }

  // Check if edge connects two specific nodes
  public connectsNodes(nodeId1: string, nodeId2: string): boolean {
    return (
      (this.fromNodeId === nodeId1 && this.toNodeId === nodeId2) ||
      (this.isBidirectional && this.fromNodeId === nodeId2 && this.toNodeId === nodeId1)
    );
  }
}

export default NavigationEdge; 