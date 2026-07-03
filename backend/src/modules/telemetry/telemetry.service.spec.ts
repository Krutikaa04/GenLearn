import { TelemetryService } from './telemetry.service';
import { IngestEventsDto } from './dto/ingest-events.dto';

describe('TelemetryService', () => {
  let service: TelemetryService;
  let configService: { get: jest.Mock };
  let queue: { add: jest.Mock };

  const dto: IngestEventsDto = {
    sessionId: 'session-1',
    quizId: 'quiz-1',
    events: [
      { type: 'QUIZ_STARTED', ts: 1751500000000 },
      { type: 'ANSWER_SELECTED', ts: 1751500005000, questionId: 'q-1', data: { selectedIndex: 2 } },
    ],
  };

  beforeEach(() => {
    configService = { get: jest.fn().mockReturnValue('true') };
    queue = { add: jest.fn().mockResolvedValue(undefined) };
    service = new TelemetryService(configService as any, queue as any);
  });

  it('enqueues the batch and returns the accepted count when the flag is on', async () => {
    const accepted = await service.ingest('student-1', dto);

    expect(accepted).toBe(2);
    expect(queue.add).toHaveBeenCalledWith(
      'ingest',
      expect.objectContaining({ studentId: 'student-1', sessionId: 'session-1', quizId: 'quiz-1' }),
      expect.any(Object),
    );
  });

  it('drops events silently (accepted=0, no enqueue) when the flag is off', async () => {
    configService.get.mockReturnValue('false');

    const accepted = await service.ingest('student-1', dto);

    expect(accepted).toBe(0);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('never throws when the queue is unavailable — returns 0 instead', async () => {
    queue.add.mockRejectedValue(new Error('Redis down'));

    await expect(service.ingest('student-1', dto)).resolves.toBe(0);
  });

  it('defaults quizId to null when not provided', async () => {
    await service.ingest('student-1', { ...dto, quizId: undefined });

    expect(queue.add).toHaveBeenCalledWith(
      'ingest',
      expect.objectContaining({ quizId: null }),
      expect.any(Object),
    );
  });
});
