import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Activity, TrendingUp, TrendingDown, DollarSign, Users, Briefcase,
  Save, Printer, ChevronDown, ChevronRight, RefreshCw, Plus, Trash2,
  Target, Camera, RotateCcw, Pin, PinOff, Info, Edit3, Undo2,
  Star, Gauge, Shield, Tag, Calendar,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend,
} from 'recharts';
import { useAppContext } from '../../../context/AppContext';
import { safeGetItem, safeSetItem, generateId, escapeHtml } from '../../../constants';
import { syncToApi } from '../../../api/apiSync';
import {
  calcRevenueGrowthRate, calcAOV, calcARPU, calcRevenueConcentration,
  calcWinRate, calcAvgDealSize, calcSalesCycleLength,
  calcLeadConversionRate, calcGrossMargin, calcDSO, calcRevenuePerFTE,
  calcProjectCompletionRate, calcDataCompleteness, calcPipelineCoverage,
  calcTotalRevenue, calcGrossProfitPerFTE,
  fmtCurrency, fmtPct,
} from './auditMetrics';
import {
  TIER_META, AUTO_COMPUTE_IDS, UNIVERSAL_KPIS, CUSTOM_KPIS,
  resolveIndustry, getIndustryPack, getAllKpisForClient,
  getIndustryKpisByTier, getUniversalByCategory,
} from './kpiRegistry';

const KPI_KEY = 'threeseas_bi_kpi_snapshots';
const INTAKES_KEY = 'threeseas_bi_intakes';
const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];

const TIER_ICONS = { north_star: Star, driver: Gauge, guardrail: Shield, universal: Activity, custom: Tag };

const KPI_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#14b8a6', '#ec4899', '#f97316', '#6366f1', '#10b981',
];

/** Tooltip — hover to show description */
const Tooltip = ({ text, children }) => (
  <span className="bi-kpi-dash-tooltip">
    {children}
    <span className="bi-kpi-dash-tooltip-text">{text}</span>
  </span>
);

function formatValue(value, unit) {
  if (value === null || value === undefined) return '—';
  switch (unit) {
    case '$': return fmtCurrency(value);
    case '%': return fmtPct(value);
    case 'days': return `${Math.round(value)} days`;
    case 'ratio': return `${Number(value).toFixed(2)}x`;
    default: return Number(value).toFixed(1);
  }
}

function calcDelta(current, baseline) {
  if (baseline === null || baseline === undefined || baseline === 0 || current === null || current === undefined) return null;
  return ((current - baseline) / Math.abs(baseline)) * 100;
}

function getStatus(current, target, unit) {
  if (current === null || target === null || target === undefined || target === 0) return 'neutral';
  const lowerIsBetter = unit === 'days';
  const ratio = lowerIsBetter ? target / current : current / target;
  if (ratio >= 1) return 'on-track';
  if (ratio >= 0.9) return 'warning';
  return 'behind';
}

/** Mini sparkline SVG */
function Sparkline({ data, width = 60, height = 20 }) {
  if (!data || data.length < 2) return <span className="bi-kpi-dash-sparkline-empty">—</span>;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const trend = data[data.length - 1] >= data[0];
  return (
    <svg className="bi-kpi-dash-sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={points} fill="none" stroke={trend ? '#22c55e' : '#ef4444'} strokeWidth="1.5" />
    </svg>
  );
}

function defaultClientData() {
  return { kpis: {}, snapshots: [], config: { activePeriod: 'monthly', pinnedKpis: [] } };
}

export default function KPIDashboard({ biClientId, onBiClientChange }) {
  const { payments, clients, prospects, leads, expenses, users } = useAppContext();
  const intakes = useMemo(() => safeGetItem(INTAKES_KEY, {}), []);
  const activeClients = clients.filter(c => c.status !== 'archived' && c.status !== 'rejected');

  const [clientId, setClientId] = useState(biClientId || '');
  const [allData, setAllData] = useState(() => safeGetItem(KPI_KEY, {}));
  const [expandedSections, setExpandedSections] = useState(new Set(['north_star', 'driver', 'guardrail']));
  const [saveMsg, setSaveMsg] = useState('');
  const [lastComputed, setLastComputed] = useState(null);
  const [viewingSnapshotIdx, setViewingSnapshotIdx] = useState(null);

  useEffect(() => {
    if (biClientId && biClientId !== clientId) setClientId(biClientId);
  }, [biClientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const clientData = useMemo(() => clientId ? (allData[clientId] || null) : null, [clientId, allData]);
  const activePeriod = clientData?.config?.activePeriod || 'monthly';
  const pinnedKpis = clientData?.config?.pinnedKpis || [];

  // Reset snapshot view when client or period changes
  useEffect(() => { setViewingSnapshotIdx(null); }, [clientId, activePeriod]);

  // --- Industry detection from intake ---
  const clientIndustry = useMemo(() => {
    if (!clientId) return null;
    const intake = intakes[clientId];
    return intake?.industry ? resolveIndustry(intake.industry) : null;
  }, [clientId, intakes]);

  const industryPack = useMemo(() => getIndustryPack(clientIndustry), [clientIndustry]);
  const industryTiers = useMemo(() => getIndustryKpisByTier(clientIndustry), [clientIndustry]);
  const universalByCategory = useMemo(() => getUniversalByCategory(), []);
  const allKpis = useMemo(() => getAllKpisForClient(clientIndustry), [clientIndustry]);

  // --- Filter CRM data to selected client ---
  const selectedClient = useMemo(() => clients.find(c => c.id === clientId), [clients, clientId]);
  const clientArr = useMemo(() => selectedClient ? [selectedClient] : clients, [selectedClient, clients]);
  const clientPayments = useMemo(() => clientId ? payments.filter(p => p.clientId === clientId) : payments, [payments, clientId]);
  const clientExpenses = useMemo(() => clientId ? expenses.filter(e => e.clientId === clientId) : expenses, [expenses, clientId]);
  const clientProspects = useMemo(() => clientId ? prospects.filter(p => p.clientId === clientId) : prospects, [prospects, clientId]);
  const clientLeads = useMemo(() => clientId ? leads.filter(l => l.clientId === clientId) : leads, [leads, clientId]);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const priorMonth = (() => { const d = new Date(now); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; })();
  const currentYear = now.getFullYear();

  // --- Auto-compute values for KPIs that have auditMetrics functions ---
  const computedValues = useMemo(() => {
    const pipelineTarget = clientData?.kpis?.pipeline_coverage?.target || 0;
    return {
      total_revenue: calcTotalRevenue(clientPayments, currentYear),
      revenue_growth: calcRevenueGrowthRate(clientPayments, currentMonth, priorMonth),
      aov: calcAOV(clientPayments),
      arpu: calcARPU(clientPayments, clientArr),
      revenue_concentration: calcRevenueConcentration(clientPayments, 3),
      win_rate: calcWinRate(clientProspects),
      avg_deal_size: calcAvgDealSize(clientProspects),
      sales_cycle: calcSalesCycleLength(clientProspects),
      lead_conversion: calcLeadConversionRate(clientLeads, clientArr, clientProspects),
      pipeline_coverage: calcPipelineCoverage(clientProspects, pipelineTarget),
      gross_margin: calcGrossMargin(clientPayments, clientExpenses),
      dso: calcDSO(clientArr),
      rev_per_fte: calcRevenuePerFTE(clientPayments, users),
      gp_per_fte: calcGrossProfitPerFTE(clientPayments, clientExpenses, users),
      project_completion: calcProjectCompletionRate(clientArr),
      data_completeness: calcDataCompleteness(clientArr, intakes),
    };
  }, [clientPayments, clientArr, clientProspects, clientLeads, clientExpenses, users, intakes, currentMonth, priorMonth, currentYear, clientData]);

  // --- Value resolution: manual override → auto-computed → stored ---
  const getKpiValue = useCallback((kpiId) => {
    const kpiData = clientData?.kpis?.[kpiId];
    if (kpiData?.manualOverride !== undefined && kpiData.manualOverride !== null) return kpiData.manualOverride;
    if (AUTO_COMPUTE_IDS.has(kpiId) && computedValues[kpiId] !== undefined) return computedValues[kpiId];
    return kpiData?.current ?? null;
  }, [computedValues, clientData]);

  const hasManualOverride = useCallback((kpiId) => {
    const kpiData = clientData?.kpis?.[kpiId];
    return kpiData?.manualOverride !== undefined && kpiData.manualOverride !== null;
  }, [clientData]);

  const getSnapshotTrend = useCallback((kpiId) => {
    if (!clientData?.snapshots) return [];
    return clientData.snapshots
      .filter(s => s.period === activePeriod)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(s => s.values?.[kpiId] ?? null)
      .filter(v => v !== null);
  }, [clientData, activePeriod]);

  // --- Snapshot history (all snapshots, newest first) ---
  const allSnapshots = useMemo(() => {
    if (!clientData?.snapshots) return [];
    return clientData.snapshots
      .map((s, i) => ({ ...s, _idx: i }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [clientData]);

  const getDisplayValue = useCallback((kpiId) => {
    if (viewingSnapshotIdx !== null && clientData?.snapshots?.[viewingSnapshotIdx]) {
      return clientData.snapshots[viewingSnapshotIdx].values?.[kpiId] ?? null;
    }
    return getKpiValue(kpiId);
  }, [viewingSnapshotIdx, clientData, getKpiValue]);

  const updateSnapshotValue = useCallback((kpiId, value) => {
    if (viewingSnapshotIdx === null || !clientId) return;
    const parsed = value === '' ? null : parseFloat(value);
    setAllData(prev => {
      const cd = prev[clientId];
      if (!cd) return prev;
      const snapshots = [...cd.snapshots];
      const snap = { ...snapshots[viewingSnapshotIdx] };
      snap.values = { ...snap.values, [kpiId]: parsed };
      snapshots[viewingSnapshotIdx] = snap;
      return { ...prev, [clientId]: { ...cd, snapshots } };
    });
  }, [viewingSnapshotIdx, clientId]);

  // --- Persist helpers ---
  const persistData = useCallback((updated) => {
    setAllData(updated);
    safeSetItem(KPI_KEY, JSON.stringify(updated));
  }, []);

  const saveMsgTimer = useRef(null);
  const showSaveMsg = useCallback((msg) => {
    setSaveMsg(msg);
    if (saveMsgTimer.current) clearTimeout(saveMsgTimer.current);
    saveMsgTimer.current = setTimeout(() => setSaveMsg(''), 2000);
  }, []);

  const initClient = () => {
    if (!clientId) return;
    const data = defaultClientData();
    // Seed auto-computable KPIs
    allKpis.forEach(kpi => {
      if (AUTO_COMPUTE_IDS.has(kpi.id) && computedValues[kpi.id] !== undefined) {
        data.kpis[kpi.id] = {
          baseline: computedValues[kpi.id], baselineDate: new Date().toISOString(),
          current: computedValues[kpi.id], lastUpdated: new Date().toISOString(),
          target: null, unit: kpi.unit, customLabel: null,
        };
      }
    });
    // Set default pinned KPIs from industry North Stars
    if (industryTiers.north_star.length > 0) {
      data.config.pinnedKpis = industryTiers.north_star.map(k => k.id);
    }
    // Seed from intake revenue data
    const intake = intakes[clientId];
    if (intake?.annual_revenue_range) {
      const match = String(intake.annual_revenue_range).replace(/[^0-9]/g, '');
      if (match) {
        const seed = parseInt(match, 10);
        if (seed > 0 && data.kpis.total_revenue) data.kpis.total_revenue.baseline = data.kpis.total_revenue.baseline || seed;
      }
    }
    // Auto-take first snapshot so charts have a starting data point
    const initValues = {};
    allKpis.forEach(kpi => {
      const v = AUTO_COMPUTE_IDS.has(kpi.id) ? computedValues[kpi.id] : (data.kpis[kpi.id]?.current ?? null);
      if (v !== null && v !== undefined) initValues[kpi.id] = v;
    });
    data.snapshots = [{ date: new Date().toISOString(), values: initValues, period: data.config.activePeriod }];
    persistData({ ...allData, [clientId]: data });
    showSaveMsg('Initialized!');
  };

  const takeSnapshot = () => {
    if (!clientId || !clientData) return;
    const values = {};
    allKpis.forEach(kpi => { const v = getKpiValue(kpi.id); if (v !== null && v !== undefined) values[kpi.id] = v; });
    const snapshot = { date: new Date().toISOString(), values, period: activePeriod };
    persistData({ ...allData, [clientId]: { ...clientData, snapshots: [...(clientData.snapshots || []), snapshot] } });
    showSaveMsg('Snapshot saved!');
  };

  const refreshAll = () => {
    if (!clientId || !clientData) return;
    const updatedKpis = { ...clientData.kpis };
    allKpis.forEach(kpi => {
      if (AUTO_COMPUTE_IDS.has(kpi.id) && computedValues[kpi.id] !== undefined) {
        updatedKpis[kpi.id] = { ...(updatedKpis[kpi.id] || {}), current: computedValues[kpi.id], lastUpdated: new Date().toISOString(), unit: kpi.unit };
      }
    });
    persistData({ ...allData, [clientId]: { ...clientData, kpis: updatedKpis } });
    setLastComputed(new Date().toISOString());
    showSaveMsg('Refreshed!');
  };

  const setBaseline = (kpiId) => {
    if (!clientId || !clientData) return;
    const current = getKpiValue(kpiId);
    const updatedKpis = { ...clientData.kpis, [kpiId]: { ...(clientData.kpis[kpiId] || {}), baseline: current, baselineDate: new Date().toISOString() } };
    persistData({ ...allData, [clientId]: { ...clientData, kpis: updatedKpis } });
    showSaveMsg('Baseline set!');
  };

  const resetBaseline = (kpiId) => {
    if (!clientId || !clientData) return;
    const updatedKpis = { ...clientData.kpis, [kpiId]: { ...(clientData.kpis[kpiId] || {}), baseline: null, baselineDate: null } };
    persistData({ ...allData, [clientId]: { ...clientData, kpis: updatedKpis } });
    showSaveMsg('Baseline reset!');
  };

  const updateTarget = (kpiId, value) => {
    if (!clientId || !clientData) return;
    const updatedKpis = { ...clientData.kpis, [kpiId]: { ...(clientData.kpis[kpiId] || {}), target: value === '' ? null : parseFloat(value), lastUpdated: new Date().toISOString() } };
    persistData({ ...allData, [clientId]: { ...clientData, kpis: updatedKpis } });
  };

  const updateManualOverride = (kpiId, value) => {
    if (!clientId || !clientData) return;
    const parsed = value === '' ? null : parseFloat(value);
    const updatedKpis = { ...clientData.kpis, [kpiId]: { ...(clientData.kpis[kpiId] || {}), manualOverride: parsed, current: parsed, lastUpdated: new Date().toISOString() } };
    persistData({ ...allData, [clientId]: { ...clientData, kpis: updatedKpis } });
  };

  const clearManualOverride = (kpiId) => {
    if (!clientId || !clientData) return;
    const existing = clientData.kpis[kpiId] || {};
    const { manualOverride, ...rest } = existing;
    const updatedKpis = { ...clientData.kpis, [kpiId]: { ...rest, manualOverride: null, lastUpdated: new Date().toISOString() } };
    persistData({ ...allData, [clientId]: { ...clientData, kpis: updatedKpis } });
    showSaveMsg('Reverted to auto!');
  };

  const updateBaselineValue = (kpiId, value) => {
    if (!clientId || !clientData) return;
    const updatedKpis = { ...clientData.kpis, [kpiId]: { ...(clientData.kpis[kpiId] || {}), baseline: value === '' ? null : parseFloat(value), baselineDate: new Date().toISOString(), lastUpdated: new Date().toISOString() } };
    persistData({ ...allData, [clientId]: { ...clientData, kpis: updatedKpis } });
  };

  const updateCustomLabel = (kpiId, label) => {
    if (!clientId || !clientData) return;
    const updatedKpis = { ...clientData.kpis, [kpiId]: { ...(clientData.kpis[kpiId] || {}), customLabel: label } };
    persistData({ ...allData, [clientId]: { ...clientData, kpis: updatedKpis } });
  };

  const updateCustomUnit = (kpiId, unit) => {
    if (!clientId || !clientData) return;
    const updatedKpis = { ...clientData.kpis, [kpiId]: { ...(clientData.kpis[kpiId] || {}), unit } };
    persistData({ ...allData, [clientId]: { ...clientData, kpis: updatedKpis } });
  };

  const setPeriod = (period) => {
    if (!clientId || !clientData) return;
    persistData({ ...allData, [clientId]: { ...clientData, config: { ...clientData.config, activePeriod: period } } });
  };

  const togglePin = (kpiId) => {
    if (!clientId || !clientData) return;
    const current = clientData.config?.pinnedKpis || [];
    const next = current.includes(kpiId) ? current.filter(k => k !== kpiId) : [...current, kpiId].slice(0, 6);
    persistData({ ...allData, [clientId]: { ...clientData, config: { ...clientData.config, pinnedKpis: next } } });
  };

  const handleSave = useCallback(() => {
    setAllData(prev => {
      let dataToSave = prev;
      // Only create new snapshot when viewing current (live), not historical
      const cd = clientId ? prev[clientId] : null;
      if (clientId && cd && viewingSnapshotIdx === null) {
        const values = {};
        allKpis.forEach(kpi => { const v = getKpiValue(kpi.id); if (v !== null && v !== undefined) values[kpi.id] = v; });
        const snapshot = { date: new Date().toISOString(), values, period: activePeriod };
        dataToSave = { ...prev, [clientId]: { ...cd, snapshots: [...(cd.snapshots || []), snapshot] } };
      }
      safeSetItem(KPI_KEY, JSON.stringify(dataToSave));
      syncToApi(() => Promise.resolve(), 'kpi-dashboard-save');
      return dataToSave;
    });
    showSaveMsg(viewingSnapshotIdx !== null ? 'Snapshot edits saved!' : 'Saved + Snapshot!');
  }, [clientId, viewingSnapshotIdx, allKpis, getKpiValue, activePeriod]);

  const toggleSection = (key) => {
    setExpandedSections(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  };

  // --- Print report ---
  const printReport = () => {
    if (!clientData) return;
    const clientName = escapeHtml(selectedClient?.name || 'All Clients');
    const industryLabel = escapeHtml(clientIndustry || 'General');
    const rows = allKpis.map(kpi => {
      const val = getKpiValue(kpi.id);
      const kpiData = clientData.kpis?.[kpi.id] || {};
      const baseline = kpiData.baseline;
      const target = kpiData.target;
      const unit = kpiData.unit || kpi.unit;
      const label = escapeHtml(kpiData.customLabel || kpi.label);
      const delta = calcDelta(val, baseline);
      const status = getStatus(val, target, unit);
      const tierLabel = TIER_META[kpi.tier]?.label || kpi.tier;
      return `<tr>
        <td>${label}</td><td>${tierLabel}</td><td>${formatValue(baseline, unit)}</td>
        <td>${formatValue(val, unit)}</td><td>${target != null ? formatValue(target, unit) : '—'}</td>
        <td style="color:${delta !== null ? (delta >= 0 ? '#22c55e' : '#ef4444') : '#9ca3af'}">${delta !== null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%` : '—'}</td>
        <td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${status === 'on-track' ? '#22c55e' : status === 'warning' ? '#f59e0b' : status === 'behind' ? '#ef4444' : '#9ca3af'}"></span> ${status}</td>
      </tr>`;
    }).join('');
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>KPI Dashboard — ${clientName}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;color:#1a1a2e}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:0.85rem}th{background:#f5f5f5;font-weight:600}h1{color:#0a2540;margin-bottom:4px}.meta{color:#6b7280;margin-bottom:16px;font-size:0.9rem}tr:nth-child(even){background:#fafafa}</style>
      </head><body><h1>KPI Dashboard — ${clientName}</h1>
      <p class="meta">Industry: ${industryLabel} | Period: ${activePeriod} | Generated: ${new Date().toLocaleDateString()}</p>
      <table><thead><tr><th>KPI</th><th>Tier</th><th>Baseline</th><th>Current</th><th>Target</th><th>Change</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`);
    w.document.close();
    w.print();
  };

  // --- Shared KPI table renderer ---
  const renderKpiTable = (kpis, tierKey) => {
    if (!kpis || kpis.length === 0) return null;
    return (
      <table className="bi-kpi-dash-table">
        <thead>
          <tr><th>KPI</th><th>Baseline</th><th>Current</th><th>Target</th><th>Change</th><th>Trend</th><th>Status</th><th>Updated</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {kpis.map(kpi => {
            const isHistorical = viewingSnapshotIdx !== null;
            const val = getDisplayValue(kpi.id);
            const kpiData = clientData?.kpis?.[kpi.id] || {};
            const baseline = kpiData.baseline;
            const target = kpiData.target;
            const unit = kpiData.unit || kpi.unit;
            const delta = calcDelta(val, baseline);
            const status = getStatus(val, target, unit);
            const trend = getSnapshotTrend(kpi.id);
            const isPinned = pinnedKpis.includes(kpi.id);
            const isCustom = kpi.tier === 'custom';
            const isOverridden = hasManualOverride(kpi.id);
            const isAutoCompute = AUTO_COMPUTE_IDS.has(kpi.id);
            const label = kpiData.customLabel || kpi.label;
            const computedVal = isAutoCompute ? computedValues[kpi.id] : null;

            return (
              <tr key={kpi.id} className={`bi-kpi-dash-row status-${status}`}>
                <td className="bi-kpi-dash-name">
                  {isCustom ? (
                    <input type="text" className="bi-kpi-dash-custom-label" value={label} onChange={e => updateCustomLabel(kpi.id, e.target.value)} placeholder="Custom KPI name..." />
                  ) : (
                    <span>{label}</span>
                  )}
                  <Tooltip text={kpi.desc}><Info size={13} className="bi-kpi-dash-info-icon" /></Tooltip>
                  {!isHistorical && isAutoCompute && !isOverridden && <span className="bi-kpi-dash-auto-badge">auto</span>}
                  {!isHistorical && isOverridden && <span className="bi-kpi-dash-manual-badge">manual</span>}
                </td>
                <td>
                  <input type="number" className="bi-kpi-dash-baseline-input" value={baseline ?? ''} onChange={e => updateBaselineValue(kpi.id, e.target.value)}
                    placeholder={isAutoCompute && computedVal ? String(Math.round(computedVal * 100) / 100) : '—'} title="Baseline value" />
                </td>
                <td className="bi-kpi-dash-current">
                  {isHistorical ? (
                    <input type="number" className="bi-kpi-dash-value-input bi-kpi-dash-snapshot-input"
                      value={val ?? ''} onChange={e => updateSnapshotValue(kpi.id, e.target.value)}
                      title="Snapshot value — editable" />
                  ) : (
                    <div className="bi-kpi-dash-current-cell">
                      <input type="number" className={`bi-kpi-dash-value-input ${isOverridden ? 'overridden' : ''}`}
                        value={isOverridden ? (kpiData.manualOverride ?? '') : (val ?? '')}
                        onChange={e => updateManualOverride(kpi.id, e.target.value)}
                        placeholder={isAutoCompute && computedVal !== null ? formatValue(computedVal, unit) : '—'}
                        title={isAutoCompute ? `Auto: ${formatValue(computedVal, unit)} — type to override` : 'Enter value'} />
                      {isAutoCompute && isOverridden && (
                        <button className="bi-kpi-dash-revert-btn" onClick={() => clearManualOverride(kpi.id)}
                          title={`Revert to auto: ${formatValue(computedVal, unit)}`} aria-label="Revert to auto-computed"><Undo2 size={11} /></button>
                      )}
                    </div>
                  )}
                </td>
                <td>
                  <input type="number" className="bi-kpi-dash-target-input" value={target ?? ''} onChange={e => updateTarget(kpi.id, e.target.value)} placeholder="—" title="Target value" />
                </td>
                <td>{delta !== null ? <span className={`bi-kpi-dash-delta ${delta >= 0 ? 'positive' : 'negative'}`}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)}%</span> : '—'}</td>
                <td><Sparkline data={trend} /></td>
                <td><span className={`bi-kpi-dash-status ${status}`}><span className="bi-kpi-dash-status-dot" />{status === 'on-track' ? 'On Track' : status === 'warning' ? 'Warning' : status === 'behind' ? 'Behind' : '—'}</span></td>
                <td className="bi-kpi-dash-date">
                  {kpiData.lastUpdated ? (
                    <span title={new Date(kpiData.lastUpdated).toLocaleString()}>{new Date(kpiData.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
                  ) : '—'}
                </td>
                <td className="bi-kpi-dash-actions">
                  <button className="btn-sm bi-kpi-dash-action-btn" onClick={() => togglePin(kpi.id)} title={isPinned ? 'Unpin' : 'Pin to summary'} aria-label={isPinned ? 'Unpin KPI' : 'Pin KPI'}>
                    {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                  </button>
                  {baseline !== null && baseline !== undefined ? (
                    <button className="btn-sm bi-kpi-dash-action-btn" onClick={() => resetBaseline(kpi.id)} title="Reset baseline" aria-label="Reset baseline"><RotateCcw size={12} /></button>
                  ) : (
                    <button className="btn-sm bi-kpi-dash-action-btn" onClick={() => setBaseline(kpi.id)} title="Set current as baseline" aria-label="Set baseline"><Target size={12} /></button>
                  )}
                  {isCustom && (
                    <select className="bi-kpi-dash-unit-select" value={unit} onChange={e => updateCustomUnit(kpi.id, e.target.value)}>
                      <option value="#">#</option><option value="$">$</option><option value="%">%</option><option value="days">days</option><option value="ratio">ratio</option>
                    </select>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  // --- Shared chart renderer ---
  const renderChart = (kpis, chartType) => {
    const periodSnaps = (clientData?.snapshots || [])
      .filter(s => s.period === activePeriod)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // When < 2 snapshots, show a Baseline vs Current vs Target grouped bar chart
    if (periodSnaps.length < 2) {
      const comparisonData = kpis.map(kpi => {
        const kpiData = clientData?.kpis?.[kpi.id] || {};
        const label = kpiData.customLabel || kpi.label;
        const current = getKpiValue(kpi.id);
        return {
          name: label.length > 18 ? label.slice(0, 16) + '…' : label,
          Baseline: kpiData.baseline ?? 0,
          Current: current ?? 0,
          Target: kpiData.target ?? 0,
        };
      }).filter(d => d.Baseline || d.Current || d.Target);
      if (comparisonData.length === 0) return (
        <div className="bi-kpi-dash-chart-empty"><p>Enter baseline, current, or target values to see charts.</p></div>
      );
      return (
        <div className="bi-kpi-dash-chart">
          <div className="bi-kpi-dash-chart-label">Baseline vs Current vs Target</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={comparisonData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} width={48} />
              <RTooltip contentStyle={{ fontSize: '0.78rem', borderRadius: 6, border: '1px solid #e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: '0.72rem' }} />
              <Bar dataKey="Baseline" fill="#94a3b8" radius={[3, 3, 0, 0]} barSize={14} />
              <Bar dataKey="Current" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={14} />
              <Bar dataKey="Target" fill="#22c55e" radius={[3, 3, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
          <p className="bi-kpi-dash-chart-hint">Save more snapshots to see trend charts over time.</p>
        </div>
      );
    }

    // 2+ snapshots: show trend chart over time
    const chartData = periodSnaps.map(snap => {
      const point = { date: new Date(snap.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
      kpis.forEach(kpi => { point[clientData?.kpis?.[kpi.id]?.customLabel || kpi.label] = snap.values?.[kpi.id] ?? null; });
      return point;
    });
    const kpiLabels = kpis.map(kpi => clientData?.kpis?.[kpi.id]?.customLabel || kpi.label);
    const ChartType = chartType === 'bar' ? BarChart : chartType === 'area' ? AreaChart : LineChart;
    return (
      <div className="bi-kpi-dash-chart">
        <div className="bi-kpi-dash-chart-label">Trend — {activePeriod} snapshots ({periodSnaps.length})</div>
        <ResponsiveContainer width="100%" height={220}>
          <ChartType data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={48} />
            <RTooltip contentStyle={{ fontSize: '0.78rem', borderRadius: 6, border: '1px solid #e5e7eb' }} />
            <Legend wrapperStyle={{ fontSize: '0.72rem' }} />
            {kpiLabels.map((label, i) => {
              const color = KPI_COLORS[i % KPI_COLORS.length];
              if (chartType === 'bar') return <Bar key={label} dataKey={label} fill={color} radius={[3, 3, 0, 0]} barSize={16} />;
              if (chartType === 'area') return <Area key={label} type="monotone" dataKey={label} stroke={color} fill={color} fillOpacity={0.1} strokeWidth={2} dot={{ r: 2 }} />;
              return <Line key={label} type="monotone" dataKey={label} stroke={color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />;
            })}
          </ChartType>
        </ResponsiveContainer>
      </div>
    );
  };

  // --- Render a tier section ---
  const renderTierSection = (tierKey, kpis) => {
    if (!kpis || kpis.length === 0) return null;
    const meta = TIER_META[tierKey];
    const TierIcon = TIER_ICONS[tierKey] || Activity;
    const isExpanded = expandedSections.has(tierKey);
    return (
      <div key={tierKey} className={`bi-kpi-dash-tier bi-kpi-dash-tier-${tierKey}`}>
        <button className="bi-kpi-dash-tier-header" onClick={() => toggleSection(tierKey)}>
          <span className="bi-kpi-dash-tier-icon" style={{ background: meta.color }}><TierIcon size={14} /></span>
          <span className="bi-kpi-dash-tier-label">{meta.label}</span>
          <span className="bi-kpi-dash-tier-desc">{meta.desc}</span>
          <span className="bi-kpi-dash-tier-count">{kpis.length}</span>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {isExpanded && (
          <div className="bi-kpi-dash-tier-body">
            {renderKpiTable(kpis, tierKey)}
            {renderChart(kpis, meta.chartType)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bi-kpi-dash">
      {/* Header */}
      <div className="bi-kpi-dash-header">
        <div>
          <h3><Activity size={20} /> KPI Dashboard</h3>
          <p className="bi-kpi-dash-sub">Industry-specific KPIs with baselines, targets, and trends.</p>
        </div>
        <div className="bi-kpi-dash-header-actions">
          {clientData && (
            <>
              {viewingSnapshotIdx === null && <button className="btn-secondary btn-sm" onClick={refreshAll}><RefreshCw size={14} /> Refresh</button>}
              {viewingSnapshotIdx === null && <button className="btn-secondary btn-sm" onClick={takeSnapshot}><Camera size={14} /> Snapshot</button>}
              <button className="btn-secondary btn-sm" onClick={printReport}><Printer size={14} /> Print</button>
              <button className="btn-primary btn-sm" onClick={handleSave}><Save size={14} /> Save</button>
            </>
          )}
          {saveMsg && <span className="bi-save-msg">{saveMsg}</span>}
        </div>
      </div>

      {/* Client selector + industry badge + period tabs */}
      <div className="bi-kpi-dash-controls">
        <div className="bi-audit-client-selector">
          <select value={clientId} onChange={e => { setClientId(e.target.value); onBiClientChange?.(e.target.value); }}>
            <option value="">-- Select Client --</option>
            {activeClients.map(c => <option key={c.id} value={c.id}>{c.name}{c.businessName ? ` (${c.businessName})` : ''}</option>)}
          </select>
        </div>
        {clientIndustry && (
          <span className="bi-kpi-dash-industry-badge">
            <Briefcase size={13} /> {clientIndustry}
          </span>
        )}
        {clientId && !clientIndustry && (
          <span className="bi-kpi-dash-industry-badge bi-kpi-dash-industry-missing">
            <Info size={13} /> No industry set — fill Intake Form
          </span>
        )}
        {clientData && (
          <div className="bi-kpi-dash-period-tabs">
            {PERIODS.map(p => (
              <button key={p} className={`bi-kpi-dash-period-btn ${activePeriod === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        )}
        {clientData && (
          <div className="bi-kpi-dash-snapshot-nav">
            <Calendar size={14} />
            <select value={viewingSnapshotIdx ?? 'current'} onChange={e => {
              const v = e.target.value;
              setViewingSnapshotIdx(v === 'current' ? null : parseInt(v, 10));
            }}>
              <option value="current">Current (Live)</option>
              {allSnapshots.map(snap => (
                <option key={snap._idx} value={snap._idx}>
                  {new Date(snap.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })} {new Date(snap.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} [{snap.period}]
                </option>
              ))}
            </select>
            {viewingSnapshotIdx !== null && (
              <button className="btn-sm bi-kpi-dash-back-btn" onClick={() => setViewingSnapshotIdx(null)}>
                <RotateCcw size={12} /> Current
              </button>
            )}
          </div>
        )}
        {lastComputed && <span className="bi-kpi-dash-last-computed">Refreshed: {new Date(lastComputed).toLocaleTimeString()}</span>}
      </div>

      {/* Historical snapshot banner */}
      {viewingSnapshotIdx !== null && clientData?.snapshots?.[viewingSnapshotIdx] && (
        <div className="bi-kpi-dash-historical-banner">
          <Calendar size={15} />
          <span>Viewing snapshot from <strong>{new Date(clientData.snapshots[viewingSnapshotIdx].date).toLocaleString()}</strong> — values are editable</span>
          <button className="btn-sm btn-primary" onClick={() => { persistData(allData); setViewingSnapshotIdx(null); showSaveMsg('Saved!'); }}>
            <Save size={12} /> Save &amp; Return
          </button>
        </div>
      )}

      {/* Empty states */}
      {clientId && !clientData && (
        <div className="bi-exec-empty-state">
          <Activity size={48} />
          <p>No KPI data for this client yet.</p>
          <button className="btn-primary" onClick={initClient}><Plus size={16} /> Initialize KPIs</button>
        </div>
      )}

      {!clientId && (
        <div className="bi-exec-empty-state">
          <Activity size={48} />
          <p>Select a client to view their industry KPI dashboard.</p>
        </div>
      )}

      {clientData && (
        <>
          {/* Summary row — pinned KPIs */}
          {pinnedKpis.length > 0 && (
            <div className="bi-kpi-dash-summary">
              {pinnedKpis.map(kpiId => {
                const reg = allKpis.find(k => k.id === kpiId);
                if (!reg) return null;
                const val = getKpiValue(kpiId);
                const kpiData = clientData.kpis?.[kpiId] || {};
                const baseline = kpiData.baseline;
                const unit = kpiData.unit || reg.unit;
                const delta = calcDelta(val, baseline);
                const trend = getSnapshotTrend(kpiId);
                const label = kpiData.customLabel || reg.label;
                const tierMeta = TIER_META[reg.tier];
                return (
                  <div key={kpiId} className="bi-kpi-dash-card" style={{ borderTopColor: tierMeta?.color || '#6b7280' }}>
                    <div className="bi-kpi-dash-card-header">
                      <span className="bi-kpi-dash-card-label">{label}</span>
                      <button className="bi-kpi-dash-pin-btn" onClick={() => togglePin(kpiId)} aria-label="Unpin KPI"><PinOff size={12} /></button>
                    </div>
                    <div className="bi-kpi-dash-card-value">{formatValue(val, unit)}</div>
                    <div className="bi-kpi-dash-card-footer">
                      {delta !== null ? (
                        <span className={`bi-kpi-dash-delta ${delta >= 0 ? 'positive' : 'negative'}`}>
                          {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                        </span>
                      ) : <span className="bi-kpi-dash-delta neutral">—</span>}
                      <Sparkline data={trend} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Industry KPI sections (North Star / Driver / Guardrail) */}
          {industryPack ? (
            <>
              {renderTierSection('north_star', industryTiers.north_star)}
              {renderTierSection('driver', industryTiers.driver)}
              {renderTierSection('guardrail', industryTiers.guardrail)}
            </>
          ) : (
            <div className="bi-kpi-dash-no-industry">
              <Info size={18} />
              <p>No industry selected. Showing universal KPIs only. Set the client&apos;s industry in <strong>Intake Forms</strong> to see industry-specific KPIs.</p>
            </div>
          )}

          {/* Universal KPIs — collapsible by sub-category */}
          <div className={`bi-kpi-dash-tier bi-kpi-dash-tier-universal`}>
            <button className="bi-kpi-dash-tier-header" onClick={() => toggleSection('universal')}>
              <span className="bi-kpi-dash-tier-icon" style={{ background: TIER_META.universal.color }}><Activity size={14} /></span>
              <span className="bi-kpi-dash-tier-label">Universal KPIs</span>
              <span className="bi-kpi-dash-tier-desc">Cross-industry fundamentals</span>
              <span className="bi-kpi-dash-tier-count">{UNIVERSAL_KPIS.length}</span>
              {expandedSections.has('universal') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {expandedSections.has('universal') && (
              <div className="bi-kpi-dash-tier-body">
                {Object.entries(universalByCategory).map(([cat, kpis]) => (
                  <div key={cat} className="bi-kpi-dash-universal-group">
                    <h5 className="bi-kpi-dash-universal-cat">{cat}</h5>
                    {renderKpiTable(kpis, 'universal')}
                  </div>
                ))}
                {renderChart(UNIVERSAL_KPIS, 'line')}
              </div>
            )}
          </div>

          {/* Custom KPIs */}
          <div className={`bi-kpi-dash-tier bi-kpi-dash-tier-custom`}>
            <button className="bi-kpi-dash-tier-header" onClick={() => toggleSection('custom')}>
              <span className="bi-kpi-dash-tier-icon" style={{ background: TIER_META.custom.color }}><Tag size={14} /></span>
              <span className="bi-kpi-dash-tier-label">Custom KPIs</span>
              <span className="bi-kpi-dash-tier-desc">Your own tracked metrics</span>
              <span className="bi-kpi-dash-tier-count">{CUSTOM_KPIS.length}</span>
              {expandedSections.has('custom') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {expandedSections.has('custom') && (
              <div className="bi-kpi-dash-tier-body">
                {renderKpiTable(CUSTOM_KPIS, 'custom')}
                {renderChart(CUSTOM_KPIS, 'line')}
              </div>
            )}
          </div>

          {/* Trend Overview — pinned KPIs */}
          {clientData.snapshots?.length > 0 && pinnedKpis.length > 0 && (
            <div className="bi-kpi-dash-trends">
              <h4><TrendingUp size={16} /> Trend Overview</h4>
              <p className="bi-kpi-dash-trends-meta">
                {clientData.snapshots.length} snapshot{clientData.snapshots.length !== 1 ? 's' : ''} | Latest: {new Date(clientData.snapshots[clientData.snapshots.length - 1].date).toLocaleDateString()}
              </p>
              <div className="bi-kpi-dash-trends-grid">
                {pinnedKpis.map(kpiId => {
                  const reg = allKpis.find(k => k.id === kpiId);
                  if (!reg) return null;
                  const trend = getSnapshotTrend(kpiId);
                  if (trend.length < 2) return null;
                  const label = clientData.kpis?.[kpiId]?.customLabel || reg.label;
                  const unit = clientData.kpis?.[kpiId]?.unit || reg.unit;
                  return (
                    <div key={kpiId} className="bi-kpi-dash-trend-card">
                      <span className="bi-kpi-dash-trend-label">{label}</span>
                      <Sparkline data={trend} width={120} height={32} />
                      <span className="bi-kpi-dash-trend-range">{formatValue(trend[0], unit)} → {formatValue(trend[trend.length - 1], unit)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
