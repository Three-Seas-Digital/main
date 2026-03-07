import api from './client';

type QueryParams = Record<string, string | number | boolean | undefined>;

export const paymentsApi = {
  getAll: (params?: QueryParams) => api.get('/payments', { params }).then(r => r.data),
  getById: (id: string) => api.get(`/payments/${id}`).then(r => r.data),
  create: (data: Record<string, unknown>) => api.post('/payments', data).then(r => r.data),
  delete: (id: string) => api.delete(`/payments/${id}`).then(r => r.data),
};
