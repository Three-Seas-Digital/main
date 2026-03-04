import { useState, useEffect, useMemo } from 'react';
import {
  Globe, Search, Share2, Megaphone, Palette, FileText, Wrench, Box,
  Plus, Trash2, ChevronDown, ChevronUp, Save, Printer, Camera,
  TrendingUp, TrendingDown, DollarSign, Clock, BarChart3, X, Filter
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { useAppContext } from '../../../context/AppContext';
import { safeGetItem, safeSetItem, generateId, escapeHtml } from '../../../constants';
import { syncToApi } from '../../../api/apiSync';
import { interventionsApi } from '../../../api/interventions';

const INTERVENTIONS_KEY = 'threeseas_bi_interventions';
const AUDITS_KEY = 'threeseas_bi_audits';
const RECS_KEY = 'threeseas_bi_recommendations';

const INTERVENTION_TYPES = {
  website:     { label: 'Website',     icon: Globe,     color: '#3b82f6' },
  seo:         { label: 'SEO',         icon: Search,    color: '#22c55e' },
  social:      { label: 'Social',      icon: Share2,    color: '#8b5cf6' },
  advertising: { label: 'Advertising', icon: Megaphone, color: '#f97316' },
  branding:    { label: 'Branding',    icon: Palette,   color: '#ec4899' },
  content:     { label: 'Content',     icon: FileText,  color: '#14b8a6' },
  technical:   { label: 'Technical',   icon: Wrench,    color: '#6366f1' },
  other:       { label: 'Other',       icon: Box,       color: '#6b7280' },
};

const STATUS_COLORS = { planned: '#6b7280', in_progress: '#3b82f6', completed: '#22c55e', paused: '#f59e0b' };
const STATUS_LABELS = { planned: 'Planned', in_progress: 'In Progress', completed: 'Completed', paused: 'Paused' };

const STANDARD_METRICS = [
  { key: 'websiteTraffic', label: 'Website Traffic', unit: '/mo' },
  { key: 'conversionRate', label: 'Conversion Rate', unit: '%' },
  { key: 'revenue', label: 'Revenue', unit: '$' },
  { key: 'socialFollowers', label: 'Social Followers', unit: '' },
  { key: 'seoScore', label: 'SEO Score', unit: '/100' },
  { key: 'pageSpeed', label: 'Page Speed', unit: '/100' },
  { key: 'bounceRate', label: 'Bounce Rate', unit: '%', invert: true },
];

const emptyMetrics = () => ({
  websiteTraffic: '', conversionRate: '', revenue: '', socialFollowers: '',
  seoScore: '', pageSpeed: '', bounceRate: '', customMetrics: [],
});

const emptyIntervention = () => ({
  id: '', title: '', type: 'website', description: '', status: 'planned',
  startDate: new Date().toISOString().slice(0, 10), completedDate: '',
  cost: '', beforeMetrics: emptyMetrics(), afterMetrics: emptyMetrics(),
  snapshots: [], notes: '', tags: [], linkedAuditId: '', linkedRecommendationId: '',
  createdAt: '', updatedAt: '',
});

function calcDelta(before, after) {
  const b = parseFloat(before) || 0;
  const a = parseFloat(after) || 0;
  if (b === 0) return a !== 0 ? 100 : 0;
  return ((a - b) / Math.abs(b)) * 100;
}

function roiRating(roi) {
  if (roi > 200) return { label: 'Excellent', color: '#059669' };
  if (roi > 100) return { label: 'Good', color: '#22c55e' };
  if (roi >= 0) return { label: 'Fair', color: '#f59e0b' };
  return { label: 'Poor', color: '#ef4444' };
}

/* --- Module-scope sub-components (prevents re-mount on parent state change) --- */
const TypeIcon = ({ type, size = 16 }) => {
  const cfg = INTERVENTION_TYPES[type] || INTERVENTION_TYPES.other;
  const Icon = cfg.icon;
  return <Icon size={size} style={{ color: cfg.color }} />;
};

const ROICard = ({ item }) => {
  const revChange = (item.afterMetrics?.revenue || 0) - (item.beforeMetrics?.revenue || 0);
  const roi = item.cost > 0 ? ((revChange - item.cost) / item.cost) * 100 : 0;
  const rating = roiRating(roi);
  const payback = revChange > 0 ? (item.cost / (revChange / 12)).toFixed(1) : '--';
  return (
    <div className="bi-interventions-roi-card">
      <div className="bi-interventions-roi-header">
        <DollarSign size={18} /> ROI Analysis
        <span className="bi-interventions-roi-badge" style={{ background: rating.color }}>{rating.label}</span>
      </div>
      <div className="bi-interventions-roi-grid">
        <div><span>Revenue Change</span><strong style={{ color: revChange >= 0 ? '#22c55e' : '#ef4444' }}>${revChange.toLocaleString()}</strong></div>
        <div><span>Investment</span><strong>${(item.cost || 0).toLocaleString()}</strong></div>
        <div><span>ROI</span><strong style={{ color: rating.color }}>{roi.toFixed(1)}%</strong></div>
        <div><span>Payback Period</span><strong>{payback} months</strong></div>
      </div>
    </div>
  );
};

export default function InterventionTracker({ biClientId, onBiClientChange }) {
  const { clients } = useAppContext();
  const [clientId, setClientId] = useState(biClientId || '');
  const [clientSearch, setClientSearch] = useState('');
  const [interventions, setInterventions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyIntervention());
  const [tagInput, setTagInput] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [expandedId, setExpandedId] = useState(null);
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [formSections, setFormSections] = useState({ basic: true, desc: false, before: false, after: false, links: false });
  const toggleFormSection = k => setFormSections(p => ({ ...p, [k]: !p[k] }));

  const activeClients = useMemo(() =>
    clients.filter(c => c.status !== 'archived' && c.status !== 'rejected'), [clients]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return activeClients;
    const q = clientSearch.toLowerCase();
    return activeClients.filter(c => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q));
  }, [activeClients, clientSearch]);

  const allAudits = useMemo(() => safeGetItem(AUDITS_KEY, []), [clientId]);
  const clientAudits = useMemo(() => allAudits.filter(a => a.clientId === clientId), [allAudits, clientId]);
  const allRecs = useMemo(() => safeGetItem(RECS_KEY, {}), [clientId]);
  const clientRecs = useMemo(() => {
    const recsList = [];
    clientAudits.forEach(a => { (allRecs[a.id] || []).forEach(r => recsList.push(r)); });
    return recsList;
  }, [clientAudits, allRecs]);

  useEffect(() => {
    if (!clientId) { setInterventions([]); return; }
    const all = safeGetItem(INTERVENTIONS_KEY, {});
    setInterventions(all[clientId]?.interventions || []);
  }, [clientId]);

  const persist = (updated, changedItem) => {
    setInterventions(updated);
    const all = safeGetItem(INTERVENTIONS_KEY, {});
    all[clientId] = { interventions: updated };
    safeSetItem(INTERVENTIONS_KEY, JSON.stringify(all));
    // Sync changed item to DB
    if (changedItem) {
      const payload = {
        title: changedItem.title,
        intervention_type: changedItem.type || 'other',
        description: changedItem.description || null,
        status: changedItem.status || 'planned',
        start_date: changedItem.startDate || null,
        completed_date: changedItem.completedDate || null,
        cost_to_client: changedItem.cost || 0,
        notes: changedItem.notes || null,
        tags: JSON.stringify(changedItem.tags || []),
        linked_audit_id: changedItem.linkedAuditId || null,
        linked_recommendation_id: changedItem.linkedRecommendationId || null,
      };
      if (changedItem.serverId) {
        syncToApi(() => interventionsApi.update(clientId, changedItem.serverId, payload), 'intervention-update');
      } else {
        syncToApi(async () => {
          const res = await interventionsApi.create(clientId, payload);
          if (res?.data?.id) {
            // Back-patch serverId into localStorage
            const allData = safeGetItem(INTERVENTIONS_KEY, {});
            const items = allData[clientId]?.interventions || [];
            const idx = items.findIndex(i => i.id === changedItem.id);
            if (idx !== -1) { items[idx].serverId = res.data.id; allData[clientId].interventions = items; safeSetItem(INTERVENTIONS_KEY, JSON.stringify(allData)); }
          }
        }, 'intervention-create');
      }
    }
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    const tags = tagInput ? tagInput.split(',').map(t => t.trim()).filter(Boolean) : form.tags;
    const cleaned = {
      ...form, tags,
      cost: parseFloat(form.cost) || 0,
      beforeMetrics: cleanMetrics(form.beforeMetrics),
      afterMetrics: cleanMetrics(form.afterMetrics),
      updatedAt: now,
    };
    if (editItem) {
      const updated = { ...cleaned, id: editItem.id, createdAt: editItem.createdAt, serverId: editItem.serverId };
      persist(interventions.map(i => i.id === editItem.id ? updated : i), updated);
    } else {
      cleaned.id = generateId();
      cleaned.createdAt = now;
      persist([...interventions, cleaned], cleaned);
    }
    resetForm();
  };

  const cleanMetrics = (m) => {
    const out = {};
    STANDARD_METRICS.forEach(sm => { out[sm.key] = parseFloat(m[sm.key]) || 0; });
    out.customMetrics = (m.customMetrics || []).map(cm => ({ name: cm.name, value: parseFloat(cm.value) || 0 }));
    return out;
  };

  const resetForm = () => { setForm(emptyIntervention()); setEditItem(null); setShowForm(false); setTagInput(''); };

  const handleEdit = (item) => {
    setForm({ ...item, cost: item.cost || '' });
    setTagInput((item.tags || []).join(', '));
    setEditItem(item);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this intervention?')) return;
    persist(interventions.filter(i => i.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const addSnapshot = (item) => {
    const label = snapshotLabel || `Day ${Math.ceil((Date.now() - new Date(item.startDate).getTime()) / 86400000)}`;
    const snapshot = { date: new Date().toISOString(), label, metrics: { ...item.afterMetrics } };
    persist(interventions.map(i => i.id === item.id ? { ...i, snapshots: [...(i.snapshots || []), snapshot], updatedAt: new Date().toISOString() } : i));
    setSnapshotLabel('');
  };

  const addCustomMetric = (field) => {
    setForm(prev => ({
      ...prev,
      [field]: { ...prev[field], customMetrics: [...(prev[field].customMetrics || []), { name: '', value: '' }] }
    }));
  };

  const updateCustomMetric = (field, idx, key, val) => {
    setForm(prev => {
      const cms = [...(prev[field].customMetrics || [])];
      cms[idx] = { ...cms[idx], [key]: val };
      return { ...prev, [field]: { ...prev[field], customMetrics: cms } };
    });
  };

  const removeCustomMetric = (field, idx) => {
    setForm(prev => ({
      ...prev,
      [field]: { ...prev[field], customMetrics: prev[field].customMetrics.filter((_, i) => i !== idx) }
    }));
  };

  const setFormField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const setMetric = (section, key, val) => setForm(prev => ({ ...prev, [section]: { ...prev[section], [key]: val } }));

  // Filtered and sorted list
  const displayedInterventions = useMemo(() => {
    let list = [...interventions];
    if (filterType) list = list.filter(i => i.type === filterType);
    if (filterStatus) list = list.filter(i => i.status === filterStatus);
    if (searchTerm) list = list.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()));
    list.sort((a, b) => {
      if (sortBy === 'cost') return (b.cost || 0) - (a.cost || 0);
      if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
      return new Date(b.startDate || b.createdAt) - new Date(a.startDate || a.createdAt);
    });
    return list;
  }, [interventions, filterType, filterStatus, searchTerm, sortBy]);

  // Summary stats
  const stats = useMemo(() => {
    const completed = interventions.filter(i => i.status === 'completed');
    const rois = completed.map(i => {
      const revChange = (i.afterMetrics?.revenue || 0) - (i.beforeMetrics?.revenue || 0);
      return i.cost > 0 ? ((revChange - i.cost) / i.cost) * 100 : 0;
    }).filter(r => r !== 0);
    return {
      total: interventions.length,
      inProgress: interventions.filter(i => i.status === 'in_progress').length,
      completed: completed.length,
      avgRoi: rois.length ? (rois.reduce((a, b) => a + b, 0) / rois.length).toFixed(1) : '--',
      totalInvestment: interventions.reduce((s, i) => s + (i.cost || 0), 0),
    };
  }, [interventions]);

  // Before vs After chart data
  const buildComparisonData = (item) => {
    return STANDARD_METRICS
      .filter(m => (item.beforeMetrics?.[m.key] || 0) > 0 || (item.afterMetrics?.[m.key] || 0) > 0)
      .map(m => ({
        name: m.label,
        Before: item.beforeMetrics?.[m.key] || 0,
        After: item.afterMetrics?.[m.key] || 0,
      }));
  };

  // Snapshot timeline data for a metric
  const buildSnapshotData = (item, metricKey) => {
    const points = [];
    if (item.beforeMetrics?.[metricKey]) {
      points.push({ label: 'Start', value: item.beforeMetrics[metricKey] });
    }
    (item.snapshots || []).forEach(s => {
      if (s.metrics?.[metricKey]) points.push({ label: s.label, value: s.metrics[metricKey] });
    });
    if (item.afterMetrics?.[metricKey]) {
      points.push({ label: 'Current', value: item.afterMetrics[metricKey] });
    }
    return points;
  };

  const handlePrint = () => {
    const client = clients.find(c => c.id === clientId);
    const rows = interventions.map(i => {
      const revChange = (i.afterMetrics?.revenue || 0) - (i.beforeMetrics?.revenue || 0);
      const roi = i.cost > 0 ? (((revChange - i.cost) / i.cost) * 100).toFixed(1) : 'N/A';
      return `<tr>
        <td>${escapeHtml(i.title)}</td><td>${escapeHtml(STATUS_LABELS[i.status] || i.status)}</td>
        <td>${escapeHtml(i.startDate || '--')}</td><td>$${(i.cost || 0).toLocaleString()}</td>
        <td>$${(i.beforeMetrics?.revenue || 0).toLocaleString()}</td>
        <td>$${(i.afterMetrics?.revenue || 0).toLocaleString()}</td>
        <td>${roi}%</td></tr>`;
    }).join('');
    const html = `<html><head><title>Intervention Report</title><style>
      body{font-family:Arial,sans-serif;padding:40px}h1{color:#1e293b}
      table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left}
      th{background:#f1f5f9;font-weight:600}.stats{display:flex;gap:24px;margin:16px 0}
      .stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 20px}
      .stat strong{display:block;font-size:20px;color:#1e293b}.stat span{color:#64748b;font-size:13px}
      </style></head><body>
      <h1>Intervention Report - ${escapeHtml(client?.name || 'Client')}</h1>
      <p>Generated: ${new Date().toLocaleDateString()}</p>
      <div class="stats">
        <div class="stat"><strong>${stats.total}</strong><span>Total</span></div>
        <div class="stat"><strong>${stats.completed}</strong><span>Completed</span></div>
        <div class="stat"><strong>${stats.avgRoi}%</strong><span>Avg ROI</span></div>
        <div class="stat"><strong>$${stats.totalInvestment.toLocaleString()}</strong><span>Total Investment</span></div>
      </div>
      <table><thead><tr><th>Intervention</th><th>Status</th><th>Start</th><th>Cost</th><th>Rev Before</th><th>Rev After</th><th>ROI</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
  };

  return (
    <div className="bi-interventions-container">
      <div className="bi-header"><h3><BarChart3 size={20} /> Intervention Tracker</h3></div>

      {/* Client Selector */}
      <div className="bi-form-grid">
        <div className="form-group">
          <label>Client</label>
          <input type="text" placeholder="Search clients..." value={clientSearch}
            onChange={e => setClientSearch(e.target.value)} style={{ marginBottom: 4 }} />
          <select value={clientId} onChange={e => { setClientId(e.target.value); setExpandedId(null); setShowForm(false); onBiClientChange?.(e.target.value); }}>
            <option value="">-- Select Client --</option>
            {filteredClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {clientId && (
        <>
          {/* Summary Stats */}
          <div className="bi-interventions-stats-row">
            <div className="bi-interventions-stat"><strong>{stats.total}</strong><span>Total</span></div>
            <div className="bi-interventions-stat"><strong>{stats.inProgress}</strong><span>In Progress</span></div>
            <div className="bi-interventions-stat"><strong>{stats.completed}</strong><span>Completed</span></div>
            <div className="bi-interventions-stat"><strong>{stats.avgRoi}%</strong><span>Avg ROI</span></div>
            <div className="bi-interventions-stat"><strong>${stats.totalInvestment.toLocaleString()}</strong><span>Total Investment</span></div>
          </div>

          {/* Toolbar */}
          <div className="bi-interventions-toolbar">
            <div className="bi-interventions-filters">
              <input type="text" placeholder="Search interventions..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} className="bi-interventions-search" />
              <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">All Types</option>
                {Object.entries(INTERVENTION_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="date">Sort: Date</option>
                <option value="cost">Sort: Cost</option>
                <option value="status">Sort: Status</option>
              </select>
              {(filterType || filterStatus || searchTerm) && (
                <button className="btn-link" onClick={() => { setFilterType(''); setFilterStatus(''); setSearchTerm(''); }}>
                  <X size={14} /> Clear
                </button>
              )}
            </div>
            <div className="bi-interventions-actions">
              <button className="btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
                <Plus size={16} /> {showForm ? 'Cancel' : 'Add Intervention'}
              </button>
              {interventions.length > 0 && (
                <button className="btn-secondary" onClick={handlePrint}><Printer size={16} /> Print Report</button>
              )}
            </div>
          </div>

          {/* Add / Edit Form */}
          {showForm && (
            <div className="bi-interventions-form">
              <h4>{editItem ? 'Edit Intervention' : 'New Intervention'}</h4>

              {/* Section 1: Basic Info (default expanded) */}
              <div className="bi-section">
                <button className="bi-section-header" onClick={() => toggleFormSection('basic')} type="button">
                  <span className="bi-section-title"><FileText size={16} /> Basic Info</span>
                  <ChevronDown size={18} style={{ transform: formSections.basic ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {formSections.basic && (
                  <div className="bi-section-body">
                    <div className="bi-form-grid">
                      <div className="form-group">
                        <label>Title</label>
                        <input type="text" value={form.title} onChange={e => setFormField('title', e.target.value)} placeholder="e.g., Website Redesign" />
                      </div>
                      <div className="form-group">
                        <label>Type</label>
                        <select value={form.type} onChange={e => setFormField('type', e.target.value)}>
                          {Object.entries(INTERVENTION_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Status</label>
                        <select value={form.status} onChange={e => setFormField('status', e.target.value)}>
                          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Cost ($)</label>
                        <input type="number" value={form.cost} onChange={e => setFormField('cost', e.target.value)} min="0" step="0.01" />
                      </div>
                      <div className="form-group">
                        <label>Start Date</label>
                        <input type="date" value={form.startDate} onChange={e => setFormField('startDate', e.target.value)} />
                      </div>
                      {form.status === 'completed' && (
                        <div className="form-group">
                          <label>Completed Date</label>
                          <input type="date" value={form.completedDate} onChange={e => setFormField('completedDate', e.target.value)} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Description & Tags */}
              <div className="bi-section">
                <button className="bi-section-header" onClick={() => toggleFormSection('desc')} type="button">
                  <span className="bi-section-title"><FileText size={16} /> Description & Tags</span>
                  <ChevronDown size={18} style={{ transform: formSections.desc ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {formSections.desc && (
                  <div className="bi-section-body">
                    <div className="form-group">
                      <label>Description</label>
                      <textarea value={form.description} onChange={e => setFormField('description', e.target.value)} rows={3} />
                    </div>
                    <div className="form-group">
                      <label>Tags (comma-separated)</label>
                      <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="e.g., high-impact, quick-win, ongoing" />
                      {tagInput && (
                        <div className="bi-interventions-tag-pills">
                          {tagInput.split(',').map(t => t.trim()).filter(Boolean).map((t, i) => (
                            <span key={i} className="bi-interventions-tag">{t}<button className="bi-interventions-tag-remove" onClick={() => {
                              const tags = tagInput.split(',').map(s => s.trim()).filter(Boolean);
                              tags.splice(i, 1);
                              setTagInput(tags.join(', '));
                            }}><X size={10} /></button></span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Before Metrics */}
              <div className="bi-section">
                <button className="bi-section-header" onClick={() => toggleFormSection('before')} type="button">
                  <span className="bi-section-title"><BarChart3 size={16} /> Before Metrics</span>
                  <ChevronDown size={18} style={{ transform: formSections.before ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {formSections.before && (
                  <div className="bi-section-body">
                    {STANDARD_METRICS.map(m => (
                      <div key={m.key} className="bi-interventions-metric-row">
                        <label>{m.label}</label>
                        <div className="bi-interventions-metric-input">
                          <input type="number" value={form.beforeMetrics[m.key]} onChange={e => setMetric('beforeMetrics', m.key, e.target.value)}
                            placeholder="0" min="0" step={m.key === 'conversionRate' || m.key === 'bounceRate' ? '0.1' : '1'} />
                          <span className="bi-interventions-metric-unit">{m.unit}</span>
                        </div>
                      </div>
                    ))}
                    <div className="bi-interventions-custom-metrics">
                      <strong>Custom Metrics</strong>
                      {(form.beforeMetrics.customMetrics || []).map((cm, i) => (
                        <div key={i} className="bi-interventions-custom-row">
                          <input type="text" value={cm.name} onChange={e => updateCustomMetric('beforeMetrics', i, 'name', e.target.value)} placeholder="Metric name" />
                          <input type="number" value={cm.value} onChange={e => updateCustomMetric('beforeMetrics', i, 'value', e.target.value)} placeholder="Value" />
                          <button className="btn-icon" onClick={() => removeCustomMetric('beforeMetrics', i)} aria-label="Remove metric"><X size={14} /></button>
                        </div>
                      ))}
                      <button className="btn-link" onClick={() => addCustomMetric('beforeMetrics')}><Plus size={14} /> Add Custom Metric</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 4: After Metrics */}
              <div className="bi-section">
                <button className="bi-section-header" onClick={() => toggleFormSection('after')} type="button">
                  <span className="bi-section-title"><TrendingUp size={16} /> After Metrics</span>
                  <ChevronDown size={18} style={{ transform: formSections.after ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {formSections.after && (
                  <div className="bi-section-body">
                    {STANDARD_METRICS.map(m => (
                      <div key={m.key} className="bi-interventions-metric-row">
                        <label>{m.label}</label>
                        <div className="bi-interventions-metric-input">
                          <input type="number" value={form.afterMetrics[m.key]} onChange={e => setMetric('afterMetrics', m.key, e.target.value)}
                            placeholder="0" min="0" step={m.key === 'conversionRate' || m.key === 'bounceRate' ? '0.1' : '1'} />
                          <span className="bi-interventions-metric-unit">{m.unit}</span>
                        </div>
                        {(form.beforeMetrics[m.key] || form.afterMetrics[m.key]) && (
                          <DeltaBadge before={form.beforeMetrics[m.key]} after={form.afterMetrics[m.key]} invert={m.invert} />
                        )}
                      </div>
                    ))}
                    <div className="bi-interventions-custom-metrics">
                      <strong>Custom Metrics</strong>
                      {(form.afterMetrics.customMetrics || []).map((cm, i) => (
                        <div key={i} className="bi-interventions-custom-row">
                          <input type="text" value={cm.name} onChange={e => updateCustomMetric('afterMetrics', i, 'name', e.target.value)} placeholder="Metric name" />
                          <input type="number" value={cm.value} onChange={e => updateCustomMetric('afterMetrics', i, 'value', e.target.value)} placeholder="Value" />
                          <button className="btn-icon" onClick={() => removeCustomMetric('afterMetrics', i)} aria-label="Remove metric"><X size={14} /></button>
                        </div>
                      ))}
                      <button className="btn-link" onClick={() => addCustomMetric('afterMetrics')}><Plus size={14} /> Add Custom Metric</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 5: Links & Notes */}
              <div className="bi-section">
                <button className="bi-section-header" onClick={() => toggleFormSection('links')} type="button">
                  <span className="bi-section-title"><Globe size={16} /> Links & Notes</span>
                  <ChevronDown size={18} style={{ transform: formSections.links ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {formSections.links && (
                  <div className="bi-section-body">
                    <div className="bi-form-grid">
                      <div className="form-group">
                        <label>Link to Audit (optional)</label>
                        <select value={form.linkedAuditId} onChange={e => setFormField('linkedAuditId', e.target.value)}>
                          <option value="">-- None --</option>
                          {clientAudits.map(a => <option key={a.id} value={a.id}>{a.status} - {new Date(a.createdAt).toLocaleDateString()}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Link to Recommendation (optional)</label>
                        <select value={form.linkedRecommendationId} onChange={e => setFormField('linkedRecommendationId', e.target.value)}>
                          <option value="">-- None --</option>
                          {clientRecs.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Notes</label>
                      <textarea value={form.notes} onChange={e => setFormField('notes', e.target.value)} rows={2} />
                    </div>
                  </div>
                )}
              </div>

              <div className="bi-actions">
                <button className="btn-primary" onClick={handleSave} disabled={!form.title.trim()}>
                  <Save size={16} /> {editItem ? 'Update' : 'Save'} Intervention
                </button>
                <button className="btn-secondary" onClick={resetForm}>Cancel</button>
              </div>
            </div>
          )}

          {/* Intervention Timeline (visual overview) */}
          {interventions.length > 1 && (
            <div className="bi-section" style={{ marginBottom: 16 }}>
              <h4><Clock size={16} /> Intervention Timeline</h4>
              <div className="bi-interventions-timeline">
                {[...interventions].sort((a, b) => new Date(a.startDate || a.createdAt) - new Date(b.startDate || b.createdAt)).map(item => {
                  const cfg = INTERVENTION_TYPES[item.type] || INTERVENTION_TYPES.other;
                  const start = new Date(item.startDate || item.createdAt);
                  const end = item.completedDate ? new Date(item.completedDate) : new Date();
                  const days = Math.max(1, Math.ceil((end - start) / 86400000));
                  return (
                    <div key={item.id} className="bi-interventions-timeline-row" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                      <span className="bi-interventions-timeline-label">{item.title}</span>
                      <div className="bi-interventions-timeline-bar-wrap">
                        <div className="bi-interventions-timeline-bar"
                          style={{ background: STATUS_COLORS[item.status] || '#6b7280', width: `${Math.min(100, days)}%`, minWidth: 30 }}>
                          <span>{days}d</span>
                        </div>
                      </div>
                      <span className="bi-interventions-timeline-date">{start.toLocaleDateString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Intervention Cards */}
          {displayedInterventions.length === 0 && !showForm && (
            <div className="bi-empty-state">No interventions yet. Click "Add Intervention" to get started.</div>
          )}
          {displayedInterventions.map(item => {
            const cfg = INTERVENTION_TYPES[item.type] || INTERVENTION_TYPES.other;
            const Icon = cfg.icon;
            const isExpanded = expandedId === item.id;
            const comparisonData = buildComparisonData(item);

            return (
              <div key={item.id} className="bi-interventions-card">
                <div className="bi-interventions-card-header" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                  <div className="bi-interventions-card-title">
                    <Icon size={18} style={{ color: cfg.color }} />
                    <strong>{item.title}</strong>
                    <span className="bi-interventions-type-badge" style={{ background: cfg.color }}>{cfg.label}</span>
                    <span className="bi-interventions-status-badge" style={{ background: STATUS_COLORS[item.status] }}>{STATUS_LABELS[item.status]}</span>
                  </div>
                  <div className="bi-interventions-card-meta">
                    <span>{item.startDate || '--'}{item.completedDate ? ` to ${item.completedDate}` : ''}</span>
                    {item.cost > 0 && <span className="bi-interventions-cost">${item.cost.toLocaleString()}</span>}
                    {(item.tags || []).map((t, i) => <span key={i} className="bi-interventions-tag">{t}</span>)}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="bi-interventions-card-body">
                    {item.description && <p className="bi-interventions-desc">{item.description}</p>}

                    {/* ROI Card for completed */}
                    {item.status === 'completed' && item.cost > 0 && <ROICard item={item} />}

                    {/* Before vs After Chart */}
                    {comparisonData.length > 0 && (
                      <div className="bi-interventions-chart-section">
                        <h5>Before vs After Comparison</h5>
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={comparisonData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Before" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="After" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Metric Deltas Table */}
                    <div className="bi-interventions-deltas">
                      <h5>Metric Changes</h5>
                      <table className="bi-interventions-table">
                        <thead><tr><th>Metric</th><th>Before</th><th>After</th><th>Change</th></tr></thead>
                        <tbody>
                          {STANDARD_METRICS.filter(m => (item.beforeMetrics?.[m.key] || 0) > 0 || (item.afterMetrics?.[m.key] || 0) > 0).map(m => {
                            const b = item.beforeMetrics?.[m.key] || 0;
                            const a = item.afterMetrics?.[m.key] || 0;
                            const delta = calcDelta(b, a);
                            const improved = m.invert ? delta < 0 : delta > 0;
                            return (
                              <tr key={m.key}>
                                <td>{m.label}</td>
                                <td>{b.toLocaleString()}{m.unit}</td>
                                <td>{a.toLocaleString()}{m.unit}</td>
                                <td style={{ color: improved ? '#22c55e' : delta !== 0 ? '#ef4444' : '#6b7280' }}>
                                  {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                                  {delta !== 0 && (improved ? <TrendingUp size={14} style={{ marginLeft: 4 }} /> : <TrendingDown size={14} style={{ marginLeft: 4 }} />)}
                                </td>
                              </tr>
                            );
                          })}
                          {(item.beforeMetrics?.customMetrics || []).map((cm, i) => {
                            const after = (item.afterMetrics?.customMetrics || [])[i];
                            const delta = calcDelta(cm.value, after?.value || 0);
                            return (
                              <tr key={`cm-${i}`}>
                                <td>{cm.name}</td><td>{cm.value}</td><td>{after?.value || 0}</td>
                                <td style={{ color: delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : '#6b7280' }}>
                                  {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Snapshot Timeline */}
                    {(item.snapshots || []).length > 0 && (
                      <div className="bi-interventions-chart-section">
                        <h5>Progress Over Time (Revenue)</h5>
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={buildSnapshotData(item, 'revenue')}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Add Snapshot */}
                    <div className="bi-interventions-snapshot-add">
                      <input type="text" value={snapshotLabel} onChange={e => setSnapshotLabel(e.target.value)}
                        placeholder="Snapshot label (e.g., Day 30)" className="bi-interventions-snapshot-input" />
                      <button className="btn-secondary" onClick={() => addSnapshot(item)}>
                        <Camera size={14} /> Add Snapshot
                      </button>
                    </div>

                    {item.notes && <div className="bi-interventions-notes"><strong>Notes:</strong> {item.notes}</div>}

                    <div className="bi-interventions-card-actions">
                      <button className="btn-secondary" onClick={() => handleEdit(item)}><Save size={14} /> Edit</button>
                      <button className="btn-danger" onClick={() => handleDelete(item.id)}><Trash2 size={14} /> Delete</button>
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

/* Delta badge for form metric comparison */
function DeltaBadge({ before, after, invert }) {
  const b = parseFloat(before) || 0;
  const a = parseFloat(after) || 0;
  if (b === 0 && a === 0) return null;
  const delta = calcDelta(b, a);
  const improved = invert ? delta < 0 : delta > 0;
  return (
    <span className="bi-interventions-delta" style={{ color: improved ? '#22c55e' : delta !== 0 ? '#ef4444' : '#6b7280' }}>
      {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
      {delta !== 0 && (improved ? <TrendingUp size={12} /> : <TrendingDown size={12} />)}
    </span>
  );
}
