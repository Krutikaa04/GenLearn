import { HttpException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AiGatewayService } from './ai-gateway.service';

function makeGateway(httpPost: jest.Mock) {
  const httpService = { post: httpPost };
  const config = {
    get: jest.fn().mockReturnValue('http://ai-service:8000'),
    getOrThrow: jest.fn().mockReturnValue('test-internal-key'),
  };
  return new AiGatewayService(httpService as any, config as any);
}

describe('AiGatewayService', () => {
  let httpPost: jest.Mock;
  let service: AiGatewayService;

  beforeEach(() => {
    httpPost = jest.fn();
    service = makeGateway(httpPost);
  });

  describe('successful delegation', () => {
    it('processDocument posts to /ai/v1/documents/process and returns data', async () => {
      const result = { chunkCount: 5, pageCount: 3 };
      httpPost.mockReturnValue(of({ data: result }));

      const payload = { documentId: 'd1', studentId: 's1', fileContent: 'YmFzZTY0', fileType: 'pdf' };
      const out = await service.processDocument(payload);

      expect(httpPost).toHaveBeenCalledWith(
        'http://ai-service:8000/ai/v1/documents/process',
        payload,
        expect.objectContaining({ headers: { 'X-Internal-Key': 'test-internal-key' } }),
      );
      expect(out).toEqual(result);
    });

    it('generateLesson posts to /ai/v1/lessons/generate', async () => {
      const result = { title: 'Recursion', summary: 'Base case', sections: [], keyTakeaways: [], estimatedReadMinutes: 5 };
      httpPost.mockReturnValue(of({ data: result }));

      const payload = { lessonId: 'l1', studentId: 's1', topic: 'Recursion', difficulty: 'easy', documentIds: [] };
      const out = await service.generateLesson(payload);

      expect(httpPost).toHaveBeenCalledWith(
        'http://ai-service:8000/ai/v1/lessons/generate',
        payload,
        expect.anything(),
      );
      expect(out).toEqual(result);
    });

    it('generateQuiz posts to /ai/v1/quizzes/generate', async () => {
      const result = { title: 'Quiz', questions: [] };
      httpPost.mockReturnValue(of({ data: result }));

      const payload = { quizId: 'q1', studentId: 's1', topic: 'Trees', difficulty: 'medium', questionCount: 5, documentIds: [] };
      const out = await service.generateQuiz(payload);

      expect(httpPost).toHaveBeenCalledWith(
        'http://ai-service:8000/ai/v1/quizzes/generate',
        payload,
        expect.anything(),
      );
      expect(out).toEqual(result);
    });

    it('generateFlashcards posts to /ai/v1/flashcards/generate', async () => {
      const result = { cards: [] };
      httpPost.mockReturnValue(of({ data: result }));

      const payload = { setId: 'set-1', studentId: 's1', sourceType: 'document', sourceId: 'doc-1', count: 10 };
      const out = await service.generateFlashcards(payload);

      expect(out).toEqual(result);
    });

    it('ragQuery posts to /ai/v1/rag/query', async () => {
      const result = { answer: '42', grounded: true, sources: [] };
      httpPost.mockReturnValue(of({ data: result }));

      const payload = { question: 'What is the answer?', studentId: 's1', documentIds: ['doc-1'] };
      const out = await service.ragQuery(payload);

      expect(out).toEqual(result);
    });

    it('tutorChat posts to /ai/v1/tutor/chat', async () => {
      const result = { reply: 'Good question!', sources: [], followUpSuggestions: ['Try this'] };
      httpPost.mockReturnValue(of({ data: result }));

      const payload = { studentId: 's1', topic: 'React', message: 'What is a hook?', conversationHistory: [] };
      const out = await service.tutorChat(payload);

      expect(out).toEqual(result);
    });

    it('generateStudyPlan posts to /ai/v1/studyplan/generate', async () => {
      const result = { title: 'My Plan', summary: '7-day plan', plan: [] };
      httpPost.mockReturnValue(of({ data: result }));

      const payload = { userId: 's1', goal: 'Master React', targetDate: '2026-07-31', topics: ['React'], masteryData: [], hoursPerDay: 2 };
      const out = await service.generateStudyPlan(payload);

      expect(out).toEqual(result);
    });
  });

  describe('error handling', () => {
    it('throws HttpException(502) when AI service returns an error response', async () => {
      const axiosErr = Object.assign(new Error('Bad gateway'), {
        response: { status: 500, data: { detail: 'Internal error' } },
      });
      httpPost.mockReturnValue(throwError(() => axiosErr));

      await expect(service.generateLesson({
        lessonId: 'l1', studentId: 's1', topic: 'X', difficulty: 'easy', documentIds: [],
      })).rejects.toBeInstanceOf(HttpException);
    });

    it('includes AI_GENERATION_FAILED code in the 502 error', async () => {
      const axiosErr = Object.assign(new Error('Gateway'), {
        response: { status: 500, data: {} },
      });
      httpPost.mockReturnValue(throwError(() => axiosErr));

      try {
        await service.generateQuiz({ quizId: 'q1', studentId: 's1', topic: 'T', difficulty: 'easy', questionCount: 5, documentIds: [] });
      } catch (err: any) {
        expect(err.getStatus()).toBe(502);
        expect(err.getResponse()).toMatchObject({ code: 'AI_GENERATION_FAILED' });
      }
    });

    it('maps an upstream 401 to AI_AUTH_FAILED', async () => {
      const axiosErr = Object.assign(new Error('Unauthorized'), {
        response: { status: 401, data: { detail: 'AI provider authentication failed' } },
      });
      httpPost.mockReturnValue(throwError(() => axiosErr));

      try {
        await service.generateLesson({ lessonId: 'l1', studentId: 's1', topic: 'X', difficulty: 'easy', documentIds: [] });
        throw new Error('should have thrown');
      } catch (err: any) {
        expect(err.getResponse()).toMatchObject({ code: 'AI_AUTH_FAILED' });
      }
    });

    it('maps an upstream 429 to AI_RATE_LIMITED', async () => {
      const axiosErr = Object.assign(new Error('Too many requests'), {
        response: { status: 429, data: {} },
      });
      httpPost.mockReturnValue(throwError(() => axiosErr));

      try {
        await service.generateQuiz({ quizId: 'q1', studentId: 's1', topic: 'T', difficulty: 'easy', questionCount: 5, documentIds: [] });
        throw new Error('should have thrown');
      } catch (err: any) {
        expect(err.getResponse()).toMatchObject({ code: 'AI_RATE_LIMITED' });
      }
    });

    it('classifies a connection refusal as AI_SERVICE_UNAVAILABLE (503)', async () => {
      const networkErr = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
      httpPost.mockReturnValue(throwError(() => networkErr));

      try {
        await service.processDocument({ documentId: 'd1', studentId: 's1', fileContent: 'YmFzZTY0', fileType: 'pdf' });
        throw new Error('should have thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(503);
        expect(err.getResponse()).toMatchObject({ code: 'AI_SERVICE_UNAVAILABLE' });
      }
    });

    it('classifies a timeout as AI_TIMEOUT (504)', async () => {
      const timeoutErr = Object.assign(new Error('timeout of 180000ms exceeded'), { code: 'ECONNABORTED' });
      httpPost.mockReturnValue(throwError(() => timeoutErr));

      try {
        await service.tutorChat({ studentId: 's1', topic: 'T', message: 'hi', conversationHistory: [] });
        throw new Error('should have thrown');
      } catch (err: any) {
        expect(err.getStatus()).toBe(504);
        expect(err.getResponse()).toMatchObject({ code: 'AI_TIMEOUT' });
      }
    });

    it('retries once on a connection-level failure (rides out a cold start)', async () => {
      const networkErr = Object.assign(new Error('ECONNREFUSED'), { code: 'ECONNREFUSED' });
      httpPost.mockReturnValue(throwError(() => networkErr));

      await service
        .generateLesson({ lessonId: 'l1', studentId: 's1', topic: 'X', difficulty: 'easy', documentIds: [] })
        .catch(() => undefined);

      // First attempt + one retry = two calls.
      expect(httpPost).toHaveBeenCalledTimes(2);
    });

    it('does NOT retry when the AI service returns an HTTP error (no duplicate generation)', async () => {
      const axiosErr = Object.assign(new Error('Gateway'), { response: { status: 500, data: {} } });
      httpPost.mockReturnValue(throwError(() => axiosErr));

      await service
        .generateQuiz({ quizId: 'q1', studentId: 's1', topic: 'T', difficulty: 'easy', questionCount: 5, documentIds: [] })
        .catch(() => undefined);

      expect(httpPost).toHaveBeenCalledTimes(1);
    });

    it('sends X-Internal-Key header on every request', async () => {
      httpPost.mockReturnValue(of({ data: { chunkCount: 1, pageCount: null } }));
      await service.processDocument({ documentId: 'd1', studentId: 's1', fileContent: 'YmFzZTY0', fileType: 'txt' });

      const callArgs = httpPost.mock.calls[0];
      expect(callArgs[2].headers['X-Internal-Key']).toBe('test-internal-key');
    });

    it('sets a generous (cold-start-safe) timeout on every request', async () => {
      httpPost.mockReturnValue(of({ data: { cards: [] } }));
      await service.generateFlashcards({ setId: 's1', studentId: 's1', sourceType: 'document', sourceId: 'doc-1', count: 5 });

      const callArgs = httpPost.mock.calls[0];
      expect(callArgs[2].timeout).toBe(180_000);
    });
  });
});
