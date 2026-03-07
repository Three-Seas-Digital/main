import api from './client';

type QueryParams = Record<string, string | number | boolean | undefined>;

export const leadsApi = {
  getAll: (params?: QueryParams) => api.get('/leads', { params }).then(r => r.data),
  getById: (id: string) => api.get(`/leads/${id}`).then(r => r.data),
  create: (data: Record<string, unknown>) => api.post('/leads', data).then(r => r.data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/leads/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/leads/${id}`).then(r => r.data),
  // Notes
  addNote: (id: string, note: Record<string, unknown>) => api.post(`/leads/${id}/notes`, note).then(r => r.data),
  deleteNote: (id: string, noteId: string) => api.delete(`/leads/${id}/notes/${noteId}`).then(r => r.data),
};
