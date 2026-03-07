import { useState, useMemo } from 'react';
import { Target, DollarSign, Users, TrendingUp, Globe, Save, Search, ChevronDown } from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts';
import { useAppContext } from '../../../context/AppContext';
import { safeGetItem, safeSetItem } from '../../../constants';
import { calcARPU, calcWinRate } from './auditMetrics';

const STORAGE_KEY = 'threeseas_bi_market_sizing';

const EMPTY_FORM = {
  totalMarket: '',
  geographicPct: 100,
  segmentPct: 50,
  winRate: '',
  winRateOverridden: false,
  arpu: '',
  arpuOverridden: false,
  totalBusinesses: '',
  avgContractValue: '',
};

const fmt = (v) => {
  if (v === null || v === undefined || v === '' || isNaN(Number(v))) return '$0';
  return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const fmtShort = (v) => {
  const n = Number(v) || 0;
  if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
};

const BAR_COLORS = ['#6366f1', '#3b82f6', '#22c55e'];

const AutoBadge = ({ label }) => (
  <span style={{
    fontSize: '0.65rem',
    background: 'rgba(99,102,241,0.15)',
    color: '#818cf8',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 4,
    padding: '1px 6px',
    marginLeft: 6,
    fontWeight: 600,
    verticalAlign: 'middle',
  }}>{label}</span>
);

const KpiCard = ({ icon, label, value, sub, color, size = 'normal' }) => (
  <div style={{
    flex: 1,
    minWidth: size === 'large' ? 180 : 140,
    padding: size === 'large' ? '1.25rem 1.5rem' : '1rem',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid rgba(255,255,255,0.08)`,
    borderLeft: `4px solid ${color}`,
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
      {icon} {label}
    </div>
    <div style={{ fontSize: size === 'large' ? '2rem' : '1.5rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.1 }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{sub}</div>}
  </div>
);

const ScenarioCard = ({ label, value, multiplier, color }) => (
  <div style={{
    flex: 1,
    minWidth: 120,
    padding: '0.85rem 1rem',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${color}30`,
    borderTop: `3px solid ${color}`,
    borderRadius: 8,
    textAlign: 'center',
  }}>
    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: '1.35rem', fontWeight: 800, color, lineHeight: 1.1 }}>{fmtShort(value)}</div>
    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 4 }}>{multiplier}</div>
  </div>
);

export default function MarketSizing({ biClientId, onBiClientChange }) {
  const { clients, payments, prospects } = useAppContext();

  const [selectedClientId, setSelectedClientId] = useState(biClientId || '');
  const [clientSearch, setClientSearch] = useState(() => {
    if (!biClientId) return '';
    const c = clients.find(cl => cl.id === biClientId);
    return c ? c.name + (c.businessName ? ' (' + c.businessName + ')' : '') : '';
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const activeClients = clients.filter(c => c.status !== 'archived' && c.status !== 'rejected');

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return activeClients;
    const q = clientSearch.toLowerCase();
    return activeClients.filter(c =>
      c.name?.toLowerCase().includes(q) || c.businessName?.toLowerCase().includes(q)
    );
  }, [activeClients, clientSearch]);

  // Auto-calculated CRM values
  const autoWinRate = useMemo(() => {
    const rate = calcWinRate(prospects);
    return rate > 0 ? parseFloat(rate.toFixed(1)) : null;
  }, [prospects]);

  const autoArpu = useMemo(() => {
    const arpu = calcARPU(payments, clients);
    return arpu > 0 ? Math.round(arpu) : null;
  }, [payments, clients]);

  // Load saved form for selected client
  const [form, setForm] = useState(() => {
    if (!biClientId) return { ...EMPTY_FORM };
    const all = safeGetItem(STORAGE_KEY, {});
    return all[biClientId] ? { ...EMPTY_FORM, ...all[biClientId] } : { ...EMPTY_FORM };
  });

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const selectClient = (c) => {
    setSelectedClientId(c.id);
    setClientSearch(c.name + (c.businessName ? ' (' + c.businessName + ')' : ''));
    setDropdownOpen(false);
    onBiClientChange?.(c.id);
    const all = safeGetItem(STORAGE_KEY, {});
    setForm(all[c.id] ? { ...EMPTY_FORM, ...all[c.id] } : { ...EMPTY_FORM });
  };

  // Effective values: use manual override when set, else auto
  const effectiveWinRate = useMemo(() => {
    if (form.winRateOverridden && form.winRate !== '') return parseFloat(form.winRate) || 0;
    return autoWinRate ?? 0;
  }, [form.winRateOverridden, form.winRate, autoWinRate]);

  const effectiveArpu = useMemo(() => {
    if (form.arpuOverridden && form.arpu !== '') return parseFloat(form.arpu) || 0;
    return autoArpu ?? 0;
  }, [form.arpuOverridden, form.arpu, autoArpu]);

  // Current revenue for this client from payments
  const clientRevenue = useMemo(() => {
    if (!selectedClientId) return 0;
    return payments
      .filter(p => p.status === 'completed' && p.clientId === selectedClientId)
      .reduce((s, p) => s + (p.amount || 0), 0);
  }, [payments, selectedClientId]);

  // Core TAM / SAM / SOM computations
  const computed = useMemo(() => {
    const tam = parseFloat(form.totalMarket) || 0;
    const geoPct = parseFloat(form.geographicPct) || 0;
    const segPct = parseFloat(form.segmentPct) || 0;
    const wr = effectiveWinRate;
    const arpu = effectiveArpu;
    const totalBiz = parseFloat(form.totalBusinesses) || 0;
    const acv = parseFloat(form.avgContractValue) || 0;

    const sam = tam * (geoPct / 100) * (segPct / 100);
    const som = sam * (wr / 100);

    const revProjection = totalBiz * (wr / 100) * (acv > 0 ? acv : arpu);
    const revPessimistic = totalBiz * ((wr * 0.7) / 100) * (acv > 0 ? acv : arpu);
    const revOptimistic = totalBiz * ((wr * 1.2) / 100) * (acv > 0 ? acv : arpu);

    const marketShare = sam > 0 && clientRevenue > 0 ? (clientRevenue / sam) * 100 : null;

    return { tam, sam, som, revProjection, revPessimistic, revOptimistic, marketShare };
  }, [form, effectiveWinRate, effectiveArpu, clientRevenue]);

  const chartData = useMemo(() => [
    { name: 'TAM', value: computed.tam, label: fmtShort(computed.tam) },
    { name: 'SAM', value: computed.sam, label: fmtShort(computed.sam) },
    { name: 'SOM', value: computed.som, label: fmtShort(computed.som) },
  ], [computed]);

  const handleSave = () => {
    if (!selectedClientId) return;
    const all = safeGetItem(STORAGE_KEY, {});
    all[selectedClientId] = { ...form, savedAt: new Date().toISOString() };
    safeSetItem(STORAGE_KEY, JSON.stringify(all));
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const customTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', fontSize: '0.8rem', color: '#f1f5f9' }}>
        <div style={{ fontWeight: 700 }}>{payload[0].payload.name}</div>
        <div>{fmt(payload[0].value)}</div>
      </div>
    );
  };

  return (
    <div className="bi-market-sizing" style={{ color: '#e2e8f0' }}>
      {/* Header */}
      <div className="bi-header" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>
          <Target size={20} color="#6366f1" /> TAM / SAM / SOM Calculator
        </h3>
        {selectedClientId && (
          <button
            className="btn-primary"
            onClick={handleSave}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Save size={15} /> Save
            {saveMsg && <span style={{ marginLeft: 6, fontSize: '0.8rem', color: '#86efac' }}>{saveMsg}</span>}
          </button>
        )}
      </div>

      {/* Client Selector */}
      <div className="form-group" style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <label style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6, display: 'block' }}>
          Client
        </label>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
          <input
            type="text"
            value={clientSearch}
            placeholder="Search clients..."
            style={{ paddingLeft: 32, width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', padding: '0.5rem 0.75rem 0.5rem 32px' }}
            onChange={e => { setClientSearch(e.target.value); setDropdownOpen(true); if (!e.target.value) setSelectedClientId(''); }}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
          />
          <ChevronDown size={15} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
        </div>
        {dropdownOpen && filteredClients.length > 0 && (
          <div className="bi-financials-dropdown" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', position: 'absolute', zIndex: 50, width: '100%', maxHeight: 200, overflowY: 'auto', marginTop: 2 }}>
            {filteredClients.map(c => (
              <div
                key={c.id}
                className={`bi-financials-dropdown-item${c.id === selectedClientId ? ' active' : ''}`}
                style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', color: c.id === selectedClientId ? '#818cf8' : '#e2e8f0', background: c.id === selectedClientId ? 'rgba(99,102,241,0.15)' : 'transparent' }}
                onMouseDown={() => selectClient(c)}
              >
                {c.name}{c.businessName ? ` (${c.businessName})` : ''}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main layout: form left, results right */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* ---- Left: Input Form ---- */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={14} /> Market Parameters
          </h4>

          {/* TAM */}
          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 4, display: 'block' }}>Total Addressable Market ($)</label>
            <input
              type="number"
              min="0"
              value={form.totalMarket}
              onChange={e => set('totalMarket', e.target.value)}
              placeholder="e.g. 50000000"
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: '#e2e8f0', padding: '0.5rem 0.75rem' }}
            />
            {form.totalMarket && <div style={{ fontSize: '0.7rem', color: '#6366f1', marginTop: 3 }}>{fmtShort(form.totalMarket)}</div>}
          </div>

          {/* Geographic % */}
          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 4, display: 'block' }}>
              Geographic Coverage <span style={{ color: '#6366f1', fontWeight: 700 }}>{form.geographicPct}%</span>
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={form.geographicPct}
              onChange={e => set('geographicPct', parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#6366f1' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#475569' }}>
              <span>Local (1%)</span><span>National (100%)</span>
            </div>
          </div>

          {/* Segment % */}
          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 4, display: 'block' }}>
              Target Segment Fit <span style={{ color: '#3b82f6', fontWeight: 700 }}>{form.segmentPct}%</span>
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={form.segmentPct}
              onChange={e => set('segmentPct', parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#3b82f6' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#475569' }}>
              <span>Narrow (1%)</span><span>All (100%)</span>
            </div>
          </div>

          {/* Separator */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '1rem 0' }} />

          {/* Win Rate */}
          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 4, display: 'flex', alignItems: 'center' }}>
              Win Rate (%)
              {!form.winRateOverridden && autoWinRate !== null && <AutoBadge label="auto from CRM" />}
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.winRateOverridden ? form.winRate : (autoWinRate !== null ? autoWinRate : '')}
                placeholder={autoWinRate !== null ? `${autoWinRate}% (CRM)` : 'e.g. 25'}
                onChange={e => {
                  set('winRate', e.target.value);
                  set('winRateOverridden', true);
                }}
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: `1px solid ${form.winRateOverridden ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 7, color: '#e2e8f0', padding: '0.5rem 0.75rem' }}
              />
              {form.winRateOverridden && (
                <button
                  className="btn-secondary"
                  onClick={() => { set('winRate', ''); set('winRateOverridden', false); }}
                  aria-label="Reset win rate to auto"
                  title="Reset to CRM auto"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem' }}
                >
                  Auto
                </button>
              )}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: 3 }}>
              Effective: {effectiveWinRate.toFixed(1)}%
            </div>
          </div>

          {/* ARPU */}
          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 4, display: 'flex', alignItems: 'center' }}>
              ARPU / Avg Revenue per Client
              {!form.arpuOverridden && autoArpu !== null && <AutoBadge label="auto" />}
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="number"
                min="0"
                value={form.arpuOverridden ? form.arpu : (autoArpu !== null ? autoArpu : '')}
                placeholder={autoArpu !== null ? `${fmt(autoArpu)} (CRM)` : 'e.g. 1200'}
                onChange={e => {
                  set('arpu', e.target.value);
                  set('arpuOverridden', true);
                }}
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: `1px solid ${form.arpuOverridden ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 7, color: '#e2e8f0', padding: '0.5rem 0.75rem' }}
              />
              {form.arpuOverridden && (
                <button
                  className="btn-secondary"
                  onClick={() => { set('arpu', ''); set('arpuOverridden', false); }}
                  aria-label="Reset ARPU to auto"
                  title="Reset to CRM auto"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem' }}
                >
                  Auto
                </button>
              )}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: 3 }}>
              Effective: {fmt(effectiveArpu)}
            </div>
          </div>

          {/* Separator */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '1rem 0' }} />

          {/* Total Businesses */}
          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 4, display: 'block' }}>Total Businesses in Area</label>
            <input
              type="number"
              min="0"
              value={form.totalBusinesses}
              onChange={e => set('totalBusinesses', e.target.value)}
              placeholder="e.g. 5000"
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: '#e2e8f0', padding: '0.5rem 0.75rem' }}
            />
          </div>

          {/* Avg Contract Value */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 4, display: 'block' }}>Avg Contract Value ($) <span style={{ color: '#475569', fontWeight: 400 }}>(overrides ARPU for revenue projection)</span></label>
            <input
              type="number"
              min="0"
              value={form.avgContractValue}
              onChange={e => set('avgContractValue', e.target.value)}
              placeholder="e.g. 2400"
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: '#e2e8f0', padding: '0.5rem 0.75rem' }}
            />
          </div>
        </div>

        {/* ---- Right: Results Panel ---- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* TAM / SAM / SOM KPI Row */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <KpiCard
              icon={<Globe size={14} />}
              label="TAM — Total Addressable Market"
              value={fmtShort(computed.tam)}
              sub="Full theoretical market opportunity"
              color="#6366f1"
              size="large"
            />
            <KpiCard
              icon={<Target size={14} />}
              label="SAM — Serviceable Addressable Market"
              value={fmtShort(computed.sam)}
              sub={`Geo ${form.geographicPct}% × Segment ${form.segmentPct}%`}
              color="#3b82f6"
              size="large"
            />
            <KpiCard
              icon={<TrendingUp size={14} />}
              label="SOM — Serviceable Obtainable Market"
              value={fmtShort(computed.som)}
              sub={`Win rate ${effectiveWinRate.toFixed(1)}% of SAM`}
              color="#22c55e"
              size="large"
            />
          </div>

          {/* TAM > SAM > SOM Bar Chart */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem' }}>
            <h4 className="bi-chart-title" style={{ color: '#94a3b8', margin: '0 0 0.75rem', padding: 0 }}>
              Market Opportunity Breakdown
            </h4>
            {computed.tam > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={v => fmtShort(v)}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#e2e8f0', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip content={customTooltip} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} label={{ position: 'right', formatter: v => fmtShort(v), fill: '#94a3b8', fontSize: 11 }}>
                    {chartData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: '#475569', padding: '2rem', fontSize: '0.85rem' }}>
                Enter a Total Addressable Market value to see the breakdown.
              </div>
            )}
          </div>

          {/* Revenue Projection Scenarios */}
          {(parseFloat(form.totalBusinesses) > 0) && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <DollarSign size={14} /> Revenue Projection Scenarios
              </h4>
              <div style={{ fontSize: '0.72rem', color: '#475569', marginBottom: 12 }}>
                Based on {Number(form.totalBusinesses).toLocaleString()} businesses &times; win rate &times; {form.avgContractValue ? fmt(form.avgContractValue) + ' ACV' : fmt(effectiveArpu) + ' ARPU'}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <ScenarioCard
                  label="Pessimistic"
                  value={computed.revPessimistic}
                  multiplier={`Win rate × 0.7 (${(effectiveWinRate * 0.7).toFixed(1)}%)`}
                  color="#ef4444"
                />
                <ScenarioCard
                  label="Base Case"
                  value={computed.revProjection}
                  multiplier={`Win rate × 1.0 (${effectiveWinRate.toFixed(1)}%)`}
                  color="#f59e0b"
                />
                <ScenarioCard
                  label="Optimistic"
                  value={computed.revOptimistic}
                  multiplier={`Win rate × 1.2 (${(effectiveWinRate * 1.2).toFixed(1)}%)`}
                  color="#22c55e"
                />
              </div>
            </div>
          )}

          {/* Market Share (if client revenue exists and SAM > 0) */}
          {computed.marketShare !== null && selectedClientId && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: computed.marketShare > 10 ? '#22c55e' : computed.marketShare > 2 ? '#f59e0b' : '#94a3b8', lineHeight: 1 }}>
                  {computed.marketShare.toFixed(2)}%
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Market Share</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 4 }}>
                  <Users size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Client revenue of {fmt(clientRevenue)} vs SAM of {fmtShort(computed.sam)}
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(computed.marketShare, 100).toFixed(2)}%`, height: '100%', background: computed.marketShare > 10 ? '#22c55e' : '#6366f1', borderRadius: 4, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            </div>
          )}

          {/* Empty state when no TAM entered */}
          {computed.tam === 0 && (
            <div style={{ textAlign: 'center', color: '#475569', padding: '1.5rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.07)' }}>
              <Target size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>Enter market parameters on the left to calculate TAM, SAM, and SOM.</div>
            </div>
          )}
        </div>
      </div>

      {/* Responsive style — collapses grid on small screens */}
      <style>{`
        @media (max-width: 768px) {
          .bi-market-sizing > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
