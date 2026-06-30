import api from '../lib/axios';

export const lessonsApi = {
  generate: (dto: { topic: string; difficulty: string; documentIds?: string[] }) =>
    api.post('/lessons/generate', dto),
  list: () => api.get('/lessons'),
  getById: (id: string) => api.get(`/lessons/${id}`),
  getStatus: (id: string) => api.get(`/lessons/${id}/status`),
  delete: (id: string) => api.delete(`/lessons/${id}`),
};
