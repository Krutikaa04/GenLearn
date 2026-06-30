import { TutorService } from './tutor.service';

describe('TutorService', () => {
  let service: TutorService;
  let aiGateway: { tutorChat: jest.Mock };

  const baseDto = {
    topic: 'Binary Search Trees',
    message: 'How does insertion work?',
  };

  beforeEach(() => {
    aiGateway = { tutorChat: jest.fn().mockResolvedValue({ reply: 'It works like this…' }) };
    service = new TutorService(aiGateway as any);
  });

  it('delegates chat to aiGateway with the correct payload', async () => {
    const dto = { ...baseDto, documentIds: ['doc-1'], studentContext: { streak: 3 } };

    await service.chat('user-1', dto as any);

    expect(aiGateway.tutorChat).toHaveBeenCalledWith({
      studentId: 'user-1',
      topic: dto.topic,
      message: dto.message,
      conversationHistory: [],
      documentIds: dto.documentIds,
      studentContext: dto.studentContext,
    });
  });

  it('defaults conversationHistory to [] when omitted', async () => {
    await service.chat('user-1', baseDto as any);

    const call = aiGateway.tutorChat.mock.calls[0][0];
    expect(call.conversationHistory).toEqual([]);
  });

  it('passes conversationHistory through when provided', async () => {
    const history = [{ role: 'user', content: 'Hello' }, { role: 'assistant', content: 'Hi' }];
    const dto = { ...baseDto, conversationHistory: history };

    await service.chat('user-1', dto as any);

    const call = aiGateway.tutorChat.mock.calls[0][0];
    expect(call.conversationHistory).toBe(history);
  });

  it('returns whatever the aiGateway returns', async () => {
    const response = { reply: 'Test reply', followUpSuggestions: ['Try this'] };
    aiGateway.tutorChat.mockResolvedValue(response);

    const result = await service.chat('user-1', baseDto as any);

    expect(result).toBe(response);
  });
});
