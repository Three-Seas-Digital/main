import api from './client.js';

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials).then(r => r.data),
  register: (userData) => api.post('/auth/register', userData).then(r => r.data),
  setup: (adminData) => api.post('/auth/setup', adminData).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }).then(r => r.data),
};
