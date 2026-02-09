import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [failCount, setFailCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const { login } = useAppContext();
  const [now, setNow] = useState(Date.now);
  const isLocked = lockedUntil && now < lockedUntil;

  // Tick the countdown while locked
  useEffect(() => {
    if (!lockedUntil) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= lockedUntil) { setLockedUntil(null); setFailCount(0); clearInterval(timer); }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLocked) return;
    const result = login(username, password);
    if (!result.success) {
      const newCount = failCount + 1;
      setFailCount(newCount);
      if (newCount >= 3) {
        setLockedUntil(Date.now() + 30000); // 30 second lockout
        setError('Too many failed attempts. Please wait 30 seconds.');
      } else {
        setError(result.error);
      }
    }
  };
  const lockSeconds = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - now) / 1000)) : 0;
  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-icon"><Lock size={32} /></div>
        <h2>Admin Panel</h2>
        <p>Sign in to manage your dashboard</p>
        {error && <div className="login-error">{error}{isLocked ? ` (${lockSeconds}s)` : ''}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Username</label><input type="text" value={username} onChange={(e) => { setUsername(e.target.value); setError(''); }} placeholder="Username" required /></div>
          <div className="form-group"><label>Password</label><input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="Password" required /></div>
          <button type="submit" className="btn btn-primary btn-full" disabled={isLocked}>{isLocked ? `Locked (${lockSeconds}s)` : 'Sign In'}</button>
        </form>
        <p className="login-hint">Enter your credentials to sign in</p>
        <div className="login-register-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
}
