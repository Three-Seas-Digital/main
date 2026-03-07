import api from './client';

type QueryParams = Record<string, string | number | boolean | undefined>;

export const expensesApi = {
  getAll: (params?: QueryParams) => api.get('/expenses', { params }).then(r => r.data),
  getById: (id: string) => api.get(`/expenses/${id}`).then(r => r.data),
  create: (data: Record<string, unknown>) => api.post('/expenses', data).then(r => r.data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/expenses/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/expenses/${id}`).then(r => r.data),
  // Receipt upload (multipart form data with compressed image)
  uploadReceipt: (id: string, formData: FormData) => api.post(`/expenses/${id}/receipt`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data),
};
