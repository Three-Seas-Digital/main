import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent: ' + result.messageId);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to Three Seas Digital',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Welcome to Three Seas Digital!</h2>
          <p>Hello ${name},</p>
          <p>Thank you for joining Three Seas Digital. We're excited to help you manage your business more efficiently.</p>
          <p>You can now log in to your account and start exploring our features:</p>
          <ul>
            <li>Client Management</li>
            <li>Appointment Scheduling</li>
            <li>Invoice Generation</li>
            <li>Project Tracking</li>
          </ul>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br/>The Three Seas Digital Team</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">Password Reset Request</h2>
          <p>You requested a password reset for your Three Seas Digital account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
            Reset Password
          </a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, you can safely ignore this email.</p>
          <p>Best regards,<br/>The Three Seas Digital Team</p>
        </div>
      `,
    });
  }

  async sendAppointmentReminder(email: string, clientName: string, appointmentDate: Date): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Appointment Reminder',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f39c12;">Appointment Reminder</h2>
          <p>Hello ${clientName},</p>
          <p>This is a reminder about your upcoming appointment:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Date:</strong> ${appointmentDate.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${appointmentDate.toLocaleTimeString()}</p>
          </div>
          <p>Please make sure to arrive a few minutes early.</p>
          <p>If you need to reschedule, please contact us as soon as possible.</p>
          <p>Best regards,<br/>The Three Seas Digital Team</p>
        </div>
      `,
    });
  }

  async sendInvoiceNotification(email: string, invoiceNumber: string, amount: number, dueDate: Date): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Invoice ${invoiceNumber} Available`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #27ae60;">New Invoice Available</h2>
          <p>Hello,</p>
          <p>A new invoice has been generated for your account:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
            <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
            <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</p>
          </div>
          <p>You can view and pay your invoice by logging into your account.</p>
          <p>Thank you for your business!</p>
          <p>Best regards,<br/>The Three Seas Digital Team</p>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();

// Email configuration object for checking if email is configured
export const emailConfig = {
  apiKey: process.env.EMAIL_API_KEY,
  smtp: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  from: process.env.EMAIL_FROM,
};