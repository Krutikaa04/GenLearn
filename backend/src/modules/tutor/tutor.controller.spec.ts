import { Test, TestingModule } from '@nestjs/testing';
import { TutorController } from './tutor.controller';
import { TutorService } from './tutor.service';

const jwtPayload = { userId: 'student-1', email: 'student@test.com', role: 'student' };

const mockChatResult = {
  response: 'Great question! A binary tree is a tree data structure...',
  followUpSuggestions: ['Explain tree traversal', 'What is BST?', 'Tell me about AVL trees'],
  contextDocuments: ['doc-1'],
};

describe('TutorController', () => {
  let controller: TutorController;
  let service: jest.Mocked<TutorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TutorController],
      providers: [
        {
          provide: TutorService,
          useValue: {
            chat: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(TutorController);
    service = module.get(TutorService) as jest.Mocked<TutorService>;
  });

  describe('chat', () => {
    it('returns chat result wrapped in data', async () => {
      service.chat.mockResolvedValue(mockChatResult as any);
      const dto = {
        message: 'What is a binary tree?',
        documentIds: ['doc-1'],
        conversationHistory: [],
      };
      const result = await controller.chat(jwtPayload as any, dto as any);
      expect(result).toEqual({ data: mockChatResult });
      expect(service.chat).toHaveBeenCalledWith('student-1', dto);
    });

    it('passes full conversation history to service', async () => {
      service.chat.mockResolvedValue(mockChatResult as any);
      const dto = {
        message: 'Follow up question',
        documentIds: [],
        conversationHistory: [
          { role: 'user', content: 'First message' },
          { role: 'assistant', content: 'First reply' },
        ],
      };
      await controller.chat(jwtPayload as any, dto as any);
      expect(service.chat).toHaveBeenCalledWith('student-1', dto);
    });

    it('isolates by userId from JWT, not from request body', async () => {
      service.chat.mockResolvedValue(mockChatResult as any);
      const otherUser = { userId: 'student-99', email: 'x@test.com', role: 'student' };
      const dto = { message: 'Hello', documentIds: [], conversationHistory: [] };
      await controller.chat(otherUser as any, dto as any);
      expect(service.chat).toHaveBeenCalledWith('student-99', dto);
    });

    it('includes followUpSuggestions in response', async () => {
      service.chat.mockResolvedValue(mockChatResult as any);
      const dto = { message: 'Explain recursion', documentIds: [], conversationHistory: [] };
      const result = await controller.chat(jwtPayload as any, dto as any);
      expect(result.data.followUpSuggestions).toHaveLength(3);
    });
  });
});
