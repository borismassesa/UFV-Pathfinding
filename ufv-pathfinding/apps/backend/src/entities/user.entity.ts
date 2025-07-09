import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ unique: true })
  @Index()
  username: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: ['student', 'faculty', 'staff', 'visitor', 'admin'],
    default: 'student'
  })
  role: string;

  @Column('jsonb', { default: {} })
  profile: {
    firstName: string;
    lastName: string;
    studentId?: string;
    department?: string;
    phoneNumber?: string;
    profilePicture?: string;
    emergencyContact?: {
      name: string;
      relationship: string;
      phoneNumber: string;
    };
  };

  @Column('jsonb', { default: {} })
  preferences: {
    avoidStairs: boolean;
    preferElevator: boolean;
    accessibleOnly: boolean;
    avoidCrowdedAreas: boolean;
    preferredWalkingSpeed: 'slow' | 'normal' | 'fast';
    favoriteLocations: string[];
    recentLocations: {
      roomId: string;
      timestamp: Date;
      frequency: number;
    }[];
  };

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}