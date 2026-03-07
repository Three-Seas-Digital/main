import { useState, useMemo } from 'react';
import {
  TrendingUp, Filter, ArrowUpDown, Target, CheckCircle2,
  XCircle, Pause, Inbox,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { safeGetItem } from '../../constants';
import { TIER_META } from '../../components/admin/BusinessIntelligence/kpiRegistry';

// Status config
const STATUS_CONFIG = {
  active:   { label: 'Active',   color: '#3b82f6', bg: '#3b82f622' },
  achieved: { label: 'Achieved', color: '#22c55e', bg: '#22c55e22' },
  missed:   { label: 'Missed',   color: '#ef4444', bg: '#ef444422' },
  paused:   { label: 'Paused',   color: '#6b7280', bg: '#6b728022' },
};

// Sparkline SVG chart
function Sparkline({ data, width = 120, height = 32 }: { data: any[]; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;

  const values = data.map((d: any) => (typeof d === 'number' ? d : d.value || 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 2;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const points = values.map((v: number, i: number) => {
    const x = padding + (i / (values.length - 1)) * chartW;
    const y = padding + chartH - ((v - min) / range) * chartH;
    return `${x},${y}`;
  });

  const lastVal = values[values.length - 1];
  const firstVal = values[0];
  const trending = lastVal >= firstVal;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="portal-sparkline"
      preserveAspectRatio="none"
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={trending ? '#22c55e' : '#ef4444'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle
        cx={padding + chartW}
        cy={padding + chartH - ((lastVal - min) / range) * chartH}
        r="2.5"
        fill={trending ? '#22c55e' : '#ef4444'}
      />
    </svg>
  );
}

// Progress bar with percentage
function ProgressBar({ pct, status }: { pct: number; status: string }) {
  const clampedPct = Math.min(Math.max(pct, 0), 100);
  const conf = (STATUS_CONFIG as Record<string, any>)[status] || STATUS_CONFIG.active;

  return (
    <div className="portal-progress-container">
      <div className="portal-progress-track">
        <div
          className="portal-progress-fill"
          style={{
            width: `${clampedPct}%`,
            background: conf.color,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span className="portal-progress-label" style={{ color: conf.color }}>
        {clampedPct.toFixed(0)}%
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const conf = (STATUS_CONFIG as Record<string, any>)[status] || STATUS_CONFIG.active;
  return (
    <span
      className="portal-status-badge"
      style={{ background: conf.bg, color: conf.color }}
    >
      {conf.label}
    </span>
  );
}

export default function GrowthMetrics() {
  const { currentClient } = useAppContext();
  const clientId = currentClient?.id;

  // BI data from localStorage
  const allTargets = useMemo(() => safeGetItem('threeseas_bi_growth_targets', []), []);
  const allSnapshots = useMemo(() => safeGetItem('threeseas_bi_growth_snapshots', []), []);

  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Client-specific targets
  const clientTargets = useMemo(
    () => allTargets.filter((t) => t.clientId === clientId),
    [allTargets, clientId]
  );

  // Build snapshots map: metricId -> array of snapshot values
  const snapshotsMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    allSnapshots
      .filter((s: any) => s.clientId === clientId)
      .sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''))
      .forEach((s: any) => {
        if (!map[s.metricId]) map[s.metricId] = [];
        map[s.metricId].push(s);
      });
    return map;
  }, [allSnapshots, clientId]);

  // Calculate progress for each metric
  const metricsWithProgress = useMemo(() => {
    return clientTargets.map((metric) => {
      const baseline = metric.baseline || 0;
      const target = metric.target || 0;
      const current = metric.current || baseline;
      const range = target - baseline;
      const progress = range !== 0 ? ((current - baseline) / range) * 100 : 0;
      const snapshots = snapshotsMap[metric.id] || [];

      return { ...metric, progress, snapshots };
    });
  }, [clientTargets, snapshotsMap]);

  // Apply filters
  const filteredMetrics = useMemo(() => {
    let list = metricsWithProgress;
    if (filterStatus !== 'all') {
      list = list.filter((m) => m.status === filterStatus);
    }
    return list;
  }, [metricsWithProgress, filterStatus]);

  // Apply sorting
  const sortedMetrics = useMemo(() => {
    const sorted = [...filteredMetrics];
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'progress':
        sorted.sort((a, b) => b.progress - a.progress);
        break;
      case 'date':
        sorted.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        break;
      default:
        break;
    }
    return sorted;
  }, [filteredMetrics, sortBy]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: clientTargets.length, active: 0, achieved: 0, missed: 0, paused: 0 };
    clientTargets.forEach((m: any) => {
      if (counts[m.status] !== undefined) counts[m.status]++;
    });
    return counts;
  }, [clientTargets]);

  const renderMetricCard = (metric: any) => (
    <div key={metric.id} className="portal-growth-card">
      <div className="portal-growth-card-header">
        <div className="portal-growth-card-title">
          <h4>{metric.name}</h4>
          <StatusBadge status={metric.status} />
        </div>
        {metric.unit && (
          <span className="portal-growth-unit">{metric.unit}</span>
        )}
      </div>

      <div className="portal-growth-card-values">
        <div className="portal-growth-value-group">
          <span className="portal-growth-value-label">Baseline</span>
          <span className="portal-growth-value">{metric.baseline ?? '-'}</span>
        </div>
        <span className="portal-growth-arrow">→</span>
        <div className="portal-growth-value-group portal-growth-value-current">
          <span className="portal-growth-value-label">Current</span>
          <span className="portal-growth-value">{metric.current ?? '-'}</span>
        </div>
        <span className="portal-growth-arrow">→</span>
        <div className="portal-growth-value-group">
          <span className="portal-growth-value-label">Target</span>
          <span className="portal-growth-value">{metric.target ?? '-'}</span>
        </div>
      </div>

      <ProgressBar pct={metric.progress} status={metric.status} />

      {metric.snapshots.length >= 2 && (
        <div className="portal-growth-sparkline-wrapper">
          <Sparkline
            data={metric.snapshots.map((s: any) => s.value)}
            width={160}
            height={36}
          />
        </div>
      )}
    </div>
  );

  if (!clientId) {
    return (
      <div className="portal-empty-state">
        <Target size={48} />
        <h3>Not Logged In</h3>
        <p>Please log in to view your growth metrics.</p>
      </div>
    );
  }

  return (
    <div className="portal-growth-metrics">
      <div className="portal-growth-header">
        <h2>Growth Metrics</h2>
        <p className="portal-growth-subtitle">
          Track your key performance indicators and progress toward goals.
        </p>
      </div>

      {/* Filter & Sort Controls */}
      <div className="portal-growth-controls">
        <div className="portal-growth-filters">
          <Filter size={16} />
          {['all', 'active', 'achieved', 'missed', 'paused'].map((status) => (
            <button
              key={status}
              className={`portal-filter-btn ${filterStatus === status ? 'portal-filter-btn-active' : ''}`}
              onClick={() => setFilterStatus(status)}
              style={
                filterStatus === status && status !== 'all'
                  ? { background: (STATUS_CONFIG as Record<string, any>)[status]?.bg, color: (STATUS_CONFIG as Record<string, any>)[status]?.color, borderColor: (STATUS_CONFIG as Record<string, any>)[status]?.color }
                  : undefined
              }
            >
              {status === 'all' ? 'All' : (STATUS_CONFIG as Record<string, any>)[status]?.label} ({statusCounts[status] || 0})
            </button>
          ))}
        </div>

        <div className="portal-growth-sort">
          <ArrowUpDown size={14} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="portal-sort-select"
            aria-label="Sort metrics by"
          >
            <option value="name">Name</option>
            <option value="progress">Progress</option>
            <option value="date">Date</option>
          </select>
        </div>
      </div>

      {/* Metrics List */}
      {sortedMetrics.length === 0 ? (
        <div className="portal-empty-state">
          <Inbox size={48} />
          <h3>No Metrics Found</h3>
          <p>
            {filterStatus !== 'all'
              ? `No ${filterStatus} metrics. Try changing the filter.`
              : 'No growth metrics have been set for your account yet.'}
          </p>
        </div>
      ) : (
        <div className="portal-growth-list">
          {(() => {
            // Group by tier if tier data exists, otherwise render flat
            const hasTiers = sortedMetrics.some(m => m.tier);
            if (!hasTiers) return sortedMetrics.map(renderMetricCard);

            const tierOrder = ['north_star', 'driver', 'guardrail', 'universal', 'custom'];
            const grouped: Record<string, any[]> = {};
            const ungrouped: any[] = [];
            sortedMetrics.forEach((m: any) => {
              if (m.tier && (TIER_META as Record<string, any>)[m.tier]) {
                if (!grouped[m.tier]) grouped[m.tier] = [];
                grouped[m.tier].push(m);
              } else {
                ungrouped.push(m);
              }
            });

            return (
              <>
                {tierOrder.map((tier: string) => {
                  const items = grouped[tier];
                  if (!items || items.length === 0) return null;
                  const meta = TIER_META[tier];
                  return (
                    <div key={tier} className="portal-growth-tier-group">
                      <div className="portal-growth-tier-header">
                        <span className="kpi-tier-badge" style={{ background: meta.color + '22', color: meta.color, borderColor: meta.color }}>
                          {meta.label}
                        </span>
                        <span className="portal-growth-tier-desc">{meta.desc}</span>
                      </div>
                      {items.map(renderMetricCard)}
                    </div>
                  );
                })}
                {ungrouped.length > 0 && (
                  <div className="portal-growth-tier-group">
                    <div className="portal-growth-tier-header">
                      <span className="kpi-tier-badge" style={{ background: '#6b728022', color: '#6b7280', borderColor: '#6b7280' }}>
                        Other
                      </span>
                    </div>
                    {ungrouped.map(renderMetricCard)}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
