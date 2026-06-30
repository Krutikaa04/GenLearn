import api from '../lib/axios';

export const analyticsApi = {
  getProgress: () => api.get('/analytics/progress'),
  getWeakTopics: () => api.get('/analytics/weak-topics'),
};
