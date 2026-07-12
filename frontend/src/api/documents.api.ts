import api from '../lib/axios';

export const documentsApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    // Do NOT set Content-Type manually: the browser/axios must generate the
    // `multipart/form-data; boundary=…` header itself. Hardcoding it drops the
    // boundary, so the backend's multipart parser sees no file (FILE_REQUIRED)
    // and the upload silently fails.
    return api.post('/documents/upload', form);
  },
  list: (page = 1, pageSize = 20) => api.get('/documents', { params: { page, pageSize } }),
  getById: (id: string) => api.get(`/documents/${id}`),
  getStatus: (id: string) => api.get(`/documents/${id}/status`),
  delete: (id: string) => api.delete(`/documents/${id}`),
  ask: (id: string, question: string) => api.post(`/documents/${id}/ask`, { question }),
};
