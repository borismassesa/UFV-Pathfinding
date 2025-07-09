import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Room } from './room.entity';
import { BuildingEntrance } from './building-entrance.entity';
import { NavigationNode } from './navigation-node.entity';

@Entity('buildings')
export class Building {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  code: string;

  @Column()
  name: string;

  @Column()
  campus: string;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  @Index({ spatial: true })
  location: string;

  @Column('jsonb', { default: [] })
  floors: {
    number: number;
    name: string;
    mapUrl?: string;
  }[];

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
  metadata: Record<string, any>;

  @OneToMany(() => Room, room => room.building)
  rooms: Room[];

  @OneToMany(() => BuildingEntrance, entrance => entrance.building)
  entrances: BuildingEntrance[];

  @OneToMany(() => NavigationNode, node => node.building)
  navigationNodes: NavigationNode[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}