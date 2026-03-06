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
  const [now, setNow] = useState(() => Date.now());
  const isLocked = lockedUntil && now < lockedUntil;

  useEffect(() => {
    if (!lockedUntil) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= lockedUntil) { setLockedUntil(null); setFailCount(0); clearInterval(timer); }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    const result = await login(username, password);
    if (!result.success) {
      const newCount = failCount + 1;
      setFailCount(newCount);
      if (newCount >= 3) {
        setLockedUntil(Date.now() + 30000);
        setError('Too many failed attempts. Please wait 30 seconds.');
      } else {
        setError(result.error);
      }
    }
  };

  const lockSeconds = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - now) / 1000)) : 0;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon"><Lock size={28} /></div>
        <div className="auth-brand">Three Seas Digital</div>
        <h2 className="auth-title">Admin Panel</h2>
        <p className="auth-subtitle">Sign in to manage your dashboard</p>
        {isLocked && <div className="auth-lockout">Account locked — try again in {lockSeconds}s</div>}
        {error && !isLocked && <div className="auth-error">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => { setUsername(e.target.value); setError(''); }} placeholder="Username" required />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="Password" required />
          </div>
          <button type="submit" className="auth-submit" disabled={isLocked}>
            {isLocked ? `Locked (${lockSeconds}s)` : 'Sign In'}
          </button>
        </form>
        <div className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
}
