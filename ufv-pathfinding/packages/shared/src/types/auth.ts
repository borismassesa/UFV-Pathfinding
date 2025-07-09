export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  profile: UserProfile;
  preferences: NavigationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  STUDENT = 'student',
  FACULTY = 'faculty',
  STAFF = 'staff',
  VISITOR = 'visitor',
  ADMIN = 'admin'
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  studentId?: string;
  department?: string;
  phoneNumber?: string;
  profilePicture?: string;
  emergencyContact?: EmergencyContact;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
}

export interface NavigationPreferences {
  avoidStairs: boolean;
  preferElevator: boolean;
  accessibleOnly: boolean;
  avoidCrowdedAreas: boolean;
  preferredWalkingSpeed: 'slow' | 'normal' | 'fast';
  favoriteLocations: string[];
  recentLocations: RecentLocation[];
}

export interface RecentLocation {
  roomId: string;
  timestamp: Date;
  frequency: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}