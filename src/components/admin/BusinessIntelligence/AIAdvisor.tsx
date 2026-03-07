import React, { useState, useMemo, useCallback } from 'react';
import {
  Brain, Sparkles, RefreshCw, ChevronDown, ChevronRight,
  CheckCircle, XCircle, ArrowRight, Clock, AlertTriangle,
  Trash2, ExternalLink, Copy, Eye, Shield,
} from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import { safeGetItem } from '../../../constants';
import { aiRecommendationsApi } from '../../../api/aiRecommendations';
import { syncToApi } from '../../../api/apiSync';

// ─── Constants ───────────────────────────────────────────────────────────────

const PERIOD_TYPES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const ANALYSIS_TYPES = [
  { value: 'full', label: 'Full Analysis' },
  { value: 'financial', label: 'Financial Focus' },
  { value: 'seo', label: 'SEO & Digital' },
  { value: 'growth', label: 'Growth & KPI' },
  { value: 'strategic', label: 'Strategic' },
];

const HEALTH_COLORS = {
  critical: '#ef4444', at_risk: '#f59e0b', stable: '#3b82f6',
  growing: '#22c55e', exceptional: '#10b981',
};
const HEALTH_LABELS = {
  critical: 'Critical', at_risk: 'At Risk', stable: 'Stable',
  growing: 'Growing', exceptional: 'Exceptional',
};

const PRIORITY_COLORS = {
  critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#6b7280',
};

const STATUS_LABELS = {
  new: 'New', reviewed: 'Reviewed', accepted: 'Accepted',
  declined: 'Declined', converted: 'Converted',
};

const DATA_SOURCES = [
  'client_profile', 'intake', 'audits', 'financials', 'ad_spend',
  'growth_targets', 'interventions', 'projects', 'invoices',
  'prospects', 'service_requests', 'execution_plans',
  'swot', 'porters', 'market_sizing', 'kpi_snapshots', 'forecasting',
];

// ─── Component ───────────────────────────────────────────────────────────────

interface AIAdvisorProps {
  biClientId: string;
  onBiClientChange: (id: string) => void;
}

export default function AIAdvisor({ biClientId, onBiClientChange }: AIAdvisorProps) {
  const { clients = [] } = useAppContext();

  // Panel state
  const [activePanel, setActivePanel] = useState<string>('configure');

  // Configure panel
  const [periodType, setPeriodType] = useState<string>('monthly');
  const [periodLabel, setPeriodLabel] = useState<string>('');
  const [includeLocal, setIncludeLocal] = useState<boolean>(true);
  const [analysisType, setAnalysisType] = useState<string>('full');

  // Snapshot/analysis state
  const [compiling, setCompiling] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [lastSnapshot, setLastSnapshot] = useState<any>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  // Results panel
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Active client list for selector
  const activeClients = useMemo(
    () => clients.filter(c => c.status === 'active').sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [clients]
  );

  // Gather localStorage data for the selected client
  const gatherLocalData = useCallback(() => {
    if (!biClientId) return null;
    return {
      swot: (safeGetItem('threeseas_bi_swot', {}))[biClientId] || null,
      porters: (safeGetItem('threeseas_bi_porters', {}))[biClientId] || null,
      market_sizing: (safeGetItem('threeseas_bi_market_sizing', {}))[biClientId] || null,
      kpi_snapshots: (safeGetItem('threeseas_bi_kpi_snapshots', {}))[biClientId] || null,
      forecasting: (safeGetItem('threeseas_bi_forecasting', {}))[biClientId] || null,
    };
  }, [biClientId]);

  // Compile snapshot
  const handleCompile = async () => {
    if (!biClientId) return;
    setCompiling(true);
    setError('');
    try {
      const result = await aiRecommendationsApi.compileSnapshot(biClientId, {
        period_type: periodType,
        period_label: periodLabel || undefined,
        localStorage_data: includeLocal ? gatherLocalData() : undefined,
      });
      setLastSnapshot(result.data);
      setActivePanel('analyze');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to compile snapshot');
    } finally {
      setCompiling(false);
    }
  };

  // Run analysis
  const handleAnalyze = async (snapshotId: string | null) => {
    if (!biClientId) return;
    setAnalyzing(true);
    setError('');
    try {
      const payload: Record<string, any> = {
        analysis_type: analysisType,
        localStorage_data: includeLocal ? gatherLocalData() : undefined,
      };
      if (snapshotId) payload.snapshot_id = snapshotId;
      else {
        payload.period_type = periodType;
        payload.period_label = periodLabel || undefined;
      }

      const result = await aiRecommendationsApi.analyze(biClientId, payload);
      setCurrentAnalysis(result.data);
      setActivePanel('results');
      loadAnalyses();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // Load analysis history
  const loadAnalyses = async () => {
    if (!biClientId) return;
    try {
      const result = await aiRecommendationsApi.listAnalyses(biClientId);
      setAnalyses(result.data || []);
    } catch (e) { /* silent */ }
  };

  // Load specific analysis
  const loadAnalysis = async (analysisId: string) => {
    try {
      const result = await aiRecommendationsApi.getAnalysis(biClientId, analysisId);
      setCurrentAnalysis(result.data);
      setActivePanel('results');
    } catch (e) {
      setError('Failed to load analysis');
    }
  };

  // Update item status
  const handleItemAction = async (itemId: string, status: string) => {
    if (!currentAnalysis) return;
    try {
      await aiRecommendationsApi.updateItem(biClientId, currentAnalysis.id, itemId, { admin_status: status });
      // Update local state
      setCurrentAnalysis((prev: any) => ({
        ...prev,
        items: prev.items.map((i: any) => i.id === itemId ? { ...i, admin_status: status } : i),
      }));
    } catch (e) { setError('Failed to update item'); }
  };

  // Delete analysis
  const handleDeleteAnalysis = async (analysisId: string) => {
    try {
      await aiRecommendationsApi.deleteAnalysis(biClientId, analysisId);
      setAnalyses((prev: any[]) => prev.filter((a: any) => a.id !== analysisId));
      if (currentAnalysis?.id === analysisId) setCurrentAnalysis(null);
    } catch (e) { setError('Failed to delete analysis'); }
  };

  // Toggle expand
  const toggleExpand = (id: string) => setExpandedItems((prev: Set<string>) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // Filter items
  const filteredItems = useMemo(() => {
    if (!currentAnalysis?.items) return [];
    return currentAnalysis.items.filter(item => {
      if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      if (filterStatus !== 'all' && item.admin_status !== filterStatus) return false;
      return true;
    });
  }, [currentAnalysis, filterPriority, filterCategory, filterStatus]);

  // Get unique categories from items
  const categories = useMemo(() => {
    if (!currentAnalysis?.items) return [];
    return [...new Set(currentAnalysis.items.map((i: any) => i.category).filter(Boolean))] as string[];
  }, [currentAnalysis]);

  // Webhook URL
  const webhookBaseUrl = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    return `${base}/ai-recommendations/webhook`;
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bi-panel">
      <div className="bi-header">
        <h2><Brain size={20} /> AI Advisor</h2>
        <select value={biClientId || ''} onChange={e => onBiClientChange(e.target.value)} className="bi-client-select">
          <option value="">Select a client...</option>
          {activeClients.map(c => <option key={c.id} value={c.id}>{c.name || c.business_name}</option>)}
        </select>
      </div>

      {!biClientId && <p className="bi-empty">Select a client to begin AI analysis.</p>}

      {biClientId && (
        <>
          {/* Panel Tabs */}
          <div className="bi-tabs" style={{ marginBottom: '1rem' }}>
            {[
              { id: 'configure', label: 'Configure' },
              { id: 'analyze', label: 'Analyze' },
              { id: 'results', label: 'Results' },
              { id: 'webhook', label: 'Webhook' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`bi-tab ${activePanel === tab.id ? 'active' : ''}`}
                onClick={() => { setActivePanel(tab.id); if (tab.id === 'analyze') loadAnalyses(); }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error && <div className="bi-error" style={{ color: '#ef4444', padding: '0.5rem 1rem', background: '#fef2f2', borderRadius: 6, marginBottom: '1rem' }}>{error}<button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button></div>}

          {/* ─── Panel 1: Configure & Compile ─── */}
          {activePanel === 'configure' && (
            <div className="bi-section">
              <h3>Compile Data Snapshot</h3>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                Gather all data for this client into a snapshot that AI can analyze.
              </p>

              <div className="bi-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label className="bi-label">Period Type</label>
                  <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="bi-input">
                    {PERIOD_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="bi-label">
                    Period {periodType === 'daily' ? '(Date)' : periodType === 'weekly' ? '(e.g. 2026-W09)' : periodType === 'monthly' ? '(e.g. 2026-03)' : '(e.g. 2026)'}
                  </label>
                  <input
                    type={periodType === 'daily' ? 'date' : 'text'}
                    value={periodLabel}
                    onChange={e => setPeriodLabel(e.target.value)}
                    placeholder={periodType === 'daily' ? '' : periodType === 'weekly' ? '2026-W09' : periodType === 'monthly' ? '2026-03' : '2026'}
                    className="bi-input"
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={includeLocal} onChange={e => setIncludeLocal(e.target.checked)} />
                Include localStorage data (SWOT, Porter's, Market Sizing, KPIs, Forecasting)
              </label>

              <button
                onClick={handleCompile}
                disabled={compiling}
                className="bi-btn bi-btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {compiling ? <><RefreshCw size={16} className="spin" /> Compiling...</> : <><Sparkles size={16} /> Compile Snapshot</>}
              </button>

              {lastSnapshot && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                  <h4 style={{ margin: '0 0 0.75rem', color: '#16a34a' }}>Snapshot Compiled</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <span>Period: <strong>{lastSnapshot.period_type} — {lastSnapshot.period_label}</strong></span>
                    <span>Completeness: <strong>{lastSnapshot.data_completeness_score}%</strong></span>
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <strong style={{ fontSize: '0.8rem', color: '#374151' }}>Data Sources Found:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                      {DATA_SOURCES.map(src => {
                        const found = (lastSnapshot.data_sources_included || []).includes(src);
                        return (
                          <span key={src} style={{
                            padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem',
                            background: found ? '#dcfce7' : '#f3f4f6',
                            color: found ? '#16a34a' : '#9ca3af',
                            border: `1px solid ${found ? '#bbf7d0' : '#e5e7eb'}`,
                          }}>
                            {found ? '\u2713' : '\u2717'} {src.replace(/_/g, ' ')}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAnalyze(lastSnapshot.snapshotId)}
                    disabled={analyzing}
                    className="bi-btn bi-btn-primary"
                    style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {analyzing ? <><RefreshCw size={16} className="spin" /> Analyzing...</> : <><Brain size={16} /> Run AI Analysis on This Snapshot</>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── Panel 2: Analyze ─── */}
          {activePanel === 'analyze' && (
            <div className="bi-section">
              <h3>Run AI Analysis</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', marginBottom: '1.5rem' }}>
                <div>
                  <label className="bi-label">Analysis Type</label>
                  <select value={analysisType} onChange={e => setAnalysisType(e.target.value)} className="bi-input">
                    {ANALYSIS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => handleAnalyze(null)}
                  disabled={analyzing}
                  className="bi-btn bi-btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: 'fit-content' }}
                >
                  {analyzing
                    ? <><RefreshCw size={16} className="spin" /> Analyzing (may take 30s)...</>
                    : <><Brain size={16} /> Compile &amp; Analyze</>}
                </button>
              </div>

              <h4 style={{ marginBottom: '0.75rem' }}>Analysis History</h4>
              {analyses.length === 0 && <p className="bi-empty">No analyses yet. Run one above.</p>}
              {analyses.length > 0 && (
                <div className="bi-table-wrap">
                  <table className="bi-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Health</th>
                        <th>Recs</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyses.map(a => (
                        <tr key={a.id}>
                          <td>{new Date(a.created_at).toLocaleDateString()}</td>
                          <td>{a.analysis_type || 'full'}</td>
                          <td>
                            <span style={{
                              padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem',
                              background: a.generation_status === 'completed' ? '#dcfce7' : a.generation_status === 'failed' ? '#fef2f2' : '#fef3c7',
                              color: a.generation_status === 'completed' ? '#16a34a' : a.generation_status === 'failed' ? '#dc2626' : '#d97706',
                            }}>
                              {a.generation_status}
                            </span>
                          </td>
                          <td>
                            {a.overall_health_rating && (
                              <span style={{
                                padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem',
                                background: HEALTH_COLORS[a.overall_health_rating] + '20',
                                color: HEALTH_COLORS[a.overall_health_rating],
                              }}>
                                {HEALTH_LABELS[a.overall_health_rating]}
                              </span>
                            )}
                          </td>
                          <td>{a.total_recommendations || 0}</td>
                          <td style={{ display: 'flex', gap: '0.35rem' }}>
                            <button onClick={() => loadAnalysis(a.id)} className="bi-btn-sm" title="View"><Eye size={14} /></button>
                            <button onClick={() => handleDeleteAnalysis(a.id)} className="bi-btn-sm bi-btn-danger" title="Delete"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─── Panel 3: Results ─── */}
          {activePanel === 'results' && (
            <div className="bi-section">
              {!currentAnalysis && <p className="bi-empty">No analysis loaded. Run one from the Analyze tab or select from history.</p>}

              {currentAnalysis && (
                <>
                  {/* Executive Summary */}
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h3 style={{ margin: 0 }}>Executive Summary</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {currentAnalysis.overall_health_rating && (
                          <span style={{
                            padding: '4px 12px', borderRadius: 16, fontWeight: 600, fontSize: '0.85rem',
                            background: HEALTH_COLORS[currentAnalysis.overall_health_rating] + '20',
                            color: HEALTH_COLORS[currentAnalysis.overall_health_rating],
                          }}>
                            {HEALTH_LABELS[currentAnalysis.overall_health_rating]}
                          </span>
                        )}
                        {currentAnalysis.confidence_score != null && (
                          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                            Confidence: {currentAnalysis.confidence_score}%
                          </span>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: 0, color: '#374151', lineHeight: 1.6 }}>
                      {currentAnalysis.executive_summary}
                    </p>
                  </div>

                  {/* Priority counts */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {['critical', 'high', 'medium', 'low'].map(p => {
                      const count = currentAnalysis.items?.filter(i => i.priority === p).length || 0;
                      return (
                        <div key={p} style={{
                          padding: '0.75rem', borderRadius: 8, textAlign: 'center',
                          background: PRIORITY_COLORS[p] + '10', border: `1px solid ${PRIORITY_COLORS[p]}30`,
                        }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: PRIORITY_COLORS[p] }}>{count}</div>
                          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: PRIORITY_COLORS[p] }}>{p}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Key Findings */}
                  {currentAnalysis.key_findings?.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ marginBottom: '0.5rem' }}>Key Findings</h4>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#374151' }}>
                        {currentAnalysis.key_findings.map((f, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{f}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Filters */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="bi-input" style={{ width: 'auto' }}>
                      <option value="all">All Priorities</option>
                      {['critical', 'high', 'medium', 'low'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bi-input" style={{ width: 'auto' }}>
                      <option value="all">All Categories</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bi-input" style={{ width: 'auto' }}>
                      <option value="all">All Statuses</option>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>

                  {/* Recommendation Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredItems.map(item => (
                      <div key={item.id} style={{
                        padding: '1rem', borderRadius: 8,
                        border: `1px solid ${PRIORITY_COLORS[item.priority] || '#e5e7eb'}30`,
                        background: '#fff',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                              <span style={{
                                padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600,
                                textTransform: 'uppercase',
                                background: PRIORITY_COLORS[item.priority] + '15',
                                color: PRIORITY_COLORS[item.priority],
                              }}>
                                {item.priority}
                              </span>
                              {item.category && (
                                <span style={{
                                  padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem',
                                  background: '#f3f4f6', color: '#374151',
                                }}>
                                  {item.category}
                                </span>
                              )}
                              <span style={{
                                padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem',
                                background: item.admin_status === 'new' ? '#eff6ff' : item.admin_status === 'accepted' ? '#dcfce7' : '#f3f4f6',
                                color: item.admin_status === 'new' ? '#2563eb' : item.admin_status === 'accepted' ? '#16a34a' : '#6b7280',
                              }}>
                                {STATUS_LABELS[item.admin_status] || item.admin_status}
                              </span>
                            </div>
                            <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem' }}>{item.title}</h4>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563' }}>{item.description}</p>
                          </div>
                          <button onClick={() => toggleExpand(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
                            {expandedItems.has(item.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </div>

                        {expandedItems.has(item.id) && (
                          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb', fontSize: '0.85rem' }}>
                            {item.rationale && <p style={{ margin: '0 0 0.5rem' }}><strong>Rationale:</strong> {item.rationale}</p>}
                            {item.expected_impact && <p style={{ margin: '0 0 0.5rem' }}><strong>Expected Impact:</strong> {item.expected_impact}</p>}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                              {item.suggested_timeline && <span><Clock size={12} /> {item.suggested_timeline}</span>}
                              {item.estimated_effort && <span><AlertTriangle size={12} /> Effort: {item.estimated_effort}</span>}
                            </div>
                            {item.supporting_data_sources?.length > 0 && (
                              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                {item.supporting_data_sources.map((s, i) => (
                                  <span key={i} style={{ padding: '1px 6px', borderRadius: 8, fontSize: '0.7rem', background: '#eff6ff', color: '#2563eb' }}>
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Admin actions */}
                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {item.admin_status === 'new' && (
                            <button onClick={() => handleItemAction(item.id, 'reviewed')} className="bi-btn-sm">
                              <Eye size={12} /> Mark Reviewed
                            </button>
                          )}
                          {(item.admin_status === 'new' || item.admin_status === 'reviewed') && (
                            <>
                              <button onClick={() => handleItemAction(item.id, 'accepted')} className="bi-btn-sm" style={{ color: '#16a34a' }}>
                                <CheckCircle size={12} /> Accept
                              </button>
                              <button onClick={() => handleItemAction(item.id, 'declined')} className="bi-btn-sm" style={{ color: '#dc2626' }}>
                                <XCircle size={12} /> Decline
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredItems.length === 0 && <p className="bi-empty">No recommendations match the current filters.</p>}
                  </div>

                  {/* Period Insights */}
                  {currentAnalysis.period_insights && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                      <h4 style={{ margin: '0 0 0.5rem' }}>Period Insights</h4>
                      {currentAnalysis.period_insights.notable_trends?.length > 0 && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '0.8rem' }}>Trends:</strong>
                          <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                            {currentAnalysis.period_insights.notable_trends.map((t, i) => <li key={i}>{t}</li>)}
                          </ul>
                        </div>
                      )}
                      {currentAnalysis.period_insights.anomalies?.length > 0 && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '0.8rem' }}>Anomalies:</strong>
                          <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                            {currentAnalysis.period_insights.anomalies.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        </div>
                      )}
                      {currentAnalysis.period_insights.risks?.length > 0 && (
                        <div>
                          <strong style={{ fontSize: '0.8rem' }}>Risks:</strong>
                          <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                            {currentAnalysis.period_insights.risks.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ─── Panel 4: Webhook ─── */}
          {activePanel === 'webhook' && (
            <div className="bi-section">
              <h3><Shield size={18} /> Webhook Configuration</h3>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Use these endpoints to integrate external AI systems. Set the <code>AI_WEBHOOK_SECRET</code> environment variable on your server.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* GET endpoint */}
                <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: '#16a34a', color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>GET</span>
                    <strong>Pull Compiled Data</strong>
                  </div>
                  <code style={{ display: 'block', padding: '0.5rem', background: '#fff', borderRadius: 4, fontSize: '0.8rem', wordBreak: 'break-all' }}>
                    {webhookBaseUrl}/{biClientId || ':clientId'}?period_type=monthly&secret=YOUR_SECRET
                  </code>
                  <p style={{ fontSize: '0.8rem', color: '#4b5563', margin: '0.5rem 0 0' }}>
                    Returns compiled snapshot data for the client. If no existing snapshot matches, one is compiled on-demand.
                  </p>
                </div>

                {/* POST endpoint */}
                <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: '#2563eb', color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>POST</span>
                    <strong>Push AI Recommendations</strong>
                  </div>
                  <code style={{ display: 'block', padding: '0.5rem', background: '#fff', borderRadius: 4, fontSize: '0.8rem', wordBreak: 'break-all' }}>
                    {webhookBaseUrl}/{biClientId || ':clientId'}
                  </code>
                  <p style={{ fontSize: '0.8rem', color: '#4b5563', margin: '0.5rem 0 0' }}>
                    Header: <code>X-Webhook-Secret: YOUR_SECRET</code><br />
                    Body: <code>{`{ "snapshot_id": "...", "recommendations": [...], "executive_summary": "...", "overall_health_rating": "..." }`}</code>
                  </p>
                </div>

                {/* Integration guide */}
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 0.5rem' }}>Integration Flow</h4>
                  <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#374151' }}>
                    <li>Set <code>AI_WEBHOOK_SECRET</code> in your <code>.env</code> file</li>
                    <li>External AI calls <strong>GET</strong> to pull the latest compiled client data</li>
                    <li>Note the <code>snapshot_id</code> from the response</li>
                    <li>Process the data with your AI model</li>
                    <li>Call <strong>POST</strong> with the <code>snapshot_id</code> and your recommendations</li>
                    <li>Recommendations appear in the Results tab for admin review</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
