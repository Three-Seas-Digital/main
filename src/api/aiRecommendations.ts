import api from './client';

type QueryParams = Record<string, string | number | boolean | undefined>;

export const aiRecommendationsApi = {
  // Snapshot management
  compileSnapshot: (clientId: string, data: Record<string, unknown>) =>
    api.post(`/ai-recommendations/clients/${clientId}/snapshots`, data).then(r => r.data),
  listSnapshots: (clientId: string, params?: QueryParams) =>
    api.get(`/ai-recommendations/clients/${clientId}/snapshots`, { params }).then(r => r.data),
  getSnapshot: (clientId: string, snapshotId: string) =>
    api.get(`/ai-recommendations/clients/${clientId}/snapshots/${snapshotId}`).then(r => r.data),

  // Analysis management
  analyze: (clientId: string, data: Record<string, unknown>) =>
    api.post(`/ai-recommendations/clients/${clientId}/analyze`, data, { timeout: 90000 }).then(r => r.data),
  listAnalyses: (clientId: string) =>
    api.get(`/ai-recommendations/clients/${clientId}/analyses`).then(r => r.data),
  getAnalysis: (clientId: string, analysisId: string) =>
    api.get(`/ai-recommendations/clients/${clientId}/analyses/${analysisId}`).then(r => r.data),
  updateItem: (clientId: string, analysisId: string, itemId: string, data: Record<string, unknown>) =>
    api.put(`/ai-recommendations/clients/${clientId}/analyses/${analysisId}/items/${itemId}`, data).then(r => r.data),
  deleteAnalysis: (clientId: string, analysisId: string) =>
    api.delete(`/ai-recommendations/clients/${clientId}/analyses/${analysisId}`).then(r => r.data),
};
