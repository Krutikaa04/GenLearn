import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConversationService } from './conversation.service';

describe('ConversationService', () => {
  let service: ConversationService;
  let repository: {
    findById: jest.Mock;
    create: jest.Mock;
    appendTurns: jest.Mock;
    findByStudentId: jest.Mock;
    softDelete: jest.Mock;
  };
  let aiGateway: { tutorChat: jest.Mock };

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      create: jest.fn(),
      appendTurns: jest.fn(),
      findByStudentId: jest.fn(),
      softDelete: jest.fn(),
    };
    aiGateway = { tutorChat: jest.fn() };
    const learnerProfile = { recordTimelineEvent: jest.fn().mockResolvedValue(undefined) };
    service = new ConversationService(repository as any, aiGateway as any, learnerProfile as any);
  });

  describe('sendMessage', () => {
    it('does not create a conversation record when the AI call fails', async () => {
      repository.findById.mockResolvedValue(null);
      aiGateway.tutorChat.mockRejectedValue(new Error('Gemini quota exceeded'));

      await expect(
        service.sendMessage('student-1', { topic: 'Recursion', message: 'hi' }),
      ).rejects.toThrow('Gemini quota exceeded');

      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.appendTurns).not.toHaveBeenCalled();
    });

    it('creates a new conversation only after a successful AI reply', async () => {
      repository.findById.mockResolvedValue(null);
      aiGateway.tutorChat.mockResolvedValue({ reply: 'Hello!', followUpSuggestions: ['Try this'], sources: [] });

      const result = await service.sendMessage('student-1', { topic: 'Recursion', message: 'hi' });

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 'student-1',
          topic: 'Recursion',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: 'hi' }),
            expect.objectContaining({ role: 'assistant', content: 'Hello!' }),
          ]),
        }),
      );
      expect(result.reply).toBe('Hello!');
      expect(result.conversationId).toEqual(expect.any(String));
    });

    it('appends turns to an existing conversation instead of creating a new one', async () => {
      repository.findById.mockResolvedValue({
        conversationId: 'conv-1',
        studentId: 'student-1',
        topic: 'Recursion',
        documentIds: [],
        messages: [],
      });
      aiGateway.tutorChat.mockResolvedValue({ reply: 'Sure', followUpSuggestions: [], sources: [] });

      const result = await service.sendMessage('student-1', { conversationId: 'conv-1', topic: 'Recursion', message: 'more please' });

      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.appendTurns).toHaveBeenCalledWith('conv-1', expect.any(Array));
      expect(result.conversationId).toBe('conv-1');
    });

    it('rejects sending to a conversation owned by another student', async () => {
      repository.findById.mockResolvedValue({ conversationId: 'conv-1', studentId: 'someone-else' });

      await expect(
        service.sendMessage('student-1', { conversationId: 'conv-1', topic: 'Recursion', message: 'hi' }),
      ).rejects.toThrow(ForbiddenException);

      expect(aiGateway.tutorChat).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException for a missing conversation', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('missing', 'student-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when the conversation belongs to a different student', async () => {
      repository.findById.mockResolvedValue({ conversationId: 'conv-1', studentId: 'other' });

      await expect(service.findOne('conv-1', 'student-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('returns a paginated list of conversations with meta', async () => {
      repository.findByStudentId.mockResolvedValue({
        items: [
          { conversationId: 'conv-1', topic: 'Recursion', updatedAt: new Date(), createdAt: new Date() },
        ],
        total: 1,
      });

      const result = await service.findAll('student-1', 1, 20);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].conversationId).toBe('conv-1');
      expect(result).toMatchObject({ total: 1, page: 1, pageSize: 20 });
    });

    it('returns an empty list when the student has no conversations', async () => {
      repository.findByStudentId.mockResolvedValue({ items: [], total: 0 });

      const result = await service.findAll('student-1', 1, 20);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('delete', () => {
    it('soft-deletes only after verifying ownership', async () => {
      repository.findById.mockResolvedValue({ conversationId: 'conv-1', studentId: 'student-1' });

      await service.delete('conv-1', 'student-1');

      expect(repository.softDelete).toHaveBeenCalledWith('conv-1');
    });

    it('rejects deletion for a conversation owned by another student', async () => {
      repository.findById.mockResolvedValue({ conversationId: 'conv-1', studentId: 'other' });

      await expect(service.delete('conv-1', 'student-1')).rejects.toThrow(ForbiddenException);
      expect(repository.softDelete).not.toHaveBeenCalled();
    });
  });
});
