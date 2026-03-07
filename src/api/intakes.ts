import api from './client';

export const intakesApi = {
  get: (clientId: string) => api.get(`/intakes/${clientId}`).then(r => r.data),
  createOrUpdate: (clientId: string, data: Record<string, unknown>) => api.post(`/intakes/${clientId}`, data).then(r => r.data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/intakes/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/intakes/${id}`).then(r => r.data),
};
