import React, { useState, useMemo } from 'react';
import {
  Search, Building2, MapPin, Phone, Globe, Mail, X, Plus, Trash2, Users, DollarSign,
  ChevronRight, BarChart3, Target, Lightbulb, Crosshair, FileText, Briefcase,
  CalendarDays, CheckCircle, Clock, Activity, ClipboardList, TrendingUp, Star, MessageSquare,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { safeGetItem } from '../../constants';

// All BI localStorage keys
const BI_KEYS = {
  intakes: 'threeseas_bi_intakes',
  audits: 'threeseas_bi_audits',
  recs: 'threeseas_bi_recommendations',
  financials: 'threeseas_bi_client_financials',
  targets: 'threeseas_bi_growth_targets',
  snapshots: 'threeseas_bi_growth_snapshots',
  interventions: 'threeseas_bi_interventions',
  execPlans: 'threeseas_execution_plans',
  kpis: 'threeseas_bi_kpi_snapshots',
  serviceReqs: 'threeseas_bi_service_requests',
  feedback: 'threeseas_bi_feedback',
};

function ScoreBadge({ score }: { score: number | string | null | undefined }) {
  if (score == null) return <span className="bdb-score-badge none">No Score</span>;
  const n = parseFloat(String(score));
  const cls = n >= 7 ? 'good' : n >= 4 ? 'fair' : 'poor';
  return <span className={`bdb-score-badge ${cls}`}>{n.toFixed(1)}</span>;
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: '#10b981', pending: '#f59e0b', archived: '#6b7280', cancelled: '#ef4444',
    completed: '#10b981', 'in-progress': '#3b82f6', planning: '#8b5cf6', review: '#f59e0b',
    proposed: '#6b7280', accepted: '#3b82f6', declined: '#ef4444',
    won: '#10b981', lost: '#ef4444', deferred: '#f59e0b',
    planned: '#8b5cf6', paused: '#f59e0b',
  };
  return <span className="bdb-status-pill" style={{ background: colors[status] || '#6b7280' }}>{status}</span>;
}

export default function BusinessDatabaseTab() {
  const {
    businessDatabase, deleteFromBusinessDb, addLead, leads,
    clients, prospects, appointments,
  } = useAppContext();

  const [dbSearch, setDbSearch] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredDatabase = useMemo(() => {
    if (!dbSearch.trim()) return businessDatabase;
    const s = dbSearch.toLowerCase();
    return businessDatabase.filter((b: any) =>
      b.name?.toLowerCase().includes(s) ||
      b.address?.toLowerCase().includes(s) ||
      b.type?.toLowerCase().includes(s) ||
      b.enrichment?.decisionMaker?.toLowerCase().includes(s)
    );
  }, [businessDatabase, dbSearch]);

  // Compile ALL data for the expanded entry
  const compiledData = useMemo(() => {
    if (!expandedId) return null;
    const biz = businessDatabase.find((b) => b.id === expandedId);
    if (!biz) return null;

    // Match to client by name or email
    const matchedClient = clients.find((c) =>
      (c.name && biz.name && c.name.toLowerCase().trim() === biz.name.toLowerCase().trim()) ||
      (c.email && biz.enrichment?.contactEmail && c.email.toLowerCase() === biz.enrichment.contactEmail.toLowerCase())
    ) || null;

    // Match to prospect
    const matchedProspect = prospects.find((p) =>
      (p.name && biz.name && p.name.toLowerCase().trim() === biz.name.toLowerCase().trim()) ||
      (p.email && biz.enrichment?.contactEmail && p.email.toLowerCase() === biz.enrichment.contactEmail.toLowerCase())
    ) || null;

    // Match to lead
    const matchedLead = leads.find((l) =>
      l.businessName && biz.name && l.businessName.toLowerCase().trim() === biz.name.toLowerCase().trim()
    ) || null;

    // Match to appointments (by name)
    const matchedAppts = appointments.filter((a) =>
      a.name && biz.name && a.name.toLowerCase().trim() === biz.name.toLowerCase().trim()
    );

    const clientId = matchedClient?.id;

    // BI Data (only if we have a matched client)
    const intakes = safeGetItem(BI_KEYS.intakes, {});
    const intake = clientId ? intakes[clientId] || null : null;

    const allAudits = safeGetItem(BI_KEYS.audits, []);
    const audits = clientId ? allAudits.filter((a) => a.clientId === clientId).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
    const latestAudit = audits[0] || null;

    let overallScore = null;
    if (latestAudit?.scores) {
      const vals = Object.values(latestAudit.scores).filter((v): v is number => typeof v === 'number' && v > 0);
      overallScore = vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null;
    }

    const allRecs = safeGetItem(BI_KEYS.recs, {});
    const recs = [];
    audits.forEach((a) => { (allRecs[a.id] || []).forEach((r) => recs.push(r)); });

    const allFinancials = safeGetItem(BI_KEYS.financials, {});
    const finData = clientId ? allFinancials[clientId] : null;
    const finEntries = finData?.entries || [];
    const totalRevenue = finEntries.reduce((s, e) => s + (e.revenue || 0), 0);
    const totalExpenses = finEntries.reduce((s, e) => s + (e.expenses || 0), 0);

    const allTargets = safeGetItem(BI_KEYS.targets, []);
    const targets = clientId ? allTargets.filter((t) => t.clientId === clientId) : [];

    const allSnapshots = safeGetItem(BI_KEYS.snapshots, []);
    const snapshots = clientId ? allSnapshots.filter((s) => s.clientId === clientId) : [];

    const allInterventions = safeGetItem(BI_KEYS.interventions, {});
    const interventions = clientId ? allInterventions[clientId]?.interventions || [] : [];

    const allExecPlans = safeGetItem(BI_KEYS.execPlans, {});
    const execPlan = clientId ? allExecPlans[clientId] || null : null;

    const allKpis = safeGetItem(BI_KEYS.kpis, {});
    const kpis = clientId ? allKpis[clientId] || null : null;

    const allServiceReqs = safeGetItem(BI_KEYS.serviceReqs, []);
    const serviceReqs = clientId ? allServiceReqs.filter((r) => r.clientId === clientId) : [];

    const allFeedback = safeGetItem(BI_KEYS.feedback, []);
    const feedback = clientId ? allFeedback.filter((f) => f.clientId === clientId) : [];

    // Client model data
    const projects = matchedClient?.projects || [];
    const invoices = matchedClient?.invoices || [];
    const documents = matchedClient?.documents || [];
    const notes = matchedClient?.notes || [];
    const tags = matchedClient?.tags || [];
    const onboarding = matchedClient?.onboarding || null;
    const tier = matchedClient?.tier || null;

    return {
      biz, matchedClient, matchedProspect, matchedLead, matchedAppts, clientId,
      intake, audits, latestAudit, overallScore, recs,
      finEntries, totalRevenue, totalExpenses,
      targets, snapshots, interventions,
      execPlan, kpis, serviceReqs, feedback,
      projects, invoices, documents, notes, tags, onboarding, tier,
    };
  }, [expandedId, businessDatabase, clients, prospects, leads, appointments]);

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="business-database-tab">
      {toastMsg && <div className="convert-toast">{toastMsg}</div>}

      <div className="bdb-header">
        <div className="bdb-search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, address, type, or contact..."
            value={dbSearch}
            onChange={(e) => setDbSearch(e.target.value)}
          />
        </div>
        <span className="bdb-count">{filteredDatabase.length} of {businessDatabase.length} businesses</span>
      </div>

      {filteredDatabase.length === 0 ? (
        <div className="db-empty">
          <Building2 size={48} />
          <h3>{businessDatabase.length === 0 ? 'No businesses saved yet' : 'No matching businesses'}</h3>
          <p>{businessDatabase.length === 0 ? 'Research businesses and save their intel to build your database' : 'Try a different search term'}</p>
        </div>
      ) : (
        <div className="bdb-list">
          {filteredDatabase.map((biz) => {
            const isExpanded = expandedId === biz.id;
            const hasClient = clients.some((c) => c.name && biz.name && c.name.toLowerCase().trim() === biz.name.toLowerCase().trim());
            const hasLead = leads.some((l) => l.businessName && biz.name && l.businessName.toLowerCase().trim() === biz.name.toLowerCase().trim());
            const hasProspect = prospects.some((p) => p.name && biz.name && p.name.toLowerCase().trim() === biz.name.toLowerCase().trim());

            return (
              <div key={biz.id} className={`bdb-row ${isExpanded ? 'bdb-row-expanded' : ''}`}>
                <div className="bdb-row-main" onClick={() => toggleExpand(biz.id)}>
                  <ChevronRight size={16} className={`bdb-chevron ${isExpanded ? 'bdb-chevron-open' : ''}`} />
                  <div className="bdb-row-info">
                    <div className="bdb-row-name">
                      <strong>{biz.name}</strong>
                      <span className="bdb-row-type">{biz.type || 'Business'}</span>
                      {hasClient && <span className="bdb-tag bdb-tag-client">Client</span>}
                      {hasProspect && <span className="bdb-tag bdb-tag-prospect">Prospect</span>}
                      {hasLead && <span className="bdb-tag bdb-tag-lead">Lead</span>}
                    </div>
                    <div className="bdb-row-meta">
                      {biz.address && <span><MapPin size={12} /> {biz.address}</span>}
                      {biz.phone && <span><Phone size={12} /> {biz.phone}</span>}
                      {biz.enrichment?.decisionMaker && <span><Users size={12} /> {biz.enrichment.decisionMaker}</span>}
                    </div>
                  </div>
                  <div className="bdb-row-actions" onClick={(e) => e.stopPropagation()}>
                    {!hasLead && !hasClient && (
                      <button className="btn btn-xs btn-outline" onClick={() => {
                        addLead({ businessName: biz.name, address: biz.address, phone: biz.phone, website: biz.website, type: biz.type, source: 'database', coordinates: biz.coordinates, enrichment: biz.enrichment });
                        setToastMsg('Added to leads!');
                        setTimeout(() => setToastMsg(''), 2000);
                      }}>
                        <Plus size={12} /> Lead
                      </button>
                    )}
                    {deleteConfirm === biz.id ? (
                      <span className="bdb-delete-confirm">
                        Delete?
                        <button className="btn btn-xs btn-danger" onClick={() => { deleteFromBusinessDb(biz.id); setDeleteConfirm(null); if (expandedId === biz.id) setExpandedId(null); }}>Yes</button>
                        <button className="btn btn-xs btn-outline" onClick={() => setDeleteConfirm(null)}>No</button>
                      </span>
                    ) : (
                      <button className="btn btn-xs btn-danger-outline" onClick={() => setDeleteConfirm(biz.id)}><Trash2 size={12} /></button>
                    )}
                  </div>
                </div>

                {/* ===== EXPANDED DETAIL PANEL ===== */}
                {isExpanded && compiledData && (
                  <div className="bdb-detail">
                    {/* Quick Stats Row */}
                    <div className="bdb-stats-row">
                      <div className="bdb-stat">
                        <BarChart3 size={16} />
                        <div>
                          <span className="bdb-stat-val"><ScoreBadge score={compiledData.overallScore} /></span>
                          <span className="bdb-stat-lbl">Health Score</span>
                        </div>
                      </div>
                      <div className="bdb-stat">
                        <DollarSign size={16} />
                        <div>
                          <span className="bdb-stat-val">${compiledData.totalRevenue.toLocaleString()}</span>
                          <span className="bdb-stat-lbl">BI Revenue</span>
                        </div>
                      </div>
                      <div className="bdb-stat">
                        <Briefcase size={16} />
                        <div>
                          <span className="bdb-stat-val">{compiledData.projects.length}</span>
                          <span className="bdb-stat-lbl">Projects</span>
                        </div>
                      </div>
                      <div className="bdb-stat">
                        <Crosshair size={16} />
                        <div>
                          <span className="bdb-stat-val">{compiledData.interventions.length}</span>
                          <span className="bdb-stat-lbl">Interventions</span>
                        </div>
                      </div>
                      <div className="bdb-stat">
                        <Lightbulb size={16} />
                        <div>
                          <span className="bdb-stat-val">{compiledData.recs.length}</span>
                          <span className="bdb-stat-lbl">Recommendations</span>
                        </div>
                      </div>
                      <div className="bdb-stat">
                        <CalendarDays size={16} />
                        <div>
                          <span className="bdb-stat-val">{compiledData.matchedAppts.length}</span>
                          <span className="bdb-stat-lbl">Appointments</span>
                        </div>
                      </div>
                    </div>

                    <div className="bdb-detail-grid">
                      {/* Contact & Enrichment */}
                      <div className="bdb-section">
                        <h4><Building2 size={14} /> Contact & Intel</h4>
                        <div className="bdb-kv-list">
                          {compiledData.biz.address && <div className="bdb-kv"><span>Address</span><span>{compiledData.biz.address}</span></div>}
                          {compiledData.biz.phone && <div className="bdb-kv"><span>Phone</span><a href={`tel:${compiledData.biz.phone}`}>{compiledData.biz.phone}</a></div>}
                          {compiledData.biz.website && <div className="bdb-kv"><span>Website</span><a href={compiledData.biz.website} target="_blank" rel="noopener noreferrer">{compiledData.biz.website}</a></div>}
                          {compiledData.biz.enrichment?.directEmail && <div className="bdb-kv"><span>Email</span><a href={`mailto:${compiledData.biz.enrichment.directEmail}`}>{compiledData.biz.enrichment.directEmail}</a></div>}
                          {compiledData.biz.enrichment?.decisionMaker && <div className="bdb-kv"><span>Decision Maker</span><span>{compiledData.biz.enrichment.decisionMaker}</span></div>}
                          {compiledData.biz.enrichment?.revenue && <div className="bdb-kv"><span>Revenue Range</span><span>{compiledData.biz.enrichment.revenue}</span></div>}
                          {compiledData.biz.enrichment?.employees && <div className="bdb-kv"><span>Employees</span><span>{compiledData.biz.enrichment.employees}</span></div>}
                          {compiledData.biz.enrichment?.yearsInBusiness && <div className="bdb-kv"><span>Years in Business</span><span>{compiledData.biz.enrichment.yearsInBusiness}</span></div>}
                          {compiledData.biz.enrichment?.googleRating && <div className="bdb-kv"><span>Google Rating</span><span>{compiledData.biz.enrichment.googleRating} ({compiledData.biz.enrichment.googleReviews || 0} reviews)</span></div>}
                          {compiledData.biz.enrichment?.yelpRating && <div className="bdb-kv"><span>Yelp Rating</span><span>{compiledData.biz.enrichment.yelpRating}</span></div>}
                        </div>
                        {compiledData.biz.enrichment?.notes && (
                          <div className="bdb-enrich-notes"><span>Research Notes:</span> {compiledData.biz.enrichment.notes}</div>
                        )}
                        <div className="bdb-record-meta">
                          <span>Source: {compiledData.biz.source === 'osm' ? 'OpenStreetMap' : compiledData.biz.source === 'follow-up' ? 'Follow-Up' : compiledData.biz.source === 'lead' ? 'Lead' : 'Manual'}</span>
                          <span>Added: {new Date(compiledData.biz.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Pipeline Journey */}
                      <div className="bdb-section">
                        <h4><Briefcase size={14} /> Pipeline Journey</h4>
                        <div className="bdb-journey">
                          <div className={`bdb-journey-step ${compiledData.matchedLead ? 'active' : 'inactive'}`}>
                            <MapPin size={14} />
                            <span>Lead</span>
                            {compiledData.matchedLead && <StatusPill status={compiledData.matchedLead.status} />}
                          </div>
                          <span className="bdb-journey-arrow">&rarr;</span>
                          <div className={`bdb-journey-step ${compiledData.matchedProspect ? 'active' : 'inactive'}`}>
                            <Briefcase size={14} />
                            <span>Prospect</span>
                            {compiledData.matchedProspect && <StatusPill status={compiledData.matchedProspect.stage} />}
                          </div>
                          <span className="bdb-journey-arrow">&rarr;</span>
                          <div className={`bdb-journey-step ${compiledData.matchedClient ? 'active' : 'inactive'}`}>
                            <Users size={14} />
                            <span>Client</span>
                            {compiledData.matchedClient && <StatusPill status={compiledData.matchedClient.status} />}
                          </div>
                        </div>
                        {compiledData.matchedClient && compiledData.tier && (
                          <div className="bdb-kv"><span>Service Tier</span><span className="bdb-tier-badge">{compiledData.tier}</span></div>
                        )}
                        {compiledData.tags.length > 0 && (
                          <div className="bdb-tags">{compiledData.tags.map((t, i) => <span key={i} className="bdb-tag">{t}</span>)}</div>
                        )}
                      </div>

                      {/* Intake / Onboarding */}
                      <div className="bdb-section">
                        <h4><ClipboardList size={14} /> Intake & Onboarding</h4>
                        {compiledData.intake ? (
                          <div className="bdb-kv-list">
                            {compiledData.intake.industry && <div className="bdb-kv"><span>Industry</span><span>{compiledData.intake.industry}</span></div>}
                            {compiledData.intake.revenue_range && <div className="bdb-kv"><span>Revenue Range</span><span>{compiledData.intake.revenue_range}</span></div>}
                            {compiledData.intake.employee_count && <div className="bdb-kv"><span>Employees</span><span>{compiledData.intake.employee_count}</span></div>}
                            {compiledData.intake.website && <div className="bdb-kv"><span>Website</span><span>{compiledData.intake.website}</span></div>}
                            {compiledData.intake.budget_range && <div className="bdb-kv"><span>Budget</span><span>{compiledData.intake.budget_range}</span></div>}
                            {compiledData.intake.pain_points && <div className="bdb-kv bdb-kv-full"><span>Pain Points</span><span>{compiledData.intake.pain_points}</span></div>}
                            {compiledData.intake.goals && <div className="bdb-kv bdb-kv-full"><span>Goals</span><span>{compiledData.intake.goals}</span></div>}
                          </div>
                        ) : <p className="bdb-empty-text">No intake data</p>}
                        {compiledData.onboarding && (
                          <div className="bdb-onboarding-status">
                            <span>Onboarding: {compiledData.onboarding.complete ? <><CheckCircle size={12} /> Complete</> : <><Clock size={12} /> In Progress</>}</span>
                            {compiledData.onboarding.documents && (
                              <div className="bdb-onboard-docs">
                                {Object.entries(compiledData.onboarding.documents).map(([key, doc]: [string, any]) => (
                                  <span key={key} className={`bdb-onboard-doc ${doc.status === 'approved' ? 'done' : doc.status === 'pending' ? 'pending' : 'progress'}`}>
                                    {key.replace('_', ' ')}: {doc.status}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Audit History */}
                      <div className="bdb-section">
                        <h4><BarChart3 size={14} /> Audit History ({compiledData.audits.length})</h4>
                        {compiledData.audits.length > 0 ? (
                          <div className="bdb-audit-list">
                            {compiledData.audits.slice(0, 5).map((audit) => {
                              const vals = audit.scores ? (Object.values(audit.scores) as number[]).filter((v) => typeof v === 'number' && v > 0) : [];
                              const score = vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : null;
                              return (
                                <div key={audit.id} className="bdb-audit-item">
                                  <ScoreBadge score={score} />
                                  <span>{new Date(audit.createdAt).toLocaleDateString()}</span>
                                  <StatusPill status={audit.status || 'completed'} />
                                </div>
                              );
                            })}
                          </div>
                        ) : <p className="bdb-empty-text">No audits</p>}
                      </div>

                      {/* Recommendations */}
                      <div className="bdb-section">
                        <h4><Lightbulb size={14} /> Recommendations ({compiledData.recs.length})</h4>
                        {compiledData.recs.length > 0 ? (
                          <>
                            <div className="bdb-rec-summary">
                              {['proposed', 'accepted', 'in_progress', 'completed', 'declined'].map((s) => {
                                const c = compiledData.recs.filter((r) => r.status === s).length;
                                return c > 0 ? <span key={s} className="bdb-rec-chip"><StatusPill status={s} /> {c}</span> : null;
                              })}
                            </div>
                            <div className="bdb-rec-list">
                              {compiledData.recs.slice(0, 6).map((r) => (
                                <div key={r.id} className="bdb-rec-item">
                                  <span className="bdb-rec-title">{r.title || r.name || 'Recommendation'}</span>
                                  <StatusPill status={r.status} />
                                  {r.priority && <span className={`bdb-priority ${r.priority}`}>{r.priority}</span>}
                                </div>
                              ))}
                            </div>
                          </>
                        ) : <p className="bdb-empty-text">No recommendations</p>}
                      </div>

                      {/* Financial Summary */}
                      <div className="bdb-section">
                        <h4><DollarSign size={14} /> Financial Summary</h4>
                        {compiledData.finEntries.length > 0 ? (
                          <div className="bdb-kv-list">
                            <div className="bdb-kv"><span>Total Revenue</span><span className="bdb-val-positive">${compiledData.totalRevenue.toLocaleString()}</span></div>
                            <div className="bdb-kv"><span>Total Expenses</span><span className="bdb-val-negative">${compiledData.totalExpenses.toLocaleString()}</span></div>
                            <div className="bdb-kv"><span>Net Profit</span><span className={(compiledData.totalRevenue - compiledData.totalExpenses) >= 0 ? 'bdb-val-positive' : 'bdb-val-negative'}>${(compiledData.totalRevenue - compiledData.totalExpenses).toLocaleString()}</span></div>
                            <div className="bdb-kv"><span>Data Points</span><span>{compiledData.finEntries.length} months</span></div>
                            {compiledData.finEntries.length > 0 && (
                              <div className="bdb-kv"><span>Avg Revenue/Mo</span><span>${Math.round(compiledData.totalRevenue / compiledData.finEntries.length).toLocaleString()}</span></div>
                            )}
                          </div>
                        ) : (
                          <>
                            {compiledData.invoices.length > 0 && (
                              <div className="bdb-kv-list">
                                <div className="bdb-kv"><span>Invoices</span><span>{compiledData.invoices.length} total</span></div>
                                <div className="bdb-kv"><span>Paid</span><span>{compiledData.invoices.filter((i) => i.status === 'paid').length}</span></div>
                                <div className="bdb-kv"><span>Invoice Total</span><span>${compiledData.invoices.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()}</span></div>
                              </div>
                            )}
                            {compiledData.invoices.length === 0 && <p className="bdb-empty-text">No financial data</p>}
                          </>
                        )}
                      </div>

                      {/* Growth Targets */}
                      <div className="bdb-section">
                        <h4><Target size={14} /> Growth Targets ({compiledData.targets.length})</h4>
                        {compiledData.targets.length > 0 ? (
                          <div className="bdb-targets">
                            {compiledData.targets.map((t) => {
                              const pct = t.target ? Math.min(100, Math.round(((t.current || 0) / t.target) * 100)) : 0;
                              return (
                                <div key={t.id} className="bdb-target-item">
                                  <div className="bdb-target-header">
                                    <span>{t.metric || t.name}</span>
                                    <span className="bdb-target-pct">{pct}%</span>
                                  </div>
                                  <div className="bdb-target-bar"><div className="bdb-target-fill" style={{ width: `${pct}%` }} /></div>
                                  <div className="bdb-target-vals"><span>Current: {t.current || 0}</span><span>Target: {t.target || 0}</span></div>
                                </div>
                              );
                            })}
                          </div>
                        ) : <p className="bdb-empty-text">No growth targets</p>}
                      </div>

                      {/* Interventions */}
                      <div className="bdb-section">
                        <h4><Crosshair size={14} /> Interventions ({compiledData.interventions.length})</h4>
                        {compiledData.interventions.length > 0 ? (
                          <div className="bdb-intervention-list">
                            {compiledData.interventions.map((iv) => {
                              const roi = iv.cost && iv.after?.revenue && iv.before?.revenue
                                ? (((iv.after.revenue - iv.before.revenue) / iv.cost) * 100).toFixed(0) : null;
                              return (
                                <div key={iv.id} className="bdb-intervention-item">
                                  <div className="bdb-intervention-header">
                                    <span>{iv.name || iv.title}</span>
                                    <StatusPill status={iv.status} />
                                  </div>
                                  <div className="bdb-intervention-meta">
                                    <span className="bdb-iv-type">{iv.type}</span>
                                    {iv.cost > 0 && <span>${iv.cost.toLocaleString()}</span>}
                                    {roi && <span className={`bdb-roi ${parseFloat(roi) >= 0 ? 'positive' : 'negative'}`}>ROI: {roi}%</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : <p className="bdb-empty-text">No interventions</p>}
                      </div>

                      {/* Execution Plan */}
                      <div className="bdb-section">
                        <h4><Activity size={14} /> 30/60/90 Plan</h4>
                        {compiledData.execPlan ? (
                          <div className="bdb-exec-plan">
                            {['30', '60', '90'].map((phase) => {
                              const items = compiledData.execPlan[`day${phase}`] || [];
                              const done = items.filter((i) => i.done || i.completed).length;
                              return (
                                <div key={phase} className="bdb-exec-phase">
                                  <span className="bdb-exec-label">Day {phase}</span>
                                  <span>{done}/{items.length} complete</span>
                                  <div className="bdb-target-bar"><div className="bdb-target-fill" style={{ width: items.length ? `${(done / items.length) * 100}%` : '0%' }} /></div>
                                </div>
                              );
                            })}
                          </div>
                        ) : <p className="bdb-empty-text">No execution plan</p>}
                      </div>

                      {/* Projects */}
                      <div className="bdb-section">
                        <h4><Briefcase size={14} /> Projects ({compiledData.projects.length})</h4>
                        {compiledData.projects.length > 0 ? (
                          <div className="bdb-mini-list">
                            {compiledData.projects.map((p) => (
                              <div key={p.id} className="bdb-mini-item">
                                <span>{p.name || p.title}</span>
                                <StatusPill status={p.status} />
                              </div>
                            ))}
                          </div>
                        ) : <p className="bdb-empty-text">No projects</p>}
                      </div>

                      {/* KPIs */}
                      <div className="bdb-section">
                        <h4><TrendingUp size={14} /> KPI Snapshots</h4>
                        {compiledData.kpis?.snapshots?.length > 0 ? (
                          <div className="bdb-mini-list">
                            {compiledData.kpis.snapshots.slice(-3).reverse().map((snap, i) => (
                              <div key={i} className="bdb-mini-item">
                                <span>{new Date(snap.date || snap.createdAt).toLocaleDateString()}</span>
                                <span>{Object.keys(snap.values || snap.data || {}).length} metrics</span>
                              </div>
                            ))}
                          </div>
                        ) : <p className="bdb-empty-text">No KPI data</p>}
                      </div>

                      {/* Service Requests & Feedback */}
                      <div className="bdb-section">
                        <h4><Star size={14} /> Service Requests & Feedback</h4>
                        <div className="bdb-kv-list">
                          <div className="bdb-kv"><span>Service Requests</span><span>{compiledData.serviceReqs.length}</span></div>
                          <div className="bdb-kv"><span>Feedback Items</span><span>{compiledData.feedback.length}</span></div>
                          {compiledData.feedback.length > 0 && (() => {
                            const ratings = compiledData.feedback.filter((f) => f.rating).map((f) => f.rating);
                            const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;
                            return avg ? <div className="bdb-kv"><span>Avg Rating</span><span>{avg} / 5</span></div> : null;
                          })()}
                        </div>
                      </div>

                      {/* Appointments */}
                      <div className="bdb-section">
                        <h4><CalendarDays size={14} /> Appointments ({compiledData.matchedAppts.length})</h4>
                        {compiledData.matchedAppts.length > 0 ? (
                          <div className="bdb-mini-list">
                            {compiledData.matchedAppts.slice(0, 5).map((a) => (
                              <div key={a.id} className="bdb-mini-item">
                                <span>{a.date} at {a.time}</span>
                                <StatusPill status={a.status} />
                              </div>
                            ))}
                          </div>
                        ) : <p className="bdb-empty-text">No appointments</p>}
                      </div>

                      {/* Documents */}
                      <div className="bdb-section">
                        <h4><FileText size={14} /> Documents ({compiledData.documents.length})</h4>
                        {compiledData.documents.length > 0 ? (
                          <div className="bdb-mini-list">
                            {compiledData.documents.map((d) => (
                              <div key={d.id} className="bdb-mini-item">
                                <span>{d.name}</span>
                                <span className="bdb-doc-type">{d.type}</span>
                              </div>
                            ))}
                          </div>
                        ) : <p className="bdb-empty-text">No documents</p>}
                      </div>

                      {/* Notes */}
                      <div className="bdb-section">
                        <h4><MessageSquare size={14} /> Notes ({compiledData.notes.length})</h4>
                        {compiledData.notes.length > 0 ? (
                          <div className="bdb-notes-list">
                            {compiledData.notes.slice(0, 8).map((n) => (
                              <div key={n.id} className="bdb-note-item">
                                <p>{n.text}</p>
                                <span className="bdb-note-meta">{n.author} &middot; {new Date(n.createdAt).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        ) : <p className="bdb-empty-text">No notes</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
