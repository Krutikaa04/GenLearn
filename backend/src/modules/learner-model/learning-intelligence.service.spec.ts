import { LearningIntelligenceService } from './learning-intelligence.service';

describe('LearningIntelligenceService', () => {
  let service: LearningIntelligenceService;
  let learnerRepo: { findByStudent: jest.Mock };
  let profileRepo: { listTimeline: jest.Mock };
  let profileService: { getProfile: jest.Mock };

  const concepts = [
    { conceptId: 'recursion-base-case', mastery: 35, confidence: 0.4, evidenceCount: 6, trend: 'declining', lastPracticedAt: new Date(), lastEvidenceAt: new Date(), reviewPriority: 70 },
    { conceptId: 'tail-recursion', mastery: 88, confidence: 0.8, evidenceCount: 7, trend: 'stable', lastPracticedAt: new Date(), lastEvidenceAt: new Date(), reviewPriority: 10 },
  ];

  beforeEach(() => {
    learnerRepo = { findByStudent: jest.fn().mockResolvedValue(concepts) };
    profileRepo = { listTimeline: jest.fn().mockResolvedValue([]) };
    profileService = { getProfile: jest.fn().mockResolvedValue({ preferences: { preferredIntervention: 'flashcards' }, supportDependency: { score: 0.2 } }) };
    service = new LearningIntelligenceService(learnerRepo as any, profileRepo as any, profileService as any);
  });

  it('returns concept progress sorted weakest-first', async () => {
    const progress = await service.getConceptProgress('s1');
    expect(progress[0].conceptId).toBe('recursion-base-case');
    expect(progress[0]).toEqual(expect.objectContaining({ mastery: 35, trend: 'declining', reviewPriority: 70 }));
  });

  it('forecasts revision urgency', async () => {
    const f = await service.getRevisionForecast('s1');
    expect(f.immediate.map((r) => r.conceptId)).toContain('recursion-base-case');
    expect(f.safe.map((r) => r.conceptId)).toContain('tail-recursion');
  });

  it('predicts a next milestone', async () => {
    const p = await service.getPrediction('s1');
    expect(p.readyToAdvance).toContain('tail-recursion');
    expect(p.nextMilestone).toMatch(/recursion base case/);
  });

  it('builds an actionable coach summary', async () => {
    const coach = await service.getCoachSummary('s1');
    expect(coach.todaysFocus).toContain('recursion base case');
    expect(coach.nextMilestone).toBeTruthy();
  });

  it('produces evidence-based insights from stored data', async () => {
    const insights = await service.getInsights('s1');
    expect(insights.join(' ')).toContain('declining');
    expect(insights.join(' ')).toContain('flashcard review');
  });

  it('returns a compact prediction summary for the cognitive engine', async () => {
    const summary = await service.getPredictionSummary('s1');
    expect(summary).toEqual(expect.objectContaining({ nextMilestone: expect.any(String), revisionDue: expect.any(Number) }));
  });

  it('returns null prediction summary when there is no history', async () => {
    learnerRepo.findByStudent.mockResolvedValue([]);
    expect(await service.getPredictionSummary('s1')).toBeNull();
  });
});
