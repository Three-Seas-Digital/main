import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import {
  User, BarChart3, TrendingUp, PieChart as PieChartIcon, Target,
  DollarSign, Printer, Shield, Smartphone, Globe, ChevronRight,
  Inbox, Search, ArrowUpRight, ArrowDownRight, GitCompare, Calendar,
  Crosshair,
} from 'lucide-react';
const HealthOverview = lazy(() => import('./HealthOverview'));
import { useAppContext } from '../../../context/AppContext';
import { safeGetItem, escapeHtml } from '../../../constants';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, ReferenceLine,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';

const AUDITS_KEY = 'threeseas_bi_audits';
const INTAKES_KEY = 'threeseas_bi_intakes';
const RECS_KEY = 'threeseas_bi_recommendations';
const TARGETS_KEY = 'threeseas_bi_growth_targets';
const SNAPSHOTS_KEY = 'threeseas_bi_growth_snapshots';
const FINANCIALS_KEY = 'threeseas_bi_client_financials';
const INTERVENTIONS_KEY = 'threeseas_bi_interventions';

const INTERVENTION_TYPES = {
  website: { label: 'Website', color: '#3b82f6' },
  seo: { label: 'SEO', color: '#22c55e' },
  social: { label: 'Social', color: '#8b5cf6' },
  advertising: { label: 'Advertising', color: '#f97316' },
  branding: { label: 'Branding', color: '#ec4899' },
  content: { label: 'Content', color: '#14b8a6' },
  technical: { label: 'Technical', color: '#f59e0b' },
  other: { label: 'Other', color: '#6b7280' },
};

const CATEGORY_MAP = {
  SEO: { keys: ['sc-meta', 'sc-headings', 'sc-sitemap', 'sc-speed'], color: '#3b82f6' },
  'Design/UX': { keys: ['sc-layout', 'sc-mobile', 'sc-nav', 'sc-brand'], color: '#8b5cf6' },
  Content: { keys: ['sc-quality', 'sc-cta', 'sc-media', 'sc-blog'], color: '#10b981' },
  Technical: { keys: ['sc-ssl', 'sc-hosting', 'sc-perf', 'sc-analytics'], color: '#f59e0b' },
  Social: { keys: ['sc-profiles', 'sc-reviews', 'sc-listings', 'sc-email'], color: '#ef4444' },
};

const REC_STATUS_COLORS = {
  proposed: '#3b82f6', accepted: '#22c55e', in_progress: '#f59e0b',
  completed: '#10b981', declined: '#ef4444',
};

const PRIORITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#9ca3af' };

const DATE_PRESETS = [
  { key: 'all', label: 'All Time' },
  { key: '3m', label: 'Last 3 Months' },
  { key: '6m', label: 'Last 6 Months' },
  { key: '1y', label: 'Last Year' },
  { key: 'custom', label: 'Custom Range' },
];

const QUICK_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'hasAudit', label: 'Has Audit' },
  { key: 'needsAudit', label: 'Needs Audit' },
  { key: 'hasFinancials', label: 'Has Financials' },
];
const fmt = (n: any): string => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const esc = escapeHtml;

function categoryAvg(scores: Record<string, number>, keys: string[]): number {
  const vals = keys.map((k: string) => scores[k] || 0).filter((v: number) => v > 0);
  return vals.length ? +(vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : 0;
}

function overallFromAudit(audit: any): number {
  if (!audit?.scores) return 0;
  const cats = Object.values(CATEGORY_MAP)
    .map(cfg => categoryAvg(audit.scores, cfg.keys))
    .filter(v => v > 0);
  return cats.length ? +(cats.reduce((a, b) => a + b, 0) / cats.length).toFixed(1) : 0;
}

function getDateCutoff(preset: string, customStart?: string): Date | null {
  if (preset === 'all') return null;
  if (preset === 'custom' && customStart) return new Date(customStart);
  const now = new Date();
  const months = { '3m': 3, '6m': 6 }[preset] || 12;
  return new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
}

function Card({ title, icon, extra, children }: { title: string; icon: React.ReactNode; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bi-analytics-card">
      <div className="bi-analytics-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{icon} <h4>{title}</h4></div>
        {extra && <div>{extra}</div>}
      </div>
      <div className="bi-analytics-card-body">{children}</div>
    </div>
  );
}
function EmptyState({ icon, text }) {
  return <div className="bi-analytics-empty">{icon}<p>{text}</p></div>;
}
function KpiCard({ label, value, trend }: { label: string; value: string | number; trend?: number | null }) {
  const neutral = trend === 0 || trend == null;
  return (
    <div className="bi-analytics-kpi">
      <span className="bi-analytics-kpi-label">{label}</span>
      <strong className="bi-analytics-kpi-value">{value}</strong>
      {!neutral && (
        <span className={`bi-analytics-kpi-trend ${trend > 0 ? 'up' : 'down'}`}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend).toFixed(1)}
        </span>
      )}
    </div>
  );
}

interface ClientAnalyticsProps {
  biClientId?: string;
  onBiClientChange?: (id: string) => void;
}

export default function ClientAnalytics({ biClientId, onBiClientChange }: ClientAnalyticsProps) {
  const { clients } = useAppContext();
  const [clientId, setClientId] = useState(biClientId || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [compareMode, setCompareMode] = useState(false);
  const [compareClientId, setCompareClientId] = useState('');
  const [dateRange, setDateRange] = useState({ preset: 'all', start: '', end: '' });
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync clientId when biClientId changes from another BI tab
  useEffect(() => {
    if (biClientId && biClientId !== clientId) setClientId(biClientId);
  }, [biClientId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh BI data when client changes
  useEffect(() => { setRefreshKey(k => k + 1); }, [clientId]);

  const activeClients = useMemo(
    () => clients.filter(c => c.status !== 'archived' && c.status !== 'rejected'),
    [clients]
  );

  // BI data sources — re-read from localStorage when refreshKey changes (tab switch or manual refresh)
  const allAudits = useMemo(() => safeGetItem(AUDITS_KEY, []), [refreshKey]);
  const intakes = useMemo(() => safeGetItem(INTAKES_KEY, {}), [refreshKey]);
  const allRecs = useMemo(() => safeGetItem(RECS_KEY, {}), [refreshKey]);
  const allTargets = useMemo(() => safeGetItem(TARGETS_KEY, []), [refreshKey]);
  const allSnapshots = useMemo(() => safeGetItem(SNAPSHOTS_KEY, []), [refreshKey]);
  const allFinancials = useMemo(() => safeGetItem(FINANCIALS_KEY, {}), [refreshKey]);
  const allInterventions = useMemo(() => safeGetItem(INTERVENTIONS_KEY, {}), [refreshKey]);

  // Client search/filter
  const filteredClients = useMemo(() => {
    let list = activeClients;
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      list = list.filter(c => (c.name || '').toLowerCase().includes(t) || (c.businessName || '').toLowerCase().includes(t));
    }
    if (quickFilter === 'hasAudit') list = list.filter(c => allAudits.some(a => a.clientId === c.id));
    else if (quickFilter === 'needsAudit') list = list.filter(c => !allAudits.some(a => a.clientId === c.id));
    else if (quickFilter === 'hasFinancials') list = list.filter(c => allFinancials[c.id]?.monthly?.length > 0);
    return list;
  }, [activeClients, searchTerm, quickFilter, allAudits, allFinancials]);

  const selectedClient = activeClients.find(c => c.id === clientId);
  const compareClient = compareMode ? activeClients.find(c => c.id === compareClientId) : null;

  // Date filter
  const dateCutoff = useMemo(() => getDateCutoff(dateRange.preset, dateRange.start), [dateRange]);
  const dateEnd = useMemo(() => (dateRange.preset === 'custom' && dateRange.end ? new Date(dateRange.end + 'T23:59:59') : null), [dateRange]);
  const filterByDate = useCallback((dateStr: string) => {
    if (!dateCutoff) return true;
    const d = new Date(dateStr);
    return d >= dateCutoff && (!dateEnd || d <= dateEnd);
  }, [dateCutoff, dateEnd]);

  // Primary client data
  const intake = clientId ? intakes[clientId] : null;
  const clientAudits = useMemo(() => allAudits.filter((a: any) => a.clientId === clientId && filterByDate(a.createdAt)).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), [allAudits, clientId, filterByDate]);
  const latestAudit = clientAudits.at(-1) || null;
  const prevAudit = clientAudits.length > 1 ? clientAudits.at(-2) : null;
  const allClientAuditsCount = useMemo(() => allAudits.filter(a => a.clientId === clientId).length, [allAudits, clientId]);

  // Compare client data
  const compareAudits = useMemo(() => compareClientId ? allAudits.filter((a: any) => a.clientId === compareClientId && filterByDate(a.createdAt)).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [], [allAudits, compareClientId, filterByDate]);
  const compareLatestAudit = compareAudits.at(-1) || null;

  // Radar data
  const radarData = useMemo(() => {
    if (!latestAudit?.scores) return [];
    const items: { category: string; score: number; fullMark: number; compareScore?: number }[] = Object.entries(CATEGORY_MAP).map(([name, cfg]) => ({ category: name, score: categoryAvg(latestAudit.scores, cfg.keys), fullMark: 10 }));
    if (compareMode && compareLatestAudit?.scores) {
      items.forEach(item => { item.compareScore = categoryAvg(compareLatestAudit.scores, CATEGORY_MAP[item.category].keys); });
    }
    return items;
  }, [latestAudit, compareMode, compareLatestAudit]);

  // Score delta between latest and previous audit
  const scoreDelta = useMemo(() => {
    if (!latestAudit || !prevAudit) return null;
    return +(overallFromAudit(latestAudit) - overallFromAudit(prevAudit)).toFixed(1);
  }, [latestAudit, prevAudit]);

  // Score history for trend chart
  const scoreHistory = useMemo(() => clientAudits.map(a => ({
    date: new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    score: overallFromAudit(a),
  })), [clientAudits]);

  // Category breakdown bars
  const categoryBars = useMemo(() => {
    if (!latestAudit?.scores) return [];
    return Object.entries(CATEGORY_MAP).map(([name, cfg]) => ({
      category: name, score: categoryAvg(latestAudit.scores, cfg.keys), fill: cfg.color,
    }));
  }, [latestAudit]);

  // Recommendations
  const clientRecs = useMemo(() => {
    const recs = [];
    clientAudits.forEach(a => (allRecs[a.id] || []).forEach(rec => recs.push(rec)));
    return recs;
  }, [clientAudits, allRecs]);
  const recStatusData = useMemo(() => {
    const c = { proposed: 0, accepted: 0, in_progress: 0, completed: 0, declined: 0 };
    clientRecs.forEach(r => { if (c[r.status] !== undefined) c[r.status]++; });
    return Object.entries(c).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [clientRecs]);
  const activeRecs = clientRecs.filter(r => r.status !== 'completed' && r.status !== 'declined');

  // Recommendation funnel data (Section I)
  const recFunnel = useMemo(() => {
    const counts = { proposed: 0, accepted: 0, in_progress: 0, completed: 0, declined: 0 };
    clientRecs.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
    return [
      { stage: 'Proposed', count: counts.proposed, color: '#6b7280' },
      { stage: 'Accepted', count: counts.accepted, color: '#3b82f6' },
      { stage: 'In Progress', count: counts.in_progress, color: '#f59e0b' },
      { stage: 'Completed', count: counts.completed, color: '#22c55e' },
      { stage: 'Declined', count: counts.declined, color: '#ef4444' },
    ];
  }, [clientRecs]);

  // Growth targets
  const clientTargets = useMemo(
    () => allTargets.filter(t => t.clientId === clientId),
    [allTargets, clientId]
  );
  const snapshotsMap = useMemo(() => {
    const map = {};
    allSnapshots
      .filter(s => s.clientId === clientId && filterByDate(s.date))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .forEach(s => {
        if (!map[s.metricId]) map[s.metricId] = [];
        map[s.metricId].push(s);
      });
    return map;
  }, [allSnapshots, clientId, filterByDate]);
  const targetsMet = useMemo(() => clientTargets.filter(m => {
    const range = (m.target || 0) - (m.baseline || 0);
    return range !== 0 && ((m.current || m.baseline || 0) - (m.baseline || 0)) / range >= 1;
  }).length, [clientTargets]);

  // Client financials
  const financials = clientId ? allFinancials[clientId] : null;
  const monthlyFinancialData = useMemo(() => {
    if (!financials?.monthly) return [];
    return financials.monthly
      .filter(m => filterByDate(m.month + '-01'))
      .map(m => ({ ...m, profit: (m.revenue || 0) - (m.expenses || 0) }));
  }, [financials, filterByDate]);
  const totalRevenue = monthlyFinancialData.reduce((s, m) => s + (m.revenue || 0), 0);

  // Interventions data
  const clientInterventions = useMemo(() => {
    const entry = clientId ? allInterventions[clientId] : null;
    return entry?.interventions || [];
  }, [allInterventions, clientId]);

  const interventionStats = useMemo(() => {
    const total = clientInterventions.length;
    const completed = clientInterventions.filter(i => i.status === 'completed').length;
    const inProgress = clientInterventions.filter(i => i.status === 'in_progress').length;
    const totalInvestment = clientInterventions.reduce((s, i) => s + (Number(i.cost) || 0), 0);

    // Calculate ROI for completed interventions with before/after revenue
    const withROI = clientInterventions.filter(i => {
      if (i.status !== 'completed') return false;
      const before = Number(i.beforeMetrics?.revenue) || 0;
      const after = Number(i.afterMetrics?.revenue) || 0;
      return before > 0 && after > 0;
    });
    const avgROI = withROI.length > 0
      ? withROI.reduce((s, i) => {
          const before = Number(i.beforeMetrics.revenue);
          const after = Number(i.afterMetrics.revenue);
          const cost = Number(i.cost) || 1;
          return s + ((after - before - cost) / cost) * 100;
        }, 0) / withROI.length
      : null;

    return { total, completed, inProgress, totalInvestment, avgROI };
  }, [clientInterventions]);

  // Intervention type breakdown for stacked bar chart
  const interventionTypeData = useMemo(() => {
    const counts = {};
    clientInterventions.forEach(i => {
      const t = i.type || 'other';
      if (!counts[t]) counts[t] = { type: t, planned: 0, in_progress: 0, completed: 0, paused: 0 };
      const status = i.status || 'planned';
      if (counts[t][status as string] !== undefined) counts[t][status as string]++;
    });
    return Object.values(counts);
  }, [clientInterventions]);

  // Recent completed interventions with revenue change
  const recentCompleted = useMemo(() => {
    return clientInterventions
      .filter(i => i.status === 'completed')
      .sort((a, b) => (b.completedDate || '').localeCompare(a.completedDate || ''))
      .slice(0, 5)
      .map(i => {
        const beforeRev = Number(i.beforeMetrics?.revenue) || 0;
        const afterRev = Number(i.afterMetrics?.revenue) || 0;
        const cost = Number(i.cost) || 0;
        const revChange = afterRev - beforeRev;
        const roi = cost > 0 ? ((afterRev - beforeRev - cost) / cost) * 100 : null;
        return { ...i, beforeRev, afterRev, revChange, roi };
      });
  }, [clientInterventions]);

  // Aggregated before/after for completed interventions
  const aggregatedBeforeAfter = useMemo(() => {
    const completed = clientInterventions.filter(i => i.status === 'completed' && i.beforeMetrics && i.afterMetrics);
    if (completed.length === 0) return null;
    const keys = ['websiteTraffic', 'conversionRate', 'revenue', 'socialFollowers', 'seoScore', 'pageSpeed', 'bounceRate'];
    const labels = { websiteTraffic: 'Website Traffic', conversionRate: 'Conversion Rate', revenue: 'Revenue', socialFollowers: 'Social Followers', seoScore: 'SEO Score', pageSpeed: 'Page Speed', bounceRate: 'Bounce Rate' };
    const rows = [];
    keys.forEach(k => {
      const withData = completed.filter(i => Number(i.beforeMetrics[k]) > 0 || Number(i.afterMetrics[k]) > 0);
      if (withData.length === 0) return;
      const before = withData.reduce((s, i) => s + (Number(i.beforeMetrics[k]) || 0), 0) / withData.length;
      const after = withData.reduce((s, i) => s + (Number(i.afterMetrics[k]) || 0), 0) / withData.length;
      const change = before > 0 ? ((after - before) / before * 100) : 0;
      const isInverse = k === 'bounceRate'; // lower is better
      rows.push({ key: k, label: labels[k], before: +before.toFixed(1), after: +after.toFixed(1), change: +change.toFixed(1), isInverse });
    });
    return rows.length > 0 ? rows : null;
  }, [clientInterventions]);

  // Intervention ROI scatter data (Section J)
  const interventionScatter = useMemo(() => {
    return clientInterventions
      .filter(i => i.status === 'completed' && Number(i.cost) > 0)
      .map(i => {
        const revChange = (Number(i.afterMetrics?.revenue) || 0) - (Number(i.beforeMetrics?.revenue) || 0);
        const cost = Number(i.cost) || 1;
        const roi = ((revChange - cost) / cost) * 100;
        return {
          name: i.title,
          cost,
          roi: Math.round(roi * 10) / 10,
          revChange: Math.abs(revChange),
          type: i.type,
          color: INTERVENTION_TYPES[i.type]?.color || '#6b7280',
        };
      });
  }, [clientInterventions]);

  // Waterfall data for revenue changes (Section K)
  const waterfallData = useMemo(() => {
    if (!financials?.monthly?.length) return [];
    const sorted = [...financials.monthly]
      .filter(m => filterByDate(m.month + '-01'))
      .sort((a, b) => a.month.localeCompare(b.month));
    if (sorted.length === 0) return [];
    const data = [];
    let cumulative = 0;
    sorted.forEach((e, i) => {
      const change = i === 0 ? (e.revenue || 0) : (e.revenue || 0) - (sorted[i - 1].revenue || 0);
      data.push({
        month: new Date(e.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        base: change >= 0 ? cumulative : cumulative + change,
        increase: change >= 0 ? change : 0,
        decrease: change < 0 ? Math.abs(change) : 0,
        total: cumulative + change,
      });
      cumulative += change;
    });
    data.push({ month: 'Total', base: 0, increase: cumulative > 0 ? cumulative : 0, decrease: cumulative < 0 ? Math.abs(cumulative) : 0, total: cumulative });
    return data;
  }, [financials, filterByDate]);

  // Cumulative revenue data (Section G addition)
  const cumulativeData = useMemo(() => {
    if (!financials?.monthly?.length) return [];
    const sorted = [...financials.monthly]
      .filter(m => filterByDate(m.month + '-01'))
      .sort((a, b) => a.month.localeCompare(b.month));
    let cum = 0;
    return sorted.map(e => {
      cum += (e.revenue || 0);
      return {
        month: new Date(e.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        cumulative: cum,
        revenue: e.revenue || 0,
      };
    });
  }, [financials, filterByDate]);

  // Comparison data
  const comparisonTable = useMemo(() => {
    if (!compareMode || !latestAudit?.scores || !compareLatestAudit?.scores) return [];
    return Object.entries(CATEGORY_MAP).map(([name, cfg]) => ({
      category: name,
      primary: categoryAvg(latestAudit.scores, cfg.keys),
      compare: categoryAvg(compareLatestAudit.scores, cfg.keys),
    }));
  }, [compareMode, latestAudit, compareLatestAudit]);
  const primaryOverall = latestAudit ? overallFromAudit(latestAudit) : 0;
  const compareOverall = compareLatestAudit ? overallFromAudit(compareLatestAudit) : 0;

  // Print report
  const handlePrint = () => {
    if (!selectedClient) return;
    const overall = radarData.length ? (radarData.reduce((s, d) => s + d.score, 0) / radarData.length).toFixed(1) : 'N/A';
    const pw = window.open('', '_blank');
    const h = esc, f = fmt;
    const card = (lbl, val) => `<div class="card"><h3>${lbl}</h3><p>${val}</p></div>`;
    const drLabel = dateRange.preset !== 'all' ? ` | Date Range: ${dateRange.preset === 'custom' ? `${dateRange.start || '...'} to ${dateRange.end || '...'}` : DATE_PRESETS.find(p => p.key === dateRange.preset)?.label}` : '';
    const compSec = compareMode && compareClient ? `<h2>Comparison: ${h(selectedClient.name)} vs ${h(compareClient.name)}</h2>
      <table><thead><tr><th>Category</th><th>${h(selectedClient.name)}</th><th>${h(compareClient.name)}</th><th>Diff</th></tr></thead><tbody>${comparisonTable.map(r => { const d = r.primary - r.compare; return `<tr><td>${h(r.category)}</td><td>${r.primary}/10</td><td>${r.compare}/10</td><td>${d > 0 ? '+' : ''}${d.toFixed(1)}</td></tr>`; }).join('')}</tbody></table>
      <div class="grid">${card(h(selectedClient.name) + ' Overall', primaryOverall + '/10')}${card(h(compareClient.name) + ' Overall', compareOverall + '/10')}</div>` : '';
    const growthSec = clientTargets.length ? `<h2>Growth Metrics</h2><table><thead><tr><th>Metric</th><th>Baseline</th><th>Current</th><th>Target</th><th>Progress</th></tr></thead><tbody>${clientTargets.map(m => { const r = (m.target || 0) - (m.baseline || 0); const p = r ? Math.min(Math.max(((m.current || m.baseline || 0) - (m.baseline || 0)) / r * 100, 0), 100) : 0; return `<tr><td>${h(m.name)}</td><td>${m.baseline}${m.unit ? ' ' + h(m.unit) : ''}</td><td>${m.current || m.baseline}</td><td>${m.target}</td><td>${p.toFixed(0)}%</td></tr>`; }).join('')}</tbody></table>` : '';
    const finSec = monthlyFinancialData.length ? `<h2>Financial Summary</h2><div class="grid">${card('Total Revenue', f(totalRevenue))}${card('Total Expenses', f(monthlyFinancialData.reduce((s, m) => s + (m.expenses || 0), 0)))}${card('Net Profit', f(monthlyFinancialData.reduce((s, m) => s + (m.profit || 0), 0)))}${card('Avg Monthly Revenue', f(totalRevenue / monthlyFinancialData.length))}</div>` : '';
    const intSec = clientInterventions.length ? `<h2>Interventions Impact</h2>
      <div class="grid">${card('Total Interventions', interventionStats.total)}${card('Completed', interventionStats.completed)}${card('In Progress', interventionStats.inProgress)}${card('Avg ROI', interventionStats.avgROI != null ? interventionStats.avgROI.toFixed(1) + '%' : 'N/A')}${card('Total Investment', f(interventionStats.totalInvestment))}</div>
      ${recentCompleted.length ? `<table><thead><tr><th>Intervention</th><th>Type</th><th>Revenue Before</th><th>Revenue After</th><th>ROI</th></tr></thead><tbody>${recentCompleted.map(i => `<tr><td>${h(i.title)}</td><td>${h(INTERVENTION_TYPES[i.type]?.label || i.type)}</td><td>${i.beforeRev > 0 ? f(i.beforeRev) : 'N/A'}</td><td>${i.afterRev > 0 ? f(i.afterRev) : 'N/A'}</td><td>${i.roi != null ? (i.roi >= 0 ? '+' : '') + i.roi.toFixed(1) + '%' : 'N/A'}</td></tr>`).join('')}</tbody></table>` : ''}
      ${aggregatedBeforeAfter ? `<h3 style="margin-top:16px;font-size:14px;">Aggregated Before/After</h3><table><thead><tr><th>Metric</th><th>Before (avg)</th><th>After (avg)</th><th>Change</th></tr></thead><tbody>${aggregatedBeforeAfter.map(r => `<tr><td>${h(r.label)}</td><td>${r.key === 'revenue' ? f(r.before) : r.before}</td><td>${r.key === 'revenue' ? f(r.after) : r.after}</td><td>${r.change > 0 ? '+' : ''}${r.change}%</td></tr>`).join('')}</tbody></table>` : ''}` : '';
    const funnelSec = clientRecs.length ? `<h2>Recommendation Funnel</h2><table><thead><tr><th>Stage</th><th>Count</th></tr></thead><tbody>${recFunnel.map(s => `<tr><td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${s.color};margin-right:6px"></span>${h(s.stage)}</td><td>${s.count}</td></tr>`).join('')}</tbody></table>` : '';
    const scatterSec = interventionScatter.length ? `<h2>Intervention ROI Analysis</h2><table><thead><tr><th>Intervention</th><th>Type</th><th>Cost</th><th>ROI</th><th>Revenue Change</th></tr></thead><tbody>${interventionScatter.map(s => `<tr><td>${h(s.name)}</td><td>${h(INTERVENTION_TYPES[s.type]?.label || s.type)}</td><td>${f(s.cost)}</td><td style="color:${s.roi >= 0 ? '#22c55e' : '#ef4444'}">${s.roi >= 0 ? '+' : ''}${s.roi}%</td><td>${f(s.revChange)}</td></tr>`).join('')}</tbody></table>` : '';
    const waterfallSec = waterfallData.length ? `<h2>Revenue Waterfall</h2><table><thead><tr><th>Month</th><th>Increase</th><th>Decrease</th><th>Running Total</th></tr></thead><tbody>${waterfallData.map(w => `<tr><td>${h(w.month)}</td><td style="color:#22c55e">${w.increase > 0 ? '+' + f(w.increase) : '\u2014'}</td><td style="color:#ef4444">${w.decrease > 0 ? '-' + f(w.decrease) : '\u2014'}</td><td>${f(w.total)}</td></tr>`).join('')}</tbody></table>` : '';
    const cumSec = cumulativeData.length ? `<h2>Cumulative Revenue</h2><table><thead><tr><th>Month</th><th>Monthly Revenue</th><th>Cumulative Total</th></tr></thead><tbody>${cumulativeData.map(c => `<tr><td>${h(c.month)}</td><td>${f(c.revenue)}</td><td>${f(c.cumulative)}</td></tr>`).join('')}</tbody></table>` : '';
    if (pw) pw.document.write(`<!DOCTYPE html><html><head><title>Client Analytics - ${h(selectedClient.name)}</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#333;max-width:900px;margin:0 auto}h1{color:#1e3a5f;border-bottom:2px solid #3b82f6;padding-bottom:10px}h2{color:#374151;margin-top:30px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:15px 0}.card{background:#f9fafb;padding:14px;border-radius:8px}.card h3{margin:0 0 6px;font-size:11px;color:#6b7280;text-transform:uppercase}.card p{margin:0;font-size:18px;font-weight:bold;color:#1e3a5f}table{width:100%;border-collapse:collapse;margin:15px 0}th,td{padding:8px;text-align:left;border-bottom:1px solid #e5e7eb}th{background:#f9fafb;font-weight:600;font-size:12px}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:11px;color:#6b7280;text-align:center}@media print{body{padding:20px}}</style></head><body>
      <h1>Client Analytics Report &mdash; ${h(selectedClient.name)}</h1>
      <p>Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}${drLabel}</p>
      ${intake ? `<h2>Business Profile</h2><div class="grid">${card('Industry', h(intake.industry || 'N/A'))}${card('Years in Operation', h(intake.years_in_operation || 'N/A'))}${card('Employees', h(intake.employee_count_range || 'N/A'))}${card('Revenue', h(intake.annual_revenue_range || 'N/A'))}</div>` : ''}
      <h2>Audit Scores</h2><div class="grid">${card('Overall Score', `${h(overall)}/10${scoreDelta != null ? ` (${scoreDelta > 0 ? '+' : ''}${scoreDelta} from prior)` : ''}`)}<div class="card"><h3>Audits Completed</h3><p>${allClientAuditsCount}</p></div></div>
      ${categoryBars.length ? `<table><thead><tr><th>Category</th><th>Score</th></tr></thead><tbody>${categoryBars.map(c => `<tr><td>${h(c.category)}</td><td>${c.score}/10</td></tr>`).join('')}</tbody></table>` : '<p>No audit data available.</p>'}
      <h2>Recommendations</h2><p>Total: ${clientRecs.length} | Active: ${activeRecs.length} | Completed: ${clientRecs.filter(r => r.status === 'completed').length}</p>
      ${activeRecs.length ? `<table><thead><tr><th>Title</th><th>Priority</th><th>Status</th></tr></thead><tbody>${activeRecs.map(r => `<tr><td>${h(r.title)}</td><td>${h(r.priority)}</td><td>${h(r.status)}</td></tr>`).join('')}</tbody></table>` : ''}
      ${growthSec}${finSec}${cumSec}${intSec}${funnelSec}${scatterSec}${waterfallSec}${compSec}
      <div class="footer"><p>Three Seas Digital CRM &mdash; Client Analytics Report</p></div></body></html>`);
    if (pw) pw.document.close();
    if (pw) pw.print();
  };

  return (
    <div className="bi-analytics-dashboard">
      <div className="bi-analytics-header">
        <h2><BarChart3 size={24} /> Client Analytics</h2>
        <div className="bi-analytics-controls">
          {clientId && <button className="btn btn-primary" onClick={handlePrint} aria-label="Print analytics report"><Printer size={16} /> Print Report</button>}
        </div>
      </div>

      {/* Client Search & Filter */}
      <div className="bi-analytics-search-bar">
        <div className="bi-analytics-search-input-wrap">
          <Search size={16} />
          <input type="text" placeholder="Search clients by name or business..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bi-analytics-search-input" aria-label="Search clients" />
          <span className="bi-analytics-client-count">{filteredClients.length} clients</span>
        </div>
        <div className="bi-analytics-filter-pills">
          {QUICK_FILTERS.map(f => (
            <button key={f.key} className={`bi-analytics-pill ${quickFilter === f.key ? 'active' : ''}`} onClick={() => setQuickFilter(f.key)}>{f.label}</button>
          ))}
        </div>
        <div className="bi-analytics-selectors">
          <select value={clientId} onChange={e => { setClientId(e.target.value); setCompareClientId(''); onBiClientChange?.(e.target.value); }} className="bi-analytics-select" aria-label="Select client">
            <option value="">Select a client...</option>
            {filteredClients.map(c => <option key={c.id} value={c.id}>{c.name}{c.businessName ? ` (${c.businessName})` : ''}</option>)}
          </select>
          {clientId && (
            <button className={`btn ${compareMode ? 'btn-secondary' : 'btn-outline'}`} onClick={() => { setCompareMode(m => !m); setCompareClientId(''); }} aria-label="Toggle compare mode">
              <GitCompare size={16} /> Compare
            </button>
          )}
          {compareMode && clientId && (
            <select value={compareClientId} onChange={e => setCompareClientId(e.target.value)} className="bi-analytics-select" aria-label="Select comparison client">
              <option value="">Compare with...</option>
              {filteredClients.filter(c => c.id !== clientId).map(c => <option key={c.id} value={c.id}>{c.name}{c.businessName ? ` (${c.businessName})` : ''}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Date Range Filter */}
      {clientId && (
        <div className="bi-analytics-date-filter">
          <Calendar size={16} />
          {DATE_PRESETS.map(p => (
            <button key={p.key} className={`bi-analytics-pill ${dateRange.preset === p.key ? 'active' : ''}`} onClick={() => setDateRange(prev => ({ ...prev, preset: p.key }))}>{p.label}</button>
          ))}
          {dateRange.preset === 'custom' && (
            <div className="bi-analytics-date-pickers">
              <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} aria-label="Start date" />
              <span>to</span>
              <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} aria-label="End date" />
            </div>
          )}
        </div>
      )}

      {!clientId && (
        <Suspense fallback={<div className="tab-loading">Loading...</div>}>
          <HealthOverview biClientId={biClientId} onBiClientChange={(id) => { setClientId(id); onBiClientChange?.(id); }} />
        </Suspense>
      )}

      {clientId && (
        <>
          {/* KPI Summary Row */}
          <div className="bi-analytics-kpi-row">
            <KpiCard label="Overall Score" value={primaryOverall ? `${primaryOverall}/10` : 'N/A'} trend={scoreDelta} />
            <KpiCard label="Audits" value={allClientAuditsCount} trend={null} />
            <KpiCard label="Active Recs" value={activeRecs.length} trend={null} />
            <KpiCard label="Targets Met" value={`${targetsMet}/${clientTargets.length || 0}`} trend={null} />
            <KpiCard label="Total Revenue" value={fmt(totalRevenue)} trend={null} />
            <KpiCard label="Interventions" value={interventionStats.total} trend={null} />
          </div>

          {/* Comparison View */}
          {compareMode && compareClientId && compareClient && (
            <div className="bi-analytics-comparison-section">
              <Card title={`Comparison: ${selectedClient?.name || ''} vs ${compareClient.name}`} icon={<GitCompare size={18} />}>
                <div className="bi-analytics-comparison-grid">
                  {radarData.length > 0 ? (
                    <div className="bi-analytics-compare-chart">
                      <ResponsiveContainer width="100%" height={280}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: '#6b7280' }} />
                          <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                          <Radar name={selectedClient?.name || 'Primary'} dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                          {compareLatestAudit && <Radar name={compareClient.name} dataKey="compareScore" stroke="#f97316" fill="#f97316" fillOpacity={0.2} />}
                          <Tooltip formatter={(v) => [`${v}/10`, 'Score']} />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <EmptyState icon={<Target size={32} />} text="No audit data to compare." />}
                  <div className="bi-analytics-compare-chart">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={[{ name: selectedClient?.name || 'Primary', score: primaryOverall }, { name: compareClient.name, score: compareOverall }]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => [`${v}/10`, 'Overall Score']} />
                        <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={48}>
                          <Cell fill="#3b82f6" /><Cell fill="#f97316" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {comparisonTable.length > 0 && (
                  <table className="bi-analytics-compare-table">
                    <thead><tr><th>Category</th><th>{selectedClient?.name}</th><th>{compareClient.name}</th><th>Diff</th></tr></thead>
                    <tbody>{comparisonTable.map(row => {
                      const diff = +(row.primary - row.compare).toFixed(1);
                      return (<tr key={row.category}><td>{row.category}</td><td>{row.primary}/10</td><td>{row.compare}/10</td>
                        <td style={{ color: diff > 0 ? '#22c55e' : diff < 0 ? '#ef4444' : '#6b7280', fontWeight: 600 }}>{diff > 0 ? '+' : ''}{diff}</td></tr>);
                    })}</tbody>
                  </table>
                )}
              </Card>
            </div>
          )}

          <div className="bi-analytics-grid">
            {/* Section A: Business Profile */}
            <Card title="Business Profile" icon={<Globe size={18} />}>
              {intake ? (
                <div className="bi-analytics-profile">
                  <div className="bi-analytics-profile-grid">
                    {[['Industry', intake.industry], ['Years in Operation', intake.years_in_operation], ['Employees', intake.employee_count_range], ['Annual Revenue', intake.annual_revenue_range], ['Business Model', intake.business_model], ['Target Market', intake.target_market]].map(([lbl, val]) => (
                      <div key={lbl} className="bi-analytics-field"><span>{lbl}</span><strong>{val || '\u2014'}</strong></div>
                    ))}
                  </div>
                  <div className="bi-analytics-badges">
                    {intake.has_ssl && <span className="bi-analytics-badge bi-analytics-badge-green"><Shield size={12} /> SSL</span>}
                    {intake.is_mobile_responsive && <span className="bi-analytics-badge bi-analytics-badge-blue"><Smartphone size={12} /> Mobile Responsive</span>}
                    {intake.social_platforms?.length > 0 && intake.social_platforms.map(p => (
                      <span key={p} className="bi-analytics-badge bi-analytics-badge-purple"><Globe size={12} /> {p}</span>
                    ))}
                  </div>
                </div>
              ) : <EmptyState icon={<Inbox size={32} />} text="No intake data yet. Complete a Business Intake form first." />}
            </Card>

            {/* Section B: Audit Score Radar */}
            <Card title="Audit Score Radar" icon={<Target size={18} />}
              extra={scoreDelta !== null && (
                <span className={`bi-analytics-score-delta ${scoreDelta >= 0 ? 'positive' : 'negative'}`}>
                  {scoreDelta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {scoreDelta >= 0 ? '+' : ''}{scoreDelta} from last audit
                </span>
              )}>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Tooltip formatter={(v) => [`${v}/10`, 'Score']} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : <EmptyState icon={<Target size={32} />} text="No audit data available. Run a site audit first." />}
            </Card>

            {/* Section C: Score History */}
            <Card title="Score History" icon={<TrendingUp size={18} />}>
              {scoreHistory.length >= 2 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={scoreHistory}>
                    <defs><linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v}/10`, 'Overall Score']} />
                    <ReferenceLine y={7} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Target', fill: '#22c55e', fontSize: 11 }} />
                    <Area type="monotone" dataKey="score" stroke="#3b82f6" fill="url(#scoreGrad)" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <EmptyState icon={<TrendingUp size={32} />} text={scoreHistory.length === 1 ? 'Only one audit recorded. Run another to see trends.' : 'No audit history yet.'} />}
            </Card>

            {/* Section D: Category Breakdown */}
            <Card title="Category Breakdown" icon={<BarChart3 size={18} />}>
              {categoryBars.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={categoryBars} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip formatter={(v) => [`${v}/10`, 'Score']} />
                    <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={24} label={{ position: 'right', fontSize: 12, fill: '#374151' }}>
                      {categoryBars.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState icon={<BarChart3 size={32} />} text="No category scores available." />}
            </Card>

            {/* Section E: Recommendations */}
            <Card title="Recommendations" icon={<PieChartIcon size={18} />}>
              {clientRecs.length > 0 ? (
                <div className="bi-analytics-recs">
                  <div className="bi-analytics-recs-chart">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={recStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={3}>
                          {recStatusData.map((entry, idx) => <Cell key={idx} fill={REC_STATUS_COLORS[entry.name] || '#6b7280'} />)}
                        </Pie>
                        <Tooltip formatter={(v, name) => [v, name.replace('_', ' ')]} />
                        <Legend formatter={(v) => v.replace('_', ' ')} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="bi-analytics-recs-stats">
                      <span>Total: <strong>{clientRecs.length}</strong></span>
                      <span>Active: <strong>{activeRecs.length}</strong></span>
                      <span>Done: <strong>{clientRecs.filter(r => r.status === 'completed').length}</strong></span>
                    </div>
                  </div>
                  {activeRecs.length > 0 && (
                    <div className="bi-analytics-recs-list">
                      <h5>Active Recommendations</h5>
                      {activeRecs.slice(0, 5).map(r => (
                        <div key={r.id} className="bi-analytics-rec-item">
                          <ChevronRight size={14} />
                          <span className="bi-analytics-rec-title">{r.title}</span>
                          <span className="bi-analytics-badge" style={{ background: PRIORITY_COLORS[r.priority] + '22', color: PRIORITY_COLORS[r.priority] }}>{r.priority}</span>
                          <span className="bi-analytics-badge" style={{ background: REC_STATUS_COLORS[r.status] + '22', color: REC_STATUS_COLORS[r.status] }}>{r.status.replace('_', ' ')}</span>
                        </div>
                      ))}
                      {activeRecs.length > 5 && <p className="bi-analytics-more">+{activeRecs.length - 5} more</p>}
                    </div>
                  )}
                </div>
              ) : <EmptyState icon={<PieChartIcon size={32} />} text="No recommendations yet." />}
            </Card>

            {/* Section F: Growth Metrics */}
            <Card title="Growth Metrics" icon={<Target size={18} />}>
              {clientTargets.length > 0 ? (
                <div className="bi-analytics-growth">
                  {clientTargets.map(metric => {
                    const baseline = metric.baseline || 0, target = metric.target || 0, current = metric.current || baseline;
                    const range = target - baseline;
                    const pct = range !== 0 ? Math.min(Math.max(((current - baseline) / range) * 100, 0), 100) : 0;
                    const snaps = snapshotsMap[metric.id] || [];
                    return (
                      <div key={metric.id} className="bi-analytics-growth-item">
                        <div className="bi-analytics-growth-header">
                          <span className="bi-analytics-growth-name">{metric.name}</span>
                          <span className="bi-analytics-growth-pct">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="bi-analytics-progress-track">
                          <div className="bi-analytics-progress-fill" style={{ width: `${pct}%`, background: pct >= 100 ? '#22c55e' : '#3b82f6' }} />
                        </div>
                        <div className="bi-analytics-growth-values">
                          <span>{baseline}{metric.unit ? ` ${metric.unit}` : ''}</span>
                          <span>{current} / {target}{metric.unit ? ` ${metric.unit}` : ''}</span>
                        </div>
                        {snaps.length >= 2 && (
                          <ResponsiveContainer width="100%" height={50}>
                            <AreaChart data={snaps.map(s => ({ date: s.date, value: s.value }))}>
                              <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f622" strokeWidth={1.5} dot={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : <EmptyState icon={<Target size={32} />} text="No growth targets set for this client." />}
            </Card>

            {/* Section G: Financial Overview */}
            <Card title="Financial Overview" icon={<DollarSign size={18} />}>
              {monthlyFinancialData.length > 0 ? (
                <div className="bi-analytics-financial">
                  <div className="bi-analytics-fin-stats">
                    <div className="bi-analytics-fin-stat"><span>Total Revenue</span><strong>{fmt(totalRevenue)}</strong></div>
                    <div className="bi-analytics-fin-stat"><span>Total Expenses</span><strong>{fmt(monthlyFinancialData.reduce((s, m) => s + (m.expenses || 0), 0))}</strong></div>
                    <div className="bi-analytics-fin-stat"><span>Profit Margin</span><strong>{totalRevenue > 0 ? `${(((totalRevenue - monthlyFinancialData.reduce((s, m) => s + (m.expenses || 0), 0)) / totalRevenue) * 100).toFixed(1)}%` : '\u2014'}</strong></div>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={monthlyFinancialData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => [fmt(v)]} /><Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Expenses" />
                      <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Profit" />
                    </LineChart>
                  </ResponsiveContainer>
                  {/* Cumulative Revenue */}
                  {cumulativeData.length >= 2 && (
                    <div className="bi-analytics-cumulative">
                      <h5 style={{ margin: '16px 0 8px', fontSize: 13, color: '#374151' }}>Cumulative Revenue</h5>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={cumulativeData}>
                          <defs>
                            <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                          <Tooltip formatter={(v) => [fmt(v)]} />
                          <Area type="monotone" dataKey="cumulative" stroke="#3b82f6" fill="url(#cumGrad)" strokeWidth={2} name="Cumulative Revenue" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : <EmptyState icon={<DollarSign size={32} />} text="No financial data yet." />}
            </Card>

            {/* Section H: Interventions Impact */}
            <Card title="Interventions Impact" icon={<Crosshair size={18} />}>
              {clientInterventions.length > 0 ? (
                <div className="bi-analytics-interventions">
                  {/* KPI mini-cards */}
                  <div className="bi-analytics-interventions-kpis">
                    <div className="bi-analytics-fin-stat"><span>Total</span><strong>{interventionStats.total}</strong></div>
                    <div className="bi-analytics-fin-stat"><span>Completed</span><strong>{interventionStats.completed}</strong></div>
                    <div className="bi-analytics-fin-stat"><span>In Progress</span><strong>{interventionStats.inProgress}</strong></div>
                    <div className="bi-analytics-fin-stat"><span>Avg ROI</span><strong>{interventionStats.avgROI != null ? `${interventionStats.avgROI.toFixed(1)}%` : '\u2014'}</strong></div>
                    <div className="bi-analytics-fin-stat"><span>Total Investment</span><strong>{fmt(interventionStats.totalInvestment)}</strong></div>
                  </div>

                  {/* Type breakdown stacked bar chart */}
                  {interventionTypeData.length > 0 && (
                    <div className="bi-analytics-interventions-chart">
                      <h5 style={{ margin: '16px 0 8px', fontSize: 13, color: '#374151' }}>Interventions by Type</h5>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={interventionTypeData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="type" tick={{ fontSize: 11 }} tickFormatter={t => INTERVENTION_TYPES[t]?.label || t} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v, name) => [v, name.replace('_', ' ')]} labelFormatter={t => INTERVENTION_TYPES[t]?.label || t} />
                          <Legend formatter={(v) => v.replace('_', ' ')} />
                          <Bar dataKey="completed" stackId="a" fill="#22c55e" name="completed" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="in_progress" stackId="a" fill="#f59e0b" name="in_progress" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="planned" stackId="a" fill="#3b82f6" name="planned" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="paused" stackId="a" fill="#9ca3af" name="paused" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Recent completed interventions */}
                  {recentCompleted.length > 0 && (
                    <div className="bi-analytics-interventions-list">
                      <h5 style={{ margin: '16px 0 8px', fontSize: 13, color: '#374151' }}>Recent Completed Interventions</h5>
                      {recentCompleted.map(i => (
                        <div key={i.id} className="bi-analytics-rec-item" style={{ flexWrap: 'wrap', gap: 6 }}>
                          <ChevronRight size={14} />
                          <span className="bi-analytics-rec-title" style={{ flex: '1 1 auto' }}>{i.title}</span>
                          <span className="bi-analytics-badge" style={{ background: (INTERVENTION_TYPES[i.type]?.color || '#6b7280') + '22', color: INTERVENTION_TYPES[i.type]?.color || '#6b7280' }}>
                            {INTERVENTION_TYPES[i.type]?.label || i.type}
                          </span>
                          {i.beforeRev > 0 && i.afterRev > 0 && (
                            <span style={{ fontSize: 12, color: i.revChange >= 0 ? '#22c55e' : '#ef4444' }}>
                              {fmt(i.beforeRev)} {'\u2192'} {fmt(i.afterRev)} ({i.revChange >= 0 ? '+' : ''}{fmt(i.revChange)})
                            </span>
                          )}
                          {i.roi != null && (
                            <span className="bi-analytics-badge" style={{ background: i.roi >= 0 ? '#22c55e22' : '#ef444422', color: i.roi >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                              ROI: {i.roi >= 0 ? '+' : ''}{i.roi.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Aggregated before/after comparison */}
                  {aggregatedBeforeAfter && (
                    <div className="bi-analytics-interventions-comparison">
                      <h5 style={{ margin: '16px 0 8px', fontSize: 13, color: '#374151' }}>Aggregated Before / After (Completed Interventions)</h5>
                      <table className="bi-analytics-compare-table">
                        <thead><tr><th>Metric</th><th>Before (avg)</th><th>After (avg)</th><th>Change</th></tr></thead>
                        <tbody>
                          {aggregatedBeforeAfter.map(row => {
                            const positive = row.isInverse ? row.change < 0 : row.change > 0;
                            return (
                              <tr key={row.key}>
                                <td>{row.label}</td>
                                <td>{row.key === 'revenue' ? fmt(row.before) : row.before}</td>
                                <td>{row.key === 'revenue' ? fmt(row.after) : row.after}</td>
                                <td style={{ color: positive ? '#22c55e' : row.change === 0 ? '#6b7280' : '#ef4444', fontWeight: 600 }}>
                                  {row.change > 0 ? '+' : ''}{row.change}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : <EmptyState icon={<Crosshair size={32} />} text="No interventions recorded for this client." />}
            </Card>

            {/* Section I: Recommendation Funnel */}
            <Card title="Recommendation Funnel" icon={<Target size={18} />}>
              {clientRecs.length > 0 ? (
                <div className="bi-analytics-funnel-wrap">
                  <div className="bi-analytics-funnel">
                    {recFunnel.map((stage, i) => (
                      <div
                        key={stage.stage}
                        className="bi-analytics-funnel-stage"
                        style={{
                          width: `${100 - (i * 15)}%`,
                          background: stage.color,
                        }}
                      >
                        <span className="bi-analytics-funnel-label">{stage.stage}</span>
                        <span className="bi-analytics-funnel-count">{stage.count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bi-analytics-funnel-legend">
                    {recFunnel.map(stage => (
                      <div key={stage.stage} className="bi-analytics-funnel-legend-item">
                        <span className="bi-analytics-funnel-dot" style={{ background: stage.color }} />
                        <span>{stage.stage}: {stage.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <EmptyState icon={<Target size={32} />} text="No recommendations to visualize." />}
            </Card>

            {/* Section J: Intervention ROI Scatter Plot */}
            <Card title="Intervention ROI Analysis" icon={<Crosshair size={18} />}>
              {interventionScatter.length > 0 ? (
                <div className="bi-analytics-scatter-wrap">
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" dataKey="cost" name="Cost" tick={{ fontSize: 11 }} tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} label={{ value: 'Investment ($)', position: 'insideBottom', offset: -5, fontSize: 12, fill: '#6b7280' }} />
                      <YAxis type="number" dataKey="roi" name="ROI" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#6b7280' }} />
                      <ZAxis type="number" dataKey="revChange" range={[60, 400]} name="Revenue Change" />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value, name) => {
                          if (name === 'Cost') return [fmt(value), name];
                          if (name === 'ROI') return [`${value}%`, name];
                          if (name === 'Revenue Change') return [fmt(value), name];
                          return [value, name];
                        }}
                        labelFormatter={() => ''}
                        content={({ payload }) => {
                          if (!payload?.length) return null;
                          const d = payload[0]?.payload;
                          if (!d) return null;
                          return (
                            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                              <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 13 }}>{d.name}</p>
                              <p style={{ margin: '2px 0', fontSize: 12, color: '#6b7280' }}>Type: {INTERVENTION_TYPES[d.type]?.label || d.type}</p>
                              <p style={{ margin: '2px 0', fontSize: 12 }}>Cost: {fmt(d.cost)}</p>
                              <p style={{ margin: '2px 0', fontSize: 12, color: d.roi >= 0 ? '#22c55e' : '#ef4444' }}>ROI: {d.roi >= 0 ? '+' : ''}{d.roi}%</p>
                              <p style={{ margin: '2px 0', fontSize: 12 }}>Revenue Change: {fmt(d.revChange)}</p>
                            </div>
                          );
                        }}
                      />
                      <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Break Even', fill: '#ef4444', fontSize: 11, position: 'right' }} />
                      <Scatter data={interventionScatter} name="Interventions">
                        {interventionScatter.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} fillOpacity={0.8} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                  <div className="bi-analytics-scatter-legend">
                    {Object.entries(INTERVENTION_TYPES).map(([key, cfg]) => {
                      const has = interventionScatter.some(s => s.type === key);
                      if (!has) return null;
                      return (
                        <div key={key} className="bi-analytics-scatter-legend-item">
                          <span className="bi-analytics-funnel-dot" style={{ background: cfg.color }} />
                          <span>{cfg.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : <EmptyState icon={<Crosshair size={32} />} text="No completed interventions with cost data to plot." />}
            </Card>

            {/* Section K: Revenue Waterfall Chart */}
            <Card title="Revenue Waterfall" icon={<DollarSign size={18} />}>
              {waterfallData.length > 0 ? (
                <div className="bi-analytics-waterfall-wrap">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={waterfallData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === 'base') return [null, null];
                          return [fmt(value), name];
                        }}
                        labelFormatter={label => label}
                      />
                      <Legend formatter={v => v === 'base' ? '' : v} />
                      <Bar dataKey="base" stackId="stack" fill="transparent" name="base" legendType="none" />
                      <Bar dataKey="increase" stackId="stack" fill="#22c55e" radius={[4, 4, 0, 0]} name="Increase" />
                      <Bar dataKey="decrease" stackId="stack" fill="#ef4444" radius={[4, 4, 0, 0]} name="Decrease" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyState icon={<DollarSign size={32} />} text="No financial data for waterfall chart." />}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
