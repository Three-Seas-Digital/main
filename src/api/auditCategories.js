import api from './client.js';

export const auditCategoriesApi = {
  getAll: () => api.get('/audit-categories').then(r => r.data),
  create: (data) => api.post('/audit-categories', data).then(r => r.data),
  update: (id, data) => api.put(`/audit-categories/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/audit-categories/${id}`).then(r => r.data),
  addSubcriteria: (categoryId, data) => api.post(`/audit-categories/${categoryId}/subcriteria`, data).then(r => r.data),
  updateSubcriteria: (id, data) => api.put(`/audit-subcriteria/${id}`, data).then(r => r.data),
  deleteSubcriteria: (id) => api.delete(`/audit-subcriteria/${id}`).then(r => r.data),
};
