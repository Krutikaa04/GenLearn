import api from '../lib/axios';

export interface LoginDto { email: string; password: string }
export interface RegisterDto { email: string; password: string; firstName: string; lastName: string }

export const authApi = {
  login: (dto: LoginDto) => api.post('/auth/login', dto),
  register: (dto: RegisterDto) => api.post('/auth/register', dto),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
  verifyEmail: (token: string) => api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  deleteAccount: () => api.delete('/auth/me'),
};
