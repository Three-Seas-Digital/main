import { useState, useMemo } from 'react';
import {
  CalendarDays, Clock, AlertCircle,
  PhoneForwarded, UserCheck, MessageSquare, Plus, CheckCircle,
  Mail, Phone, Trash2, ChevronUp, ChevronDown, Briefcase, FolderKanban,
  BarChart3, Users, Calendar as CalendarIcon, X,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import Calendar from '../Calendar';
import AppointmentScheduler from './AppointmentScheduler';
import { FollowUpBadge, formatDisplayDate } from './adminUtils';

export default function FollowUpsTab() {
  const { appointments, addAppointment, markFollowUp, updateFollowUp, addFollowUpNote, deleteFollowUpNote, addProspect, updateAppointment, hasPermission, deleteAppointment, users, assignAppointment, STAFF_COLORS, addNotification, saveToBusinessDb } = useAppContext();
  const canManage = hasPermission('manage_appointments');
  const canDelete = hasPermission('delete_clients') || hasPermission('manage_appointments');
  const [showFormFor, setShowFormFor] = useState(null);
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState('normal');
  const [followUpDate, setFollowUpDate] = useState('');
  const [filterFU, setFilterFU] = useState('all');
  const [convertMsg, setConvertMsg] = useState('');
  const [additionalNote, setAdditionalNote] = useState({});
  const [expandedNotes, setExpandedNotes] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [draggedAppt, setDraggedAppt] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [rescheduleApptId, setRescheduleApptId] = useState(null);
  const [newApptId, setNewApptId] = useState(null);
  const [apptNotesId, setApptNotesId] = useState(null);
  const [fuApptNotes, setFuApptNotes] = useState({});

  // Show confirmed appointments that need follow-up, plus ALL appointments that have follow-ups
  const confirmedAppts = useMemo(() => appointments.filter((a) => a.status === 'confirmed'), [appointments]);
  const needsFollowUp = useMemo(() => confirmedAppts.filter((a) => !a.followUp && !a.sentToPipeline && !a.parentFollowUpId), [confirmedAppts]);
  const withFollowUp = useMemo(() => appointments.filter((a) => a.followUp && !a.sentToPipeline), [appointments]);
  const filteredFollowUps = useMemo(() => filterFU === 'all'
    ? withFollowUp.filter((a) => a.followUp.status !== 'archived')
    : withFollowUp.filter((a) => a.followUp.status === filterFU), [withFollowUp, filterFU]);

  // Staff members for kanban
  const staffMembers = useMemo(() => users.filter((u) => u.status === 'approved' && u.role !== 'pending'), [users]);

  // Drag and drop handlers
  const handleDragStart = (e, appt) => {
    setDraggedAppt(appt);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };
  const handleDragLeave = () => setDragOverColumn(null);
  const handleDrop = (e, userId) => {
    e.preventDefault();
    if (draggedAppt && canManage) {
      assignAppointment(draggedAppt.id, userId === 'unassigned' ? null : userId);
    }
    setDraggedAppt(null);
    setDragOverColumn(null);
  };
  const handleDragEnd = () => { setDraggedAppt(null); setDragOverColumn(null); };

  const handleMarkFollowUp = (id) => {
    if (!note.trim()) return;
    markFollowUp(id, { note, priority, followUpDate, status: 'pending' });
    setShowFormFor(null); setNote(''); setPriority('normal'); setFollowUpDate('');
  };

  const handleSendToPipeline = (apptId) => {
    const appt = appointments.find((a) => a.id === apptId);
    if (!appt) return;
    // Collect notes from follow-up and any lead notes that were passed
    const allNotes = [];
    if (appt.leadNotes) {
      allNotes.push(...appt.leadNotes);
    }
    if (appt.followUp?.notes) {
      allNotes.push(...appt.followUp.notes.filter((n) => !allNotes.some((existing) => existing.id === n.id)));
    }
    if (appt.followUp?.note) {
      allNotes.push({ id: `fu-${apptId}`, text: appt.followUp.note, author: 'Follow-Up', createdAt: appt.followUp.createdAt });
    }
    const result = addProspect({
      name: appt.name,
      email: appt.email,
      phone: appt.phone || '',
      service: appt.service || '',
      stage: 'inquiry',
      source: 'appointment',
      appointmentId: apptId,
      notes: allNotes,
    });
    if (result.success) {
      // Auto-populate business database
      saveToBusinessDb({
        name: appt.name,
        address: appt.message || '',
        phone: appt.phone || '',
        type: appt.service || '',
        source: 'follow-up',
        enrichment: {
          pipelineStatus: 'prospect',
          sentToPipelineAt: new Date().toISOString(),
          pointOfContact: appt.name,
          contactEmail: appt.email || '',
          contactPhone: appt.phone || '',
          serviceInterest: appt.service || '',
          notes: allNotes.map((n) => n.text).join(' | '),
        },
      });
      updateAppointment(apptId, { sentToPipeline: true });
      setConvertMsg('Added to pipeline successfully!');
      addNotification({
        type: 'info',
        title: 'Sent to Pipeline',
        message: `${appt.name} added to sales pipeline from follow-up`,
      });
    } else {
      setConvertMsg(result.error || 'Failed to add to pipeline');
    }
    setTimeout(() => setConvertMsg(''), 3000);
  };

  return (
    <div className="followups-tab">
      {convertMsg && <div className="convert-toast">{convertMsg}</div>}

      {/* View Toggle */}
      <div className="fu-view-toggle">
        <button className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}><CalendarIcon size={16} /> Calendar</button>
        <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><BarChart3 size={16} /> List</button>
        <button className={`view-btn ${viewMode === 'staff' ? 'active' : ''}`} onClick={() => setViewMode('staff')}><Users size={16} /> Staff</button>
      </div>

      {viewMode === 'calendar' ? (
        /* Calendar View */
        <div className="fu-calendar-view">
          <div className="fu-calendar-section">
            <Calendar onDateSelect={setSelectedDate} selectedDate={selectedDate} showDots={true} />
            {selectedDate && (
              <button className="btn btn-sm btn-outline" style={{ marginTop: '0.5rem' }} onClick={() => setSelectedDate('')}>
                Clear Date Filter
              </button>
            )}
          </div>
          <div className="fu-calendar-list">
            <h4>
              {selectedDate ? `Follow-Ups for ${formatDisplayDate(selectedDate)}` : 'All Follow-Ups'}
              <span className="fu-calendar-count">
                {(selectedDate
                  ? [...needsFollowUp, ...filteredFollowUps].filter((a) => a.followUp?.followUpDate === selectedDate || a.date === selectedDate)
                  : [...needsFollowUp, ...filteredFollowUps]
                ).length}
              </span>
            </h4>
            <div className="fu-calendar-items">
              {(() => {
                const items = selectedDate
                  ? [...needsFollowUp, ...filteredFollowUps].filter((a) => a.followUp?.followUpDate === selectedDate || a.date === selectedDate)
                  : [...needsFollowUp, ...filteredFollowUps];
                if (items.length === 0) {
                  return <div className="empty-state-sm"><p>{selectedDate ? 'No follow-ups on this date' : 'No follow-ups'}</p></div>;
                }
                return items.map((appt) => (
                  <div key={appt.id} className={`fu-calendar-item ${appt.followUp ? 'has-followup' : 'needs-followup'}`}>
                    <div className="fu-calendar-item-header">
                      <strong>{appt.name}</strong>
                      {appt.followUp ? (
                        <FollowUpBadge followUp={appt.followUp} />
                      ) : (
                        <span className="badge badge-warning">Needs Follow-Up</span>
                      )}
                    </div>
                    <div className="fu-calendar-item-meta">
                      <span><CalendarDays size={12} /> {formatDisplayDate(appt.date)} at {appt.time}</span>
                      {appt.followUp?.followUpDate && <span><PhoneForwarded size={12} /> Due: {formatDisplayDate(appt.followUp.followUpDate)}</span>}
                    </div>
                    {appt.followUp?.note && <p className="fu-calendar-item-note">{appt.followUp.note}</p>}
                    <div className="fu-calendar-item-contact">
                      {appt.email && <span><Mail size={12} /> {appt.email}</span>}
                      {appt.phone && <span><Phone size={12} /> {appt.phone}</span>}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      ) : viewMode === 'staff' ? (
        /* Staff Kanban View - Shows both Needs Follow-Up AND Follow-Up Tracker items */
        <div className="fu-kanban">
          {staffMembers.length === 0 ? (
            <div className="empty-state-sm"><p>No staff members found. Add users in the Users tab first.</p></div>
          ) : (
            <div className="kanban-board">
              {/* Unassigned Column */}
              <div
                className={`kanban-column ${dragOverColumn === 'unassigned' ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, 'unassigned')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'unassigned')}
              >
                <div className="kanban-column-header">
                  <h4>Unassigned</h4>
                  <span className="kanban-count">{[...needsFollowUp, ...filteredFollowUps].filter((a) => !a.assignedTo).length}</span>
                </div>
                <div className="kanban-column-content">
                  {/* Needs Follow-Up items (no followUp yet) */}
                  {needsFollowUp.filter((a) => !a.assignedTo).map((appt) => (
                    <div
                      key={appt.id}
                      className={`kanban-card fu-kanban-card needs-followup ${draggedAppt?.id === appt.id ? 'dragging' : ''}`}
                      draggable={canManage}
                      onDragStart={(e) => handleDragStart(e, appt)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="kanban-card-header">
                        <strong>{appt.name}</strong>
                        <span className="status-badge-sm needs">Needs Follow-Up</span>
                      </div>
                      <div className="kanban-card-meta">
                        <span><CalendarDays size={12} /> {formatDisplayDate(appt.date)}</span>
                        <span><Clock size={12} /> {appt.time}</span>
                      </div>
                      {appt.service && <div className="kanban-card-service">{appt.service.replace('-', ' ')}</div>}
                    </div>
                  ))}
                  {/* Follow-Up Tracker items (has followUp) */}
                  {filteredFollowUps.filter((a) => !a.assignedTo).map((appt) => (
                    <div
                      key={appt.id}
                      className={`kanban-card fu-kanban-card ${draggedAppt?.id === appt.id ? 'dragging' : ''}`}
                      draggable={canManage}
                      onDragStart={(e) => handleDragStart(e, appt)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="kanban-card-header">
                        <strong>{appt.name}</strong>
                        <FollowUpBadge followUp={appt.followUp} />
                      </div>
                      <div className="kanban-card-meta">
                        <span><CalendarDays size={12} /> {formatDisplayDate(appt.date)}</span>
                        <span><Clock size={12} /> {appt.time}</span>
                      </div>
                      {appt.followUp?.priority && appt.followUp.priority !== 'normal' && (
                        <span className={`priority-tag ${appt.followUp.priority}`}>{appt.followUp.priority}</span>
                      )}
                      <p className="kanban-card-note">{appt.followUp?.note?.substring(0, 60)}{appt.followUp?.note?.length > 60 ? '...' : ''}</p>
                    </div>
                  ))}
                  {[...needsFollowUp, ...filteredFollowUps].filter((a) => !a.assignedTo).length === 0 && <p className="kanban-empty">No unassigned items</p>}
                </div>
              </div>

              {/* Staff Columns */}
              {staffMembers.map((staff, index) => {
                const staffNeedsFollowUp = needsFollowUp.filter((a) => a.assignedTo === staff.id);
                const staffFollowUps = filteredFollowUps.filter((a) => a.assignedTo === staff.id);
                const totalCount = staffNeedsFollowUp.length + staffFollowUps.length;
                const staffColor = staff.color || STAFF_COLORS[index % STAFF_COLORS.length];
                return (
                  <div
                    key={staff.id}
                    className={`kanban-column ${dragOverColumn === staff.id ? 'drag-over' : ''}`}
                    onDragOver={(e) => handleDragOver(e, staff.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, staff.id)}
                  >
                    <div className="kanban-column-header" style={{ borderTopColor: staffColor }}>
                      <div className="kanban-staff-info">
                        <span className="staff-avatar" style={{ background: staffColor }}>{staff.name.charAt(0).toUpperCase()}</span>
                        <div>
                          <h4>{staff.name}</h4>
                          <span className="staff-role">{staff.role}</span>
                        </div>
                      </div>
                      <span className="kanban-count">{totalCount}</span>
                    </div>
                    <div className="kanban-column-content">
                      {/* Needs Follow-Up items assigned to this staff */}
                      {staffNeedsFollowUp.map((appt) => (
                        <div
                          key={appt.id}
                          className={`kanban-card fu-kanban-card needs-followup ${draggedAppt?.id === appt.id ? 'dragging' : ''}`}
                          style={{ borderLeftColor: staffColor }}
                          draggable={canManage}
                          onDragStart={(e) => handleDragStart(e, appt)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="kanban-card-header">
                            <strong>{appt.name}</strong>
                            <span className="status-badge-sm needs">Needs Follow-Up</span>
                          </div>
                          <div className="kanban-card-meta">
                            <span><CalendarDays size={12} /> {formatDisplayDate(appt.date)}</span>
                            <span><Clock size={12} /> {appt.time}</span>
                          </div>
                          {appt.service && <div className="kanban-card-service">{appt.service.replace('-', ' ')}</div>}
                        </div>
                      ))}
                      {/* Follow-Up Tracker items assigned to this staff */}
                      {staffFollowUps.map((appt) => (
                        <div
                          key={appt.id}
                          className={`kanban-card fu-kanban-card ${draggedAppt?.id === appt.id ? 'dragging' : ''}`}
                          style={{ borderLeftColor: staffColor }}
                          draggable={canManage}
                          onDragStart={(e) => handleDragStart(e, appt)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="kanban-card-header">
                            <strong>{appt.name}</strong>
                            <FollowUpBadge followUp={appt.followUp} />
                          </div>
                          <div className="kanban-card-meta">
                            <span><CalendarDays size={12} /> {formatDisplayDate(appt.date)}</span>
                            <span><Clock size={12} /> {appt.time}</span>
                          </div>
                          {appt.followUp?.priority && appt.followUp.priority !== 'normal' && (
                            <span className={`priority-tag ${appt.followUp.priority}`}>{appt.followUp.priority}</span>
                          )}
                          <p className="kanban-card-note">{appt.followUp?.note?.substring(0, 60)}{appt.followUp?.note?.length > 60 ? '...' : ''}</p>
                        </div>
                      ))}
                      {totalCount === 0 && <p className="kanban-empty">Drop items here</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <>
      <div className="fu-section">
        <h3 className="fu-section-title"><AlertCircle size={18} /> Needs Follow-Up {needsFollowUp.length > 0 && <span className="count-badge">{needsFollowUp.length}</span>}</h3>
        {needsFollowUp.length === 0 ? (
          <div className="empty-state-sm"><p>All confirmed appointments have been followed up</p></div>
        ) : (
          <div className="fu-list">
            {needsFollowUp.map((appt) => (
              <div key={appt.id} className="fu-card">
                <div className="fu-card-top">
                  <div className="fu-card-info">
                    <strong>{appt.name}</strong>
                    <span>{appt.email}</span>
                    <span className="fu-meta"><CalendarDays size={13} /> {formatDisplayDate(appt.date)} at {appt.time}{appt.service && <> &middot; {appt.service.replace('-', ' ')}</>}</span>
                  </div>
                  {canManage && (
                    <div className="fu-card-actions">
                      <button className="btn btn-sm btn-primary" onClick={() => setShowFormFor(showFormFor === appt.id ? null : appt.id)}>
                        <PhoneForwarded size={14} /> {showFormFor === appt.id ? 'Cancel' : 'Add Follow-Up'}
                      </button>
                      {!appt.sentToPipeline && (
                        <button className="btn btn-sm btn-pipeline" onClick={() => handleSendToPipeline(appt.id)}>
                          <Briefcase size={14} /> Send to Pipeline
                        </button>
                      )}
                      {appt.sentToPipeline && <span className="pipeline-tag"><Briefcase size={12} /> In Pipeline</span>}
                    </div>
                  )}
                </div>
                {showFormFor === appt.id && (
                  <div className="fu-form">
                    <div className="form-row">
                      <div className="form-group"><label>Follow-Up Date</label><input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} /></div>
                      <div className="form-group"><label>Priority</label><select value={priority} onChange={(e) => setPriority(e.target.value)}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
                    </div>
                    <div className="form-group"><label>Notes *</label><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What needs to be followed up on..." rows={3} /></div>
                    <button className="btn btn-sm btn-primary" onClick={() => handleMarkFollowUp(appt.id)} disabled={!note.trim()}><CheckCircle size={14} /> Save Follow-Up</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="fu-section">
        <div className="fu-section-header">
          <h3 className="fu-section-title"><PhoneForwarded size={18} /> Follow-Up Tracker {filteredFollowUps.length > 0 && <span className="count-badge">{filteredFollowUps.length}</span>}</h3>
          <select value={filterFU} onChange={(e) => setFilterFU(e.target.value)} className="filter-select"><option value="all">All Active</option><option value="pending">Pending</option><option value="contacted">Contacted</option><option value="completed">Completed</option><option value="archived">Archived</option></select>
        </div>
        {filteredFollowUps.length === 0 ? (
          <div className="empty-state-sm"><p>No follow-ups to show</p></div>
        ) : (
          <div className="fu-list">
            {filteredFollowUps.map((appt) => {
              const uniqueLeadNotes = appt.leadNotes?.filter((n, i, arr) => arr.findIndex((x) => x.id === n.id) === i) || [];
              const leadNoteIds = new Set(uniqueLeadNotes.map((n) => n.id));
              const uniqueFollowUpNotes = (appt.followUp.notes || []).filter((n) => !leadNoteIds.has(n.id));
              const totalNotes = uniqueLeadNotes.length + uniqueFollowUpNotes.length;

              return (
              <div key={appt.id} className={`fu-card fu-priority-${appt.followUp.priority}${appt.followUp.status === 'archived' ? ' fu-archived' : ''}`}>
                <div className="fu-card-top">
                  <div className="fu-card-info">
                    <div className="fu-name-row">
                      <strong>{appt.name}</strong>
                      <FollowUpBadge followUp={appt.followUp} />
                      {appt.followUp.priority === 'urgent' && <span className="priority-tag urgent">Urgent</span>}
                      {appt.followUp.priority === 'high' && <span className="priority-tag high">High</span>}
                      {appt.convertedToClient && <span className="converted-tag"><UserCheck size={12} /> Client</span>}
                    </div>
                    <span>{appt.email} {appt.phone && `· ${appt.phone}`}</span>
                    <span className="fu-meta">Appointment: {formatDisplayDate(appt.date)} at {appt.time}{appt.followUp.followUpDate && <> &middot; Follow-up by: {formatDisplayDate(appt.followUp.followUpDate)}</>}</span>
                  </div>
                </div>
                <div className="fu-note-display"><MessageSquare size={14} /><p>{appt.followUp.note}</p></div>
                {/* Additional Notes Section */}
                {(appt.leadNotes?.length > 0 || appt.followUp.notes?.length > 0 || canManage) && (
                  <div className="fu-additional-notes">
                    <button className="fu-notes-toggle" onClick={() => setExpandedNotes((prev) => ({ ...prev, [appt.id]: !prev[appt.id] }))}>
                      <MessageSquare size={14} />
                      {totalNotes > 0 ? `${totalNotes} Note${totalNotes > 1 ? 's' : ''}` : 'Add Notes'}
                      {expandedNotes[appt.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {expandedNotes[appt.id] && (
                      <div className="fu-notes-list">
                        {/* Lead Notes (from prospecting) - deduplicated */}
                        {uniqueLeadNotes.length > 0 && (
                          <div className="fu-notes-section">
                            <span className="fu-notes-label">From Lead Prospecting:</span>
                            {uniqueLeadNotes.map((n) => (
                              <div key={n.id} className="fu-note-item lead-note">
                                <div className="fu-note-content">
                                  <p>{n.text}</p>
                                  <span className="fu-note-meta">{n.author} · {new Date(n.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Follow-up Notes (exclude any that are already in leadNotes) */}
                        {uniqueFollowUpNotes.map((n) => (
                          <div key={n.id} className="fu-note-item">
                            <div className="fu-note-content">
                              <p>{n.text}</p>
                              <span className="fu-note-meta">{n.author} · {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            {canManage && (
                              <button className="fu-note-delete" onClick={() => deleteFollowUpNote(appt.id, n.id)} title="Delete note"><Trash2 size={12} /></button>
                            )}
                          </div>
                        ))}
                        {canManage && (
                          <div className="fu-add-note-form">
                            <input
                              type="text"
                              placeholder="Add follow-up comment (call notes, updates, etc.)"
                              value={additionalNote[appt.id] || ''}
                              onChange={(e) => setAdditionalNote((prev) => ({ ...prev, [appt.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && additionalNote[appt.id]?.trim()) {
                                  addFollowUpNote(appt.id, additionalNote[appt.id]);
                                  setAdditionalNote((prev) => ({ ...prev, [appt.id]: '' }));
                                }
                              }}
                            />
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => {
                                if (additionalNote[appt.id]?.trim()) {
                                  addFollowUpNote(appt.id, additionalNote[appt.id]);
                                  setAdditionalNote((prev) => ({ ...prev, [appt.id]: '' }));
                                }
                              }}
                            >
                              <Plus size={14} /> Add
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {canManage && (
                  <div className="fu-actions">
                    {appt.followUp.status === 'pending' && <button className="btn btn-sm btn-outline" onClick={() => updateFollowUp(appt.id, { status: 'contacted' })}><Phone size={14} /> Mark Contacted</button>}
                    {appt.followUp.status === 'contacted' && <button className="btn btn-sm btn-confirm" onClick={() => updateFollowUp(appt.id, { status: 'completed' })}><CheckCircle size={14} /> Mark Completed</button>}
                    <button className="btn btn-sm btn-outline" onClick={() => { setRescheduleApptId(rescheduleApptId === appt.id ? null : appt.id); setNewApptId(null); setApptNotesId(null); }}>
                      <CalendarIcon size={14} /> {rescheduleApptId === appt.id ? 'Cancel' : 'Reschedule'}
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={() => { setNewApptId(newApptId === appt.id ? null : appt.id); setRescheduleApptId(null); setApptNotesId(null); }}>
                      {newApptId === appt.id ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Appt</>}
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={() => { setApptNotesId(apptNotesId === appt.id ? null : appt.id); setRescheduleApptId(null); setNewApptId(null); }}>
                      <MessageSquare size={14} /> Notes
                    </button>
                    {!appt.sentToPipeline && <button className="btn btn-sm btn-pipeline" onClick={() => handleSendToPipeline(appt.id)}><Briefcase size={14} /> Send to Pipeline</button>}
                    {appt.sentToPipeline && <span className="pipeline-tag"><Briefcase size={12} /> In Pipeline</span>}
                    {appt.followUp.status !== 'archived' ? (
                      <button className="btn btn-sm btn-archive" onClick={() => updateFollowUp(appt.id, { status: 'archived' })}><FolderKanban size={14} /> Archive</button>
                    ) : (
                      <button className="btn btn-sm btn-outline" onClick={() => updateFollowUp(appt.id, { status: 'completed' })}><FolderKanban size={14} /> Unarchive</button>
                    )}
                    {canDelete && (
                      deleteConfirm === appt.id ? (
                        <div className="fu-delete-confirm">
                          <span>Delete this follow-up?</span>
                          <button className="btn btn-sm btn-danger" onClick={() => { deleteAppointment(appt.id); setDeleteConfirm(null); }}><Trash2 size={14} /> Yes, Delete</button>
                          <button className="btn btn-sm btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button className="btn btn-sm btn-danger-outline" onClick={() => setDeleteConfirm(appt.id)}><Trash2 size={14} /> Delete</button>
                      )
                    )}
                  </div>
                )}
                {rescheduleApptId === appt.id && (
                  <AppointmentScheduler
                    existingDate={appt.date}
                    existingTime={appt.time}
                    existingApptId={appt.id}
                    linkedName={appt.name}
                    linkedEmail={appt.email}
                    linkedPhone={appt.phone}
                    linkedService={appt.service}
                    onSchedule={({ date, time }) => {
                      updateAppointment(appt.id, { date, time });
                      setRescheduleApptId(null);
                    }}
                  />
                )}
                {newApptId === appt.id && (
                  <AppointmentScheduler
                    linkedName={appt.name}
                    linkedEmail={appt.email}
                    linkedPhone={appt.phone}
                    linkedService={appt.service}
                    onSchedule={({ date, time, message }) => {
                      const newAppt = addAppointment({
                        name: appt.name,
                        email: appt.email || '',
                        phone: appt.phone || '',
                        date,
                        time,
                        service: appt.service || '',
                        message: message || `Follow-up appointment for ${appt.name}`,
                        status: 'pending',
                        parentFollowUpId: appt.id,
                      });
                      if (newAppt?.id) {
                        const existing = appt.followUp.linkedAppointments || [];
                        updateFollowUp(appt.id, { linkedAppointments: [...existing, newAppt.id] });
                      }
                      setNewApptId(null);
                      setConvertMsg('New appointment added!');
                      setTimeout(() => setConvertMsg(''), 2000);
                    }}
                  />
                )}
                {apptNotesId === appt.id && (
                  <div className="appt-notes-panel">
                    <div className="appt-notes-list">
                      {(appt.followUp.notes || []).length > 0 ? (
                        (appt.followUp.notes || []).map((n) => (
                          <div key={n.id} className="appt-note-item">
                            <p>{n.text}</p>
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
                        value={fuApptNotes[appt.id] || ''}
                        onChange={(e) => setFuApptNotes((prev) => ({ ...prev, [appt.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && fuApptNotes[appt.id]?.trim()) {
                            addFollowUpNote(appt.id, fuApptNotes[appt.id].trim());
                            setFuApptNotes((prev) => ({ ...prev, [appt.id]: '' }));
                          }
                        }}
                      />
                      <button
                        className="btn btn-xs btn-primary"
                        disabled={!fuApptNotes[appt.id]?.trim()}
                        onClick={() => { addFollowUpNote(appt.id, fuApptNotes[appt.id].trim()); setFuApptNotes((prev) => ({ ...prev, [appt.id]: '' })); }}
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                  </div>
                )}
                {/* Linked Appointments */}
                {appt.followUp.linkedAppointments?.length > 0 && (
                  <div className="fu-linked-appts">
                    <span className="fu-linked-label"><CalendarDays size={13} /> Scheduled Appointments ({appt.followUp.linkedAppointments.length})</span>
                    {appt.followUp.linkedAppointments.map((aId) => {
                      const linked = appointments.find((a) => a.id === aId);
                      if (!linked) return null;
                      return (
                        <div key={aId} className={`fu-linked-appt-item ${linked.status === 'cancelled' ? 'cancelled' : ''}`}>
                          <CalendarDays size={12} />
                          <span className="fu-linked-date">{formatDisplayDate(linked.date)} at {linked.time}</span>
                          <span className={`badge badge-${linked.status === 'confirmed' ? 'success' : linked.status === 'cancelled' ? 'danger' : 'warning'}`}>{linked.status}</span>
                          {linked.message && <span className="fu-linked-msg">{linked.message}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}