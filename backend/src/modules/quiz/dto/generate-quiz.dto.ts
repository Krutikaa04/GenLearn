import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { DifficultyLevel } from '../schemas/quiz.schema';

export class GenerateQuizDto {
  @ApiProperty({ example: 'Binary Search Trees' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  topic: string;

  @ApiProperty({ enum: DifficultyLevel, example: DifficultyLevel.INTERMEDIATE })
  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @ApiPropertyOptional({ default: 10, minimum: 3, maximum: 20 })
  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(20)
  @Type(() => Number)
  questionCount?: number = 10;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  documentIds?: string[] = [];
}
