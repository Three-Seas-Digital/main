import { useState, useMemo } from 'react';
import {
  Lightbulb, CheckCircle2, XCircle, Clock, Send,
  ArrowRight, Inbox, MessageSquare, DollarSign,
  Calendar, ChevronDown, ChevronRight, Zap,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { generateId, safeGetItem, safeSetItem } from '../../constants';
import { syncToApi } from '../../api/apiSync';
import { recommendationsApi } from '../../api/recommendations';

// Status configs
const STATUS_CONFIG = {
  proposed:    { label: 'Proposed',    color: '#f59e0b', bg: '#f59e0b22', icon: Lightbulb },
  accepted:    { label: 'Accepted',    color: '#3b82f6', bg: '#3b82f622', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', color: '#8b5cf6', bg: '#8b5cf622', icon: Clock },
  completed:   { label: 'Completed',   color: '#22c55e', bg: '#22c55e22', icon: CheckCircle2 },
  declined:    { label: 'Declined',    color: '#6b7280', bg: '#6b728022', icon: XCircle },
};

const PRIORITY_CONFIG = {
  high:   { label: 'High',   color: '#ef4444', bg: '#ef444422' },
  medium: { label: 'Medium', color: '#f59e0b', bg: '#f59e0b22' },
  low:    { label: 'Low',    color: '#22c55e', bg: '#22c55e22' },
};

const IMPACT_CONFIG = {
  high:   { label: 'High Impact',   color: '#8b5cf6', bg: '#8b5cf622' },
  medium: { label: 'Med Impact',    color: '#3b82f6', bg: '#3b82f622' },
  low:    { label: 'Low Impact',    color: '#6b7280', bg: '#6b728022' },
};

// Status workflow visualization
function StatusWorkflow({ currentStatus }) {
  const steps = ['proposed', 'accepted', 'in_progress', 'completed'];
  const currentIdx = steps.indexOf(currentStatus);

  return (
    <div className="portal-rec-workflow">
      {steps.map((step, i) => {
        const conf = STATUS_CONFIG[step];
        const isActive = i <= currentIdx;
        const isCurrent = step === currentStatus;
        return (
          <div key={step} className="portal-rec-workflow-step">
            {i > 0 && (
              <div
                className="portal-rec-workflow-line"
                style={{ background: isActive ? conf.color : '#e5e7eb' }}
              />
            )}
            <div
              className={`portal-rec-workflow-dot ${isCurrent ? 'portal-rec-workflow-dot-current' : ''}`}
              style={{
                background: isActive ? conf.color : '#e5e7eb',
                borderColor: isCurrent ? conf.color : 'transparent',
              }}
            />
            <span
              className="portal-rec-workflow-label"
              style={{ color: isActive ? conf.color : '#9ca3af' }}
            >
              {conf.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Recommendations() {
  const { currentClient } = useAppContext();
  const clientId = currentClient?.id;

  // BI data from localStorage
  const [recommendations, setRecommendations] = useState(() => {
    const raw = safeGetItem('threeseas_bi_recommendations', []);
    if (Array.isArray(raw)) return raw;
    return Object.values(raw).flat();
  });
  const [threads, setThreads] = useState(() =>
    safeGetItem('threeseas_bi_recommendation_threads', [])
  );

  const [activeTab, setActiveTab] = useState('active');
  const [expandedRec, setExpandedRec] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  // Client-specific recommendations
  const clientRecs = useMemo(
    () => recommendations.filter((r) => r.clientId === clientId),
    [recommendations, clientId]
  );

  const filteredRecs = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return clientRecs.filter((r) =>
          ['proposed', 'accepted', 'in_progress'].includes(r.status)
        );
      case 'completed':
        return clientRecs.filter((r) => r.status === 'completed');
      case 'declined':
        return clientRecs.filter((r) => r.status === 'declined');
      default:
        return clientRecs;
    }
  }, [clientRecs, activeTab]);

  const tabCounts = useMemo(() => ({
    active: clientRecs.filter((r) =>
      ['proposed', 'accepted', 'in_progress'].includes(r.status)
    ).length,
    completed: clientRecs.filter((r) => r.status === 'completed').length,
    declined: clientRecs.filter((r) => r.status === 'declined').length,
  }), [clientRecs]);

  // Get threads for a recommendation
  const getThreadMessages = (recId) => {
    return threads
      .filter((t) => t.recommendationId === recId)
      .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  };

  // Update recommendation status (preserves admin's { auditId: [recs] } format on save)
  const updateRecStatus = (recId, newStatus) => {
    const updated = recommendations.map((r) =>
      r.id === recId ? { ...r, status: newStatus, statusUpdatedAt: new Date().toISOString() } : r
    );
    setRecommendations(updated);
    // Preserve object format: read raw, update matching rec in-place
    const raw = safeGetItem('threeseas_bi_recommendations', {});
    if (!Array.isArray(raw) && typeof raw === 'object') {
      for (const key of Object.keys(raw)) {
        raw[key] = (raw[key] || []).map((r) =>
          r.id === recId ? { ...r, status: newStatus, statusUpdatedAt: new Date().toISOString() } : r
        );
      }
      safeSetItem('threeseas_bi_recommendations', JSON.stringify(raw));
    } else {
      safeSetItem('threeseas_bi_recommendations', JSON.stringify(updated));
    }
    syncToApi(
      () => recommendationsApi.updateStatus(recId, newStatus),
      'updateRecStatus'
    );
  };

  // Add thread message
  const handleSendMessage = (recId) => {
    if (!newMessage.trim()) return;

    const message = {
      id: generateId(),
      recommendationId: recId,
      clientId,
      author: currentClient?.name || 'Client',
      authorType: 'client',
      text: newMessage.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedThreads = [...threads, message];
    setThreads(updatedThreads);
    safeSetItem('threeseas_bi_recommendation_threads', JSON.stringify(updatedThreads));
    setNewMessage('');

    syncToApi(
      () => recommendationsApi.addThread(recId, message),
      'addThreadMessage'
    );
  };

  const toggleExpanded = (recId) => {
    setExpandedRec((prev) => (prev === recId ? null : recId));
    setNewMessage('');
  };

  if (!clientId) {
    return (
      <div className="portal-empty-state">
        <Lightbulb size={48} />
        <h3>Not Logged In</h3>
        <p>Please log in to view your recommendations.</p>
      </div>
    );
  }

  return (
    <div className="portal-recommendations">
      <div className="portal-rec-header">
        <h2>Recommendations</h2>
        <p className="portal-rec-subtitle">
          Review and manage improvement recommendations from your consultant.
        </p>
      </div>

      {/* Tab Filters */}
      <div className="portal-rec-tabs">
        {[
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'declined', label: 'Declined' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`portal-rec-tab ${activeTab === tab.key ? 'portal-rec-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="portal-rec-tab-count">{tabCounts[tab.key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Recommendations List */}
      {filteredRecs.length === 0 ? (
        <div className="portal-empty-state">
          <Inbox size={48} />
          <h3>No {activeTab === 'active' ? 'Active' : activeTab === 'completed' ? 'Completed' : 'Declined'} Recommendations</h3>
          <p>
            {activeTab === 'active'
              ? 'No active recommendations at this time. Check back after your next audit.'
              : `No ${activeTab} recommendations found.`}
          </p>
        </div>
      ) : (
        <div className="portal-rec-list">
          {filteredRecs.map((rec) => {
            const statusConf = STATUS_CONFIG[rec.status] || STATUS_CONFIG.proposed;
            const priorityConf = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.medium;
            const impactConf = IMPACT_CONFIG[rec.impact] || IMPACT_CONFIG.medium;
            const isExpanded = expandedRec === rec.id;
            const recThreads = getThreadMessages(rec.id);

            return (
              <div key={rec.id} className="portal-rec-card">
                <div className="portal-rec-card-header">
                  <div className="portal-rec-card-title-row">
                    <h4 className="portal-rec-card-title">{rec.title}</h4>
                    <div className="portal-rec-badges">
                      {rec.category && (
                        <span className="portal-rec-badge portal-rec-badge-category">
                          {rec.category}
                        </span>
                      )}
                      <span
                        className="portal-rec-badge"
                        style={{ background: priorityConf.bg, color: priorityConf.color }}
                      >
                        {priorityConf.label}
                      </span>
                      <span
                        className="portal-rec-badge"
                        style={{ background: impactConf.bg, color: impactConf.color }}
                      >
                        <Zap size={12} /> {impactConf.label}
                      </span>
                      <span
                        className="portal-rec-badge"
                        style={{ background: statusConf.bg, color: statusConf.color }}
                      >
                        {statusConf.label}
                      </span>
                    </div>
                  </div>

                  <div className="portal-rec-meta">
                    {rec.costRange && (
                      <span className="portal-rec-meta-item">
                        <DollarSign size={14} /> {rec.costRange}
                      </span>
                    )}
                    {rec.timeline && (
                      <span className="portal-rec-meta-item">
                        <Calendar size={14} /> {rec.timeline}
                      </span>
                    )}
                  </div>

                  {rec.description && (
                    <p className="portal-rec-description">{rec.description}</p>
                  )}

                  {/* Status workflow */}
                  {rec.status !== 'declined' && (
                    <StatusWorkflow currentStatus={rec.status} />
                  )}

                  {/* Action buttons for proposed recommendations */}
                  {rec.status === 'proposed' && (
                    <div className="portal-rec-actions">
                      <button
                        className="portal-rec-accept-btn"
                        onClick={() => updateRecStatus(rec.id, 'accepted')}
                        aria-label={`Accept recommendation: ${rec.title}`}
                      >
                        <CheckCircle2 size={16} /> Accept
                      </button>
                      <button
                        className="portal-rec-decline-btn"
                        onClick={() => updateRecStatus(rec.id, 'declined')}
                        aria-label={`Decline recommendation: ${rec.title}`}
                      >
                        <XCircle size={16} /> Decline
                      </button>
                    </div>
                  )}
                </div>

                {/* Q&A Thread Toggle */}
                <button
                  className="portal-rec-thread-toggle"
                  onClick={() => toggleExpanded(rec.id)}
                  aria-expanded={isExpanded}
                  aria-label={`Toggle discussion for ${rec.title}`}
                >
                  <MessageSquare size={16} />
                  <span>Discussion ({recThreads.length})</span>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {/* Expanded thread */}
                {isExpanded && (
                  <div className="portal-rec-thread">
                    {recThreads.length === 0 ? (
                      <p className="portal-rec-thread-empty">No messages yet. Start the conversation.</p>
                    ) : (
                      <div className="portal-rec-thread-messages">
                        {recThreads.map((msg) => (
                          <div
                            key={msg.id}
                            className={`portal-rec-thread-msg ${msg.authorType === 'client' ? 'portal-rec-thread-msg-client' : 'portal-rec-thread-msg-admin'}`}
                          >
                            <div className="portal-rec-thread-msg-header">
                              <span className="portal-rec-thread-msg-author">{String(msg.author || '').replace(/<[^>]*>/g, '')}</span>
                              <span className="portal-rec-thread-msg-date">
                                {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ''}
                              </span>
                            </div>
                            <p className="portal-rec-thread-msg-text">{String(msg.text || '').replace(/<[^>]*>/g, '')}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="portal-rec-thread-input">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="portal-rec-thread-input-field"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(rec.id);
                          }
                        }}
                      />
                      <button
                        className="portal-rec-thread-send-btn"
                        onClick={() => handleSendMessage(rec.id)}
                        disabled={!newMessage.trim()}
                        aria-label="Send message"
                      >
                        <Send size={16} />
                      </button>
                    </div>
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
