import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Star, Save, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import { safeGetItem, safeSetItem, generateId } from '../../../constants';
import { syncToApi } from '../../../api/apiSync';
import { auditsApi } from '../../../api/audits';

const AUDITS_KEY = 'threeseas_bi_audits';

const DEFAULT_CATEGORIES = [
  { id: 'cat-seo', name: 'SEO', weight: 20, color: '#3b82f6', subcriteria: [
    { id: 'sc-meta', name: 'Meta Tags' }, { id: 'sc-headings', name: 'Heading Structure' },
    { id: 'sc-sitemap', name: 'Sitemap' }, { id: 'sc-speed', name: 'Page Speed' },
  ] },
  { id: 'cat-design', name: 'Design/UX', weight: 20, color: '#8b5cf6', subcriteria: [
    { id: 'sc-layout', name: 'Layout' }, { id: 'sc-mobile', name: 'Mobile Experience' },
    { id: 'sc-nav', name: 'Navigation' }, { id: 'sc-brand', name: 'Branding' },
  ] },
  { id: 'cat-content', name: 'Content', weight: 20, color: '#10b981', subcriteria: [
    { id: 'sc-quality', name: 'Quality' }, { id: 'sc-cta', name: 'Calls to Action' },
    { id: 'sc-media', name: 'Media' }, { id: 'sc-blog', name: 'Blog/Updates' },
  ] },
  { id: 'cat-tech', name: 'Technical', weight: 20, color: '#f59e0b', subcriteria: [
    { id: 'sc-ssl', name: 'SSL/Security' }, { id: 'sc-hosting', name: 'Hosting' },
    { id: 'sc-perf', name: 'Performance' }, { id: 'sc-analytics', name: 'Analytics' },
  ] },
  { id: 'cat-social', name: 'Social/Marketing', weight: 20, color: '#ef4444', subcriteria: [
    { id: 'sc-profiles', name: 'Social Profiles' }, { id: 'sc-reviews', name: 'Reviews' },
    { id: 'sc-listings', name: 'Directory Listings' }, { id: 'sc-email', name: 'Email Marketing' },
  ] },
];

const scoreColor = (s: number) => {
  if (s <= 3) return '#ef4444';
  if (s <= 6) return '#f59e0b';
  if (s <= 8) return '#22c55e';
  return '#059669';
};

interface AuditScoringProps {
  biClientId?: string;
  onBiClientChange?: (id: string) => void;
}

export default function AuditScoring({ biClientId, onBiClientChange }: AuditScoringProps) {
  const { clients } = useAppContext();
  const [clientId, setClientId] = useState(biClientId || '');
  const [auditId, setAuditId] = useState('');
  const [scores, setScores] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState<Record<string, any>>({});
  const [status, setStatus] = useState('draft');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [categories] = useState(DEFAULT_CATEGORIES);
  const [saveCount, setSaveCount] = useState(0);

  const activeClients = clients.filter((c: any) => c.status !== 'archived' && c.status !== 'rejected');
  const allAudits = useMemo(() => safeGetItem(AUDITS_KEY, []), [saveCount, clientId]);
  const clientAudits = useMemo(() => allAudits.filter(a => a.clientId === clientId), [allAudits, clientId]);

  useEffect(() => {
    if (!auditId || auditId === 'new') { setScores({}); setNotes({}); setStatus('draft'); return; }
    const audit = allAudits.find(a => a.id === auditId);
    if (audit) { setScores(audit.scores || {}); setNotes(audit.notes || {}); setStatus(audit.status || 'draft'); }
  }, [auditId]); // eslint-disable-line react-hooks/exhaustive-deps — intentionally omit allAudits to prevent save from resetting form state

  const setScore = (subId: string, val: any) => setScores(prev => ({ ...prev, [subId]: Number(val) }));
  const setNote = (catId: string, field: string, val: string) => setNotes(prev => ({ ...prev, [catId]: { ...(prev[catId] || {}), [field]: val } }));
  const toggleExpand = (catId: string) => setExpanded(prev => ({ ...prev, [catId]: !prev[catId] }));

  const catScore = (cat: any) => {
    const vals = cat.subcriteria.map((sc: any) => scores[sc.id] || 0).filter((v: number) => v > 0);
    return vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : '--';
  };

  const overallScore = useMemo(() => {
    let totalWeight = 0, weightedSum = 0;
    categories.forEach(cat => {
      const s = parseFloat(catScore(cat));
      if (!isNaN(s)) { weightedSum += s * cat.weight; totalWeight += cat.weight; }
    });
    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : '--';
  }, [scores, categories]);

  const handleSave = (publish: boolean) => {
    if (!clientId) return;
    setSaving(true);
    const audits = safeGetItem(AUDITS_KEY, []);
    const now = new Date().toISOString();
    const st = publish ? 'published' : 'draft';
    if (auditId && auditId !== 'new') {
      const idx = audits.findIndex(a => a.id === auditId);
      if (idx !== -1) {
        audits[idx] = { ...audits[idx], scores, notes, status: st, updatedAt: now };
        if (publish) audits[idx].publishedAt = now;
      }
    } else {
      const newId = generateId();
      audits.push({ id: newId, clientId, scores, notes, status: st, createdAt: now, updatedAt: now, publishedAt: publish ? now : null });
      setAuditId(newId);
    }
    safeSetItem(AUDITS_KEY, JSON.stringify(audits));
    // Two-step DB sync: (1) create/update audit record, (2) upsert category scores
    syncToApi(async () => {
      const auditDate = new Date().toISOString().slice(0, 10);
      let serverAuditId;
      if (auditId && auditId !== 'new') {
        await auditsApi.update(auditId, { audit_date: auditDate, notes: JSON.stringify(notes) });
        serverAuditId = auditId;
      } else {
        const res = await auditsApi.create(clientId, { audit_date: auditDate, notes: JSON.stringify(notes) });
        serverAuditId = res?.data?.id;
      }
      if (serverAuditId) {
        const categoryScores = categories.map(cat => ({
          category_id: cat.id,
          score: parseFloat(catScore(cat)) || 0,
          weight: cat.weight,
          internal_notes: (notes[cat.id] || {}).internal_notes || null,
          client_summary: (notes[cat.id] || {}).client_summary || null,
        }));
        await auditsApi.upsertScores(serverAuditId, categoryScores);
        if (publish) await auditsApi.publish(serverAuditId);
      }
    }, 'audit-save');

    // Bridge: write category definitions for portal (without icon/color fields)
    const portalCategories = DEFAULT_CATEGORIES.map(c => ({
      id: c.id, name: c.name, weight: c.weight,
      subcriteria: c.subcriteria.map(sc => ({ id: sc.id, name: sc.name }))
    }));
    safeSetItem('threeseas_bi_categories', JSON.stringify(portalCategories));

    // Bridge: derive per-category audit scores for portal (use audits var directly, not re-read)
    const auditScores: any[] = [];
    audits.forEach(audit => {
      DEFAULT_CATEGORIES.forEach(cat => {
        const subScores = cat.subcriteria.map(sc => ({
          id: sc.id,
          name: sc.name,
          score: audit.scores?.[sc.id] || 0
        }));
        const avg = subScores.length > 0
          ? subScores.reduce((a, s) => a + s.score, 0) / subScores.length
          : 0;
        auditScores.push({
          auditId: audit.id,
          clientId: audit.clientId,
          categoryId: cat.id,
          categoryName: cat.name,
          score: Math.round(avg * 10) / 10,
          weight: cat.weight,
          subcriteria: subScores
        });
      });
    });
    safeSetItem('threeseas_bi_audit_scores', JSON.stringify(auditScores));

    // Batch complete — now trigger re-reads in dependent components
    setSaving(false);
    setSaveCount(prev => prev + 1);
    setSaveMsg(publish ? 'Audit published!' : 'Draft saved');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  return (
    <div className="bi-audit-scoring">
      <div className="bi-header"><h3><BarChart3 size={20} /> Audit Scoring</h3></div>
      <div className="bi-form-grid">
        <div className="form-group">
          <label>Client</label>
          <select value={clientId} onChange={e => { setClientId(e.target.value); setAuditId(''); onBiClientChange?.(e.target.value); }}>
            <option value="">-- Select --</option>
            {activeClients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {clientId && (
          <div className="form-group">
            <label>Audit</label>
            <select value={auditId} onChange={e => setAuditId(e.target.value)}>
              <option value="">-- Select --</option>
              <option value="new">+ New Audit</option>
              {clientAudits.map(a => <option key={a.id} value={a.id}>{a.status} - {new Date(a.createdAt).toLocaleDateString()}</option>)}
            </select>
          </div>
        )}
      </div>
      {clientId && auditId && (
        <>
          <div className="bi-overall-score" style={{ background: scoreColor(parseFloat(overallScore) || 0) }}>
            <Star size={24} /> Overall: {overallScore}/10
          </div>
          {categories.map(cat => (
            <div key={cat.id} className="bi-category-card">
              <div className="bi-category-header" onClick={() => toggleExpand(cat.id)}>
                <span className="bi-cat-badge" style={{ background: cat.color }}>{cat.name}</span>
                <span className="bi-cat-weight">Weight: {cat.weight}%</span>
                <span className="bi-cat-score" style={{ color: scoreColor(parseFloat(catScore(cat)) || 0) }}>{catScore(cat)}/10</span>
                {expanded[cat.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {expanded[cat.id] && (
                <div className="bi-category-body">
                  {cat.subcriteria.map(sc => (
                    <div key={sc.id} className="bi-subcriteria-row">
                      <label>{sc.name}</label>
                      <input type="range" min="1" max="10" value={scores[sc.id] || 5} onChange={e => setScore(sc.id, e.target.value)} />
                      <span className="bi-score-val" style={{ color: scoreColor(scores[sc.id] || 5) }}>{scores[sc.id] || 5}</span>
                    </div>
                  ))}
                  <div className="form-group"><label>Internal Notes</label>
                    <textarea value={(notes[cat.id] || {}).internal_notes || ""} onChange={e => setNote(cat.id, "internal_notes", e.target.value)} rows={2} /></div>
                  <div className="form-group"><label>Client Summary</label>
                    <textarea value={(notes[cat.id] || {}).client_summary || ""} onChange={e => setNote(cat.id, "client_summary", e.target.value)} rows={2} /></div>
                </div>
              )}
            </div>
          ))}
          <div className="bi-actions">
            <button className="btn-secondary" onClick={() => handleSave(false)} disabled={saving}><Save size={16} /> Save Draft</button>
            <button className="btn-primary" onClick={() => handleSave(true)} disabled={saving}><Send size={16} /> Publish</button>
            {saveMsg && <span className="bi-save-msg">{saveMsg}</span>}
          </div>
        </>
      )}
    </div>
  );
}
