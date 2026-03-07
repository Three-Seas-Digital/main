import api from './client';

export const recommendationsApi = {
  getTemplates: () => api.get('/recommendation-templates').then(r => r.data),
  createTemplate: (data: Record<string, unknown>) => api.post('/recommendation-templates', data).then(r => r.data),
  updateTemplate: (id: string, data: Record<string, unknown>) => api.put(`/recommendation-templates/${id}`, data).then(r => r.data),
  deleteTemplate: (id: string) => api.delete(`/recommendation-templates/${id}`).then(r => r.data),
  getForClient: (clientId: string) => api.get(`/recommendations/client/${clientId}`).then(r => r.data),
  addToAudit: (auditId: string, data: Record<string, unknown>) => api.post(`/audits/${auditId}/recommendations`, data).then(r => r.data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/recommendations/${id}`, data).then(r => r.data),
  updateStatus: (id: string, status: string, details?: Record<string, unknown>) => api.put(`/recommendations/${id}/status`, { status, ...details }).then(r => r.data),
  delete: (id: string) => api.delete(`/recommendations/${id}`).then(r => r.data),
  getThreads: (id: string) => api.get(`/recommendations/${id}/threads`).then(r => r.data),
  addThread: (id: string, message: Record<string, unknown>) => api.post(`/recommendations/${id}/threads`, message).then(r => r.data),
};
