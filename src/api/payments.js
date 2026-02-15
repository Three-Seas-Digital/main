import api from './client.js';

export const paymentsApi = {
  getAll: (params) => api.get('/payments', { params }).then(r => r.data),
  getById: (id) => api.get(`/payments/${id}`).then(r => r.data),
  create: (data) => api.post('/payments', data).then(r => r.data),
  delete: (id) => api.delete(`/payments/${id}`).then(r => r.data),
};
