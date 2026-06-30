import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentStatus, FileType } from './schemas/document.schema';

describe('DocumentService', () => {
  let service: DocumentService;
  let repository: {
    create: jest.Mock;
    findByStudentId: jest.Mock;
    findById: jest.Mock;
    countByStudentId: jest.Mock;
    softDelete: jest.Mock;
    deleteChunksByDocumentId: jest.Mock;
  };
  let storage: { saveFile: jest.Mock; deleteFile: jest.Mock };
  let aiGateway: { ragQuery: jest.Mock };
  let analytics: { recordActivity: jest.Mock };
  let queue: { add: jest.Mock };

  const makeFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
    fieldname: 'file',
    originalname: 'notes.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from(''),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
    ...overrides,
  });

  const makeDoc = (overrides: Partial<any> = {}) => ({
    documentId: 'doc-1',
    studentId: 'student-1',
    title: 'My Notes',
    originalFilename: 'notes.pdf',
    fileType: FileType.PDF,
    fileSizeBytes: 1024,
    storagePath: '/uploads/doc-1.pdf',
    status: DocumentStatus.READY,
    chunkCount: 10,
    pageCount: 3,
    processingError: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findByStudentId: jest.fn(),
      findById: jest.fn(),
      countByStudentId: jest.fn().mockResolvedValue(0),
      softDelete: jest.fn().mockResolvedValue(undefined),
      deleteChunksByDocumentId: jest.fn().mockResolvedValue(undefined),
    };
    storage = {
      saveFile: jest.fn().mockResolvedValue('/uploads/doc-1.pdf'),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };
    aiGateway = { ragQuery: jest.fn().mockResolvedValue({ answer: 'The answer', sources: [] }) };
    analytics = { recordActivity: jest.fn().mockResolvedValue(undefined) };
    queue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    service = new DocumentService(
      repository as any,
      storage as any,
      aiGateway as any,
      analytics as any,
      queue as any,
    );
  });

  // ─── upload ───────────────────────────────────────────────────────────────────

  describe('upload', () => {
    it('saves the file, creates a db record and enqueues a processing job', async () => {
      const file = makeFile();
      const created = makeDoc({ status: DocumentStatus.UPLOADED });
      repository.create.mockResolvedValue(created);

      const result = await service.upload('student-1', file);

      expect(storage.saveFile).toHaveBeenCalledWith(file, 'student-1', expect.any(String));
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        studentId: 'student-1',
        fileType: FileType.PDF,
        status: DocumentStatus.UPLOADED,
      }));
      expect(queue.add).toHaveBeenCalledWith('process', expect.objectContaining({ studentId: 'student-1' }), expect.any(Object));
      expect(result.status).toBe(DocumentStatus.UPLOADED);
    });

    it('uses the provided title over the original filename', async () => {
      const file = makeFile({ originalname: 'raw.pdf' });
      repository.create.mockResolvedValue(makeDoc({ title: 'My Custom Title' }));

      await service.upload('student-1', file, 'My Custom Title');

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'My Custom Title' }));
    });

    it('falls back to originalname when title is omitted', async () => {
      const file = makeFile({ originalname: 'lecture.pdf' });
      repository.create.mockResolvedValue(makeDoc());

      await service.upload('student-1', file);

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'lecture.pdf' }));
    });

    it('rejects files exceeding the 20 MB limit', async () => {
      const file = makeFile({ size: 21 * 1024 * 1024 });

      await expect(service.upload('student-1', file)).rejects.toThrow(BadRequestException);
    });

    it('rejects unsupported MIME types', async () => {
      const file = makeFile({ mimetype: 'image/png' });

      await expect(service.upload('student-1', file)).rejects.toThrow(BadRequestException);
    });

    it('rejects when the student has reached the 50-document limit', async () => {
      repository.countByStudentId.mockResolvedValue(50);

      await expect(service.upload('student-1', makeFile())).rejects.toThrow(UnprocessableEntityException);
    });
  });

  // ─── findOne / access control ─────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns a serialized document when owner matches', async () => {
      repository.findById.mockResolvedValue(makeDoc());

      const result = await service.findOne('doc-1', 'student-1');

      expect(result.documentId).toBe('doc-1');
    });

    it('throws NotFoundException when document does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('doc-1', 'student-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when document belongs to another student', async () => {
      repository.findById.mockResolvedValue(makeDoc({ studentId: 'other-student' }));

      await expect(service.findOne('doc-1', 'student-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('soft-deletes the document and removes its chunks', async () => {
      repository.findById.mockResolvedValue(makeDoc());

      await service.delete('doc-1', 'student-1');

      expect(repository.softDelete).toHaveBeenCalledWith('doc-1');
      expect(repository.deleteChunksByDocumentId).toHaveBeenCalledWith('doc-1');
    });

    it('throws ForbiddenException when deleting another student\'s document', async () => {
      repository.findById.mockResolvedValue(makeDoc({ studentId: 'other-student' }));

      await expect(service.delete('doc-1', 'student-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── ask ──────────────────────────────────────────────────────────────────────

  describe('ask', () => {
    it('delegates to aiGateway.ragQuery when document is ready', async () => {
      repository.findById.mockResolvedValue(makeDoc({ status: DocumentStatus.READY }));

      const result = await service.ask('doc-1', 'student-1', { question: 'What is recursion?' } as any);

      expect(aiGateway.ragQuery).toHaveBeenCalledWith({
        question: 'What is recursion?',
        studentId: 'student-1',
        documentIds: ['doc-1'],
      });
      expect(result.answer).toBeDefined();
    });

    it('throws UnprocessableEntityException when document is still processing', async () => {
      repository.findById.mockResolvedValue(makeDoc({ status: DocumentStatus.PROCESSING }));

      await expect(service.ask('doc-1', 'student-1', { question: 'Q' } as any))
        .rejects.toMatchObject({ response: { code: 'DOCUMENT_NOT_READY' } });
    });

    it('throws UnprocessableEntityException with DOCUMENT_PROCESSING_FAILED for failed documents', async () => {
      repository.findById.mockResolvedValue(makeDoc({ status: DocumentStatus.FAILED }));

      await expect(service.ask('doc-1', 'student-1', { question: 'Q' } as any))
        .rejects.toMatchObject({ response: { code: 'DOCUMENT_PROCESSING_FAILED' } });
    });
  });
});
