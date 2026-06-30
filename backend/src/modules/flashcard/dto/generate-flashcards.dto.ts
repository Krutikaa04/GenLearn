import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FlashcardSourceType } from '../schemas/flashcard.schema';

export class GenerateFlashcardsDto {
  @ApiProperty({ enum: FlashcardSourceType, example: FlashcardSourceType.DOCUMENT })
  @IsEnum(FlashcardSourceType)
  sourceType: FlashcardSourceType;

  @ApiProperty({ description: 'ID of the document or lesson to generate flashcards from' })
  @IsUUID()
  sourceId: string;

  @ApiPropertyOptional({ default: 15, minimum: 5, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(50)
  @Type(() => Number)
  count?: number = 15;

  @ApiPropertyOptional({ description: 'Custom title for the flashcard set' })
  @IsOptional()
  @IsString()
  title?: string;
}
