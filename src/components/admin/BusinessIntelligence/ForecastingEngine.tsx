import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  TrendingUp, Calculator, BarChart3, Target, Settings,
} from 'lucide-react';
import {
  ComposedChart, Line, Area, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts';
import { useAppContext } from '../../../context/AppContext';
import { safeGetItem, safeSetItem } from '../../../constants';

// ─── Constants ───────────────────────────────────────────────────────────────

const FINANCIALS_KEY  = 'threeseas_bi_client_financials';
const TARGETS_KEY     = 'threeseas_bi_growth_targets';
const FORECASTING_KEY = 'threeseas_bi_forecasting';

const METHODS = [
  { value: 'linear',  label: 'Linear Regression' },
  { value: 'cagr',    label: 'CAGR' },
  { value: 'sma',     label: '3-Month SMA' },
];

const HORIZONS = [3, 6, 12];

const METRICS = [
  { value: 'revenue',        label: 'Revenue' },
  { value: 'profit',         label: 'Profit (Rev − Exp)' },
  { value: 'websiteTraffic', label: 'Website Traffic' },
  { value: 'newCustomers',   label: 'New Customers' },
];

const SCENARIO_MULTIPLIERS = { base: 1, optimistic: 1.2, pessimistic: 0.7 };
const SCENARIO_COLORS      = { base: '#3b82f6', optimistic: '#22c55e', pessimistic: '#ef4444' };

// ─── Math helpers ─────────────────────────────────────────────────────────────

function linearRegression(values: number[]) {
  const n = values.length;
  if (n < 2) return { m: 0, b: values[0] || 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    const x = i + 1;
    sumX  += x;
    sumY  += values[i];
    sumXY += x * values[i];
    sumX2 += x * x;
  }
  const denom = n * sumX2 - sumX * sumX;
  const m = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const b = (sumY - m * sumX) / n;
  return { m, b };
}

function projectLinear(values: number[], horizon: number) {
  const { m, b } = linearRegression(values);
  const n = values.length;
  return Array.from({ length: horizon }, (_, t) =>
    Math.max(0, m * (n + t + 1) + b)
  );
}

function projectCagr(values: number[], horizon: number, multiplier: number) {
  const n = values.length;
  if (n < 2) return Array(horizon).fill(values[0] || 0);
  const first = values[0] || 1;
  const last  = values[n - 1] || 0;
  const rawCagr = Math.pow(last / first, 1 / (n - 1)) - 1;
  const cagr    = rawCagr * multiplier;
  return Array.from({ length: horizon }, (_, t) =>
    Math.max(0, last * Math.pow(1 + cagr, t + 1))
  );
}

function projectSma(values: number[], horizon: number, multiplier: number) {
  const window = values.slice(-3);
  const avg = window.length
    ? window.reduce((a, b) => a + b, 0) / window.length
    : 0;
  // Apply multiplier as a monthly growth on top of average
  const monthly = avg * (multiplier - 1) / horizon;
  return Array.from({ length: horizon }, (_, t) =>
    Math.max(0, avg + monthly * (t + 1))
  );
}

function momGrowthRate(values: number[]) {
  if (values.length < 2) return 0;
  const last = values[values.length - 1] || 0;
  const prev = values[values.length - 2] || 0;
  if (!prev) return 0;
  return ((last - prev) / prev) * 100;
}

// Format a YYYY-MM string for display (e.g. "Jan '25")
function fmtMonth(m: string) {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1).toLocaleDateString('en-US', {
    month: 'short', year: '2-digit',
  });
}

// Advance a YYYY-MM string by N months
function addMonths(ym: string, n: number) {
  if (!ym) return '';
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Format numbers for display
function fmtVal(metric: string, n: number | null | undefined) {
  if (n == null) return '—';
  if (metric === 'revenue' || metric === 'profit') {
    return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bi-forecast-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="bi-forecast-card-icon" style={{ color }}>{icon}</div>
      <div className="bi-forecast-card-value">{value}</div>
      <div className="bi-forecast-card-label">{label}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, metric }: { active?: boolean; payload?: any[]; label?: string; metric: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bi-forecast-tooltip">
      <div className="bi-forecast-tooltip-title">{fmtMonth(label) || label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: '0.8rem' }}>
          {p.name}: {fmtVal(metric, p.value)}
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface ForecastingEngineProps {
  biClientId: string;
  onBiClientChange: (id: string) => void;
}

export default function ForecastingEngine({ biClientId, onBiClientChange }: ForecastingEngineProps) {
  const { clients, payments } = useAppContext();

  // ── Persisted settings per client ────────────────────────────────────────
  const [method,          setMethod]          = useState<string>('linear');
  const [horizon,         setHorizon]         = useState<number>(6);
  const [showScenarios,   setShowScenarios]   = useState<boolean>(false);
  const [metric,          setMetric]          = useState<string>('revenue');
  const [selectedClientId, setSelectedClientId] = useState<string>(biClientId || '');
  const [clientSearch,    setClientSearch]    = useState<string>(() => {
    if (!biClientId) return '';
    const c = clients.find(cl => cl.id === biClientId);
    return c ? (c.name + (c.businessName ? ` (${c.businessName})` : '')) : '';
  });
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  // Load persisted settings when client changes
  useEffect(() => {
    const all = safeGetItem(FORECASTING_KEY, {});
    const key = selectedClientId || '__global__';
    const saved = all[key];
    if (saved) {
      if (saved.method)  setMethod(saved.method);
      if (saved.horizon) setHorizon(saved.horizon);
      if (saved.metric)  setMetric(saved.metric);
    }
  }, [selectedClientId]);

  // Update biClientId prop → internal state
  useEffect(() => {
    if (biClientId && biClientId !== selectedClientId) {
      setSelectedClientId(biClientId);
      const c = clients.find(cl => cl.id === biClientId);
      setClientSearch(c ? (c.name + (c.businessName ? ` (${c.businessName})` : '')) : '');
    }
  }, [biClientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeClients = useMemo(
    () => clients.filter(c => c.status !== 'archived' && c.status !== 'rejected'),
    [clients]
  );

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return activeClients;
    const q = clientSearch.toLowerCase();
    return activeClients.filter(c =>
      c.name?.toLowerCase().includes(q) || c.businessName?.toLowerCase().includes(q)
    );
  }, [activeClients, clientSearch]);

  const selectClient = useCallback((c: any) => {
    setSelectedClientId(c.id);
    setClientSearch(c.name + (c.businessName ? ` (${c.businessName})` : ''));
    setDropdownOpen(false);
    onBiClientChange?.(c.id);
  }, [onBiClientChange]);

  // ── Raw historical data ──────────────────────────────────────────────────
  const historicalEntries = useMemo(() => {
    if (selectedClientId) {
      const all = safeGetItem(FINANCIALS_KEY, {});
      const entries = (all[selectedClientId]?.entries || [])
        .slice()
        .sort((a, b) => a.month.localeCompare(b.month));
      return entries;
    }
    // Fallback: aggregate Three Seas payments by month
    const grouped = {};
    payments.forEach(p => {
      if (!p.createdAt) return;
      const month = p.createdAt.slice(0, 7);
      grouped[month] = (grouped[month] || 0) + (Number(p.amount) || 0);
    });
    return Object.keys(grouped).sort().map(month => ({
      month,
      revenue: grouped[month],
      expenses: 0,
      newCustomers: 0,
      websiteTraffic: 0,
    }));
  }, [selectedClientId, payments]);

  // ── Extract metric values ────────────────────────────────────────────────
  const historicalValues = useMemo(() => {
    return historicalEntries.map(e => {
      if (metric === 'profit') return (Number(e.revenue) || 0) - (Number(e.expenses) || 0);
      return Number(e[metric]) || 0;
    });
  }, [historicalEntries, metric]);

  const lastMonth = historicalEntries[historicalEntries.length - 1]?.month || '';

  // ── Growth targets ───────────────────────────────────────────────────────
  const growthTarget = useMemo(() => {
    if (!selectedClientId) return null;
    const all = safeGetItem(TARGETS_KEY, {});
    const clientTargets = all[selectedClientId] || {};
    const metricKey = metric === 'profit' ? 'profit' : metric;
    return clientTargets[metricKey] ?? null;
  }, [selectedClientId, metric]);

  // ── Project values per scenario ─────────────────────────────────────────
  const project = useCallback((multiplier: number) => {
    if (historicalValues.length === 0) return [];
    if (method === 'linear') return projectLinear(historicalValues, horizon);
    if (method === 'cagr')   return projectCagr(historicalValues, horizon, multiplier);
    return projectSma(historicalValues, horizon, multiplier);
  }, [historicalValues, method, horizon]);

  const projBase       = useMemo(() => project(SCENARIO_MULTIPLIERS.base),       [project]);
  const projOptimistic = useMemo(() => project(SCENARIO_MULTIPLIERS.optimistic),  [project]);
  const projPessimistic= useMemo(() => project(SCENARIO_MULTIPLIERS.pessimistic), [project]);

  // ── Combined chart data ──────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const hist = historicalEntries.map((e, i) => ({
      month: e.month,
      historical: historicalValues[i],
    }));

    const proj = projBase.map((val, i) => {
      const month = addMonths(lastMonth, i + 1);
      const point: Record<string, any> = { month, base: val };
      if (showScenarios) {
        point.optimistic  = projOptimistic[i];
        point.pessimistic = projPessimistic[i];
      }
      return point;
    });

    return [...hist, ...proj];
  }, [historicalEntries, historicalValues, projBase, projOptimistic, projPessimistic, lastMonth, showScenarios]);

  // ── Summary metrics ──────────────────────────────────────────────────────
  const momRate    = useMemo(() => momGrowthRate(historicalValues), [historicalValues]);
  const val6m      = projBase[5] ?? null;
  const val12m     = projBase[11] ?? null;
  const currentVal = historicalValues[historicalValues.length - 1] ?? 0;

  const timeToTarget = useMemo(() => {
    if (growthTarget == null || currentVal >= growthTarget) return null;
    for (let i = 0; i < projBase.length; i++) {
      if (projBase[i] >= growthTarget) return i + 1;
    }
    return null;
  }, [growthTarget, currentVal, projBase]);

  // ── Save settings ────────────────────────────────────────────────────────
  const saveSettings = useCallback(() => {
    const all  = safeGetItem(FORECASTING_KEY, {});
    const key  = selectedClientId || '__global__';
    all[key]   = { method, horizon, metric, savedAt: new Date().toISOString() };
    safeSetItem(FORECASTING_KEY, JSON.stringify(all));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  }, [selectedClientId, method, horizon, metric]);

  // ── Axis tick formatter ──────────────────────────────────────────────────
  const tickFmt = useCallback((v: number) => {
    if (metric === 'revenue' || metric === 'profit') {
      if (Math.abs(v) >= 1000) return '$' + (v / 1000).toFixed(0) + 'k';
      return '$' + v;
    }
    if (Math.abs(v) >= 1000) return (v / 1000).toFixed(0) + 'k';
    return String(v);
  }, [metric]);

  const hasData = historicalValues.length > 0;

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="bi-forecast-root">
      {/* ── Header ── */}
      <div className="bi-forecast-header">
        <div className="bi-forecast-title">
          <TrendingUp size={20} color="#3b82f6" />
          <h3>Revenue Forecasting Engine</h3>
        </div>
      </div>

      {/* ── Client Selector ── */}
      <div className="bi-forecast-client-bar">
        <label className="bi-forecast-ctrl-label">
          <BarChart3 size={14} />
          Data Source
        </label>
        <div className="bi-forecast-client-wrap">
          <div style={{ position: 'relative' }}>
            <input
              className="bi-forecast-client-input"
              type="text"
              placeholder="Search clients… (leave blank for Three Seas Digital data)"
              value={clientSearch}
              onChange={e => { setClientSearch(e.target.value); setDropdownOpen(true); }}
              onFocus={() => setDropdownOpen(true)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 180)}
            />
            {dropdownOpen && filteredClients.length > 0 && (
              <ul className="bi-forecast-client-dropdown">
                {filteredClients.slice(0, 8).map(c => (
                  <li
                    key={c.id}
                    className={`bi-forecast-client-option${selectedClientId === c.id ? ' active' : ''}`}
                    onMouseDown={() => selectClient(c)}
                  >
                    {c.name}{c.businessName ? ` — ${c.businessName}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {selectedClientId && (
            <button
              className="bi-forecast-clear-btn"
              onClick={() => { setSelectedClientId(''); setClientSearch(''); onBiClientChange?.(''); }}
              aria-label="Clear client selection"
            >
              Clear
            </button>
          )}
        </div>
        <span className="bi-forecast-source-label">
          {selectedClient
            ? `Showing: ${selectedClient.name} client financials`
            : 'Showing: Three Seas Digital internal payments'}
        </span>
      </div>

      {/* ── Control Bar ── */}
      <div className="bi-forecast-controls">
        {/* Metric selector */}
        <div className="bi-forecast-ctrl-group">
          <label className="bi-forecast-ctrl-label">
            <Target size={13} />
            Metric
          </label>
          <select
            className="bi-forecast-select"
            value={metric}
            onChange={e => setMetric(e.target.value)}
          >
            {METRICS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Method */}
        <div className="bi-forecast-ctrl-group">
          <label className="bi-forecast-ctrl-label">
            <Calculator size={13} />
            Method
          </label>
          <div className="bi-forecast-radio-group">
            {METHODS.map(m => (
              <label key={m.value} className={`bi-forecast-radio${method === m.value ? ' active' : ''}`}>
                <input
                  type="radio"
                  name="forecast-method"
                  value={m.value}
                  checked={method === m.value}
                  onChange={() => setMethod(m.value)}
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        {/* Horizon */}
        <div className="bi-forecast-ctrl-group">
          <label className="bi-forecast-ctrl-label">
            <TrendingUp size={13} />
            Horizon
          </label>
          <div className="bi-forecast-pill-group">
            {HORIZONS.map(h => (
              <button
                key={h}
                className={`bi-forecast-pill${horizon === h ? ' active' : ''}`}
                onClick={() => setHorizon(h)}
              >
                {h}mo
              </button>
            ))}
          </div>
        </div>

        {/* Scenarios toggle */}
        <div className="bi-forecast-ctrl-group">
          <label className="bi-forecast-ctrl-label">Scenarios</label>
          <label className="bi-forecast-toggle">
            <input
              type="checkbox"
              checked={showScenarios}
              onChange={e => setShowScenarios(e.target.checked)}
            />
            <span className="bi-forecast-toggle-slider" />
            <span>{showScenarios ? 'On' : 'Off'}</span>
          </label>
        </div>

        {/* Save */}
        <div className="bi-forecast-ctrl-group">
          <button
            className="bi-forecast-save-btn"
            onClick={saveSettings}
            aria-label="Save forecasting settings"
          >
            <Settings size={13} />
            {settingsSaved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* ── Chart ── */}
      <div className="bi-forecast-chart-panel">
        {!hasData ? (
          <div className="bi-forecast-empty">
            <BarChart3 size={40} color="#6b7280" />
            <p>No historical data available.</p>
            <p style={{ fontSize: '0.8rem', marginTop: 4 }}>
              {selectedClientId
                ? 'Add entries in Client Financials to enable forecasting.'
                : 'Record payments to enable Three Seas Digital forecasting.'}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="month"
                tickFormatter={fmtMonth}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={tickFmt}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                width={56}
              />
              <Tooltip content={<CustomTooltip metric={metric} />} />
              <Legend
                wrapperStyle={{ fontSize: '0.8rem', paddingTop: 8 }}
                formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
              />

              {/* Historical area */}
              <Area
                type="monotone"
                dataKey="historical"
                name="historical"
                stroke="#3b82f6"
                fill="rgba(59,130,246,0.15)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />

              {/* Base projection */}
              <Line
                type="monotone"
                dataKey="base"
                name="base"
                stroke={SCENARIO_COLORS.base}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />

              {/* Scenario lines (optional) */}
              {showScenarios && (
                <Line
                  type="monotone"
                  dataKey="optimistic"
                  name="optimistic"
                  stroke={SCENARIO_COLORS.optimistic}
                  strokeWidth={1.5}
                  strokeDasharray="3 4"
                  dot={false}
                  connectNulls
                />
              )}
              {showScenarios && (
                <Line
                  type="monotone"
                  dataKey="pessimistic"
                  name="pessimistic"
                  stroke={SCENARIO_COLORS.pessimistic}
                  strokeWidth={1.5}
                  strokeDasharray="3 4"
                  dot={false}
                  connectNulls
                />
              )}

              {/* Target reference line */}
              {growthTarget != null && (
                <ReferenceLine
                  y={growthTarget}
                  stroke="#f59e0b"
                  strokeDasharray="6 3"
                  label={{
                    value: `Target: ${fmtVal(metric, growthTarget)}`,
                    position: 'insideTopRight',
                    fontSize: 11,
                    fill: '#f59e0b',
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Summary Cards ── */}
      <div className="bi-forecast-summary-row">
        <SummaryCard
          icon={<TrendingUp size={18} />}
          label="Current MoM Growth"
          value={`${momRate >= 0 ? '+' : ''}${momRate.toFixed(1)}%`}
          color={momRate >= 0 ? '#10b981' : '#ef4444'}
        />
        <SummaryCard
          icon={<Calculator size={18} />}
          label={`Projected @ 6 Months`}
          value={fmtVal(metric, val6m)}
          color="#3b82f6"
        />
        <SummaryCard
          icon={<BarChart3 size={18} />}
          label={`Projected @ 12 Months`}
          value={fmtVal(metric, val12m)}
          color="#8b5cf6"
        />
        <SummaryCard
          icon={<Target size={18} />}
          label="Time to Target"
          value={
            growthTarget == null
              ? 'No target set'
              : currentVal >= growthTarget
              ? 'Target reached'
              : timeToTarget != null
              ? `~${timeToTarget} months`
              : `>${horizon} months`
          }
          color="#f59e0b"
        />
      </div>

      {/* ── Method explanation ── */}
      <div className="bi-forecast-method-note">
        {method === 'linear' && (
          <span>
            <strong>Linear Regression</strong> — Fits a straight trend line to all historical data
            using least-squares. Best for stable, steady growth patterns.
          </span>
        )}
        {method === 'cagr' && (
          <span>
            <strong>CAGR</strong> — Compound Annual Growth Rate projects exponential growth from
            first to last data point. Best for accelerating growth stages.
          </span>
        )}
        {method === 'sma' && (
          <span>
            <strong>3-Month SMA</strong> — Uses the average of the last 3 data points as a flat
            projection baseline. Best when recent performance is most representative.
          </span>
        )}
      </div>
    </div>
  );
}
