import React, { useState, useMemo } from 'react';
import {
  Globe, Search, Share2, Megaphone, Palette, FileText, Wrench, Box,
  TrendingUp, TrendingDown, DollarSign, Clock, BarChart3,
  Inbox, CheckCircle2, ArrowUpDown, ChevronDown, ChevronUp,
  Crosshair, Calendar,
} from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useAppContext } from '../../context/AppContext';
import { safeGetItem } from '../../constants';

const INTERVENTIONS_KEY = 'threeseas_bi_interventions';

const INTERVENTION_TYPES = {
  website:     { label: 'Website',     icon: Globe,     color: '#3b82f6' },
  seo:         { label: 'SEO',         icon: Search,    color: '#22c55e' },
  social:      { label: 'Social',      icon: Share2,    color: '#8b5cf6' },
  advertising: { label: 'Advertising', icon: Megaphone, color: '#f97316' },
  branding:    { label: 'Branding',    icon: Palette,   color: '#ec4899' },
  content:     { label: 'Content',     icon: FileText,  color: '#14b8a6' },
  technical:   { label: 'Technical',   icon: Wrench,    color: '#6366f1' },
  other:       { label: 'Other',       icon: Box,       color: '#6b7280' },
};

const STATUS_CONFIG = {
  planned:     { label: 'Planned',     color: '#6b7280', bg: '#6b728022' },
  in_progress: { label: 'In Progress', color: '#3b82f6', bg: '#3b82f622' },
  completed:   { label: 'Completed',   color: '#22c55e', bg: '#22c55e22' },
  paused:      { label: 'Paused',      color: '#f59e0b', bg: '#f59e0b22' },
};

const STANDARD_METRICS = [
  { key: 'websiteTraffic', label: 'Website Traffic', unit: '/mo', invert: false },
  { key: 'conversionRate', label: 'Conversion Rate', unit: '%', invert: false },
  { key: 'revenue', label: 'Revenue', unit: '$', invert: false },
  { key: 'socialFollowers', label: 'Social Followers', unit: '', invert: false },
  { key: 'seoScore', label: 'SEO Score', unit: '/100', invert: false },
  { key: 'pageSpeed', label: 'Page Speed', unit: '/100', invert: false },
  { key: 'bounceRate', label: 'Bounce Rate', unit: '%', invert: true },
];

function calcDelta(before: any, after: any): number {
  const b = parseFloat(before) || 0;
  const a = parseFloat(after) || 0;
  if (b === 0) return a !== 0 ? 100 : 0;
  return ((a - b) / Math.abs(b)) * 100;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ===== TypeBadge (module scope, avoids re-mount) ===== */
function TypeBadge({ type }: { type: string }) {
  const cfg = INTERVENTION_TYPES[type] || INTERVENTION_TYPES.other;
  const Icon = cfg.icon;
  return (
    <span className="pi-type-badge" style={{ background: cfg.color + '1a', color: cfg.color }}>
      <Icon size={13} /> {cfg.label}
    </span>
  );
}

/* ===== StatusBadge ===== */
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.planned;
  return (
    <span className="pi-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

/* ===== MetricComparison ===== */
function MetricComparison({ item }: { item: any }) {
  const metrics = STANDARD_METRICS.filter(
    (m) => (item.beforeMetrics?.[m.key] || 0) > 0 || (item.afterMetrics?.[m.key] || 0) > 0
  );
  if (metrics.length === 0) return null;

  return (
    <div className="pi-metrics-grid">
      {metrics.map((m) => {
        const before = item.beforeMetrics?.[m.key] || 0;
        const after = item.afterMetrics?.[m.key] || 0;
        const delta = calcDelta(before, after);
        const improved = m.invert ? delta < 0 : delta > 0;
        return (
          <div key={m.key} className="pi-metric-row">
            <span className="pi-metric-label">{m.label}</span>
            <div className="pi-metric-values">
              <span className="pi-metric-before">{before.toLocaleString()}{m.unit}</span>
              <TrendingUp size={12} className="pi-metric-arrow" />
              <span className="pi-metric-after">{after.toLocaleString()}{m.unit}</span>
            </div>
            <span
              className="pi-metric-delta"
              style={{ color: improved ? '#22c55e' : delta !== 0 ? '#ef4444' : '#6b7280' }}
            >
              {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
              {delta !== 0 && (
                improved
                  ? <TrendingUp size={11} style={{ marginLeft: 2 }} />
                  : <TrendingDown size={11} style={{ marginLeft: 2 }} />
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ===== MAIN COMPONENT ===== */
export default function Interventions() {
  const { currentClient } = useAppContext();
  const clientId = currentClient?.id;

  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Load interventions for this client from localStorage */
  const interventions = useMemo(() => {
    if (!clientId) return [];
    const all = safeGetItem(INTERVENTIONS_KEY, {});
    return all[clientId]?.interventions || [];
  }, [clientId]);

  /* Filter by tab */
  const filtered = useMemo(() => {
    let list = [...interventions];
    if (activeTab === 'completed') list = list.filter((i) => i.status === 'completed');
    if (activeTab === 'in-progress') list = list.filter((i) => i.status === 'in_progress');

    list.sort((a, b) => {
      if (sortBy === 'roi') {
        const roiA = a.cost > 0
          ? (((a.afterMetrics?.revenue || 0) - (a.beforeMetrics?.revenue || 0) - a.cost) / a.cost) * 100
          : 0;
        const roiB = b.cost > 0
          ? (((b.afterMetrics?.revenue || 0) - (b.beforeMetrics?.revenue || 0) - b.cost) / b.cost) * 100
          : 0;
        return roiB - roiA;
      }
      if (sortBy === 'cost') return (b.cost || 0) - (a.cost || 0);
      return new Date(b.startDate || b.createdAt).getTime() - new Date(a.startDate || a.createdAt).getTime();
    });
    return list;
  }, [interventions, activeTab, sortBy]);

  /* Stats */
  const stats = useMemo(() => {
    const completed = interventions.filter((i) => i.status === 'completed');
    const rois = completed
      .map((i) => {
        const revChange = (i.afterMetrics?.revenue || 0) - (i.beforeMetrics?.revenue || 0);
        return i.cost > 0 ? ((revChange - i.cost) / i.cost) * 100 : 0;
      })
      .filter((r) => r !== 0);

    return {
      total: interventions.length,
      completed: completed.length,
      inProgress: interventions.filter((i) => i.status === 'in_progress').length,
      avgRoi: rois.length ? (rois.reduce((a, b) => a + b, 0) / rois.length).toFixed(1) : '--',
      totalInvestment: interventions.reduce((s, i) => s + (i.cost || 0), 0),
    };
  }, [interventions]);

  /* Tab counts */
  const tabCounts = useMemo(() => ({
    all: interventions.length,
    completed: interventions.filter((i) => i.status === 'completed').length,
    'in-progress': interventions.filter((i) => i.status === 'in_progress').length,
  }), [interventions]);

  /* Aggregate before vs after chart data for completed interventions */
  const summaryChartData = useMemo(() => {
    const completed = interventions.filter((i) => i.status === 'completed');
    if (completed.length === 0) return [];

    return STANDARD_METRICS
      .map((m) => {
        const totalBefore = completed.reduce((s, i) => s + (i.beforeMetrics?.[m.key] || 0), 0);
        const totalAfter = completed.reduce((s, i) => s + (i.afterMetrics?.[m.key] || 0), 0);
        if (totalBefore === 0 && totalAfter === 0) return null;
        return { name: m.label, Before: totalBefore, After: totalAfter };
      })
      .filter(Boolean);
  }, [interventions]);

  if (!clientId) {
    return (
      <div className="portal-empty-state">
        <Crosshair size={48} />
        <h3>Not Logged In</h3>
        <p>Please log in to view your interventions.</p>
      </div>
    );
  }

  return (
    <div className="pi-container">
      <div className="pi-header">
        <h2><Crosshair size={22} /> What We Have Done For You</h2>
        <p className="pi-subtitle">
          Track the impact of our work on your business metrics and ROI.
        </p>
      </div>

      {/* Hero Stats */}
      <div className="pi-stats-row">
        <div className="pi-stat-card">
          <div className="pi-stat-icon" style={{ background: '#3b82f61a', color: '#3b82f6' }}>
            <BarChart3 size={20} />
          </div>
          <div className="pi-stat-info">
            <span className="pi-stat-value">{stats.total}</span>
            <span className="pi-stat-label">Total Interventions</span>
          </div>
        </div>
        <div className="pi-stat-card">
          <div className="pi-stat-icon" style={{ background: '#22c55e1a', color: '#22c55e' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="pi-stat-info">
            <span className="pi-stat-value">{stats.completed}</span>
            <span className="pi-stat-label">Completed</span>
          </div>
        </div>
        <div className="pi-stat-card">
          <div className="pi-stat-icon" style={{ background: '#8b5cf61a', color: '#8b5cf6' }}>
            <TrendingUp size={20} />
          </div>
          <div className="pi-stat-info">
            <span className="pi-stat-value">{stats.avgRoi}%</span>
            <span className="pi-stat-label">Avg ROI</span>
          </div>
        </div>
        <div className="pi-stat-card">
          <div className="pi-stat-icon" style={{ background: '#f59e0b1a', color: '#f59e0b' }}>
            <DollarSign size={20} />
          </div>
          <div className="pi-stat-info">
            <span className="pi-stat-value">${stats.totalInvestment.toLocaleString()}</span>
            <span className="pi-stat-label">Total Investment</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs + Sort */}
      <div className="pi-controls">
        <div className="pi-tabs">
          {[
            { key: 'all', label: 'All' },
            { key: 'completed', label: 'Completed' },
            { key: 'in-progress', label: 'In Progress' },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`pi-tab ${activeTab === tab.key ? 'pi-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className="pi-tab-count">{tabCounts[tab.key] || 0}</span>
            </button>
          ))}
        </div>
        <div className="pi-sort">
          <ArrowUpDown size={14} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="pi-sort-select"
            aria-label="Sort interventions"
          >
            <option value="date">Date</option>
            <option value="roi">ROI</option>
            <option value="cost">Cost</option>
          </select>
        </div>
      </div>

      {/* Interventions List */}
      {filtered.length === 0 ? (
        <div className="portal-empty-state">
          <Inbox size={48} />
          <h3>
            No {activeTab === 'completed' ? 'Completed' : activeTab === 'in-progress' ? 'In Progress' : ''} Interventions
          </h3>
          <p>
            {interventions.length === 0
              ? 'No interventions have been tracked yet. Results will appear here as we implement solutions for your business.'
              : 'No interventions match the current filter.'}
          </p>
        </div>
      ) : (
        <div className="pi-list">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            const revChange = (item.afterMetrics?.revenue || 0) - (item.beforeMetrics?.revenue || 0);
            const roi = item.cost > 0 ? ((revChange - item.cost) / item.cost) * 100 : 0;

            return (
              <div key={item.id} className="pi-card">
                <div
                  className="pi-card-header"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-label={`Toggle details for ${item.title}`}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedId(isExpanded ? null : item.id);
                    }
                  }}
                >
                  <div className="pi-card-top">
                    <TypeBadge type={item.type} />
                    <StatusBadge status={item.status} />
                  </div>
                  <h4 className="pi-card-title">{item.title}</h4>
                  {item.description && (
                    <p className="pi-card-desc">{item.description}</p>
                  )}
                  <div className="pi-card-meta">
                    {item.cost > 0 && (
                      <span className="pi-card-meta-item">
                        <DollarSign size={13} /> ${item.cost.toLocaleString()}
                      </span>
                    )}
                    {item.status === 'completed' && item.cost > 0 && (
                      <span
                        className="pi-card-meta-item"
                        style={{ color: roi >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}
                      >
                        <TrendingUp size={13} /> {roi.toFixed(1)}% ROI
                      </span>
                    )}
                    {(item.startDate || item.completedDate) && (
                      <span className="pi-card-meta-item">
                        <Calendar size={13} />
                        {formatDate(item.startDate)}
                        {item.completedDate && ` - ${formatDate(item.completedDate)}`}
                      </span>
                    )}
                  </div>
                  <div className="pi-card-chevron">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="pi-card-body">
                    {/* ROI Summary for completed items */}
                    {item.status === 'completed' && item.cost > 0 && (
                      <div className="pi-roi-card">
                        <h5><DollarSign size={16} /> Return on Investment</h5>
                        <div className="pi-roi-grid">
                          <div className="pi-roi-item">
                            <span>Revenue Change</span>
                            <strong style={{ color: revChange >= 0 ? '#22c55e' : '#ef4444' }}>
                              ${revChange.toLocaleString()}
                            </strong>
                          </div>
                          <div className="pi-roi-item">
                            <span>Investment</span>
                            <strong>${item.cost.toLocaleString()}</strong>
                          </div>
                          <div className="pi-roi-item">
                            <span>ROI</span>
                            <strong style={{ color: roi >= 0 ? '#22c55e' : '#ef4444' }}>
                              {roi.toFixed(1)}%
                            </strong>
                          </div>
                          <div className="pi-roi-item">
                            <span>Payback Period</span>
                            <strong>
                              {revChange > 0 ? `${(item.cost / (revChange / 12)).toFixed(1)} mo` : '--'}
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Before / After Metrics */}
                    <MetricComparison item={item} />

                    {/* Tags */}
                    {(item.tags || []).length > 0 && (
                      <div className="pi-tags">
                        {item.tags.map((t, i) => (
                          <span key={i} className="pi-tag">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Aggregate Results Summary Chart */}
      {summaryChartData.length > 0 && (
        <div className="pi-summary-chart">
          <h3 className="pi-section-title">
            <BarChart3 size={18} /> Aggregate Results (Completed Interventions)
          </h3>
          <p className="pi-summary-subtitle">
            Combined before and after metrics across all completed interventions.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={summaryChartData} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Before" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Before" />
              <Bar dataKey="After" fill="#3b82f6" radius={[4, 4, 0, 0]} name="After" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
