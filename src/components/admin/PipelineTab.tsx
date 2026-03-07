import { useState, useMemo } from 'react';
import {
  AlertCircle, CheckCircle, XCircle, Clock, Mail, Phone, Briefcase,
  Plus, X, Trash2, Search, FolderKanban, ChevronUp, ChevronDown,
  ArrowRight, FileText, Eye, Download, Upload, Printer, CalendarDays, MessageSquare, Ban,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import AppointmentScheduler from './AppointmentScheduler';
import { safeGetItem, escapeHtml } from '../../constants';
import { generateProposalPdf } from '../../utils/generateOnboardingPdfs';

const PROPOSAL_SERVICES = [
  { id: 'web-design', label: 'Website Design & Development' },
  { id: 'seo', label: 'Search Engine Optimization (SEO)' },
  { id: 'content', label: 'Content Strategy & Creation' },
  { id: 'social', label: 'Social Media Management' },
  { id: 'branding', label: 'Branding & Identity' },
  { id: 'analytics', label: 'Analytics & Reporting' },
  { id: 'ppc', label: 'Paid Advertising (PPC)' },
  { id: 'email-marketing', label: 'Email Marketing' },
  { id: 'maintenance', label: 'Ongoing Maintenance & Support' },
  { id: 'consulting', label: 'Business Consulting' },
];

const APPT_NOTE_PREFIX = '[Appt]';

const DEFAULT_PROPOSAL_FORM = {
  services: [],
  customPrice: '',
  discount: '',
  discountType: 'percent',
  timeline: '',
  paymentTerms: 'net15',
  notes: '',
};

export default function PipelineTab() {
  const {
    prospects, addProspect, updateProspect, deleteProspect,
    addProspectNote, deleteProspectNote, closeProspect, reopenProspect,
    convertProspectToClient, PROSPECT_STAGES, LOSS_REASONS,
    addProspectDocument, deleteProspectDocument, DOCUMENT_TYPES,
    addNotification, saveToBusinessDb, SUBSCRIPTION_TIERS,
    addAppointment, updateAppointment, updateAppointmentStatus, appointments,
  } = useAppContext();

  const [stageFilter, setStageFilter] = useState('all');
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState<any>(null);
  const [showPastProspects, setShowPastProspects] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteNoteConfirm, setDeleteNoteConfirm] = useState<any>(null);
  const [deleteDocConfirm, setDeleteDocConfirm] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({ name: '', type: 'contract', description: '' });
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docError, setDocError] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [showProposalBuilder, setShowProposalBuilder] = useState(false);
  const [proposalForm, setProposalForm] = useState({ ...DEFAULT_PROPOSAL_FORM });
  const [showScheduler, setShowScheduler] = useState(false);
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [showApptNotes, setShowApptNotes] = useState(false);
  const [apptNote, setApptNote] = useState('');
  const [cancelApptConfirm, setCancelApptConfirm] = useState(false);

  const [addForm, setAddForm] = useState({
    name: '', email: '', phone: '', service: '', dealValue: '', expectedCloseDate: '',
  });
  const [closeForm, setCloseForm] = useState({
    outcome: 'won', lossReason: '', revisitDate: '',
  });

  // Active prospects (not closed)
  const activeProspects = prospects.filter((p) => p.stage !== 'closed');
  const closedProspects = prospects.filter((p) => p.stage === 'closed');

  // Filter active prospects
  const filteredProspects = activeProspects
    .filter((p) => stageFilter === 'all' || p.stage === stageFilter)
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.email.toLowerCase().includes(searchTerm.toLowerCase()));

  // Pipeline stats
  const stats = useMemo(() => {
    const active_ = prospects.filter((p) => p.stage !== 'closed');
    const closed_ = prospects.filter((p) => p.stage === 'closed');
    const total = prospects.length;
    const active = active_.length;
    const won = closed_.filter((p) => p.outcome === 'won').length;
    const lost = closed_.filter((p) => p.outcome === 'lost').length;
    const deferred = closed_.filter((p) => p.outcome === 'deferred').length;
    // Average deal time (for won deals)
    const wonDeals = closed_.filter((p) => p.outcome === 'won' && p.closedAt);
    const avgDealTime = wonDeals.length > 0
      ? Math.round(wonDeals.reduce((sum: number, p: any) => sum + ((new Date(p.closedAt).getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24)), 0) / wonDeals.length)
      : 0;

    // Loss reasons breakdown
    const lossReasons = {};
    closed_.filter((p) => p.outcome === 'lost').forEach((p) => {
      const reason = p.lossReason || 'other';
      lossReasons[reason] = (lossReasons[reason] || 0) + 1;
    });

    // Upcoming revisits
    const today = new Date().toISOString().split('T')[0];
    const upcomingRevisits = closed_
      .filter((p) => p.outcome === 'deferred' && p.revisitDate && p.revisitDate <= today)
      .sort((a, b) => a.revisitDate.localeCompare(b.revisitDate));

    // Stage counts
    const stageCounts = {};
    PROSPECT_STAGES.forEach((s) => {
      stageCounts[s.value] = active_.filter((p) => p.stage === s.value).length;
    });

    return { total, active, won, lost, deferred, avgDealTime, lossReasons, upcomingRevisits, stageCounts };
  }, [prospects, PROSPECT_STAGES]);

  const handleAddProspect = (e: React.FormEvent) => {
    e.preventDefault();
    const result = addProspect({ ...addForm, dealValue: parseFloat(addForm.dealValue) || 0 });
    if (result.success) {
      setAddForm({ name: '', email: '', phone: '', service: '', dealValue: '', expectedCloseDate: '' });
      setShowAddForm(false);
      setToastMsg('Prospect added successfully');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handleClose = (prospectId: string) => {
    const prospect = prospects.find((p) => p.id === prospectId);
    closeProspect(prospectId, closeForm.outcome, {
      lossReason: closeForm.lossReason,
      revisitDate: closeForm.revisitDate,
    });
    if (closeForm.outcome === 'won') {
      const result = convertProspectToClient(prospectId);
      setToastMsg(result.success ? 'Deal won! Client created.' : result.message || 'Deal marked as won');
      addNotification({
        type: 'success',
        title: 'Deal Won',
        message: `${prospect?.name || 'Prospect'} - deal closed as won`,
      });
    } else if (closeForm.outcome === 'lost') {
      // Update business database with loss reason
      saveToBusinessDb({
        name: prospect?.name || '',
        address: '',
        phone: prospect?.phone || '',
        type: prospect?.service || '',
        source: 'pipeline',
        enrichment: {
          pipelineStatus: 'lost',
          lostAt: new Date().toISOString(),
          lossReason: closeForm.lossReason || '',
          pointOfContact: prospect?.name || '',
          contactEmail: prospect?.email || '',
          dealValue: prospect?.dealValue || 0,
        },
      });
      setToastMsg('Deal marked as lost');
      addNotification({
        type: 'warning',
        title: 'Deal Lost',
        message: `${prospect?.name || 'Prospect'} - deal lost${closeForm.lossReason ? ': ' + closeForm.lossReason : ''}`,
      });
    } else {
      // Update business database with deferred status
      saveToBusinessDb({
        name: prospect?.name || '',
        address: '',
        phone: prospect?.phone || '',
        type: prospect?.service || '',
        source: 'pipeline',
        enrichment: {
          pipelineStatus: 'deferred',
          deferredAt: new Date().toISOString(),
          revisitDate: closeForm.revisitDate || '',
          deferredReason: closeForm.lossReason || '',
          pointOfContact: prospect?.name || '',
          contactEmail: prospect?.email || '',
          dealValue: prospect?.dealValue || 0,
        },
      });
      setToastMsg('Deal deferred for follow-up');
      addNotification({
        type: 'warning',
        title: 'Deal Deferred',
        message: `${prospect?.name || 'Prospect'} - deal deferred${closeForm.lossReason ? ': ' + closeForm.lossReason : ''}`,
      });
    }
    setShowCloseForm(null);
    setSelectedProspect(null); // Clear selection to update UI
    setCloseForm({ outcome: 'won', lossReason: '', revisitDate: '' });
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleAddNote = (prospectId: string) => {
    if (!newNote.trim()) return;
    addProspectNote(prospectId, newNote);
    setNewNote('');
  };

  const handleOpenProposalBuilder = () => {
    setProposalForm({ ...DEFAULT_PROPOSAL_FORM });
    setShowProposalBuilder(true);
  };

  const handleGenerateProposal = async () => {
    const p = selectedProspect ? prospects.find((pr) => pr.id === selectedProspect) : null;
    if (!p) return;
    setGeneratingProposal(true);
    try {
      const tierData = SUBSCRIPTION_TIERS[p.tier] || SUBSCRIPTION_TIERS.free || { label: 'Standard', description: '' };
      const intakes = safeGetItem('threeseas_bi_intakes', {});
      const intakeData = intakes[p.id] || {};
      const selectedLabels = proposalForm.services.map(
        (id) => PROPOSAL_SERVICES.find((s) => s.id === id)?.label
      ).filter(Boolean);
      const pdfData = await generateProposalPdf(
        { name: p.name, email: p.email, businessName: p.service },
        tierData,
        intakeData,
        {
          services: selectedLabels,
          customPrice: proposalForm.customPrice,
          discount: proposalForm.discount,
          discountType: proposalForm.discountType,
          timeline: proposalForm.timeline,
          paymentTerms: proposalForm.paymentTerms,
          notes: proposalForm.notes,
        }
      );
      // Remove old proposal if regenerating
      const oldProposal = (p.documents || []).find(d => d.type === 'proposal');
      if (oldProposal) deleteProspectDocument(p.id, oldProposal.id);
      addProspectDocument(p.id, pdfData);
      setShowProposalBuilder(false);
      setToastMsg('Proposal generated');
      setTimeout(() => setToastMsg(''), 3000);
    } finally {
      setGeneratingProposal(false);
    }
  };

  const toggleProposalService = (serviceId: string) => {
    setProposalForm((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((id) => id !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const openDocPreview = (doc: any) => {
    if (doc.fileType === 'application/pdf' && doc.fileData) {
      // Build clean data URI without filename param, then embed in a new tab
      const cleanUri = doc.fileData.replace(/;filename=[^;]*/, '');
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(
          '<!DOCTYPE html><html><head><title>' + escapeHtml(doc.name) +
          '</title><style>body{margin:0;overflow:hidden}embed{width:100%;height:100vh}</style></head>' +
          '<body><embed src="' + cleanUri + '" type="application/pdf" /></body></html>'
        );
        w.document.close();
      }
      return;
    }
    setViewingDoc(doc);
  };

  const handlePrintProposal = (doc: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(doc.name)}</title><style>body{margin:0}iframe{width:100%;height:100vh;border:none}</style></head><body><iframe src="${escapeHtml(doc.fileData || '')}"></iframe></body></html>`);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  const prospect = selectedProspect ? prospects.find((p) => p.id === selectedProspect) : null;

  const handleScheduleNewAppt = ({ date, time, message }: { date: string; time: string; message: string }) => {
    if (!prospect) return;
    const newAppt = addAppointment({
      name: prospect.name,
      email: prospect.email || '',
      phone: prospect.phone || '',
      date,
      time,
      service: prospect.service || '',
      message: message || 'Pipeline prospect appointment',
      status: 'pending',
    });
    if (newAppt?.id) {
      updateProspect(prospect.id, { appointmentId: newAppt.id });
      setShowScheduler(false);
      setShowNewAppt(false);
      setToastMsg('Appointment scheduled!');
      setTimeout(() => setToastMsg(''), 2000);
    }
  };

  return (
    <div className="pipeline-tab">
      {toastMsg && <div className="convert-toast">{toastMsg}</div>}

      {/* Stats Row */}
      <div className="pipeline-stats">
        <div className="pipeline-stat">
          <span className="stat-value">{stats.active}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="pipeline-stat won">
          <span className="stat-value">{stats.won}</span>
          <span className="stat-label">Won</span>
        </div>
        <div className="pipeline-stat lost">
          <span className="stat-value">{stats.lost}</span>
          <span className="stat-label">Lost</span>
        </div>
        <div className="pipeline-stat deferred">
          <span className="stat-value">{stats.deferred}</span>
          <span className="stat-label">Deferred</span>
        </div>
        <div className="pipeline-stat">
          <span className="stat-value">{stats.avgDealTime}d</span>
          <span className="stat-label">Avg Time</span>
        </div>
      </div>

      {/* Upcoming Revisits Alert */}
      {stats.upcomingRevisits.length > 0 && (
        <div className="pipeline-alert">
          <AlertCircle size={16} />
          <span>{stats.upcomingRevisits.length} prospect{stats.upcomingRevisits.length > 1 ? 's' : ''} due for revisit</span>
          <button className="btn btn-sm btn-outline" onClick={() => setShowPastProspects(true)}>View</button>
        </div>
      )}

      {/* Controls */}
      <div className="pipeline-controls">
        <div className="pipeline-filters">
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="filter-select">
            <option value="all">All Stages</option>
            {PROSPECT_STAGES.filter((s) => s.value !== 'closed').map((s) => (
              <option key={s.value} value={s.value}>{s.label} ({stats.stageCounts[s.value] || 0})</option>
            ))}
          </select>
          <div className="search-input-wrapper">
            <Search size={16} />
            <input type="text" placeholder="Search prospects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}><Plus size={16} /> Add Prospect</button>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="pipeline-modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="pipeline-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Prospect</h3>
              <button className="modal-close" onClick={() => setShowAddForm(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddProspect}>
              <div className="form-row">
                <div className="form-group"><label>Name *</label><input type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required /></div>
                <div className="form-group"><label>Email</label><input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Phone</label><input type="tel" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} /></div>
                <div className="form-group"><label>Service</label>
                  <select value={addForm.service} onChange={(e) => setAddForm({ ...addForm, service: e.target.value })}>
                    <option value="">Select service...</option>
                    <option value="web-design">Web Design</option>
                    <option value="branding">Branding</option>
                    <option value="marketing">Marketing</option>
                    <option value="app-dev">App Development</option>
                    <option value="consulting">Consulting</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Deal Value ($)</label><input type="number" value={addForm.dealValue} onChange={(e) => setAddForm({ ...addForm, dealValue: e.target.value })} placeholder="0" /></div>
                <div className="form-group"><label>Expected Close</label><input type="date" value={addForm.expectedCloseDate} onChange={(e) => setAddForm({ ...addForm, expectedCloseDate: e.target.value })} /></div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Prospect</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content: List + Detail */}
      <div className="pipeline-content">
        <div className="pipeline-list">
          {filteredProspects.length === 0 ? (
            <div className="empty-state-sm"><p>No prospects found</p></div>
          ) : (
            filteredProspects.map((p) => (
              <div key={p.id} className={`pipeline-card ${selectedProspect === p.id ? 'selected' : ''}`} onClick={() => { setSelectedProspect(p.id); setShowScheduler(false); setShowNewAppt(false); setShowApptNotes(false); setCancelApptConfirm(false); }}>
                <div className="pipeline-card-header">
                  <strong>{p.name}</strong>
                  <span className="pipeline-stage-badge" style={{ background: PROSPECT_STAGES.find((s) => s.value === p.stage)?.color }}>{PROSPECT_STAGES.find((s) => s.value === p.stage)?.label}</span>
                </div>
                <div className="pipeline-card-meta">
                  {p.email && <span><Mail size={12} /> {p.email}</span>}
                  {p.service && <span><Briefcase size={12} /> {p.service.replace('-', ' ')}</span>}
                </div>
                <div className="pipeline-card-footer">
                  {p.dealValue > 0 && <span className="deal-value">${parseFloat(p.dealValue).toLocaleString()}</span>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        {prospect && (
          <div className="pipeline-detail">
            <div className="detail-header">
              <h3>{prospect.name}</h3>
              <button className="detail-close" onClick={() => setSelectedProspect(null)} aria-label="Close"><X size={20} /></button>
            </div>

            <div className="detail-section">
              <label>Stage</label>
              <select value={prospect.stage} onChange={(e) => updateProspect(prospect.id, { stage: e.target.value })} className="stage-select">
                {PROSPECT_STAGES.filter((s) => s.value !== 'closed').map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="detail-info">
              {prospect.email && <p><Mail size={14} /> {prospect.email}</p>}
              {prospect.phone && <p><Phone size={14} /> {prospect.phone}</p>}
              {prospect.service && <p><Briefcase size={14} /> {prospect.service.replace('-', ' ')}</p>}
            </div>

            <div className="detail-section">
              <label>Deal Info</label>
              <div className="deal-info-grid">
                <div className="deal-field">
                  <span>Value</span>
                  <input type="number" value={prospect.dealValue || ''} onChange={(e) => updateProspect(prospect.id, { dealValue: parseFloat(e.target.value) || 0 })} placeholder="$0" />
                </div>
                <div className="deal-field">
                  <span>Expected Close</span>
                  <input type="date" value={prospect.expectedCloseDate || ''} onChange={(e) => updateProspect(prospect.id, { expectedCloseDate: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Appointment Section */}
            <div className="detail-section">
              <label><CalendarDays size={14} /> Appointment</label>
              {(() => {
                const linkedAppt = prospect.appointmentId
                  ? appointments.find((a) => a.id === prospect.appointmentId)
                  : null;
                if (linkedAppt) {
                  const isCancelled = linkedAppt.status === 'cancelled';
                  const closeAllApptPanels = (except: string) => {
                    if (except !== 'scheduler') setShowScheduler(false);
                    if (except !== 'newAppt') setShowNewAppt(false);
                    if (except !== 'notes') setShowApptNotes(false);
                    setCancelApptConfirm(false);
                  };
                  return (
                    <div className="appt-linked-info">
                      <p><CalendarDays size={13} /> {linkedAppt.date} at {linkedAppt.time} <span className={`badge badge-${linkedAppt.status === 'confirmed' ? 'success' : isCancelled ? 'danger' : 'warning'}`}>{linkedAppt.status}</span></p>
                      {linkedAppt.message && <p className="appt-linked-message">{linkedAppt.message}</p>}
                      <div className="appt-linked-actions">
                        {!isCancelled && (
                          <button className="btn btn-xs btn-outline" onClick={() => { closeAllApptPanels('scheduler'); setShowScheduler(!showScheduler); }}>
                            {showScheduler ? 'Cancel' : 'Reschedule'}
                          </button>
                        )}
                        <button className="btn btn-xs btn-outline" onClick={() => { closeAllApptPanels('newAppt'); setShowNewAppt(!showNewAppt); }}>
                          {showNewAppt ? <><X size={12} /> Cancel</> : <><Plus size={12} /> New Appointment</>}
                        </button>
                        <button className="btn btn-xs btn-outline" onClick={() => { closeAllApptPanels('notes'); setShowApptNotes(!showApptNotes); }}>
                          <MessageSquare size={12} /> Notes
                        </button>
                        {!isCancelled && (
                          cancelApptConfirm ? (
                            <span className="appt-cancel-confirm">
                              Cancel appointment?
                              <button className="btn btn-xs btn-danger" onClick={() => { updateAppointmentStatus(linkedAppt.id, 'cancelled'); setCancelApptConfirm(false); setToastMsg('Appointment cancelled'); setTimeout(() => setToastMsg(''), 2000); }}>Yes</button>
                              <button className="btn btn-xs btn-outline" onClick={() => setCancelApptConfirm(false)}>No</button>
                            </span>
                          ) : (
                            <button className="btn btn-xs btn-danger-outline" onClick={() => { closeAllApptPanels(''); setCancelApptConfirm(true); }}>
                              <Ban size={12} /> Cancel Appt
                            </button>
                          )
                        )}
                      </div>
                      {showScheduler && (
                        <AppointmentScheduler
                          existingDate={linkedAppt.date}
                          existingTime={linkedAppt.time}
                          existingApptId={linkedAppt.id}
                          linkedName={prospect.name}
                          linkedEmail={prospect.email}
                          linkedPhone={prospect.phone}
                          linkedService={prospect.service}
                          onSchedule={({ date, time }) => {
                            updateAppointment(linkedAppt.id, { date, time });
                            setShowScheduler(false);
                            setToastMsg('Appointment rescheduled!');
                            setTimeout(() => setToastMsg(''), 2000);
                          }}
                        />
                      )}
                      {showNewAppt && (
                        <AppointmentScheduler
                          linkedName={prospect.name}
                          linkedEmail={prospect.email}
                          linkedPhone={prospect.phone}
                          linkedService={prospect.service}
                          onSchedule={handleScheduleNewAppt}
                        />
                      )}
                      {showApptNotes && (
                        <div className="appt-notes-panel">
                          <div className="appt-notes-list">
                            {(prospect.notes || []).filter((n) => n.text.startsWith(APPT_NOTE_PREFIX)).length > 0 ? (
                              (prospect.notes || []).filter((n) => n.text.startsWith(APPT_NOTE_PREFIX)).map((n) => (
                                <div key={n.id} className="appt-note-item">
                                  <p>{n.text.replace(`${APPT_NOTE_PREFIX} `, '')}</p>
                                  <span className="appt-note-meta">{n.author} &middot; {new Date(n.createdAt).toLocaleDateString()}</span>
                                </div>
                              ))
                            ) : (
                              <p className="appt-hint">No appointment notes yet</p>
                            )}
                          </div>
                          <div className="appt-notes-input">
                            <input
                              type="text"
                              placeholder="Add appointment note..."
                              value={apptNote}
                              onChange={(e) => setApptNote(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && apptNote.trim()) {
                                  addProspectNote(prospect.id, `${APPT_NOTE_PREFIX} ${apptNote.trim()}`);
                                  setApptNote('');
                                }
                              }}
                            />
                            <button
                              className="btn btn-xs btn-primary"
                              disabled={!apptNote.trim()}
                              onClick={() => { addProspectNote(prospect.id, `${APPT_NOTE_PREFIX} ${apptNote.trim()}`); setApptNote(''); }}
                            >
                              <Plus size={12} /> Add
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <>
                    <button className="btn btn-sm btn-outline" onClick={() => setShowScheduler(!showScheduler)}>
                      {showScheduler ? <><X size={14} /> Cancel</> : <><CalendarDays size={14} /> Schedule Appointment</>}
                    </button>
                    {showScheduler && (
                      <AppointmentScheduler
                        linkedName={prospect.name}
                        linkedEmail={prospect.email}
                        linkedPhone={prospect.phone}
                        linkedService={prospect.service}
                        onSchedule={handleScheduleNewAppt}
                      />
                    )}
                  </>
                );
              })()}
            </div>

            {/* Proposal Section */}
            <div className="detail-section">
              <label>Proposal</label>
              {(() => {
                const proposalDoc = (prospect.documents || []).find(d => d.type === 'proposal');
                if (!proposalDoc) {
                  return (
                    <button className="btn btn-sm btn-primary" onClick={handleOpenProposalBuilder}>
                      <FileText size={14} /> Generate Proposal
                    </button>
                  );
                }
                return (
                  <div className="proposal-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => openDocPreview(proposalDoc)}>
                      <Eye size={14} /> View
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={() => handlePrintProposal(proposalDoc)}>
                      <Printer size={14} /> Print
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={handleOpenProposalBuilder}>
                      Regenerate
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Notes Section */}
            <div className="detail-section">
              <label>Activity Notes ({prospect.notes?.length || 0})</label>
              <div className="notes-list">
                {prospect.notes?.map((n) => (
                  <div key={n.id} className="note-item">
                    <p>{n.text}</p>
                    <div className="note-meta">
                      <span>{n.author} · {new Date(n.createdAt).toLocaleDateString()}</span>
                      {deleteNoteConfirm === n.id ? (
                        <div className="delete-confirm-inline">
                          <span>Delete?</span>
                          <button className="btn btn-xs btn-delete" onClick={() => { deleteProspectNote(prospect.id, n.id); setDeleteNoteConfirm(null); }}>Yes</button>
                          <button className="btn btn-xs btn-outline" onClick={() => setDeleteNoteConfirm(null)}>No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteNoteConfirm(n.id)}><Trash2 size={12} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="add-note-row">
                <input type="text" placeholder="Add a note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddNote(prospect.id)} />
                <button className="btn btn-sm btn-primary" onClick={() => handleAddNote(prospect.id)}><Plus size={14} /></button>
              </div>
            </div>

            {/* Documents Section */}
            <div className="detail-section">
              <div className="section-header-row">
                <label>Documents ({(prospect.documents || []).length})</label>
                <button className="btn btn-xs btn-outline" onClick={() => setShowDocForm(!showDocForm)}>
                  {showDocForm ? <X size={12} /> : <Plus size={12} />}
                </button>
              </div>

              {showDocForm && (
                <div className="prospect-doc-form">
                  {docError && <div className="form-error">{docError}</div>}
                  <input
                    type="text"
                    placeholder="Document name *"
                    value={docForm.name}
                    onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                  />
                  <select value={docForm.type} onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}>
                    {Object.entries(DOCUMENT_TYPES).map(([key, val]) => (
                      <option key={key} value={key}>{(val as any).label}</option>
                    ))}
                  </select>
                  <input
                    type="file"
                    onChange={(e) => setDocFile(e.target.files[0])}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                  />
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={uploadingDoc}
                    onClick={() => {
                      setDocError('');
                      if (!docFile) { setDocError('Select a file'); return; }
                      if (!docForm.name.trim()) { setDocError('Enter a name'); return; }
                      if (docFile.size > 5 * 1024 * 1024) { setDocError('Max 5MB'); return; }
                      setUploadingDoc(true);
                      const reader = new FileReader();
                      reader.onload = () => {
                        addProspectDocument(prospect.id, {
                          name: docForm.name.trim(),
                          type: docForm.type,
                          description: '',
                          fileData: reader.result,
                          fileType: docFile.type,
                          fileSize: docFile.size,
                        });
                        setDocForm({ name: '', type: 'contract', description: '' });
                        setDocFile(null);
                        setShowDocForm(false);
                        setUploadingDoc(false);
                      };
                      reader.onerror = () => { setDocError('Upload failed'); setUploadingDoc(false); };
                      reader.readAsDataURL(docFile);
                    }}
                  >
                    {uploadingDoc ? 'Uploading...' : <><Upload size={12} /> Upload</>}
                  </button>
                </div>
              )}

              {(prospect.documents || []).length > 0 ? (
                <div className="prospect-docs-list">
                  {(prospect.documents || []).map((doc) => (
                    <div key={doc.id} className="prospect-doc-item">
                      <div className="prospect-doc-icon" style={{ background: DOCUMENT_TYPES[doc.type]?.color || '#6b7280' }}>
                        <FileText size={14} />
                      </div>
                      <div className="prospect-doc-info">
                        <span className="prospect-doc-name">{doc.name}</span>
                        <span className="prospect-doc-meta">
                          {DOCUMENT_TYPES[doc.type]?.label} · {(doc.fileSize / 1024).toFixed(0)} KB
                        </span>
                      </div>
                      <div className="prospect-doc-actions">
                        <button onClick={() => openDocPreview(doc)} title="Preview"><Eye size={12} /></button>
                        <button onClick={() => {
                          const link = document.createElement('a');
                          link.href = doc.fileData;
                          link.download = doc.name;
                          link.click();
                        }} title="Download"><Download size={12} /></button>
                        {deleteDocConfirm === doc.id ? (
                          <div className="delete-confirm-inline">
                            <span>Delete?</span>
                            <button className="btn btn-xs btn-delete" onClick={() => { deleteProspectDocument(prospect.id, doc.id); setDeleteDocConfirm(null); }}>Yes</button>
                            <button className="btn btn-xs btn-outline" onClick={() => setDeleteDocConfirm(null)}>No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteDocConfirm(doc.id)} title="Delete"><Trash2 size={12} /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : !showDocForm && (
                <p className="text-muted small">No documents yet</p>
              )}
            </div>

            {/* Document Preview Modal */}
            {viewingDoc && (
              <div className="modal-overlay" onClick={() => setViewingDoc(null)}>
                <div className="modal-content document-preview-modal" onClick={(e) => e.stopPropagation()}>
                  <button className="modal-close" onClick={() => setViewingDoc(null)} aria-label="Close"><X size={20} /></button>
                  <h3>{viewingDoc.name}</h3>
                  <div className="document-preview-content">
                    {viewingDoc.fileType?.startsWith('image/') ? (
                      <img src={viewingDoc.fileData} alt={viewingDoc.name} />
                    ) : viewingDoc.fileType === 'application/pdf' ? (
                      <iframe src={viewingDoc.fileData} title={viewingDoc.name} />
                    ) : (
                      <div className="document-no-preview">
                        <FileText size={48} />
                        <p>Preview not available</p>
                        <button className="btn btn-primary" onClick={() => {
                          const link = document.createElement('a');
                          link.href = viewingDoc.fileData;
                          link.download = viewingDoc.name;
                          link.click();
                        }}>
                          <Download size={16} /> Download
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Proposal Builder Modal */}
            {showProposalBuilder && (
              <div className="proposal-builder-overlay" onClick={() => setShowProposalBuilder(false)}>
                <div className="proposal-builder-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Build Proposal for {prospect.name}</h3>
                    <button className="modal-close" onClick={() => setShowProposalBuilder(false)} aria-label="Close"><X size={20} /></button>
                  </div>
                  <div className="proposal-builder-body">
                    <div className="proposal-builder-col">
                      <h4>Services</h4>
                      <div className="proposal-service-list">
                        {PROPOSAL_SERVICES.map((svc) => (
                          <label key={svc.id} className={`proposal-service-item${proposalForm.services.includes(svc.id) ? ' checked' : ''}`}>
                            <input
                              type="checkbox"
                              checked={proposalForm.services.includes(svc.id)}
                              onChange={() => toggleProposalService(svc.id)}
                            />
                            {svc.label}
                          </label>
                        ))}
                      </div>
                      <h4>Additional Notes</h4>
                      <textarea
                        rows={4}
                        placeholder="Special terms, scope details, or additional info..."
                        value={proposalForm.notes}
                        onChange={(e) => setProposalForm({ ...proposalForm, notes: e.target.value })}
                      />
                    </div>
                    <div className="proposal-builder-col">
                      <h4>Pricing</h4>
                      <div className="form-group">
                        <label>Quote Amount ($)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 2500"
                          value={proposalForm.customPrice}
                          onChange={(e) => setProposalForm({ ...proposalForm, customPrice: e.target.value })}
                        />
                      </div>
                      <div className="proposal-discount-row">
                        <label className="proposal-service-item">
                          <input
                            type="checkbox"
                            checked={!!proposalForm.discount}
                            onChange={(e) => setProposalForm({ ...proposalForm, discount: e.target.checked ? proposalForm.discount || '10' : '' })}
                          />
                          Apply Discount
                        </label>
                        {proposalForm.discount !== '' && (
                          <>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={proposalForm.discount}
                              onChange={(e) => setProposalForm({ ...proposalForm, discount: e.target.value })}
                              style={{ width: 80 }}
                            />
                            <select
                              value={proposalForm.discountType}
                              onChange={(e) => setProposalForm({ ...proposalForm, discountType: e.target.value })}
                              style={{ width: 80 }}
                            >
                              <option value="percent">%</option>
                              <option value="flat">$ flat</option>
                            </select>
                          </>
                        )}
                      </div>
                      <h4>Timeline</h4>
                      <div className="form-group">
                        <input
                          type="text"
                          placeholder="e.g. 8 weeks, 3 months"
                          value={proposalForm.timeline}
                          onChange={(e) => setProposalForm({ ...proposalForm, timeline: e.target.value })}
                        />
                      </div>
                      <h4>Payment Terms</h4>
                      <div className="form-group">
                        <select
                          value={proposalForm.paymentTerms}
                          onChange={(e) => setProposalForm({ ...proposalForm, paymentTerms: e.target.value })}
                        >
                          <option value="net15">Net 15</option>
                          <option value="net30">Net 30</option>
                          <option value="net45">Net 45</option>
                          <option value="due-on-receipt">Due on Receipt</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-outline" onClick={() => setShowProposalBuilder(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleGenerateProposal} disabled={generatingProposal}>
                      {generatingProposal ? 'Generating...' : <><FileText size={14} /> Generate PDF</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="detail-actions">
              <button className="btn btn-success" onClick={() => setShowCloseForm(prospect.id)}><CheckCircle size={16} /> Close Deal</button>
              {deleteConfirm === prospect.id ? (
                <div className="delete-confirm-inline">
                  <span>Delete?</span>
                  <button className="btn btn-sm btn-danger" onClick={() => { deleteProspect(prospect.id); setSelectedProspect(null); setDeleteConfirm(null); }}>Yes</button>
                  <button className="btn btn-sm btn-outline" onClick={() => setDeleteConfirm(null)}>No</button>
                </div>
              ) : (
                <button className="btn btn-danger-outline" onClick={() => setDeleteConfirm(prospect.id)}><Trash2 size={16} /> Delete</button>
              )}
            </div>

            {/* Close Deal Form */}
            {showCloseForm === prospect.id && (
              <div className="close-deal-form">
                <h4>Close Deal</h4>
                <div className="form-group">
                  <label>Outcome</label>
                  <div className="outcome-options">
                    <label className={`outcome-option ${closeForm.outcome === 'won' ? 'selected won' : ''}`}>
                      <input type="radio" name="outcome" value="won" checked={closeForm.outcome === 'won'} onChange={() => setCloseForm({ ...closeForm, outcome: 'won' })} />
                      <CheckCircle size={16} /> Won
                    </label>
                    <label className={`outcome-option ${closeForm.outcome === 'lost' ? 'selected lost' : ''}`}>
                      <input type="radio" name="outcome" value="lost" checked={closeForm.outcome === 'lost'} onChange={() => setCloseForm({ ...closeForm, outcome: 'lost' })} />
                      <XCircle size={16} /> Lost
                    </label>
                    <label className={`outcome-option ${closeForm.outcome === 'deferred' ? 'selected deferred' : ''}`}>
                      <input type="radio" name="outcome" value="deferred" checked={closeForm.outcome === 'deferred'} onChange={() => setCloseForm({ ...closeForm, outcome: 'deferred' })} />
                      <Clock size={16} /> Deferred
                    </label>
                  </div>
                </div>
                {closeForm.outcome === 'lost' && (
                  <div className="form-group">
                    <label>Loss Reason</label>
                    <select value={closeForm.lossReason} onChange={(e) => setCloseForm({ ...closeForm, lossReason: e.target.value })}>
                      <option value="">Select reason...</option>
                      {LOSS_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                )}
                {closeForm.outcome === 'deferred' && (
                  <div className="form-group">
                    <label>Revisit Date</label>
                    <input type="date" value={closeForm.revisitDate} onChange={(e) => setCloseForm({ ...closeForm, revisitDate: e.target.value })} />
                  </div>
                )}
                <div className="form-actions">
                  <button className="btn btn-outline" onClick={() => setShowCloseForm(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => handleClose(prospect.id)}>Confirm</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Past Prospects Section */}
      <div className="past-prospects-section">
        <button className="past-prospects-toggle" onClick={() => setShowPastProspects(!showPastProspects)}>
          <FolderKanban size={16} />
          Past Prospects ({closedProspects.length})
          {showPastProspects ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showPastProspects && (
          <div className="past-prospects-list">
            {closedProspects.length === 0 ? (
              <p className="empty-text">No closed prospects yet</p>
            ) : (
              closedProspects.map((p) => (
                <div key={p.id} className={`past-prospect-card outcome-${p.outcome}`}>
                  <div className="past-card-main">
                    <strong>{p.name}</strong>
                    <span className={`outcome-badge ${p.outcome}`}>
                      {p.outcome === 'won' && <CheckCircle size={12} />}
                      {p.outcome === 'lost' && <XCircle size={12} />}
                      {p.outcome === 'deferred' && <Clock size={12} />}
                      {p.outcome}
                    </span>
                  </div>
                  <div className="past-card-meta">
                    {p.email && <span>{p.email}</span>}
                    {p.dealValue > 0 && <span>${parseFloat(p.dealValue).toLocaleString()}</span>}
                    {p.outcome === 'lost' && p.lossReason && <span>Reason: {LOSS_REASONS.find((r) => r.value === p.lossReason)?.label || p.lossReason}</span>}
                    {p.outcome === 'deferred' && p.revisitDate && <span>Revisit: {p.revisitDate}</span>}
                    <span>Closed: {new Date(p.closedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="past-card-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => reopenProspect(p.id)}><ArrowRight size={14} /> Reopen</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
