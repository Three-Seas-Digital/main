import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Clock, Save, Plus, Edit3, Trash2, X, Users,
  ChevronLeft, ChevronRight, CalendarDays, MapPin,
  Briefcase, User, Ban, CheckCircle, RefreshCw,
  Link, Unlink, MessageSquare, Send, Bot, Sparkles,
  Check, AlertCircle,
} from 'lucide-react';
import { calendarApi } from '../../api/calendar';
import { useAppContext } from '../../context/AppContext';
import '../../styles/calendar.css';

// ── Constants ──

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const EVENT_TYPES = [
  { value: 'meeting', label: 'Meeting', color: '#3ECF8E' },
  { value: 'client-meeting', label: 'Client Meeting', color: '#3B82F6' },
  { value: 'personal', label: 'Personal', color: '#A78BFA' },
  { value: 'blocked', label: 'Blocked', color: '#EF4444' },
];

const HOUR_HEIGHT = 64;
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 22;

const HOURS_LIST: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of ['00', '30']) {
    HOURS_LIST.push(`${h.toString().padStart(2, '0')}:${m}`);
  }
}

// ── Interfaces ──

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
  google_event_id?: string;
}

interface DayOverride {
  id: string;
  override_date: string;
  is_open: boolean;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

interface TeamMember {
  user_id: string;
  name: string;
  role: string;
  hours: BusinessHour | null;
  events: CalendarEvent[];
}

// ── Utility Functions ──

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTime12(time24: string): string {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatEventTime(dt: string): string {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatHourLabel(h: number): string {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function getMonthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const startDate = new Date(first);
  startDate.setDate(1 - first.getDay());

  const grid: Date[][] = [];
  const cursor = new Date(startDate);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    grid.push(week);
  }
  return grid;
}

function getWeekDates(date: Date): Date[] {
  const sun = new Date(date);
  sun.setDate(sun.getDate() - sun.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sun);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const dateStr = toDateStr(date);
  return events.filter(e => {
    const d = new Date(e.start_time);
    const eStr = toDateStr(d);
    return eStr === dateStr;
  }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
}

function getEventStyle(event: CalendarEvent) {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const startMin = start.getHours() * 60 + start.getMinutes();
  const endMin = end.getHours() * 60 + end.getMinutes();
  const top = (startMin - DAY_START_HOUR * 60) * (HOUR_HEIGHT / 60);
  const height = Math.max((endMin - startMin) * (HOUR_HEIGHT / 60), 20);
  return { top: Math.max(0, top), height };
}

function getViewRange(viewMode: string, currentDate: Date): { start: string; end: string } {
  if (viewMode === 'month') {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const first = new Date(year, month, 1);
    const gridStart = new Date(first);
    gridStart.setDate(1 - first.getDay());
    const last = new Date(year, month + 1, 0);
    const gridEnd = new Date(last);
    gridEnd.setDate(last.getDate() + (6 - last.getDay()));
    return { start: `${toDateStr(gridStart)}T00:00:00`, end: `${toDateStr(gridEnd)}T23:59:59` };
  }
  if (viewMode === 'week') {
    const dates = getWeekDates(currentDate);
    return { start: `${toDateStr(dates[0])}T00:00:00`, end: `${toDateStr(dates[6])}T23:59:59` };
  }
  const ds = toDateStr(currentDate);
  return { start: `${ds}T00:00:00`, end: `${ds}T23:59:59` };
}

function navigateDate(currentDate: Date, viewMode: string, direction: number): Date {
  const d = new Date(currentDate);
  if (viewMode === 'month') d.setMonth(d.getMonth() + direction);
  else if (viewMode === 'week') d.setDate(d.getDate() + 7 * direction);
  else d.setDate(d.getDate() + direction);
  return d;
}

function getViewTitle(currentDate: Date, viewMode: string): string {
  if (viewMode === 'month') {
    return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }
  if (viewMode === 'week') {
    const dates = getWeekDates(currentDate);
    const s = dates[0];
    const e = dates[6];
    if (s.getMonth() === e.getMonth()) {
      return `${MONTH_NAMES[s.getMonth()]} ${s.getDate()} – ${e.getDate()}, ${s.getFullYear()}`;
    }
    return `${MONTH_NAMES[s.getMonth()]} ${s.getDate()} – ${MONTH_NAMES[e.getMonth()]} ${e.getDate()}, ${s.getFullYear()}`;
  }
  return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function getTypeInfo(type: string) {
  return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];
}

function getDefaultHours(): BusinessHour[] {
  return DAY_FULL.map((_, i) => ({
    day_of_week: i,
    start_time: '09:00',
    end_time: '17:00',
    is_available: i >= 1 && i <= 5,
  }));
}

/** Determine if a date is open/closed considering overrides */
function getDayStatus(date: Date, hours: BusinessHour[], overrides: DayOverride[]): {
  isOpen: boolean;
  startTime: string;
  endTime: string;
  reason?: string;
  overrideId?: string;
} {
  const dateStr = toDateStr(date);
  const override = overrides.find(o => o.override_date === dateStr || o.override_date?.slice(0, 10) === dateStr);
  if (override) {
    return {
      isOpen: override.is_open,
      startTime: override.start_time || '09:00',
      endTime: override.end_time || '17:00',
      reason: override.reason,
      overrideId: override.id,
    };
  }
  const dow = date.getDay();
  const bh = hours.find(h => h.day_of_week === dow);
  return {
    isOpen: bh ? bh.is_available : (dow >= 1 && dow <= 5),
    startTime: bh?.start_time || '09:00',
    endTime: bh?.end_time || '17:00',
  };
}

// ══════════════════════════════════════
// ── MONTH VIEW ──
// ══════════════════════════════════════

function MonthView({ currentDate, events, selectedDate, businessHours, overrides, onSelectDate, onCreateEvent, onEditEvent, onToggleDay }: {
  currentDate: Date;
  events: CalendarEvent[];
  selectedDate: string;
  businessHours: BusinessHour[];
  overrides: DayOverride[];
  onSelectDate: (date: string) => void;
  onCreateEvent: (date: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onToggleDay: (date: Date, currentStatus: ReturnType<typeof getDayStatus>) => void;
}) {
  const grid = useMemo(() => getMonthGrid(currentDate.getFullYear(), currentDate.getMonth()), [currentDate]);
  const today = toDateStr(new Date());
  const currentMonth = currentDate.getMonth();

  return (
    <div className="cv-month">
      <div className="cv-month-header">
        {DAY_NAMES.map(d => (
          <div key={d} className="cv-month-day-name">{d}</div>
        ))}
      </div>
      <div className="cv-month-grid">
        {grid.map((week, wi) => (
          <div key={wi} className="cv-month-week">
            {week.map((date, di) => {
              const dateStr = toDateStr(date);
              const dayEvents = getEventsForDate(events, date);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;
              const isOtherMonth = date.getMonth() !== currentMonth;
              const dayStatus = getDayStatus(date, businessHours, overrides);
              const isClosed = !dayStatus.isOpen;
              const maxVisible = 3;

              return (
                <div
                  key={di}
                  className={`cv-month-cell${isToday ? ' cv-today' : ''}${isSelected ? ' cv-selected' : ''}${isOtherMonth ? ' cv-other-month' : ''}${isClosed ? ' cv-closed-day' : ''}`}
                  onClick={() => onSelectDate(dateStr)}
                  onDoubleClick={() => onCreateEvent(dateStr)}
                >
                  <div className="cv-month-date-row">
                    <div className={`cv-month-date${isToday ? ' cv-today-badge' : ''}`}>
                      {date.getDate()}
                    </div>
                    {!isOtherMonth && (
                      <button
                        className={`cv-day-toggle${isClosed ? ' cv-day-toggle--closed' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onToggleDay(date, dayStatus); }}
                        title={isClosed ? (dayStatus.reason || 'Closed — click to open') : 'Open — click to close'}
                      >
                        {isClosed ? <Ban size={11} /> : <CheckCircle size={11} />}
                      </button>
                    )}
                  </div>
                  {isClosed && dayStatus.reason && (
                    <div className="cv-closed-reason">{dayStatus.reason}</div>
                  )}
                  <div className="cv-month-events">
                    {dayEvents.slice(0, maxVisible).map(evt => {
                      const ti = getTypeInfo(evt.event_type);
                      return (
                        <div
                          key={evt.id}
                          className="cv-month-event"
                          style={{ backgroundColor: ti.color + '22', borderLeft: `3px solid ${ti.color}` }}
                          onClick={(e) => { e.stopPropagation(); onEditEvent(evt); }}
                          title={`${evt.title} (${evt.all_day ? 'All day' : formatEventTime(evt.start_time)})`}
                        >
                          {!evt.all_day && <span className="cv-month-event-time">{formatEventTime(evt.start_time)}</span>}
                          <span className="cv-month-event-title">{evt.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > maxVisible && (
                      <div className="cv-month-more">+{dayEvents.length - maxVisible} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// ── TIME GRID (Week / Day views) ──
// ══════════════════════════════════════

function TimeGrid({ dates, events, businessHours, overrides, onCreateEvent, onEditEvent, isDayView }: {
  dates: Date[];
  events: CalendarEvent[];
  businessHours: BusinessHour[];
  overrides: DayOverride[];
  onCreateEvent: (date: string, time?: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
  isDayView?: boolean;
}) {
  const today = toDateStr(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();

  useEffect(() => {
    if (scrollRef.current) {
      const scrollTo = Math.max(0, (now.getHours() - DAY_START_HOUR - 1) * HOUR_HEIGHT);
      scrollRef.current.scrollTop = scrollTo;
    }
  }, []);

  const hours: number[] = [];
  for (let h = DAY_START_HOUR; h <= DAY_END_HOUR; h++) hours.push(h);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMin - DAY_START_HOUR * 60) * (HOUR_HEIGHT / 60);
  const showNowLine = now.getHours() >= DAY_START_HOUR && now.getHours() <= DAY_END_HOUR;

  const allDayByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    dates.forEach(d => {
      map[toDateStr(d)] = getEventsForDate(events, d).filter(e => e.all_day);
    });
    return map;
  }, [events, dates]);

  const hasAllDay = Object.values(allDayByDate).some(arr => arr.length > 0);
  const colCount = dates.length;
  const gridCols = `60px repeat(${colCount}, 1fr)`;

  return (
    <div className={`cv-timegrid${isDayView ? ' cv-timegrid--day' : ''}`}>
      {/* Header */}
      <div className="cv-tg-header" style={{ gridTemplateColumns: gridCols }}>
        <div className="cv-tg-gutter-header" />
        {dates.map((date, i) => {
          const ds = toDateStr(date);
          const isToday = ds === today;
          return (
            <div key={i} className={`cv-tg-day-header${isToday ? ' cv-today' : ''}`}>
              <span className="cv-tg-day-name">{DAY_NAMES[date.getDay()]}</span>
              <span className={`cv-tg-day-num${isToday ? ' cv-today-badge' : ''}`}>{date.getDate()}</span>
            </div>
          );
        })}
      </div>

      {/* All-day bar */}
      {hasAllDay && (
        <div className="cv-tg-allday" style={{ gridTemplateColumns: gridCols }}>
          <div className="cv-tg-gutter-label">all-day</div>
          {dates.map((date, i) => {
            const ds = toDateStr(date);
            const dayAllDay = allDayByDate[ds] || [];
            return (
              <div key={i} className="cv-tg-allday-cell">
                {dayAllDay.map(evt => {
                  const ti = getTypeInfo(evt.event_type);
                  return (
                    <div key={evt.id} className="cv-allday-event" style={{ backgroundColor: ti.color }} onClick={() => onEditEvent(evt)}>
                      {evt.title}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Scrollable time grid */}
      <div className="cv-tg-scroll" ref={scrollRef}>
        <div className="cv-tg-grid" style={{ gridTemplateColumns: gridCols }}>
          {/* Time gutter */}
          <div className="cv-tg-gutter">
            {hours.map(h => (
              <div key={h} className="cv-tg-gutter-hour" style={{ height: HOUR_HEIGHT }}>
                <span>{formatHourLabel(h)}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {dates.map((date, i) => {
            const ds = toDateStr(date);
            const isToday = ds === today;
            const dayEvents = getEventsForDate(events, date).filter(e => !e.all_day);
            const dayStatus = getDayStatus(date, businessHours, overrides);
            const workStartH = dayStatus.isOpen ? parseInt(dayStatus.startTime.split(':')[0]) : -1;
            const workEndH = dayStatus.isOpen ? parseInt(dayStatus.endTime.split(':')[0]) : -1;

            return (
              <div key={i} className={`cv-tg-col${isToday ? ' cv-today-col' : ''}${!dayStatus.isOpen ? ' cv-tg-col--closed' : ''}`}>
                {/* Hour cells (clickable) */}
                {hours.map(h => {
                  const isOffHour = !dayStatus.isOpen || h < workStartH || h >= workEndH;
                  return (
                    <div
                      key={h}
                      className={`cv-tg-hour-cell${isOffHour ? ' cv-tg-hour-cell--off' : ''}`}
                      style={{ height: HOUR_HEIGHT }}
                      onClick={() => onCreateEvent(ds, `${h.toString().padStart(2, '0')}:00`)}
                    >
                      <div className="cv-tg-half-line" />
                    </div>
                  );
                })}

                {/* Event blocks */}
                {dayEvents.map(evt => {
                  const { top, height } = getEventStyle(evt);
                  const ti = getTypeInfo(evt.event_type);
                  const isShort = height < 40;
                  return (
                    <div
                      key={evt.id}
                      className={`cv-event-block${isShort ? ' cv-event-block--short' : ''}`}
                      style={{
                        top,
                        height,
                        backgroundColor: ti.color + '1a',
                        borderLeft: `3px solid ${ti.color}`,
                      }}
                      onClick={(e) => { e.stopPropagation(); onEditEvent(evt); }}
                    >
                      <div className="cv-event-block-title">{evt.title}</div>
                      {!isShort && (
                        <div className="cv-event-block-time">
                          {formatEventTime(evt.start_time)} – {formatEventTime(evt.end_time)}
                        </div>
                      )}
                      {!isShort && isDayView && evt.location && (
                        <div className="cv-event-block-loc"><MapPin size={10} /> {evt.location}</div>
                      )}
                    </div>
                  );
                })}

                {/* Current time line */}
                {isToday && showNowLine && (
                  <div className="cv-now-line" style={{ top: nowTop }}>
                    <div className="cv-now-dot" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// ── EVENT MODAL ──
// ══════════════════════════════════════

function EventModal({ event, selectedDate, selectedTime, clients, onClose, onSaved, onDelete }: {
  event: CalendarEvent | null;
  selectedDate: string;
  selectedTime?: string;
  clients: any[];
  onClose: () => void;
  onSaved: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!event;
  const startTime = selectedTime || '09:00';
  const endHour = Math.min(parseInt(startTime.split(':')[0]) + 1, 23);
  const endTime = `${endHour.toString().padStart(2, '0')}:${startTime.split(':')[1]}`;

  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    start_time: event?.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : `${selectedDate}T${startTime}`,
    end_time: event?.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : `${selectedDate}T${endTime}`,
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
      const data = { ...form, client_id: form.client_id || null };
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
                <option value="">-- No client --</option>
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
            {isEdit && onDelete && (
              <button type="button" className="btn btn-danger btn-sm" onClick={onDelete} style={{ marginRight: 'auto' }}>
                <Trash2 size={14} /> Delete
              </button>
            )}
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
// ── MY HOURS SUB-TAB ──
// ══════════════════════════════════════

function MyHoursTab({ onSaved }: { onSaved?: (hours: BusinessHour[]) => void }) {
  const [hours, setHours] = useState<BusinessHour[]>(getDefaultHours());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calendarApi.getMyHours().then((data: any) => {
      if (Array.isArray(data) && data.length > 0) {
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
      onSaved?.(hours);
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
              <span className="cal-hours-day-name">{DAY_FULL[h.day_of_week]}</span>
            </div>
            {h.is_available ? (
              <div className="cal-hours-times">
                <select value={h.start_time} onChange={e => updateDay(h.day_of_week, 'start_time', e.target.value)} className="cal-hours-select">
                  {HOURS_LIST.map(t => <option key={t} value={t}>{formatTime12(t)}</option>)}
                </select>
                <span className="cal-hours-to">to</span>
                <select value={h.end_time} onChange={e => updateDay(h.day_of_week, 'end_time', e.target.value)} className="cal-hours-select">
                  {HOURS_LIST.map(t => <option key={t} value={t}>{formatTime12(t)}</option>)}
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
// ── TEAM VIEW SUB-TAB ──
// ══════════════════════════════════════

function TeamViewTab() {
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    calendarApi.getTeamAvailability(selectedDate)
      .then((data: any) => setTeam(Array.isArray(data) ? data : []))
      .catch(() => setTeam([]))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const addDays = (d: string, n: number) => {
    const date = new Date(d + 'T12:00:00');
    date.setDate(date.getDate() + n);
    return toDateStr(date);
  };

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
            <span>{new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <button className="cal-nav-btn" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
            <ChevronRight size={18} />
          </button>
        </div>
        <button className="cal-nav-btn" onClick={() => setSelectedDate(toDateStr(new Date()))}>Today</button>
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
// ── GOOGLE CALENDAR STATUS BAR ──
// ══════════════════════════════════════

function GoogleCalendarBar({ onSynced }: { onSynced: () => void }) {
  const [status, setStatus] = useState<{ connected: boolean; lastSync?: string }>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    calendarApi.getGoogleStatus()
      .then((res: any) => setStatus(res.data || { connected: false }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleConnect = async () => {
    try {
      const res = await calendarApi.getGoogleAuthUrl();
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch {
      setMessage('Google Calendar not configured on this server');
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await calendarApi.syncGoogle();
      const d = res.data;
      setMessage(`Synced: ${d.fromGoogle?.inserted || 0} new, ${d.fromGoogle?.updated || 0} updated from Google`);
      onSynced();
      setTimeout(() => setMessage(''), 5000);
    } catch {
      setMessage('Sync failed');
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Google Calendar? Local events will remain.')) return;
    try {
      await calendarApi.disconnectGoogle();
      setStatus({ connected: false });
      setMessage('Disconnected');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to disconnect');
      setTimeout(() => setMessage(''), 4000);
    }
  };

  // Check URL params for connection result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gcResult = params.get('google_calendar');
    if (gcResult === 'connected') {
      setStatus({ connected: true });
      setMessage('Google Calendar connected successfully!');
      setTimeout(() => setMessage(''), 5000);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (gcResult === 'denied') {
      setMessage('Google Calendar access was denied');
      setTimeout(() => setMessage(''), 5000);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (gcResult === 'error') {
      setMessage('Failed to connect Google Calendar');
      setTimeout(() => setMessage(''), 5000);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (loading) return null;

  return (
    <div className="cv-google-bar">
      {status.connected ? (
        <>
          <div className="cv-google-status cv-google-status--on">
            <Check size={14} />
            <span>Google Calendar connected</span>
            {status.lastSync && (
              <span className="cv-google-sync-time">
                Last sync: {new Date(status.lastSync).toLocaleString()}
              </span>
            )}
          </div>
          <div className="cv-google-actions">
            <button className="cv-google-btn" onClick={handleSync} disabled={syncing} title="Sync now">
              <RefreshCw size={14} className={syncing ? 'cv-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync'}
            </button>
            <button className="cv-google-btn cv-google-btn--danger" onClick={handleDisconnect} title="Disconnect">
              <Unlink size={14} />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="cv-google-status">
            <AlertCircle size={14} />
            <span>Google Calendar not connected</span>
          </div>
          <button className="cv-google-btn cv-google-btn--connect" onClick={handleConnect}>
            <Link size={14} /> Connect Google Calendar
          </button>
        </>
      )}
      {message && <div className="cv-google-message">{message}</div>}
    </div>
  );
}

// ══════════════════════════════════════
// ── AI SCHEDULING CHAT ──
// ══════════════════════════════════════

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  action?: any;
  executed?: boolean;
}

function AISchedulingChat({ onActionExecuted }: { onActionExecuted: () => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const res = await calendarApi.agentChat(msg);
      const data = res.data;
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        text: data.message || 'Done.',
        action: data,
        executed: false,
      };

      // Auto-describe slots if found
      if (data.action === 'find_slots' && data.slots?.length > 0) {
        const slotList = data.slots.slice(0, 8).map((s: any) => {
          const start = new Date(s.start);
          const end = new Date(s.end);
          return `${start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        }).join('\n');
        assistantMsg.text += `\n\nAvailable slots:\n${slotList}${data.slots.length > 8 ? `\n...and ${data.slots.length - 8} more` : ''}`;
      }

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: err?.response?.data?.error || 'Something went wrong. Try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (msgIndex: number) => {
    const msg = messages[msgIndex];
    if (!msg?.action || msg.executed) return;

    setLoading(true);
    try {
      const res = await calendarApi.agentExecute(msg.action);
      setMessages(prev => prev.map((m, i) =>
        i === msgIndex ? { ...m, executed: true, text: m.text + `\n\n${res.message || 'Done!'}` } : m
      ));
      onActionExecuted();
    } catch (err: any) {
      setMessages(prev => prev.map((m, i) =>
        i === msgIndex ? { ...m, text: m.text + `\n\nFailed: ${err?.response?.data?.error || 'Unknown error'}` } : m
      ));
    } finally {
      setLoading(false);
    }
  };

  const canExecute = (action: any) => {
    return action && ['create', 'move', 'cancel'].includes(action.action);
  };

  if (!open) {
    return (
      <button className="cv-ai-fab" onClick={() => setOpen(true)} title="AI Scheduling Assistant">
        <Sparkles size={20} />
      </button>
    );
  }

  return (
    <div className="cv-ai-panel">
      <div className="cv-ai-header">
        <div className="cv-ai-header-title">
          <Bot size={16} />
          <span>AI Scheduler</span>
        </div>
        <button className="cal-modal-close" onClick={() => setOpen(false)}><X size={16} /></button>
      </div>

      <div className="cv-ai-messages">
        {messages.length === 0 && (
          <div className="cv-ai-welcome">
            <Sparkles size={24} />
            <p>Ask me to schedule, move, or cancel events.</p>
            <div className="cv-ai-suggestions">
              {['What does my week look like?', 'Find me a free slot this week', 'Block tomorrow morning for deep work'].map(s => (
                <button key={s} className="cv-ai-suggestion" onClick={() => { setInput(s); }}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`cv-ai-msg cv-ai-msg--${msg.role}`}>
            <div className="cv-ai-msg-text">{msg.text}</div>
            {msg.role === 'assistant' && canExecute(msg.action) && !msg.executed && (
              <div className="cv-ai-msg-actions">
                <button className="btn btn-primary btn-sm" onClick={() => handleExecute(i)} disabled={loading}>
                  <Check size={12} /> Confirm & Execute
                </button>
              </div>
            )}
            {msg.executed && (
              <div className="cv-ai-msg-executed">
                <Check size={12} /> Executed
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="cv-ai-msg cv-ai-msg--assistant">
            <div className="cv-ai-typing">Thinking...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form className="cv-ai-input" onSubmit={e => { e.preventDefault(); handleSend(); }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Schedule a meeting with..."
          disabled={loading}
        />
        <button type="submit" disabled={!input.trim() || loading}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

// ══════════════════════════════════════
// ── DAY OVERRIDE MODAL ──
// ══════════════════════════════════════

function DayOverrideModal({ date, currentStatus, onClose, onSave, onRemoveOverride }: {
  date: Date;
  currentStatus: ReturnType<typeof getDayStatus>;
  onClose: () => void;
  onSave: (isOpen: boolean, reason: string, startTime?: string, endTime?: string) => void;
  onRemoveOverride?: () => void;
}) {
  const isCurrentlyOpen = currentStatus.isOpen;
  const [action, setAction] = useState<'close' | 'open'>(isCurrentlyOpen ? 'close' : 'open');
  const [reason, setReason] = useState(currentStatus.reason || '');
  const [startTime, setStartTime] = useState(currentStatus.startTime || '09:00');
  const [endTime, setEndTime] = useState(currentStatus.endTime || '17:00');

  const dateLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const hasOverride = !!currentStatus.overrideId;

  return (
    <div className="cal-modal-overlay" onClick={onClose}>
      <div className="cal-modal cv-day-modal" onClick={e => e.stopPropagation()}>
        <div className="cal-modal-header">
          <h3>{dateLabel}</h3>
          <button className="cal-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="cv-day-modal-status">
          Currently: <strong>{isCurrentlyOpen ? 'Open' : 'Closed'}</strong>
          {isCurrentlyOpen && ` (${formatTime12(currentStatus.startTime)} – ${formatTime12(currentStatus.endTime)})`}
          {currentStatus.reason && <span className="cv-day-modal-reason"> — {currentStatus.reason}</span>}
          {hasOverride && <span className="cv-day-modal-badge">Override active</span>}
        </div>

        <div className="cv-day-modal-actions-row">
          <button
            className={`cv-day-action-btn${action === 'close' ? ' cv-day-action-btn--active cv-day-action-btn--close' : ''}`}
            onClick={() => setAction('close')}
          >
            <Ban size={14} /> Close this day
          </button>
          <button
            className={`cv-day-action-btn${action === 'open' ? ' cv-day-action-btn--active cv-day-action-btn--open' : ''}`}
            onClick={() => setAction('open')}
          >
            <CheckCircle size={14} /> Open this day
          </button>
        </div>

        {action === 'open' && (
          <div className="cal-form-row" style={{ marginTop: 12 }}>
            <div className="cal-form-group">
              <label>Start time</label>
              <select value={startTime} onChange={e => setStartTime(e.target.value)} className="cal-hours-select">
                {HOURS_LIST.map(t => <option key={t} value={t}>{formatTime12(t)}</option>)}
              </select>
            </div>
            <div className="cal-form-group">
              <label>End time</label>
              <select value={endTime} onChange={e => setEndTime(e.target.value)} className="cal-hours-select">
                {HOURS_LIST.map(t => <option key={t} value={t}>{formatTime12(t)}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="cal-form-group" style={{ marginTop: 12 }}>
          <label>Reason (optional)</label>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={action === 'close' ? 'e.g. Holiday, Personal day' : 'e.g. Special hours, Catch-up day'}
          />
        </div>

        <div className="cal-modal-actions">
          {hasOverride && onRemoveOverride && (
            <button type="button" className="btn btn-danger btn-sm" onClick={onRemoveOverride} style={{ marginRight: 'auto' }}>
              <Trash2 size={14} /> Remove Override
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onSave(action === 'open', reason, startTime, endTime)}
          >
            <Save size={14} /> Save Override
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// ── MAIN CALENDAR TAB ──
// ══════════════════════════════════════

export default function CalendarTab() {
  const [subTab, setSubTab] = useState<'calendar' | 'hours' | 'team'>('calendar');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>(getDefaultHours());
  const [overrides, setOverrides] = useState<DayOverride[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [dayModalDate, setDayModalDate] = useState<Date | null>(null);
  const [dayModalStatus, setDayModalStatus] = useState<ReturnType<typeof getDayStatus> | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [modalDate, setModalDate] = useState(toDateStr(new Date()));
  const [modalTime, setModalTime] = useState('09:00');
  const { clients, currentUser } = useAppContext();

  const viewRange = useMemo(() => getViewRange(viewMode, currentDate), [viewMode, currentDate]);

  // Load business hours once
  useEffect(() => {
    calendarApi.getMyHours().then((data: any) => {
      if (Array.isArray(data) && data.length > 0) {
        const merged = getDefaultHours().map(def => {
          const found = data.find((d: any) => d.day_of_week === def.day_of_week);
          return found ? { ...def, ...found } : def;
        });
        setBusinessHours(merged);
      }
    }).catch(() => {});
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsData, overridesData] = await Promise.all([
        calendarApi.getEvents(viewRange.start, viewRange.end),
        calendarApi.getOverrides(viewRange.start.slice(0, 10), viewRange.end.slice(0, 10)),
      ]);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setOverrides(Array.isArray(overridesData) ? overridesData : []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [viewRange.start, viewRange.end]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleCreateEvent = (date: string, time?: string) => {
    setModalDate(date);
    setModalTime(time || '09:00');
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditingEvent(null);
    loadEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await calendarApi.deleteEvent(id);
      setShowModal(false);
      setEditingEvent(null);
      loadEvents();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleToggleDay = (date: Date, status: ReturnType<typeof getDayStatus>) => {
    setDayModalDate(date);
    setDayModalStatus(status);
    setShowDayModal(true);
  };

  const handleDayOverrideSave = async (isOpen: boolean, reason: string, startTime?: string, endTime?: string) => {
    if (!dayModalDate) return;
    try {
      await calendarApi.createOverride({
        override_date: toDateStr(dayModalDate),
        is_open: isOpen,
        start_time: isOpen ? (startTime || '09:00') : null,
        end_time: isOpen ? (endTime || '17:00') : null,
        reason: reason || null,
      });
      setShowDayModal(false);
      loadEvents();
    } catch (err) {
      console.error('Failed to save override:', err);
    }
  };

  const handleDayOverrideRemove = async () => {
    if (!dayModalStatus?.overrideId) return;
    try {
      await calendarApi.deleteOverride(dayModalStatus.overrideId);
      setShowDayModal(false);
      loadEvents();
    } catch (err) {
      console.error('Failed to remove override:', err);
    }
  };

  const navigate = (dir: number) => setCurrentDate(navigateDate(currentDate, viewMode, dir));
  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(toDateStr(new Date()));
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const handleMonthDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    // Switch to day view on double-click is handled by onCreateEvent
  };

  const role = currentUser?.role;
  const canViewTeam = role === 'owner' || role === 'admin' || role === 'manager';

  return (
    <div className="cv-container">
      {/* Google Calendar status */}
      <GoogleCalendarBar onSynced={loadEvents} />

      {/* Sub-tab bar */}
      <div className="cal-sub-tabs">
        <button className={`cal-sub-tab ${subTab === 'calendar' ? 'cal-sub-tab--active' : ''}`} onClick={() => setSubTab('calendar')}>
          <CalendarDays size={15} /> Calendar
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

      {subTab === 'calendar' && (
        <>
          {/* Calendar toolbar */}
          <div className="cv-toolbar">
            <div className="cv-toolbar-left">
              <button className="cv-nav-btn" onClick={() => navigate(-1)}>
                <ChevronLeft size={18} />
              </button>
              <button className="cv-today-btn" onClick={goToday}>Today</button>
              <button className="cv-nav-btn" onClick={() => navigate(1)}>
                <ChevronRight size={18} />
              </button>
              <h2 className="cv-title">{getViewTitle(currentDate, viewMode)}</h2>
            </div>
            <div className="cv-toolbar-right">
              <div className="cv-view-switcher">
                <button className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>Month</button>
                <button className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>Week</button>
                <button className={viewMode === 'day' ? 'active' : ''} onClick={() => setViewMode('day')}>Day</button>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => handleCreateEvent(selectedDate)}>
                <Plus size={14} /> New Event
              </button>
            </div>
          </div>

          {/* Calendar view */}
          <div className="cv-body">
            {loading && events.length === 0 && <div className="cal-loading">Loading events...</div>}

            {viewMode === 'month' && (
              <MonthView
                currentDate={currentDate}
                events={events}
                selectedDate={selectedDate}
                businessHours={businessHours}
                overrides={overrides}
                onSelectDate={handleSelectDate}
                onCreateEvent={handleCreateEvent}
                onEditEvent={handleEditEvent}
                onToggleDay={handleToggleDay}
              />
            )}
            {viewMode === 'week' && (
              <TimeGrid
                dates={getWeekDates(currentDate)}
                events={events}
                businessHours={businessHours}
                overrides={overrides}
                onCreateEvent={handleCreateEvent}
                onEditEvent={handleEditEvent}
              />
            )}
            {viewMode === 'day' && (
              <TimeGrid
                dates={[currentDate]}
                events={events}
                businessHours={businessHours}
                overrides={overrides}
                onCreateEvent={handleCreateEvent}
                onEditEvent={handleEditEvent}
                isDayView
              />
            )}
          </div>
        </>
      )}

      {subTab === 'hours' && <MyHoursTab onSaved={(h) => setBusinessHours(h)} />}
      {subTab === 'team' && canViewTeam && <TeamViewTab />}

      {/* Event Modal */}
      {showModal && (
        <EventModal
          event={editingEvent}
          selectedDate={modalDate}
          selectedTime={modalTime}
          clients={clients || []}
          onClose={() => { setShowModal(false); setEditingEvent(null); }}
          onSaved={handleSaved}
          onDelete={editingEvent ? () => handleDelete(editingEvent.id) : undefined}
        />
      )}

      {/* Day Override Modal */}
      {showDayModal && dayModalDate && dayModalStatus && (
        <DayOverrideModal
          date={dayModalDate}
          currentStatus={dayModalStatus}
          onClose={() => setShowDayModal(false)}
          onSave={handleDayOverrideSave}
          onRemoveOverride={dayModalStatus.overrideId ? handleDayOverrideRemove : undefined}
        />
      )}

      {/* AI Scheduling Assistant */}
      <AISchedulingChat onActionExecuted={loadEvents} />
    </div>
  );
}
