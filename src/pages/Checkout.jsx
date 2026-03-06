import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Check, Shield, CreditCard, RefreshCw,
  Download, Mail, Lock, Code, Smartphone, Headphones
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import Navbar from '../components/Navbar';
import FallbackImg from '../components/FallbackImg';
import { useAppContext } from '../context/AppContext';
import { getTemplateByIdFromAll } from '../data/templates';
import { getTemplateZip, getTemplateImage } from '../utils/templateStorage';
import '../styles/checkout.css';

const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

const TIER_INCLUDES = {
  Starter: [
    { icon: Code, label: 'Full source code' },
    { icon: Smartphone, label: 'Responsive design' },
    { icon: Headphones, label: '30-day email support' },
  ],
  Business: [
    { icon: Code, label: 'Full source code' },
    { icon: Smartphone, label: 'Responsive design' },
    { icon: Headphones, label: '6-month priority support' },
    { icon: RefreshCw, label: 'Free updates for 1 year' },
  ],
  Premium: [
    { icon: Code, label: 'Full source code + CMS integration' },
    { icon: Smartphone, label: 'Responsive design' },
    { icon: Headphones, label: '1-year priority support' },
    { icon: RefreshCw, label: 'Lifetime updates' },
    { icon: Shield, label: 'Commercial license' },
  ],
};

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
}

// ─── Stripe Payment Form ────────────────────────────────────────────────────

function StripePaymentForm({ template, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm with our backend
        await fetch(`${API_URL}/payment-processing/stripe/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            amount: template.price,
            clientId: null, // template purchase — no CRM client
          }),
        });
        onSuccess();
      }
    } catch (err) {
      onError(err.message || 'Payment failed');
    }
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <PaymentElement options={{ layout: 'tabs' }} />
      <button type="submit" className="checkout-submit-btn" disabled={!stripe || processing}>
        {processing ? (
          <><div className="checkout-spinner" /> Processing...</>
        ) : (
          <><Lock size={16} /> Pay {formatPrice(template.price)}</>
        )}
      </button>
    </form>
  );
}

// ─── Main Checkout Component ────────────────────────────────────────────────

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { builtInOverrides, adminTemplates } = useAppContext();
  const templateId = searchParams.get('template');
  const template = templateId ? getTemplateByIdFromAll(templateId, builtInOverrides, adminTemplates) : null;

  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'paypal'
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', zip: '' });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [templateImageUrl, setTemplateImageUrl] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    document.title = template ? `Checkout — ${template.name}` : 'Checkout — Three Seas Digital';
  }, [template]);

  // Load image from R2/IndexedDB
  useEffect(() => {
    if (!template?.hasImage) return;
    let cancelled = false;
    getTemplateImage(template.id).then((blob) => {
      if (blob && !cancelled) setTemplateImageUrl(URL.createObjectURL(blob));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [template?.id, template?.hasImage]);

  // Redirect if invalid template or Enterprise tier
  useEffect(() => {
    if (!template || template.price === null) {
      navigate('/templates', { replace: true });
    }
  }, [template, navigate]);

  // Create Stripe PaymentIntent when card method selected
  useEffect(() => {
    if (paymentMethod !== 'card' || !template || !STRIPE_PK) return;
    let cancelled = false;

    async function createIntent() {
      try {
        const res = await fetch(`${API_URL}/payment-processing/stripe/create-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: template.price }),
        });
        const data = await res.json();
        if (!cancelled && data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      } catch (err) {
        console.error('Failed to create payment intent:', err);
        setError('Could not connect to payment server. Make sure the backend is running.');
      }
    }

    createIntent();
    return () => { cancelled = true; };
  }, [paymentMethod, template]);

  if (!template || template.price === null) return null;

  const includes = TIER_INCLUDES[template.tier] || TIER_INCLUDES.Starter;

  const handleDownload = async () => {
    try {
      const blob = await getTemplateZip(template.id);
      if (!blob) {
        alert(`Downloading ${template.name} template package...\n\nTemplate files will be delivered to your email.`);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}-template.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert(`Downloading ${template.name} template package...\n\nTemplate files will be delivered to your email.`);
    }
  };

  // Fallback payment for when Stripe/PayPal aren't configured
  const handleFallbackSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required');
      return;
    }
    setProcessing(true);
    setError('');
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
    }, 1500);
  };

  const handlePayPalApprove = async (data) => {
    setProcessing(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/payment-processing/paypal/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: data.orderID,
          amount: template.price,
          clientId: null,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'PayPal payment failed');
      }
    } catch (err) {
      setError(err.message || 'PayPal payment failed');
    }
    setProcessing(false);
  };

  const stripeConfigured = !!STRIPE_PK;
  const paypalConfigured = !!PAYPAL_CLIENT_ID;

  if (success) {
    return (
      <div className="checkout-page">
        <Navbar />
        <div className="checkout-success">
          <div className="checkout-success-icon">
            <Check size={48} />
          </div>
          <h1>Your template is ready!</h1>
          <div className="checkout-success-preview">
            {(templateImageUrl || template.image) ? (
              <FallbackImg src={templateImageUrl || template.image} alt={template.name} />
            ) : (
              <div className="checkout-success-gradient" style={{ background: `linear-gradient(135deg, ${template.color}40, ${template.color}10)` }} />
            )}
            <span className="checkout-tier-badge" style={{ color: template.color }}>{template.tier}</span>
          </div>
          <p className="checkout-success-template">{template.name}</p>
          <p className="checkout-success-desc">
            Thank you for your purchase. Your template package is ready for download.
          </p>
          <button className="checkout-download-btn" onClick={handleDownload}>
            <Download size={20} />
            Download Template
          </button>
          <p className="checkout-success-email">
            <Mail size={14} />
            A download link has also been sent to <strong>{form.email || 'your email'}</strong>
          </p>
          <Link to="/templates" className="checkout-back-link">
            Back to Templates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <Navbar />

      <div className="checkout-container">
        <Link to="/templates" className="checkout-back">
          <ArrowLeft size={18} />
          Back to Templates
        </Link>

        <div className="checkout-grid">
          {/* Left: Template Summary */}
          <div className="checkout-summary">
            <div className="checkout-template-card">
              <div className="checkout-template-image">
                {(templateImageUrl || template.image) ? (
                  <FallbackImg src={templateImageUrl || template.image} alt={template.name} />
                ) : (
                  <div className="checkout-template-gradient" style={{ background: `linear-gradient(135deg, ${template.color}40, ${template.color}10)` }} />
                )}
                <span className="checkout-tier-badge" style={{ color: template.color }}>{template.tier}</span>
              </div>
              <h2>{template.name}</h2>
              <p className="checkout-template-desc">{template.longDesc || template.description}</p>
            </div>

            <div className="checkout-price-display">
              <span className="checkout-price">{formatPrice(template.price)}</span>
              <span className="checkout-price-label">One-time payment</span>
            </div>

            <div className="checkout-includes">
              <h3>What's included</h3>
              <ul>
                {includes.map((item, i) => (
                  <li key={i}>
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Payment Form */}
          <div className="checkout-form-section">
            <h2>Complete your purchase</h2>

            {/* Contact info (always shown) */}
            <div className="checkout-contact-fields">
              <div className="checkout-form-group">
                <label>Full Name</label>
                <input
                  type="text" value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div className="checkout-form-row">
                <div className="checkout-form-group">
                  <label>Email</label>
                  <input
                    type="email" value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="checkout-form-group">
                  <label>Phone <span className="optional">(optional)</span></label>
                  <input
                    type="tel" value={form.phone}
                    onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="checkout-divider" />

              <div className="checkout-form-group">
                <label>Street Address</label>
                <input
                  type="text" value={form.address}
                  onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St"
                />
              </div>
              <div className="checkout-form-row checkout-form-row-3">
                <div className="checkout-form-group">
                  <label>City</label>
                  <input
                    type="text" value={form.city}
                    onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="New York"
                  />
                </div>
                <div className="checkout-form-group">
                  <label>State</label>
                  <input
                    type="text" value={form.state}
                    onChange={e => setForm(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="NY"
                  />
                </div>
                <div className="checkout-form-group">
                  <label>ZIP Code</label>
                  <input
                    type="text" value={form.zip}
                    onChange={e => setForm(prev => ({ ...prev, zip: e.target.value }))}
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>

            <div className="checkout-divider" />

            {/* Payment method selector */}
            {(stripeConfigured || paypalConfigured) && (
              <div className="checkout-method-selector">
                {stripeConfigured && (
                  <button
                    className={`checkout-method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <CreditCard size={16} /> Card
                  </button>
                )}
                {paypalConfigured && (
                  <button
                    className={`checkout-method-btn ${paymentMethod === 'paypal' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('paypal')}
                  >
                    PayPal
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="checkout-error-banner">{error}</div>
            )}

            {/* Stripe Card / Google Pay */}
            {paymentMethod === 'card' && stripeConfigured && !clientSecret && (
              <div className="checkout-loading">
                <div className="checkout-spinner" />
                <span>Loading payment form...</span>
              </div>
            )}
            {paymentMethod === 'card' && stripeConfigured && clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#3ECF8E', colorBackground: '#161b22', colorText: '#e8e6e1', colorDanger: '#ef4444', borderRadius: '8px' } } }}>
                <StripePaymentForm
                  template={template}
                  onSuccess={() => setSuccess(true)}
                  onError={setError}
                />
              </Elements>
            )}

            {/* PayPal */}
            {paymentMethod === 'paypal' && paypalConfigured && (
              <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD' }}>
                <div className="checkout-paypal-container">
                  <PayPalButtons
                    style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' }}
                    createOrder={async () => {
                      const res = await fetch(`${API_URL}/payment-processing/paypal/create-order`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount: template.price }),
                      });
                      const data = await res.json();
                      return data.orderId;
                    }}
                    onApprove={handlePayPalApprove}
                    onError={(err) => setError(err.message || 'PayPal error')}
                  />
                </div>
              </PayPalScriptProvider>
            )}

            {/* Fallback: when no payment provider configured */}
            {!stripeConfigured && !paypalConfigured && (
              <form onSubmit={handleFallbackSubmit} className="checkout-form" noValidate>
                <div className="checkout-form-group">
                  <label><CreditCard size={14} /> Card Number</label>
                  <input type="text" placeholder="4242 4242 4242 4242" />
                </div>
                <div className="checkout-form-row">
                  <div className="checkout-form-group">
                    <label>Expiry</label>
                    <input type="text" placeholder="MM/YY" />
                  </div>
                  <div className="checkout-form-group">
                    <label>CVC</label>
                    <input type="text" placeholder="123" />
                  </div>
                </div>
                <button type="submit" className="checkout-submit-btn" disabled={processing}>
                  {processing ? (
                    <><div className="checkout-spinner" /> Processing...</>
                  ) : (
                    <><Lock size={16} /> Pay {formatPrice(template.price)}</>
                  )}
                </button>
                <p className="checkout-disclaimer">
                  Simulated payment for demonstration purposes. No real charges will be made.
                </p>
              </form>
            )}

            <div className="checkout-trust-row">
              <div className="checkout-trust-item">
                <Shield size={14} />
                <span>Secure Checkout</span>
              </div>
              <div className="checkout-trust-item">
                <RefreshCw size={14} />
                <span>30-day money-back guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
