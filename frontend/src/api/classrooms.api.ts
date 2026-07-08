import api from '../lib/axios';

export const classroomsApi = {
  // Teacher
  create: (dto: { name: string; description?: string }) => api.post('/classrooms', dto),
  listOwn: () => api.get('/classrooms'),
  getRoster: (classroomId: string) => api.get(`/classrooms/${classroomId}`),
  getDashboard: (classroomId: string) => api.get(`/classrooms/${classroomId}/dashboard`),
  getStudentReport: (classroomId: string, studentId: string, page = 1, pageSize = 20) =>
    api.get(`/classrooms/${classroomId}/students/${studentId}/report`, { params: { page, pageSize } }),
  removeStudent: (classroomId: string, studentId: string) =>
    api.delete(`/classrooms/${classroomId}/students/${studentId}`),
  delete: (classroomId: string) => api.delete(`/classrooms/${classroomId}`),

  // Student
  join: (joinCode: string) => api.post('/classrooms/join', { joinCode }),
  listJoined: () => api.get('/classrooms/mine'),
  leave: (classroomId: string) => api.post(`/classrooms/${classroomId}/leave`),
};
