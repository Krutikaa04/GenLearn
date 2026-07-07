import api from '../lib/axios';

export const adaptiveApi = {
  getRecommendation: () => api.get('/adaptive/recommendation'),
};
