import api from '../lib/axios';

export const studyplanApi = {
  generate: (payload: {
    goal: string;
    targetDate: string;
    topics: string[];
    masteryData?: { topic: string; masteryScore: number }[];
    hoursPerDay?: number;
  }) => api.post('/studyplan/generate', payload),
};
