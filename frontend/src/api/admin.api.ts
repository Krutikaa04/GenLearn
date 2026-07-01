import api from '../lib/axios';

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  listUsers: (page = 1, pageSize = 20, status?: string) =>
    api.get('/admin/users', { params: { page, pageSize, ...(status ? { status } : {}) } }),
  getUser: (userId: string) => api.get(`/admin/users/${userId}`),
  updateUserStatus: (userId: string, status: 'active' | 'suspended') =>
    api.patch(`/admin/users/${userId}/status`, { status }),
};
