import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Check, Shield, CreditCard, RefreshCw,
  Download, Mail, Lock, Code, Smartphone, Headphones
} from 'lucide-react';
import Navbar from '../components/Navbar';
import FallbackImg from '../components/FallbackImg';
import { useAppContext } from '../context/AppContext';
import { getTemplateByIdFromAll } from '../data/templates';
import '../styles/checkout.css';

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

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { builtInOverrides, adminTemplates } = useAppContext();
  const templateId = searchParams.get('template');
  const template = templateId ? getTemplateByIdFromAll(templateId, builtInOverrides, adminTemplates) : null;

  const [form, setForm] = useState({ name: '', email: '', phone: '', cardNumber: '', expiry: '', cvc: '' });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.title = template ? `Checkout — ${template.name}` : 'Checkout — Three Seas Digital';
  }, [template]);

  // Redirect if invalid template or Enterprise tier
  useEffect(() => {
    if (!template || template.price === null) {
      navigate('/templates', { replace: true });
    }
  }, [template, navigate]);

  if (!template || template.price === null) return null;

  const includes = TIER_INCLUDES[template.tier] || TIER_INCLUDES.Starter;

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email is required';
    if (!form.cardNumber.trim() || form.cardNumber.replace(/\s/g, '').length < 13) errs.cardNumber = 'Valid card number is required';
    if (!form.expiry.trim() || !/^\d{2}\/\d{2}$/.test(form.expiry)) errs.expiry = 'MM/YY format required';
    if (!form.cvc.trim() || form.cvc.length < 3) errs.cvc = 'Valid CVC required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formatted = value;

    if (name === 'cardNumber') {
      formatted = value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
    } else if (name === 'expiry') {
      formatted = value.replace(/\D/g, '').slice(0, 4);
      if (formatted.length > 2) formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
    } else if (name === 'cvc') {
      formatted = value.replace(/\D/g, '').slice(0, 4);
    }

    setForm(prev => ({ ...prev, [name]: formatted }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
    }, 1500);
  };

  const handleDownload = () => {
    alert(`Downloading ${template.name} template package...\n\nIn production, this would deliver a .zip file with the complete template source code.`);
  };

  if (success) {
    return (
      <div className="checkout-page">
        <Navbar />
        <div className="checkout-success">
          <div className="checkout-success-icon">
            <Check size={48} />
          </div>
          <h1>Your template is ready!</h1>
          <p className="checkout-success-template">{template.name} — {template.tier}</p>
          <p className="checkout-success-desc">
            Thank you for your purchase. Your template package is ready for download.
          </p>
          <button className="checkout-download-btn" onClick={handleDownload}>
            <Download size={20} />
            Download Template
          </button>
          <p className="checkout-success-email">
            <Mail size={14} />
            A download link has also been sent to <strong>{form.email}</strong>
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
                {template.image ? (
                  <FallbackImg src={template.image} alt={template.name} />
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

            <form onSubmit={handleSubmit} className="checkout-form" noValidate>
              <div className="checkout-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="checkout-error">{errors.name}</span>}
              </div>

              <div className="checkout-form-row">
                <div className="checkout-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="checkout-error">{errors.email}</span>}
                </div>
                <div className="checkout-form-group">
                  <label>Phone <span className="optional">(optional)</span></label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="checkout-divider" />

              <div className="checkout-form-group">
                <label>
                  <CreditCard size={14} />
                  Card Number
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={form.cardNumber}
                  onChange={handleChange}
                  placeholder="4242 4242 4242 4242"
                  className={errors.cardNumber ? 'error' : ''}
                />
                {errors.cardNumber && <span className="checkout-error">{errors.cardNumber}</span>}
              </div>

              <div className="checkout-form-row">
                <div className="checkout-form-group">
                  <label>Expiry</label>
                  <input
                    type="text"
                    name="expiry"
                    value={form.expiry}
                    onChange={handleChange}
                    placeholder="MM/YY"
                    className={errors.expiry ? 'error' : ''}
                  />
                  {errors.expiry && <span className="checkout-error">{errors.expiry}</span>}
                </div>
                <div className="checkout-form-group">
                  <label>CVC</label>
                  <input
                    type="text"
                    name="cvc"
                    value={form.cvc}
                    onChange={handleChange}
                    placeholder="123"
                    className={errors.cvc ? 'error' : ''}
                  />
                  {errors.cvc && <span className="checkout-error">{errors.cvc}</span>}
                </div>
              </div>

              <button
                type="submit"
                className="checkout-submit-btn"
                disabled={processing}
              >
                {processing ? (
                  <>
                    <div className="checkout-spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Pay {formatPrice(template.price)}
                  </>
                )}
              </button>

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

              <p className="checkout-disclaimer">
                Simulated payment for demonstration purposes. No real charges will be made.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
