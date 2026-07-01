import api from '../lib/axios';

export const documentsApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  list: (page = 1, pageSize = 20) => api.get('/documents', { params: { page, pageSize } }),
  getById: (id: string) => api.get(`/documents/${id}`),
  getStatus: (id: string) => api.get(`/documents/${id}/status`),
  delete: (id: string) => api.delete(`/documents/${id}`),
  ask: (id: string, question: string) => api.post(`/documents/${id}/ask`, { question }),
};
