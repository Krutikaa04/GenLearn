import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';

class AnswerDto {
  @IsUUID()
  questionId: string;

  @IsNumber()
  @Min(0)
  @Max(3)
  selectedIndex: number;
}

export class SubmitQuizDto {
  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
