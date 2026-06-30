import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TopicMasteryDto {
  @IsString()
  topic: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  masteryScore: number;
}

export class GenerateStudyPlanDto {
  @ApiProperty({ example: 'Learn React hooks in 1 week' })
  @IsString()
  @MinLength(5)
  @MaxLength(300)
  goal: string;

  @ApiProperty({ example: '2026-07-10' })
  @IsString()
  targetDate: string;

  @ApiProperty({ type: [String], example: ['useState', 'useEffect', 'useContext'] })
  @IsArray()
  @IsString({ each: true })
  topics: string[];

  @ApiPropertyOptional({ type: [TopicMasteryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopicMasteryDto)
  masteryData?: TopicMasteryDto[] = [];

  @ApiPropertyOptional({ default: 2, minimum: 0.5, maximum: 8 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(8)
  @Type(() => Number)
  hoursPerDay?: number = 2;
}
