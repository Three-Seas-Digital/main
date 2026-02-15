import api from './client.js';

export const portalApi = {
  // Dashboard
  getDashboard: () => api.get('/portal/dashboard').then(r => r.data),

  // Audits
  getAudits: () => api.get('/portal/audits').then(r => r.data),
  getScoreHistory: () => api.get('/portal/score-history').then(r => r.data),

  // Recommendations
  getRecommendations: () => api.get('/portal/recommendations').then(r => r.data),
  acceptRecommendation: (id) => api.post(`/portal/recommendations/${id}/accept`).then(r => r.data),
  declineRecommendation: (id, reason) => api.post(`/portal/recommendations/${id}/decline`, { decline_reason: reason }).then(r => r.data),
  postThread: (id, message) => api.post(`/portal/recommendations/${id}/thread`, { message }).then(r => r.data),
  getThreads: (id) => api.get(`/portal/recommendations/${id}/threads`).then(r => r.data),

  // Growth Metrics
  getMetrics: () => api.get('/portal/metrics').then(r => r.data),

  // Financials
  getFinancials: () => api.get('/portal/financials').then(r => r.data),
  getRevenue: () => api.get('/portal/financials/revenue').then(r => r.data),
  getExpenses: () => api.get('/portal/financials/expenses').then(r => r.data),

  // Interventions
  getInterventions: () => api.get('/portal/interventions').then(r => r.data),

  // Service Requests
  submitServiceRequest: (data) => api.post('/portal/service-requests', data).then(r => r.data),
  getServiceRequests: () => api.get('/portal/service-requests').then(r => r.data),

  // Feedback
  submitFeedback: (data) => api.post('/portal/feedback', data).then(r => r.data),
  getFeedback: () => api.get('/portal/feedback').then(r => r.data),

  // Notifications
  getNotifications: () => api.get('/portal/notifications').then(r => r.data),
  updateNotificationPrefs: (prefs) => api.put('/portal/notification-prefs', prefs).then(r => r.data),
};
