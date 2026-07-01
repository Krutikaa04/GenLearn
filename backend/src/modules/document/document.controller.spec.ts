import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';

const jwtPayload = { userId: 'student-1', email: 'student@test.com', role: 'student' };

const mockDoc = {
  documentId: 'doc-1',
  studentId: 'student-1',
  originalFilename: 'lecture-notes.pdf',
  title: 'Lecture Notes',
  status: 'ready',
  mimeType: 'application/pdf',
  sizeBytes: 204800,
};

const mockFile = {
  originalname: 'lecture-notes.pdf',
  mimetype: 'application/pdf',
  path: '/tmp/12345-abcde.pdf',
  size: 204800,
} as Express.Multer.File;

describe('DocumentController', () => {
  let controller: DocumentController;
  let service: jest.Mocked<DocumentService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [
        {
          provide: DocumentService,
          useValue: {
            upload: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            getStatus: jest.fn(),
            delete: jest.fn(),
            ask: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(DocumentController);
    service = module.get(DocumentService) as jest.Mocked<DocumentService>;
  });

  describe('upload', () => {
    it('returns uploaded document wrapped in data', async () => {
      service.upload.mockResolvedValue(mockDoc as any);
      const result = await controller.upload(jwtPayload as any, mockFile, 'Lecture Notes');
      expect(result).toEqual({ data: mockDoc });
      expect(service.upload).toHaveBeenCalledWith('student-1', mockFile, 'Lecture Notes');
    });

    it('throws BadRequestException when no file is provided', async () => {
      await expect(
        controller.upload(jwtPayload as any, undefined as any, undefined),
      ).rejects.toThrow(BadRequestException);
      expect(service.upload).not.toHaveBeenCalled();
    });

    it('passes undefined title when not provided', async () => {
      service.upload.mockResolvedValue(mockDoc as any);
      await controller.upload(jwtPayload as any, mockFile, undefined);
      expect(service.upload).toHaveBeenCalledWith('student-1', mockFile, undefined);
    });
  });

  describe('findAll', () => {
    it('delegates to service with userId and pagination', async () => {
      const page = { data: [mockDoc], total: 1, meta: {} };
      service.findAll.mockResolvedValue(page as any);
      const result = await controller.findAll(jwtPayload as any, 1, 20);
      expect(service.findAll).toHaveBeenCalledWith('student-1', 1, 20);
      expect(result).toBe(page);
    });

    it('caps pageSize at 50', async () => {
      service.findAll.mockResolvedValue({ data: [], total: 0, meta: {} } as any);
      await controller.findAll(jwtPayload as any, 1, 500);
      expect(service.findAll).toHaveBeenCalledWith('student-1', 1, 50);
    });
  });

  describe('findOne', () => {
    it('returns document wrapped in data', async () => {
      service.findOne.mockResolvedValue(mockDoc as any);
      const result = await controller.findOne(jwtPayload as any, 'doc-1');
      expect(result).toEqual({ data: mockDoc });
      expect(service.findOne).toHaveBeenCalledWith('doc-1', 'student-1');
    });

    it('propagates NotFoundException when document not found', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(jwtPayload as any, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStatus', () => {
    it('returns processing status wrapped in data', async () => {
      const status = { documentId: 'doc-1', status: 'processing' };
      service.getStatus.mockResolvedValue(status as any);
      const result = await controller.getStatus(jwtPayload as any, 'doc-1');
      expect(result).toEqual({ data: status });
      expect(service.getStatus).toHaveBeenCalledWith('doc-1', 'student-1');
    });
  });

  describe('delete', () => {
    it('calls service delete and returns void', async () => {
      service.delete.mockResolvedValue(undefined);
      const result = await controller.delete(jwtPayload as any, 'doc-1');
      expect(service.delete).toHaveBeenCalledWith('doc-1', 'student-1');
      expect(result).toBeUndefined();
    });
  });

  describe('ask', () => {
    it('returns RAG answer wrapped in data', async () => {
      const answer = { answer: 'Binary search has O(log n) complexity.', sources: ['doc-1'] };
      service.ask.mockResolvedValue(answer as any);
      const dto = { question: 'What is binary search complexity?' };
      const result = await controller.ask(jwtPayload as any, 'doc-1', dto as any);
      expect(result).toEqual({ data: answer });
      expect(service.ask).toHaveBeenCalledWith('doc-1', 'student-1', dto);
    });
  });

  describe('generateFlashcards', () => {
    it('validates ownership before queuing and returns queue confirmation', async () => {
      service.findOne.mockResolvedValue(mockDoc as any);
      const dto = { count: 10 };
      const result = await controller.generateFlashcards(jwtPayload as any, 'doc-1', dto as any);
      expect(service.findOne).toHaveBeenCalledWith('doc-1', 'student-1');
      expect(result.data.message).toMatch(/queued/i);
      expect(result.data.documentId).toBe('doc-1');
      expect(result.data.count).toBe(10);
    });

    it('propagates NotFoundException when document does not belong to user', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());
      await expect(
        controller.generateFlashcards(jwtPayload as any, 'foreign-doc', { count: 5 } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
