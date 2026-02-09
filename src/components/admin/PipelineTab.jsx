import { useState, useMemo } from 'react';
import {
  AlertCircle, CheckCircle, XCircle, Clock, Mail, Phone, Briefcase,
  Plus, X, Trash2, Search, FolderKanban, ChevronUp, ChevronDown,
  ArrowRight, FileText, Eye, Download, Upload,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function PipelineTab() {
  const {
    prospects, addProspect, updateProspect, deleteProspect,
    addProspectNote, deleteProspectNote, closeProspect, reopenProspect,
    convertProspectToClient, PROSPECT_STAGES, LOSS_REASONS,
    addProspectDocument, deleteProspectDocument, DOCUMENT_TYPES,
  } = useAppContext();

  const [stageFilter, setStageFilter] = useState('all');
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(null);
  const [showPastProspects, setShowPastProspects] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({ name: '', type: 'contract', description: '' });
  const [docFile, setDocFile] = useState(null);
  const [docError, setDocError] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  const [addForm, setAddForm] = useState({
    name: '', email: '', phone: '', service: '', dealValue: '', probability: 25, expectedCloseDate: '',
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
    const conversionRate = (won + lost) > 0 ? ((won / (won + lost)) * 100).toFixed(1) : 0;
    const pipelineValue = active_.reduce((sum, p) => sum + (parseFloat(p.dealValue) || 0), 0);
    const weightedValue = active_.reduce((sum, p) => sum + ((parseFloat(p.dealValue) || 0) * (p.probability / 100)), 0);

    // Average deal time (for won deals)
    const wonDeals = closed_.filter((p) => p.outcome === 'won' && p.closedAt);
    const avgDealTime = wonDeals.length > 0
      ? Math.round(wonDeals.reduce((sum, p) => sum + ((new Date(p.closedAt) - new Date(p.createdAt)) / (1000 * 60 * 60 * 24)), 0) / wonDeals.length)
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

    return { total, active, won, lost, deferred, conversionRate, pipelineValue, weightedValue, avgDealTime, lossReasons, upcomingRevisits, stageCounts };
  }, [prospects, PROSPECT_STAGES]);

  const handleAddProspect = (e) => {
    e.preventDefault();
    const result = addProspect({ ...addForm, dealValue: parseFloat(addForm.dealValue) || 0 });
    if (result.success) {
      setAddForm({ name: '', email: '', phone: '', service: '', dealValue: '', probability: 25, expectedCloseDate: '' });
      setShowAddForm(false);
      setToastMsg('Prospect added successfully');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handleClose = (prospectId) => {
    closeProspect(prospectId, closeForm.outcome, {
      lossReason: closeForm.lossReason,
      revisitDate: closeForm.revisitDate,
    });
    if (closeForm.outcome === 'won') {
      const result = convertProspectToClient(prospectId);
      setToastMsg(result.success ? 'Deal won! Client created.' : result.message || 'Deal marked as won');
    } else if (closeForm.outcome === 'lost') {
      setToastMsg('Deal marked as lost');
    } else {
      setToastMsg('Deal deferred for follow-up');
    }
    setShowCloseForm(null);
    setSelectedProspect(null); // Clear selection to update UI
    setCloseForm({ outcome: 'won', lossReason: '', revisitDate: '' });
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleAddNote = (prospectId) => {
    if (!newNote.trim()) return;
    addProspectNote(prospectId, newNote);
    setNewNote('');
  };

  const prospect = selectedProspect ? prospects.find((p) => p.id === selectedProspect) : null;

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
          <span className="stat-value">{stats.conversionRate}%</span>
          <span className="stat-label">Win Rate</span>
        </div>
        <div className="pipeline-stat">
          <span className="stat-value">${stats.pipelineValue.toLocaleString()}</span>
          <span className="stat-label">Pipeline Value</span>
        </div>
        <div className="pipeline-stat">
          <span className="stat-value">${Math.round(stats.weightedValue).toLocaleString()}</span>
          <span className="stat-label">Weighted</span>
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
                <div className="form-group"><label>Probability (%)</label>
                  <select value={addForm.probability} onChange={(e) => setAddForm({ ...addForm, probability: parseInt(e.target.value) })}>
                    <option value={10}>10%</option>
                    <option value={25}>25%</option>
                    <option value={50}>50%</option>
                    <option value={75}>75%</option>
                    <option value={90}>90%</option>
                  </select>
                </div>
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
              <div key={p.id} className={`pipeline-card ${selectedProspect === p.id ? 'selected' : ''}`} onClick={() => setSelectedProspect(p.id)}>
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
                  <span className="probability">{p.probability}%</span>
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
                  <span>Probability</span>
                  <select value={prospect.probability} onChange={(e) => updateProspect(prospect.id, { probability: parseInt(e.target.value) })}>
                    <option value={10}>10%</option><option value={25}>25%</option><option value={50}>50%</option><option value={75}>75%</option><option value={90}>90%</option>
                  </select>
                </div>
                <div className="deal-field">
                  <span>Expected Close</span>
                  <input type="date" value={prospect.expectedCloseDate || ''} onChange={(e) => updateProspect(prospect.id, { expectedCloseDate: e.target.value })} />
                </div>
              </div>
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
                      <button onClick={() => deleteProspectNote(prospect.id, n.id)}><Trash2 size={12} /></button>
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
                      <option key={key} value={key}>{val.label}</option>
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
                        <button onClick={() => setViewingDoc(doc)} title="Preview"><Eye size={12} /></button>
                        <button onClick={() => {
                          const link = document.createElement('a');
                          link.href = doc.fileData;
                          link.download = doc.name;
                          link.click();
                        }} title="Download"><Download size={12} /></button>
                        <button onClick={() => deleteProspectDocument(prospect.id, doc.id)} title="Delete"><Trash2 size={12} /></button>
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
