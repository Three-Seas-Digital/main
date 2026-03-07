import api from './client';

export const authApi = {
  login: (credentials: Record<string, unknown>) => api.post('/auth/login', credentials).then(r => r.data),
  register: (userData: Record<string, unknown>) => api.post('/auth/register', userData).then(r => r.data),
  setup: (adminData: Record<string, unknown>) => api.post('/auth/setup', adminData).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }).then(r => r.data),
};
