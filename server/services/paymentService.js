import { generateId } from '../utils/generateId.js';
import pool from '../config/db.js';
import { sendInvoiceEmail } from './emailService.js';

export async function processPayment(invoiceId, clientId, amount, provider, providerPaymentId, providerResponse) {
  // 1. Validate invoice if provided
  let invoice = null;
  let client = null;

  if (invoiceId) {
    const [invoices] = await pool.query('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    if (invoices.length === 0) throw new Error('Invoice not found');
    invoice = invoices[0];
    clientId = invoice.client_id;
    amount = parseFloat(invoice.amount);
  }

  // Get client info
  const [clients] = await pool.query('SELECT * FROM clients WHERE id = ?', [clientId]);
  if (clients.length === 0) throw new Error('Client not found');
  client = clients[0];

  // 2. Insert payment_transactions
  const paymentId = generateId();
  await pool.query(
    `INSERT INTO payment_transactions (id, invoice_id, client_id, amount, currency, provider, provider_payment_id, provider_response, status, created_at)
     VALUES (?, ?, ?, ?, 'USD', ?, ?, ?, 'completed', NOW())`,
    [paymentId, invoiceId || null, clientId, amount, provider, providerPaymentId || null, JSON.stringify(providerResponse || {})]
  );

  // 3. Update invoice status to 'paid' if linked
  if (invoiceId) {
    await pool.query(
      "UPDATE invoices SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = ?",
      [invoiceId]
    );
  }

  // 4. Insert revenue entry
  const revenueId = generateId();
  await pool.query(
    `INSERT INTO revenue_entries (id, invoice_id, payment_id, client_id, amount, category, description, recorded_at)
     VALUES (?, ?, ?, ?, ?, 'service_revenue', 'Payment received', NOW())`,
    [revenueId, invoiceId || null, paymentId, clientId, amount]
  );

  // 5. Insert legacy payments record (for backward compat with FinanceContext)
  const legacyPaymentId = generateId();
  await pool.query(
    `INSERT INTO payments (id, client_id, invoice_id, amount, method, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'completed', NOW())`,
    [legacyPaymentId, clientId, invoiceId || null, amount, provider]
  );

  // 6. Upsert finance_summary
  const period = new Date().toISOString().slice(0, 7); // YYYY-MM
  const summaryId = generateId();
  try {
    // Try insert first
    await pool.query(
      `INSERT INTO finance_summary (id, period, total_revenue, total_invoices_paid, updated_at)
       VALUES (?, ?, ?, 1, NOW())`,
      [summaryId, period, amount]
    );
  } catch (err) {
    // On duplicate, update
    await pool.query(
      `UPDATE finance_summary SET
         total_revenue = total_revenue + ?,
         total_invoices_paid = total_invoices_paid + 1,
         updated_at = NOW()
       WHERE period = ?`,
      [amount, period]
    );
  }

  // 7. Send invoice email (non-blocking)
  if (invoice && client.email) {
    sendInvoiceEmail(invoice, client, { provider, created_at: new Date().toISOString() })
      .catch(err => console.error('[paymentService] Email send failed:', err.message));
  }

  return {
    paymentId,
    invoiceId,
    clientId,
    amount,
    provider,
    status: 'completed',
  };
}
