import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ConversationMessage {
  @IsString()
  role: string;

  @IsString()
  content: string;
}

export class TutorChatDto {
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

  @ApiPropertyOptional({ type: [ConversationMessage] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationMessage)
  conversationHistory?: ConversationMessage[] = [];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  documentIds?: string[] = [];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  studentContext?: Record<string, unknown> = {};
}
