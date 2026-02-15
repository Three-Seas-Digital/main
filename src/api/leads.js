import api from './client.js';

export const leadsApi = {
  getAll: (params) => api.get('/leads', { params }).then(r => r.data),
  getById: (id) => api.get(`/leads/${id}`).then(r => r.data),
  create: (data) => api.post('/leads', data).then(r => r.data),
  update: (id, data) => api.put(`/leads/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/leads/${id}`).then(r => r.data),
  // Notes
  addNote: (id, note) => api.post(`/leads/${id}/notes`, note).then(r => r.data),
  deleteNote: (id, noteId) => api.delete(`/leads/${id}/notes/${noteId}`).then(r => r.data),
};
