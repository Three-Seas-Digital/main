import api from './client';

type QueryParams = Record<string, string | number | boolean | undefined>;

export const timeEntriesApi = {
  getAll: (params?: QueryParams) => api.get('/time-entries', { params }).then(r => r.data),
  getById: (id: string) => api.get(`/time-entries/${id}`).then(r => r.data),
  create: (data: Record<string, unknown>) => api.post('/time-entries', data).then(r => r.data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/time-entries/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/time-entries/${id}`).then(r => r.data),
};
