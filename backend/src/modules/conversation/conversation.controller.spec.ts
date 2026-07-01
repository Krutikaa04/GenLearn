import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';

const jwtPayload = { userId: 'student-1', email: 'student@test.com', role: 'student' };

const mockConversation = {
  conversationId: 'conv-1',
  studentId: 'student-1',
  title: 'Binary Trees discussion',
  messages: [
    { role: 'user', content: 'What is a binary tree?', timestamp: new Date() },
    { role: 'assistant', content: 'A tree where each node has at most two children.', timestamp: new Date() },
  ],
};

const mockMessageResult = {
  conversationId: 'conv-1',
  message: { role: 'assistant', content: 'Great question!' },
  followUpSuggestions: ['Explain DFS', 'What is BFS?'],
};

describe('ConversationController', () => {
  let controller: ConversationController;
  let service: jest.Mocked<ConversationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationController],
      providers: [
        {
          provide: ConversationService,
          useValue: {
            sendMessage: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ConversationController);
    service = module.get(ConversationService) as jest.Mocked<ConversationService>;
  });

  describe('sendMessage', () => {
    it('returns message result wrapped in data', async () => {
      service.sendMessage.mockResolvedValue(mockMessageResult as any);
      const dto = { message: 'What is a binary tree?', documentIds: [] };
      const result = await controller.sendMessage(jwtPayload as any, dto as any);
      expect(result).toEqual({ data: mockMessageResult });
      expect(service.sendMessage).toHaveBeenCalledWith('student-1', dto);
    });

    it('starts new conversation when conversationId is omitted', async () => {
      service.sendMessage.mockResolvedValue({ ...mockMessageResult, conversationId: 'new-conv' } as any);
      const dto = { message: 'Hello', documentIds: [] };
      const result = await controller.sendMessage(jwtPayload as any, dto as any);
      expect(result.data.conversationId).toBe('new-conv');
    });
  });

  describe('findAll', () => {
    it('returns list wrapped in data', async () => {
      const page = { conversations: [mockConversation], total: 1 };
      service.findAll.mockResolvedValue(page as any);
      const result = await controller.findAll(jwtPayload as any, 1, 20);
      expect(result).toEqual({ data: page });
      expect(service.findAll).toHaveBeenCalledWith('student-1', 1, 20);
    });

    it('caps pageSize at 50', async () => {
      service.findAll.mockResolvedValue({ conversations: [], total: 0 } as any);
      await controller.findAll(jwtPayload as any, 1, 200);
      expect(service.findAll).toHaveBeenCalledWith('student-1', 1, 50);
    });
  });

  describe('findOne', () => {
    it('returns conversation wrapped in data', async () => {
      service.findOne.mockResolvedValue(mockConversation as any);
      const result = await controller.findOne(jwtPayload as any, 'conv-1');
      expect(result).toEqual({ data: mockConversation });
      expect(service.findOne).toHaveBeenCalledWith('conv-1', 'student-1');
    });

    it('propagates NotFoundException when conversation not found', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(jwtPayload as any, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('calls service delete and returns void', async () => {
      service.delete.mockResolvedValue(undefined);
      const result = await controller.delete(jwtPayload as any, 'conv-1');
      expect(service.delete).toHaveBeenCalledWith('conv-1', 'student-1');
      expect(result).toBeUndefined();
    });
  });
});
