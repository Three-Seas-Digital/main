import {
  AlertCircle, CheckCircle, XCircle, Shield, PhoneForwarded,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { icon: <AlertCircle size={14} />, label: 'Pending', cls: 'badge-pending' },
    confirmed: { icon: <CheckCircle size={14} />, label: 'Confirmed', cls: 'badge-confirmed' },
    cancelled: { icon: <XCircle size={14} />, label: 'Cancelled', cls: 'badge-cancelled' },
  };
  const c = config[status as keyof typeof config] || config.pending;
  return <span className={`status-badge ${c.cls}`}>{c.icon} {c.label}</span>;
}

export function RoleBadge({ role }: { role: string }) {
  const cls = {
    owner: 'role-owner', admin: 'role-admin', manager: 'role-manager',
    sales: 'role-sales', accountant: 'role-accountant', it: 'role-it',
    developer: 'role-developer', analyst: 'role-analyst',
  };
  return <span className={`role-badge ${cls[role as keyof typeof cls] || ''}`}><Shield size={12} /> {role}</span>;
}

export function FollowUpBadge({ followUp }: { followUp: any }) {
  if (!followUp) return null;
  const cls = { pending: 'fu-badge-pending', contacted: 'fu-badge-contacted', completed: 'fu-badge-completed' };
  return <span className={`followup-badge ${cls[followUp.status as keyof typeof cls] || ''}`}><PhoneForwarded size={12} /> Follow-up: {followUp.status}</span>;
}

export function TierBadge({ tier }: { tier: string }) {
  const { SUBSCRIPTION_TIERS } = useAppContext();
  const t = tier || 'free';
  const info = SUBSCRIPTION_TIERS[t] || SUBSCRIPTION_TIERS.free;
  return <span className="tier-badge" style={{ background: info.color }}>{info.label}</span>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function formatDisplayDate(dateStr: string) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

// eslint-disable-next-line react-refresh/only-export-components
export function generateICalEvent(appointment: any) {
  const startDate = new Date(`${appointment.date}T${appointment.time}`);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatICalDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return `BEGIN:VEVENT
DTSTART:${formatICalDate(startDate)}
DTEND:${formatICalDate(endDate)}
SUMMARY:${appointment.name} - ${appointment.service || 'Appointment'}
DESCRIPTION:${appointment.message || ''}
LOCATION:
STATUS:${appointment.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}
UID:${appointment.id}@threeseasdigital.com
END:VEVENT`;
}

// eslint-disable-next-line react-refresh/only-export-components
export function exportToICal(appointments: any[], filename = 'appointments.ics') {
  const events = appointments.map(generateICalEvent).join('\n');
  const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Three Seas Digital//CRM//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${events}
END:VCALENDAR`;

  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
