import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'student@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password: string;

  @ApiProperty({ example: 'Rishi' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Mahajan' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  // Self-service roles only — 'admin' is deliberately not accepted here.
  @ApiPropertyOptional({ enum: ['student', 'teacher'], default: 'student' })
  @IsOptional()
  @IsIn(['student', 'teacher'])
  role?: 'student' | 'teacher';
}
