import { useState, useMemo } from 'react';
import {
  MessageCircle, Star, Send, Inbox, Clock,
  AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { generateId, safeGetItem, safeSetItem } from '../../constants';
import { syncToApi } from '../../api/apiSync';

// Star rating component
function StarRating({ value, onChange, readonly = false, size = 24 }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="portal-star-rating" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (readonly ? value : (hover || value));
        return (
          <button
            key={star}
            type="button"
            className={`portal-star-btn ${filled ? 'portal-star-btn-filled' : ''}`}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            disabled={readonly}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            aria-checked={star === value}
            role="radio"
          >
            <Star
              size={size}
              fill={filled ? '#f59e0b' : 'none'}
              color={filled ? '#f59e0b' : '#d1d5db'}
            />
          </button>
        );
      })}
    </div>
  );
}

// Feedback target types
const TARGET_TYPES = [
  { value: 'project', label: 'Project' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'recommendation', label: 'Recommendation' },
  { value: 'general', label: 'General' },
];

export default function Feedback() {
  const { currentClient, clients } = useAppContext();
  const clientId = currentClient?.id;

  // Feedback from localStorage
  const [feedbackList, setFeedbackList] = useState(() =>
    safeGetItem('threeseas_bi_feedback', [])
  );

  // Form state
  const [form, setForm] = useState({
    targetType: 'general',
    targetId: '',
    rating: 0,
    comment: '',
  });
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Get client record for target dropdowns
  const client = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId]
  );

  // Get recommendations from localStorage for target dropdown
  const allRecommendations = useMemo(() => {
    const raw = safeGetItem('threeseas_bi_recommendations', []);
    if (Array.isArray(raw)) return raw;
    return Object.values(raw).flat();
  }, []);
  const clientRecs = useMemo(
    () => allRecommendations.filter((r) => r.clientId === clientId),
    [allRecommendations, clientId]
  );

  // Build target options based on selected type
  const targetOptions = useMemo(() => {
    switch (form.targetType) {
      case 'project':
        return (client?.projects || []).map((p) => ({
          value: p.id,
          label: p.title,
        }));
      case 'milestone': {
        const options = [];
        (client?.projects || []).forEach((p) => {
          (p.milestones || []).forEach((m) => {
            options.push({
              value: m.id,
              label: `${p.title} - ${m.title}`,
            });
          });
        });
        return options;
      }
      case 'recommendation':
        return clientRecs.map((r) => ({
          value: r.id,
          label: r.title,
        }));
      case 'general':
      default:
        return [];
    }
  }, [form.targetType, client, clientRecs]);

  // Client-specific feedback, newest first
  const clientFeedback = useMemo(
    () => feedbackList
      .filter((f) => f.clientId === clientId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    [feedbackList, clientId]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (form.rating === 0) {
      setFormError('Please select a rating.');
      return;
    }
    if (!form.comment.trim()) {
      setFormError('Please enter a comment.');
      return;
    }
    if (form.targetType !== 'general' && !form.targetId) {
      setFormError('Please select a target.');
      return;
    }

    // Find target name for display
    let targetName = '';
    if (form.targetType !== 'general') {
      const opt = targetOptions.find((o) => o.value === form.targetId);
      targetName = opt?.label || '';
    }

    const newFeedback = {
      id: generateId(),
      clientId,
      clientName: currentClient?.name || 'Client',
      targetType: form.targetType,
      targetId: form.targetType === 'general' ? null : form.targetId,
      targetName,
      rating: form.rating,
      comment: form.comment.trim(),
      adminResponse: null,
      createdAt: new Date().toISOString(),
    };

    const updated = [newFeedback, ...feedbackList];
    setFeedbackList(updated);
    safeSetItem('threeseas_bi_feedback', JSON.stringify(updated));

    // Reset form
    setForm({ targetType: 'general', targetId: '', rating: 0, comment: '' });
    setSuccessMsg('Feedback submitted. Thank you!');
    setTimeout(() => setSuccessMsg(''), 4000);

    syncToApi(
      () => fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFeedback),
      }),
      'submitFeedback'
    );
  };

  if (!clientId) {
    return (
      <div className="portal-empty-state">
        <MessageCircle size={48} />
        <h3>Not Logged In</h3>
        <p>Please log in to submit feedback.</p>
      </div>
    );
  }

  return (
    <div className="portal-feedback">
      <div className="portal-feedback-header">
        <h2>Feedback</h2>
        <p className="portal-feedback-subtitle">
          Share your experience and help us improve our services.
        </p>
      </div>

      {/* Feedback Form */}
      <form className="portal-feedback-form" onSubmit={handleSubmit}>
        <h3 className="portal-feedback-form-title">Submit Feedback</h3>

        {formError && (
          <div className="portal-feedback-error">
            <AlertTriangle size={14} /> {formError}
          </div>
        )}
        {successMsg && (
          <div className="portal-feedback-success">
            <CheckCircle2 size={14} /> {successMsg}
          </div>
        )}

        <div className="portal-feedback-form-row">
          <div className="portal-feedback-form-group">
            <label htmlFor="fb-target-type">Feedback Type</label>
            <select
              id="fb-target-type"
              value={form.targetType}
              onChange={(e) => setForm((f) => ({ ...f, targetType: e.target.value, targetId: '' }))}
              className="portal-feedback-select"
            >
              {TARGET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {form.targetType !== 'general' && (
            <div className="portal-feedback-form-group">
              <label htmlFor="fb-target">Target</label>
              <select
                id="fb-target"
                value={form.targetId}
                onChange={(e) => setForm((f) => ({ ...f, targetId: e.target.value }))}
                className="portal-feedback-select"
              >
                <option value="">Select...</option>
                {targetOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="portal-feedback-form-group">
          <label>Rating</label>
          <StarRating
            value={form.rating}
            onChange={(val) => setForm((f) => ({ ...f, rating: val }))}
            size={28}
          />
        </div>

        <div className="portal-feedback-form-group">
          <label htmlFor="fb-comment">Comment *</label>
          <textarea
            id="fb-comment"
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            placeholder="Tell us about your experience..."
            className="portal-feedback-textarea"
            rows={4}
            maxLength={2000}
          />
        </div>

        <div className="portal-feedback-form-actions">
          <button type="submit" className="portal-feedback-submit-btn">
            <Send size={16} /> Submit Feedback
          </button>
        </div>
      </form>

      {/* Previous Feedback */}
      <div className="portal-feedback-history">
        <h3 className="portal-section-title">
          <MessageCircle size={18} /> Previous Feedback
        </h3>

        {clientFeedback.length === 0 ? (
          <div className="portal-empty-state portal-empty-state-sm">
            <Inbox size={32} />
            <p>No feedback submitted yet.</p>
          </div>
        ) : (
          <div className="portal-feedback-list">
            {clientFeedback.map((fb) => (
              <div key={fb.id} className="portal-feedback-card">
                <div className="portal-feedback-card-header">
                  <div className="portal-feedback-card-meta">
                    <span className="portal-feedback-type-badge">
                      {fb.targetType === 'general' ? 'General' : fb.targetType}
                    </span>
                    {fb.targetName && (
                      <span className="portal-feedback-target-name">{fb.targetName}</span>
                    )}
                  </div>
                  <span className="portal-feedback-date">
                    <Clock size={12} />
                    {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>

                <StarRating value={fb.rating} readonly size={18} />

                <p className="portal-feedback-comment">{String(fb.comment || '').replace(/<[^>]*>/g, '')}</p>

                {fb.adminResponse && (
                  <div className="portal-feedback-admin-response">
                    <span className="portal-feedback-admin-response-label">
                      <CheckCircle2 size={12} /> Response from Team:
                    </span>
                    <p>{String(fb.adminResponse).replace(/<[^>]*>/g, '')}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
