import api from './client';

type QueryParams = Record<string, string | number | boolean | undefined>;

export const clientsApi = {
  getAll: (params?: QueryParams) => api.get('/clients', { params }).then(r => r.data),
  getById: (id: string) => api.get(`/clients/${id}`).then(r => r.data),
  create: (data: Record<string, unknown>) => api.post('/clients', data).then(r => r.data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/clients/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/clients/${id}`).then(r => r.data),
  approve: (id: string) => api.put(`/clients/${id}/approve`).then(r => r.data),
  reject: (id: string) => api.put(`/clients/${id}/reject`).then(r => r.data),
  archive: (id: string) => api.put(`/clients/${id}/archive`).then(r => r.data),
  restore: (id: string) => api.put(`/clients/${id}/restore`).then(r => r.data),
  // Notes
  addNote: (id: string, note: Record<string, unknown>) => api.post(`/clients/${id}/notes`, note).then(r => r.data),
  deleteNote: (id: string, noteId: string) => api.delete(`/clients/${id}/notes/${noteId}`).then(r => r.data),
  // Tags
  addTag: (id: string, tag: string) => api.post(`/clients/${id}/tags`, { tag }).then(r => r.data),
  removeTag: (id: string, tag: string) => api.delete(`/clients/${id}/tags/${encodeURIComponent(tag)}`).then(r => r.data),
  // Password management
  setPassword: (id: string, password: string, mustChangePassword: boolean = true) =>
    api.put(`/clients/${id}/set-password`, { password, mustChangePassword }).then(r => r.data),
  // Documents
  uploadDocument: (id: string, formData: FormData) => api.post(`/clients/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data),
  saveDocumentMetadata: (id: string, metadata: Record<string, unknown>) => api.post(`/clients/${id}/documents/metadata`, metadata).then(r => r.data),
  deleteDocument: (id: string, docId: string) => api.delete(`/clients/${id}/documents/${docId}`).then(r => r.data),
};
