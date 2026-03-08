import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, Save, Plus, Edit3, Trash2, X, Users,
  ChevronLeft, ChevronRight, CalendarDays, MapPin,
  Briefcase, User, Ban, CheckCircle,
} from 'lucide-react';
import { calendarApi } from '../../api/calendar';
import { useAppContext } from '../../context/AppContext';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EVENT_TYPES = [
  { value: 'meeting', label: 'Meeting', color: '#3ECF8E' },
  { value: 'client-meeting', label: 'Client Meeting', color: '#3B82F6' },
  { value: 'personal', label: 'Personal', color: '#A78BFA' },
  { value: 'blocked', label: 'Blocked', color: '#EF4444' },
];

const HOURS_LIST: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of ['00', '30']) {
    const hr = h.toString().padStart(2, '0');
    HOURS_LIST.push(`${hr}:${m}`);
  }
}

function formatTime12(time24: string): string {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatEventTime(dt: string): string {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

interface BusinessHour {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  event_type: string;
  client_id?: string;
  client_name?: string;
  all_day: boolean;
  location?: string;
}

interface TeamMember {
  user_id: string;
  name: string;
  role: string;
  hours: BusinessHour | null;
  events: CalendarEvent[];
}

// ── Default business hours (Mon-Fri 9-5) ──
function getDefaultHours(): BusinessHour[] {
  return DAY_NAMES.map((_, i) => ({
    day_of_week: i,
    start_time: '09:00',
    end_time: '17:00',
    is_available: i >= 1 && i <= 5, // Mon-Fri
  }));
}

// ══════════════════════════════════════
// ── MY HOURS SUB-TAB ──
// ══════════════════════════════════════
function MyHoursTab() {
  const [hours, setHours] = useState<BusinessHour[]>(getDefaultHours());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calendarApi.getMyHours().then((data: any) => {
      if (Array.isArray(data) && data.length > 0) {
        // Merge with defaults for any missing days
        const merged = getDefaultHours().map(def => {
          const found = data.find((d: any) => d.day_of_week === def.day_of_week);
          return found ? { ...def, ...found } : def;
        });
        setHours(merged);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const updateDay = (dayIndex: number, field: string, value: any) => {
    setHours(prev => prev.map(h =>
      h.day_of_week === dayIndex ? { ...h, [field]: value } : h
    ));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await calendarApi.updateMyHours(hours);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save hours:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="cal-loading">Loading hours...</div>;

  return (
    <div className="cal-hours-section">
      <div className="cal-hours-header">
        <h3><Clock size={18} /> Business Hours</h3>
        <p className="cal-hours-desc">Set your working hours for each day. These will be used to show your availability.</p>
      </div>

      <div className="cal-hours-grid">
        {hours.map(h => (
          <div key={h.day_of_week} className={`cal-hours-row ${!h.is_available ? 'cal-hours-row--off' : ''}`}>
            <div className="cal-hours-day">
              <button
                className={`cal-hours-toggle ${h.is_available ? 'cal-hours-toggle--on' : ''}`}
                onClick={() => updateDay(h.day_of_week, 'is_available', !h.is_available)}
                title={h.is_available ? 'Mark as day off' : 'Mark as working day'}
              >
                {h.is_available ? <CheckCircle size={16} /> : <Ban size={16} />}
              </button>
              <span className="cal-hours-day-name">{DAY_NAMES[h.day_of_week]}</span>
            </div>

            {h.is_available ? (
              <div className="cal-hours-times">
                <select
                  value={h.start_time}
                  onChange={e => updateDay(h.day_of_week, 'start_time', e.target.value)}
                  className="cal-hours-select"
                >
                  {HOURS_LIST.map(t => (
                    <option key={t} value={t}>{formatTime12(t)}</option>
                  ))}
                </select>
                <span className="cal-hours-to">to</span>
                <select
                  value={h.end_time}
                  onChange={e => updateDay(h.day_of_week, 'end_time', e.target.value)}
                  className="cal-hours-select"
                >
                  {HOURS_LIST.map(t => (
                    <option key={t} value={t}>{formatTime12(t)}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="cal-hours-off-label">Day off</div>
            )}
          </div>
        ))}
      </div>

      <div className="cal-hours-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} /> {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Hours'}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// ── MY EVENTS SUB-TAB ──
// ══════════════════════════════════════
function MyEventsTab() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const { clients } = useAppContext();

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const start = `${selectedDate}T00:00:00`;
      const end = `${selectedDate}T23:59:59`;
      const data = await calendarApi.getEvents(start, end);
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await calendarApi.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const openCreate = () => {
    setEditingEvent(null);
    setShowModal(true);
  };

  const openEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditingEvent(null);
    loadEvents();
  };

  const getTypeInfo = (type: string) => EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];

  return (
    <div className="cal-events-section">
      {/* Date navigation */}
      <div className="cal-events-toolbar">
        <div className="cal-date-nav">
          <button className="cal-nav-btn" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
            <ChevronLeft size={18} />
          </button>
          <div className="cal-date-display">
            <CalendarDays size={16} />
            <span>{formatDateDisplay(selectedDate)}</span>
          </div>
          <button className="cal-nav-btn" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="cal-events-actions">
          <button className="cal-nav-btn" onClick={() => setSelectedDate(getToday())}>Today</button>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} /> New Event
          </button>
        </div>
      </div>

      {/* Events list */}
      {loading ? (
        <div className="cal-loading">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="cal-empty">
          <CalendarDays size={40} />
          <p>No events scheduled for this day</p>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} /> Add an event
          </button>
        </div>
      ) : (
        <div className="cal-events-list">
          {events.map(event => {
            const typeInfo = getTypeInfo(event.event_type);
            return (
              <div key={event.id} className="cal-event-card">
                <div className="cal-event-color" style={{ background: typeInfo.color }} />
                <div className="cal-event-info">
                  <div className="cal-event-title">{event.title}</div>
                  <div className="cal-event-meta">
                    <span className="cal-event-time">
                      <Clock size={12} />
                      {event.all_day ? 'All day' : `${formatEventTime(event.start_time)} – ${formatEventTime(event.end_time)}`}
                    </span>
                    <span className="cal-event-type-badge" style={{ borderColor: typeInfo.color, color: typeInfo.color }}>
                      {typeInfo.label}
                    </span>
                    {event.client_name && (
                      <span className="cal-event-client"><Briefcase size={12} /> {event.client_name}</span>
                    )}
                    {event.location && (
                      <span className="cal-event-location"><MapPin size={12} /> {event.location}</span>
                    )}
                  </div>
                  {event.description && <p className="cal-event-desc">{event.description}</p>}
                </div>
                <div className="cal-event-actions">
                  <button className="cal-action-btn" onClick={() => openEdit(event)} title="Edit"><Edit3 size={14} /></button>
                  <button className="cal-action-btn cal-action-btn--danger" onClick={() => handleDelete(event.id)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <EventModal
          event={editingEvent}
          selectedDate={selectedDate}
          clients={clients || []}
          onClose={() => { setShowModal(false); setEditingEvent(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ── Event Modal ──
function EventModal({ event, selectedDate, clients, onClose, onSaved }: {
  event: CalendarEvent | null;
  selectedDate: string;
  clients: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!event;
  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    start_time: event?.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : `${selectedDate}T09:00`,
    end_time: event?.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : `${selectedDate}T10:00`,
    event_type: event?.event_type || 'meeting',
    client_id: event?.client_id || '',
    all_day: event?.all_day || false,
    location: event?.location || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        client_id: form.client_id || null,
      };
      if (isEdit) {
        await calendarApi.updateEvent(event!.id, data);
      } else {
        await calendarApi.createEvent(data);
      }
      onSaved();
    } catch (err) {
      console.error('Failed to save event:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cal-modal-overlay" onClick={onClose}>
      <div className="cal-modal" onClick={e => e.stopPropagation()}>
        <div className="cal-modal-header">
          <h3>{isEdit ? 'Edit Event' : 'New Event'}</h3>
          <button className="cal-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="cal-modal-form">
          <div className="cal-form-group">
            <label>Title *</label>
            <input type="text" value={form.title} onChange={e => handleChange('title', e.target.value)} required placeholder="Event title" />
          </div>

          <div className="cal-form-row">
            <div className="cal-form-group">
              <label>Type</label>
              <select value={form.event_type} onChange={e => handleChange('event_type', e.target.value)}>
                {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="cal-form-group">
              <label className="cal-checkbox-label">
                <input type="checkbox" checked={form.all_day} onChange={e => handleChange('all_day', e.target.checked)} />
                All day
              </label>
            </div>
          </div>

          {!form.all_day && (
            <div className="cal-form-row">
              <div className="cal-form-group">
                <label>Start</label>
                <input type="datetime-local" value={form.start_time} onChange={e => handleChange('start_time', e.target.value)} required />
              </div>
              <div className="cal-form-group">
                <label>End</label>
                <input type="datetime-local" value={form.end_time} onChange={e => handleChange('end_time', e.target.value)} required />
              </div>
            </div>
          )}

          {(form.event_type === 'meeting' || form.event_type === 'client-meeting') && (
            <div className="cal-form-group">
              <label>Client (optional)</label>
              <select value={form.client_id} onChange={e => handleChange('client_id', e.target.value)}>
                <option value="">— No client —</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div className="cal-form-group">
            <label>Location</label>
            <input type="text" value={form.location} onChange={e => handleChange('location', e.target.value)} placeholder="Office, Zoom, etc." />
          </div>

          <div className="cal-form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} rows={3} placeholder="Notes about this event..." />
          </div>

          <div className="cal-modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// ── TEAM VIEW SUB-TAB ──
// ══════════════════════════════════════
function TeamViewTab() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    calendarApi.getTeamAvailability(selectedDate)
      .then((data: any) => setTeam(Array.isArray(data) ? data : []))
      .catch(() => setTeam([]))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const TEAM_COLORS = ['#3ECF8E', '#3B82F6', '#A78BFA', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];

  return (
    <div className="cal-team-section">
      <div className="cal-events-toolbar">
        <div className="cal-date-nav">
          <button className="cal-nav-btn" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
            <ChevronLeft size={18} />
          </button>
          <div className="cal-date-display">
            <Users size={16} />
            <span>{formatDateDisplay(selectedDate)}</span>
          </div>
          <button className="cal-nav-btn" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
            <ChevronRight size={18} />
          </button>
        </div>
        <button className="cal-nav-btn" onClick={() => setSelectedDate(getToday())}>Today</button>
      </div>

      {loading ? (
        <div className="cal-loading">Loading team...</div>
      ) : team.length === 0 ? (
        <div className="cal-empty"><Users size={40} /><p>No team members found</p></div>
      ) : (
        <div className="cal-team-list">
          {team.map((member, idx) => {
            const color = TEAM_COLORS[idx % TEAM_COLORS.length];
            const isAvailable = member.hours?.is_available !== false;
            return (
              <div key={member.user_id} className="cal-team-row">
                <div className="cal-team-info">
                  <div className="cal-team-avatar" style={{ background: color }}>
                    <User size={14} />
                  </div>
                  <div>
                    <div className="cal-team-name">{member.name}</div>
                    <div className="cal-team-role">{member.role}</div>
                  </div>
                </div>

                <div className="cal-team-schedule">
                  {!isAvailable ? (
                    <span className="cal-team-off">Day off</span>
                  ) : (
                    <>
                      <span className="cal-team-hours">
                        <Clock size={12} />
                        {member.hours ? `${formatTime12(member.hours.start_time)} – ${formatTime12(member.hours.end_time)}` : 'No hours set'}
                      </span>
                      {(member.events as CalendarEvent[]).length > 0 && (
                        <div className="cal-team-events">
                          {(member.events as CalendarEvent[]).map(evt => (
                            <span key={evt.id} className="cal-team-event-pip" title={`${evt.title} (${formatEventTime(evt.start_time)} – ${formatEventTime(evt.end_time)})`}>
                              {formatEventTime(evt.start_time)} {evt.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// ── MAIN CALENDAR TAB ──
// ══════════════════════════════════════
export default function CalendarTab() {
  const [subTab, setSubTab] = useState<'hours' | 'events' | 'team'>('events');
  const { currentUser, hasPermission } = useAppContext();
  const role = currentUser?.role;
  const canViewTeam = role === 'owner' || role === 'admin' || role === 'manager';

  return (
    <div className="cal-tab">
      <div className="cal-sub-tabs">
        <button className={`cal-sub-tab ${subTab === 'events' ? 'cal-sub-tab--active' : ''}`} onClick={() => setSubTab('events')}>
          <CalendarDays size={15} /> My Events
        </button>
        <button className={`cal-sub-tab ${subTab === 'hours' ? 'cal-sub-tab--active' : ''}`} onClick={() => setSubTab('hours')}>
          <Clock size={15} /> My Hours
        </button>
        {canViewTeam && (
          <button className={`cal-sub-tab ${subTab === 'team' ? 'cal-sub-tab--active' : ''}`} onClick={() => setSubTab('team')}>
            <Users size={15} /> Team View
          </button>
        )}
      </div>

      <div className="cal-content">
        {subTab === 'hours' && <MyHoursTab />}
        {subTab === 'events' && <MyEventsTab />}
        {subTab === 'team' && canViewTeam && <TeamViewTab />}
      </div>
    </div>
  );
}
