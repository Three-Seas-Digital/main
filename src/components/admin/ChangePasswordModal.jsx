import { useState } from 'react';
import { X, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function ChangePasswordModal({ onClose }) {
  const token = localStorage.getItem('threeseas_access_token');
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to change password');
      } else {
        setSuccess(true);
        setTimeout(onClose, 1500);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-doc-modal-overlay" onClick={onClose}>
      <div className="portal-doc-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="portal-doc-modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={18} /> Change Password</h3>
          <button className="portal-doc-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {success ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--emerald, #10b981)' }}>
            <CheckCircle size={48} />
            <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>Password changed successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && <div className="auth-error">{error}</div>}

            <div className="auth-field">
              <label>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
