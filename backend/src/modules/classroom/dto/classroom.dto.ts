import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateClassroomDto {
  @ApiProperty({ example: 'Physics — Grade 11A' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Mechanics and thermodynamics, 2026 batch' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}

export class JoinClassroomDto {
  @ApiProperty({ example: 'X7K2-9QPM' })
  @IsString()
  @Matches(/^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/, { message: 'Join code must look like XXXX-XXXX' })
  joinCode: string;
}
