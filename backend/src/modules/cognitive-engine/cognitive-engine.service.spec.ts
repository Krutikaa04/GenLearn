import { UnprocessableEntityException } from '@nestjs/common';
import { CognitiveEngineService } from './cognitive-engine.service';
import { LearnerContextBuilder } from './learner-context.builder';
import { PromptBuilder } from './prompt-builder';
import { ResponseValidator } from './response-validator';
import { LearnerContext } from './ai-task.types';

const emptyContext = (studentId: string): LearnerContext => ({
  studentId,
  weakConcepts: [],
  strongConcepts: [],
  masteryByConcept: {},
  evidenceCount: 0,
  hasHistory: false,
  assembledAt: new Date().toISOString(),
  profile: null,
  plan: null,
});

const validQuiz = {
  title: 'Quiz',
  questions: [
    { questionId: 'q1', text: 'Q1?', options: ['a', 'b', 'c', 'd'], correctIndex: 1, explanation: 'because' },
  ],
};

describe('CognitiveEngineService', () => {
  let service: CognitiveEngineService;
  let provider: Record<string, jest.Mock>;
  let contextBuilder: { build: jest.Mock };

  beforeEach(() => {
    provider = {
      generateQuiz: jest.fn().mockResolvedValue(validQuiz),
      generateLesson: jest.fn(),
      generateFlashcards: jest.fn(),
      tutorChat: jest.fn().mockResolvedValue({ reply: 'Hello', sources: [], followUpSuggestions: [] }),
      ragQuery: jest.fn(),
      generateStudyPlan: jest.fn(),
      processDocument: jest.fn().mockResolvedValue({ chunkCount: 5, pageCount: 2 }),
    };
    contextBuilder = { build: jest.fn().mockResolvedValue(emptyContext('student-1')) };
    service = new CognitiveEngineService(
      provider as any,
      contextBuilder as unknown as LearnerContextBuilder,
      new PromptBuilder(),
      new ResponseValidator(),
    );
  });

  it('routes quiz generation through the provider and returns the validated result', async () => {
    const result = await service.generateQuiz({ quizId: 'x', studentId: 'student-1', topic: 'T', difficulty: 'beginner', questionCount: 1, documentIds: [] });
    expect(provider.generateQuiz).toHaveBeenCalled();
    expect(result).toBe(validQuiz);
  });

  it('assembles learner context for learner-facing tasks', async () => {
    await service.generateQuiz({ quizId: 'x', studentId: 'student-1', topic: 'T', difficulty: 'beginner', questionCount: 1, documentIds: [] });
    expect(contextBuilder.build).toHaveBeenCalledWith('student-1');
  });

  it('rejects a malformed AI response instead of passing it downstream', async () => {
    provider.generateQuiz.mockResolvedValue({ title: 'Quiz', questions: [] });
    await expect(
      service.generateQuiz({ quizId: 'x', studentId: 'student-1', topic: 'T', difficulty: 'beginner', questionCount: 1, documentIds: [] }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('grounds the tutor in learner context when the learner has history', async () => {
    contextBuilder.build.mockResolvedValue({
      ...emptyContext('student-1'),
      weakConcepts: [{ conceptId: 'recursion-base-case', mastery: 30, confidence: 0.6 }],
      hasHistory: true,
    });
    await service.tutorChat({ studentId: 'student-1', topic: 'T', message: 'hi', conversationHistory: [] });
    const sent = provider.tutorChat.mock.calls[0][0];
    expect(sent.studentContext.learnerContext.weakConcepts).toEqual(['recursion-base-case']);
  });

  it('leaves the tutor payload untouched when the learner has no history', async () => {
    await service.tutorChat({ studentId: 'student-1', topic: 'T', message: 'hi', conversationHistory: [], studentContext: { streak: 3 } });
    const sent = provider.tutorChat.mock.calls[0][0];
    expect(sent.studentContext).toEqual({ streak: 3 });
  });

  it('skips context assembly for content-only document processing', async () => {
    await service.processDocument({ documentId: 'd', studentId: 'student-1', fileContent: 'x', fileType: 'pdf' });
    expect(contextBuilder.build).not.toHaveBeenCalled();
    expect(provider.processDocument).toHaveBeenCalled();
  });

  it('propagates provider failures unchanged', async () => {
    provider.generateQuiz.mockRejectedValue(new Error('provider down'));
    await expect(
      service.generateQuiz({ quizId: 'x', studentId: 'student-1', topic: 'T', difficulty: 'beginner', questionCount: 1, documentIds: [] }),
    ).rejects.toThrow('provider down');
  });
});
