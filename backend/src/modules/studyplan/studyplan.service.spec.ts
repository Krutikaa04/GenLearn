import { StudyPlanService } from './studyplan.service';

const baseDto = {
  goal: 'Learn React Hooks in 2 weeks',
  targetDate: '2026-07-15',
  topics: ['useState', 'useEffect'],
  masteryData: [{ topic: 'useState', masteryScore: 40 }],
  hoursPerDay: 2,
};

describe('StudyPlanService', () => {
  let service: StudyPlanService;
  let aiGateway: { generateStudyPlan: jest.Mock };

  beforeEach(() => {
    aiGateway = { generateStudyPlan: jest.fn().mockResolvedValue({ title: 'React Plan', plan: [] }) };
    service = new StudyPlanService(aiGateway as any);
  });

  it('delegates plan generation to aiGateway with the correct payload', async () => {
    await service.generate('user-1', baseDto as any);

    expect(aiGateway.generateStudyPlan).toHaveBeenCalledWith({
      userId: 'user-1',
      goal: baseDto.goal,
      targetDate: baseDto.targetDate,
      topics: baseDto.topics,
      masteryData: baseDto.masteryData,
      hoursPerDay: baseDto.hoursPerDay,
    });
  });

  it('defaults masteryData to [] when omitted', async () => {
    const dto = { ...baseDto, masteryData: undefined };

    await service.generate('user-1', dto as any);

    const call = aiGateway.generateStudyPlan.mock.calls[0][0];
    expect(call.masteryData).toEqual([]);
  });

  it('defaults hoursPerDay to 2 when omitted', async () => {
    const dto = { ...baseDto, hoursPerDay: undefined };

    await service.generate('user-1', dto as any);

    const call = aiGateway.generateStudyPlan.mock.calls[0][0];
    expect(call.hoursPerDay).toBe(2);
  });

  it('returns whatever the aiGateway returns', async () => {
    const response = { title: 'My Plan', plan: [{ day: 1, tasks: [] }] };
    aiGateway.generateStudyPlan.mockResolvedValue(response);

    const result = await service.generate('user-1', baseDto as any);

    expect(result).toBe(response);
  });
});
