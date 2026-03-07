import { useState, useMemo } from 'react';
import {
  Activity, BarChart3, FileText, Lightbulb, ClipboardList,
  ArrowRight, TrendingUp, Clock, CheckCircle2, AlertCircle,
  Inbox,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { safeGetItem, escapeHtml } from '../../constants';

// Color helpers for score gauge
function scoreColor(score) {
  if (score >= 9) return '#10b981';
  if (score >= 7) return '#22c55e';
  if (score >= 4) return '#f59e0b';
  return '#ef4444';
}

function scoreLabel(score) {
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 4) return 'Fair';
  return 'Needs Work';
}

// Circular gauge component — shows "No Audit" when score is 0
function ScoreGauge({ score, size = 120, hasAudit = true }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / 10, 1);
  const offset = circumference * (1 - pct);
  const color = hasAudit ? scoreColor(score) : '#d1d5db';

  return (
    <svg width={size} height={size} className="portal-gauge">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="8"
      />
      {hasAudit && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      )}
      <text
        x={size / 2}
        y={hasAudit ? size / 2 - 6 : size / 2 - 4}
        textAnchor="middle"
        dominantBaseline="central"
        className="portal-gauge-score"
        style={{ fontSize: hasAudit ? size * 0.28 : size * 0.14, fontWeight: 700, fill: color }}
      >
        {hasAudit ? score.toFixed(1) : 'Pending'}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 16}
        textAnchor="middle"
        dominantBaseline="central"
        className="portal-gauge-label"
        style={{ fontSize: size * 0.11, fill: '#6b7280' }}
      >
        {hasAudit ? scoreLabel(score) : 'No audit yet'}
      </text>
    </svg>
  );
}

// Safe text renderer — strips HTML tags from user content
function safeText(text) {
  if (!text) return '';
  return String(text).replace(/<[^>]*>/g, '');
}

export default function Dashboard({ onNavigate }) {
  const { currentClient, clients, projects: _p } = useAppContext();
  const clientId = currentClient?.id;

  // BI data from localStorage
  const audits = useMemo(() => safeGetItem('threeseas_bi_audits', []), []);
  const auditScores = useMemo(() => safeGetItem('threeseas_bi_audit_scores', []), []);
  const recommendations = useMemo(() => {
    const raw = safeGetItem('threeseas_bi_recommendations', []);
    if (Array.isArray(raw)) return raw;
    return Object.values(raw).flat();
  }, []);

  // Derive client-specific data
  const clientAudits = useMemo(
    () => audits.filter((a) => a.clientId === clientId),
    [audits, clientId]
  );
  const latestAudit = clientAudits.length > 0
    ? clientAudits.reduce((latest, a) => (a.createdAt > latest.createdAt ? a : latest), clientAudits[0])
    : null;

  const latestScores = useMemo(() => {
    if (!latestAudit) return [];
    return auditScores.filter((s) => s.auditId === latestAudit.id);
  }, [auditScores, latestAudit]);

  const overallScore = useMemo(() => {
    if (latestScores.length === 0) return 0;
    const totalWeight = latestScores.reduce((sum, s) => sum + (s.weight || 1), 0);
    const weightedSum = latestScores.reduce((sum, s) => sum + (s.score || 0) * (s.weight || 1), 0);
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }, [latestScores]);

  const hasAudit = latestAudit !== null && latestScores.length > 0;

  const clientRecs = useMemo(
    () => recommendations.filter((r) => r.clientId === clientId),
    [recommendations, clientId]
  );
  const activeRecs = clientRecs.filter((r) =>
    ['proposed', 'accepted', 'in_progress'].includes(r.status)
  );

  // Client record from context for projects/invoices
  const client = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId]
  );
  const activeProjects = (client?.projects || []).filter(
    (p) => p.status !== 'archived' && p.status !== 'completed'
  );
  const openInvoices = (client?.invoices || []).filter((i) => i.status !== 'paid');

  // Build activity feed from various sources
  const activityFeed = useMemo(() => {
    const items = [];

    // Audit publications
    clientAudits
      .filter((a) => a.publishedAt)
      .forEach((a) => {
        items.push({
          id: `audit-${a.id}`,
          type: 'audit',
          text: `Audit "${safeText(a.title || 'Business Audit')}" published`,
          date: a.publishedAt,
        });
      });

    // Recommendations added
    clientRecs.forEach((r) => {
      items.push({
        id: `rec-${r.id}`,
        type: 'recommendation',
        text: `Recommendation: ${safeText(r.title)}`,
        date: r.createdAt,
      });
    });

    // Projects updated
    (client?.projects || []).forEach((p) => {
      if (p.completedAt) {
        items.push({
          id: `proj-done-${p.id}`,
          type: 'project',
          text: `Project "${safeText(p.title)}" completed`,
          date: p.completedAt,
        });
      }
    });

    // Sort by date descending
    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return items.slice(0, 10);
  }, [clientAudits, clientRecs, client]);

  const activityIcon = (type) => {
    switch (type) {
      case 'audit': return <ClipboardList size={16} />;
      case 'recommendation': return <Lightbulb size={16} />;
      case 'project': return <CheckCircle2 size={16} />;
      default: return <Activity size={16} />;
    }
  };

  if (!clientId) {
    return (
      <div className="portal-empty-state">
        <AlertCircle size={48} />
        <h3>Not Logged In</h3>
        <p>Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="portal-dashboard">
      <div className="portal-dashboard-header">
        <h2>Welcome back{client?.name ? `, ${safeText(client.name)}` : ''}</h2>
        <p className="portal-dashboard-subtitle">
          Here is an overview of your digital presence and active engagements.
        </p>
      </div>

      {/* Score Gauge + KPI Row */}
      <div className="portal-dashboard-top">
        <div className="portal-dashboard-gauge-card">
          <ScoreGauge score={overallScore} size={140} hasAudit={hasAudit} />
          <span className="portal-gauge-caption">
            {hasAudit ? 'Overall Health Score' : 'Awaiting First Audit'}
          </span>
        </div>

        <div className="portal-kpi-row">
          <div className="portal-kpi-card">
            <div className="portal-kpi-icon" style={{ background: (hasAudit ? scoreColor(overallScore) : '#6b7280') + '1a', color: hasAudit ? scoreColor(overallScore) : '#6b7280' }}>
              <BarChart3 size={20} />
            </div>
            <div className="portal-kpi-info">
              <span className="portal-kpi-value">{hasAudit ? overallScore.toFixed(1) : '—'}</span>
              <span className="portal-kpi-label">Health Score</span>
            </div>
          </div>

          <div className="portal-kpi-card">
            <div className="portal-kpi-icon" style={{ background: '#3b82f61a', color: '#3b82f6' }}>
              <FileText size={20} />
            </div>
            <div className="portal-kpi-info">
              <span className="portal-kpi-value">{activeProjects.length}</span>
              <span className="portal-kpi-label">Active Projects</span>
            </div>
          </div>

          <div className="portal-kpi-card">
            <div className="portal-kpi-icon" style={{ background: '#f59e0b1a', color: '#f59e0b' }}>
              <Clock size={20} />
            </div>
            <div className="portal-kpi-info">
              <span className="portal-kpi-value">{openInvoices.length}</span>
              <span className="portal-kpi-label">Open Invoices</span>
            </div>
          </div>

          <div className="portal-kpi-card">
            <div className="portal-kpi-icon" style={{ background: '#8b5cf61a', color: '#8b5cf6' }}>
              <Lightbulb size={20} />
            </div>
            <div className="portal-kpi-info">
              <span className="portal-kpi-value">{activeRecs.length}</span>
              <span className="portal-kpi-label">Recommendations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed + Quick Actions */}
      <div className="portal-dashboard-bottom">
        <div className="portal-activity-feed">
          <h3 className="portal-section-title">
            <Activity size={18} /> Recent Activity
          </h3>
          {activityFeed.length === 0 ? (
            <div className="portal-empty-state portal-empty-state-sm">
              <Inbox size={32} />
              <p>No recent activity yet.</p>
              <span>Activity will appear here as your engagement progresses.</span>
            </div>
          ) : (
            <ul className="portal-activity-list">
              {activityFeed.map((item) => (
                <li key={item.id} className="portal-activity-item">
                  <span className={`portal-activity-icon portal-activity-icon-${item.type}`}>
                    {activityIcon(item.type)}
                  </span>
                  <span className="portal-activity-text">{item.text}</span>
                  <span className="portal-activity-date">
                    {item.date ? new Date(item.date).toLocaleDateString() : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="portal-quick-actions">
          <h3 className="portal-section-title">
            <TrendingUp size={18} /> Quick Actions
          </h3>
          <div className="portal-quick-actions-list">
            <button
              className="portal-quick-action-btn"
              onClick={() => onNavigate?.('scorecard')}
              aria-label="View Scorecard"
            >
              <BarChart3 size={18} />
              <span>View Scorecard</span>
              <ArrowRight size={16} className="portal-qa-arrow" />
            </button>
            <button
              className="portal-quick-action-btn"
              onClick={() => onNavigate?.('recommendations')}
              aria-label="View Recommendations"
            >
              <Lightbulb size={18} />
              <span>Recommendations</span>
              <ArrowRight size={16} className="portal-qa-arrow" />
            </button>
            <button
              className="portal-quick-action-btn"
              onClick={() => onNavigate?.('service-requests')}
              aria-label="Submit Service Request"
            >
              <ClipboardList size={18} />
              <span>New Service Request</span>
              <ArrowRight size={16} className="portal-qa-arrow" />
            </button>
            <button
              className="portal-quick-action-btn"
              onClick={() => onNavigate?.('projects')}
              aria-label="View Projects"
            >
              <FileText size={18} />
              <span>View Projects</span>
              <ArrowRight size={16} className="portal-qa-arrow" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
