import api from '../lib/axios';

export const flashcardsApi = {
  generate: (dto: { sourceType: 'document' | 'lesson'; sourceId: string; count?: number }) =>
    api.post('/flashcards/generate', dto),
  list: () => api.get('/flashcards'),
  getById: (id: string) => api.get(`/flashcards/${id}`),
  getStatus: (id: string) => api.get(`/flashcards/${id}/status`),
  delete: (id: string) => api.delete(`/flashcards/${id}`),
};
