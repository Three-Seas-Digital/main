import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip,
} from 'recharts';
import {
  Users, ShoppingCart, Repeat, Zap, Swords,
  Save, Printer, RefreshCw, TrendingUp,
} from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import { safeGetItem, safeSetItem } from '../../../constants';
import { syncToApi } from '../../../api/apiSync';
import { calcRevenueConcentration } from './auditMetrics';

const PORTERS_KEY = 'threeseas_bi_porters';
const INTAKES_KEY = 'threeseas_bi_intakes';

const FORCE_LABELS = ['Very Low', 'Low', 'Moderate', 'High', 'Very High'];

function intensityColor(value) {
  if (value <= 2) return '#22c55e';
  if (value === 3) return '#f59e0b';
  return '#ef4444';
}

function intensityBg(value) {
  if (value <= 2) return 'rgba(34, 197, 94, 0.12)';
  if (value === 3) return 'rgba(245, 158, 11, 0.12)';
  return 'rgba(239, 68, 68, 0.12)';
}

const FORCES_CONFIG = [
  {
    key: 'newEntrants',
    label: 'Threat of New Entrants',
    icon: Users,
    color: '#8b5cf6',
    description: (v) =>
      v <= 2
        ? 'Low barriers to entry — new competitors unlikely to disrupt the market significantly.'
        : v === 3
        ? 'Moderate entry barriers — some new entrants expected but manageable.'
        : 'High threat — low barriers mean new competitors can enter quickly.',
    autoSource: null,
  },
  {
    key: 'supplierPower',
    label: 'Bargaining Power of Suppliers',
    icon: ShoppingCart,
    color: '#14b8a6',
    description: (v) =>
      v <= 2
        ? 'Suppliers have limited leverage — good negotiating position.'
        : v === 3
        ? 'Moderate supplier power — some dependency but alternatives exist.'
        : 'Suppliers hold significant power — pricing and supply risk elevated.',
    autoSource: null,
  },
  {
    key: 'buyerPower',
    label: 'Bargaining Power of Buyers',
    icon: Repeat,
    color: '#3b82f6',
    description: (v) =>
      v <= 2
        ? 'Buyers have limited leverage — strong pricing power retained.'
        : v === 3
        ? 'Moderate buyer power — some clients can negotiate on price or terms.'
        : 'High buyer power — revenue concentration gives key clients strong leverage.',
    autoSource: 'revenue-concentration',
  },
  {
    key: 'substitutes',
    label: 'Threat of Substitutes',
    icon: Zap,
    color: '#f97316',
    description: (v) =>
      v <= 2
        ? 'Few viable substitutes — strong product/service differentiation.'
        : v === 3
        ? 'Moderate substitution risk — some alternatives exist in the market.'
        : 'High substitution threat — clients could easily switch to alternatives.',
    autoSource: null,
  },
  {
    key: 'competitiveRivalry',
    label: 'Competitive Rivalry',
    icon: Swords,
    color: '#ec4899',
    description: (v) =>
      v <= 2
        ? 'Low competitive rivalry — differentiated market position.'
        : v === 3
        ? 'Moderate rivalry — a few key competitors but room to differentiate.'
        : 'Intense rivalry — crowded market with strong competitive pressure.',
    autoSource: 'competitor-count',
  },
];

function defaultForces() {
  return {
    newEntrants: 3,
    supplierPower: 3,
    buyerPower: 3,
    substitutes: 3,
    competitiveRivalry: 3,
  };
}

function defaultClientData() {
  return {
    forces: defaultForces(),
    notes: '',
    updatedAt: null,
  };
}

/** Derive auto-suggested values from CRM data. Returns { key: value } for auto-computable forces. */
function computeAutoForces({ payments, intakes, clientId }) {
  const result = {};

  // Buyer power: revenue concentration
  const concentration = calcRevenueConcentration(payments, 3);
  if (concentration > 60) result.buyerPower = 5;
  else if (concentration > 40) result.buyerPower = 4;
  else if (concentration > 20) result.buyerPower = 3;
  else result.buyerPower = 2;

  // Competitive rivalry: competitor count from intake
  const intake = clientId ? intakes[clientId] : null;
  const competitorCount =
    parseInt(intake?.competitorCount, 10) ||
    (Array.isArray(intake?.competitors) ? intake.competitors.length : 0);

  if (competitorCount >= 10) result.competitiveRivalry = 5;
  else if (competitorCount >= 6) result.competitiveRivalry = 4;
  else if (competitorCount >= 3) result.competitiveRivalry = 3;
  else result.competitiveRivalry = 2;

  return result;
}

// Custom radar tooltip
function CustomRadarTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0];
  return (
    <div
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: '0.8rem',
        color: 'var(--text-bright)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ fontWeight: 700 }}>{d.payload.subject}</div>
      <div style={{ color: intensityColor(d.value), marginTop: 2 }}>
        {d.value} — {FORCE_LABELS[d.value - 1] || ''}
      </div>
    </div>
  );
}

export default function PortersFiveForces({ biClientId, onBiClientChange }) {
  const { clients, payments } = useAppContext();

  const intakes = useMemo(() => safeGetItem(INTAKES_KEY, {}), []);

  const activeClients = useMemo(
    () => clients.filter((c) => c.status !== 'archived' && c.status !== 'rejected'),
    [clients]
  );

  const [clientId, setClientId] = useState(biClientId || '');
  const [allData, setAllData] = useState(() => safeGetItem(PORTERS_KEY, {}));
  const [saveMsg, setSaveMsg] = useState('');

  const saveMsgTimer = useRef(null);
  const showSaveMsg = useCallback((msg) => {
    setSaveMsg(msg);
    if (saveMsgTimer.current) clearTimeout(saveMsgTimer.current);
    saveMsgTimer.current = setTimeout(() => setSaveMsg(''), 2200);
  }, []);

  // Sync external prop
  useEffect(() => {
    if (biClientId && biClientId !== clientId) setClientId(biClientId);
  }, [biClientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const clientData = useMemo(
    () => (clientId ? (allData[clientId] || defaultClientData()) : null),
    [clientId, allData]
  );

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId]
  );

  const clientPayments = useMemo(
    () => (clientId ? payments.filter((p) => p.clientId === clientId) : payments),
    [payments, clientId]
  );

  // Auto-computed force suggestions
  const autoForces = useMemo(
    () =>
      clientId
        ? computeAutoForces({ payments: clientPayments, intakes, clientId })
        : {},
    [clientPayments, intakes, clientId]
  );

  // Persist helper
  const persist = useCallback((updated) => {
    setAllData(updated);
    safeSetItem(PORTERS_KEY, JSON.stringify(updated));
    syncToApi(() => Promise.resolve(), 'porters-save');
  }, []);

  const updateForce = useCallback(
    (forceKey, value) => {
      if (!clientId) return;
      const current = allData[clientId] || defaultClientData();
      const updated = {
        ...allData,
        [clientId]: {
          ...current,
          forces: { ...current.forces, [forceKey]: Number(value) },
          updatedAt: new Date().toISOString(),
        },
      };
      persist(updated);
    },
    [clientId, allData, persist]
  );

  const updateNotes = useCallback(
    (notes) => {
      if (!clientId) return;
      const current = allData[clientId] || defaultClientData();
      persist({
        ...allData,
        [clientId]: { ...current, notes, updatedAt: new Date().toISOString() },
      });
    },
    [clientId, allData, persist]
  );

  // Apply auto-force suggestions (merge into current, preserving manual values)
  const applyAutoSuggestions = useCallback(() => {
    if (!clientId) return;
    const current = allData[clientId] || defaultClientData();
    const merged = { ...current.forces, ...autoForces };
    persist({
      ...allData,
      [clientId]: { ...current, forces: merged, updatedAt: new Date().toISOString() },
    });
    showSaveMsg('Auto-suggestions applied');
  }, [clientId, allData, autoForces, persist, showSaveMsg]);

  // Auto-initialize when first selecting a client
  useEffect(() => {
    if (!clientId) return;
    if (!allData[clientId]) {
      const initial = defaultClientData();
      initial.forces = { ...initial.forces, ...autoForces };
      persist({ ...allData, [clientId]: initial });
    }
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(() => {
    if (!clientId || !clientData) return;
    persist({ ...allData, [clientId]: { ...clientData, updatedAt: new Date().toISOString() } });
    showSaveMsg('Saved!');
  }, [clientId, clientData, allData, persist, showSaveMsg]);

  // Radar chart data
  const radarData = useMemo(() => {
    if (!clientData) return [];
    return FORCES_CONFIG.map((f) => ({
      subject: f.label.replace('Bargaining Power of ', 'BP: ').replace('Threat of ', 'ToT: '),
      fullLabel: f.label,
      value: clientData.forces[f.key] || 3,
      color: f.color,
    }));
  }, [clientData]);

  // Overall intensity
  const overallIntensity = useMemo(() => {
    if (!clientData) return 0;
    const vals = FORCES_CONFIG.map((f) => clientData.forces[f.key] || 3);
    return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
  }, [clientData]);

  const printReport = useCallback(() => {
    if (!clientData) return;
    const clientName = selectedClient?.name || 'Unknown Client';
    const biz = selectedClient?.businessName || '';
    const date = new Date().toLocaleDateString();

    const rows = FORCES_CONFIG.map((f) => {
      const val = clientData.forces[f.key] || 3;
      const label = FORCE_LABELS[val - 1];
      const color = intensityColor(val);
      return `<tr>
        <td>${f.label}</td>
        <td><strong style="color:${color}">${val}/5</strong> — ${label}</td>
        <td style="color:#6b7280;font-size:0.8rem">${f.description(val)}</td>
      </tr>`;
    }).join('');

    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Porter's Five Forces — ${clientName}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;color:#1a1a2e;max-width:900px;margin:0 auto}
        h1{color:#0a2540;font-size:1.5rem;margin-bottom:4px}
        .meta{color:#6b7280;font-size:0.85rem;margin-bottom:20px}
        table{width:100%;border-collapse:collapse;margin:16px 0}
        th,td{border:1px solid #ddd;padding:10px 12px;text-align:left;font-size:0.85rem}
        th{background:#f5f5f5;font-weight:700}
        tr:nth-child(even){background:#fafafa}
        .intensity{display:inline-block;padding:4px 12px;border-radius:20px;font-weight:700;margin-top:12px}
        @media print{body{padding:12px}}
      </style>
    </head><body>
      <h1>Porter's Five Forces — ${clientName}${biz ? ` (${biz})` : ''}</h1>
      <p class="meta">Generated: ${date} | Overall Intensity: ${overallIntensity}/5</p>
      <table>
        <thead><tr><th>Force</th><th>Rating</th><th>Assessment</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${clientData.notes ? `<h3>Notes</h3><p style="font-size:0.9rem;color:#374151">${clientData.notes}</p>` : ''}
    </body></html>`);
    w.document.close();
    w.print();
  }, [clientData, selectedClient, overallIntensity]);

  return (
    <div className="bi-porters">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <h3
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: 0,
              fontSize: '1.25rem',
              color: 'var(--text-bright)',
            }}
          >
            <Swords size={20} />
            Porter's Five Forces
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', margin: '4px 0 0' }}>
            Competitive intensity analysis — auto-scored from revenue and intake data.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {clientData && (
            <>
              <button className="btn-secondary btn-sm" onClick={applyAutoSuggestions}>
                <RefreshCw size={14} /> Auto-Suggest
              </button>
              <button className="btn-secondary btn-sm" onClick={printReport}>
                <Printer size={14} /> Print
              </button>
              <button className="btn-primary btn-sm" onClick={handleSave}>
                <Save size={14} /> Save
              </button>
            </>
          )}
          {saveMsg && <span className="bi-save-msg">{saveMsg}</span>}
        </div>
      </div>

      {/* Client selector */}
      <div className="bi-audit-client-selector" style={{ marginBottom: 20 }}>
        <select
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            onBiClientChange?.(e.target.value);
          }}
        >
          <option value="">-- Select Client --</option>
          {activeClients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.businessName ? ` (${c.businessName})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Empty state */}
      {!clientId && (
        <div className="bi-exec-empty-state">
          <Swords size={48} />
          <p>Select a client to view their Porter's Five Forces analysis.</p>
        </div>
      )}

      {clientId && clientData && (
        <>
          {/* Overall intensity summary */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 24,
              padding: '14px 20px',
              background:
                overallIntensity <= 2
                  ? 'rgba(34,197,94,0.08)'
                  : overallIntensity <= 3.5
                  ? 'rgba(245,158,11,0.08)'
                  : 'rgba(239,68,68,0.08)',
              border: `1px solid ${intensityColor(Math.round(overallIntensity))}40`,
              borderRadius: 10,
              flexWrap: 'wrap',
            }}
          >
            <TrendingUp size={20} style={{ color: intensityColor(Math.round(overallIntensity)) }} />
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  color: 'var(--gray-500)',
                }}
              >
                Overall Competitive Intensity
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: intensityColor(Math.round(overallIntensity)),
                  lineHeight: 1.2,
                }}
              >
                {overallIntensity}
                <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--gray-500)', marginLeft: 4 }}>
                  / 5
                </span>
              </div>
            </div>
            <span
              style={{
                marginLeft: 'auto',
                padding: '6px 16px',
                borderRadius: 20,
                background: intensityBg(Math.round(overallIntensity)),
                color: intensityColor(Math.round(overallIntensity)),
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              {overallIntensity <= 2
                ? 'Low Intensity'
                : overallIntensity <= 3.5
                ? 'Moderate Intensity'
                : 'High Intensity'}
            </span>
            {clientData.updatedAt && (
              <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>
                Updated: {new Date(clientData.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Two-column: radar + cards */}
          <div className="bi-porters-layout">
            {/* Radar Chart */}
            <div
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 10,
                padding: '16px 8px',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--gray-500)',
                  textAlign: 'center',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}
              >
                Five Forces Radar
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="var(--glass-border)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: 'var(--text-bright)', fontSize: 10 }}
                    tickLine={false}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 5]}
                    tickCount={6}
                    tick={{ fill: 'var(--gray-500)', fontSize: 9 }}
                    axisLine={false}
                  />
                  <Radar
                    name="Competitive Forces"
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.25}
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                  />
                  <Tooltip content={<CustomRadarTooltip />} />
                </RadarChart>
              </ResponsiveContainer>

              {/* Scale legend */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 12,
                  marginTop: 8,
                  flexWrap: 'wrap',
                }}
              >
                {['1–2: Low', '3: Mod', '4–5: High'].map((label, i) => (
                  <span
                    key={label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.7rem',
                      color: 'var(--gray-500)',
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: i === 0 ? '#22c55e' : i === 1 ? '#f59e0b' : '#ef4444',
                        display: 'inline-block',
                      }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Force cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FORCES_CONFIG.map((force) => {
                const val = clientData.forces[force.key] || 3;
                const Icon = force.icon;
                const isAuto = force.autoSource !== null;
                const autoVal = autoForces[force.key];
                const hasAutoSuggestion = isAuto && autoVal !== undefined && autoVal !== val;

                return (
                  <div
                    key={force.key}
                    style={{
                      background: 'var(--glass-bg)',
                      border: `1px solid ${force.color}30`,
                      borderLeft: `3px solid ${force.color}`,
                      borderRadius: 8,
                      padding: '12px 14px',
                      transition: 'box-shadow 0.15s',
                    }}
                  >
                    {/* Force header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <Icon size={15} style={{ color: force.color, flexShrink: 0 }} />
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          color: 'var(--text-bright)',
                          flex: 1,
                        }}
                      >
                        {force.label}
                      </span>
                      {/* Value badge */}
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: 12,
                          background: intensityBg(val),
                          color: intensityColor(val),
                          fontWeight: 700,
                          fontSize: '0.82rem',
                        }}
                      >
                        {val} — {FORCE_LABELS[val - 1]}
                      </span>
                      {isAuto && (
                        <span
                          style={{
                            fontSize: '0.6rem',
                            background: 'rgba(34,211,238,0.08)',
                            color: 'var(--primary)',
                            borderRadius: 3,
                            padding: '1px 5px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px',
                          }}
                        >
                          auto
                        </span>
                      )}
                    </div>

                    {/* Slider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--gray-500)',
                          minWidth: 50,
                          textAlign: 'right',
                        }}
                      >
                        Very Low
                      </span>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={val}
                        onChange={(e) => updateForce(force.key, e.target.value)}
                        aria-label={`${force.label} rating`}
                        style={{
                          flex: 1,
                          cursor: 'pointer',
                          accentColor: force.color,
                          height: 6,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--gray-500)',
                          minWidth: 50,
                        }}
                      >
                        Very High
                      </span>
                    </div>

                    {/* Tick marks */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingLeft: 58,
                        paddingRight: 58,
                        marginBottom: 8,
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          style={{
                            fontSize: '0.62rem',
                            color: n === val ? intensityColor(val) : 'var(--gray-500)',
                            fontWeight: n === val ? 700 : 400,
                          }}
                        >
                          {n}
                        </span>
                      ))}
                    </div>

                    {/* Description */}
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.78rem',
                        color: 'var(--gray-500)',
                        lineHeight: 1.5,
                      }}
                    >
                      {force.description(val)}
                    </p>

                    {/* Auto suggestion hint */}
                    {hasAutoSuggestion && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: '5px 10px',
                          background: 'rgba(34,211,238,0.06)',
                          border: '1px solid rgba(34,211,238,0.15)',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span>
                          Auto-suggested: <strong>{autoVal}</strong> ({FORCE_LABELS[autoVal - 1]}) based on CRM data.
                        </span>
                        <button
                          onClick={() => updateForce(force.key, autoVal)}
                          style={{
                            marginLeft: 'auto',
                            background: 'none',
                            border: '1px solid var(--primary)',
                            borderRadius: 4,
                            color: 'var(--primary)',
                            fontSize: '0.68rem',
                            padding: '2px 8px',
                            cursor: 'pointer',
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes section */}
          <div
            style={{
              marginTop: 16,
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 10,
              padding: '14px 16px',
            }}
          >
            <label
              htmlFor="porters-notes"
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Analysis Notes
            </label>
            <textarea
              id="porters-notes"
              value={clientData.notes || ''}
              onChange={(e) => updateNotes(e.target.value)}
              placeholder="Add strategic observations, context, or recommendations…"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 6,
                color: 'var(--text-bright)',
                fontSize: '0.85rem',
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--glass-border)')}
            />
          </div>

          {/* Footer legend */}
          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 8,
              fontSize: '0.75rem',
              color: 'var(--gray-500)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <span>
              <strong style={{ color: 'var(--text-bright)' }}>Auto</strong> forces (Buyer Power,
              Competitive Rivalry) are computed from revenue concentration and intake competitor
              data.
            </span>
            <span>Adjust sliders to override with your assessment.</span>
          </div>
        </>
      )}
    </div>
  );
}
