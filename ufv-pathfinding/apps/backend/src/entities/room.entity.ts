import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Building } from './building.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  roomNumber: string;

  @Column()
  name: string;

  @ManyToOne(() => Building, building => building.rooms)
  @JoinColumn({ name: 'building_id' })
  building: Building;

  @Column('uuid')
  buildingId: string;

  @Column('int')
  floor: number;

  @Column({
    type: 'enum',
    enum: ['classroom', 'office', 'lab', 'study_room', 'washroom', 'utility', 'common_area', 'cafeteria', 'library', 'auditorium'],
    default: 'classroom'
  })
  type: string;

  @Column('geometry', {
    spatialFeatureType: 'Polygon',
    srid: 4326,
  })
  @Index({ spatial: true })
  geometry: string;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  @Index({ spatial: true })
  centerPoint: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  area: number;

  @Column('int', { nullable: true })
  capacity: number;

  @Column('jsonb', { default: {} })
  accessibility: {
    wheelchairAccessible: boolean;
    elevatorAccess: boolean;
    accessibleWashroom: boolean;
    automaticDoors: boolean;
    brailleSignage: boolean;
    hearingLoop: boolean;
  };

  @Column('simple-array', { default: '' })
  amenities: string[];

  @Column('jsonb', { nullable: true })
  hours: {
    monday: { open: string; close: string; closed?: boolean };
    tuesday: { open: string; close: string; closed?: boolean };
    wednesday: { open: string; close: string; closed?: boolean };
    thursday: { open: string; close: string; closed?: boolean };
    friday: { open: string; close: string; closed?: boolean };
    saturday: { open: string; close: string; closed?: boolean };
    sunday: { open: string; close: string; closed?: boolean };
  };

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index()
  @Column({ type: 'tsvector', nullable: true })
  searchVector: string;
}