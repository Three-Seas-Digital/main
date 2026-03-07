import api from './client';

type QueryParams = Record<string, string | number | boolean | undefined>;

export const appointmentsApi = {
  getAll: (params?: QueryParams) => api.get('/appointments', { params }).then(r => r.data),
  getById: (id: string) => api.get(`/appointments/${id}`).then(r => r.data),
  create: (data: Record<string, unknown>) => api.post('/appointments', data).then(r => r.data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/appointments/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/appointments/${id}`).then(r => r.data),
  updateStatus: (id: string, status: string) => api.put(`/appointments/${id}/status`, { status }).then(r => r.data),
  addFollowUpNote: (id: string, note: Record<string, unknown>) => api.post(`/appointments/${id}/follow-up-notes`, note).then(r => r.data),
};
