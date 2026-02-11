import { useState, useMemo } from 'react';
import {
  ClipboardCheck, User, Mail, Phone, Building2, MapPin,
  Check, Circle, ChevronRight, Copy, Eye, Send, Briefcase,
  Plus, SkipForward, CheckCircle, FileText, Shield, Star,
  ArrowRight, Clock, Hash,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { generateId, safeGetItem, safeSetItem } from '../../constants';

const STEPS = [
  { id: 'profile', label: 'Complete Profile', description: 'Business name, phone, and address' },
  { id: 'tier', label: 'Assign Tier', description: 'Select a service tier' },
  { id: 'portal', label: 'Portal Access', description: 'Set a temporary password' },
  { id: 'welcome', label: 'Send Welcome Email', description: 'Preview and mark sent' },
  { id: 'bi', label: 'Initialize BI', description: 'Create intake & growth templates' },
  { id: 'project', label: 'Create First Project', description: 'Set up initial project' },
];

const SOURCE_LABELS = {
  pipeline: { label: 'Pipeline', color: '#3b82f6' },
  'self-registration': { label: 'Self-Reg', color: '#22c55e' },
  manual: { label: 'Manual', color: '#6b7280' },
  appointment: { label: 'Appointment', color: '#8b5cf6' },
};

export default function OnboardingTab() {
  const {
    clients, updateClient, addProject, hashPassword,
    completeOnboarding, updateClientOnboarding,
    emailTemplates, addNotification, logActivity, currentUser,
    prospects,
  } = useAppContext();

  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Profile form state
  const [profileForm, setProfileForm] = useState({ businessName: '', phone: '', street: '', city: '', state: '', zip: '' });
  const [profileEditing, setProfileEditing] = useState(false);

  // Tier state
  const [tierValue, setTierValue] = useState('free');

  // Password state
  const [tempPassword, setTempPassword] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);

  // Welcome email state
  const [showWelcomePreview, setShowWelcomePreview] = useState(false);

  // Project form state
  const [projectForm, setProjectForm] = useState({ title: '', description: '' });

  // Queue derivation
  const onboardingQueue = useMemo(() => {
    let queue = clients.filter((c) => c.onboarding && !c.onboarding.complete && c.status !== 'archived');

    if (filter !== 'all') {
      queue = queue.filter((c) => {
        if (filter === 'pipeline') return c.sourceProspectId || c.source === 'pipeline';
        if (filter === 'self-registration') return c.source === 'self-registration';
        if (filter === 'manual') return c.source === 'manual';
        return true;
      });
    }

    queue.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return queue;
  }, [clients, filter, sortOrder]);

  const completedThisWeek = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return clients.filter((c) => c.onboarding?.complete && c.onboarding.completedAt && new Date(c.onboarding.completedAt) > weekAgo).length;
  }, [clients]);

  const inProgressCount = useMemo(() =>
    onboardingQueue.filter((c) => c.onboarding?.startedAt).length,
  [onboardingQueue]);

  const selectedClient = useMemo(() =>
    clients.find((c) => c.id === selectedId),
  [clients, selectedId]);

  // Step completion checks
  const getStepStatus = (client) => {
    if (!client) return {};
    const hasProfile = !!(client.businessName && client.phone && (client.street || client.city));
    const hasTier = client.tier && client.tier !== 'free';
    const hasPassword = !!client.password;
    const welcomeSent = !!client.onboarding?.welcomeEmailSent;

    const intakes = safeGetItem('threeseas_bi_intakes', {});
    const hasBi = !!intakes[client.id];

    const hasProject = (client.projects || []).length > 0;

    return {
      profile: hasProfile,
      tier: hasTier,
      portal: hasPassword,
      welcome: welcomeSent,
      bi: hasBi,
      project: hasProject,
    };
  };

  const stepStatus = selectedClient ? getStepStatus(selectedClient) : {};
  const completedSteps = Object.values(stepStatus).filter(Boolean).length;
  const requiredComplete = stepStatus.profile && stepStatus.tier && stepStatus.portal && stepStatus.welcome && stepStatus.bi;

  // Prospect notes for pipeline conversions
  const sourceProspect = useMemo(() => {
    if (!selectedClient?.sourceProspectId) return null;
    return prospects.find((p) => p.id === selectedClient.sourceProspectId) || null;
  }, [selectedClient, prospects]);

  // Handlers
  const handleSelectClient = (client) => {
    setSelectedId(client.id);
    // Mark started
    if (!client.onboarding?.startedAt) {
      updateClientOnboarding(client.id, { startedAt: new Date().toISOString() });
    }
    // Init form values
    setProfileForm({
      businessName: client.businessName || '',
      phone: client.phone || '',
      street: client.street || '',
      city: client.city || '',
      state: client.state || '',
      zip: client.zip || '',
    });
    setProfileEditing(false);
    setTierValue(client.tier || 'free');
    setTempPassword('');
    setPasswordCopied(false);
    setShowWelcomePreview(false);
    setProjectForm({ title: '', description: '' });
  };

  const handleSaveProfile = () => {
    if (!selectedClient) return;
    updateClient(selectedClient.id, {
      businessName: profileForm.businessName,
      phone: profileForm.phone,
      street: profileForm.street,
      city: profileForm.city,
      state: profileForm.state,
      zip: profileForm.zip,
      profileComplete: true,
    });
    setProfileEditing(false);
  };

  const handleSaveTier = () => {
    if (!selectedClient) return;
    updateClient(selectedClient.id, { tier: tierValue });
  };

  const handleGeneratePassword = () => {
    if (!selectedClient) return;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setTempPassword(pwd);

    const hashed = hashPassword(pwd);
    updateClient(selectedClient.id, { password: hashed });
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword).then(() => {
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    });
  };

  const handleSendWelcome = () => {
    if (!selectedClient) return;
    updateClientOnboarding(selectedClient.id, { welcomeEmailSent: true });
    logActivity('welcome_email_sent', { clientId: selectedClient.id, clientName: selectedClient.name });
    addNotification({ type: 'info', title: 'Welcome Email', message: `Welcome email marked as sent to ${selectedClient.name}` });
    setShowWelcomePreview(false);
  };

  const handleInitBi = () => {
    if (!selectedClient) return;
    const id = selectedClient.id;
    try {
      const intakes = safeGetItem('threeseas_bi_intakes', {});
      if (!intakes[id]) {
        intakes[id] = {
          id: generateId(),
          industry: '', sub_industry: '', years_in_operation: '', employee_count_range: '',
          annual_revenue_range: '', target_market: '', business_model: '',
          current_website_url: '', hosting_provider: '', tech_stack: '', domain_age_years: '',
          has_ssl: false, is_mobile_responsive: false, last_website_update: '',
          social_platforms: [], email_marketing_tool: '', paid_advertising: '',
          content_marketing: '', seo_efforts: '',
          pain_points: '', goals: '', budget_range: '', timeline_expectations: '',
          notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        safeSetItem('threeseas_bi_intakes', JSON.stringify(intakes));
      }

      const financials = safeGetItem('threeseas_bi_client_financials', {});
      if (!financials[id]) {
        financials[id] = { clientId: id, entries: [], createdAt: new Date().toISOString() };
        safeSetItem('threeseas_bi_client_financials', JSON.stringify(financials));
      }

      const targets = safeGetItem('threeseas_bi_growth_targets', []);
      const hasTargets = targets.some((t) => t.clientId === id);
      if (!hasTargets) {
        const now = new Date().toISOString();
        const defaultMetrics = [
          { name: 'Website Traffic', unit: 'visitors/mo', baseline: 0, current: 0, target: 500, status: 'active' },
          { name: 'Conversion Rate', unit: '%', baseline: 0, current: 0, target: 3, status: 'active' },
          { name: 'Monthly Revenue', unit: '$', baseline: 0, current: 0, target: 5000, status: 'active' },
          { name: 'Social Media Followers', unit: 'followers', baseline: 0, current: 0, target: 500, status: 'active' },
        ];
        const newTargets = defaultMetrics.map((m) => ({
          id: generateId(), clientId: id, ...m, createdAt: now,
        }));
        safeSetItem('threeseas_bi_growth_targets', JSON.stringify([...targets, ...newTargets]));
      }

      addNotification({ type: 'success', title: 'BI Initialized', message: `Business Intelligence templates created for ${selectedClient.name}` });
    } catch (e) {
      addNotification({ type: 'error', title: 'BI Error', message: `Failed to initialize BI for ${selectedClient.name}` });
    }
  };

  const handleCreateProject = () => {
    if (!selectedClient || !projectForm.title.trim()) return;
    addProject(selectedClient.id, {
      title: projectForm.title.trim(),
      description: projectForm.description.trim(),
      status: 'planning',
    });
    setProjectForm({ title: '', description: '' });
  };

  const handleComplete = () => {
    if (!selectedClient) return;
    completeOnboarding(selectedClient.id);
    setSelectedId(null);
  };

  const handleSkip = () => {
    if (!selectedClient) return;
    if (!window.confirm(`Skip onboarding for ${selectedClient.name}? They can still be set up later via the Clients tab.`)) return;
    completeOnboarding(selectedClient.id);
    setSelectedId(null);
  };

  // Progress bar helper
  const getProgressForClient = (client) => {
    const s = getStepStatus(client);
    return Object.values(s).filter(Boolean).length;
  };

  // Welcome email template
  const welcomeTemplate = emailTemplates.find((t) => t.id === 'welcome');

  const getSourceInfo = (client) => {
    if (client.sourceProspectId || client.source === 'pipeline') return SOURCE_LABELS.pipeline;
    return SOURCE_LABELS[client.source] || SOURCE_LABELS.manual;
  };

  return (
    <div className="onboarding-tab">
      {/* Stats Row */}
      <div className="onboarding-stats">
        <div className="onboarding-stat">
          <Hash size={16} />
          <div>
            <span className="onboarding-stat-value">{onboardingQueue.length}</span>
            <span className="onboarding-stat-label">Pending</span>
          </div>
        </div>
        <div className="onboarding-stat">
          <Clock size={16} />
          <div>
            <span className="onboarding-stat-value">{inProgressCount}</span>
            <span className="onboarding-stat-label">In Progress</span>
          </div>
        </div>
        <div className="onboarding-stat">
          <CheckCircle size={16} />
          <div>
            <span className="onboarding-stat-value">{completedThisWeek}</span>
            <span className="onboarding-stat-label">This Week</span>
          </div>
        </div>
      </div>

      <div className="onboarding-layout">
        {/* Left Panel — Queue */}
        <div className="onboarding-queue">
          <div className="onboarding-queue-header">
            <h3>Onboarding Queue</h3>
            <div className="onboarding-filters">
              {['all', 'pipeline', 'self-registration', 'manual'].map((f) => (
                <button
                  key={f}
                  className={`onboarding-filter-pill ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'self-registration' ? 'Self-Reg' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <select className="onboarding-sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {onboardingQueue.length === 0 ? (
            <div className="onboarding-empty">
              <ClipboardCheck size={40} />
              <p>No clients awaiting onboarding</p>
            </div>
          ) : (
            <div className="onboarding-list">
              {onboardingQueue.map((client) => {
                const progress = getProgressForClient(client);
                const source = getSourceInfo(client);
                return (
                  <button
                    key={client.id}
                    className={`onboarding-card ${selectedId === client.id ? 'active' : ''}`}
                    onClick={() => handleSelectClient(client)}
                  >
                    <div className="onboarding-card-top">
                      <div className="onboarding-card-avatar">
                        {client.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="onboarding-card-info">
                        <span className="onboarding-card-name">{client.name}</span>
                        <span className="onboarding-card-email">{client.email}</span>
                      </div>
                      <ChevronRight size={16} className="onboarding-card-arrow" />
                    </div>
                    <div className="onboarding-card-bottom">
                      <span className="onboarding-source-badge" style={{ background: source.color + '20', color: source.color, borderColor: source.color }}>
                        {source.label}
                      </span>
                      <div className="onboarding-progress-mini">
                        <div className="onboarding-progress-bar">
                          <div className="onboarding-progress-fill" style={{ width: `${(progress / 6) * 100}%` }} />
                        </div>
                        <span className="onboarding-progress-text">{progress}/6</span>
                      </div>
                      <span className="onboarding-card-date">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel — Detail */}
        <div className="onboarding-detail">
          {!selectedClient ? (
            <div className="onboarding-empty">
              <ArrowRight size={40} />
              <p>Select a client from the queue to begin onboarding</p>
            </div>
          ) : (
            <>
              {/* Client Header */}
              <div className="onboarding-detail-header">
                <div className="onboarding-detail-avatar">
                  {selectedClient.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="onboarding-detail-info">
                  <h3>{selectedClient.name}</h3>
                  <span>{selectedClient.email}</span>
                  <span className="onboarding-source-badge" style={{
                    background: getSourceInfo(selectedClient).color + '20',
                    color: getSourceInfo(selectedClient).color,
                    borderColor: getSourceInfo(selectedClient).color,
                  }}>
                    {getSourceInfo(selectedClient).label}
                  </span>
                </div>
                <div className="onboarding-progress-ring">
                  <svg viewBox="0 0 36 36" className="onboarding-ring-svg">
                    <path
                      className="onboarding-ring-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="onboarding-ring-fill"
                      strokeDasharray={`${(completedSteps / 6) * 100}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20.35" className="onboarding-ring-text">{completedSteps}/6</text>
                  </svg>
                </div>
              </div>

              {/* Checklist */}
              <div className="onboarding-checklist">
                {/* Step 1: Profile */}
                <div className={`onboarding-step ${stepStatus.profile ? 'complete' : ''}`}>
                  <div className="onboarding-step-header">
                    {stepStatus.profile ? <Check size={18} /> : <Circle size={18} />}
                    <div>
                      <span className="onboarding-step-label">1. Complete Profile</span>
                      <span className="onboarding-step-desc">Business name, phone, and address</span>
                    </div>
                  </div>
                  {!stepStatus.profile && (
                    <div className="onboarding-step-body">
                      {!profileEditing ? (
                        <button className="btn btn-sm btn-outline" onClick={() => setProfileEditing(true)}>
                          <Building2 size={14} /> Fill Profile
                        </button>
                      ) : (
                        <div className="onboarding-form-grid">
                          <input placeholder="Business Name" value={profileForm.businessName} onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })} />
                          <input placeholder="Phone" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                          <input placeholder="Street" value={profileForm.street} onChange={(e) => setProfileForm({ ...profileForm, street: e.target.value })} />
                          <input placeholder="City" value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} />
                          <input placeholder="State" value={profileForm.state} onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })} />
                          <input placeholder="ZIP" value={profileForm.zip} onChange={(e) => setProfileForm({ ...profileForm, zip: e.target.value })} />
                          <div className="onboarding-form-actions">
                            <button className="btn btn-sm btn-primary" onClick={handleSaveProfile} disabled={!profileForm.businessName || !profileForm.phone}>
                              <Check size={14} /> Save
                            </button>
                            <button className="btn btn-sm btn-outline" onClick={() => setProfileEditing(false)}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 2: Tier */}
                <div className={`onboarding-step ${stepStatus.tier ? 'complete' : ''}`}>
                  <div className="onboarding-step-header">
                    {stepStatus.tier ? <Check size={18} /> : <Circle size={18} />}
                    <div>
                      <span className="onboarding-step-label">2. Assign Tier</span>
                      <span className="onboarding-step-desc">Current: {selectedClient.tier || 'free'}</span>
                    </div>
                  </div>
                  {!stepStatus.tier && (
                    <div className="onboarding-step-body">
                      <div className="onboarding-tier-row">
                        <select value={tierValue} onChange={(e) => setTierValue(e.target.value)}>
                          <option value="free">Free</option>
                          <option value="starter">Starter</option>
                          <option value="business">Business</option>
                          <option value="premium">Premium</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                        <button className="btn btn-sm btn-primary" onClick={handleSaveTier} disabled={tierValue === 'free'}>
                          <Star size={14} /> Assign
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 3: Portal Access */}
                <div className={`onboarding-step ${stepStatus.portal ? 'complete' : ''}`}>
                  <div className="onboarding-step-header">
                    {stepStatus.portal ? <Check size={18} /> : <Circle size={18} />}
                    <div>
                      <span className="onboarding-step-label">3. Portal Access</span>
                      <span className="onboarding-step-desc">{stepStatus.portal ? 'Password set' : 'No password set'}</span>
                    </div>
                  </div>
                  {!stepStatus.portal && (
                    <div className="onboarding-step-body">
                      {!tempPassword ? (
                        <button className="btn btn-sm btn-outline" onClick={handleGeneratePassword}>
                          <Shield size={14} /> Generate Temp Password
                        </button>
                      ) : (
                        <div className="onboarding-password-row">
                          <code className="onboarding-password">{tempPassword}</code>
                          <button className="btn btn-sm btn-outline" onClick={handleCopyPassword}>
                            <Copy size={14} /> {passwordCopied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 4: Welcome Email */}
                <div className={`onboarding-step ${stepStatus.welcome ? 'complete' : ''}`}>
                  <div className="onboarding-step-header">
                    {stepStatus.welcome ? <Check size={18} /> : <Circle size={18} />}
                    <div>
                      <span className="onboarding-step-label">4. Send Welcome Email</span>
                      <span className="onboarding-step-desc">{stepStatus.welcome ? 'Sent' : 'Not sent'}</span>
                    </div>
                  </div>
                  {!stepStatus.welcome && (
                    <div className="onboarding-step-body">
                      {!showWelcomePreview ? (
                        <button className="btn btn-sm btn-outline" onClick={() => setShowWelcomePreview(true)}>
                          <Eye size={14} /> Preview & Send
                        </button>
                      ) : (
                        <div className="onboarding-welcome-preview">
                          <div className="onboarding-email-preview">
                            <strong>Subject:</strong> {welcomeTemplate?.subject?.replace('{clientName}', selectedClient.name) || 'Welcome to Three Seas Digital!'}
                            <hr />
                            <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                              {welcomeTemplate?.body?.replace(/{clientName}/g, selectedClient.name) || `Hi ${selectedClient.name},\n\nWelcome aboard!`}
                            </div>
                          </div>
                          <div className="onboarding-form-actions">
                            <button className="btn btn-sm btn-primary" onClick={handleSendWelcome}>
                              <Send size={14} /> Mark as Sent
                            </button>
                            <button className="btn btn-sm btn-outline" onClick={() => setShowWelcomePreview(false)}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 5: Initialize BI */}
                <div className={`onboarding-step ${stepStatus.bi ? 'complete' : ''}`}>
                  <div className="onboarding-step-header">
                    {stepStatus.bi ? <Check size={18} /> : <Circle size={18} />}
                    <div>
                      <span className="onboarding-step-label">5. Initialize BI</span>
                      <span className="onboarding-step-desc">{stepStatus.bi ? 'Templates created' : 'No BI templates yet'}</span>
                    </div>
                  </div>
                  {!stepStatus.bi && (
                    <div className="onboarding-step-body">
                      <button className="btn btn-sm btn-outline" onClick={handleInitBi}>
                        <Briefcase size={14} /> Initialize BI Templates
                      </button>
                    </div>
                  )}
                </div>

                {/* Step 6: First Project */}
                <div className={`onboarding-step ${stepStatus.project ? 'complete' : ''}`}>
                  <div className="onboarding-step-header">
                    {stepStatus.project ? <Check size={18} /> : <Circle size={18} />}
                    <div>
                      <span className="onboarding-step-label">6. Create First Project</span>
                      <span className="onboarding-step-desc">{stepStatus.project ? `${(selectedClient.projects || []).length} project(s)` : 'No projects'}</span>
                    </div>
                  </div>
                  {!stepStatus.project && (
                    <div className="onboarding-step-body">
                      <div className="onboarding-form-grid">
                        <input placeholder="Project Title" value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} />
                        <input placeholder="Description (optional)" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
                        <div className="onboarding-form-actions">
                          <button className="btn btn-sm btn-primary" onClick={handleCreateProject} disabled={!projectForm.title.trim()}>
                            <Plus size={14} /> Create Project
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Transferred Notes & Documents */}
              {(selectedClient.notes?.length > 0 || selectedClient.documents?.length > 0) && (
                <div className="onboarding-transferred">
                  {selectedClient.notes?.length > 0 && (
                    <div className="onboarding-transferred-section">
                      <h4><FileText size={14} /> Transferred Notes ({selectedClient.notes.length})</h4>
                      <div className="onboarding-notes-list">
                        {selectedClient.notes.slice(0, 5).map((note) => (
                          <div key={note.id} className="onboarding-note">
                            <p>{note.text}</p>
                            <span className="onboarding-note-meta">{note.author} &middot; {new Date(note.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                        {selectedClient.notes.length > 5 && <p className="onboarding-more">+{selectedClient.notes.length - 5} more</p>}
                      </div>
                    </div>
                  )}
                  {selectedClient.documents?.length > 0 && (
                    <div className="onboarding-transferred-section">
                      <h4><FileText size={14} /> Transferred Documents ({selectedClient.documents.length})</h4>
                      <div className="onboarding-docs-list">
                        {selectedClient.documents.map((doc) => (
                          <div key={doc.id} className="onboarding-doc">
                            <span className="onboarding-doc-name">{doc.name}</span>
                            <span className="onboarding-doc-type">{doc.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="onboarding-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleComplete}
                  disabled={!requiredComplete}
                  title={!requiredComplete ? 'Complete steps 1-5 first' : 'Mark onboarding as complete'}
                >
                  <CheckCircle size={16} /> Complete Onboarding
                </button>
                <button className="btn btn-outline btn-sm" onClick={handleSkip}>
                  <SkipForward size={14} /> Skip Onboarding
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
