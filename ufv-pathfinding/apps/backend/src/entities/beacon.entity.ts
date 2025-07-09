import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Building } from './building.entity';

@Entity('beacons')
export class Beacon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  uuid: string;

  @Column()
  major: number;

  @Column()
  minor: number;

  @Column()
  @Index()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  @Index({ spatial: true })
  location: string; // PostGIS POINT geometry

  @Column()
  floor: number;

  @Column('uuid')
  @Index()
  buildingId: string;

  @ManyToOne(() => Building, { eager: true })
  @JoinColumn({ name: 'buildingId' })
  building: Building;

  @Column({ default: -70 })
  txPower: number; // Transmission power in dBm

  @Column({ default: 5.0 })
  accuracy: number; // Expected accuracy in meters

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  })
  status: string;

  @Column('jsonb', { default: {} })
  metadata: {
    manufacturer?: string;
    model?: string;
    batteryLevel?: number;
    lastBatteryCheck?: Date;
    installationDate?: Date;
    maintenanceSchedule?: string;
    notes?: string;
  };

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastSeenAt: Date;

  // Virtual properties for calculated fields
  get coordinates() {
    if (!this.location) return null;
    
    try {
      const match = this.location.match(/POINT\(([^)]+)\)/);
      if (match) {
        const [lng, lat] = match[1].split(' ').map(Number);
        return { lat, lng };
      }
    } catch (error) {
      console.error('Error parsing beacon coordinates:', error);
    }
    
    return null;
  }

  // Method to calculate distance based on RSSI
  calculateDistance(rssi: number): number {
    if (rssi === 0) {
      return -1.0;
    }

    const ratio = rssi * 1.0 / this.txPower;
    
    if (ratio < 1.0) {
      return Math.pow(ratio, 10);
    } else {
      const accuracy = (0.89976) * Math.pow(ratio, 7.7095) + 0.111;
      return accuracy;
    }
  }

  // Method to determine proximity zone
  getProximityZone(rssi: number): 'immediate' | 'near' | 'far' | 'unknown' {
    const distance = this.calculateDistance(rssi);
    
    if (distance < 0) return 'unknown';
    if (distance < 1) return 'immediate';
    if (distance < 3) return 'near';
    return 'far';
  }
}