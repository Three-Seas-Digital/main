import api from './client';

type QueryParams = Record<string, string | number | boolean | undefined>;

export const businessDbApi = {
  getAll: (params?: QueryParams) => api.get('/business-db', { params }).then(r => r.data),
  getByKey: (key: string) => api.get(`/business-db/key/${encodeURIComponent(key)}`).then(r => r.data),
  getById: (id: string) => api.get(`/business-db/${id}`).then(r => r.data),
  create: (data: Record<string, unknown>) => api.post('/business-db', data).then(r => r.data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/business-db/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/business-db/${id}`).then(r => r.data),
};
