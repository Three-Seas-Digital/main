import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, CheckCircle, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import '../styles/admin.css';

export default function Register() {
  useEffect(() => { document.title = 'Register — Three Seas Digital'; }, []);
  const { register } = useAppContext();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const result = await register({
      name: form.name,
      email: form.email,
      username: form.username,
      password: form.password,
    });

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {submitted ? (
          <div className="auth-success">
            <CheckCircle size={48} className="auth-success-icon" />
            <h2>Registration Submitted!</h2>
            <p>
              Your account has been created and is <strong>pending approval</strong>.
              An administrator will review your registration and assign your role.
              You'll be able to sign in once approved.
            </p>
            <Link to="/admin" className="auth-submit" style={{ textDecoration: 'none', display: 'inline-flex' }}>
              Go to Sign In <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <div className="auth-icon"><UserPlus size={28} /></div>
            <div className="auth-brand">Three Seas Digital</div>
            <h2 className="auth-title">Create an Account</h2>
            <p className="auth-subtitle">Register to join the team. Your account will need admin approval before you can sign in.</p>
            {error && <div className="auth-error">{error}</div>}
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label>Full Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required />
              </div>
              <div className="auth-field">
                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="john@example.com" required />
              </div>
              <div className="auth-field">
                <label>Username</label>
                <input type="text" name="username" value={form.username} onChange={handleChange} placeholder="johndoe" required />
              </div>
              <div className="auth-field">
                <label>Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" required />
              </div>
              <div className="auth-field">
                <label>Confirm Password</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm your password" required />
              </div>
              <button type="submit" className="auth-submit"><UserPlus size={18} /> Register</button>
            </form>
            <div className="auth-link">
              Already have an account? <Link to="/admin">Sign in here</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
