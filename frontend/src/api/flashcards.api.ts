import api from '../lib/axios';

export const flashcardsApi = {
  generate: (dto: { sourceType: 'document' | 'lesson'; sourceId: string; count?: number; title?: string }) =>
    api.post('/flashcards/generate', dto),
  list: () => api.get('/flashcards'),
  getById: (id: string) => api.get(`/flashcards/${id}`),
  getStatus: (id: string) => api.get(`/flashcards/${id}/status`),
  delete: (id: string) => api.delete(`/flashcards/${id}`),
  getDue: () => api.get('/flashcards/due'),
  reviewCard: (setId: string, cardId: string, rating: number) =>
    api.patch(`/flashcards/${setId}/cards/${cardId}/review`, { rating }),
};
