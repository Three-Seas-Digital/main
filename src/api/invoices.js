import api from './client.js';

export const invoicesApi = {
  getAll: (params) => api.get('/invoices', { params }).then(r => r.data),
  getById: (clientId, invoiceId) => api.get(`/clients/${clientId}/invoices/${invoiceId}`).then(r => r.data),
  create: (clientId, data) => api.post(`/clients/${clientId}/invoices`, data).then(r => r.data),
  update: (clientId, invoiceId, data) => api.put(`/clients/${clientId}/invoices/${invoiceId}`, data).then(r => r.data),
  delete: (clientId, invoiceId) => api.delete(`/clients/${clientId}/invoices/${invoiceId}`).then(r => r.data),
  markPaid: (clientId, invoiceId) => api.put(`/clients/${clientId}/invoices/${invoiceId}/pay`).then(r => r.data),
  unmarkPaid: (clientId, invoiceId) => api.put(`/clients/${clientId}/invoices/${invoiceId}/unpay`).then(r => r.data),
  generateRecurring: (clientId, invoiceId) => api.post(`/clients/${clientId}/invoices/${invoiceId}/recurring`).then(r => r.data),
};
