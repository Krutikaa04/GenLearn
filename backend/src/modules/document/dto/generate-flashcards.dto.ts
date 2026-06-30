import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateFlashcardsDto {
  @ApiPropertyOptional({ default: 15, minimum: 5, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(50)
  @Type(() => Number)
  count?: number = 15;
}
