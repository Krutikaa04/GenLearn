import { ExplainableIntelligenceService } from './explainable-intelligence.service';

describe('ExplainableIntelligenceService', () => {
  let service: ExplainableIntelligenceService;
  let learnerRepo: {
    findPendingDecision: jest.Mock;
    findOrCreate: jest.Mock;
    markInterventionSelected: jest.Mock;
  };
  let profileService: { getProfile: jest.Mock };

  const pending = {
    decisionId: 'd-1',
    conceptId: 'recursion-base-case',
    topic: 'Recursion',
    trigger: 'weak_concept',
    action: 'quiz',
    selectedIntervention: null,
  };

  beforeEach(() => {
    learnerRepo = {
      findPendingDecision: jest.fn().mockResolvedValue(pending),
      findOrCreate: jest.fn().mockResolvedValue({ mastery: 40, confidence: 0.4, evidenceCount: 6, trend: 'stable' }),
      markInterventionSelected: jest.fn().mockResolvedValue(undefined),
    };
    profileService = {
      getProfile: jest.fn().mockResolvedValue({
        interventionEffectiveness: {},
        supportDependency: { score: 0.1 },
      }),
    };
    service = new ExplainableIntelligenceService(learnerRepo as any, profileService as any);
  });

  it('returns an explained recommendation for the pending decision', async () => {
    const rec = await service.getExplainedRecommendation('s1');
    expect(rec).not.toBeNull();
    expect(rec!.intervention).toBe('quiz');
    expect(rec!.explanation.why.length).toBeGreaterThan(0);
    expect(rec!.explanation.evidence).toContain('Current mastery: 40%');
  });

  it('persists the selected intervention for effectiveness crediting', async () => {
    await service.getExplainedRecommendation('s1');
    expect(learnerRepo.markInterventionSelected).toHaveBeenCalledWith('d-1', 'quiz');
  });

  it('skips the write when the selection is already recorded', async () => {
    learnerRepo.findPendingDecision.mockResolvedValue({ ...pending, selectedIntervention: 'quiz' });
    await service.getExplainedRecommendation('s1');
    expect(learnerRepo.markInterventionSelected).not.toHaveBeenCalled();
  });

  it('returns null when nothing is pending', async () => {
    learnerRepo.findPendingDecision.mockResolvedValue(null);
    expect(await service.getExplainedRecommendation('s1')).toBeNull();
    expect(await service.getRecommendationSummary('s1')).toBeNull();
  });

  it('degrades to neutral evidence when the profile is unavailable', async () => {
    profileService.getProfile.mockRejectedValue(new Error('down'));
    const rec = await service.getExplainedRecommendation('s1');
    expect(rec).not.toBeNull();
    expect(rec!.intervention).toBe('quiz');
  });

  it('produces a compact summary bundle for the cognitive engine', async () => {
    const summary = await service.getRecommendationSummary('s1');
    expect(summary).toEqual(
      expect.objectContaining({
        intervention: 'quiz',
        confidence: expect.any(String),
        recommendation: expect.stringContaining('recursion base case'),
      }),
    );
  });
});
