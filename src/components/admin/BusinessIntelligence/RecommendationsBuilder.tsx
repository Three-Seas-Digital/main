import { useState, useEffect, useMemo } from 'react';
import { Lightbulb, Plus, Copy, GripVertical, MessageCircle, Send, Trash2, ArrowUp, ArrowDown, Zap } from 'lucide-react';
import { calcIFSR, getIFSRDecision } from './auditMetrics';
import { useAppContext } from '../../../context/AppContext';
import { safeGetItem, safeSetItem, generateId } from '../../../constants';
import { syncToApi } from '../../../api/apiSync';
import { recommendationsApi } from '../../../api/recommendations';

const RECS_KEY = 'threeseas_bi_recommendations';
const TEMPLATES_KEY = 'threeseas_bi_templates';
const AUDITS_KEY = 'threeseas_bi_audits';
const THREADS_KEY = 'threeseas_bi_recommendation_threads';

const DEFAULT_TEMPLATES = [
  { id: 't1', title: 'SSL Certificate', description: 'Install SSL certificate for HTTPS', priority: 'critical', impact: 'high', service: 'Technical' },
  { id: 't2', title: 'Mobile Responsive Redesign', description: 'Redesign site for mobile devices', priority: 'high', impact: 'high', service: 'Design' },
  { id: 't3', title: 'SEO Optimization', description: 'Implement on-page SEO best practices', priority: 'high', impact: 'medium', service: 'SEO' },
  { id: 't4', title: 'Google Business Profile', description: 'Create or optimize Google Business listing', priority: 'medium', impact: 'high', service: 'Marketing' },
  { id: 't5', title: 'Content Strategy', description: 'Develop a content calendar and blog strategy', priority: 'medium', impact: 'medium', service: 'Content' },
];

const PRIORITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#9ca3af' };
const IFSR_DECISION_COLORS = { 'Do Now': '#22c55e', 'Plan Next': '#3b82f6', 'Later': '#f97316', 'Deprioritize': '#9ca3af' };
const STATUS_FLOW = ['proposed', 'accepted', 'in_progress', 'completed', 'declined'];

export default function RecommendationsBuilder({ biClientId, onBiClientChange }) {
  const { clients, currentUser } = useAppContext();
  const [clientId, setClientId] = useState(biClientId || '');
  const [auditId, setAuditId] = useState('');
  const [recs, setRecs] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [expandedRec, setExpandedRec] = useState(null);
  const [newThread, setNewThread] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [sortByIFSR, setSortByIFSR] = useState(false);

  const activeClients = useMemo(() => clients.filter(c => c.status !== 'archived' && c.status !== 'rejected'), [clients]);
  const allAudits = useMemo(() => safeGetItem(AUDITS_KEY, []), [clientId]);
  const clientAudits = useMemo(() => allAudits.filter(a => a.clientId === clientId), [allAudits, clientId]);
  const templates = useMemo(() => safeGetItem(TEMPLATES_KEY, DEFAULT_TEMPLATES), []);

  useEffect(() => {
    if (!auditId) { setRecs([]); return; }
    const all = safeGetItem(RECS_KEY, {});
    setRecs(all[auditId] || []);
  }, [auditId]);

  const saveRecs = (updated) => {
    setRecs(updated);
    const all = safeGetItem(RECS_KEY, {});
    all[auditId] = updated;
    safeSetItem(RECS_KEY, JSON.stringify(all));
    syncToApi(() => recommendationsApi.addToAudit(auditId, { recommendations: updated }), 'recs-save');
  };

  const addFromTemplate = (tmpl) => {
    const rec = { id: generateId(), ...tmpl, clientId, auditId, status: 'proposed', display_order: recs.length, createdAt: new Date().toISOString() };
    saveRecs([...recs, rec]);
    setShowTemplates(false);
  };

  const addCustom = () => {
    const rec = { id: generateId(), title: 'New Recommendation', description: '', priority: 'medium', impact: 'medium', service: '', clientId, auditId, status: 'proposed', display_order: recs.length, estimated_cost: '', timeline: '', expected_outcome: '', createdAt: new Date().toISOString() };
    saveRecs([...recs, rec]);
    setExpandedRec(rec.id);
  };

  const updateRec = (id, field, value) => {
    saveRecs(recs.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const deleteRec = (id) => saveRecs(recs.filter(r => r.id !== id));

  const moveRec = (id, dir) => {
    const idx = recs.findIndex(r => r.id === id);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === recs.length - 1)) return;
    const updated = [...recs];
    [updated[idx], updated[idx + dir]] = [updated[idx + dir], updated[idx]];
    saveRecs(updated.map((r, i) => ({ ...r, display_order: i })));
  };

  const sortedRecs = useMemo(() => {
    if (!sortByIFSR) return recs;
    return [...recs].sort((a, b) => {
      const scoreA = calcIFSR(a.ifsr_impact || 0, a.ifsr_feasibility || 0, a.ifsr_speed || 0, a.ifsr_risk || 0);
      const scoreB = calcIFSR(b.ifsr_impact || 0, b.ifsr_feasibility || 0, b.ifsr_speed || 0, b.ifsr_risk || 0);
      return scoreB - scoreA;
    });
  }, [recs, sortByIFSR]);

  const getRecThreads = (recId) => {
    const allThreads = safeGetItem(THREADS_KEY, []);
    return allThreads.filter(t => t.recommendationId === recId);
  };

  const addThreadMsg = (recId) => {
    if (!newThread.trim()) return;
    const msg = { id: generateId(), recommendationId: recId, author: currentUser?.name || 'Admin', authorType: 'admin', text: newThread, message: newThread, createdAt: new Date().toISOString() };
    const allThreads = safeGetItem(THREADS_KEY, []);
    safeSetItem(THREADS_KEY, JSON.stringify([...allThreads, msg]));
    syncToApi(() => recommendationsApi.addThread(recId, { message: newThread, author_type: 'admin' }), 'add-thread');
    setNewThread('');
    setRecs([...recs]); // trigger re-render
  };

  return (
    <div className="bi-recommendations">
      <div className="bi-header"><h3><Lightbulb size={20} /> Recommendations Builder</h3></div>
      <div className="bi-form-grid">
        <div className="form-group"><label>Client</label>
          <select value={clientId} onChange={e => { setClientId(e.target.value); setAuditId(''); onBiClientChange?.(e.target.value); }}>
            <option value="">-- Select --</option>
            {activeClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></div>
        {clientId && <div className="form-group"><label>Audit</label>
          <select value={auditId} onChange={e => setAuditId(e.target.value)}>
            <option value="">-- Select --</option>
            {clientAudits.map(a => <option key={a.id} value={a.id}>{a.status} - {new Date(a.createdAt).toLocaleDateString()}</option>)}
          </select></div>}
      </div>
      {auditId && (
        <>
          <div className="bi-actions" style={{ marginBottom: 16 }}>
            <button className="btn-secondary" onClick={() => setShowTemplates(!showTemplates)}><Copy size={16} /> From Template</button>
            <button className="btn-primary" onClick={addCustom}><Plus size={16} /> Add Custom</button>
            <button className={`btn-secondary ${sortByIFSR ? 'active' : ''}`} onClick={() => setSortByIFSR(!sortByIFSR)}>
              <Zap size={16} /> {sortByIFSR ? 'Sorted by IFSR' : 'Sort by IFSR'}
            </button>
          </div>
          {showTemplates && (
            <div className="bi-template-list">
              {templates.map(t => (
                <div key={t.id} className="bi-template-item" onClick={() => addFromTemplate(t)}>
                  <strong>{t.title}</strong>
                  <span className="bi-priority-badge" style={{ background: PRIORITY_COLORS[t.priority] }}>{t.priority}</span>
                </div>
              ))}
            </div>
          )}
          {sortedRecs.map(rec => {
            const ifsrScore = calcIFSR(rec.ifsr_impact || 0, rec.ifsr_feasibility || 0, rec.ifsr_speed || 0, rec.ifsr_risk || 0);
            const ifsrDecision = ifsrScore > 0 ? getIFSRDecision(ifsrScore) : null;
            return (
            <div key={rec.id} className="bi-rec-card">
              <div className="bi-rec-header" onClick={() => setExpandedRec(expandedRec === rec.id ? null : rec.id)}>
                <GripVertical size={14} className="bi-grip" />
                <span className="bi-rec-title">{rec.title}</span>
                <span className="bi-priority-badge" style={{ background: PRIORITY_COLORS[rec.priority] }}>{rec.priority}</span>
                {ifsrDecision && <span className="bi-ifsr-badge" style={{ background: IFSR_DECISION_COLORS[ifsrDecision] }}>{ifsrScore.toFixed(1)} — {ifsrDecision}</span>}
                <span className="bi-status-badge">{rec.status}</span>
                <div className="bi-rec-actions">
                  <button onClick={e => { e.stopPropagation(); moveRec(rec.id, -1); }} aria-label="Move up"><ArrowUp size={14} /></button>
                  <button onClick={e => { e.stopPropagation(); moveRec(rec.id, 1); }} aria-label="Move down"><ArrowDown size={14} /></button>
                  <button onClick={e => { e.stopPropagation(); deleteRec(rec.id); }} aria-label="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
              {expandedRec === rec.id && (
                <div className="bi-rec-body">
                  <div className="bi-form-grid">
                    <div className="form-group"><label>Title</label><input type="text" value={rec.title} onChange={e => updateRec(rec.id, 'title', e.target.value)} /></div>
                    <div className="form-group"><label>Priority</label>
                      <select value={rec.priority} onChange={e => updateRec(rec.id, 'priority', e.target.value)}>
                        {['critical','high','medium','low'].map(p => <option key={p} value={p}>{p}</option>)}
                      </select></div>
                    <div className="form-group"><label>Impact</label>
                      <select value={rec.impact} onChange={e => updateRec(rec.id, 'impact', e.target.value)}>
                        {['high','medium','low'].map(i => <option key={i} value={i}>{i}</option>)}
                      </select></div>
                    <div className="form-group"><label>Status</label>
                      <select value={rec.status} onChange={e => updateRec(rec.id, 'status', e.target.value)}>
                        {STATUS_FLOW.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select></div>
                    <div className="form-group"><label>Est. Cost</label><input type="text" value={rec.estimated_cost || ""} onChange={e => updateRec(rec.id, 'estimated_cost', e.target.value)} /></div>
                    <div className="form-group"><label>Timeline</label><input type="text" value={rec.timeline || ""} onChange={e => updateRec(rec.id, 'timeline', e.target.value)} /></div>
                    <div className="form-group" style={{ gridColumn: "1 / -1" }}><label>Description</label>
                      <textarea value={rec.description || ""} onChange={e => updateRec(rec.id, 'description', e.target.value)} rows={2} /></div>
                    <div className="form-group" style={{ gridColumn: "1 / -1" }}><label>Expected Outcome</label>
                      <textarea value={rec.expected_outcome || ""} onChange={e => updateRec(rec.id, 'expected_outcome', e.target.value)} rows={2} /></div>
                  </div>
                  <div className="bi-ifsr-scoring">
                    <h4><Zap size={14} /> IFSR Priority Scoring</h4>
                    <div className="bi-ifsr-grid">
                      {[
                        { key: 'ifsr_impact', label: 'Impact', weight: '40%', desc: 'Upside potential' },
                        { key: 'ifsr_feasibility', label: 'Feasibility', weight: '25%', desc: 'Ease of execution' },
                        { key: 'ifsr_speed', label: 'Speed', weight: '20%', desc: 'Time to effect' },
                        { key: 'ifsr_risk', label: 'Risk', weight: '15%', desc: 'Higher = safer' },
                      ].map(f => (
                        <div key={f.key} className="bi-ifsr-field">
                          <label>{f.label} <small>({f.weight})</small></label>
                          <input
                            type="number" min="1" max="5"
                            value={rec[f.key] || ''}
                            onChange={e => updateRec(rec.id, f.key, Math.min(5, Math.max(0, parseInt(e.target.value) || 0)))}
                            placeholder="1-5"
                          />
                          <small>{f.desc}</small>
                        </div>
                      ))}
                      <div className="bi-ifsr-result">
                        <span className="bi-ifsr-result-score">{ifsrScore > 0 ? ifsrScore.toFixed(2) : '—'}</span>
                        {ifsrDecision && <span className="bi-ifsr-result-decision" style={{ background: IFSR_DECISION_COLORS[ifsrDecision] }}>{ifsrDecision}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="bi-threads">
                    <h4><MessageCircle size={14} /> Discussion</h4>
                    {getRecThreads(rec.id).map(t => (
                      <div key={t.id} className="bi-thread-msg"><strong>{t.author}</strong> <small>{new Date(t.createdAt).toLocaleString()}</small><p>{t.text || t.message}</p></div>
                    ))}
                    <div className="bi-thread-input">
                      <input type="text" value={newThread} onChange={e => setNewThread(e.target.value)} placeholder="Add a message..." onKeyDown={e => e.key === 'Enter' && addThreadMsg(rec.id)} />
                      <button onClick={() => addThreadMsg(rec.id)}><Send size={14} /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
          })}
        </>
      )}
    </div>
  );
}
