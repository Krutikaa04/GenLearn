import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { DifficultyLevel } from '../schemas/lesson.schema';

export class GenerateLessonDto {
  @ApiProperty({ example: 'Binary Search Trees' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  topic: string;

  @ApiProperty({ enum: DifficultyLevel, example: DifficultyLevel.INTERMEDIATE })
  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @ApiPropertyOptional({
    description: 'Document IDs to ground the lesson in (RAG context). Leave empty for knowledge-base generation.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  documentIds?: string[] = [];
}
