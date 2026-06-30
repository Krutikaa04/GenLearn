import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ConversationService } from './conversation.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Conversations')
@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post('message')
  @ApiOperation({ summary: 'Send a tutor message — starts a new conversation if conversationId is omitted' })
  async sendMessage(@CurrentUser() user: JwtPayload, @Body() dto: SendMessageDto) {
    const result = await this.conversationService.sendMessage(user.userId, dto);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'List conversation history for the current student' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    const result = await this.conversationService.findAll(user.userId, page, Math.min(pageSize, 50));
    return { data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full message history for a conversation' })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.conversationService.findOne(id, user.userId);
    return { data: result };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a conversation' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.conversationService.delete(id, user.userId);
  }
}
