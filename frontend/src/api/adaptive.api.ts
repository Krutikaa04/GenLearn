import api from '../lib/axios';

export const adaptiveApi = {
  getRecommendation: () => api.get('/adaptive/recommendation'),
  getAnalysis: (quizId: string) => api.get(`/adaptive/analysis/${quizId}`),
};
