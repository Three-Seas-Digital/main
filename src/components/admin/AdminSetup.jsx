import { useState } from 'react';
import { Shield } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function AdminSetup() {
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const { setupAdmin } = useAppContext();
  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    const result = setupAdmin({ name: form.name, email: form.email, username: form.username, password: form.password });
    if (!result.success) setError(result.error);
  };
  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-icon"><Shield size={32} /></div>
        <h2>Welcome to Three Seas Digital</h2>
        <p>Create your admin account to get started</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Full Name</label><input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required /></div>
          <div className="form-group"><label>Email</label><input type="email" name="email" value={form.email} onChange={handleChange} placeholder="admin@example.com" required /></div>
          <div className="form-group"><label>Username</label><input type="text" name="username" value={form.username} onChange={handleChange} placeholder="Choose a username" required /></div>
          <div className="form-group"><label>Password</label><input type="password" name="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" required /></div>
          <div className="form-group"><label>Confirm Password</label><input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm password" required /></div>
          <button type="submit" className="btn btn-primary btn-full"><Shield size={18} /> Create Admin Account</button>
        </form>
      </div>
    </div>
  );
}
