import React, { useState, useMemo } from 'react';
import {
  Calendar, Plus, Trash2, Save, Printer, CheckCircle,
  Clock, AlertCircle, ChevronDown, ChevronRight, Target,
  FileText, Edit3, X, Zap,
} from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import { safeGetItem, safeSetItem, generateId, escapeHtml } from '../../../constants';
import { syncToApi } from '../../../api/apiSync';

const EXEC_KEY = 'threeseas_execution_plans';
const STATUSES = ['pending', 'in_progress', 'completed', 'blocked'];
const STATUS_COLORS = { pending: '#9ca3af', in_progress: '#3b82f6', completed: '#22c55e', blocked: '#ef4444' };
const STATUS_ICONS = { pending: Clock, in_progress: AlertCircle, completed: CheckCircle, blocked: AlertCircle };

const DECISION_RULES = [
  'No strategy without baseline + target KPI',
  'No strategy without owner + due date',
  'Prefer actions that improve both revenue and margin',
  'Stop initiatives missing leading indicators for 2 cycles',
  'Protect cash: deprioritize long-payback bets unless strategic',
];

const WAVES = [
  { id: 'wave1', label: 'Days 0–30', subtitle: 'Quick Wins', effort: '50%', tasks: ['Complete audit + maturity scoring', 'Finalize KPI dictionary', 'Launch top 3 quick wins', 'Start weekly revenue review'] },
  { id: 'wave2', label: 'Days 31–60', subtitle: 'Core Improvements', effort: '35%', tasks: ['Run controlled experiments', 'Implement pricing/funnel fixes', 'Launch retention interventions', 'Track leading indicators'] },
  { id: 'wave3', label: 'Days 61–90', subtitle: 'Strategic Bets', effort: '15%', tasks: ['Scale winners, stop low-ROI actions', 'Re-forecast impact', 'Lock next-quarter strategy plan'] },
];

function defaultItem() {
  return {
    id: generateId(), title: '', status: 'pending', owner: '',
    baselineKPI: '', targetKPI: '', actualKPI: '',
    linkedAuditSection: '', linkedRecommendation: '', notes: '',
  };
}

function defaultPlan() {
  return {
    id: generateId(),
    name: 'Execution Plan',
    startDate: new Date().toISOString().split('T')[0],
    waves: { wave1: [], wave2: [], wave3: [] },
    reviewLog: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

interface ExecutionTrackerProps {
  biClientId?: string;
  onBiClientChange?: (clientId: string) => void;
}

export default function ExecutionTracker({ biClientId, onBiClientChange }: ExecutionTrackerProps) {
  const { clients } = useAppContext();
  const activeClients = clients.filter(c => c.status !== 'archived' && c.status !== 'rejected');

  const [clientId, setClientId] = useState(biClientId || '');
  const [allPlans, setAllPlans] = useState<Record<string, any[]>>(() => safeGetItem(EXEC_KEY, {}));
  const [activePlanId, setActivePlanId] = useState('');
  const [expandedWaves, setExpandedWaves] = useState(new Set(['wave1', 'wave2', 'wave3']));
  const [showRules, setShowRules] = useState(false);
  const [newReviewNote, setNewReviewNote] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState('');

  const clientPlans = useMemo(() => {
    if (!clientId) return [];
    return allPlans[clientId] || [];
  }, [clientId, allPlans]);

  // Auto-select first plan when client changes
  const activePlan = useMemo(() => {
    if (!activePlanId) return clientPlans.length > 0 ? clientPlans[0] : null;
    return clientPlans.find(p => p.id === activePlanId) || (clientPlans.length > 0 ? clientPlans[0] : null);
  }, [clientPlans, activePlanId]);

  // Full persist: state + localStorage + toast (for discrete actions)
  const persistPlans = (updated: Record<string, any[]>) => {
    setAllPlans(updated);
    safeSetItem(EXEC_KEY, JSON.stringify(updated));
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  // Local-only update: state only, no localStorage write (for per-keystroke changes)
  const updatePlanLocally = (updatedPlan: any) => {
    if (!clientId) return;
    updatedPlan.updatedAt = new Date().toISOString();
    const clientList = (allPlans[clientId] || []).map(p => p.id === updatedPlan.id ? updatedPlan : p);
    setAllPlans({ ...allPlans, [clientId]: clientList });
  };

  // Explicit save button handler
  const handleSave = () => {
    persistPlans(allPlans);
  };

  const createPlan = () => {
    if (!clientId) return;
    const plan = defaultPlan();
    const clientList = [...(allPlans[clientId] || []), plan];
    persistPlans({ ...allPlans, [clientId]: clientList });
    setActivePlanId(plan.id);
  };

  const deletePlan = (id: string | undefined) => {
    if (!clientId || !window.confirm('Delete this execution plan?')) return;
    const clientList = (allPlans[clientId] || []).filter(p => p.id !== id);
    persistPlans({ ...allPlans, [clientId]: clientList });
    setActivePlanId(clientList.length > 0 ? clientList[0].id : '');
  };

  const addItem = (waveId: string) => {
    if (!activePlan) return;
    const item = defaultItem();
    const updated = { ...activePlan, waves: { ...activePlan.waves, [waveId]: [...(activePlan.waves[waveId] || []), item] } };
    updated.updatedAt = new Date().toISOString();
    const clientList = (allPlans[clientId] || []).map(p => p.id === updated.id ? updated : p);
    persistPlans({ ...allPlans, [clientId]: clientList });
    setEditingItem(item.id);
  };

  const updateItem = (waveId: string, itemId: string, field: string, value: any) => {
    if (!activePlan) return;
    const updated = {
      ...activePlan,
      waves: {
        ...activePlan.waves,
        [waveId]: activePlan.waves[waveId].map(it => it.id === itemId ? { ...it, [field]: value } : it),
      },
    };
    updatePlanLocally(updated);
  };

  const deleteItem = (waveId: string, itemId: string) => {
    if (!activePlan) return;
    const updated = {
      ...activePlan,
      waves: { ...activePlan.waves, [waveId]: activePlan.waves[waveId].filter(it => it.id !== itemId) },
    };
    updated.updatedAt = new Date().toISOString();
    const clientList = (allPlans[clientId] || []).map(p => p.id === updated.id ? updated : p);
    persistPlans({ ...allPlans, [clientId]: clientList });
  };

  const addReviewNote = () => {
    if (!newReviewNote.trim() || !activePlan) return;
    const entry = { id: generateId(), date: new Date().toISOString(), note: newReviewNote.trim() };
    const updated = { ...activePlan, reviewLog: [entry, ...(activePlan.reviewLog || [])] };
    updated.updatedAt = new Date().toISOString();
    const clientList = (allPlans[clientId] || []).map(p => p.id === updated.id ? updated : p);
    persistPlans({ ...allPlans, [clientId]: clientList });
    setNewReviewNote('');
  };

  const toggleWave = (id: string) => {
    setExpandedWaves(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getWaveProgress = (waveId: string): { total: number; completed: number; pct: number } => {
    if (!activePlan) return { total: 0, completed: 0, pct: 0 };
    const items = activePlan.waves[waveId] || [];
    const completed = items.filter(it => it.status === 'completed').length;
    return { total: items.length, completed, pct: items.length > 0 ? Math.round((completed / items.length) * 100) : 0 };
  };

  const overallProgress = useMemo(() => {
    if (!activePlan) return 0;
    let total = 0, completed = 0;
    Object.values(activePlan.waves).forEach((items: any) => {
      total += items.length;
      completed += items.filter((it: any) => it.status === 'completed').length;
    });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [activePlan]);

  const printPlan = () => {
    if (!activePlan) return;
    const clientName = escapeHtml(clients.find(c => c.id === clientId)?.name || 'Client');
    const planName = escapeHtml(activePlan.name || 'Execution Plan');
    const w = window.open('', '_blank');
    const wavesHtml = WAVES.map(wave => {
      const items = activePlan.waves[wave.id] || [];
      const rows = items.map(it => `<tr><td>${escapeHtml(it.title || '(untitled)')}</td><td>${escapeHtml(it.status)}</td><td>${escapeHtml(it.owner || '—')}</td><td>${escapeHtml(it.baselineKPI || '—')}</td><td>${escapeHtml(it.targetKPI || '—')}</td><td>${escapeHtml(it.actualKPI || '—')}</td></tr>`).join('');
      const prog = getWaveProgress(wave.id);
      return `<h3>${escapeHtml(wave.label)} — ${escapeHtml(wave.subtitle)} (${escapeHtml(wave.effort)})</h3><p>Progress: ${prog.completed}/${prog.total} (${prog.pct}%)</p><table><thead><tr><th>Item</th><th>Status</th><th>Owner</th><th>Baseline</th><th>Target</th><th>Actual</th></tr></thead><tbody>${rows || '<tr><td colspan="6">No items</td></tr>'}</tbody></table>`;
    }).join('');
    const reviews = (activePlan.reviewLog || []).map(r => `<li><strong>${new Date(r.date).toLocaleDateString()}</strong>: ${escapeHtml(r.note)}</li>`).join('');
    if (w) w.document.write(`<!DOCTYPE html><html><head><title>Execution Plan — ${clientName}</title><style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse;margin:8px 0 24px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}th{background:#f5f5f5}h1{color:#0a2540}.progress{font-size:1.3rem;color:#3b82f6}</style></head><body><h1>${planName} — ${clientName}</h1><p class="progress">Overall Progress: ${overallProgress}%</p><p>Start: ${escapeHtml(activePlan.startDate || '')} | Generated: ${new Date().toLocaleDateString()}</p>${wavesHtml}<h3>Weekly Review Log</h3><ul>${reviews || '<li>No reviews yet</li>'}</ul></body></html>`);
    if (w) w.document.close();
    if (w) w.print();
  };

  const KPI_KEY = 'threeseas_bi_kpi_snapshots';
  const KPI_CATEGORIES = {
    total_revenue: 'Revenue Optimization', revenue_growth: 'Revenue Optimization',
    avg_order_value: 'Revenue Optimization', arpu: 'Revenue Optimization',
    revenue_concentration: 'Revenue Optimization',
    win_rate: 'Sales Process', avg_deal_size: 'Sales Process',
    sales_cycle: 'Sales Process', lead_conversion: 'Sales Process',
    pipeline_coverage: 'Sales Process',
    gross_margin: 'Financial Health', dso: 'Financial Health',
    rev_per_fte: 'Financial Health', gp_per_fte: 'Financial Health',
    project_completion: 'Operations', data_completeness: 'Operations', ifsr: 'Operations',
  };

  const generateFromKPIs = () => {
    if (!clientId) return;
    const kpiData = safeGetItem(KPI_KEY, {});
    const clientKpis = kpiData[clientId];
    if (!clientKpis || !clientKpis.kpis) {
      setSaveMsg('No KPI data found for this client');
      setTimeout(() => setSaveMsg(''), 3000);
      return;
    }
    const wave1 = [], wave2 = [], wave3 = [];
    Object.entries(clientKpis.kpis).forEach(([kpiId, kpi]: [string, any]) => {
      const current = kpi.current;
      const target = kpi.target;
      if (current === null || current === undefined || target === null || target === undefined || target === 0) return;

      // For DSO/sales_cycle, lower is better
      const lowerIsBetter = kpi.unit === 'days';
      const gap = lowerIsBetter
        ? ((current - target) / target) * 100
        : ((target - current) / target) * 100;
      if (gap <= 0) return; // on-track or better

      const label = kpi.customLabel || kpiId.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      const category = (KPI_CATEGORIES as Record<string, string>)[kpiId] || 'Operations';
      const title = `${category}: ${label} (${gap.toFixed(0)}% gap)`;
      const item = {
        ...defaultItem(),
        title,
        baselineKPI: `Current: ${current}`,
        targetKPI: `Target: ${target}`,
      };

      if (gap > 30) {
        wave1.push(item); // high priority
      } else if (gap > 10) {
        wave2.push(item); // medium priority
      } else {
        wave3.push(item); // low priority
      }
    });

    if (wave1.length === 0 && wave2.length === 0 && wave3.length === 0) {
      setSaveMsg('No KPI gaps found (all on-track)');
      setTimeout(() => setSaveMsg(''), 3000);
      return;
    }

    const plan = {
      ...defaultPlan(),
      name: `Auto-Generated from KPIs (${new Date().toLocaleDateString()})`,
      waves: { wave1, wave2, wave3 },
    };
    const clientList = [...(allPlans[clientId] || []), plan];
    persistPlans({ ...allPlans, [clientId]: clientList });
    setActivePlanId(plan.id);
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setClientId(e.target.value);
    setActivePlanId('');
    setEditingItem(null);
    onBiClientChange?.(e.target.value);
  };

  return (
    <div className="bi-exec-tracker">
      <div className="bi-exec-header">
        <div>
          <h3><Target size={20} /> 30/60/90 Execution Plan</h3>
          <p className="bi-exec-sub">Track execution across three waves with KPI targets per client.</p>
        </div>
        <div className="bi-exec-header-actions">
          {activePlan && (
            <div className="bi-exec-overall-progress">
              <span>{overallProgress}%</span>
              <div className="bi-exec-progress-bar">
                <div className="bi-exec-progress-fill" style={{ width: `${overallProgress}%` }} />
              </div>
            </div>
          )}
          <button className="btn-secondary" onClick={() => setShowRules(!showRules)}>
            <FileText size={16} /> Rules
          </button>
          {activePlan && <button className="btn-secondary" onClick={printPlan}><Printer size={16} /> Print</button>}
          {activePlan && <button className="btn-primary" onClick={handleSave}><Save size={16} /> Save</button>}
          {clientId && <button className="btn-secondary" onClick={generateFromKPIs}><Zap size={16} /> Generate from KPIs</button>}
          {clientId && <button className="btn-primary" onClick={createPlan}><Plus size={16} /> New Plan</button>}
          {saveMsg && <span className="bi-save-msg">{saveMsg}</span>}
        </div>
      </div>

      {showRules && (
        <div className="bi-exec-rules">
          <h4>Decision Rules</h4>
          <ol>{DECISION_RULES.map((r, i) => <li key={i}>{r}</li>)}</ol>
        </div>
      )}

      <div className="bi-audit-client-selector">
        <select value={clientId} onChange={handleClientChange}>
          <option value="">-- Select Client --</option>
          {activeClients.map(c => <option key={c.id} value={c.id}>{c.name}{c.businessName ? ` (${c.businessName})` : ''}</option>)}
        </select>
      </div>

      {clientId && clientPlans.length === 0 && (
        <div className="bi-exec-empty-state">
          <Target size={48} />
          <p>No execution plans for this client yet.</p>
          <button className="btn-primary" onClick={createPlan}><Plus size={16} /> Create Plan</button>
        </div>
      )}

      {clientPlans.length > 1 && (
        <div className="bi-exec-plan-selector">
          <select value={activePlan?.id || ''} onChange={e => setActivePlanId(e.target.value)}>
            {clientPlans.map(p => <option key={p.id} value={p.id}>{p.name} ({new Date(p.createdAt).toLocaleDateString()})</option>)}
          </select>
          <button className="btn-sm btn-delete" onClick={() => deletePlan(activePlan?.id)}><Trash2 size={14} /></button>
        </div>
      )}

      {activePlan && (
        <>
          <div className="bi-exec-plan-meta">
            <div className="form-group">
              <label>Plan Name</label>
              <input type="text" value={activePlan.name} onChange={e => updatePlanLocally({ ...activePlan, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={activePlan.startDate} onChange={e => updatePlanLocally({ ...activePlan, startDate: e.target.value })} />
            </div>
          </div>

          <div className="bi-exec-waves">
            {WAVES.map(wave => {
              const isExpanded = expandedWaves.has(wave.id);
              const progress = getWaveProgress(wave.id);
              const items = activePlan.waves[wave.id] || [];
              return (
                <div key={wave.id} className={`bi-exec-wave ${isExpanded ? 'expanded' : ''}`}>
                  <button className="bi-exec-wave-header" onClick={() => toggleWave(wave.id)}>
                    <div className="bi-exec-wave-title">
                      <Calendar size={16} />
                      <strong>{wave.label}</strong>
                      <span className="bi-exec-wave-subtitle">{wave.subtitle} ({wave.effort})</span>
                    </div>
                    <div className="bi-exec-wave-progress">
                      <span>{progress.completed}/{progress.total}</span>
                      <div className="bi-exec-progress-bar-sm">
                        <div className="bi-exec-progress-fill" style={{ width: `${progress.pct}%` }} />
                      </div>
                      <span>{progress.pct}%</span>
                    </div>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {isExpanded && (
                    <div className="bi-exec-wave-body">
                      <div className="bi-exec-wave-ref">
                        <strong>Reference tasks:</strong> {wave.tasks.join(' · ')}
                      </div>
                      {items.map(item => {
                        const StatusIcon = STATUS_ICONS[item.status] || Clock;
                        const isEditing = editingItem === item.id;
                        return (
                          <div key={item.id} className={`bi-exec-item status-${item.status}`}>
                            <div className="bi-exec-item-header">
                              <StatusIcon size={14} style={{ color: STATUS_COLORS[item.status] }} />
                              {isEditing ? (
                                <input type="text" className="bi-exec-item-title-input" value={item.title} onChange={e => updateItem(wave.id, item.id, 'title', e.target.value)} placeholder="Item title..." autoFocus />
                              ) : (
                                <span className="bi-exec-item-title" onClick={() => setEditingItem(item.id)}>{item.title || '(untitled)'}</span>
                              )}
                              <select className="bi-exec-status-select" value={item.status} onChange={e => updateItem(wave.id, item.id, 'status', e.target.value)}>
                                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                              </select>
                              <div className="bi-exec-item-actions">
                                <button onClick={() => setEditingItem(isEditing ? null : item.id)} aria-label="Edit">
                                  {isEditing ? <X size={14} /> : <Edit3 size={14} />}
                                </button>
                                <button onClick={() => deleteItem(wave.id, item.id)} aria-label="Delete"><Trash2 size={14} /></button>
                              </div>
                            </div>
                            {isEditing && (
                              <div className="bi-exec-item-detail">
                                <div className="bi-exec-item-grid">
                                  <div className="form-group">
                                    <label>Owner</label>
                                    <input type="text" value={item.owner} onChange={e => updateItem(wave.id, item.id, 'owner', e.target.value)} placeholder="Name..." />
                                  </div>
                                  <div className="form-group">
                                    <label>Baseline KPI</label>
                                    <input type="text" value={item.baselineKPI} onChange={e => updateItem(wave.id, item.id, 'baselineKPI', e.target.value)} placeholder="e.g. $5,000/mo" />
                                  </div>
                                  <div className="form-group">
                                    <label>Target KPI</label>
                                    <input type="text" value={item.targetKPI} onChange={e => updateItem(wave.id, item.id, 'targetKPI', e.target.value)} placeholder="e.g. $8,000/mo" />
                                  </div>
                                  <div className="form-group">
                                    <label>Actual KPI</label>
                                    <input type="text" value={item.actualKPI} onChange={e => updateItem(wave.id, item.id, 'actualKPI', e.target.value)} placeholder="Current value..." />
                                  </div>
                                </div>
                                <div className="form-group">
                                  <label>Notes</label>
                                  <textarea value={item.notes || ''} onChange={e => updateItem(wave.id, item.id, 'notes', e.target.value)} rows={2} placeholder="Notes..." />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <button className="bi-exec-add-item" onClick={() => addItem(wave.id)}>
                        <Plus size={14} /> Add Item
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Weekly Review Log */}
          <div className="bi-exec-review">
            <h4><FileText size={16} /> Weekly Review Log</h4>
            <div className="bi-exec-review-input">
              <input type="text" value={newReviewNote} onChange={e => setNewReviewNote(e.target.value)} placeholder="Add review note..." onKeyDown={e => e.key === 'Enter' && addReviewNote()} />
              <button className="btn-primary btn-sm" onClick={addReviewNote}>Add</button>
            </div>
            <div className="bi-exec-review-list">
              {(activePlan.reviewLog || []).map(entry => (
                <div key={entry.id} className="bi-exec-review-entry">
                  <span className="bi-exec-review-date">{new Date(entry.date).toLocaleDateString()}</span>
                  <span className="bi-exec-review-note">{entry.note}</span>
                </div>
              ))}
              {(!activePlan.reviewLog || activePlan.reviewLog.length === 0) && (
                <p className="bi-exec-empty">No reviews yet. Add your first weekly review note above.</p>
              )}
            </div>
          </div>
        </>
      )}

      {!clientId && (
        <div className="bi-exec-empty-state">
          <Target size={48} />
          <p>Select a client to view or create execution plans.</p>
        </div>
      )}
    </div>
  );
}
