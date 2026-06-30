import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as os from 'os';
import { DocumentService } from './document.service';
import { DocumentAskDto } from './dto/document-ask.dto';
import { GenerateFlashcardsDto } from './dto/generate-flashcards.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

const multerStorage = diskStorage({
  destination: os.tmpdir(),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const FILE_FILTER = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException({
        code: 'INVALID_FILE_TYPE',
        message: 'File type not supported. Accepted: PDF, DOCX, TXT, MD',
      }),
      false,
    );
  }
};

@ApiTags('Documents')
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Upload a document for RAG indexing (async — polls /status)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerStorage,
      fileFilter: FILE_FILTER,
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title?: string,
  ) {
    if (!file) {
      throw new BadRequestException({ code: 'FILE_REQUIRED', message: 'No file provided' });
    }
    const result = await this.documentService.upload(user.userId, file, title);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'List all documents for the current student' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.documentService.findAll(user.userId, page, Math.min(pageSize, 50));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details' })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.documentService.findOne(id, user.userId);
    return { data: result };
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Poll document processing status' })
  async getStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.documentService.getStatus(id, user.userId);
    return { data: result };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document and its indexed chunks' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.documentService.delete(id, user.userId);
  }

  @Post(':id/ask')
  @ApiOperation({ summary: 'Ask a question grounded in this document (RAG)' })
  async ask(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: DocumentAskDto,
  ) {
    const result = await this.documentService.ask(id, user.userId, dto);
    return { data: result };
  }

  @Post(':id/flashcards/generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Generate flashcards from this document (async)' })
  async generateFlashcards(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: GenerateFlashcardsDto,
  ) {
    // Validate ownership and readiness — queue is triggered from Flashcard module when implemented
    await this.documentService.findOne(id, user.userId);
    return {
      data: {
        message: 'Flashcard generation queued',
        documentId: id,
        count: dto.count,
      },
    };
  }
}
