import api from './client';

type QueryParams = Record<string, string | number | boolean | undefined>;

export const prospectsApi = {
  getAll: (params?: QueryParams) => api.get('/prospects', { params }).then(r => r.data),
  getById: (id: string) => api.get(`/prospects/${id}`).then(r => r.data),
  create: (data: Record<string, unknown>) => api.post('/prospects', data).then(r => r.data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/prospects/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/prospects/${id}`).then(r => r.data),
  convertToClient: (id: string) => api.post(`/prospects/${id}/convert`).then(r => r.data),
  // Notes
  addNote: (id: string, note: Record<string, unknown>) => api.post(`/prospects/${id}/notes`, note).then(r => r.data),
  deleteNote: (id: string, noteId: string) => api.delete(`/prospects/${id}/notes/${noteId}`).then(r => r.data),
  // Documents
  uploadDocument: (id: string, formData: FormData) => api.post(`/prospects/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data),
  deleteDocument: (id: string, docId: string) => api.delete(`/prospects/${id}/documents/${docId}`).then(r => r.data),
};
