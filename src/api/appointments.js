import api from './client.js';

export const appointmentsApi = {
  getAll: (params) => api.get('/appointments', { params }).then(r => r.data),
  getById: (id) => api.get(`/appointments/${id}`).then(r => r.data),
  create: (data) => api.post('/appointments', data).then(r => r.data),
  update: (id, data) => api.put(`/appointments/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/appointments/${id}`).then(r => r.data),
  updateStatus: (id, status) => api.put(`/appointments/${id}/status`, { status }).then(r => r.data),
  addFollowUpNote: (id, note) => api.post(`/appointments/${id}/follow-up-notes`, note).then(r => r.data),
};
