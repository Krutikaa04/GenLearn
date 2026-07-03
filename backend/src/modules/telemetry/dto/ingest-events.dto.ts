import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class TelemetryEventDto {
  @IsString()
  @MaxLength(40)
  type: string;

  @IsNumber()
  ts: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  questionId?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

export class IngestEventsDto {
  @IsString()
  @MaxLength(100)
  sessionId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  quizId?: string;

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => TelemetryEventDto)
  events: TelemetryEventDto[];
}
