import api from './client.js';

export const prospectsApi = {
  getAll: (params) => api.get('/prospects', { params }).then(r => r.data),
  getById: (id) => api.get(`/prospects/${id}`).then(r => r.data),
  create: (data) => api.post('/prospects', data).then(r => r.data),
  update: (id, data) => api.put(`/prospects/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/prospects/${id}`).then(r => r.data),
  convertToClient: (id) => api.post(`/prospects/${id}/convert`).then(r => r.data),
  // Notes
  addNote: (id, note) => api.post(`/prospects/${id}/notes`, note).then(r => r.data),
  deleteNote: (id, noteId) => api.delete(`/prospects/${id}/notes/${noteId}`).then(r => r.data),
  // Documents
  uploadDocument: (id, formData) => api.post(`/prospects/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data),
  deleteDocument: (id, docId) => api.delete(`/prospects/${id}/documents/${docId}`).then(r => r.data),
};
