import { emailConfig } from '../config/email.js';
import { generateId } from '../utils/generateId.js';
import pool from '../config/db.js';

let resendClient = null;
let nodemailerTransport = null;

async function getResendClient() {
  if (resendClient) return resendClient;
  const { Resend } = await import('resend');
  resendClient = new Resend(emailConfig.apiKey);
  return resendClient;
}

async function getNodemailerTransport() {
  if (nodemailerTransport) return nodemailerTransport;
  const nodemailer = await import('nodemailer');
  nodemailerTransport = nodemailer.default.createTransport({
    host: emailConfig.smtp.host,
    port: emailConfig.smtp.port,
    secure: emailConfig.smtp.secure,
    auth: {
      user: emailConfig.smtp.user,
      pass: emailConfig.smtp.pass,
    },
  });
  return nodemailerTransport;
}

function buildInvoiceEmailHtml(invoice, client, payment) {
  const paidDate = payment?.created_at
    ? new Date(payment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const amount = parseFloat(invoice.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const invoiceDate = invoice.created_at
    ? new Date(invoice.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : paidDate;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#0a2540,#1a4a7a);padding:32px 40px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Three Seas Digital</h1>
        <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Invoice Receipt</p>
      </div>

      <!-- Body -->
      <div style="padding:40px;">
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;margin-bottom:32px;">
          <p style="color:#16a34a;font-weight:600;margin:0;font-size:16px;">Payment Successful</p>
        </div>

        <p style="color:#374151;margin:0 0 24px;line-height:1.6;">
          Hi ${client.name || 'Valued Client'},<br><br>
          Thank you for your payment. Here are the details of your transaction:
        </p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Invoice</td>
            <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:#111827;">${invoice.title || 'Invoice'}</td>
          </tr>
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Invoice Date</td>
            <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#111827;">${invoiceDate}</td>
          </tr>
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Paid Date</td>
            <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#111827;">${paidDate}</td>
          </tr>
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Payment Method</td>
            <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#111827;">${payment?.provider || payment?.method || 'Card'}</td>
          </tr>
          <tr>
            <td style="padding:16px 0;color:#6b7280;font-size:14px;font-weight:600;">Amount Paid</td>
            <td style="padding:16px 0;text-align:right;font-size:24px;font-weight:700;color:#111827;">${amount}</td>
          </tr>
        </table>

        ${invoice.description ? `<p style="color:#6b7280;font-size:14px;margin:0 0 24px;line-height:1.5;"><strong>Description:</strong> ${invoice.description}</p>` : ''}

        <p style="color:#6b7280;font-size:13px;margin:24px 0 0;line-height:1.5;">
          If you have any questions, reply to this email or contact us at ${emailConfig.replyTo}.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">
          &copy; ${new Date().getFullYear()} Three Seas Digital. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function logEmail(emailData) {
  const id = generateId();
  try {
    await pool.query(
      `INSERT INTO email_log (id, recipient_email, recipient_name, subject, template_type, related_invoice_id, status, provider, provider_message_id, error_message, sent_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, emailData.recipientEmail, emailData.recipientName || null, emailData.subject,
       emailData.templateType || null, emailData.invoiceId || null,
       emailData.status, emailData.provider || null, emailData.messageId || null,
       emailData.error || null, emailData.sentAt || null]
    );
  } catch (err) {
    console.error('[emailService] Failed to log email:', err.message);
  }
  return id;
}

async function sendViaResend(to, subject, html) {
  const resend = await getResendClient();
  const result = await resend.emails.send({
    from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
    to: [to],
    subject,
    html,
    reply_to: emailConfig.replyTo,
  });
  return { messageId: result.data?.id, provider: 'resend' };
}

async function sendViaSMTP(to, subject, html) {
  const transport = await getNodemailerTransport();
  const result = await transport.sendMail({
    from: `"${emailConfig.from.name}" <${emailConfig.from.email}>`,
    to,
    subject,
    html,
    replyTo: emailConfig.replyTo,
  });
  return { messageId: result.messageId, provider: 'smtp' };
}

async function sendEmail(to, subject, html) {
  switch (emailConfig.provider) {
    case 'resend':
      return sendViaResend(to, subject, html);
    case 'smtp':
      return sendViaSMTP(to, subject, html);
    default:
      throw new Error(`Unknown email provider: ${emailConfig.provider}`);
  }
}

function buildVerificationEmailHtml(client, verifyUrl) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#0a2540,#1a4a7a);padding:32px 40px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Three Seas Digital</h1>
        <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Verify Your Email</p>
      </div>

      <!-- Body -->
      <div style="padding:40px;">
        <p style="color:#374151;margin:0 0 16px;line-height:1.6;font-size:16px;">
          Hi ${client.name || 'there'},
        </p>

        <p style="color:#374151;margin:0 0 24px;line-height:1.6;">
          Thanks for registering with Three Seas Digital. Please verify your email address by clicking the button below.
        </p>

        <!-- CTA Button -->
        <div style="text-align:center;margin:28px 0;">
          <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#1a4a7a,#2563eb);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
            Verify Email Address
          </a>
        </div>

        <p style="color:#6b7280;font-size:13px;margin:16px 0 0;line-height:1.5;">
          This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>

        <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;line-height:1.5;word-break:break-all;">
          If the button doesn't work, copy and paste this link:<br>${verifyUrl}
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">
          &copy; ${new Date().getFullYear()} Three Seas Digital. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendVerificationEmail(client, token) {
  const baseUrl = process.env.APP_URL || 'https://threeseas.dev';
  const verifyUrl = `${baseUrl}/services?verify=${token}`;
  const subject = 'Verify your email — Three Seas Digital';
  const html = buildVerificationEmailHtml(client, verifyUrl);
  const recipientEmail = client.email;

  if (!recipientEmail) {
    return { success: false, error: 'Client has no email address' };
  }

  try {
    const { messageId, provider } = await sendEmail(recipientEmail, subject, html);
    await logEmail({
      recipientEmail,
      recipientName: client.name,
      subject,
      templateType: 'email_verification',
      status: 'sent',
      provider,
      messageId,
      sentAt: new Date().toISOString(),
    });
    console.log(`[emailService] Verification email sent to ${recipientEmail}`);
    return { success: true, messageId };
  } catch (err) {
    console.error(`[emailService] Failed to send verification email:`, err.message);
    await logEmail({
      recipientEmail,
      recipientName: client.name,
      subject,
      templateType: 'email_verification',
      status: 'failed',
      error: err.message,
    });
    return { success: false, error: err.message };
  }
}

function buildWelcomeEmailHtml(client, options = {}) {
  const portalUrl = options.portalUrl || process.env.APP_URL || 'https://threeseas.dev';
  const loginUrl = `${portalUrl}/login`;
  const tierLabel = client.tier ? client.tier.charAt(0).toUpperCase() + client.tier.slice(1) : null;

  // Merge custom body paragraphs if provided (admin-edited template body)
  const customBodyHtml = options.customBody
    ? options.customBody
        .split('\n\n')
        .map(p => `<p style="color:#374151;margin:0 0 16px;line-height:1.6;">${p.replace(/\n/g, '<br>')}</p>`)
        .join('')
    : '';

  // Onboarding steps checklist
  const steps = [
    { label: 'Log in to your client portal', done: false },
    { label: 'Change your temporary password', done: false },
    { label: 'Complete your business profile', done: false },
    { label: 'Review your onboarding documents', done: false },
    { label: 'Schedule your kickoff call', done: false },
  ];

  const stepsHtml = steps.map((s, i) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#6b7280;font-size:13px;width:28px;vertical-align:top;">${i + 1}.</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#374151;font-size:14px;">${s.label}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#0a2540,#1a4a7a);padding:32px 40px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Three Seas Digital</h1>
        <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Welcome Aboard</p>
      </div>

      <!-- Body -->
      <div style="padding:40px;">
        <p style="color:#374151;margin:0 0 16px;line-height:1.6;font-size:16px;">
          Hi ${client.name || 'there'},
        </p>

        ${customBodyHtml || `
        <p style="color:#374151;margin:0 0 16px;line-height:1.6;">
          Welcome to Three Seas Digital! We're thrilled to have you on board. Your client account is ready and we've set up everything you need to get started.
        </p>
        `}

        ${tierLabel ? `
        <div style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
          <p style="color:#4338ca;font-weight:600;margin:0;font-size:14px;">Your Plan: ${tierLabel}</p>
        </div>
        ` : ''}

        <!-- Portal Access -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
          <p style="color:#111827;font-weight:600;margin:0 0 8px;font-size:14px;">Your Portal Access</p>
          <p style="color:#6b7280;margin:0 0 4px;font-size:13px;">Email: <strong style="color:#111827;">${client.email}</strong></p>
          ${options.tempPassword ? `<p style="color:#6b7280;margin:4px 0 0;font-size:13px;">Temporary Password: <code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:14px;color:#111827;font-weight:600;">${options.tempPassword}</code></p>
          <p style="color:#ef4444;margin:6px 0 0;font-size:12px;font-weight:500;">You will be asked to change this on first login. Do not share this email.</p>` : options.hasTempPassword ? '<p style="color:#6b7280;margin:0;font-size:13px;">A temporary password was provided by your account manager. You\'ll be asked to change it on first login.</p>' : ''}
        </div>

        <!-- CTA Button -->
        <div style="text-align:center;margin:28px 0;">
          <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#1a4a7a,#2563eb);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
            Log in to Your Portal
          </a>
        </div>

        <!-- Onboarding Steps -->
        <p style="color:#111827;font-weight:600;margin:24px 0 12px;font-size:15px;">Your Next Steps</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          ${stepsHtml}
        </table>

        <p style="color:#6b7280;font-size:13px;margin:24px 0 0;line-height:1.5;">
          Questions? Just reply to this email or reach out at ${emailConfig.replyTo}. We're here to help every step of the way.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">
          &copy; ${new Date().getFullYear()} Three Seas Digital. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendWelcomeEmail(client, options = {}) {
  const subject = options.subject || 'Welcome to Three Seas Digital!';
  const html = buildWelcomeEmailHtml(client, options);
  const recipientEmail = client.email;

  if (!recipientEmail) {
    return { success: false, error: 'Client has no email address' };
  }

  try {
    const { messageId, provider } = await sendEmail(recipientEmail, subject, html);
    await logEmail({
      recipientEmail,
      recipientName: client.name,
      subject,
      templateType: 'welcome',
      status: 'sent',
      provider,
      messageId,
      sentAt: new Date().toISOString(),
    });
    console.log(`[emailService] Welcome email sent to ${recipientEmail}`);
    return { success: true, messageId };
  } catch (err) {
    console.error(`[emailService] Failed to send welcome email:`, err.message);
    await logEmail({
      recipientEmail,
      recipientName: client.name,
      subject,
      templateType: 'welcome',
      status: 'failed',
      error: err.message,
    });
    return { success: false, error: err.message };
  }
}

export async function sendInvoiceEmail(invoice, client, payment) {
  const subject = `Invoice Receipt — ${invoice.title || 'Invoice'} — Three Seas Digital`;
  const html = buildInvoiceEmailHtml(invoice, client, payment);
  const recipientEmail = client.email;

  try {
    const { messageId, provider } = await sendEmail(recipientEmail, subject, html);
    await logEmail({
      recipientEmail,
      recipientName: client.name,
      subject,
      templateType: 'invoice_receipt',
      invoiceId: invoice.id,
      status: 'sent',
      provider,
      messageId,
      sentAt: new Date().toISOString(),
    });
    console.log(`[emailService] Invoice email sent to ${recipientEmail}`);
    return { success: true, messageId };
  } catch (err) {
    console.error(`[emailService] Failed to send invoice email:`, err.message);
    await logEmail({
      recipientEmail,
      recipientName: client.name,
      subject,
      templateType: 'invoice_receipt',
      invoiceId: invoice.id,
      status: 'failed',
      error: err.message,
    });
    return { success: false, error: err.message };
  }
}
