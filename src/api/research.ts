import api from './client';

type QueryParams = Record<string, string | number | boolean | undefined>;

export const researchApi = {
  getAll: (params?: QueryParams) => api.get('/research', { params }).then(r => r.data),
  getByKey: (key: string) => api.get(`/research/key/${encodeURIComponent(key)}`).then(r => r.data),
  getById: (id: string) => api.get(`/research/${id}`).then(r => r.data),
  create: (data: Record<string, unknown>) => api.post('/research', data).then(r => r.data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/research/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/research/${id}`).then(r => r.data),
};
