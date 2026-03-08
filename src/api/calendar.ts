import api from './client';

export const calendarApi = {
  // Business Hours
  getMyHours: () => api.get('/calendar/hours').then(r => r.data),
  updateMyHours: (hours: any[]) => api.put('/calendar/hours', { hours }).then(r => r.data),
  getUserHours: (userId: string) => api.get(`/calendar/hours/${userId}`).then(r => r.data),

  // Events
  getEvents: (start: string, end: string) => api.get('/calendar/events', { params: { start, end } }).then(r => r.data),
  createEvent: (data: Record<string, unknown>) => api.post('/calendar/events', data).then(r => r.data),
  updateEvent: (id: string, data: Record<string, unknown>) => api.put(`/calendar/events/${id}`, data).then(r => r.data),
  deleteEvent: (id: string) => api.delete(`/calendar/events/${id}`).then(r => r.data),

  // Sharing
  getSharing: () => api.get('/calendar/sharing').then(r => r.data),
  updateSharing: (shares: any[]) => api.put('/calendar/sharing', { shares }).then(r => r.data),

  // Team View
  getTeamAvailability: (date: string) => api.get('/calendar/team', { params: { date } }).then(r => r.data),

  // Google Calendar
  getGoogleStatus: () => api.get('/calendar/google/status').then(r => r.data),
  getGoogleAuthUrl: () => api.get('/calendar/google/auth-url').then(r => r.data),
  syncGoogle: () => api.post('/calendar/google/sync').then(r => r.data),
  disconnectGoogle: () => api.delete('/calendar/google/disconnect').then(r => r.data),

  // AI Agent
  agentChat: (message: string, context?: Record<string, unknown>) =>
    api.post('/calendar/agent/chat', { message, context }).then(r => r.data),
  agentExecute: (actionId: string) =>
    api.post('/calendar/agent/execute', { actionId }).then(r => r.data),
};
