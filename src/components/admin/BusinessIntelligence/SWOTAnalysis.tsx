import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Shield,
  Plus, X, RefreshCw, Printer, Save, Users, BarChart3, Target, Brain,
} from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import { safeGetItem, safeSetItem, generateId, escapeHtml } from '../../../constants';
import { syncToApi } from '../../../api/apiSync';
import { aiGenerateSWOT, aiGetSWOT } from '../../../api/ai';
import {
  calcRevenueConcentration,
  calcDSO,
  calcWinRate,
} from './auditMetrics';

const SWOT_KEY = 'threeseas_bi_swot';
const AUDITS_KEY = 'threeseas_bi_audits';
const INTAKES_KEY = 'threeseas_bi_intakes';
const INTERVENTIONS_KEY = 'threeseas_bi_interventions';

const QUADRANTS = [
  {
    key: 'strengths',
    label: 'Strengths',
    icon: TrendingUp,
    border: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.06)',
    headerBg: 'rgba(34, 197, 94, 0.12)',
    iconColor: '#22c55e',
    description: 'Internal positive factors',
  },
  {
    key: 'weaknesses',
    label: 'Weaknesses',
    icon: TrendingDown,
    border: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.06)',
    headerBg: 'rgba(239, 68, 68, 0.12)',
    iconColor: '#ef4444',
    description: 'Internal negative factors',
  },
  {
    key: 'opportunities',
    label: 'Opportunities',
    icon: Lightbulb,
    border: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.06)',
    headerBg: 'rgba(59, 130, 246, 0.12)',
    iconColor: '#3b82f6',
    description: 'External positive factors',
  },
  {
    key: 'threats',
    label: 'Threats',
    icon: AlertTriangle,
    border: '#f97316',
    bg: 'rgba(249, 115, 22, 0.06)',
    headerBg: 'rgba(249, 115, 22, 0.12)',
    iconColor: '#f97316',
    description: 'External negative factors',
  },
];

function makeItem(text: string, isAuto: boolean = false) {
  return { id: generateId(), text, isAuto };
}

function buildAutoSWOT({ clients, payments, prospects, audits, intakes, interventions }: { clients: any[]; payments: any[]; prospects: any[]; audits: Record<string, any>; intakes: Record<string, any>; interventions: Record<string, any> }) {
  const strengths = [];
  const weaknesses = [];
  const opportunities = [];
  const threats = [];

  // --- Audit-based signals ---
  const AUDIT_CATEGORIES: Record<string, string[]> = {
    SEO: ['sc-meta', 'sc-headings', 'sc-sitemap', 'sc-speed'],
    Social: ['sc-social-presence', 'sc-social-engagement'],
    Advertising: ['sc-ads', 'sc-retargeting'],
    Branding: ['sc-branding', 'sc-messaging'],
    Content: ['sc-blog', 'sc-content-quality'],
    Technical: ['sc-schema', 'sc-mobile', 'sc-security'],
    Website: ['sc-design', 'sc-ux', 'sc-conversion'],
  };

  // Compute category averages from all stored audits (client-keyed)
  const catTotals: Record<string, number> = {};
  const catCounts: Record<string, number> = {};
  Object.values(audits).forEach((auditData) => {
    if (!auditData || typeof auditData !== 'object') return;
    Object.entries(AUDIT_CATEGORIES).forEach(([catName, keys]) => {
      keys.forEach((k) => {
        const val = auditData[k];
        if (val !== undefined && val !== null && val !== '') {
          const num = parseFloat(val);
          if (!isNaN(num)) {
            catTotals[catName] = (catTotals[catName] || 0) + num;
            catCounts[catName] = (catCounts[catName] || 0) + 1;
          }
        }
      });
    });
  });

  Object.entries(catTotals).forEach(([cat, total]) => {
    const count = catCounts[cat];
    if (!count) return;
    const avg = total / count;
    const score = Math.round(avg * 10) / 10;
    if (avg > 7) {
      strengths.push(makeItem(`Strong ${cat} presence (score: ${score}/10)`, true));
    } else if (avg < 4) {
      weaknesses.push(makeItem(`Weak ${cat} performance (score: ${score}/10)`, true));
      opportunities.push(makeItem(`Improve ${cat} (current: ${score}/10)`, true));
    }
  });

  // --- Sales win rate ---
  const winRate = calcWinRate(prospects);
  if (winRate > 50) {
    strengths.push(makeItem(`High sales win rate (${Math.round(winRate)}%)`, true));
  }

  // --- DSO ---
  const dso = calcDSO(clients);
  if (dso > 30) {
    weaknesses.push(makeItem(`Slow collections (DSO: ${dso} days)`, true));
    threats.push(makeItem('Cash flow risk from slow payments', true));
  }

  // --- Revenue concentration ---
  const concentration = calcRevenueConcentration(payments, 3);
  if (concentration > 60) {
    weaknesses.push(makeItem('High revenue concentration risk', true));
    threats.push(makeItem('Client concentration risk', true));
  } else if (concentration > 40) {
    threats.push(makeItem('Moderate client concentration risk', true));
  }

  // --- Pipeline coverage ---
  // Use a basic heuristic when no explicit target is set: coverage < 1x pipeline-to-revenue ratio
  const pipelineValue = prospects
    .filter((p) => !p.closedAt)
    .reduce((s, p) => s + (p.dealValue || 0), 0);
  const completedRevenue = payments
    .filter((p) => p.status === 'completed')
    .reduce((s, p) => s + (p.amount || 0), 0);
  if (completedRevenue > 0 && pipelineValue / completedRevenue < 0.5) {
    threats.push(makeItem('Insufficient pipeline coverage', true));
  }

  // --- Positive interventions with ROI ---
  Object.values(interventions).flat().forEach((item) => {
    if (!item || item.status !== 'completed') return;
    const revChange =
      (parseFloat(item.afterMetrics?.revenue) || 0) -
      (parseFloat(item.beforeMetrics?.revenue) || 0);
    const cost = parseFloat(item.cost) || 0;
    const roi = cost > 0 ? ((revChange - cost) / cost) * 100 : 0;
    if (roi > 50 && item.title) {
      strengths.push(
        makeItem(`Proven ROI from ${item.title} intervention (+${Math.round(roi)}% ROI)`, true)
      );
    }
  });

  // --- Intake competitor data ---
  const hasCompetitorData = Object.values(intakes).some(
    (intake) => intake && (intake.competitors || intake.competitorCount)
  );
  if (!hasCompetitorData) {
    opportunities.push(makeItem('Competitor analysis not yet conducted', true));
  }

  return { strengths, weaknesses, opportunities, threats };
}

function defaultSwotData() {
  return {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
    updatedAt: null,
  };
}

interface SWOTAnalysisProps {
  biClientId: string;
  onBiClientChange: (id: string) => void;
}

export default function SWOTAnalysis({ biClientId, onBiClientChange }: SWOTAnalysisProps) {
  const { clients, payments, prospects, currentUser } = useAppContext();

  const audits = useMemo(() => safeGetItem(AUDITS_KEY, {}), []);
  const intakes = useMemo(() => safeGetItem(INTAKES_KEY, {}), []);
  const interventionsRaw = useMemo(() => safeGetItem(INTERVENTIONS_KEY, {}), []);

  const activeClients = useMemo(
    () => clients.filter((c) => c.status !== 'archived' && c.status !== 'rejected'),
    [clients]
  );

  const [clientId, setClientId] = useState<string>(biClientId || '');
  const [allData, setAllData] = useState<Record<string, any>>(() => safeGetItem(SWOT_KEY, {}));
  const [inputs, setInputs] = useState<Record<string, string>>({ strengths: '', weaknesses: '', opportunities: '', threats: '' });
  const [saveMsg, setSaveMsg] = useState<string>('');
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiLastGenerated, setAiLastGenerated] = useState<string | null>(null);

  const saveMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showSaveMsg = useCallback((msg: string) => {
    setSaveMsg(msg);
    if (saveMsgTimer.current) clearTimeout(saveMsgTimer.current);
    saveMsgTimer.current = setTimeout(() => setSaveMsg(''), 2200);
  }, []);

  // Sync external biClientId prop
  useEffect(() => {
    if (biClientId && biClientId !== clientId) setClientId(biClientId);
  }, [biClientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const clientSwot = useMemo(
    () => (clientId ? (allData[clientId] || defaultSwotData()) : null),
    [clientId, allData]
  );

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId]
  );

  // Persist helper
  const persist = useCallback((updated: Record<string, any>) => {
    setAllData(updated);
    safeSetItem(SWOT_KEY, JSON.stringify(updated));
    syncToApi(() => Promise.resolve(), 'swot-save');
  }, []);

  const updateClientSwot = useCallback(
    (changes: Record<string, any>) => {
      if (!clientId) return;
      const current = allData[clientId] || defaultSwotData();
      const updated = {
        ...allData,
        [clientId]: { ...current, ...changes, updatedAt: new Date().toISOString() },
      };
      persist(updated);
    },
    [clientId, allData, persist]
  );

  // Run auto-population for selected client
  const runAutoAnalyze = useCallback(() => {
    if (!clientId) return;

    const clientArr = selectedClient ? [selectedClient] : clients;
    const clientPayments = payments.filter((p) => p.clientId === clientId);
    const clientProspects = prospects.filter((p) => p.clientId === clientId);

    const { strengths, weaknesses, opportunities, threats } = buildAutoSWOT({
      clients: clientArr,
      payments: clientPayments,
      prospects: clientProspects,
      audits,
      intakes,
      interventions: interventionsRaw,
    });

    // Merge auto-items: keep existing manual items, replace auto ones
    const current = allData[clientId] || defaultSwotData();
    const mergeItems = (existing: any[], fresh: any[]) => {
      const manual = (existing || []).filter((i: any) => !i.isAuto);
      return [...manual, ...fresh];
    };

    updateClientSwot({
      strengths: mergeItems(current.strengths, strengths),
      weaknesses: mergeItems(current.weaknesses, weaknesses),
      opportunities: mergeItems(current.opportunities, opportunities),
      threats: mergeItems(current.threats, threats),
    });

    showSaveMsg('Auto-analysis complete');
  }, [
    clientId, selectedClient, clients, payments, prospects,
    audits, intakes, interventionsRaw, allData, updateClientSwot, showSaveMsg,
  ]);

  // AI-powered SWOT generation via xAI
  const runAiGenerate = useCallback(async () => {
    if (!clientId || aiGenerating) return;
    setAiGenerating(true);
    try {
      const result = await aiGenerateSWOT(clientId);
      if (result.success && result.data) {
        const swotData = result.data;
        // Convert AI format [{title, description}] to component format [{id, text, isAuto}]
        const toItems = (arr: any[]) => (arr || []).map((item: any) => makeItem(
          item.title ? `${item.title}: ${item.description}` : (item.description || item.text || String(item)),
          true
        ));

        // Merge: keep manual items, replace auto items with AI ones
        const current = allData[clientId] || defaultSwotData();
        const mergeItems = (existing: any[], fresh: any[]) => {
          const manual = (existing || []).filter((i: any) => !i.isAuto);
          return [...manual, ...fresh];
        };

        updateClientSwot({
          strengths: mergeItems(current.strengths, toItems(swotData.strengths)),
          weaknesses: mergeItems(current.weaknesses, toItems(swotData.weaknesses)),
          opportunities: mergeItems(current.opportunities, toItems(swotData.opportunities)),
          threats: mergeItems(current.threats, toItems(swotData.threats)),
        });

        setAiLastGenerated(swotData.generated_at || new Date().toISOString());
        showSaveMsg('AI SWOT generated');
      }
    } catch (err) {
      showSaveMsg('AI generation failed — check xAI API key');
      console.error('AI SWOT error:', err);
    } finally {
      setAiGenerating(false);
    }
  }, [clientId, aiGenerating, allData, updateClientSwot, showSaveMsg]);

  // Auto-analyze when client first selected and has no data
  useEffect(() => {
    if (!clientId) return;
    if (!allData[clientId]) {
      runAutoAnalyze();
    }
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const addItem = useCallback(
    (quadrant: string) => {
      const text = inputs[quadrant].trim();
      if (!text || !clientId) return;
      const current = allData[clientId] || defaultSwotData();
      updateClientSwot({
        [quadrant]: [...(current[quadrant] || []), makeItem(text, false)],
      });
      setInputs((prev) => ({ ...prev, [quadrant]: '' }));
    },
    [inputs, clientId, allData, updateClientSwot]
  );

  const removeItem = useCallback(
    (quadrant: string, id: string) => {
      if (!clientId) return;
      const current = allData[clientId] || defaultSwotData();
      updateClientSwot({
        [quadrant]: (current[quadrant] || []).filter((i) => i.id !== id),
      });
    },
    [clientId, allData, updateClientSwot]
  );

  const handleSave = useCallback(() => {
    if (!clientId || !clientSwot) return;
    persist({ ...allData, [clientId]: { ...clientSwot, updatedAt: new Date().toISOString() } });
    showSaveMsg('Saved!');
  }, [clientId, clientSwot, allData, persist, showSaveMsg]);

  const printReport = useCallback(() => {
    if (!clientSwot || !clientId) return;
    const clientName = escapeHtml(selectedClient?.name || 'Unknown Client');
    const biz = escapeHtml(selectedClient?.businessName || '');
    const date = new Date().toLocaleDateString();

    const renderQuadrantHtml = (items: any[], label: string, color: string) => {
      const rows = (items || [])
        .map((i) => `<li style="margin-bottom:5px;padding:4px 0;border-bottom:1px solid #f0f0f0;">${escapeHtml(i.text)}</li>`)
        .join('');
      return `
        <div style="border:2px solid ${color};border-radius:8px;overflow:hidden;break-inside:avoid;">
          <div style="background:${color}22;padding:10px 14px;font-weight:700;color:${color};font-size:1rem;">${label}</div>
          <ul style="margin:0;padding:12px 14px 12px 30px;list-style:disc;">${rows || '<li style="color:#999;">None recorded</li>'}</ul>
        </div>`;
    };

    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>SWOT Analysis — ${clientName}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;color:#1a1a2e;max-width:900px;margin:0 auto;}
        h1{color:#0a2540;margin-bottom:4px;font-size:1.5rem;}
        .meta{color:#6b7280;font-size:0.85rem;margin-bottom:20px;}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        @media print{body{padding:12px}.grid{gap:10px;}}
      </style>
    </head><body>
      <h1>SWOT Analysis — ${clientName}${biz ? ` (${biz})` : ''}</h1>
      <p class="meta">Generated: ${date} | Prepared by: ${escapeHtml(currentUser?.name || 'Admin')}</p>
      <div class="grid">
        ${renderQuadrantHtml(clientSwot.strengths, 'Strengths', '#22c55e')}
        ${renderQuadrantHtml(clientSwot.weaknesses, 'Weaknesses', '#ef4444')}
        ${renderQuadrantHtml(clientSwot.opportunities, 'Opportunities', '#3b82f6')}
        ${renderQuadrantHtml(clientSwot.threats, 'Threats', '#f97316')}
      </div>
    </body></html>`);
    w.document.close();
    w.print();
  }, [clientSwot, clientId, selectedClient, currentUser]);

  // Summary counts
  const totalItems = clientSwot
    ? (clientSwot.strengths?.length || 0) +
      (clientSwot.weaknesses?.length || 0) +
      (clientSwot.opportunities?.length || 0) +
      (clientSwot.threats?.length || 0)
    : 0;

  return (
    <div className="bi-swot">
      {/* Header */}
      <div className="bi-swot-header">
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: '1.25rem', color: 'var(--text-bright)' }}>
            <Shield size={20} />
            SWOT Analysis
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', margin: '4px 0 0' }}>
            Strengths, Weaknesses, Opportunities, Threats — auto-populated from CRM data.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {clientSwot && (
            <>
              <button className="btn-secondary btn-sm" onClick={runAutoAnalyze}>
                <RefreshCw size={14} /> Auto-Analyze
              </button>
              <button
                className="btn-secondary btn-sm"
                onClick={runAiGenerate}
                disabled={aiGenerating}
                style={aiGenerating ? { opacity: 0.6, cursor: 'wait' } : {}}
              >
                <Brain size={14} /> {aiGenerating ? 'Generating...' : 'AI Generate'}
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

      {/* Client Selector */}
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

      {/* Empty states */}
      {!clientId && (
        <div className="bi-exec-empty-state">
          <Shield size={48} />
          <p>Select a client to view or build their SWOT analysis.</p>
        </div>
      )}

      {clientId && clientSwot && (
        <>
          {/* Stats row */}
          <div className="bi-stats-row" style={{ marginBottom: 20 }}>
            <div className="bi-stat">
              <Users size={14} />
              <span>{selectedClient?.name || 'Client'}</span>
              {selectedClient?.businessName && (
                <small>{selectedClient.businessName}</small>
              )}
            </div>
            <div className="bi-stat">
              <BarChart3 size={14} />
              <span>{totalItems}</span>
              <small>total items</small>
            </div>
            {clientSwot.updatedAt && (
              <div className="bi-stat">
                <Target size={14} />
                <span>Last updated</span>
                <small>{new Date(clientSwot.updatedAt).toLocaleDateString()}</small>
              </div>
            )}
            {aiLastGenerated && (
              <div className="bi-stat">
                <Brain size={14} />
                <span>AI Generated</span>
                <small>{new Date(aiLastGenerated).toLocaleDateString()}</small>
              </div>
            )}
            <div className="bi-stat">
              <TrendingUp size={14} />
              <span style={{ color: '#22c55e' }}>{clientSwot.strengths?.length || 0}</span>
              <small>Strengths</small>
            </div>
            <div className="bi-stat">
              <TrendingDown size={14} />
              <span style={{ color: '#ef4444' }}>{clientSwot.weaknesses?.length || 0}</span>
              <small>Weaknesses</small>
            </div>
            <div className="bi-stat">
              <Lightbulb size={14} />
              <span style={{ color: '#3b82f6' }}>{clientSwot.opportunities?.length || 0}</span>
              <small>Opportunities</small>
            </div>
            <div className="bi-stat">
              <AlertTriangle size={14} />
              <span style={{ color: '#f97316' }}>{clientSwot.threats?.length || 0}</span>
              <small>Threats</small>
            </div>
          </div>

          {/* 2x2 SWOT Grid */}
          <div className="bi-swot-grid">
            {QUADRANTS.map((q) => {
              const items = clientSwot[q.key] || [];
              const Icon = q.icon;
              return (
                <div
                  key={q.key}
                  className="bi-swot-quadrant"
                  style={{
                    border: `2px solid ${q.border}`,
                    background: q.bg,
                    borderRadius: 10,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Quadrant header */}
                  <div
                    style={{
                      background: q.headerBg,
                      borderBottom: `1px solid ${q.border}40`,
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Icon size={16} style={{ color: q.iconColor, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: q.iconColor }}>
                        {q.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginTop: 1 }}>
                        {q.description}
                      </div>
                    </div>
                    <span
                      style={{
                        marginLeft: 'auto',
                        background: `${q.border}22`,
                        color: q.iconColor,
                        borderRadius: 12,
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      {items.length}
                    </span>
                  </div>

                  {/* Items list */}
                  <ul
                    style={{
                      flex: 1,
                      margin: 0,
                      padding: '10px 14px',
                      listStyle: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    {items.length === 0 && (
                      <li
                        style={{
                          color: 'var(--gray-500)',
                          fontSize: '0.8rem',
                          fontStyle: 'italic',
                          padding: '8px 0',
                        }}
                      >
                        No items yet — click Auto-Analyze or add manually below.
                      </li>
                    )}
                    {items.map((item) => (
                      <li
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8,
                          padding: '6px 8px',
                          background: 'var(--glass-bg)',
                          borderRadius: 6,
                          border: '1px solid var(--glass-border)',
                          fontSize: '0.82rem',
                          color: 'var(--text-bright)',
                          transition: 'background 0.15s',
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: q.iconColor,
                            marginTop: 5,
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ flex: 1, lineHeight: 1.4 }}>{item.text}</span>
                        {item.isAuto && (
                          <span
                            style={{
                              fontSize: '0.6rem',
                              background: `${q.border}20`,
                              color: q.iconColor,
                              borderRadius: 3,
                              padding: '1px 5px',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.3px',
                              flexShrink: 0,
                            }}
                          >
                            auto
                          </span>
                        )}
                        <button
                          onClick={() => removeItem(q.key, item.id)}
                          aria-label={`Remove ${item.text} from ${q.label}`}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--gray-400)',
                            padding: 2,
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            flexShrink: 0,
                            transition: 'color 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--gray-400)')}
                        >
                          <X size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>

                  {/* Manual add input */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      padding: '10px 12px',
                      borderTop: `1px solid ${q.border}30`,
                      background: 'var(--glass-bg)',
                    }}
                  >
                    <input
                      type="text"
                      value={inputs[q.key]}
                      onChange={(e) =>
                        setInputs((prev) => ({ ...prev, [q.key]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addItem(q.key);
                      }}
                      placeholder={`Add ${q.label.toLowerCase()} item…`}
                      aria-label={`Add item to ${q.label}`}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 6,
                        background: 'var(--glass-bg)',
                        color: 'var(--text-bright)',
                        fontSize: '0.82rem',
                        outline: 'none',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = q.border)}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--glass-border)')}
                    />
                    <button
                      onClick={() => addItem(q.key)}
                      aria-label={`Add to ${q.label}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 12px',
                        background: q.border,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'opacity 0.15s',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      <Plus size={13} /> Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom legend */}
          <div
            style={{
              marginTop: 16,
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
              <strong style={{ color: 'var(--text-bright)' }}>Auto</strong> items are generated
              from audit scores, win rate, DSO, revenue concentration, and intervention ROI.
            </span>
            <span>Manual items are preserved when you re-run Auto-Analyze.</span>
          </div>
        </>
      )}
    </div>
  );
}
