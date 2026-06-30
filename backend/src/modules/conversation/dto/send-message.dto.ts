import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiPropertyOptional({ description: 'Omit to start a new conversation' })
  @IsOptional()
  @IsUUID('4')
  conversationId?: string;

  @ApiProperty({ example: 'Binary Search Trees' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  topic: string;

  @ApiProperty({ example: 'Can you explain how BST insertion works?' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  documentIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  studentContext?: Record<string, unknown>;
}
