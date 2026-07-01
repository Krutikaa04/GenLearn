import api from '../lib/axios';

export const lessonsApi = {
  generate: (dto: { topic: string; difficulty: string; documentIds?: string[] }) =>
    api.post('/lessons/generate', dto),
  list: (page = 1, pageSize = 20) => api.get('/lessons', { params: { page, pageSize } }),
  getById: (id: string) => api.get(`/lessons/${id}`),
  getStatus: (id: string) => api.get(`/lessons/${id}/status`),
  delete: (id: string) => api.delete(`/lessons/${id}`),
};
