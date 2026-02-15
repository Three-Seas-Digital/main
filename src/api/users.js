import api from './client.js';

export const usersApi = {
  getAll: (params) => api.get('/users', { params }).then(r => r.data),
  getById: (id) => api.get(`/users/${id}`).then(r => r.data),
  create: (data) => api.post('/users', data).then(r => r.data),
  update: (id, data) => api.put(`/users/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/users/${id}`).then(r => r.data),
  approve: (id, role) => api.put(`/users/${id}/approve`, { role }).then(r => r.data),
  reject: (id) => api.put(`/users/${id}/reject`).then(r => r.data),
};
