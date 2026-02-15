import api from './client.js';

export const timeEntriesApi = {
  getAll: (params) => api.get('/time-entries', { params }).then(r => r.data),
  getById: (id) => api.get(`/time-entries/${id}`).then(r => r.data),
  create: (data) => api.post('/time-entries', data).then(r => r.data),
  update: (id, data) => api.put(`/time-entries/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/time-entries/${id}`).then(r => r.data),
};
