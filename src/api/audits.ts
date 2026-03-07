import api from './client';

export const auditsApi = {
  getForClient: (clientId: string) => api.get(`/audits/client/${clientId}`).then(r => r.data),
  create: (clientId: string, data: Record<string, unknown>) => api.post(`/audits/client/${clientId}`, data).then(r => r.data),
  getById: (id: string) => api.get(`/audits/${id}`).then(r => r.data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/audits/${id}`, data).then(r => r.data),
  publish: (id: string) => api.post(`/audits/${id}/publish`).then(r => r.data),
  upsertScores: (id: string, scores: Record<string, unknown>[]) => api.post(`/audits/${id}/scores`, { scores }).then(r => r.data),
  upsertSubcriteriaScores: (id: string, scores: Record<string, unknown>[]) => api.post(`/audits/${id}/subcriteria-scores`, { scores }).then(r => r.data),
};
