export const emailConfig = {
  from: {
    name: process.env.EMAIL_FROM_NAME || 'Three Seas Digital',
    email: process.env.EMAIL_FROM_ADDRESS || 'billing@threeseas.dev',
  },
  replyTo: process.env.EMAIL_REPLY_TO || 'support@threeseas.dev',
  provider: process.env.EMAIL_PROVIDER || 'resend', // 'resend' | 'sendgrid' | 'smtp'
  apiKey: process.env.EMAIL_API_KEY,
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};
