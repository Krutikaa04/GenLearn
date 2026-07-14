import api from '../lib/axios';

export const adaptiveApi = {
  getRecommendation: () => api.get('/adaptive/recommendation'),
  getAnalysis: (quizId: string) => api.get(`/adaptive/analysis/${quizId}`),
  getQuestionAnalysis: () => api.get('/adaptive/question-analysis'),
  // The single active Learning Plan driving the Continue Learning flow (Sprint 3).
  getPlan: () => api.get('/adaptive/plan'),
};
