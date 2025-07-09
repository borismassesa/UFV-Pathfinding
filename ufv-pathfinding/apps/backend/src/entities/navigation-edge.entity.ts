import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { NavigationNode } from './navigation-node.entity';

@Entity('navigation_edges')
export class NavigationEdge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => NavigationNode)
  @JoinColumn({ name: 'from_node_id' })
  fromNode: NavigationNode;

  @Column('uuid')
  fromNodeId: string;

  @ManyToOne(() => NavigationNode)
  @JoinColumn({ name: 'to_node_id' })
  toNode: NavigationNode;

  @Column('uuid')
  toNodeId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  distance: number;

  @Column('int')
  estimatedTime: number; // in seconds

  @Column({
    type: 'enum',
    enum: ['corridor', 'stairs', 'elevator', 'ramp', 'outdoor'],
    default: 'corridor'
  })
  type: string;

  @Column({ default: true })
  accessible: boolean;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Index(['fromNodeId', 'toNodeId'])
  @Column({ default: true })
  active: boolean;
}