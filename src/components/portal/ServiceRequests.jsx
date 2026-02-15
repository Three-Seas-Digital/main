import { useState, useMemo } from 'react';
import {
  ClipboardList, Plus, Send, Inbox, Clock, CheckCircle2,
  XCircle, DollarSign, AlertTriangle, X, Link2,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { generateId, safeGetItem, safeSetItem } from '../../constants';
import { syncToApi } from '../../api/apiSync';

// Status config
const STATUS_CONFIG = {
  submitted:   { label: 'Submitted',   color: '#3b82f6', bg: '#3b82f622', icon: Send },
  reviewing:   { label: 'Reviewing',   color: '#f59e0b', bg: '#f59e0b22', icon: Clock },
  quoted:      { label: 'Quoted',      color: '#8b5cf6', bg: '#8b5cf622', icon: DollarSign },
  approved:    { label: 'Approved',    color: '#10b981', bg: '#10b98122', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', color: '#6366f1', bg: '#6366f122', icon: Clock },
  completed:   { label: 'Completed',   color: '#22c55e', bg: '#22c55e22', icon: CheckCircle2 },
  cancelled:   { label: 'Cancelled',   color: '#6b7280', bg: '#6b728022', icon: XCircle },
};

const URGENCY_CONFIG = {
  low:    { label: 'Low',    color: '#22c55e', bg: '#22c55e22' },
  medium: { label: 'Medium', color: '#f59e0b', bg: '#f59e0b22' },
  high:   { label: 'High',   color: '#ef4444', bg: '#ef444422' },
  asap:   { label: 'ASAP',   color: '#dc2626', bg: '#dc262622' },
};

const BUDGET_RANGES = [
  'Under $500',
  '$500 - $1,000',
  '$1,000 - $2,500',
  '$2,500 - $5,000',
  '$5,000 - $10,000',
  '$10,000+',
  'Not sure',
];

export default function ServiceRequests() {
  const { currentClient } = useAppContext();
  const clientId = currentClient?.id;

  // Service requests from localStorage
  const [requests, setRequests] = useState(() =>
    safeGetItem('threeseas_bi_service_requests', [])
  );

  // Active recommendations for linking
  const allRecommendations = useMemo(() => {
    const raw = safeGetItem('threeseas_bi_recommendations', []);
    if (Array.isArray(raw)) return raw;
    return Object.values(raw).flat();
  }, []);
  const activeRecs = useMemo(
    () => allRecommendations.filter(
      (r) => r.clientId === clientId && ['proposed', 'accepted', 'in_progress'].includes(r.status)
    ),
    [allRecommendations, clientId]
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    urgency: 'medium',
    linkedRecommendationId: '',
  });
  const [formError, setFormError] = useState('');

  // Client-specific requests
  const clientRequests = useMemo(
    () => requests
      .filter((r) => r.clientId === clientId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    [requests, clientId]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (!form.description.trim()) {
      setFormError('Description is required.');
      return;
    }

    const newRequest = {
      id: generateId(),
      clientId,
      title: form.title.trim(),
      description: form.description.trim(),
      budget: form.budget || null,
      urgency: form.urgency,
      linkedRecommendationId: form.linkedRecommendationId || null,
      status: 'submitted',
      adminResponse: null,
      quotedAmount: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newRequest, ...requests];
    setRequests(updated);
    safeSetItem('threeseas_bi_service_requests', JSON.stringify(updated));

    // Reset form
    setForm({ title: '', description: '', budget: '', urgency: 'medium', linkedRecommendationId: '' });
    setShowForm(false);

    syncToApi(
      () => fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest),
      }),
      'createServiceRequest'
    );
  };

  // Find linked recommendation title
  const getRecTitle = (recId) => {
    if (!recId) return null;
    const rec = allRecommendations.find((r) => r.id === recId);
    return rec?.title || null;
  };

  if (!clientId) {
    return (
      <div className="portal-empty-state">
        <ClipboardList size={48} />
        <h3>Not Logged In</h3>
        <p>Please log in to manage your service requests.</p>
      </div>
    );
  }

  return (
    <div className="portal-service-requests">
      <div className="portal-sr-header">
        <div className="portal-sr-header-left">
          <h2>Service Requests</h2>
          <p className="portal-sr-subtitle">
            Submit new requests or track existing ones.
          </p>
        </div>
        <button
          className="portal-sr-new-btn"
          onClick={() => setShowForm(!showForm)}
          aria-label={showForm ? 'Cancel new request' : 'New service request'}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'New Request'}
        </button>
      </div>

      {/* New Request Form */}
      {showForm && (
        <form className="portal-sr-form" onSubmit={handleSubmit}>
          <h3 className="portal-sr-form-title">Submit a Service Request</h3>

          {formError && (
            <div className="portal-sr-form-error">
              <AlertTriangle size={14} /> {formError}
            </div>
          )}

          <div className="portal-sr-form-group">
            <label htmlFor="sr-title">Title *</label>
            <input
              id="sr-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Brief description of what you need"
              className="portal-sr-input"
              maxLength={200}
            />
          </div>

          <div className="portal-sr-form-group">
            <label htmlFor="sr-description">Description *</label>
            <textarea
              id="sr-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Provide details about your request..."
              className="portal-sr-textarea"
              rows={4}
              maxLength={2000}
            />
          </div>

          <div className="portal-sr-form-row">
            <div className="portal-sr-form-group">
              <label htmlFor="sr-budget">Budget Range</label>
              <select
                id="sr-budget"
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                className="portal-sr-select"
              >
                <option value="">Select budget range</option>
                {BUDGET_RANGES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="portal-sr-form-group">
              <label htmlFor="sr-urgency">Urgency</label>
              <select
                id="sr-urgency"
                value={form.urgency}
                onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}
                className="portal-sr-select"
              >
                {Object.entries(URGENCY_CONFIG).map(([key, conf]) => (
                  <option key={key} value={key}>{conf.label}</option>
                ))}
              </select>
            </div>
          </div>

          {activeRecs.length > 0 && (
            <div className="portal-sr-form-group">
              <label htmlFor="sr-linked-rec">Link to Recommendation (optional)</label>
              <select
                id="sr-linked-rec"
                value={form.linkedRecommendationId}
                onChange={(e) => setForm((f) => ({ ...f, linkedRecommendationId: e.target.value }))}
                className="portal-sr-select"
              >
                <option value="">None</option>
                {activeRecs.map((rec) => (
                  <option key={rec.id} value={rec.id}>{rec.title}</option>
                ))}
              </select>
            </div>
          )}

          <div className="portal-sr-form-actions">
            <button type="button" className="portal-sr-cancel-btn" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="portal-sr-submit-btn">
              <Send size={16} /> Submit Request
            </button>
          </div>
        </form>
      )}

      {/* Requests List */}
      {clientRequests.length === 0 && !showForm ? (
        <div className="portal-empty-state">
          <Inbox size={48} />
          <h3>No Service Requests</h3>
          <p>You have not submitted any service requests yet. Click "New Request" to get started.</p>
        </div>
      ) : (
        <div className="portal-sr-list">
          {clientRequests.map((req) => {
            const statusConf = STATUS_CONFIG[req.status] || STATUS_CONFIG.submitted;
            const urgencyConf = URGENCY_CONFIG[req.urgency] || URGENCY_CONFIG.medium;
            const linkedRecTitle = getRecTitle(req.linkedRecommendationId);

            return (
              <div key={req.id} className="portal-sr-card">
                <div className="portal-sr-card-header">
                  <h4 className="portal-sr-card-title">{req.title}</h4>
                  <div className="portal-sr-card-badges">
                    <span
                      className="portal-sr-badge"
                      style={{ background: statusConf.bg, color: statusConf.color }}
                    >
                      {statusConf.label}
                    </span>
                    <span
                      className="portal-sr-badge"
                      style={{ background: urgencyConf.bg, color: urgencyConf.color }}
                    >
                      {urgencyConf.label}
                    </span>
                  </div>
                </div>

                <p className="portal-sr-card-description">{req.description}</p>

                <div className="portal-sr-card-meta">
                  {req.budget && (
                    <span className="portal-sr-meta-item">
                      <DollarSign size={14} /> {req.budget}
                    </span>
                  )}
                  {linkedRecTitle && (
                    <span className="portal-sr-meta-item">
                      <Link2 size={14} /> {linkedRecTitle}
                    </span>
                  )}
                  <span className="portal-sr-meta-item">
                    <Clock size={14} />
                    {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>

                {/* Quoted amount */}
                {req.status === 'quoted' && req.quotedAmount != null && (
                  <div className="portal-sr-quoted">
                    <DollarSign size={16} />
                    <span>Quoted Amount: <strong>${Number(req.quotedAmount).toLocaleString()}</strong></span>
                  </div>
                )}

                {/* Admin response */}
                {req.adminResponse && (
                  <div className="portal-sr-admin-response">
                    <span className="portal-sr-admin-response-label">Response from Team:</span>
                    <p>{String(req.adminResponse).replace(/<[^>]*>/g, '')}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
