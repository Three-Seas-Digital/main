import api from './client.js';

export const recommendationsApi = {
  getTemplates: () => api.get('/recommendation-templates').then(r => r.data),
  createTemplate: (data) => api.post('/recommendation-templates', data).then(r => r.data),
  updateTemplate: (id, data) => api.put(`/recommendation-templates/${id}`, data).then(r => r.data),
  deleteTemplate: (id) => api.delete(`/recommendation-templates/${id}`).then(r => r.data),
  getForClient: (clientId) => api.get(`/recommendations/client/${clientId}`).then(r => r.data),
  addToAudit: (auditId, data) => api.post(`/audits/${auditId}/recommendations`, data).then(r => r.data),
  update: (id, data) => api.put(`/recommendations/${id}`, data).then(r => r.data),
  updateStatus: (id, status, details) => api.put(`/recommendations/${id}/status`, { status, ...details }).then(r => r.data),
  delete: (id) => api.delete(`/recommendations/${id}`).then(r => r.data),
  getThreads: (id) => api.get(`/recommendations/${id}/threads`).then(r => r.data),
  addThread: (id, message) => api.post(`/recommendations/${id}/threads`, message).then(r => r.data),
};
