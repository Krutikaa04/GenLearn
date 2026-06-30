import api from '../lib/axios';

export const analyticsApi = {
  getProgress: () => api.get('/analytics/progress'),
};
