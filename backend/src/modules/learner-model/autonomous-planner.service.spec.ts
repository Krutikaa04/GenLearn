import { AutonomousPlannerService } from './autonomous-planner.service';

describe('AutonomousPlannerService', () => {
  let service: AutonomousPlannerService;
  let planModel: { updateOne: jest.Mock; findOne: jest.Mock };
  let learnerRepo: { findPendingDecision: jest.Mock; findByStudent: jest.Mock };
  let profileService: { getProfile: jest.Mock };

  const pending = {
    conceptId: 'recursion-base-case',
    topic: 'Recursion',
    trigger: 'weak_concept',
    action: 'quiz',
    difficulty: 'beginner',
    masteryBefore: 40,
    blueprint: { questionCount: 5, targetConceptDistribution: { 'recursion-base-case': 1 } },
    reasonCodes: ['weak_concept'],
  };

  const leanChain = (value: unknown) => ({ lean: () => ({ exec: jest.fn().mockResolvedValue(value) }) });

  beforeEach(() => {
    planModel = {
      updateOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(undefined) }),
      findOne: jest.fn(),
    };
    learnerRepo = {
      findPendingDecision: jest.fn().mockResolvedValue(pending),
      findByStudent: jest.fn().mockResolvedValue([
        { conceptId: 'recursion-base-case', mastery: 40, confidence: 0.4 },
      ]),
    };
    profileService = { getProfile: jest.fn().mockResolvedValue({ currentGoal: 'Ace DSA' }) };
    service = new AutonomousPlannerService(planModel as any, learnerRepo as any, profileService as any);
  });

  it('composes and upserts a single plan on regenerate', async () => {
    planModel.findOne.mockReturnValueOnce(leanChain({ studentId: 's1', objective: 'X' }));
    await service.regenerate('s1');

    expect(planModel.updateOne).toHaveBeenCalledTimes(1);
    const [filter, update, opts] = planModel.updateOne.mock.calls[0];
    expect(filter).toEqual({ studentId: 's1' });
    expect(update.$set.studentId).toBe('s1');
    expect(update.$set.objective).toContain('recursion base case');
    expect(update.$set.currentGoal).toBe('Ace DSA');
    expect(opts).toEqual({ upsert: true });
  });

  it('lazily regenerates when no plan exists yet', async () => {
    planModel.findOne
      .mockReturnValueOnce(leanChain(null)) // getCurrentPlan: none yet
      .mockReturnValueOnce(leanChain({ studentId: 's1', objective: 'X' })); // regenerate re-read
    const plan = await service.getCurrentPlan('s1');
    expect(planModel.updateOne).toHaveBeenCalledTimes(1);
    expect(plan).toEqual({ studentId: 's1', objective: 'X' });
  });

  it('returns the existing plan without regenerating when present', async () => {
    planModel.findOne.mockReturnValueOnce(leanChain({ studentId: 's1', objective: 'existing' }));
    const plan = await service.getCurrentPlan('s1');
    expect(planModel.updateOne).not.toHaveBeenCalled();
    expect((plan as any).objective).toBe('existing');
  });

  it('returns null plan summary when none exists', async () => {
    planModel.findOne.mockReturnValueOnce(leanChain(null));
    expect(await service.getPlanSummary('s1')).toBeNull();
  });
});
