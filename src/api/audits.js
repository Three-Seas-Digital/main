import api from './client.js';

export const auditsApi = {
  getForClient: (clientId) => api.get(`/audits/client/${clientId}`).then(r => r.data),
  create: (clientId, data) => api.post(`/audits/client/${clientId}`, data).then(r => r.data),
  getById: (id) => api.get(`/audits/${id}`).then(r => r.data),
  update: (id, data) => api.put(`/audits/${id}`, data).then(r => r.data),
  publish: (id) => api.post(`/audits/${id}/publish`).then(r => r.data),
  upsertScores: (id, scores) => api.post(`/audits/${id}/scores`, { scores }).then(r => r.data),
  upsertSubcriteriaScores: (id, scores) => api.post(`/audits/${id}/subcriteria-scores`, { scores }).then(r => r.data),
};
