import React from 'react';
import { useState, useMemo } from 'react';
import {
  Filter, Users, UserPlus, Calendar, Briefcase, CheckCircle, TrendingUp, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useAppContext } from '../../../context/AppContext';

// ─── Constants ──────────────────────────────────────────────────────────────

const FUNNEL_COLORS = [
  '#3b82f6', // Leads       — blue
  '#6366f1', // Inquiry     — indigo
  '#8b5cf6', // Booked      — violet
  '#f59e0b', // Negotiating — amber
  '#10b981', // Won         — emerald
  '#22c55e', // Active      — green
];

const STAGE_ICONS = [
  <UserPlus  size={16} />,
  <Filter    size={16} />,
  <Calendar  size={16} />,
  <Briefcase size={16} />,
  <CheckCircle size={16} />,
  <Users     size={16} />,
];

const LOSS_REASON_LABELS = {
  budget:      'Budget constraints',
  timing:      'Bad timing',
  competitor:  'Chose competitor',
  'no-response': 'No response',
  scope:       'Scope mismatch',
  other:       'Other',
};

// Build year + quarter options going back 3 years
function buildPeriodOptions() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const opts = [{ value: 'all', label: 'All Time' }];
  for (let y = currentYear; y >= currentYear - 2; y--) {
    opts.push({ value: String(y), label: String(y) });
    for (let q = 4; q >= 1; q--) {
      opts.push({ value: `${y}-Q${q}`, label: `Q${q} ${y}` });
    }
  }
  return opts;
}

// Return true if an ISO date string falls within a period selection
function inPeriod(isoStr: string | undefined | null, period: string): boolean {
  if (!isoStr || period === 'all') return true;
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return false;
  const y = d.getFullYear();
  const q = Math.floor(d.getMonth() / 3) + 1;
  if (period.includes('-Q')) {
    const [py, pq] = period.split('-Q');
    return y === Number(py) && q === Number(pq);
  }
  return y === Number(period);
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bi-funnel-summary-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="bi-funnel-summary-icon" style={{ color }}>{icon}</div>
      <div className="bi-funnel-summary-value">{value}</div>
      <div className="bi-funnel-summary-label">{label}</div>
    </div>
  );
}

function ConversionBadge({ rate }: { rate: number | null }) {
  if (rate == null) return null;
  const color = rate > 50 ? '#10b981' : rate >= 20 ? '#f59e0b' : '#ef4444';
  return (
    <span className="bi-funnel-conv-badge" style={{ color, borderColor: color }}>
      <ArrowRight size={10} />
      {rate}%
    </span>
  );
}

function FunnelBar({ stageName, icon, count, maxCount, color, conversionRate, isLast }: { stageName: string; icon: React.ReactNode; count: number; maxCount: number; color: string; conversionRate: number | null | undefined; isLast: boolean }) {
  const pct = maxCount > 0 ? Math.max(12, Math.round((count / maxCount) * 100)) : 12;
  return (
    <div className="bi-funnel-stage">
      <div className="bi-funnel-stage-label">
        <span style={{ color }}>{icon}</span>
        <span>{stageName}</span>
      </div>
      <div className="bi-funnel-bar-track">
        <div
          className="bi-funnel-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        >
          <span className="bi-funnel-bar-count">{count.toLocaleString()}</span>
        </div>
      </div>
      {!isLast && (
        <div className="bi-funnel-arrow">
          <ConversionBadge rate={conversionRate} />
        </div>
      )}
    </div>
  );
}

const CustomBarTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bi-funnel-tooltip">
      <strong>{payload[0].payload.reason}</strong>
      <span>{payload[0].value} lost</span>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface JourneyFunnelProps {
  biClientId?: string;
  onBiClientChange?: (clientId: string) => void;
}

export default function JourneyFunnel({ biClientId, onBiClientChange }: JourneyFunnelProps) {
  const { clients, leads, prospects } = useAppContext();
  const [period, setPeriod] = useState('all');

  const periodOptions = useMemo(buildPeriodOptions, []);

  // Filter leads and prospects by selected time period
  const filteredLeads = useMemo(
    () => leads.filter(l => inPeriod(l.createdAt, period)),
    [leads, period]
  );

  const filteredProspects = useMemo(
    () => prospects.filter(p => inPeriod(p.createdAt, period)),
    [prospects, period]
  );

  // Active clients are always global (no createdAt filter that maps to a prospect stage)
  const activeClients = useMemo(
    () => clients.filter(c => c.status === 'active'),
    [clients]
  );

  // ── Funnel Stage Counts ───────────────────────────────────────────────────
  const stageCounts = useMemo(() => {
    const totalLeads    = filteredLeads.length;
    const inquiry       = filteredProspects.filter(p => p.stage === 'inquiry').length;
    const booked        = filteredProspects.filter(p => p.stage === 'booked').length;
    const negotiating   = filteredProspects.filter(p => p.stage === 'negotiating').length;
    const won           = filteredProspects.filter(p => p.outcome === 'won').length;
    const active        = activeClients.length;
    return [totalLeads, inquiry, booked, negotiating, won, active];
  }, [filteredLeads, filteredProspects, activeClients]);

  const stageNames = ['Leads', 'Inquiry', 'Booked', 'Negotiating', 'Won', 'Active Clients'];
  const maxCount   = Math.max(...stageCounts, 1);

  // Conversion rate between each adjacent pair
  const conversionRates = useMemo(() => {
    return stageCounts.map((count, i) => {
      if (i === 0) return null;
      const prev = stageCounts[i - 1];
      if (!prev) return null;
      return Number((count / prev * 100).toFixed(1));
    });
  }, [stageCounts]);

  // Overall conversion: active clients / total leads
  const overallConversion = useMemo(() => {
    const leads = stageCounts[0];
    const active = stageCounts[5];
    if (!leads) return '0.0';
    return (active / leads * 100).toFixed(1);
  }, [stageCounts]);

  // ── Deal Metrics ─────────────────────────────────────────────────────────
  const dealMetrics = useMemo(() => {
    const wonProspects  = filteredProspects.filter(p => p.outcome === 'won');
    const withValue     = wonProspects.filter(p => Number(p.dealValue) > 0);
    const avgDealValue  = withValue.length
      ? withValue.reduce((s, p) => s + Number(p.dealValue), 0) / withValue.length
      : 0;

    const activeProspects = filteredProspects.filter(
      p => p.outcome == null && p.stage !== 'closed'
    );
    const pipelineValue = activeProspects.reduce(
      (s, p) => s + (Number(p.dealValue) || 0), 0
    );

    return { avgDealValue, pipelineValue };
  }, [filteredProspects]);

  // ── Loss Analysis ─────────────────────────────────────────────────────────
  const lossChartData = useMemo(() => {
    const lostProspects = filteredProspects.filter(p => p.outcome === 'lost');
    const grouped = {};
    lostProspects.forEach(p => {
      const reason = p.lossReason || 'other';
      grouped[reason] = (grouped[reason] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([reason, count]) => ({
        reason: LOSS_REASON_LABELS[reason] || reason,
        count,
      }))
      .sort((a, b) => (b.count as number) - (a.count as number));
  }, [filteredProspects]);

  const fmt = (n: any): string =>
    '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="bi-funnel-root">
      {/* ── Header ── */}
      <div className="bi-funnel-header">
        <div className="bi-funnel-title">
          <TrendingUp size={20} color="#3b82f6" />
          <h3>Customer Journey &amp; Conversion Funnel</h3>
        </div>
        <div className="bi-funnel-controls">
          <label htmlFor="jf-period" className="bi-funnel-ctrl-label">Period</label>
          <select
            id="jf-period"
            className="bi-funnel-select"
            value={period}
            onChange={e => setPeriod(e.target.value)}
          >
            {periodOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="bi-funnel-summary-row">
        <SummaryCard
          icon={<UserPlus size={20} />}
          label="Total Leads"
          value={stageCounts[0].toLocaleString()}
          color="#3b82f6"
        />
        <SummaryCard
          icon={<TrendingUp size={20} />}
          label="Overall Conversion"
          value={`${overallConversion}%`}
          color={Number(overallConversion) > 50 ? '#10b981' : Number(overallConversion) >= 20 ? '#f59e0b' : '#ef4444'}
        />
        <SummaryCard
          icon={<Briefcase size={20} />}
          label="Avg Deal Value"
          value={fmt(dealMetrics.avgDealValue)}
          color="#8b5cf6"
        />
        <SummaryCard
          icon={<CheckCircle size={20} />}
          label="Pipeline Value"
          value={fmt(dealMetrics.pipelineValue)}
          color="#10b981"
        />
      </div>

      {/* ── Funnel Visualization ── */}
      <div className="bi-funnel-panel">
        <h4 className="bi-funnel-panel-title">
          <Filter size={15} />
          Funnel Stages
        </h4>
        <div className="bi-funnel-viz">
          {stageNames.map((name, i) => (
            <FunnelBar
              key={name}
              stageName={name}
              icon={STAGE_ICONS[i]}
              count={stageCounts[i]}
              maxCount={maxCount}
              color={FUNNEL_COLORS[i]}
              conversionRate={conversionRates[i + 1]}
              isLast={i === stageNames.length - 1}
            />
          ))}
        </div>
      </div>

      {/* ── Loss Analysis ── */}
      <div className="bi-funnel-panel">
        <h4 className="bi-funnel-panel-title">
          <Filter size={15} />
          Loss Analysis by Reason
        </h4>
        {lossChartData.length === 0 ? (
          <div className="bi-funnel-empty">
            <CheckCircle size={32} color="#10b981" />
            <p>No lost prospects in the selected period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={lossChartData} layout="vertical" margin={{ left: 24, right: 24, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis
                type="category"
                dataKey="reason"
                width={130}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="count" name="Lost" radius={[0, 4, 4, 0]}>
                {lossChartData.map((_, idx) => (
                  <Cell key={idx} fill={FUNNEL_COLORS[idx % FUNNEL_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Stage Breakdown Pie ── */}
      {filteredProspects.length > 0 && (
        <div className="bi-funnel-panel">
          <h4 className="bi-funnel-panel-title">
            <Users size={15} />
            Active Prospect Distribution
          </h4>
          <div className="bi-funnel-pie-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Inquiry',     value: stageCounts[1] },
                    { name: 'Booked',      value: stageCounts[2] },
                    { name: 'Negotiating', value: stageCounts[3] },
                  ].filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {[1, 2, 3].map((_, i) => (
                    <Cell key={i} fill={FUNNEL_COLORS[i + 1]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Prospects']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
