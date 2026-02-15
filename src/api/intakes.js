import api from './client.js';

export const intakesApi = {
  get: (clientId) => api.get(`/intakes/${clientId}`).then(r => r.data),
  createOrUpdate: (clientId, data) => api.post(`/intakes/${clientId}`, data).then(r => r.data),
  update: (id, data) => api.put(`/intakes/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/intakes/${id}`).then(r => r.data),
};
