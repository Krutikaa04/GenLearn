import api from '../lib/axios';

export const quizzesApi = {
  generate: (dto: {
    topic: string;
    difficulty: string;
    questionCount?: number;
    documentIds?: string[];
    challengeMode?: boolean;
    challengeTopics?: string[];
    timeLimitMinutes?: number;
  }) => api.post('/quizzes/generate', dto),
  list: () => api.get('/quizzes'),
  getById: (id: string) => api.get(`/quizzes/${id}`),
  getStatus: (id: string) => api.get(`/quizzes/${id}/status`),
  submit: (id: string, answers: { questionId: string; selectedIndex: number }[]) =>
    api.post(`/quizzes/${id}/submit`, { answers }),
  delete: (id: string) => api.delete(`/quizzes/${id}`),
  reviewQuiz: (id: string) => api.get(`/quizzes/${id}/review`),
};
