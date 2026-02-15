import api from './client.js';

export const expensesApi = {
  getAll: (params) => api.get('/expenses', { params }).then(r => r.data),
  getById: (id) => api.get(`/expenses/${id}`).then(r => r.data),
  create: (data) => api.post('/expenses', data).then(r => r.data),
  update: (id, data) => api.put(`/expenses/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/expenses/${id}`).then(r => r.data),
  // Receipt upload (multipart form data with compressed image)
  uploadReceipt: (id, formData) => api.post(`/expenses/${id}/receipt`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data),
};
