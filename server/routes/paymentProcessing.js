import { Router } from 'express';
import Stripe from 'stripe';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { processPayment } from '../services/paymentService.js';
import pool from '../config/db.js';

const router = Router();

// ─── Stripe Setup ───────────────────────────────────────────────────────────

let stripe = null;
function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

// ─── Stripe: Create PaymentIntent ───────────────────────────────────────────

router.post('/stripe/create-intent', authenticateToken, async (req, res) => {
  try {
    const s = getStripe();
    if (!s) {
      res.status(503).json({ error: 'Stripe not configured' });
      return;
    }

    const { invoiceId, amount, clientId } = req.body;
    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Valid amount required' });
      return;
    }

    const paymentIntent = await s.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency: 'usd',
      metadata: {
        invoiceId: invoiceId || '',
        clientId: clientId || '',
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error('[paymentProcessing] Stripe create-intent error:', err.message);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// ─── Stripe: Confirm payment (called after frontend confirms) ──────────────

router.post('/stripe/confirm', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, invoiceId, clientId, amount, isGooglePay } = req.body;
    const provider = isGooglePay ? 'google_pay' : 'stripe';

    const result = await processPayment(
      invoiceId || null,
      clientId,
      parseFloat(amount),
      provider,
      paymentIntentId,
      { paymentIntentId }
    );

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[paymentProcessing] Stripe confirm error:', err.message);
    res.status(500).json({ error: err.message || 'Payment processing failed' });
  }
});

// ─── Stripe: Webhook ────────────────────────────────────────────────────────

router.post('/stripe/webhook', async (req, res) => {
  const s = getStripe();
  if (!s) {
    res.status(503).json({ error: 'Stripe not configured' });
    return;
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    res.status(503).json({ error: 'Webhook secret not configured' });
    return;
  }

  let event;
  try {
    event = s.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('[paymentProcessing] Webhook signature verification failed:', err.message);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const { invoiceId, clientId } = pi.metadata;

    try {
      await processPayment(
        invoiceId || null,
        clientId,
        pi.amount / 100, // convert from cents
        'stripe',
        pi.id,
        { stripeEvent: event.id }
      );
    } catch (err) {
      console.error('[paymentProcessing] Webhook processPayment error:', err.message);
    }
  }

  res.json({ received: true });
});

// ─── PayPal: Create Order ───────────────────────────────────────────────────

router.post('/paypal/create-order', authenticateToken, async (req, res) => {
  try {
    const { invoiceId, amount, clientId } = req.body;
    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Valid amount required' });
      return;
    }

    const clientIdPP = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = process.env.PAYPAL_MODE || 'sandbox';
    const baseUrl = mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    if (!clientIdPP || !clientSecret) {
      res.status(503).json({ error: 'PayPal not configured' });
      return;
    }

    const authRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientIdPP}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const authData = await authRes.json();

    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: parseFloat(amount).toFixed(2),
          },
          custom_id: JSON.stringify({ invoiceId, clientId }),
        }],
      }),
    });
    const orderData = await orderRes.json();

    res.json({ orderId: orderData.id });
  } catch (err) {
    console.error('[paymentProcessing] PayPal create-order error:', err.message);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

// ─── PayPal: Capture Order ──────────────────────────────────────────────────

router.post('/paypal/capture-order', authenticateToken, async (req, res) => {
  try {
    const { orderId, invoiceId, clientId, amount } = req.body;

    const clientIdPP = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = process.env.PAYPAL_MODE || 'sandbox';
    const baseUrl = mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    if (!clientIdPP || !clientSecret) {
      res.status(503).json({ error: 'PayPal not configured' });
      return;
    }

    const authRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientIdPP}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const authData = await authRes.json();

    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'Content-Type': 'application/json',
      },
    });
    const captureData = await captureRes.json();

    if (captureData.status !== 'COMPLETED') {
      res.status(400).json({ error: 'PayPal capture failed', details: captureData });
      return;
    }

    const result = await processPayment(
      invoiceId || null,
      clientId,
      parseFloat(amount),
      'paypal',
      orderId,
      { captureId: captureData.id, status: captureData.status }
    );

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[paymentProcessing] PayPal capture error:', err.message);
    res.status(500).json({ error: err.message || 'PayPal payment failed' });
  }
});

// ─── Generic: Process payment (for direct/manual flow) ──────────────────────

router.post('/process', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const { invoiceId, clientId, amount, provider, providerPaymentId } = req.body;

    if (!clientId && !invoiceId) {
      res.status(400).json({ error: 'clientId or invoiceId required' });
      return;
    }
    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Valid amount required' });
      return;
    }

    const result = await processPayment(
      invoiceId || null,
      clientId,
      parseFloat(amount),
      provider || 'stripe',
      providerPaymentId || null,
      null
    );

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[paymentProcessing] Process error:', err.message);
    res.status(500).json({ error: err.message || 'Payment processing failed' });
  }
});

export default router;
