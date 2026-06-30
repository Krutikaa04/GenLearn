import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class DocumentAskDto {
  @ApiProperty({ example: 'What is the time complexity of binary search?' })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  question: string;
}
