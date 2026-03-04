import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, Lock, Eye, EyeOff, User, Check, 
  Layout, Sparkles, Zap, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ===== TEMPLATES SIGN IN / SIGN UP =====
 * Separate from Client Portal - for template customers
 */

function AuthCard() {
  const { registerTemplateUser, templateUserLogin, currentTemplateUser } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
  });

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

    // Register as template customer
    const result = registerTemplateUser({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });

    if (result.success) {
      setSuccess('Account created! Welcome to Template Library.');
      setTimeout(() => {
        navigate('/templates');
      }, 1500);
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    
    const result = templateUserLogin(formData.email, formData.password);
    if (result.success) {
      navigate('/templates');
    } else {
      setError(result.error || 'Invalid email or password');
    }
  };

  return (
    <div className="templates-auth-card">
      <div className="templates-auth-brand">
        <div className="templates-auth-icon">
          <Layout size={32} />
        </div>
        <h1>Template Library</h1>
        <p>Access premium templates & resources</p>
      </div>

      {error && <div className="templates-auth-error">{error}</div>}
      {success && (
        <div className="templates-auth-success">
          <Check size={16} /> {success}
        </div>
      )}

      {isLogin ? (
        <form onSubmit={handleLogin} className="templates-auth-form">
          <div className="templates-form-group">
            <label>Email</label>
            <div className="templates-input-wrap">
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
          <div className="templates-form-group">
            <label>Password</label>
            <div className="templates-input-wrap">
              <Lock size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                required
              />
              <button 
                type="button" 
                className="templates-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="templates-auth-btn">
            <Zap size={18} />
            Sign In
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignUp} className="templates-auth-form">
          <div className="templates-form-group">
            <label>Full Name</label>
            <div className="templates-input-wrap">
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
          <div className="templates-form-group">
            <label>Email</label>
            <div className="templates-input-wrap">
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
          <div className="templates-form-group">
            <label>Password</label>
            <div className="templates-input-wrap">
              <Lock size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 6 characters"
                required
              />
              <button 
                type="button" 
                className="templates-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="templates-form-group">
            <label>Confirm Password</label>
            <div className="templates-input-wrap">
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
          <button type="submit" className="templates-auth-btn">
            <Sparkles size={18} />
            Create Account
          </button>
        </form>
      )}

      <div className="templates-auth-divider">
        <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
      </div>

      <button 
        type="button" 
        className="templates-auth-link"
        onClick={() => {
          setIsLogin(!isLogin);
          setError('');
          setSuccess('');
        }}
      >
        {isLogin ? 'Create free account' : 'Sign in to existing account'}
      </button>
    </div>
  );
}

export default function TemplatesSignIn() {
  const { currentTemplateUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = 'Template Access — Three Seas Digital';
    // Redirect if already logged in
    if (currentTemplateUser) {
      navigate('/templates');
    }
  }, [currentTemplateUser, navigate]);

  return (
    <div className="templates-signin-page">
      <div className="templates-signin-bg">
        <div className="templates-signin-gradient" />
      </div>
      
      <Link to="/templates" className="templates-signin-back">
        <ArrowLeft size={18} />
        Back to Templates
      </Link>

      <div className="templates-signin-container">
        <AuthCard />
        
        <div className="templates-signin-info">
          <h2>Why sign up?</h2>
          <ul>
            <li>
              <Sparkles size={18} />
              <span>Save favorite templates to your personal collection</span>
            </li>
            <li>
              <Zap size={18} />
              <span>Get notified when new templates are released</span>
            </li>
            <li>
              <Layout size={18} />
              <span>Access exclusive premium template previews</span>
            </li>
            <li>
              <Check size={18} />
              <span>Faster checkout when purchasing templates</span>
            </li>
          </ul>
          
          <div className="templates-signin-note">
            <strong>Note:</strong> This is separate from our <Link to="/services">Client Portal</Link>, 
            which is for active clients. Template accounts are free and designed for browsing 
            our template library.
          </div>
        </div>
      </div>
    </div>
  );
}
