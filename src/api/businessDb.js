import api from './client.js';

export const businessDbApi = {
  getAll: (params) => api.get('/business-db', { params }).then(r => r.data),
  getByKey: (key) => api.get(`/business-db/key/${encodeURIComponent(key)}`).then(r => r.data),
  getById: (id) => api.get(`/business-db/${id}`).then(r => r.data),
  create: (data) => api.post('/business-db', data).then(r => r.data),
  update: (id, data) => api.put(`/business-db/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/business-db/${id}`).then(r => r.data),
};
