import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable, JoinColumn, Index } from 'typeorm';
import { Building } from './building.entity';

@Entity('navigation_nodes')
export class NavigationNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Building, building => building.navigationNodes)
  @JoinColumn({ name: 'building_id' })
  building: Building;

  @Column('uuid')
  buildingId: string;

  @Column('int')
  floor: number;

  @Column({
    type: 'enum',
    enum: ['room_entrance', 'corridor', 'intersection', 'stairs', 'elevator', 'entrance', 'exit'],
    default: 'corridor'
  })
  type: string;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  @Index({ spatial: true })
  location: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @ManyToMany(() => NavigationNode)
  @JoinTable({
    name: 'navigation_edges',
    joinColumn: { name: 'from_node_id' },
    inverseJoinColumn: { name: 'to_node_id' }
  })
  connectedNodes: NavigationNode[];

  @Column({ default: true })
  active: boolean;
}