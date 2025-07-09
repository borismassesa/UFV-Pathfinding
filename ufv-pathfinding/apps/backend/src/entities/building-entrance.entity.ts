import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Building } from './building.entity';

@Entity('building_entrances')
export class BuildingEntrance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Building, building => building.entrances)
  @JoinColumn({ name: 'building_id' })
  building: Building;

  @Column('uuid')
  buildingId: string;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  @Index({ spatial: true })
  location: string;

  @Column({ default: false })
  accessible: boolean;

  @Column({ default: false })
  mainEntrance: boolean;

  @Column({ nullable: true })
  description: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true })
  active: boolean;
}