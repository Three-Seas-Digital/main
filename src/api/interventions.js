import api from './client.js';

export const interventionsApi = {
  // List interventions for a client (with optional filters)
  getForClient: (clientId, params = {}) =>
    api.get(`/clients/${clientId}/interventions`, { params }).then(r => r.data),

  // Get aggregate summary stats for a client
  getSummary: (clientId) =>
    api.get(`/clients/${clientId}/interventions/summary`).then(r => r.data),

  // Create a new intervention
  create: (clientId, data) =>
    api.post(`/clients/${clientId}/interventions`, data).then(r => r.data),

  // Update an intervention
  update: (clientId, id, data) =>
    api.put(`/clients/${clientId}/interventions/${id}`, data).then(r => r.data),

  // Delete an intervention
  delete: (clientId, id) =>
    api.delete(`/clients/${clientId}/interventions/${id}`).then(r => r.data),

  // --- Metrics ---

  // Add a metric to an intervention
  addMetric: (clientId, interventionId, data) =>
    api.post(`/clients/${clientId}/interventions/${interventionId}/metrics`, data).then(r => r.data),

  // Update a metric
  updateMetric: (clientId, interventionId, metricId, data) =>
    api.put(`/clients/${clientId}/interventions/${interventionId}/metrics/${metricId}`, data).then(r => r.data),

  // --- Snapshots ---

  // Capture a point-in-time snapshot of all metrics
  captureSnapshot: (clientId, interventionId, data = {}) =>
    api.post(`/clients/${clientId}/interventions/${interventionId}/snapshots`, data).then(r => r.data),

  // List snapshots for an intervention
  getSnapshots: (clientId, interventionId) =>
    api.get(`/clients/${clientId}/interventions/${interventionId}/snapshots`).then(r => r.data),

  // --- Screenshots ---

  // Upload before/after screenshots (multipart form data)
  uploadScreenshots: (clientId, interventionId, formData) =>
    api.post(`/clients/${clientId}/interventions/${interventionId}/screenshots`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
};
