import api from './client.js';

export const aiRecommendationsApi = {
  // Snapshot management
  compileSnapshot: (clientId, data) =>
    api.post(`/ai-recommendations/clients/${clientId}/snapshots`, data).then(r => r.data),
  listSnapshots: (clientId, params) =>
    api.get(`/ai-recommendations/clients/${clientId}/snapshots`, { params }).then(r => r.data),
  getSnapshot: (clientId, snapshotId) =>
    api.get(`/ai-recommendations/clients/${clientId}/snapshots/${snapshotId}`).then(r => r.data),

  // Analysis management
  analyze: (clientId, data) =>
    api.post(`/ai-recommendations/clients/${clientId}/analyze`, data, { timeout: 90000 }).then(r => r.data),
  listAnalyses: (clientId) =>
    api.get(`/ai-recommendations/clients/${clientId}/analyses`).then(r => r.data),
  getAnalysis: (clientId, analysisId) =>
    api.get(`/ai-recommendations/clients/${clientId}/analyses/${analysisId}`).then(r => r.data),
  updateItem: (clientId, analysisId, itemId, data) =>
    api.put(`/ai-recommendations/clients/${clientId}/analyses/${analysisId}/items/${itemId}`, data).then(r => r.data),
  deleteAnalysis: (clientId, analysisId) =>
    api.delete(`/ai-recommendations/clients/${clientId}/analyses/${analysisId}`).then(r => r.data),
};
