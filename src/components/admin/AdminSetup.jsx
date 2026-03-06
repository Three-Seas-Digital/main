import { useState } from 'react';
import { Shield } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function AdminSetup() {
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const { setupAdmin } = useAppContext();
  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    const result = await setupAdmin({ name: form.name, email: form.email, username: form.username, password: form.password });
    if (!result.success) setError(result.error);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon"><Shield size={28} /></div>
        <div className="auth-brand">Three Seas Digital</div>
        <h2 className="auth-title">Create Admin Account</h2>
        <p className="auth-subtitle">Set up your admin credentials to get started</p>
        {error && <div className="auth-error">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Full Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />
          </div>
          <div className="auth-field">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="admin@example.com" required />
          </div>
          <div className="auth-field">
            <label>Username</label>
            <input type="text" name="username" value={form.username} onChange={handleChange} placeholder="Choose a username" required />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" required />
          </div>
          <div className="auth-field">
            <label>Confirm Password</label>
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm password" required />
          </div>
          <button type="submit" className="auth-submit"><Shield size={18} /> Create Admin Account</button>
        </form>
      </div>
    </div>
  );
}
