import api from './client.js';

export const invoicesApi = {
  getAll: (params) => api.get('/invoices', { params }).then(r => r.data),
  getById: (id) => api.get(`/invoices/${id}`).then(r => r.data),
  create: (data) => api.post('/invoices', data).then(r => r.data),
  update: (id, data) => api.put(`/invoices/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/invoices/${id}`).then(r => r.data),
  markPaid: (id) => api.put(`/invoices/${id}/mark-paid`).then(r => r.data),
  unmarkPaid: (id) => api.put(`/invoices/${id}/unmark-paid`).then(r => r.data),
  generateRecurring: (id) => api.post(`/invoices/${id}/generate-recurring`).then(r => r.data),
};
