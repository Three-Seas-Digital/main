import api from './client.js';

export const researchApi = {
  getAll: (params) => api.get('/research', { params }).then(r => r.data),
  getByKey: (key) => api.get(`/research/key/${encodeURIComponent(key)}`).then(r => r.data),
  getById: (id) => api.get(`/research/${id}`).then(r => r.data),
  create: (data) => api.post('/research', data).then(r => r.data),
  update: (id, data) => api.put(`/research/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/research/${id}`).then(r => r.data),
};
