import api from './client';

export const auditCategoriesApi = {
  getAll: () => api.get('/audit-categories').then(r => r.data),
  create: (data: Record<string, unknown>) => api.post('/audit-categories', data).then(r => r.data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/audit-categories/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/audit-categories/${id}`).then(r => r.data),
  addSubcriteria: (categoryId: string, data: Record<string, unknown>) => api.post(`/audit-categories/${categoryId}/subcriteria`, data).then(r => r.data),
  updateSubcriteria: (id: string, data: Record<string, unknown>) => api.put(`/audit-subcriteria/${id}`, data).then(r => r.data),
  deleteSubcriteria: (id: string) => api.delete(`/audit-subcriteria/${id}`).then(r => r.data),
};
