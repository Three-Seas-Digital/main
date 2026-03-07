import api from './client';

export const clientAuthApi = {
  login: (credentials: Record<string, unknown>) => api.post('/client-auth/login', credentials).then(r => r.data),
  register: (clientData: Record<string, unknown>) => api.post('/client-auth/register', clientData).then(r => r.data),
  logout: () => api.post('/client-auth/logout').then(r => r.data),
  me: () => api.get('/client-auth/me').then(r => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/client-auth/change-password', { currentPassword, newPassword }).then(r => r.data),
  verifyEmail: (token: string) => api.get(`/client-auth/verify-email?token=${token}`).then(r => r.data),
  resendVerification: (email: string) => api.post('/client-auth/resend-verification', { email }).then(r => r.data),
};
