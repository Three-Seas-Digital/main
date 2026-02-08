import { useState, useEffect } from 'react';
import {
  Mail, Lock, User, Check, Zap, Eye, EyeOff,
  LogOut, Printer, DollarSign, FolderKanban, FileText,
  CreditCard, Building2, ShieldCheck, Apple, X,
  Settings, Phone, MapPin, Calendar, Clock, ArrowLeft,
  MessageSquare, Send, HelpCircle, ChevronDown, ChevronUp,
  CheckCircle, Circle, AlertCircle, Milestone, Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { SITE_INFO } from '../App';

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
  const [isLogin, setIsLogin] = useState(false);
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
      <div className="signup-card registration-pending-card">
        <div className="signup-header">
          <div className="pending-icon">
            <Clock size={48} />
          </div>
          <h2>Registration Submitted!</h2>
          <p>Your account is pending approval</p>
        </div>
        <div className="pending-message">
          <p>Thank you for registering! An administrator will review your application and approve your account.</p>
          <p>You will be able to log in once your account has been approved.</p>
        </div>
        <button className="btn btn-outline" onClick={() => { setRegistrationComplete(false); setProfileStep(false); setIsLogin(true); }}>
          <ArrowLeft size={16} /> Back to Login
        </button>
      </div>
    );
  }

  if (profileStep) {
    return (
      <div className="signup-card profile-gate-card">
        <div className="signup-header">
          <div className="profile-gate-icon">
            <User size={28} />
          </div>
          <h2>Complete Your Profile</h2>
          <p>Please fill in all required fields to continue</p>
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
        <button type="button" className="profile-gate-back" onClick={() => { setProfileStep(false); setPendingRegistration(null); }}>
          <Lock size={14} />
          Back to Sign Up
        </button>
      </div>
    );
  }

  if (isLogin) {
    return (
      <div className="signup-card">
        <div className="signup-header">
          <Lock size={28} />
          <h2>Welcome Back</h2>
          <p>Sign in to your account to continue</p>
        </div>
        {error && <div className="signup-error">{error}</div>}
        <form onSubmit={handleLogin} className="signup-form">
          <div className="form-group">
            <label>Email or Username</label>
            <div className="input-icon-wrap">
              <Mail size={16} />
              <input
                type="text"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com or username"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Your password"
                required
              />
              <button type="button" className="input-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full">Sign In</button>
        </form>
        <p className="signup-toggle">
          Don't have an account?{' '}
          <button onClick={() => { setIsLogin(false); setError(''); }}>Sign up</button>
        </p>
      </div>
    );
  }

  return (
    <div className="signup-card">
      <div className="signup-header">
        <Zap size={28} />
        <h2>Create Your Account</h2>
        <p>Get started with Three Seas Digital services</p>
      </div>
      {error && <div className="signup-error">{error}</div>}
      <form onSubmit={handleSignUp} className="signup-form">
        <div className="form-group">
          <label>Full Name</label>
          <div className="input-icon-wrap">
            <User size={16} />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label>Email</label>
          <div className="input-icon-wrap">
            <Mail size={16} />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label>Password</label>
          <div className="input-icon-wrap">
            <Lock size={16} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Min 6 characters"
              required
            />
            <button type="button" className="input-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <div className="input-icon-wrap">
            <Lock size={16} />
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm password"
              required
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-full">Create Account</button>
      </form>
      <p className="signup-toggle">
        Already have an account?{' '}
        <button onClick={() => { setIsLogin(true); setError(''); }}>Sign in</button>
      </p>
    </div>
  );
}

/* ===== PRINT INVOICE ===== */
function printInvoice(invoice, clientName) {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${invoice.title}</title>
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
      <p><strong>${clientName}</strong></p>
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
      <tr><td>${invoice.title}${invoice.description ? `<br><small style="color:#666">${invoice.description}</small>` : ''}</td><td class="amount">$${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
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
            <button className="pay-modal-close" onClick={onClose}><X size={18} /></button>
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
          <button className="pay-modal-close" onClick={onClose}><X size={18} /></button>
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
  const { updateClient } = useAppContext();
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
    if (passwords.current !== client.password) {
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
    updateClient(client.id, { password: passwords.newPass });
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

  const [payingInvoice, setPayingInvoice] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedProject, setExpandedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  // Get live client data from clients array so admin changes show up
  const liveClient = clients.find((c) => c.id === currentClient.id) || currentClient;

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
      {/* Portal Navigation Tabs */}
      <div className="portal-tabs">
        <button className={`portal-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <User size={16} /> Overview
        </button>
        <button className={`portal-tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
          <FolderKanban size={16} /> Projects {activeProjects.length > 0 && <span className="portal-tab-badge">{activeProjects.length}</span>}
        </button>
        <button className={`portal-tab ${activeTab === 'invoices' ? 'active' : ''}`} onClick={() => setActiveTab('invoices')}>
          <FileText size={16} /> Invoices {unpaidInvoices.length > 0 && <span className="portal-tab-badge warning">{unpaidInvoices.length}</span>}
        </button>
        <button className={`portal-tab ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
          <MessageSquare size={16} /> Messages {notes.length > 0 && <span className="portal-tab-badge">{notes.length}</span>}
        </button>
        <button className={`portal-tab ${activeTab === 'support' ? 'active' : ''}`} onClick={() => setActiveTab('support')}>
          <HelpCircle size={16} /> Support
        </button>
      </div>

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
                      <strong>{note.author || 'Team'}</strong>
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p>{note.text}</p>
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
    <div className="page client-portal-page">
      <section className="portal-hero">
        <div className="container">
          <h1>Client Portal</h1>
          <p>Sign in or create an account to access your dashboard</p>
        </div>
      </section>
      <div className="container">
        <div className="portal-auth-wrapper">
          <SignUpStep />
        </div>
      </div>
    </div>
  );
}
