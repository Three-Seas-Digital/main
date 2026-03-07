import api from './client';

type QueryParams = Record<string, string | number | boolean | undefined>;

export const invoicesApi = {
  getAll: (params?: QueryParams) => api.get('/invoices', { params }).then(r => r.data),
  getById: (id: string) => api.get(`/invoices/${id}`).then(r => r.data),
  create: (data: Record<string, unknown>) => api.post('/invoices', data).then(r => r.data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/invoices/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/invoices/${id}`).then(r => r.data),
  markPaid: (id: string) => api.put(`/invoices/${id}/mark-paid`).then(r => r.data),
  unmarkPaid: (id: string) => api.put(`/invoices/${id}/unmark-paid`).then(r => r.data),
  generateRecurring: (id: string) => api.post(`/invoices/${id}/generate-recurring`).then(r => r.data),
};
