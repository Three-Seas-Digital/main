import { useState, useEffect, lazy, Suspense } from 'react';
import {
  Mail, Lock, User, Check, Zap, Eye, EyeOff,
  LogOut, Printer, DollarSign, FolderKanban, FileText,
  CreditCard, Building2, ShieldCheck, Apple, X,
  Settings, Phone, MapPin, Calendar, Clock, ArrowLeft,
  MessageSquare, Send, HelpCircle, ChevronDown, ChevronUp,
  CheckCircle, Circle, AlertCircle, Milestone, Users,
  BarChart3, TrendingUp, Lightbulb, Bell, Star, Activity, Crosshair,
  ClipboardCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { SITE_INFO, escapeHtml } from '../constants';

/* ===== LAZY-LOADED PORTAL COMPONENTS ===== */
const PortalDashboard = lazy(() => import('../components/portal/Dashboard'));
const PortalScorecard = lazy(() => import('../components/portal/Scorecard'));
const PortalGrowthMetrics = lazy(() => import('../components/portal/GrowthMetrics'));
const PortalRecommendations = lazy(() => import('../components/portal/Recommendations'));
const PortalServiceRequests = lazy(() => import('../components/portal/ServiceRequests'));
const PortalFeedback = lazy(() => import('../components/portal/Feedback'));
const PortalInterventions = lazy(() => import('../components/portal/Interventions'));
const PortalRevenueView = lazy(() => import('../components/portal/RevenueView'));
const PortalExpenseView = lazy(() => import('../components/portal/ExpenseView'));
const PortalProfitabilityView = lazy(() => import('../components/portal/ProfitabilityView'));
const PortalFinancialReports = lazy(() => import('../components/portal/FinancialReports'));
const PortalOnboarding = lazy(() => import('../components/portal/Onboarding'));
const PortalDocuments = lazy(() => import('../components/portal/Documents'));

/* ===== TIER BADGE ===== */
function TierBadge({ tier }) {
  const { SUBSCRIPTION_TIERS } = useAppContext();
  const t = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.free;
  return (
    <span className="tier-badge" style={{ background: t.color }}>
      {t.label}
    </span>
  );
}

/* ===== SIGN UP / LOGIN ===== */
function SignUpStep() {
  const { registerClient, checkClientEmail, clientLogin, login } = useAppContext();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [profileStep, setProfileStep] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
  });
  const [profileData, setProfileData] = useState({
    businessName: '', phone: '', street: '', city: '', state: '', zip: '', dateOfBirth: '',
  });
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const handleSignUp = (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (checkClientEmail(formData.email)) {
      setError('An account with this email already exists');
      return;
    }
    setPendingRegistration({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      authMethod: 'email',
    });
    setProfileStep(true);
  };

  const [profileError, setProfileError] = useState('');

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setProfileError('');
    const { businessName, phone, street, city, state, zip } = profileData;
    if (!businessName.trim() || !phone.trim() || !street.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      setProfileError('All fields are required');
      return;
    }
    const result = registerClient({
      ...pendingRegistration,
      businessName: businessName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
      dateOfBirth: profileData.dateOfBirth,
      profileComplete: true,
    });
    if (!result.success) { setProfileError(result.error); return; }
    if (result.pendingApproval) { setRegistrationComplete(true); }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    const clientResult = clientLogin(formData.email, formData.password);
    if (clientResult.success) return;
    const adminResult = login(formData.email, formData.password);
    if (adminResult.success) { navigate('/admin'); return; }
    setError('Invalid email/username or password');
  };


  if (registrationComplete) {
    return (
      <div className="portal-auth-card">
        <div className="portal-auth-brand">
          <div className="portal-auth-logo">Three Seas Digital</div>
          <div className="portal-auth-subtitle">CLIENT PORTAL</div>
        </div>
        <div className="portal-auth-pending">
          <div className="portal-auth-pending-icon">
            <Clock size={40} />
          </div>
          <h2>Access Request Submitted</h2>
          <p>Your access request has been submitted. Our team will review and respond within 24 hours.</p>
        </div>
        <button className="portal-auth-btn portal-auth-btn-secondary" onClick={() => { setRegistrationComplete(false); setProfileStep(false); setIsLogin(true); }}>
          Return to Sign In
        </button>
      </div>
    );
  }

  if (profileStep) {
    return (
      <div className="portal-auth-card">
        <div className="portal-auth-brand">
          <div className="portal-auth-logo">Three Seas Digital</div>
          <div className="portal-auth-subtitle">COMPLETE YOUR PROFILE</div>
        </div>
        {profileError && <div className="portal-auth-error">{profileError}</div>}
        <form onSubmit={handleProfileSubmit} className="portal-auth-form">
          <div className="portal-auth-form-group">
            <label>Business Name</label>
            <input type="text" className="portal-auth-input" value={profileData.businessName} onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })} placeholder="Your company name" required />
          </div>
          <div className="portal-auth-form-group">
            <label>Phone</label>
            <input type="tel" className="portal-auth-input" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} placeholder="(555) 123-4567" required />
          </div>
          <div className="portal-auth-form-group">
            <label>Street Address</label>
            <input type="text" className="portal-auth-input" value={profileData.street} onChange={(e) => setProfileData({ ...profileData, street: e.target.value })} placeholder="123 Main St" required />
          </div>
          <div className="portal-auth-address-row">
            <div className="portal-auth-form-group">
              <label>City</label>
              <input type="text" className="portal-auth-input" value={profileData.city} onChange={(e) => setProfileData({ ...profileData, city: e.target.value })} placeholder="City" required />
            </div>
            <div className="portal-auth-form-group">
              <label>State</label>
              <input type="text" className="portal-auth-input" value={profileData.state} onChange={(e) => setProfileData({ ...profileData, state: e.target.value })} placeholder="State" required />
            </div>
            <div className="portal-auth-form-group">
              <label>Zip</label>
              <input type="text" className="portal-auth-input" value={profileData.zip} onChange={(e) => setProfileData({ ...profileData, zip: e.target.value })} placeholder="12345" required />
            </div>
          </div>
          <button type="submit" className="portal-auth-btn">Continue</button>
        </form>
        <button type="button" className="portal-auth-link" onClick={() => { setProfileStep(false); setPendingRegistration(null); }}>
          Back to Sign Up
        </button>
      </div>
    );
  }

  if (isLogin) {
    return (
      <div className="portal-auth-card">
        <div className="portal-auth-brand">
          <div className="portal-auth-logo">Three Seas Digital</div>
          <div className="portal-auth-subtitle">CLIENT PORTAL</div>
        </div>
        {error && <div className="portal-auth-error">{error}</div>}
        <form onSubmit={handleLogin} className="portal-auth-form">
          <div className="portal-auth-form-group">
            <label>Email</label>
            <input
              type="text"
              className="portal-auth-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              required
            />
          </div>
          <div className="portal-auth-form-group">
            <label>Password</label>
            <div className="portal-auth-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="portal-auth-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                required
              />
              <button type="button" className="portal-auth-toggle" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="button" className="portal-auth-forgot">Forgot password?</button>
          <button type="submit" className="portal-auth-btn">Sign In</button>
        </form>
        <div className="portal-auth-divider">
          <span>or</span>
        </div>
        <button type="button" className="portal-auth-link" onClick={() => { setIsLogin(false); setError(''); }}>
          Don't have an account? Request Access
        </button>
      </div>
    );
  }

  return (
    <div className="portal-auth-card">
      <div className="portal-auth-brand">
        <div className="portal-auth-logo">Three Seas Digital</div>
        <div className="portal-auth-subtitle">REQUEST ACCESS</div>
      </div>
      {error && <div className="portal-auth-error">{error}</div>}
      <form onSubmit={handleSignUp} className="portal-auth-form">
        <div className="portal-auth-form-group">
          <label>Full Name</label>
          <input
            type="text"
            className="portal-auth-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
          />
        </div>
        <div className="portal-auth-form-group">
          <label>Email</label>
          <input
            type="email"
            className="portal-auth-input"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your@email.com"
            required
          />
        </div>
        <div className="portal-auth-form-group">
          <label>Password</label>
          <div className="portal-auth-input-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              className="portal-auth-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Min 6 characters"
              required
            />
            <button type="button" className="portal-auth-toggle" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="portal-auth-form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            className="portal-auth-input"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Confirm password"
            required
          />
        </div>
        <button type="submit" className="portal-auth-btn">Request Access</button>
      </form>
      <div className="portal-auth-divider">
        <span>or</span>
      </div>
      <button type="button" className="portal-auth-link" onClick={() => { setIsLogin(true); setError(''); }}>
        Already have an account? Sign In
      </button>
    </div>
  );
}

/* ===== PRINT INVOICE ===== */
function printInvoice(invoice, clientName) {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${escapeHtml(invoice.title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1a2e; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #0f4c75; }
    .brand h1 { font-size: 1.5rem; color: #0f4c75; }
    .brand p { color: #666; font-size: 0.9rem; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 1.8rem; color: #0f4c75; margin-bottom: 8px; }
    .invoice-meta p { font-size: 0.9rem; color: #666; }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
    .details h3 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
    .details p { font-size: 0.95rem; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f0f0f0; text-align: left; padding: 12px 16px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; color: #666; }
    td { padding: 14px 16px; border-bottom: 1px solid #eee; font-size: 0.95rem; }
    .amount { text-align: right; font-weight: 700; font-size: 1.1rem; }
    .total-row td { border-top: 2px solid #0f4c75; font-weight: 700; font-size: 1.1rem; }
    .total-row .amount { color: #0f4c75; font-size: 1.3rem; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
    .status-paid { background: #dcfce7; color: #16a34a; }
    .status-unpaid { background: #fef2f2; color: #dc2626; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 0.85rem; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>Three Seas Digital</h1>
      <p>Premium Digital Solutions</p>
    </div>
    <div class="invoice-meta">
      <h2>INVOICE</h2>
      <p>#INV-${invoice.id}</p>
    </div>
  </div>
  <div class="details">
    <div>
      <h3>Bill To</h3>
      <p><strong>${escapeHtml(clientName)}</strong></p>
    </div>
    <div>
      <h3>Invoice Details</h3>
      <p>Date: ${new Date(invoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      ${invoice.dueDate ? `<p>Due: ${new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
      <p>Status: <span class="status ${invoice.status === 'paid' ? 'status-paid' : 'status-unpaid'}">${invoice.status === 'paid' ? 'Paid' : 'Unpaid'}</span></p>
      ${invoice.paidAt ? `<p>Paid: ${new Date(invoice.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
    </div>
  </div>
  <table>
    <thead><tr><th>Description</th><th class="amount">Amount</th></tr></thead>
    <tbody>
      <tr><td>${escapeHtml(invoice.title)}${invoice.description ? `<br><small style="color:#666">${escapeHtml(invoice.description)}</small>` : ''}</td><td class="amount">$${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
      <tr class="total-row"><td>Total</td><td class="amount">$${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
    </tbody>
  </table>
  <div class="footer">
    <p>Thank you for your business &mdash; Three Seas Digital</p>
  </div>
</body>
</html>`);
  printWindow.document.close();
  printWindow.print();
}

/* ===== PAYMENT MODAL ===== */
const PAYMENT_METHODS = [
  { id: 'credit-card', label: 'Credit Card', icon: CreditCard, desc: 'Visa, Mastercard, Amex' },
  { id: 'paypal', label: 'PayPal', icon: ShieldCheck, desc: 'Pay with your PayPal account' },
  { id: 'bank-transfer', label: 'Bank Transfer', icon: Building2, desc: 'Direct bank payment' },
  { id: 'apple-pay', label: 'Apple Pay', icon: Apple, desc: 'Quick and secure' },
];

function PaymentModal({ invoice, clientId, onClose }) {
  const { markInvoicePaid } = useAppContext();
  const [method, setMethod] = useState('');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      markInvoicePaid(clientId, invoice.id);
      setProcessing(false);
      setDone(true);
    }, 1500);
  };

  if (done) {
    return (
      <div className="pay-modal-overlay" onClick={onClose}>
        <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
          <div className="pay-modal-header">
            <h3>Payment Complete</h3>
            <button className="pay-modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>
          <div className="pay-modal-success">
            <div className="pay-success-icon"><Check size={32} /></div>
            <p>Your payment of <strong>${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> has been processed.</p>
            <button className="btn btn-primary btn-full" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pay-modal-overlay" onClick={onClose}>
      <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pay-modal-header">
          <h3>Pay Invoice</h3>
          <button className="pay-modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="pay-modal-invoice">
          <span>{invoice.title}</span>
          <strong>${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
        </div>
        <div className="pay-methods-grid">
          {PAYMENT_METHODS.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                className={`pay-method-card ${method === m.id ? 'selected' : ''}`}
                onClick={() => setMethod(m.id)}
              >
                <Icon size={22} />
                <strong>{m.label}</strong>
                <span>{m.desc}</span>
                {method === m.id && <div className="pay-method-check"><Check size={12} /></div>}
              </div>
            );
          })}
        </div>
        {processing ? (
          <div className="pay-processing">
            <div className="pay-spinner" />
            <span>Processing payment...</span>
          </div>
        ) : (
          <button
            className="btn btn-primary btn-full btn-lg"
            disabled={!method}
            onClick={handlePay}
          >
            <Lock size={16} /> Pay ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </button>
        )}
        <p className="pay-notice">Simulated payment for demonstration purposes</p>
      </div>
    </div>
  );
}

/* ===== PROFILE SETTINGS ===== */
function ProfileSettings({ client, onClose }) {
  const { updateClient, hashPassword } = useAppContext();
  const [formData, setFormData] = useState({
    name: client.name || '',
    businessName: client.businessName || '',
    phone: client.phone || '',
    street: client.street || '',
    city: client.city || '',
    state: client.state || '',
    zip: client.zip || '',
    dateOfBirth: client.dateOfBirth || '',
  });
  const [passwords, setPasswords] = useState({
    current: '', newPass: '', confirm: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.name.trim()) { setError('Name is required'); return; }
    updateClient(client.id, {
      name: formData.name.trim(),
      businessName: formData.businessName.trim(),
      phone: formData.phone.trim(),
      street: formData.street.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      zip: formData.zip.trim(),
      dateOfBirth: formData.dateOfBirth,
    });
    setSuccess('Profile updated successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (hashPassword(passwords.current) !== client.password) {
      setError('Current password is incorrect');
      return;
    }
    if (passwords.newPass.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      setError('New passwords do not match');
      return;
    }
    updateClient(client.id, { password: hashPassword(passwords.newPass) });
    setPasswords({ current: '', newPass: '', confirm: '' });
    setSuccess('Password changed successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="profile-settings">
      <div className="dashboard-card">
        <h3><Settings size={18} /> Profile Settings</h3>

        {error && <div className="signup-error">{error}</div>}
        {success && <div className="profile-success"><Check size={16} /> {success}</div>}

        <form onSubmit={handleSaveProfile} className="profile-form">
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-icon-wrap">
              <User size={16} />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Business Name</label>
            <div className="input-icon-wrap">
              <Building2 size={16} />
              <input type="text" value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} placeholder="Your company name" />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <div className="input-icon-wrap">
              <Mail size={16} />
              <input type="email" value={client.email} disabled />
            </div>
          </div>
          <div className="form-group">
            <label>Phone</label>
            <div className="input-icon-wrap">
              <Phone size={16} />
              <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(555) 123-4567" />
            </div>
          </div>
          <div className="form-group">
            <label>Street Address</label>
            <div className="input-icon-wrap">
              <MapPin size={16} />
              <input type="text" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} placeholder="123 Main St" />
            </div>
          </div>
          <div className="signup-address-row">
            <div className="form-group">
              <label>City</label>
              <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
            </div>
            <div className="form-group">
              <label>State</label>
              <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="State" />
            </div>
            <div className="form-group">
              <label>Zip Code</label>
              <input type="text" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} placeholder="12345" />
            </div>
          </div>
          <div className="profile-actions">
            <button type="submit" className="btn btn-primary">Save Changes</button>
            <button type="button" className="btn btn-outline-dark" onClick={onClose}>Cancel</button>
          </div>
        </form>

            <div className="profile-divider" />
            <h3><Lock size={18} /> Change Password</h3>
            <form onSubmit={handleChangePassword} className="profile-form">
              <div className="form-group">
                <label>Current Password</label>
                <div className="input-icon-wrap">
                  <Lock size={16} />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    required
                  />
                  <button type="button" className="input-toggle" onClick={() => setShowCurrent(!showCurrent)}>
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>New Password</label>
                <div className="input-icon-wrap">
                  <Lock size={16} />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={passwords.newPass}
                    onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                    placeholder="Min 6 characters"
                    required
                  />
                  <button type="button" className="input-toggle" onClick={() => setShowNew(!showNew)}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="input-icon-wrap">
                  <Lock size={16} />
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>
              <div className="profile-actions">
                <button type="submit" className="btn btn-primary">Update Password</button>
              </div>
            </form>
      </div>
    </div>
  );
}

/* ===== CLIENT DASHBOARD ===== */
function ClientDashboard() {
  const { currentClient, clientLogout, clients, SUBSCRIPTION_TIERS, addClientNote, users } = useAppContext();

  if (!currentClient) return null; // Guard against stale state during logout

  // Get live client data from clients array so admin changes show up
  const liveClient = clients.find((c) => c.id === currentClient.id) || currentClient;

  const [payingInvoice, setPayingInvoice] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedProject, setExpandedProject] = useState(null);
  const onboardingIncomplete = liveClient.onboarding && !liveClient.onboarding.complete;
  const [activeTab, setActiveTab] = useState(onboardingIncomplete ? 'onboarding' : 'bi-dashboard');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  const invoices = liveClient.invoices || [];
  const projects = liveClient.projects || [];
  const notes = liveClient.notes || [];
  const unpaidInvoices = invoices.filter((inv) => inv.status !== 'paid');
  const balance = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const activeProjects = projects.filter((p) => p.status !== 'archived' && p.status !== 'completed');

  const statusColors = {
    planning: '#6b7280',
    'in-progress': '#3b82f6',
    review: '#f59e0b',
    completed: '#22c55e',
    archived: '#9ca3af',
    'on-hold': '#ef4444',
  };

  const handleSendSupport = (e) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) return;
    addClientNote(liveClient.id, `[Support Request] ${supportSubject}: ${supportMessage}`, liveClient.name);
    setSupportMessage('');
    setSupportSubject('');
    setSupportSent(true);
    setTimeout(() => setSupportSent(false), 3000);
  };

  const getDeveloperName = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user?.name || 'Team Member';
  };

  return (
    <div className="client-dashboard">
      <div className="dashboard-header">
        <h1>Client Portal</h1>
        <div className="dashboard-header-actions">
          <button
            className={`btn btn-outline-dark ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={16} /> Settings
          </button>
          <button className="btn btn-outline-dark" onClick={clientLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {showSettings ? (
        <ProfileSettings client={liveClient} onClose={() => setShowSettings(false)} />
      ) : (
      <>
      {/* Portal Sidebar + Content Layout */}
      <div className="portal-layout">
        <nav className="portal-sidebar">
          {onboardingIncomplete && (
            <button className={`portal-sidebar-item ${activeTab === 'onboarding' ? 'active' : ''}`} onClick={() => setActiveTab('onboarding')}>
              <ClipboardCheck size={16} /> Onboarding
              <span className="portal-sidebar-badge">New</span>
            </button>
          )}
          <button className={`portal-sidebar-item ${activeTab === 'bi-dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('bi-dashboard')}>
            <Activity size={16} /> Dashboard
          </button>
          <button className={`portal-sidebar-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <User size={16} /> Overview
          </button>

          <div className="portal-sidebar-divider" />
          <div className="portal-sidebar-group-label">Business Health</div>
          <button className={`portal-sidebar-item ${activeTab === 'scorecard' ? 'active' : ''}`} onClick={() => setActiveTab('scorecard')}>
            <BarChart3 size={16} /> Scorecard
          </button>
          <button className={`portal-sidebar-item ${activeTab === 'growth' ? 'active' : ''}`} onClick={() => setActiveTab('growth')}>
            <TrendingUp size={16} /> Growth Metrics
          </button>

          <div className="portal-sidebar-divider" />
          <div className="portal-sidebar-group-label">Financials</div>
          <button className={`portal-sidebar-item ${activeTab === 'revenue' ? 'active' : ''}`} onClick={() => setActiveTab('revenue')}>
            <DollarSign size={16} /> Revenue
          </button>
          <button className={`portal-sidebar-item ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
            <TrendingUp size={16} /> Expenses
          </button>
          <button className={`portal-sidebar-item ${activeTab === 'profitability' ? 'active' : ''}`} onClick={() => setActiveTab('profitability')}>
            <BarChart3 size={16} /> Profitability
          </button>
          <button className={`portal-sidebar-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <FileText size={16} /> Reports
          </button>

          <div className="portal-sidebar-divider" />
          <button className={`portal-sidebar-item ${activeTab === 'interventions' ? 'active' : ''}`} onClick={() => setActiveTab('interventions')}>
            <Crosshair size={16} /> Interventions
          </button>
          <button className={`portal-sidebar-item ${activeTab === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveTab('recommendations')}>
            <Lightbulb size={16} /> Recommendations
          </button>
          <button className={`portal-sidebar-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
            <FolderKanban size={16} /> Projects
            {activeProjects.length > 0 && <span className="portal-sidebar-badge info">{activeProjects.length}</span>}
          </button>
          <button className={`portal-sidebar-item ${activeTab === 'invoices' ? 'active' : ''}`} onClick={() => setActiveTab('invoices')}>
            <FileText size={16} /> Invoices
            {unpaidInvoices.length > 0 && <span className="portal-sidebar-badge">{unpaidInvoices.length}</span>}
          </button>
          <button className={`portal-sidebar-item ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>
            <FileText size={16} /> Documents
            {(liveClient.documents || []).length > 0 && <span className="portal-sidebar-badge info">{(liveClient.documents || []).length}</span>}
          </button>
          <button className={`portal-sidebar-item ${activeTab === 'service-requests' ? 'active' : ''}`} onClick={() => setActiveTab('service-requests')}>
            <Bell size={16} color="#eab308" /> Service Requests
          </button>

          <div className="portal-sidebar-divider" />
          <button className={`portal-sidebar-item ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
            <MessageSquare size={16} /> Messages
            {notes.length > 0 && <span className="portal-sidebar-badge info">{notes.length}</span>}
          </button>
          <button className={`portal-sidebar-item ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')}>
            <Star size={16} /> Feedback
          </button>
          <button className={`portal-sidebar-item ${activeTab === 'support' ? 'active' : ''}`} onClick={() => setActiveTab('support')}>
            <HelpCircle size={16} /> Support
          </button>
        </nav>

        <div className="portal-content">

      {/* Onboarding Tab */}
      {activeTab === 'onboarding' && (
        <Suspense fallback={<div className="portal-loading">Loading onboarding...</div>}>
          <PortalOnboarding client={liveClient} />
        </Suspense>
      )}

      {/* BI Dashboard Tab */}
      {activeTab === 'bi-dashboard' && (
        <Suspense fallback={<div className="portal-loading">Loading dashboard...</div>}>
          <PortalDashboard client={liveClient} onNavigate={setActiveTab} />
        </Suspense>
      )}

      {/* Scorecard Tab */}
      {activeTab === 'scorecard' && (
        <Suspense fallback={<div className="portal-loading">Loading scorecard...</div>}>
          <PortalScorecard client={liveClient} />
        </Suspense>
      )}

      {/* Growth Metrics Tab */}
      {activeTab === 'growth' && (
        <Suspense fallback={<div className="portal-loading">Loading growth metrics...</div>}>
          <PortalGrowthMetrics client={liveClient} />
        </Suspense>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <Suspense fallback={<div className="portal-loading">Loading revenue analytics...</div>}>
          <PortalRevenueView client={liveClient} />
        </Suspense>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <Suspense fallback={<div className="portal-loading">Loading expense analytics...</div>}>
          <PortalExpenseView client={liveClient} />
        </Suspense>
      )}

      {/* Profitability Tab */}
      {activeTab === 'profitability' && (
        <Suspense fallback={<div className="portal-loading">Loading profitability analytics...</div>}>
          <PortalProfitabilityView client={liveClient} />
        </Suspense>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <Suspense fallback={<div className="portal-loading">Loading financial reports...</div>}>
          <PortalFinancialReports client={liveClient} />
        </Suspense>
      )}

      {/* Interventions Tab */}
      {activeTab === 'interventions' && (
        <Suspense fallback={<div className="portal-loading">Loading interventions...</div>}>
          <PortalInterventions client={liveClient} />
        </Suspense>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <Suspense fallback={<div className="portal-loading">Loading recommendations...</div>}>
          <PortalRecommendations client={liveClient} />
        </Suspense>
      )}

      {/* Service Requests Tab */}
      {activeTab === 'service-requests' && (
        <Suspense fallback={<div className="portal-loading">Loading service requests...</div>}>
          <PortalServiceRequests client={liveClient} />
        </Suspense>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <Suspense fallback={<div className="portal-loading">Loading feedback...</div>}>
          <PortalFeedback client={liveClient} />
        </Suspense>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <Suspense fallback={<div className="portal-loading">Loading documents...</div>}>
          <PortalDocuments client={liveClient} />
        </Suspense>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
        <div className="dashboard-grid">
          {/* Account Summary */}
          <div className="dashboard-card">
            <h3><User size={18} /> Account Summary</h3>
            <div className="account-info">
              <div className="account-avatar">
                {liveClient.name.charAt(0).toUpperCase()}
              </div>
              <div className="account-details">
                <strong>{liveClient.name}</strong>
                <span>{liveClient.email}</span>
                <div className="account-meta">
                  <TierBadge tier={liveClient.tier || 'free'} />
                  <span className="account-auth">Email account</span>
                </div>
                <span className="account-since">
                  Member since {new Date(liveClient.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </span>
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="dashboard-card balance-card">
            <h3><DollarSign size={18} /> Balance</h3>
            <div className="balance-amount">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="balance-subtitle">
              {unpaidInvoices.length === 0
                ? 'All invoices paid'
                : `${unpaidInvoices.length} unpaid invoice${unpaidInvoices.length > 1 ? 's' : ''}`}
            </div>
            {unpaidInvoices.length > 0 && (
              <button className="btn btn-sm btn-white" onClick={() => setActiveTab('invoices')}>View Invoices</button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="portal-stats-row">
          <div className="portal-stat">
            <FolderKanban size={20} />
            <div>
              <strong>{activeProjects.length}</strong>
              <span>Active Projects</span>
            </div>
          </div>
          <div className="portal-stat">
            <FileText size={20} />
            <div>
              <strong>{invoices.length}</strong>
              <span>Total Invoices</span>
            </div>
          </div>
          <div className="portal-stat">
            <CheckCircle size={20} />
            <div>
              <strong>{projects.filter((p) => p.status === 'completed').length}</strong>
              <span>Completed</span>
            </div>
          </div>
          <div className="portal-stat">
            <MessageSquare size={20} />
            <div>
              <strong>{notes.length}</strong>
              <span>Messages</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {notes.length > 0 && (
          <div className="dashboard-card">
            <h3><MessageSquare size={18} /> Recent Messages</h3>
            <div className="portal-messages-preview">
              {notes.slice(0, 3).map((note) => (
                <div key={note.id} className="portal-message-item">
                  <div className="portal-message-avatar">{note.author?.charAt(0) || 'T'}</div>
                  <div className="portal-message-content">
                    <div className="portal-message-header">
                      <strong>{note.author || 'Team'}</strong>
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p>{note.text}</p>
                  </div>
                </div>
              ))}
            </div>
            {notes.length > 3 && (
              <button className="btn btn-sm btn-outline" onClick={() => setActiveTab('messages')}>
                View All Messages
              </button>
            )}
          </div>
        )}
        </>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="dashboard-card">
          <h3><FolderKanban size={18} /> Your Projects</h3>
          {projects.length === 0 ? (
            <div className="portal-empty">
              <FolderKanban size={48} />
              <p>No projects yet</p>
              <span>Your projects will appear here once they are created</span>
            </div>
          ) : (
            <div className="portal-projects-list">
              {projects.map((project) => {
                const totalTasks = project.tasks?.length || 0;
                const doneTasks = project.tasks?.filter((t) => t.status === 'done').length || 0;
                const isExpanded = expandedProject === project.id;
                const developers = project.developers || [];
                const milestones = project.milestones || [];
                return (
                  <div key={project.id} className={`portal-project-card ${isExpanded ? 'expanded' : ''}`}>
                    <div className="portal-project-header" onClick={() => setExpandedProject(isExpanded ? null : project.id)}>
                      <div className="portal-project-info">
                        <strong>{project.title}</strong>
                        <span
                          className="portal-project-status"
                          style={{ background: statusColors[project.status] || '#6b7280' }}
                        >
                          {project.status.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="portal-project-meta">
                        <div className="portal-project-progress">
                          <div className="portal-progress-bar">
                            <div className="portal-progress-fill" style={{ width: `${project.progress || 0}%` }} />
                          </div>
                          <span>{project.progress || 0}%</span>
                        </div>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="portal-project-details">
                        {project.description && (
                          <p className="portal-project-desc">{project.description}</p>
                        )}

                        {/* Dates */}
                        <div className="portal-project-dates">
                          {project.startDate && (
                            <span><Calendar size={14} /> Started: {new Date(project.startDate).toLocaleDateString()}</span>
                          )}
                          {project.dueDate && (
                            <span><Clock size={14} /> Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                          )}
                        </div>

                        {/* Team */}
                        {developers.length > 0 && (
                          <div className="portal-project-team">
                            <h4><Users size={14} /> Team Members</h4>
                            <div className="portal-team-list">
                              {developers.map((devId) => (
                                <span key={devId} className="portal-team-member">{getDeveloperName(devId)}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tasks */}
                        {totalTasks > 0 && (
                          <div className="portal-project-tasks">
                            <h4><CheckCircle size={14} /> Tasks ({doneTasks}/{totalTasks})</h4>
                            <div className="portal-tasks-list">
                              {project.tasks.map((task) => (
                                <div key={task.id} className={`portal-task-item ${task.status}`}>
                                  {task.status === 'done' ? <CheckCircle size={14} /> : <Circle size={14} />}
                                  <span>{task.title}</span>
                                  <span className="portal-task-status">{task.status}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Milestones */}
                        {milestones.length > 0 && (
                          <div className="portal-project-milestones">
                            <h4><Milestone size={14} /> Milestones</h4>
                            <div className="portal-milestones-list">
                              {milestones.map((ms, idx) => (
                                <div key={idx} className={`portal-milestone ${ms.completed ? 'completed' : ''}`}>
                                  {ms.completed ? <CheckCircle size={14} /> : <Circle size={14} />}
                                  <span>{ms.title}</span>
                                  {ms.date && <span className="portal-milestone-date">{new Date(ms.date).toLocaleDateString()}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="dashboard-card">
          <h3><FileText size={18} /> Invoices</h3>
          {invoices.length === 0 ? (
            <div className="portal-empty">
              <FileText size={48} />
              <p>No invoices yet</p>
              <span>Your invoices will appear here</span>
            </div>
          ) : (
            <div className="invoices-table-wrap">
              <table className="invoices-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Paid Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className={inv.status !== 'paid' && inv.dueDate && new Date(inv.dueDate) < new Date() ? 'overdue' : ''}>
                      <td>
                        {inv.title}
                        {inv.recurring && <span className="recurring-badge">Recurring</span>}
                      </td>
                      <td className="invoice-amount">${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td>
                        <span className={`invoice-status ${inv.status}`}>
                          {inv.status === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td>
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                        {inv.status !== 'paid' && inv.dueDate && new Date(inv.dueDate) < new Date() && (
                          <span className="overdue-label"><AlertCircle size={12} /> Overdue</span>
                        )}
                      </td>
                      <td>{inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : '—'}</td>
                      <td className="invoice-actions">
                        {inv.status !== 'paid' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setPayingInvoice(inv)}
                          >
                            <DollarSign size={14} /> Pay
                          </button>
                        )}
                        <button
                          className="btn-outline-dark"
                          onClick={() => printInvoice(inv, liveClient.name)}
                          title="Print invoice"
                        >
                          <Printer size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="dashboard-card">
          <h3><MessageSquare size={18} /> Messages</h3>
          {notes.length === 0 ? (
            <div className="portal-empty">
              <MessageSquare size={48} />
              <p>No messages yet</p>
              <span>Messages from our team will appear here</span>
            </div>
          ) : (
            <div className="portal-messages-full">
              {notes.slice().reverse().map((note) => (
                <div key={note.id} className={`portal-message-full ${note.author === liveClient.name ? 'own' : ''}`}>
                  <div className="portal-message-avatar">
                    {note.author?.charAt(0) || 'T'}
                  </div>
                  <div className="portal-message-body">
                    <div className="portal-message-header">
                      <strong>{String(note.author || 'Team').replace(/<[^>]*>/g, '')}</strong>
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p>{String(note.text || '').replace(/<[^>]*>/g, '')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Support Tab */}
      {activeTab === 'support' && (
        <div className="dashboard-card">
          <h3><HelpCircle size={18} /> Contact Support</h3>
          <p className="support-intro">Have a question or need help? Send us a message and we'll get back to you.</p>

          {supportSent ? (
            <div className="support-success">
              <CheckCircle size={32} />
              <h4>Message Sent!</h4>
              <p>We've received your message and will respond shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSendSupport} className="support-form">
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  placeholder="What can we help you with?"
                  required
                />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe your question or issue..."
                  rows={5}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">
                <Send size={16} /> Send Message
              </button>
            </form>
          )}

          <div className="support-info">
            <h4>Other ways to reach us</h4>
            <div className="support-contact">
              <Mail size={16} />
              <span>{SITE_INFO.email}</span>
            </div>
            <div className="support-contact">
              <Phone size={16} />
              <span>{SITE_INFO.phone}</span>
            </div>
          </div>
        </div>
      )}

        </div>{/* end portal-content */}
      </div>{/* end portal-layout */}

      {payingInvoice && (
        <PaymentModal
          invoice={payingInvoice}
          clientId={liveClient.id}
          onClose={() => setPayingInvoice(null)}
        />
      )}
      </>
      )}
    </div>
  );
}

/* ===== PROFILE GATE FOR RETURNING CLIENTS ===== */
function ProfileGate() {
  const { currentClient, clients, updateClient, clientLogout } = useAppContext();
  const liveClient = clients.find(c => c.id === currentClient.id) || currentClient;
  const [profileData, setProfileData] = useState({
    businessName: liveClient.businessName || '',
    phone: liveClient.phone || '',
    street: liveClient.street || '',
    city: liveClient.city || '',
    state: liveClient.state || '',
    zip: liveClient.zip || '',
    dateOfBirth: liveClient.dateOfBirth || '',
  });
  const [profileError, setProfileError] = useState('');

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setProfileError('');
    const { businessName, phone, street, city, state, zip } = profileData;
    if (!businessName.trim() || !phone.trim() || !street.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      setProfileError('All fields are required');
      return;
    }
    updateClient(currentClient.id, {
      businessName: businessName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
      dateOfBirth: profileData.dateOfBirth,
      profileComplete: true,
    });
  };

  return (
    <div className="page client-portal-page">
      <section className="portal-hero">
        <div className="container">
          <h1>Welcome, {liveClient.name}</h1>
          <p>Complete your profile to get started</p>
        </div>
      </section>
      <div className="container">
        <div className="portal-auth-wrapper">
          <div className="signup-card profile-gate-card">
            <div className="signup-header">
              <div className="profile-gate-icon">
                <User size={28} />
              </div>
              <h2>Complete Your Profile</h2>
              <p>Please fill in all required fields to access your dashboard</p>
            </div>
            {profileError && <div className="signup-error">{profileError}</div>}
            <form onSubmit={handleProfileSubmit} className="signup-form">
              <div className="form-group">
                <label>Business Name *</label>
                <div className="input-icon-wrap">
                  <Building2 size={16} />
                  <input type="text" value={profileData.businessName} onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })} placeholder="Your company name" required />
                </div>
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <div className="input-icon-wrap">
                  <Phone size={16} />
                  <input type="tel" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} placeholder="(555) 123-4567" required />
                </div>
              </div>
              <div className="form-group">
                <label>Street Address *</label>
                <div className="input-icon-wrap">
                  <MapPin size={16} />
                  <input type="text" value={profileData.street} onChange={(e) => setProfileData({ ...profileData, street: e.target.value })} placeholder="123 Main St" required />
                </div>
              </div>
              <div className="signup-address-row">
                <div className="form-group">
                  <label>City *</label>
                  <input type="text" value={profileData.city} onChange={(e) => setProfileData({ ...profileData, city: e.target.value })} placeholder="City" required />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input type="text" value={profileData.state} onChange={(e) => setProfileData({ ...profileData, state: e.target.value })} placeholder="State" required />
                </div>
                <div className="form-group">
                  <label>Zip Code *</label>
                  <input type="text" value={profileData.zip} onChange={(e) => setProfileData({ ...profileData, zip: e.target.value })} placeholder="12345" required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full">Save & Continue</button>
            </form>
            <button type="button" className="profile-gate-back" onClick={clientLogout}>
              <Lock size={14} />
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== MAIN PAGE ===== */
export default function ClientSignup() {
  const { currentClient, clients } = useAppContext();
  useEffect(() => { document.title = currentClient ? 'Client Portal — Three Seas Digital' : 'Get Started — Three Seas Digital'; }, [currentClient]);

  if (currentClient) {
    const liveClient = clients.find(c => c.id === currentClient.id) || currentClient;
    if (!liveClient.profileComplete) {
      return <ProfileGate />;
    }
    return (
      <div className="page client-portal-page">
        <div className="container">
          <ClientDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="page client-portal-page portal-auth-page">
      <div className="portal-auth-wrapper">
        <SignUpStep />
      </div>
    </div>
  );
}
