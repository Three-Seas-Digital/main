import api from './client.js';

export const clientsApi = {
  getAll: (params) => api.get('/clients', { params }).then(r => r.data),
  getById: (id) => api.get(`/clients/${id}`).then(r => r.data),
  create: (data) => api.post('/clients', data).then(r => r.data),
  update: (id, data) => api.put(`/clients/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/clients/${id}`).then(r => r.data),
  approve: (id) => api.put(`/clients/${id}/approve`).then(r => r.data),
  reject: (id) => api.put(`/clients/${id}/reject`).then(r => r.data),
  archive: (id) => api.put(`/clients/${id}/archive`).then(r => r.data),
  restore: (id) => api.put(`/clients/${id}/restore`).then(r => r.data),
  // Notes
  addNote: (id, note) => api.post(`/clients/${id}/notes`, note).then(r => r.data),
  deleteNote: (id, noteId) => api.delete(`/clients/${id}/notes/${noteId}`).then(r => r.data),
  // Tags
  addTag: (id, tag) => api.post(`/clients/${id}/tags`, { tag }).then(r => r.data),
  removeTag: (id, tag) => api.delete(`/clients/${id}/tags/${encodeURIComponent(tag)}`).then(r => r.data),
  // Password management
  setPassword: (id, password, mustChangePassword = true) =>
    api.put(`/clients/${id}/set-password`, { password, mustChangePassword }).then(r => r.data),
  // Documents
  uploadDocument: (id, formData) => api.post(`/clients/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data),
  saveDocumentMetadata: (id, metadata) => api.post(`/clients/${id}/documents/metadata`, metadata).then(r => r.data),
  deleteDocument: (id, docId) => api.delete(`/clients/${id}/documents/${docId}`).then(r => r.data),
};
