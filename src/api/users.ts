import api from './client';

type QueryParams = Record<string, string | number | boolean | undefined>;

export const usersApi = {
  getAll: (params?: QueryParams) => api.get('/users', { params }).then(r => r.data),
  getById: (id: string) => api.get(`/users/${id}`).then(r => r.data),
  create: (data: Record<string, unknown>) => api.post('/users', data).then(r => r.data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/users/${id}`).then(r => r.data),
  approve: (id: string, role: string) => api.put(`/users/${id}/approve`, { role }).then(r => r.data),
  reject: (id: string) => api.put(`/users/${id}/reject`).then(r => r.data),
};
