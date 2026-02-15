import { useState, useMemo } from 'react';
import {
  ChevronDown, ChevronRight, BarChart3, Inbox, TrendingUp,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { safeGetItem } from '../../constants';

// Color helpers
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

// Circular gauge
function ScoreGauge({ score, size = 160 }) {
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / 10, 1);
  const offset = circumference * (1 - pct);
  const color = scoreColor(score);

  return (
    <svg width={size} height={size} className="portal-gauge">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="10"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x={size / 2}
        y={size / 2 - 8}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: size * 0.26, fontWeight: 700, fill: color }}
      >
        {score.toFixed(1)}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 18}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: size * 0.1, fill: '#6b7280' }}
      >
        {scoreLabel(score)}
      </text>
    </svg>
  );
}

// Score bar component
function ScoreBar({ score, maxScore = 10 }) {
  const pct = Math.min((score / maxScore) * 100, 100);
  const color = scoreColor(score);
  return (
    <div className="portal-score-bar-container">
      <div className="portal-score-bar-track">
        <div
          className="portal-score-bar-fill"
          style={{ width: `${pct}%`, background: color, transition: 'width 0.4s ease' }}
        />
      </div>
      <span className="portal-score-bar-value" style={{ color }}>{score.toFixed(1)}</span>
    </div>
  );
}

// Simple SVG line chart for score history
function ScoreHistoryChart({ history }) {
  if (!history || history.length < 2) {
    return (
      <div className="portal-empty-state portal-empty-state-sm">
        <TrendingUp size={24} />
        <p>Not enough data for history chart. At least 2 audits needed.</p>
      </div>
    );
  }

  const width = 400;
  const height = 160;
  const padding = { top: 20, right: 30, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxScore = 10;
  const minScore = 0;
  const xStep = history.length > 1 ? chartW / (history.length - 1) : chartW;

  const points = history.map((item, i) => {
    const x = padding.left + i * xStep;
    const y = padding.top + chartH - ((item.score - minScore) / (maxScore - minScore)) * chartH;
    return { x, y, score: item.score, label: item.label || `v${i + 1}` };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="portal-history-chart" preserveAspectRatio="xMidYMid meet">
      {/* Y-axis labels */}
      {[0, 2, 4, 6, 8, 10].map((v) => {
        const y = padding.top + chartH - (v / maxScore) * chartH;
        return (
          <g key={v}>
            <line x1={padding.left} y1={y} x2={padding.left + chartW} y2={y} stroke="#e5e7eb" strokeWidth="1" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{v}</text>
          </g>
        );
      })}

      {/* Line */}
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Points and X-axis labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
          <text x={p.x} y={height - 6} textAnchor="middle" fontSize="9" fill="#6b7280">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function Scorecard() {
  const { currentClient } = useAppContext();
  const clientId = currentClient?.id;

  // BI data from localStorage
  const categories = useMemo(() => safeGetItem('threeseas_bi_categories', []), []);
  const audits = useMemo(() => safeGetItem('threeseas_bi_audits', []), []);
  const auditScores = useMemo(() => safeGetItem('threeseas_bi_audit_scores', []), []);

  const [expandedCategories, setExpandedCategories] = useState({});

  // Client audits sorted by date
  const clientAudits = useMemo(() => {
    return audits
      .filter((a) => a.clientId === clientId)
      .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  }, [audits, clientId]);

  const latestAudit = clientAudits.length > 0 ? clientAudits[clientAudits.length - 1] : null;

  // Scores for the latest audit, keyed by categoryId
  const latestScoresMap = useMemo(() => {
    if (!latestAudit) return {};
    const scores = auditScores.filter((s) => s.auditId === latestAudit.id);
    const map = {};
    scores.forEach((s) => { map[s.categoryId] = s; });
    return map;
  }, [auditScores, latestAudit]);

  // Overall weighted score
  const overallScore = useMemo(() => {
    const scores = Object.values(latestScoresMap);
    if (scores.length === 0) return 0;
    const totalWeight = scores.reduce((sum, s) => sum + (s.weight || 1), 0);
    const weightedSum = scores.reduce((sum, s) => sum + (s.score || 0) * (s.weight || 1), 0);
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }, [latestScoresMap]);

  // Score history across audit versions
  const scoreHistory = useMemo(() => {
    return clientAudits.map((audit, idx) => {
      const scores = auditScores.filter((s) => s.auditId === audit.id);
      const totalWeight = scores.reduce((sum, s) => sum + (s.weight || 1), 0);
      const weightedSum = scores.reduce((sum, s) => sum + (s.score || 0) * (s.weight || 1), 0);
      const avgScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
      return {
        score: avgScore,
        label: audit.title || `Audit ${idx + 1}`,
        date: audit.createdAt,
      };
    });
  }, [clientAudits, auditScores]);

  const toggleCategory = (catId) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Default 6 categories if none exist in localStorage
  const displayCategories = useMemo(() => {
    if (categories.length > 0) return categories;
    return [
      { id: 'web-presence', name: 'Web Presence', weight: 20, subcriteria: [] },
      { id: 'seo', name: 'SEO', weight: 20, subcriteria: [] },
      { id: 'social-media', name: 'Social Media', weight: 15, subcriteria: [] },
      { id: 'branding', name: 'Branding', weight: 15, subcriteria: [] },
      { id: 'operations', name: 'Operations', weight: 15, subcriteria: [] },
      { id: 'ai-readiness', name: 'AI Readiness', weight: 15, subcriteria: [] },
    ];
  }, [categories]);

  if (!clientId) {
    return (
      <div className="portal-empty-state">
        <BarChart3 size={48} />
        <h3>Not Logged In</h3>
        <p>Please log in to view your scorecard.</p>
      </div>
    );
  }

  if (!latestAudit) {
    return (
      <div className="portal-empty-state">
        <Inbox size={48} />
        <h3>No Audit Available</h3>
        <p>Your business audit has not been published yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="portal-scorecard">
      <div className="portal-scorecard-header">
        <h2>Business Scorecard</h2>
        {latestAudit.title && (
          <span className="portal-scorecard-audit-title">{latestAudit.title}</span>
        )}
        {latestAudit.createdAt && (
          <span className="portal-scorecard-date">
            Last updated: {new Date(latestAudit.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Overall score gauge */}
      <div className="portal-scorecard-overview">
        <div className="portal-scorecard-gauge-wrapper">
          <ScoreGauge score={overallScore} size={180} />
        </div>
      </div>

      {/* Category breakdown */}
      <div className="portal-scorecard-categories">
        <h3 className="portal-section-title">Category Breakdown</h3>
        {displayCategories.map((cat) => {
          const scoreData = latestScoresMap[cat.id];
          const catScore = scoreData?.score || 0;
          const catWeight = scoreData?.weight || cat.weight || 0;
          const isExpanded = expandedCategories[cat.id] || false;
          const subcriteria = scoreData?.subcriteria || cat.subcriteria || [];

          return (
            <div key={cat.id} className="portal-scorecard-category">
              <button
                className="portal-scorecard-category-header"
                onClick={() => toggleCategory(cat.id)}
                aria-expanded={isExpanded}
                aria-label={`Toggle ${cat.name} details`}
              >
                <span className="portal-scorecard-category-toggle">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
                <span className="portal-scorecard-category-name">{cat.name}</span>
                <span className="portal-scorecard-category-weight">{catWeight}%</span>
                <ScoreBar score={catScore} />
              </button>

              {isExpanded && (
                <div className="portal-scorecard-subcriteria">
                  {subcriteria.length === 0 ? (
                    <p className="portal-scorecard-no-sub">No subcriteria defined.</p>
                  ) : (
                    subcriteria.map((sub) => (
                      <div key={sub.id || sub.name} className="portal-scorecard-sub-row">
                        <span className="portal-scorecard-sub-name">{sub.name}</span>
                        <ScoreBar score={sub.score || 0} />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Score History Chart */}
      <div className="portal-scorecard-history">
        <h3 className="portal-section-title">
          <TrendingUp size={18} /> Score History
        </h3>
        <div className="portal-scorecard-history-chart">
          <ScoreHistoryChart history={scoreHistory} />
        </div>
      </div>
    </div>
  );
}
