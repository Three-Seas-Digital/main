import api from './client.js';

export const clientAuthApi = {
  login: (credentials) => api.post('/client-auth/login', credentials).then(r => r.data),
  register: (clientData) => api.post('/client-auth/register', clientData).then(r => r.data),
  logout: () => api.post('/client-auth/logout').then(r => r.data),
  me: () => api.get('/client-auth/me').then(r => r.data),
  changePassword: (currentPassword, newPassword) =>
    api.put('/client-auth/change-password', { currentPassword, newPassword }).then(r => r.data),
  verifyEmail: (token) => api.get(`/client-auth/verify-email?token=${token}`).then(r => r.data),
  resendVerification: (email) => api.post('/client-auth/resend-verification', { email }).then(r => r.data),
};
