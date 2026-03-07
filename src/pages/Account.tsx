import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/account.css';
import { 
  User, Mail, Download, Heart, Crown, Zap, LogOut,
  CreditCard, Calendar, ChevronRight, ExternalLink,
  Settings, Bell, Shield, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ===== ACCOUNT DASHBOARD =====
 * Template user account management
 */

function SubscriptionCard({ tier, subscription, onUpgrade }) {
  const tierConfig = {
    free: { icon: Download, color: '#6b7280', label: 'Free' },
    pro: { icon: Zap, color: '#22d3ee', label: 'Pro' },
    enterprise: { icon: Crown, color: '#c8a43e', label: 'Enterprise' },
  };
  
  const config = tierConfig[tier] || tierConfig.free;
  const Icon = config.icon;

  return (
    <div className="account-card account-subscription">
      <div className="account-card-header">
        <h3><Crown size={18} /> Subscription</h3>
      </div>
      
      <div className="account-tier-badge" style={{ 
        background: `linear-gradient(135deg, ${config.color}20, ${config.color}10)`,
        borderColor: `${config.color}40`
      }}>
        <Icon size={24} style={{ color: config.color }} />
        <div>
          <span className="account-tier-name" style={{ color: config.color }}>
            {config.label} Plan
          </span>
          <span className="account-tier-status">
            {subscription.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {tier === 'free' ? (
        <div className="account-upgrade-cta">
          <p>Unlock all templates and premium features</p>
          <button className="account-btn account-btn--primary" onClick={onUpgrade}>
            <Zap size={16} />
            Upgrade to Pro
          </button>
        </div>
      ) : (
        <div className="account-subscription-details">
          <div className="account-detail-row">
            <Calendar size={16} />
            <span>Started: {new Date(subscription.startedAt).toLocaleDateString()}</span>
          </div>
          {subscription.expiresAt && (
            <div className="account-detail-row">
              <Calendar size={16} />
              <span>Renews: {new Date(subscription.expiresAt).toLocaleDateString()}</span>
            </div>
          )}
          <div className="account-detail-row">
            <CreditCard size={16} />
            <span>Payment method: {subscription.stripeCustomerId ? '•••• 4242' : 'None'}</span>
          </div>
        </div>
      )}

      {tier !== 'free' && (
        <div className="account-actions">
          <button className="account-btn account-btn--secondary">
            Manage Billing
          </button>
          <button className="account-btn account-btn--outline">
            Cancel Subscription
          </button>
        </div>
      )}
    </div>
  );
}

function StatsCard({ downloads, favorites }) {
  return (
    <div className="account-card account-stats">
      <div className="account-card-header">
        <h3><Settings size={18} /> Usage Stats</h3>
      </div>
      
      <div className="account-stats-grid">
        <div className="account-stat">
          <Download size={24} />
          <div>
            <span className="account-stat-value">{downloads.length}</span>
            <span className="account-stat-label">Downloads</span>
          </div>
        </div>
        <div className="account-stat">
          <Heart size={24} />
          <div>
            <span className="account-stat-value">{favorites.length}</span>
            <span className="account-stat-label">Favorites</span>
          </div>
        </div>
      </div>

      {downloads.length > 0 && (
        <div className="account-recent">
          <h4>Recent Downloads</h4>
          <ul>
            {downloads.slice(-5).reverse().map((dl, i) => (
              <li key={i}>
                <Check size={14} />
                <span>Template #{dl.templateId}</span>
                <small>{new Date(dl.downloadedAt).toLocaleDateString()}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ProfileCard({ user, onLogout }) {
  return (
    <div className="account-card account-profile">
      <div className="account-card-header">
        <h3><User size={18} /> Profile</h3>
      </div>
      
      <div className="account-profile-info">
        <div className="account-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="account-profile-details">
          <strong>{user.name}</strong>
          <span><Mail size={14} /> {user.email}</span>
          <small>Member since {new Date(user.createdAt).toLocaleDateString()}</small>
        </div>
      </div>

      <div className="account-actions">
        <button className="account-btn account-btn--secondary">
          Edit Profile
        </button>
        <button className="account-btn account-btn--outline account-btn--danger" onClick={onLogout}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function FeaturesCard({ tier, TEMPLATE_TIERS }) {
  const tierConfig = TEMPLATE_TIERS[tier];
  
  return (
    <div className="account-card account-features">
      <div className="account-card-header">
        <h3><Shield size={18} /> Your Features</h3>
      </div>
      
      <ul className="account-features-list">
        {tierConfig.features.map((feature, i) => (
          <li key={i}>
            <Check size={16} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="account-templates-access">
        <h4>Template Access</h4>
        <div className="account-tier-tags">
          {tierConfig.allowedTiers.map((t) => (
            <span key={t} className={`account-tier-tag account-tier-tag--${t.toLowerCase()}`}>
              {t}
            </span>
          ))}
        </div>
      </div>

      <Link to="/templates" className="account-browse-btn">
        Browse Templates
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

export default function Account() {
  const { 
    currentTemplateUser, 
    templateUserLogout, 
    TEMPLATE_TIERS,
    removeFromFavorites 
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'My Account — Template Library';
    // Redirect if not logged in
    if (!currentTemplateUser) {
      navigate('/templates/signin');
    }
  }, [currentTemplateUser, navigate]);

  const handleLogout = () => {
    templateUserLogout();
    navigate('/templates');
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  if (!currentTemplateUser) {
    return (
      <div className="account-page account-page--loading">
        <div className="account-loading">
          <div className="account-spinner" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="account-page">
      <div className="account-bg">
        <div className="account-gradient" />
      </div>

      <div className="account-container">
        <header className="account-header">
          <h1>My Account</h1>
          <p>Manage your subscription and profile</p>
        </header>

        <div className="account-grid">
          {/* Left Column */}
          <div className="account-column">
            <ProfileCard 
              user={currentTemplateUser} 
              onLogout={handleLogout} 
            />
            <StatsCard 
              downloads={currentTemplateUser.downloads || []}
              favorites={currentTemplateUser.favorites || []}
            />
          </div>

          {/* Right Column */}
          <div className="account-column account-column--wide">
            <SubscriptionCard 
              tier={currentTemplateUser.tier}
              subscription={currentTemplateUser.subscription}
              onUpgrade={handleUpgrade}
            />
            <FeaturesCard 
              tier={currentTemplateUser.tier}
              TEMPLATE_TIERS={TEMPLATE_TIERS}
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="account-quick-links">
          <Link to="/templates" className="account-quick-link">
            <ExternalLink size={16} />
            Browse All Templates
          </Link>
          <Link to="/pricing" className="account-quick-link">
            <CreditCard size={16} />
            Compare Plans
          </Link>
          <Link to="/contact" className="account-quick-link">
            <Bell size={16} />
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
