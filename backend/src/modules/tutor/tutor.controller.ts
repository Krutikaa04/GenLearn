import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TutorService } from './tutor.service';
import { TutorChatDto } from './dto/tutor-chat.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Tutor')
@Controller('tutor')
export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat with the AI tutor on any topic' })
  async chat(@CurrentUser() user: JwtPayload, @Body() dto: TutorChatDto) {
    const result = await this.tutorService.chat(user.userId, dto);
    return { data: result };
  }
}
