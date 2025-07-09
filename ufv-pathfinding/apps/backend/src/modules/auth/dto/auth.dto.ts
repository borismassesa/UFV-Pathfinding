import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength, IsIn } from 'class-validator';
import type { UserRole } from '@ufv-pathfinding/shared';

export class LoginDto {
  @ApiProperty({ 
    description: 'User email address',
    example: 'student@ufv.ca'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'User password',
    example: 'securePassword123'
  })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ 
    description: 'User email address',
    example: 'student@ufv.ca'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Unique username',
    example: 'student123'
  })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ 
    description: 'User password (minimum 6 characters)',
    example: 'securePassword123'
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ 
    description: 'First name',
    example: 'John'
  })
  @IsString()
  firstName: string;

  @ApiProperty({ 
    description: 'Last name',
    example: 'Doe'
  })
  @IsString()
  lastName: string;

  @ApiProperty({ 
    description: 'User role',
    enum: ['student', 'faculty', 'staff', 'visitor'],
    default: 'student',
    required: false
  })
  @IsOptional()
  @IsIn(['student', 'faculty', 'staff', 'visitor'])
  role?: UserRole;
}

export class RefreshTokenDto {
  @ApiProperty({ 
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty({ 
    description: 'Current password',
    example: 'currentPassword123'
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({ 
    description: 'New password (minimum 6 characters)',
    example: 'newSecurePassword123'
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}