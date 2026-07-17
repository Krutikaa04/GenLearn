import api from '../lib/axios';

// Learning Intelligence & Prediction System (Sprint 5) — read-only views.
export const lipsApi = {
  conceptProgress: () => api.get('/lips/concept-progress'),
  timeline: (limit = 50) => api.get('/lips/timeline', { params: { limit } }),
  revisionForecast: () => api.get('/lips/revision-forecast'),
  prediction: () => api.get('/lips/prediction'),
  insights: () => api.get('/lips/insights'),
  coach: () => api.get('/lips/coach'),
  weeklySummary: () => api.get('/lips/weekly-summary'),
};
