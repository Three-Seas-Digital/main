import { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Building2, Globe, Target, Save, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import { safeGetItem, safeSetItem, generateId } from '../../../constants';
import { syncToApi } from '../../../api/apiSync';
import { intakesApi } from '../../../api/intakes';
import { INDUSTRY_OPTIONS } from './kpiRegistry';

const INTAKES_KEY = 'threeseas_bi_intakes';

const EMPTY_INTAKE = {
  industry: '', sub_industry: '', years_in_operation: '', employee_count_range: '',
  annual_revenue_range: '', target_market: '', business_model: '',
  current_website_url: '', hosting_provider: '', tech_stack: '', domain_age_years: '',
  has_ssl: false, is_mobile_responsive: false, last_website_update: '',
  social_platforms: [], email_marketing_tool: '', paid_advertising: '',
  content_marketing: '', seo_efforts: '',
  pain_points: '', goals: '', budget_range: '', timeline_expectations: '',
  notes: '',
};

const EMPLOYEE_RANGES = ['1-5', '6-10', '11-25', '26-50', '51-100', '100+'];
const REVENUE_RANGES = ['Under $50k', '$50k-$100k', '$100k-$250k', '$250k-$500k', '$500k-$1M', '$1M+'];
const BUDGET_RANGES = ['Under $1k', '$1k-$2.5k', '$2.5k-$5k', '$5k-$10k', '$10k-$25k', '$25k+'];
const TIMELINE_OPTIONS = ['ASAP', '1-3 months', '3-6 months', '6-12 months', 'No rush'];
const SOCIAL_OPTIONS = ['Facebook', 'Instagram', 'Twitter/X', 'LinkedIn', 'TikTok', 'YouTube', 'Pinterest'];
// INDUSTRY_OPTIONS imported from kpiRegistry.js (single source of truth)

/* --- Module-scope sub-components (prevents re-mount on parent state change) --- */
const Section = ({ k, title, icon, expanded, onToggle, children }) => (
  <div className="bi-section">
    <button className="bi-section-header" onClick={() => onToggle(k)} type="button">
      <span className="bi-section-title">{icon} {title}</span>
      <ChevronDown size={18} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
    </button>
    {expanded && <div className="bi-section-body">{children}</div>}
  </div>
);

const Sel = ({ label, value, onChange, opts }) => (
  <div className="form-group"><label>{label}</label>
    <select value={value} onChange={onChange}>
      <option value="">Select...</option>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select></div>
);

const Txt = ({ label, value, onChange, type = "text", ph = "" }) => (
  <div className="form-group"><label>{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={ph} /></div>
);

export default function IntakeForm({ biClientId, onBiClientChange }) {
  const { clients } = useAppContext();
  const [selectedClientId, setSelectedClientId] = useState(biClientId || '');
  const [form, setForm] = useState({ ...EMPTY_INTAKE });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [expanded, setExpanded] = useState({ business: true, digital: true, marketing: false, goals: false, notes: false });
  const activeClients = clients.filter(c => c.status !== 'archived' && c.status !== 'rejected');

  useEffect(() => {
    if (!selectedClientId) { setForm({ ...EMPTY_INTAKE }); return; }
    const intakes = safeGetItem(INTAKES_KEY, {});
    setForm(intakes[selectedClientId] ? { ...EMPTY_INTAKE, ...intakes[selectedClientId] } : { ...EMPTY_INTAKE });
  }, [selectedClientId]);

  const toggle = k => setExpanded(p => ({ ...p, [k]: !p[k] }));
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const toggleSocial = s => setForm(p => ({ ...p, social_platforms: p.social_platforms.includes(s) ? p.social_platforms.filter(x => x !== s) : [...p.social_platforms, s] }));

  const completionPct = useMemo(() => {
    if (!selectedClientId) return 0;
    const fields = [
      'industry', 'years_in_operation', 'employee_count_range', 'annual_revenue_range',
      'target_market', 'business_model', 'current_website_url', 'hosting_provider',
      'tech_stack', 'has_ssl', 'is_mobile_responsive', 'social_platforms',
      'email_marketing_tool', 'seo_efforts', 'budget_range', 'timeline_expectations',
      'pain_points', 'goals', 'notes'
    ];
    const filled = fields.filter(f => {
      const v = form[f];
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'boolean') return true;
      return v && String(v).trim().length > 0;
    }).length;
    return Math.round((filled / fields.length) * 100);
  }, [form, selectedClientId]);

  const handleSave = () => {
    if (!selectedClientId) return;
    setSaving(true);
    const intakes = safeGetItem(INTAKES_KEY, {});
    const data = { ...form, updatedAt: new Date().toISOString() };
    if (!intakes[selectedClientId]) data.id = generateId();
    intakes[selectedClientId] = data;
    safeSetItem(INTAKES_KEY, JSON.stringify(intakes));
    syncToApi(() => intakesApi.createOrUpdate(selectedClientId, data), 'intake-save');
    setSaving(false);
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  return (
    <div className="bi-intake-form">
      <div className="bi-header"><h3><ClipboardList size={20} /> Client Intake Form</h3></div>
      <div className="form-group"><label>Select Client</label>
        <select value={selectedClientId} onChange={e => { setSelectedClientId(e.target.value); onBiClientChange?.(e.target.value); }}>
          <option value="">-- Choose a client --</option>
          {activeClients.map(c => <option key={c.id} value={c.id}>{c.name}{c.businessName ? " ("+c.businessName+")" : ""}</option>)}
        </select></div>
      {selectedClientId && (<>
        {/* Completion Progress */}
        <div className="bi-intake-progress">
          <div className="bi-intake-progress-bar">
            <div className="bi-intake-progress-fill" style={{ width: `${completionPct}%` }} />
          </div>
          <span className="bi-intake-progress-label">{completionPct}% complete</span>
        </div>
        <Section k="business" title="Business Overview" icon={<Building2 size={16} />} expanded={expanded.business} onToggle={toggle}>
          <div className="bi-form-grid">
            <Sel label="Industry" value={form.industry} onChange={e => set('industry', e.target.value)} opts={INDUSTRY_OPTIONS} />
            <Txt label="Sub-Industry" value={form.sub_industry || ''} onChange={e => set('sub_industry', e.target.value)} ph="e.g., Italian Restaurant" />
            <Txt label="Years in Operation" value={form.years_in_operation || ''} onChange={e => set('years_in_operation', e.target.value)} type="number" />
            <Sel label="Employee Count" value={form.employee_count_range} onChange={e => set('employee_count_range', e.target.value)} opts={EMPLOYEE_RANGES} />
            <Sel label="Annual Revenue" value={form.annual_revenue_range} onChange={e => set('annual_revenue_range', e.target.value)} opts={REVENUE_RANGES} />
            <Txt label="Target Market" value={form.target_market || ''} onChange={e => set('target_market', e.target.value)} ph="e.g., Local consumers" />
            <Txt label="Business Model" value={form.business_model || ''} onChange={e => set('business_model', e.target.value)} ph="e.g., Brick and mortar" />
          </div>
        </Section>
        <Section k="digital" title="Digital Presence" icon={<Globe size={16} />} expanded={expanded.digital} onToggle={toggle}>
          <div className="bi-form-grid">
            <Txt label="Website URL" value={form.current_website_url || ''} onChange={e => set('current_website_url', e.target.value)} type="url" ph="https://..." />
            <Txt label="Hosting" value={form.hosting_provider || ''} onChange={e => set('hosting_provider', e.target.value)} ph="e.g., GoDaddy" />
            <Txt label="Tech Stack" value={form.tech_stack || ''} onChange={e => set('tech_stack', e.target.value)} ph="e.g., WordPress" />
            <Txt label="Domain Age" value={form.domain_age_years || ''} onChange={e => set('domain_age_years', e.target.value)} type="number" />
            <div className="form-group"><label>Last Update</label><input type="date" value={form.last_website_update} onChange={e => set("last_website_update", e.target.value)} /></div>
            <div className="form-group bi-checkbox-row">
              <label><input type="checkbox" checked={form.has_ssl} onChange={e => set("has_ssl", e.target.checked)} /> SSL</label>
              <label><input type="checkbox" checked={form.is_mobile_responsive} onChange={e => set("is_mobile_responsive", e.target.checked)} /> Mobile</label>
            </div>
          </div>
        </Section>
        <Section k="marketing" title="Marketing" icon={<Target size={16} />} expanded={expanded.marketing} onToggle={toggle}>
          <div className="bi-form-grid">
            <Txt label="Email Marketing" value={form.email_marketing_tool || ''} onChange={e => set('email_marketing_tool', e.target.value)} />
            <Txt label="Paid Ads" value={form.paid_advertising || ''} onChange={e => set('paid_advertising', e.target.value)} />
            <Txt label="Content" value={form.content_marketing || ''} onChange={e => set('content_marketing', e.target.value)} />
            <Txt label="SEO" value={form.seo_efforts || ''} onChange={e => set('seo_efforts', e.target.value)} />
          </div>
        </Section>
        <Section k="goals" title="Pain Points & Goals" icon={<Target size={16} />} expanded={expanded.goals} onToggle={toggle}>
          <div className="form-group">
            <label>Pain Points</label>
            <textarea value={form.pain_points} onChange={e => set('pain_points', e.target.value)} rows={3}
              placeholder="What challenges is the client facing? What problems do they need solved?" />
          </div>
          <div className="form-group">
            <label>Business Goals</label>
            <textarea value={form.goals} onChange={e => set('goals', e.target.value)} rows={3}
              placeholder="What are their short-term and long-term business goals?" />
          </div>
          <div className="bi-form-grid">
            <Sel label="Budget" value={form.budget_range} onChange={e => set('budget_range', e.target.value)} opts={BUDGET_RANGES} />
            <Sel label="Timeline" value={form.timeline_expectations} onChange={e => set('timeline_expectations', e.target.value)} opts={TIMELINE_OPTIONS} />
          </div>
        </Section>
        <Section k="notes" title="Notes" icon={<ClipboardList size={16} />} expanded={expanded.notes} onToggle={toggle}>
          <div className="form-group"><textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={4} /></div>
        </Section>
        <div className="bi-actions">
          <button className="btn-primary" onClick={handleSave} disabled={saving}><Save size={16} /> {saving ? "Saving..." : "Save Intake"}</button>
          {saveMsg && <span className="bi-save-msg">{saveMsg}</span>}
        </div>
      </>)}
    </div>
  );
}
