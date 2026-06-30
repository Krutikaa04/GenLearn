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
import { FlashcardService } from './flashcard.service';
import { GenerateFlashcardsDto } from './dto/generate-flashcards.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Flashcards')
@Controller('flashcards')
export class FlashcardController {
  constructor(private readonly flashcardService: FlashcardService) {}

  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Generate a flashcard set from a document or lesson (async)' })
  async generate(@CurrentUser() user: JwtPayload, @Body() dto: GenerateFlashcardsDto) {
    const result = await this.flashcardService.generate(user.userId, dto);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'List all flashcard sets for the current student' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.flashcardService.findAll(user.userId, page, Math.min(pageSize, 50));
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Poll flashcard set generation status' })
  async getStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.flashcardService.getStatus(id, user.userId);
    return { data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get flashcard set with all cards' })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.flashcardService.findOne(id, user.userId);
    return { data: result };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a flashcard set' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.flashcardService.delete(id, user.userId);
  }
}
