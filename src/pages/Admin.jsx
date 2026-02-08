import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Lock, LogOut, CalendarDays, Clock, User, Mail, Phone, Trash2,
  CheckCircle, XCircle, AlertCircle, BarChart3, Users,
  Calendar as CalendarIcon, UserPlus, Shield, Edit3, Eye, EyeOff,
  PhoneForwarded, UserCheck, MessageSquare, Plus, X, Tag, FileText,
  ArrowRight, ChevronLeft, ChevronUp, ChevronDown, Briefcase, Send, FolderKanban, Flag,
  Circle, CircleCheckBig, ListTodo, Milestone, GripVertical,
  DollarSign, Receipt, CreditCard, Ban, MapPin, TrendingUp, Printer,
  Filter, PhoneCall, Building2, ExternalLink, Search, Globe, Layers,
  BarChart2, PieChart as PieChartIcon, Activity, Home, Wallet, GraduationCap, Baby,
  Coffee, Trees, Landmark, RefreshCw, Bell, BellRing, Zap, Download, Upload, Copy,
  Timer, PlayCircle, StopCircle, CheckSquare, Square, MoreHorizontal,
  FileSpreadsheet, ClipboardList, History, LayoutDashboard,
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart,
} from 'recharts';
import { Link } from 'react-router-dom';
import Calendar from '../components/Calendar';
import { useAppContext } from '../context/AppContext';

/* ===== FIRST-RUN SETUP ===== */
function AdminSetup() {
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const { setupAdmin } = useAppContext();
  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    const result = setupAdmin({ name: form.name, email: form.email, username: form.username, password: form.password });
    if (!result.success) setError(result.error);
  };
  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-icon"><Shield size={32} /></div>
        <h2>Welcome to Three Seas Digital</h2>
        <p>Create your admin account to get started</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Full Name</label><input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required /></div>
          <div className="form-group"><label>Email</label><input type="email" name="email" value={form.email} onChange={handleChange} placeholder="admin@example.com" required /></div>
          <div className="form-group"><label>Username</label><input type="text" name="username" value={form.username} onChange={handleChange} placeholder="Choose a username" required /></div>
          <div className="form-group"><label>Password</label><input type="password" name="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" required /></div>
          <div className="form-group"><label>Confirm Password</label><input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm password" required /></div>
          <button type="submit" className="btn btn-primary btn-full"><Shield size={18} /> Create Admin Account</button>
        </form>
      </div>
    </div>
  );
}

/* ===== LOGIN ===== */
function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [failCount, setFailCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const { login } = useAppContext();
  const isLocked = lockedUntil && Date.now() < lockedUntil;
  const [, forceUpdate] = useState(0);

  // Tick the countdown while locked
  useEffect(() => {
    if (!lockedUntil) return;
    const timer = setInterval(() => {
      if (Date.now() >= lockedUntil) { setLockedUntil(null); setFailCount(0); clearInterval(timer); }
      forceUpdate((n) => n + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLocked) return;
    const result = login(username, password);
    if (!result.success) {
      const newCount = failCount + 1;
      setFailCount(newCount);
      if (newCount >= 3) {
        setLockedUntil(Date.now() + 30000); // 30 second lockout
        setError('Too many failed attempts. Please wait 30 seconds.');
      } else {
        setError(result.error);
      }
    }
  };
  const lockSeconds = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000)) : 0;
  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-icon"><Lock size={32} /></div>
        <h2>Admin Panel</h2>
        <p>Sign in to manage your dashboard</p>
        {error && <div className="login-error">{error}{isLocked ? ` (${lockSeconds}s)` : ''}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Username</label><input type="text" value={username} onChange={(e) => { setUsername(e.target.value); setError(''); }} placeholder="Username" required /></div>
          <div className="form-group"><label>Password</label><input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="Password" required /></div>
          <button type="submit" className="btn btn-primary btn-full" disabled={isLocked}>{isLocked ? `Locked (${lockSeconds}s)` : 'Sign In'}</button>
        </form>
        <p className="login-hint">Enter your credentials to sign in</p>
        <div className="login-register-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
}

/* ===== BADGES ===== */
function StatusBadge({ status }) {
  const config = {
    pending: { icon: <AlertCircle size={14} />, label: 'Pending', cls: 'badge-pending' },
    confirmed: { icon: <CheckCircle size={14} />, label: 'Confirmed', cls: 'badge-confirmed' },
    cancelled: { icon: <XCircle size={14} />, label: 'Cancelled', cls: 'badge-cancelled' },
  };
  const c = config[status] || config.pending;
  return <span className={`status-badge ${c.cls}`}>{c.icon} {c.label}</span>;
}
function RoleBadge({ role }) {
  const cls = { admin: 'role-admin', manager: 'role-manager', staff: 'role-staff' };
  return <span className={`role-badge ${cls[role] || ''}`}><Shield size={12} /> {role}</span>;
}
function FollowUpBadge({ followUp }) {
  if (!followUp) return null;
  const cls = { pending: 'fu-badge-pending', contacted: 'fu-badge-contacted', completed: 'fu-badge-completed' };
  return <span className={`followup-badge ${cls[followUp.status] || ''}`}><PhoneForwarded size={12} /> Follow-up: {followUp.status}</span>;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

/* ===== DASHBOARD HOME TAB ===== */
function DashboardHomeTab({ onNavigate }) {
  const {
    appointments, clients, payments, expenses, prospects, leads,
    activityLog, notifications, markNotificationRead, deleteNotification,
  } = useAppContext();

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  // Today's appointments
  const todaysAppointments = appointments.filter((a) => a.date === today);
  const pendingToday = todaysAppointments.filter((a) => a.status === 'pending');
  const confirmedToday = todaysAppointments.filter((a) => a.status === 'confirmed');

  // Follow-ups due today/overdue
  const followUpsDueToday = appointments.filter((a) =>
    a.followUp &&
    a.followUp.status === 'pending' &&
    a.followUp.followUpDate === today
  );
  const overdueFollowUps = appointments.filter((a) =>
    a.followUp &&
    a.followUp.status === 'pending' &&
    a.followUp.followUpDate &&
    a.followUp.followUpDate < today
  );

  // Overdue invoices
  const overdueInvoices = useMemo(() => {
    const result = [];
    clients.forEach((client) => {
      (client.invoices || []).forEach((inv) => {
        if (inv.status === 'unpaid' && inv.dueDate && inv.dueDate < today) {
          result.push({ ...inv, clientId: client.id, clientName: client.name });
        }
      });
    });
    return result;
  }, [clients, today]);

  // Pending client requests
  const pendingClients = clients.filter((c) => c.status === 'pending');

  // Revenue this week vs last week
  const getWeekRevenue = (weeksAgo = 0) => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - (weeksAgo * 7));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return payments.filter((p) => {
      const d = new Date(p.createdAt);
      return d >= weekStart && d < weekEnd && p.status === 'completed';
    }).reduce((sum, p) => sum + p.amount, 0);
  };

  const thisWeekRevenue = getWeekRevenue(0);
  const lastWeekRevenue = getWeekRevenue(1);
  const revenueChange = lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue * 100).toFixed(1) : 0;

  // This month revenue
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthRevenue = payments.filter((p) => p.createdAt.startsWith(thisMonth) && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  // Active prospects
  const activeProspects = prospects.filter((p) => p.stage !== 'closed');
  const pipelineValue = activeProspects.reduce((sum, p) => sum + (p.dealValue || 0), 0);

  // Recent activity (last 10)
  const recentActivity = activityLog.slice(0, 10);

  // Unread notifications
  const unreadNotifications = notifications.filter((n) => !n.read);

  const formatCurrency = (num) => `$${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const getActivityIcon = (action) => {
    const icons = {
      invoice_created: <Receipt size={14} />,
      invoice_paid: <CreditCard size={14} />,
      client_created: <UserPlus size={14} />,
      project_completed: <CheckCircle size={14} />,
      time_entry_added: <Timer size={14} />,
      recurring_invoice_generated: <RefreshCw size={14} />,
    };
    return icons[action] || <Activity size={14} />;
  };

  const getActivityColor = (action) => {
    if (action.includes('paid') || action.includes('completed')) return 'var(--success)';
    if (action.includes('created') || action.includes('added')) return 'var(--primary)';
    return 'var(--gray-500)';
  };

  return (
    <div className="dashboard-home">
      {/* Alert Banner for urgent items */}
      {(overdueInvoices.length > 0 || overdueFollowUps.length > 0 || pendingClients.length > 0) && (
        <div className="dashboard-alerts">
          {overdueInvoices.length > 0 && (
            <div className="dashboard-alert warning" onClick={() => onNavigate && onNavigate('clients')}>
              <AlertCircle size={16} />
              <span>{overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''} need attention</span>
              <ArrowRight size={14} />
            </div>
          )}
          {overdueFollowUps.length > 0 && (
            <div className="dashboard-alert warning" onClick={() => onNavigate && onNavigate('follow-ups')}>
              <PhoneForwarded size={16} />
              <span>{overdueFollowUps.length} overdue follow-up{overdueFollowUps.length > 1 ? 's' : ''}</span>
              <ArrowRight size={14} />
            </div>
          )}
          {pendingClients.length > 0 && (
            <div className="dashboard-alert info" onClick={() => onNavigate && onNavigate('client-requests')}>
              <UserPlus size={16} />
              <span>{pendingClients.length} client registration{pendingClients.length > 1 ? 's' : ''} pending approval</span>
              <ArrowRight size={14} />
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon appointments"><CalendarDays size={24} /></div>
          <div className="dashboard-stat-content">
            <span className="dashboard-stat-label">Today's Appointments</span>
            <span className="dashboard-stat-value">{todaysAppointments.length}</span>
            <span className="dashboard-stat-sub">
              {pendingToday.length} pending, {confirmedToday.length} confirmed
            </span>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon revenue"><DollarSign size={24} /></div>
          <div className="dashboard-stat-content">
            <span className="dashboard-stat-label">This Week</span>
            <span className="dashboard-stat-value">{formatCurrency(thisWeekRevenue)}</span>
            <span className={`dashboard-stat-sub ${parseFloat(revenueChange) >= 0 ? 'positive' : 'negative'}`}>
              {parseFloat(revenueChange) >= 0 ? '+' : ''}{revenueChange}% vs last week
            </span>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon month"><TrendingUp size={24} /></div>
          <div className="dashboard-stat-content">
            <span className="dashboard-stat-label">This Month</span>
            <span className="dashboard-stat-value">{formatCurrency(monthRevenue)}</span>
            <span className="dashboard-stat-sub">{payments.filter((p) => p.createdAt.startsWith(thisMonth)).length} payments</span>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon pipeline"><Briefcase size={24} /></div>
          <div className="dashboard-stat-content">
            <span className="dashboard-stat-label">Pipeline Value</span>
            <span className="dashboard-stat-value">{formatCurrency(pipelineValue)}</span>
            <span className="dashboard-stat-sub">{activeProspects.length} active prospects</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content-grid">
        {/* Today's Schedule */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3><CalendarDays size={18} /> Today's Schedule</h3>
            <button className="btn btn-sm btn-outline" onClick={() => onNavigate && onNavigate('appointments')}>
              View All
            </button>
          </div>
          <div className="dashboard-card-content">
            {todaysAppointments.length === 0 ? (
              <div className="dashboard-empty">
                <CalendarDays size={32} />
                <p>No appointments today</p>
              </div>
            ) : (
              <div className="dashboard-schedule-list">
                {todaysAppointments.slice(0, 5).map((appt) => (
                  <div key={appt.id} className="dashboard-schedule-item">
                    <div className="dashboard-schedule-time">{appt.time}</div>
                    <div className="dashboard-schedule-info">
                      <strong>{appt.name}</strong>
                      <span>{appt.service || 'General'}</span>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                ))}
                {todaysAppointments.length > 5 && (
                  <p className="dashboard-more">+{todaysAppointments.length - 5} more</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Follow-ups Due */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3><PhoneForwarded size={18} /> Follow-ups Due</h3>
            <button className="btn btn-sm btn-outline" onClick={() => onNavigate && onNavigate('follow-ups')}>
              View All
            </button>
          </div>
          <div className="dashboard-card-content">
            {followUpsDueToday.length === 0 && overdueFollowUps.length === 0 ? (
              <div className="dashboard-empty">
                <CheckCircle size={32} />
                <p>All caught up!</p>
              </div>
            ) : (
              <div className="dashboard-followup-list">
                {overdueFollowUps.slice(0, 3).map((appt) => (
                  <div key={appt.id} className="dashboard-followup-item overdue">
                    <div className="dashboard-followup-icon"><AlertCircle size={16} /></div>
                    <div className="dashboard-followup-info">
                      <strong>{appt.name}</strong>
                      <span>Overdue: {formatDisplayDate(appt.followUp.followUpDate)}</span>
                    </div>
                  </div>
                ))}
                {followUpsDueToday.slice(0, 3).map((appt) => (
                  <div key={appt.id} className="dashboard-followup-item">
                    <div className="dashboard-followup-icon"><Clock size={16} /></div>
                    <div className="dashboard-followup-info">
                      <strong>{appt.name}</strong>
                      <span>Due today</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3><Receipt size={18} /> Overdue Invoices</h3>
            <span className="dashboard-card-badge warning">{overdueInvoices.length}</span>
          </div>
          <div className="dashboard-card-content">
            {overdueInvoices.length === 0 ? (
              <div className="dashboard-empty">
                <CheckCircle size={32} />
                <p>No overdue invoices</p>
              </div>
            ) : (
              <div className="dashboard-invoice-list">
                {overdueInvoices.slice(0, 4).map((inv) => (
                  <div key={inv.id} className="dashboard-invoice-item">
                    <div className="dashboard-invoice-info">
                      <strong>{inv.clientName}</strong>
                      <span>{inv.title}</span>
                    </div>
                    <div className="dashboard-invoice-amount">
                      <strong>${inv.amount.toLocaleString()}</strong>
                      <span className="overdue-days">
                        {Math.floor((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))} days overdue
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3><History size={18} /> Recent Activity</h3>
          </div>
          <div className="dashboard-card-content">
            {recentActivity.length === 0 ? (
              <div className="dashboard-empty">
                <Activity size={32} />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="dashboard-activity-list">
                {recentActivity.map((entry) => (
                  <div key={entry.id} className="dashboard-activity-item">
                    <div className="dashboard-activity-icon" style={{ color: getActivityColor(entry.action) }}>
                      {getActivityIcon(entry.action)}
                    </div>
                    <div className="dashboard-activity-info">
                      <span className="dashboard-activity-action">
                        {entry.action.replace(/_/g, ' ')}
                        {entry.details.clientName && <strong> - {entry.details.clientName}</strong>}
                        {entry.details.amount && <span> (${entry.details.amount.toLocaleString()})</span>}
                      </span>
                      <span className="dashboard-activity-time">
                        {new Date(entry.createdAt).toLocaleString()}
                        {entry.userName && ` by ${entry.userName}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-quick-actions">
        <h3><Zap size={18} /> Quick Actions</h3>
        <div className="dashboard-quick-actions-grid">
          <button className="quick-action-btn" onClick={() => onNavigate && onNavigate('appointments', { showForm: true })}>
            <CalendarDays size={20} />
            <span>New Appointment</span>
          </button>
          <button className="quick-action-btn" onClick={() => onNavigate && onNavigate('clients', { showForm: true })}>
            <UserPlus size={20} />
            <span>New Client</span>
          </button>
          <button className="quick-action-btn" onClick={() => onNavigate && onNavigate('pipeline', { showForm: true })}>
            <Briefcase size={20} />
            <span>New Prospect</span>
          </button>
          <button className="quick-action-btn" onClick={() => onNavigate && onNavigate('leads')}>
            <Search size={20} />
            <span>Find Leads</span>
          </button>
          <button className="quick-action-btn" onClick={() => onNavigate && onNavigate('expenses', { showForm: true })}>
            <Receipt size={20} />
            <span>Log Expense</span>
          </button>
          <button className="quick-action-btn" onClick={() => onNavigate && onNavigate('analytics')}>
            <BarChart3 size={20} />
            <span>View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== NOTIFICATIONS DROPDOWN ===== */
function NotificationsDropdown() {
  const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotifIcon = (type) => {
    const icons = {
      warning: <AlertCircle size={16} />,
      success: <CheckCircle size={16} />,
      error: <XCircle size={16} />,
      info: <Bell size={16} />,
    };
    return icons[type] || icons.info;
  };

  return (
    <div className="notifications-dropdown-wrapper">
      <button className="notifications-trigger" onClick={() => setIsOpen(!isOpen)}>
        {unreadCount > 0 ? <BellRing size={20} /> : <Bell size={20} />}
        {unreadCount > 0 && <span className="notifications-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <>
          <div className="notifications-backdrop" onClick={() => setIsOpen(false)} />
          <div className="notifications-dropdown">
            <div className="notifications-header">
              <h4>Notifications</h4>
              {notifications.length > 0 && (
                <button onClick={() => { markAllNotificationsRead(); }}>Mark all read</button>
              )}
            </div>
            <div className="notifications-list">
              {notifications.length === 0 ? (
                <div className="notifications-empty">
                  <Bell size={24} />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notif) => (
                  <div
                    key={notif.id}
                    className={`notification-item ${notif.read ? 'read' : 'unread'} ${notif.type}`}
                    onClick={() => markNotificationRead(notif.id)}
                  >
                    <div className="notification-icon">{getNotifIcon(notif.type)}</div>
                    <div className="notification-content">
                      <strong>{notif.title}</strong>
                      <p>{notif.message}</p>
                      <span className="notification-time">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      className="notification-delete"
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div className="notifications-footer">
                <button onClick={() => { clearAllNotifications(); setIsOpen(false); }}>
                  Clear all
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ===== TIME TRACKING COMPONENT ===== */
function TimeTracker({ clientId, projectId, taskId }) {
  const { addTimeEntry, timeEntries, currentUser } = useAppContext();
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ hours: '', description: '', date: new Date().toISOString().split('T')[0] });

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setStartTime(Date.now());
    setIsTracking(true);
    setElapsed(0);
  };

  const handleStop = () => {
    if (elapsed > 60) { // Only save if more than 1 minute
      const hours = (elapsed / 3600).toFixed(2);
      addTimeEntry({
        clientId,
        projectId,
        taskId,
        hours: parseFloat(hours),
        description: 'Time tracked',
        date: new Date().toISOString().split('T')[0],
        billable: true,
      });
    }
    setIsTracking(false);
    setStartTime(null);
    setElapsed(0);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualForm.hours) return;
    addTimeEntry({
      clientId,
      projectId,
      taskId,
      hours: parseFloat(manualForm.hours),
      description: manualForm.description,
      date: manualForm.date,
      billable: true,
    });
    setManualForm({ hours: '', description: '', date: new Date().toISOString().split('T')[0] });
    setShowManual(false);
  };

  // Get total hours for this project
  const projectHours = timeEntries
    .filter((e) => e.projectId === projectId)
    .reduce((sum, e) => sum + e.hours, 0);

  return (
    <div className="time-tracker">
      <div className="time-tracker-header">
        <Timer size={16} />
        <span>Time Tracking</span>
        <span className="time-tracker-total">{projectHours.toFixed(1)}h logged</span>
      </div>

      <div className="time-tracker-controls">
        {isTracking ? (
          <>
            <div className="time-tracker-display">{formatTime(elapsed)}</div>
            <button className="btn btn-sm btn-danger" onClick={handleStop}>
              <StopCircle size={14} /> Stop
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-sm btn-primary" onClick={handleStart}>
              <PlayCircle size={14} /> Start Timer
            </button>
            <button className="btn btn-sm btn-outline" onClick={() => setShowManual(!showManual)}>
              <Plus size={14} /> Manual Entry
            </button>
          </>
        )}
      </div>

      {showManual && (
        <form onSubmit={handleManualSubmit} className="time-tracker-form">
          <div className="time-tracker-form-row">
            <input
              type="number"
              step="0.25"
              min="0"
              placeholder="Hours"
              value={manualForm.hours}
              onChange={(e) => setManualForm({ ...manualForm, hours: e.target.value })}
              required
            />
            <input
              type="date"
              value={manualForm.date}
              onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
            />
          </div>
          <input
            type="text"
            placeholder="Description (optional)"
            value={manualForm.description}
            onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
          />
          <div className="time-tracker-form-actions">
            <button type="submit" className="btn btn-sm btn-primary">Add</button>
            <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowManual(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ===== CALENDAR EXPORT ===== */
function generateICalEvent(appointment) {
  const startDate = new Date(`${appointment.date}T${appointment.time}`);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

  const formatICalDate = (date) => {
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

function exportToICal(appointments, filename = 'appointments.ics') {
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

/* ===== PROJECT MANAGEMENT (VIP) ===== */
function KanbanCard({ task, client, project, canManage }) {
  const { updateProjectTask, deleteProjectTask } = useAppContext();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: task.title,
    goal: task.goal || '',
    assignee: task.assignee || '',
    dueDate: task.dueDate || '',
    priority: task.priority || 'normal',
  });

  const handleSave = () => {
    updateProjectTask(client.id, project.id, task.id, editForm);
    setEditing(false);
  };

  const priorityColors = { low: '#9ca3af', normal: '#3b82f6', high: '#f59e0b', urgent: '#ef4444' };

  if (editing && canManage) {
    return (
      <div className="kanban-card editing">
        <div className="kanban-edit-form">
          <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Task title" className="kanban-edit-title" />
          <textarea value={editForm.goal} onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })} placeholder="Goal / description — what does 'done' look like?" rows={2} className="kanban-edit-goal" />
          <div className="kanban-edit-row">
            <input type="text" value={editForm.assignee} onChange={(e) => setEditForm({ ...editForm, assignee: e.target.value })} placeholder="Assignee" />
            <input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} />
            <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="kanban-edit-actions">
            <button className="btn btn-sm btn-primary" onClick={handleSave}>Save</button>
            <button className="btn btn-sm btn-outline" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kanban-card">
      {task.priority && task.priority !== 'normal' && (
        <div className="kanban-priority-bar" style={{ background: priorityColors[task.priority] }} />
      )}
      <div className="kanban-card-title">
        <GripVertical size={14} className="grip" />
        <span>{task.title}</span>
        {canManage && (
          <button className="kanban-edit-btn" onClick={() => { setEditForm({ title: task.title, goal: task.goal || '', assignee: task.assignee || '', dueDate: task.dueDate || '', priority: task.priority || 'normal' }); setEditing(true); }}>
            <Edit3 size={12} />
          </button>
        )}
      </div>
      {task.goal && <p className="kanban-goal">{task.goal}</p>}
      <div className="kanban-card-meta">
        {task.assignee && <span className="kanban-assignee"><User size={12} /> {task.assignee}</span>}
        {task.dueDate && <span className="kanban-due"><CalendarDays size={12} /> {formatDisplayDate(task.dueDate)}</span>}
        {task.priority && task.priority !== 'normal' && (
          <span className="kanban-priority-tag" style={{ color: priorityColors[task.priority] }}>
            <Flag size={11} /> {task.priority}
          </span>
        )}
      </div>
      {canManage && (
        <div className="kanban-card-actions">
          {task.status !== 'todo' && (
            <button onClick={() => updateProjectTask(client.id, project.id, task.id, { status: task.status === 'done' ? 'in-progress' : 'todo' })}>
              <ChevronLeft size={14} />
            </button>
          )}
          {task.status !== 'done' && (
            <button onClick={() => updateProjectTask(client.id, project.id, task.id, { status: task.status === 'todo' ? 'in-progress' : 'done' })}>
              <ArrowRight size={14} />
            </button>
          )}
          <button className="kanban-delete" onClick={() => deleteProjectTask(client.id, project.id, task.id)}>
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ colKey, label, color, items, client, project, canManage }) {
  const { addProjectTask } = useAppContext();
  const [adding, setAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');

  const handleQuickAdd = () => {
    if (!quickTitle.trim()) return;
    addProjectTask(client.id, project.id, { title: quickTitle, status: colKey });
    setQuickTitle('');
    setAdding(false);
  };

  return (
    <div className="kanban-column">
      <div className="kanban-col-header">
        <div className="kanban-col-dot" style={{ background: color }} />
        <span>{label}</span>
        <span className="kanban-count">{items.length}</span>
        {canManage && (
          <button className="kanban-col-add" onClick={() => setAdding(!adding)} title={`Add task to ${label}`}>
            <Plus size={14} />
          </button>
        )}
      </div>
      {adding && (
        <div className="kanban-quick-add">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder={`Add task to ${label}...`}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAdd(); if (e.key === 'Escape') setAdding(false); }}
            autoFocus
          />
          <div className="kanban-quick-actions">
            <button className="btn btn-sm btn-primary" onClick={handleQuickAdd} disabled={!quickTitle.trim()}>Add</button>
            <button className="btn btn-sm btn-outline" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div className="kanban-cards">
        {items.length === 0 && !adding && <p className="kanban-empty">No tasks</p>}
        {items.map((task) => (
          <KanbanCard key={task.id} task={task} client={client} project={project} canManage={canManage} />
        ))}
      </div>
    </div>
  );
}

function ProjectBoard({ client: clientProp }) {
  const {
    addProject, updateProject, deleteProject,
    addProjectTask, updateProjectTask, deleteProjectTask,
    addMilestone, toggleMilestone, deleteMilestone,
    assignDeveloperToProject, removeDeveloperFromProject, completeProject,
    hasPermission, users, clients,
  } = useAppContext();
  const canManage = hasPermission('manage_clients');

  // Get live client data from context to ensure we have the latest projects
  const client = clients.find((c) => c.id === clientProp?.id) || clientProp;

  const [showNewProject, setShowNewProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ title: '', description: '', startDate: '', dueDate: '', developers: [] });
  const [activeProject, setActiveProject] = useState(null);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', dueDate: '' });
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionOptions, setCompletionOptions] = useState({
    archive: true,
    createFollowUp: false,
    followUpDate: '',
    followUpNote: '',
    createInvoice: false,
    invoiceTitle: '',
    invoiceAmount: '',
  });
  const [showDevDropdown, setShowDevDropdown] = useState(false);

  // Staff members for developer assignment
  const staffMembers = users.filter((u) => u.status === 'approved' && ['admin', 'manager', 'staff'].includes(u.role));

  const projects = client?.projects || [];
  const project = activeProject ? projects.find((p) => p.id === activeProject) : null;

  // Reset activeProject if the project no longer exists in this client
  useEffect(() => {
    if (activeProject && projects.length > 0 && !projects.find((p) => p.id === activeProject)) {
      setActiveProject(null);
    }
  }, [activeProject, projects]);

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!projectForm.title.trim()) return;
    addProject(client.id, projectForm);
    setProjectForm({ title: '', description: '', startDate: '', dueDate: '', developers: [] });
    setShowNewProject(false);
  };

  const handleAddMilestone = (e) => {
    e.preventDefault();
    if (!milestoneForm.title.trim()) return;
    addMilestone(client.id, project.id, milestoneForm);
    setMilestoneForm({ title: '', dueDate: '' });
    setShowMilestoneForm(false);
  };

  const handleCompleteProject = () => {
    completeProject(client.id, project.id, {
      archive: completionOptions.archive,
      createFollowUp: completionOptions.createFollowUp,
      followUpData: completionOptions.createFollowUp ? {
        date: completionOptions.followUpDate,
        note: completionOptions.followUpNote || `Follow-up for ${project.title}`,
      } : null,
      createInvoice: completionOptions.createInvoice,
      invoiceData: completionOptions.createInvoice ? {
        title: completionOptions.invoiceTitle || `Final Invoice - ${project.title}`,
        amount: parseFloat(completionOptions.invoiceAmount) || 0,
      } : null,
    });
    setShowCompletionModal(false);
    setCompletionOptions({ archive: true, createFollowUp: false, followUpDate: '', followUpNote: '', createInvoice: false, invoiceTitle: '', invoiceAmount: '' });
    if (completionOptions.archive) {
      setActiveProject(null);
    }
  };

  const getProgress = (p) => {
    const tasks = p.tasks || [];
    if (!tasks.length) return 0;
    const done = tasks.filter((t) => t.status === 'done').length;
    return Math.round((done / tasks.length) * 100);
  };

  const statusColors = {
    planning: '#6366f1',
    'in-progress': '#0ea5e9',
    review: '#f59e0b',
    completed: '#22c55e',
    archived: '#9ca3af',
  };

  const getDevById = (id) => staffMembers.find((u) => u.id === id);

  // Project detail view
  if (project) {
    const progress = getProgress(project);
    const tasks = project.tasks || [];
    const todoTasks = tasks.filter((t) => t.status === 'todo');
    const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
    const doneTasks = tasks.filter((t) => t.status === 'done');
    const projectDevs = (project.developers || []).map(getDevById).filter(Boolean);

    return (
      <div className="project-detail">
        {/* Completion Modal */}
        {showCompletionModal && (
          <div className="completion-modal-overlay" onClick={() => setShowCompletionModal(false)}>
            <div className="completion-modal" onClick={(e) => e.stopPropagation()}>
              <button className="completion-modal-close" onClick={() => setShowCompletionModal(false)}><X size={20} /></button>
              <h3><CheckCircle size={20} /> Complete Project</h3>
              <p className="completion-modal-desc">Choose what happens when this project is completed:</p>

              <div className="completion-options">
                <label className="completion-option">
                  <input type="checkbox" checked={completionOptions.archive} onChange={(e) => setCompletionOptions({ ...completionOptions, archive: e.target.checked })} />
                  <div>
                    <strong>Archive Project</strong>
                    <span>Move project to archived status</span>
                  </div>
                </label>

                <label className="completion-option">
                  <input type="checkbox" checked={completionOptions.createFollowUp} onChange={(e) => setCompletionOptions({ ...completionOptions, createFollowUp: e.target.checked })} />
                  <div>
                    <strong>Schedule Follow-Up</strong>
                    <span>Create a maintenance/check-in appointment</span>
                  </div>
                </label>
                {completionOptions.createFollowUp && (
                  <div className="completion-sub-options">
                    <input type="date" value={completionOptions.followUpDate} onChange={(e) => setCompletionOptions({ ...completionOptions, followUpDate: e.target.value })} placeholder="Follow-up date" />
                    <input type="text" value={completionOptions.followUpNote} onChange={(e) => setCompletionOptions({ ...completionOptions, followUpNote: e.target.value })} placeholder="Follow-up note (optional)" />
                  </div>
                )}

                <label className="completion-option">
                  <input type="checkbox" checked={completionOptions.createInvoice} onChange={(e) => setCompletionOptions({ ...completionOptions, createInvoice: e.target.checked })} />
                  <div>
                    <strong>Create Final Invoice</strong>
                    <span>Generate a closing invoice for the project</span>
                  </div>
                </label>
                {completionOptions.createInvoice && (
                  <div className="completion-sub-options">
                    <input type="text" value={completionOptions.invoiceTitle} onChange={(e) => setCompletionOptions({ ...completionOptions, invoiceTitle: e.target.value })} placeholder={`Final Invoice - ${project.title}`} />
                    <input type="number" step="0.01" value={completionOptions.invoiceAmount} onChange={(e) => setCompletionOptions({ ...completionOptions, invoiceAmount: e.target.value })} placeholder="Amount ($)" />
                  </div>
                )}
              </div>

              <div className="completion-modal-actions">
                <button className="btn btn-primary" onClick={handleCompleteProject}>
                  <CheckCircle size={16} /> Complete Project
                </button>
                <button className="btn btn-outline" onClick={() => setShowCompletionModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <button className="btn btn-sm btn-outline" onClick={() => setActiveProject(null)}>
          <ChevronLeft size={16} /> Back to Projects
        </button>

        <div className="project-detail-header">
          <div>
            <h3>{project.title}</h3>
            {project.description && <p>{project.description}</p>}
            <div className="project-dates">
              {project.startDate && <span><CalendarDays size={12} /> Start: {formatDisplayDate(project.startDate)}</span>}
              {project.dueDate && <span><CalendarDays size={12} /> Due: {formatDisplayDate(project.dueDate)}</span>}
            </div>
          </div>
          <div className="project-detail-actions">
            {canManage && project.status !== 'archived' && (
              <select
                value={project.status}
                onChange={(e) => {
                  if (e.target.value === 'completed') {
                    setShowCompletionModal(true);
                  } else {
                    updateProject(client.id, project.id, { status: e.target.value });
                  }
                }}
                className="filter-select"
              >
                <option value="planning">Planning</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            )}
            <span className="project-status-pill" style={{ background: statusColors[project.status] }}>
              {project.status}
            </span>
          </div>
        </div>

        {/* Assigned Developers */}
        <div className="project-developers-section">
          <div className="project-section-header">
            <h4><Users size={16} /> Assigned Developers</h4>
          </div>
          <div className="project-developers-list">
            {projectDevs.length === 0 && <span className="text-muted">No developers assigned</span>}
            {projectDevs.map((dev) => (
              <div key={dev.id} className="project-dev-chip" style={{ borderColor: dev.color }}>
                <div className="project-dev-avatar" style={{ background: dev.color }}>{dev.name.charAt(0).toUpperCase()}</div>
                <span>{dev.name}</span>
                {canManage && (
                  <button className="project-dev-remove" onClick={() => removeDeveloperFromProject(client.id, project.id, dev.id)}>
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
            {canManage && (
              <div className="project-dev-add-wrapper">
                <button className="project-dev-add-btn" onClick={() => setShowDevDropdown(!showDevDropdown)}>
                  <Plus size={14} /> Add
                </button>
                {showDevDropdown && (
                  <div className="project-dev-dropdown">
                    {staffMembers.filter((u) => !(project.developers || []).includes(u.id)).map((u) => (
                      <button key={u.id} onClick={() => { assignDeveloperToProject(client.id, project.id, u.id); setShowDevDropdown(false); }}>
                        <div className="project-dev-avatar sm" style={{ background: u.color }}>{u.name.charAt(0).toUpperCase()}</div>
                        {u.name}
                      </button>
                    ))}
                    {staffMembers.filter((u) => !(project.developers || []).includes(u.id)).length === 0 && (
                      <span className="text-muted">All staff assigned</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="project-progress">
          <div className="progress-info">
            <span>Overall Progress</span>
            <strong>{progress}%</strong>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-stats">
            <span>{todoTasks.length} To Do</span>
            <span>{inProgressTasks.length} In Progress</span>
            <span>{doneTasks.length} Done</span>
          </div>
        </div>

        {/* Milestones */}
        <div className="project-section">
          <div className="project-section-header">
            <h4><Milestone size={16} /> Milestones</h4>
            {canManage && (
              <button className="btn btn-sm btn-outline" onClick={() => setShowMilestoneForm(!showMilestoneForm)}>
                <Plus size={14} /> {showMilestoneForm ? 'Cancel' : 'Add'}
              </button>
            )}
          </div>
          {showMilestoneForm && (
            <form onSubmit={handleAddMilestone} className="inline-form">
              <input type="text" placeholder="Milestone title" value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} required />
              <input type="date" value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })} />
              <button type="submit" className="btn btn-sm btn-primary">Add</button>
            </form>
          )}
          {(project.milestones || []).length === 0 ? (
            <p className="text-muted">No milestones yet</p>
          ) : (
            <div className="milestones-list">
              {(project.milestones || []).map((m) => (
                <div key={m.id} className={`milestone-item ${m.completed ? 'completed' : ''}`}>
                  <button className="milestone-check" onClick={() => canManage && toggleMilestone(client.id, project.id, m.id)} disabled={!canManage}>
                    {m.completed ? <CircleCheckBig size={18} /> : <Circle size={18} />}
                  </button>
                  <div className="milestone-info">
                    <span className={m.completed ? 'line-through' : ''}>{m.title}</span>
                    {m.dueDate && <small>Due: {formatDisplayDate(m.dueDate)}</small>}
                  </div>
                  {canManage && <button className="note-delete" onClick={() => deleteMilestone(client.id, project.id, m.id)}><Trash2 size={13} /></button>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kanban Board */}
        <div className="project-section">
          <div className="project-section-header">
            <h4><ListTodo size={16} /> Tasks</h4>
          </div>
          <div className="kanban-board">
            {[
              { key: 'todo', label: 'To Do', color: '#6366f1', items: todoTasks },
              { key: 'in-progress', label: 'In Progress', color: '#0ea5e9', items: inProgressTasks },
              { key: 'done', label: 'Done', color: '#22c55e', items: doneTasks },
            ].map((col) => (
              <KanbanColumn
                key={col.key}
                colKey={col.key}
                label={col.label}
                color={col.color}
                items={col.items}
                client={client}
                project={project}
                canManage={canManage}
              />
            ))}
          </div>
        </div>

        {/* Time Tracking */}
        <TimeTracker clientId={client.id} projectId={project.id} />

        {/* Project Actions */}
        {canManage && project.status !== 'archived' && (
          <div className="project-actions-footer">
            {project.status === 'review' && (
              <button className="btn btn-confirm" onClick={() => setShowCompletionModal(true)}>
                <CheckCircle size={16} /> Mark Complete
              </button>
            )}
            <button className="btn btn-outline-danger" onClick={() => { updateProject(client.id, project.id, { status: 'archived' }); setActiveProject(null); }}>
              Archive Project
            </button>
          </div>
        )}
      </div>
    );
  }

  // Projects list
  const activeProjects = projects.filter((p) => p.status !== 'archived');
  const archivedProjects = projects.filter((p) => p.status === 'archived');

  return (
    <div className="projects-list-section">
      <div className="project-section-header">
        <h4><FolderKanban size={18} /> Projects</h4>
        {canManage && (
          <button className="btn btn-sm btn-primary" onClick={() => setShowNewProject(!showNewProject)}>
            <Plus size={14} /> {showNewProject ? 'Cancel' : 'New Project'}
          </button>
        )}
      </div>
      {showNewProject && (
        <form onSubmit={handleAddProject} className="um-form-card project-form" style={{ marginBottom: 16 }}>
          <div className="form-group"><label>Project Title *</label><input type="text" value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} required /></div>
          <div className="form-group"><label>Description</label><textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} rows={2} /></div>
          <div className="form-row">
            <div className="form-group"><label>Start Date</label><input type="date" value={projectForm.startDate} onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })} /></div>
            <div className="form-group"><label>Due Date</label><input type="date" value={projectForm.dueDate} onChange={(e) => setProjectForm({ ...projectForm, dueDate: e.target.value })} /></div>
          </div>
          <div className="form-group">
            <label>Assign Developers</label>
            <div className="project-dev-multi-select">
              {staffMembers.map((u) => (
                <label key={u.id} className={`dev-checkbox ${projectForm.developers.includes(u.id) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={projectForm.developers.includes(u.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setProjectForm({ ...projectForm, developers: [...projectForm.developers, u.id] });
                      } else {
                        setProjectForm({ ...projectForm, developers: projectForm.developers.filter((id) => id !== u.id) });
                      }
                    }}
                  />
                  <div className="project-dev-avatar sm" style={{ background: u.color }}>{u.name.charAt(0).toUpperCase()}</div>
                  <span>{u.name}</span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-sm btn-primary">Create Project</button>
        </form>
      )}
      {activeProjects.length === 0 && !showNewProject ? (
        <div className="empty-state-sm"><p>No active projects. Create one to start tracking work.</p></div>
      ) : (
        <div className="projects-grid">
          {activeProjects.map((p) => {
            const prog = getProgress(p);
            const devs = (p.developers || []).map(getDevById).filter(Boolean);
            return (
              <div key={p.id} className="project-card" onClick={() => setActiveProject(p.id)}>
                <div className="project-card-header">
                  <h5>{p.title}</h5>
                  <span className="project-status-pill" style={{ background: statusColors[p.status] }}>{p.status}</span>
                </div>
                {p.description && <p className="project-card-desc">{p.description}</p>}
                {devs.length > 0 && (
                  <div className="project-card-devs">
                    {devs.slice(0, 3).map((dev) => (
                      <div key={dev.id} className="project-dev-avatar sm" style={{ background: dev.color }} title={dev.name}>
                        {dev.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {devs.length > 3 && <span className="project-dev-more">+{devs.length - 3}</span>}
                  </div>
                )}
                <div className="project-card-progress">
                  <div className="progress-bar sm"><div className="progress-fill" style={{ width: `${prog}%` }} /></div>
                  <span>{prog}%</span>
                </div>
                <div className="project-card-footer">
                  <span>{(p.tasks || []).length} tasks</span>
                  <span>{(p.milestones || []).length} milestones</span>
                  {p.dueDate && <span><CalendarDays size={11} /> {formatDisplayDate(p.dueDate)}</span>}
                </div>
                {canManage && (
                  <button className="project-card-delete" onClick={(e) => { e.stopPropagation(); deleteProject(client.id, p.id); }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Archived Projects */}
      {archivedProjects.length > 0 && (
        <div className="archived-projects-section">
          <h5 className="archived-header"><FolderKanban size={14} /> Archived Projects ({archivedProjects.length})</h5>
          <div className="projects-grid archived">
            {archivedProjects.map((p) => {
              const prog = getProgress(p);
              return (
                <div key={p.id} className="project-card archived">
                  <div className="project-card-header">
                    <h5>{p.title}</h5>
                    <span className="project-status-pill" style={{ background: statusColors[p.status] }}>{p.status}</span>
                  </div>
                  <div className="project-card-progress">
                    <div className="progress-bar sm"><div className="progress-fill" style={{ width: `${prog}%` }} /></div>
                    <span>{prog}%</span>
                  </div>
                  <div className="project-card-footer">
                    <span>{(p.tasks || []).length} tasks</span>
                    {p.completedAt && <span>Completed {new Date(p.completedAt).toLocaleDateString()}</span>}
                  </div>
                  {canManage && (
                    <div className="archived-project-actions">
                      <button
                        className="btn btn-sm btn-confirm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateProject(client.id, p.id, { status: 'completed', restoredAt: new Date().toISOString() });
                        }}
                        title="Restore project"
                      >
                        <RefreshCw size={14} /> Restore
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(client.id, p.id);
                        }}
                        title="Delete permanently"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== FOLLOW-UPS TAB ===== */
function FollowUpsTab() {
  const { appointments, markFollowUp, updateFollowUp, addFollowUpNote, deleteFollowUpNote, addProspect, updateAppointment, hasPermission, currentUser, deleteAppointment, users, assignAppointment, STAFF_COLORS } = useAppContext();
  const canManage = hasPermission('manage_appointments');
  const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'manager';
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

  // Show confirmed appointments that need follow-up, plus ALL appointments that have follow-ups
  const confirmedAppts = appointments.filter((a) => a.status === 'confirmed');
  const needsFollowUp = confirmedAppts.filter((a) => !a.followUp && !a.sentToPipeline);
  const withFollowUp = appointments.filter((a) => a.followUp && !a.sentToPipeline);
  const filteredFollowUps = filterFU === 'all'
    ? withFollowUp.filter((a) => a.followUp.status !== 'archived')
    : withFollowUp.filter((a) => a.followUp.status === filterFU);

  // Staff members for kanban
  const staffMembers = users.filter((u) => u.status === 'approved' && ['admin', 'manager', 'staff'].includes(u.role));

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
      updateAppointment(apptId, { sentToPipeline: true });
      setConvertMsg('Added to pipeline successfully!');
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
            {filteredFollowUps.map((appt) => (
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
                      {(() => {
                        const uniqueLeadNotes = appt.leadNotes?.filter((n, i, arr) => arr.findIndex((x) => x.id === n.id) === i) || [];
                        const leadNoteIds = new Set(uniqueLeadNotes.map((n) => n.id));
                        const uniqueFollowUpNotes = (appt.followUp.notes || []).filter((n) => !leadNoteIds.has(n.id));
                        const totalNotes = uniqueLeadNotes.length + uniqueFollowUpNotes.length;
                        return totalNotes > 0 ? `${totalNotes} Note${totalNotes > 1 ? 's' : ''}` : 'Add Notes';
                      })()}
                      {expandedNotes[appt.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {expandedNotes[appt.id] && (
                      <div className="fu-notes-list">
                        {/* Lead Notes (from prospecting) - deduplicated */}
                        {(() => {
                          const uniqueLeadNotes = appt.leadNotes?.filter((n, i, arr) => arr.findIndex((x) => x.id === n.id) === i) || [];
                          return uniqueLeadNotes.length > 0 && (
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
                          );
                        })()}
                        {/* Follow-up Notes (exclude any that are already in leadNotes) */}
                        {(() => {
                          const leadNoteIds = new Set((appt.leadNotes || []).map((n) => n.id));
                          const uniqueFollowUpNotes = (appt.followUp.notes || []).filter((n) => !leadNoteIds.has(n.id));
                          return uniqueFollowUpNotes.map((n) => (
                            <div key={n.id} className="fu-note-item">
                              <div className="fu-note-content">
                                <p>{n.text}</p>
                                <span className="fu-note-meta">{n.author} · {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              {canManage && (
                                <button className="fu-note-delete" onClick={() => deleteFollowUpNote(appt.id, n.id)} title="Delete note"><Trash2 size={12} /></button>
                              )}
                            </div>
                          ));
                        })()}
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
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}

/* ===== PIPELINE TAB ===== */
function PipelineTab() {
  const {
    prospects, addProspect, updateProspect, deleteProspect,
    addProspectNote, deleteProspectNote, closeProspect, reopenProspect,
    convertProspectToClient, PROSPECT_STAGES, LOSS_REASONS, currentUser,
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
    const total = prospects.length;
    const active = activeProspects.length;
    const won = closedProspects.filter((p) => p.outcome === 'won').length;
    const lost = closedProspects.filter((p) => p.outcome === 'lost').length;
    const deferred = closedProspects.filter((p) => p.outcome === 'deferred').length;
    const conversionRate = (won + lost) > 0 ? ((won / (won + lost)) * 100).toFixed(1) : 0;
    const pipelineValue = activeProspects.reduce((sum, p) => sum + (parseFloat(p.dealValue) || 0), 0);
    const weightedValue = activeProspects.reduce((sum, p) => sum + ((parseFloat(p.dealValue) || 0) * (p.probability / 100)), 0);

    // Average deal time (for won deals)
    const wonDeals = closedProspects.filter((p) => p.outcome === 'won' && p.closedAt);
    const avgDealTime = wonDeals.length > 0
      ? Math.round(wonDeals.reduce((sum, p) => sum + ((new Date(p.closedAt) - new Date(p.createdAt)) / (1000 * 60 * 60 * 24)), 0) / wonDeals.length)
      : 0;

    // Loss reasons breakdown
    const lossReasons = {};
    closedProspects.filter((p) => p.outcome === 'lost').forEach((p) => {
      const reason = p.lossReason || 'other';
      lossReasons[reason] = (lossReasons[reason] || 0) + 1;
    });

    // Upcoming revisits
    const today = new Date().toISOString().split('T')[0];
    const upcomingRevisits = closedProspects
      .filter((p) => p.outcome === 'deferred' && p.revisitDate && p.revisitDate <= today)
      .sort((a, b) => a.revisitDate.localeCompare(b.revisitDate));

    // Stage counts
    const stageCounts = {};
    PROSPECT_STAGES.forEach((s) => {
      stageCounts[s.value] = activeProspects.filter((p) => p.stage === s.value).length;
    });

    return { total, active, won, lost, deferred, conversionRate, pipelineValue, weightedValue, avgDealTime, lossReasons, upcomingRevisits, stageCounts };
  }, [prospects, activeProspects, closedProspects, PROSPECT_STAGES]);

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
              <button className="modal-close" onClick={() => setShowAddForm(false)}><X size={20} /></button>
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
              <button className="detail-close" onClick={() => setSelectedProspect(null)}><X size={20} /></button>
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
                  <button className="modal-close" onClick={() => setViewingDoc(null)}><X size={20} /></button>
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

/* ===== CLIENT REQUESTS TAB ===== */
function ClientRequestsTab() {
  const { clients, approveClient, rejectClient } = useAppContext();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectConfirm, setRejectConfirm] = useState(null);

  const pendingClients = clients.filter((c) => c.status === 'pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleApprove = (id) => {
    approveClient(id);
    setSelectedRequest(null);
  };

  const handleReject = (id) => {
    rejectClient(id);
    setRejectConfirm(null);
    setSelectedRequest(null);
  };

  const selected = selectedRequest ? pendingClients.find((c) => c.id === selectedRequest) : null;

  return (
    <div className="client-requests-tab">
      <div className="requests-header">
        <h2><UserPlus size={20} /> Client Requests</h2>
        <p>{pendingClients.length} pending registration{pendingClients.length !== 1 ? 's' : ''}</p>
      </div>

      {pendingClients.length === 0 ? (
        <div className="requests-empty">
          <UserCheck size={48} />
          <h3>No pending requests</h3>
          <p>New client registrations will appear here for approval</p>
        </div>
      ) : (
        <div className="requests-layout">
          <div className="requests-list">
            {pendingClients.map((client) => (
              <div
                key={client.id}
                className={`request-card ${selectedRequest === client.id ? 'selected' : ''}`}
                onClick={() => setSelectedRequest(client.id)}
              >
                <div className="request-card-header">
                  <div className="request-avatar">{client.name.charAt(0).toUpperCase()}</div>
                  <div className="request-info">
                    <strong>{client.name}</strong>
                    <span>{client.email}</span>
                  </div>
                </div>
                <div className="request-meta">
                  <span><Clock size={12} /> {new Date(client.createdAt).toLocaleDateString()}</span>
                  {client.businessName && <span><Building2 size={12} /> {client.businessName}</span>}
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div className="request-detail">
              <div className="request-detail-header">
                <div className="request-detail-avatar">{selected.name.charAt(0).toUpperCase()}</div>
                <div>
                  <h3>{selected.name}</h3>
                  <span className="request-pending-badge">Pending Approval</span>
                </div>
              </div>

              <div className="request-detail-section">
                <h4>Contact Information</h4>
                <div className="request-detail-grid">
                  <div className="request-field">
                    <label><Mail size={14} /> Email</label>
                    <span>{selected.email}</span>
                  </div>
                  {selected.phone && (
                    <div className="request-field">
                      <label><Phone size={14} /> Phone</label>
                      <span>{selected.phone}</span>
                    </div>
                  )}
                  {selected.businessName && (
                    <div className="request-field">
                      <label><Building2 size={14} /> Business</label>
                      <span>{selected.businessName}</span>
                    </div>
                  )}
                </div>
              </div>

              {(selected.street || selected.city) && (
                <div className="request-detail-section">
                  <h4>Address</h4>
                  <p className="request-address">
                    {selected.street && <>{selected.street}<br /></>}
                    {selected.city && <>{selected.city}, {selected.state} {selected.zip}</>}
                  </p>
                </div>
              )}

              <div className="request-detail-section">
                <h4>Registration Details</h4>
                <div className="request-detail-grid">
                  <div className="request-field">
                    <label>Registered</label>
                    <span>{new Date(selected.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="request-field">
                    <label>Auth Method</label>
                    <span>{selected.authMethod === 'google' ? 'Google Account' : 'Email/Password'}</span>
                  </div>
                  <div className="request-field">
                    <label>Source</label>
                    <span>{selected.source || 'Self-registration'}</span>
                  </div>
                </div>
              </div>

              <div className="request-actions">
                {rejectConfirm === selected.id ? (
                  <div className="reject-confirm">
                    <span>Reject this request?</span>
                    <button className="btn btn-danger btn-sm" onClick={() => handleReject(selected.id)}>
                      <XCircle size={14} /> Confirm Reject
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => setRejectConfirm(null)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <button className="btn btn-primary" onClick={() => handleApprove(selected.id)}>
                      <CheckCircle size={16} /> Approve Client
                    </button>
                    <button className="btn btn-outline-danger" onClick={() => setRejectConfirm(selected.id)}>
                      <XCircle size={16} /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ===== CLIENTS TAB ===== */
function TierBadge({ tier }) {
  const { SUBSCRIPTION_TIERS } = useAppContext();
  const t = tier || 'free';
  const info = SUBSCRIPTION_TIERS[t] || SUBSCRIPTION_TIERS.free;
  return <span className="tier-badge" style={{ background: info.color }}>{info.label}</span>;
}

function ClientsTab() {
  const {
    clients, updateClient, addClientNote, deleteClientNote,
    addClientTag, removeClientTag, archiveClient, restoreClient, permanentlyDeleteClient, addClientManually,
    hasPermission, appointments, updateAppointment, updateFollowUp, markFollowUp,
    currentUser, users, STAFF_COLORS,
    addInvoice, updateInvoice, markInvoicePaid, unmarkInvoicePaid, deleteInvoice,
    updateClientTier, payments, SUBSCRIPTION_TIERS, RECURRING_FREQUENCIES,
    assignDeveloperToProject, removeDeveloperFromProject, completeProject,
    addClientDocument, deleteClientDocument, DOCUMENT_TYPES,
  } = useAppContext();
  const canManage = hasPermission('manage_clients');
  const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const [selectedClient, setSelectedClient] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', service: '' });
  const [addError, setAddError] = useState('');
  const [confirmArchive, setConfirmArchive] = useState(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState(null);
  const [showArchivedClients, setShowArchivedClients] = useState(false);
  const [filterTier, setFilterTier] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ title: '', amount: '', dueDate: '', description: '', recurring: false, frequency: 'monthly' });
  const [invoiceError, setInvoiceError] = useState('');
  const [editingClient, setEditingClient] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', businessName: '', phone: '', street: '', city: '', state: '', zip: '', dateOfBirth: '' });
  const [editSuccess, setEditSuccess] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [draggedClient, setDraggedClient] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [editingAppt, setEditingAppt] = useState(null);
  const [apptEditForm, setApptEditForm] = useState({ date: '', time: '', service: '', status: '', message: '' });
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [followUpForm, setFollowUpForm] = useState({ note: '', priority: 'normal', followUpDate: '', status: 'pending' });
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [documentForm, setDocumentForm] = useState({ name: '', type: 'other', description: '' });
  const [documentFile, setDocumentFile] = useState(null);
  const [documentError, setDocumentError] = useState('');
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);

  // Staff members for kanban
  const staffMembers = users.filter((u) => u.status === 'approved' && ['admin', 'manager', 'staff'].includes(u.role));

  // Drag and drop handlers
  const handleDragStart = (e, client) => {
    setDraggedClient(client);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };
  const handleDragLeave = () => setDragOverColumn(null);
  const handleDrop = (e, userId) => {
    e.preventDefault();
    if (draggedClient && canManage) {
      updateClient(draggedClient.id, { assignedTo: userId === 'unassigned' ? null : userId });
    }
    setDraggedClient(null);
    setDragOverColumn(null);
  };
  const handleDragEnd = () => { setDraggedClient(null); setDragOverColumn(null); };

  // Active clients (exclude pending and archived)
  const filtered = clients
    .filter((c) => c.status !== 'pending' && c.status !== 'archived')
    .filter((c) => filterStatus === 'all' || c.status === filterStatus)
    .filter((c) => filterTier === 'all' || (c.tier || 'free') === filterTier)
    .filter((c) => filterService === 'all' || c.service === filterService)
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name-az': return a.name.localeCompare(b.name);
        case 'name-za': return b.name.localeCompare(a.name);
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  // Archived clients
  const archivedClients = clients.filter((c) => c.status === 'archived');

  const client = selectedClient ? clients.find((c) => c.id === selectedClient) : null;
  const clientAppointments = client ? appointments.filter((a) => a.email.toLowerCase() === client.email.toLowerCase()) : [];

  const handleAddClient = (e) => {
    e.preventDefault();
    setAddError('');
    const result = addClientManually(addForm);
    if (!result.success) { setAddError(result.error); return; }
    setAddForm({ name: '', email: '', phone: '', service: '' });
    setShowAddForm(false);
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedClient) return;
    addClientNote(selectedClient, newNote);
    setNewNote('');
  };

  const handleAddTag = () => {
    if (!newTag.trim() || !selectedClient) return;
    addClientTag(selectedClient, newTag.trim());
    setNewTag('');
  };

  const handleArchiveClient = (id) => {
    archiveClient(id);
    setConfirmArchive(null);
    if (selectedClient === id) setSelectedClient(null);
  };

  const handleRestoreClient = (id) => {
    restoreClient(id);
  };

  const handlePermanentDelete = (id) => {
    permanentlyDeleteClient(id);
    setConfirmPermanentDelete(null);
  };

  const startEditClient = () => {
    setEditForm({
      name: client.name || '',
      businessName: client.businessName || '',
      phone: client.phone || '',
      street: client.street || '',
      city: client.city || '',
      state: client.state || '',
      zip: client.zip || '',
      dateOfBirth: client.dateOfBirth || '',
    });
    setEditingClient(true);
    setEditSuccess('');
  };

  const handleSaveClientEdit = (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return;
    updateClient(client.id, {
      name: editForm.name.trim(),
      businessName: editForm.businessName.trim(),
      phone: editForm.phone.trim(),
      street: editForm.street.trim(),
      city: editForm.city.trim(),
      state: editForm.state.trim(),
      zip: editForm.zip.trim(),
      dateOfBirth: editForm.dateOfBirth,
    });
    setEditingClient(false);
    setEditSuccess('Client info updated');
    setTimeout(() => setEditSuccess(''), 3000);
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    setDocumentError('');

    if (!documentFile) {
      setDocumentError('Please select a file');
      return;
    }
    if (!documentForm.name.trim()) {
      setDocumentError('Please enter a document name');
      return;
    }

    // Check file size (max 5MB for localStorage)
    if (documentFile.size > 5 * 1024 * 1024) {
      setDocumentError('File size must be less than 5MB');
      return;
    }

    setUploadingDocument(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = () => {
        addClientDocument(client.id, {
          name: documentForm.name.trim(),
          type: documentForm.type,
          description: documentForm.description.trim(),
          fileData: reader.result,
          fileType: documentFile.type,
          fileSize: documentFile.size,
        });

        // Reset form
        setDocumentForm({ name: '', type: 'other', description: '' });
        setDocumentFile(null);
        setShowDocumentForm(false);
        setUploadingDocument(false);
      };
      reader.onerror = () => {
        setDocumentError('Failed to read file');
        setUploadingDocument(false);
      };
      reader.readAsDataURL(documentFile);
    } catch (err) {
      setDocumentError('Failed to upload document');
      setUploadingDocument(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const downloadDocument = (doc) => {
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client detail view
  if (client) {
    return (
      <div className="client-detail">
        <button className="btn btn-sm btn-outline client-back" onClick={() => setSelectedClient(null)}>
          <ChevronLeft size={16} /> Back to Clients
        </button>

        <div className="client-profile">
          {editSuccess && <div className="profile-success"><CheckCircle size={16} /> {editSuccess}</div>}
          <div className="client-profile-header">
            <div className="client-avatar-lg">{client.name.charAt(0).toUpperCase()}</div>
            <div className="client-profile-info">
              {editingClient ? (
                <form onSubmit={handleSaveClientEdit} className="admin-edit-client-form">
                  <div className="admin-edit-row">
                    <label><User size={14} /> Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-edit-row">
                    <label><Briefcase size={14} /> Business Name</label>
                    <input type="text" value={editForm.businessName} onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })} placeholder="Company / Business name" />
                  </div>
                  <div className="admin-edit-row">
                    <label><Mail size={14} /> Email</label>
                    <input type="email" value={client.email} disabled />
                  </div>
                  <div className="admin-edit-row">
                    <label><Phone size={14} /> Phone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="admin-edit-row">
                    <label><MapPin size={14} /> Street</label>
                    <input type="text" value={editForm.street} onChange={(e) => setEditForm({ ...editForm, street: e.target.value })} placeholder="123 Main St" />
                  </div>
                  <div className="admin-edit-row-group">
                    <div className="admin-edit-row">
                      <label>City</label>
                      <input type="text" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} placeholder="City" />
                    </div>
                    <div className="admin-edit-row">
                      <label>State</label>
                      <input type="text" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} placeholder="State" />
                    </div>
                    <div className="admin-edit-row">
                      <label>Zip</label>
                      <input type="text" value={editForm.zip} onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })} placeholder="12345" />
                    </div>
                  </div>
                  <div className="admin-edit-actions">
                    <button type="submit" className="btn btn-sm btn-primary">Save</button>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditingClient(false)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <h2>{client.name}</h2>
                  {client.businessName && <p className="client-business-name"><Briefcase size={14} /> {client.businessName}</p>}
                  <div className="client-contact-row">
                    <span><Mail size={14} /> {client.email}</span>
                    {client.phone && <span><Phone size={14} /> {client.phone}</span>}
                    {(client.street || client.city || client.state || client.zip) && (
                      <span><MapPin size={14} /> {[client.street, client.city, client.state, client.zip].filter(Boolean).join(', ')}</span>
                    )}
                    {/* Legacy single address field */}
                    {!client.street && !client.city && client.address && <span><MapPin size={14} /> {client.address}</span>}
                  </div>
                  <div className="client-meta-row">
                    <span className={`client-status-badge ${client.status}`}>
                      {client.status === 'active' ? 'Active' : client.status === 'inactive' ? 'Inactive' : 'VIP'}
                    </span>
                    <TierBadge tier={client.tier} />
                    {client.service && <span className="client-service"><Briefcase size={13} /> {client.service.replace('-', ' ')}</span>}
                    <span className="client-since">Client since {new Date(client.createdAt).toLocaleDateString()}</span>
                  </div>
                </>
              )}
            </div>
            <div className="client-profile-actions">
              {canManage && !editingClient && (
                <button className="btn-edit-client" onClick={startEditClient}>
                  <Edit3 size={14} /> Edit Info
                </button>
              )}
              {canManage && (
                <select value={client.status} onChange={(e) => updateClient(client.id, { status: e.target.value })} className="filter-select">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="vip">VIP</option>
                </select>
              )}
              {canManage && (
                <select value={client.tier || 'free'} onChange={(e) => updateClientTier(client.id, e.target.value)} className="filter-select">
                  {Object.entries(SUBSCRIPTION_TIERS).map(([key, t]) => (
                    <option key={key} value={key}>{t.label} Tier</option>
                  ))}
                </select>
              )}
              {canDelete && (
                <>
                  {confirmArchive === client.id ? (
                    <div className="confirm-delete-row">
                      <span>Archive this client?</span>
                      <button className="btn btn-sm btn-warning" onClick={() => handleArchiveClient(client.id)}>Yes, Archive</button>
                      <button className="btn btn-sm btn-outline" onClick={() => setConfirmArchive(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="btn btn-sm btn-warning" onClick={() => setConfirmArchive(client.id)}>
                      <Trash2 size={14} /> Archive
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Google Map */}
          {(() => {
            const fullAddress = [client.street, client.city, client.state, client.zip].filter(Boolean).join(', ') || client.address;
            if (!fullAddress) return null;
            return (
              <div className="client-section client-map-section">
                <h4><MapPin size={16} /> Location</h4>
                <div className="client-map-embed">
                  <iframe
                    title="Client location map"
                    width="100%"
                    height="300"
                    style={{ border: 0, borderRadius: 8 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    allowFullScreen
                  />
                </div>
                <div className="client-map-footer">
                  <p className="client-map-address"><MapPin size={13} /> {fullAddress}</p>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                    <MapPin size={14} /> Open in Google Maps
                  </a>
                </div>
              </div>
            );
          })()}

          {/* Project Management (all clients) */}
          <div className="client-section projects-section">
            <ProjectBoard client={client} />
          </div>

          {/* Payments / Invoices */}
          <div className="client-section invoices-section">
            <div className="invoices-header">
              <h4><Receipt size={16} /> Payments & Invoices</h4>
              {canManage && (
                <button className="btn btn-sm btn-primary" onClick={() => setShowInvoiceForm(!showInvoiceForm)}>
                  <Plus size={14} /> {showInvoiceForm ? 'Cancel' : 'New Invoice'}
                </button>
              )}
            </div>

            {/* Summary */}
            {(() => {
              const invoices = client.invoices || [];
              const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
              const totalPaid = invoices.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
              const outstanding = totalBilled - totalPaid;
              const overdueCount = invoices.filter((inv) => inv.status === 'unpaid' && inv.dueDate && new Date(inv.dueDate) < new Date()).length;
              return invoices.length > 0 ? (
                <div className="invoice-summary">
                  <div className="invoice-summary-item">
                    <span>Total Billed</span>
                    <strong>${totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="invoice-summary-item paid">
                    <span>Paid</span>
                    <strong>${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="invoice-summary-item outstanding">
                    <span>Outstanding</span>
                    <strong>${outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  {overdueCount > 0 && (
                    <div className="invoice-summary-item overdue">
                      <span>Overdue</span>
                      <strong>{overdueCount}</strong>
                    </div>
                  )}
                </div>
              ) : null;
            })()}

            {showInvoiceForm && (
              <div className="invoice-form">
                {invoiceError && <div className="login-error">{invoiceError}</div>}
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setInvoiceError('');
                  if (!invoiceForm.title.trim()) { setInvoiceError('Title is required'); return; }
                  if (!invoiceForm.amount || parseFloat(invoiceForm.amount) <= 0) { setInvoiceError('Valid amount is required'); return; }
                  addInvoice(client.id, invoiceForm);
                  setInvoiceForm({ title: '', amount: '', dueDate: '', description: '', recurring: false, frequency: 'monthly' });
                  setShowInvoiceForm(false);
                }}>
                  <div className="form-row">
                    <div className="form-group"><label>Title *</label><input type="text" value={invoiceForm.title} onChange={(e) => setInvoiceForm({ ...invoiceForm, title: e.target.value })} placeholder="e.g. Website Redesign - Phase 1" required /></div>
                    <div className="form-group"><label>Amount ($) *</label><input type="number" step="0.01" min="0" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} placeholder="0.00" required /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Due Date</label><input type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} /></div>
                    <div className="form-group"><label>Description</label><input type="text" value={invoiceForm.description} onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })} placeholder="Optional description" /></div>
                  </div>
                  <div className="form-row recurring-row">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={invoiceForm.recurring} onChange={(e) => setInvoiceForm({ ...invoiceForm, recurring: e.target.checked })} />
                      <RefreshCw size={14} /> Recurring Invoice
                    </label>
                    {invoiceForm.recurring && (
                      <select value={invoiceForm.frequency} onChange={(e) => setInvoiceForm({ ...invoiceForm, frequency: e.target.value })} className="frequency-select">
                        {RECURRING_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    )}
                  </div>
                  <button type="submit" className="btn btn-sm btn-primary"><Receipt size={14} /> Create Invoice</button>
                </form>
              </div>
            )}

            {(client.invoices || []).length === 0 && !showInvoiceForm ? (
              <p className="text-muted">No invoices yet</p>
            ) : (
              <div className="invoices-list">
                {[...(client.invoices || [])].reverse().map((inv) => {
                  const isOverdue = inv.status === 'unpaid' && inv.dueDate && new Date(inv.dueDate) < new Date();
                  return (
                    <div key={inv.id} className={`invoice-card ${inv.status} ${isOverdue ? 'overdue' : ''}`}>
                      <div className="invoice-card-top">
                        <div className="invoice-info">
                          <strong>{inv.title}</strong>
                          {inv.description && <span className="invoice-desc">{inv.description}</span>}
                        </div>
                        <div className="invoice-amount">
                          <span className="invoice-price">${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          <span className={`invoice-status-badge ${inv.status} ${isOverdue ? 'overdue' : ''}`}>
                            {isOverdue ? 'Overdue' : inv.status === 'paid' ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>
                      </div>
                      <div className="invoice-card-meta">
                        <span>Created {new Date(inv.createdAt).toLocaleDateString()}</span>
                        {inv.dueDate && <span>Due {formatDisplayDate(inv.dueDate)}</span>}
                        {inv.paidAt && <span>Paid {new Date(inv.paidAt).toLocaleDateString()}</span>}
                      </div>
                      {canManage && inv.status !== 'paid' && (
                        <div className="invoice-card-actions">
                          <button className="btn btn-sm btn-confirm" onClick={() => markInvoicePaid(client.id, inv.id)}>
                            <CreditCard size={14} /> Mark Paid
                          </button>
                          <button className="btn btn-sm btn-delete" onClick={() => deleteInvoice(client.id, inv.id)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                      {canManage && inv.status === 'paid' && (
                        <div className="invoice-card-actions">
                          <button className="btn btn-sm btn-outline" style={{ color: 'var(--gray-600)', borderColor: 'var(--gray-300)' }} onClick={() => unmarkInvoicePaid(client.id, inv.id)}>
                            Undo Payment
                          </button>
                          <button className="btn btn-sm btn-delete" onClick={() => deleteInvoice(client.id, inv.id)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment History */}
          {(() => {
            const clientPayments = payments.filter((p) => p.clientId === client.id);
            return clientPayments.length > 0 ? (
              <div className="client-section payment-history-section">
                <h4><DollarSign size={16} /> Payment History ({clientPayments.length})</h4>
                <div className="payment-history-list">
                  {[...clientPayments].reverse().map((p) => (
                    <div key={p.id} className="payment-history-item">
                      <div className="payment-history-info">
                        <strong>{p.service} — {p.serviceTier}</strong>
                        <span>{new Date(p.createdAt).toLocaleDateString()} via {p.method.replace('-', ' ')}</span>
                      </div>
                      <div className="payment-history-amount">
                        <strong>${p.amount.toLocaleString()}</strong>
                        <span className="payment-history-status">{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Documents */}
          <div className="client-section documents-section">
            <div className="documents-header">
              <h4><FileText size={16} /> Documents ({(client.documents || []).length})</h4>
              {canManage && (
                <button className="btn btn-sm btn-primary" onClick={() => setShowDocumentForm(!showDocumentForm)}>
                  <Plus size={14} /> {showDocumentForm ? 'Cancel' : 'Upload Document'}
                </button>
              )}
            </div>

            {showDocumentForm && (
              <div className="document-upload-form">
                {documentError && <div className="login-error">{documentError}</div>}
                <form onSubmit={handleDocumentUpload}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Document Name *</label>
                      <input
                        type="text"
                        value={documentForm.name}
                        onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
                        placeholder="e.g. Website Proposal v2"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Document Type</label>
                      <select
                        value={documentForm.type}
                        onChange={(e) => setDocumentForm({ ...documentForm, type: e.target.value })}
                      >
                        {Object.entries(DOCUMENT_TYPES).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description (Optional)</label>
                    <input
                      type="text"
                      value={documentForm.description}
                      onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
                      placeholder="Brief description of the document"
                    />
                  </div>
                  <div className="form-group">
                    <label>File * (Max 5MB)</label>
                    <input
                      type="file"
                      onChange={(e) => setDocumentFile(e.target.files[0])}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.csv"
                    />
                    {documentFile && (
                      <span className="file-selected">
                        Selected: {documentFile.name} ({formatFileSize(documentFile.size)})
                      </span>
                    )}
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={uploadingDocument}>
                    {uploadingDocument ? 'Uploading...' : <><Upload size={14} /> Upload Document</>}
                  </button>
                </form>
              </div>
            )}

            {(client.documents || []).length === 0 && !showDocumentForm ? (
              <p className="text-muted">No documents uploaded yet</p>
            ) : (
              <div className="documents-list">
                {[...(client.documents || [])].reverse().map((doc) => (
                  <div key={doc.id} className="document-card">
                    <div className="document-icon" style={{ background: DOCUMENT_TYPES[doc.type]?.color || '#6b7280' }}>
                      <FileText size={20} />
                    </div>
                    <div className="document-info">
                      <div className="document-name">
                        <strong>{doc.name}</strong>
                        <span className="document-type-badge" style={{ background: `${DOCUMENT_TYPES[doc.type]?.color}20`, color: DOCUMENT_TYPES[doc.type]?.color }}>
                          {DOCUMENT_TYPES[doc.type]?.label || 'Other'}
                        </span>
                      </div>
                      {doc.description && <p className="document-desc">{doc.description}</p>}
                      <div className="document-meta">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>Uploaded by {doc.uploadedBy}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="document-actions">
                      <button className="btn btn-sm btn-outline" onClick={() => setViewingDocument(doc)} title="Preview">
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-sm btn-primary" onClick={() => downloadDocument(doc)} title="Download">
                        <Download size={14} />
                      </button>
                      {canManage && (
                        <button className="btn btn-sm btn-delete" onClick={() => deleteClientDocument(client.id, doc.id)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document Preview Modal */}
          {viewingDocument && (
            <div className="modal-overlay" onClick={() => setViewingDocument(null)}>
              <div className="modal-content document-preview-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setViewingDocument(null)}><X size={20} /></button>
                <div className="document-preview-header">
                  <h3>{viewingDocument.name}</h3>
                  <span className="document-type-badge" style={{ background: `${DOCUMENT_TYPES[viewingDocument.type]?.color}20`, color: DOCUMENT_TYPES[viewingDocument.type]?.color }}>
                    {DOCUMENT_TYPES[viewingDocument.type]?.label || 'Other'}
                  </span>
                </div>
                {viewingDocument.description && <p className="document-preview-desc">{viewingDocument.description}</p>}
                <div className="document-preview-meta">
                  <span><FileText size={14} /> {formatFileSize(viewingDocument.fileSize)}</span>
                  <span><User size={14} /> {viewingDocument.uploadedBy}</span>
                  <span><CalendarDays size={14} /> {new Date(viewingDocument.uploadedAt).toLocaleString()}</span>
                </div>
                <div className="document-preview-content">
                  {viewingDocument.fileType?.startsWith('image/') ? (
                    <img src={viewingDocument.fileData} alt={viewingDocument.name} />
                  ) : viewingDocument.fileType === 'application/pdf' ? (
                    <iframe src={viewingDocument.fileData} title={viewingDocument.name} />
                  ) : (
                    <div className="document-no-preview">
                      <FileText size={48} />
                      <p>Preview not available for this file type</p>
                      <button className="btn btn-primary" onClick={() => downloadDocument(viewingDocument)}>
                        <Download size={16} /> Download to View
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="client-tags-section">
            <h4><Tag size={16} /> Tags</h4>
            <div className="client-tags">
              {(client.tags || []).map((tag) => (
                <span key={tag} className="client-tag">
                  {tag}
                  {canManage && <button onClick={() => removeClientTag(client.id, tag)}><X size={12} /></button>}
                </span>
              ))}
              {canManage && (
                <div className="add-tag-inline">
                  <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add tag..." onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} />
                  <button onClick={handleAddTag} disabled={!newTag.trim()}><Plus size={14} /></button>
                </div>
              )}
            </div>
          </div>

          {/* Appointment History */}
          <div className="client-section">
            <h4><CalendarDays size={16} /> Appointment History ({clientAppointments.length})</h4>
            {clientAppointments.length === 0 ? (
              <p className="text-muted">No appointments found</p>
            ) : (
              <div className="client-history">
                {clientAppointments.map((appt) => (
                  <div key={appt.id} className="history-item">
                    <div className="history-dot" />
                    <div className="history-content">
                      <div className="history-top">
                        <span>{formatDisplayDate(appt.date)} at {appt.time}</span>
                        <StatusBadge status={appt.status} />
                        {canManage && (
                          <button
                            className="btn btn-xs btn-outline"
                            onClick={() => {
                              setEditingAppt(appt.id);
                              setApptEditForm({ date: appt.date, time: appt.time, service: appt.service || '', status: appt.status, message: appt.message || '' });
                            }}
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        )}
                      </div>
                      {editingAppt === appt.id ? (
                        <div className="appt-edit-form">
                          <div className="form-row">
                            <div className="form-group">
                              <label>Date</label>
                              <input type="date" value={apptEditForm.date} onChange={(e) => setApptEditForm({ ...apptEditForm, date: e.target.value })} />
                            </div>
                            <div className="form-group">
                              <label>Time</label>
                              <input type="time" value={apptEditForm.time} onChange={(e) => setApptEditForm({ ...apptEditForm, time: e.target.value })} />
                            </div>
                            <div className="form-group">
                              <label>Status</label>
                              <select value={apptEditForm.status} onChange={(e) => setApptEditForm({ ...apptEditForm, status: e.target.value })}>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Service</label>
                            <input type="text" value={apptEditForm.service} onChange={(e) => setApptEditForm({ ...apptEditForm, service: e.target.value })} placeholder="Service type" />
                          </div>
                          <div className="form-group">
                            <label>Message</label>
                            <textarea value={apptEditForm.message} onChange={(e) => setApptEditForm({ ...apptEditForm, message: e.target.value })} rows={2} placeholder="Notes..." />
                          </div>
                          <div className="form-actions">
                            <button className="btn btn-sm btn-primary" onClick={() => { updateAppointment(appt.id, apptEditForm); setEditingAppt(null); }}>
                              <CheckCircle size={14} /> Save
                            </button>
                            <button className="btn btn-sm btn-outline" onClick={() => setEditingAppt(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {appt.service && <p>Service: {appt.service.replace('-', ' ')}</p>}
                          {appt.message && <p className="history-msg">"{appt.message}"</p>}
                        </>
                      )}
                      {appt.followUp && (
                        <div className="history-followup">
                          <FollowUpBadge followUp={appt.followUp} />
                          <span>{appt.followUp.note}</span>
                          {canManage && editingFollowUp !== appt.id && (
                            <button
                              className="btn btn-xs btn-outline"
                              onClick={() => {
                                setEditingFollowUp(appt.id);
                                setFollowUpForm({
                                  note: appt.followUp.note || '',
                                  priority: appt.followUp.priority || 'normal',
                                  followUpDate: appt.followUp.followUpDate || '',
                                  status: appt.followUp.status || 'pending',
                                });
                              }}
                            >
                              <Edit3 size={12} />
                            </button>
                          )}
                        </div>
                      )}
                      {editingFollowUp === appt.id && appt.followUp && (
                        <div className="followup-edit-form">
                          <div className="form-row">
                            <div className="form-group">
                              <label>Follow-Up Date</label>
                              <input type="date" value={followUpForm.followUpDate} onChange={(e) => setFollowUpForm({ ...followUpForm, followUpDate: e.target.value })} />
                            </div>
                            <div className="form-group">
                              <label>Priority</label>
                              <select value={followUpForm.priority} onChange={(e) => setFollowUpForm({ ...followUpForm, priority: e.target.value })}>
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Status</label>
                              <select value={followUpForm.status} onChange={(e) => setFollowUpForm({ ...followUpForm, status: e.target.value })}>
                                <option value="pending">Pending</option>
                                <option value="contacted">Contacted</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Note</label>
                            <textarea value={followUpForm.note} onChange={(e) => setFollowUpForm({ ...followUpForm, note: e.target.value })} rows={2} />
                          </div>
                          <div className="form-actions">
                            <button className="btn btn-sm btn-primary" onClick={() => { updateFollowUp(appt.id, followUpForm); setEditingFollowUp(null); }}>
                              <CheckCircle size={14} /> Save
                            </button>
                            <button className="btn btn-sm btn-outline" onClick={() => setEditingFollowUp(null)}>Cancel</button>
                          </div>
                        </div>
                      )}
                      {!appt.followUp && canManage && (
                        <button
                          className="btn btn-xs btn-outline"
                          style={{ marginTop: '0.5rem' }}
                          onClick={() => {
                            setEditingFollowUp(appt.id);
                            setFollowUpForm({ note: '', priority: 'normal', followUpDate: new Date().toISOString().split('T')[0], status: 'pending' });
                          }}
                        >
                          <PhoneForwarded size={12} /> Add Follow-Up
                        </button>
                      )}
                      {editingFollowUp === appt.id && !appt.followUp && (
                        <div className="followup-edit-form">
                          <div className="form-row">
                            <div className="form-group">
                              <label>Follow-Up Date</label>
                              <input type="date" value={followUpForm.followUpDate} onChange={(e) => setFollowUpForm({ ...followUpForm, followUpDate: e.target.value })} />
                            </div>
                            <div className="form-group">
                              <label>Priority</label>
                              <select value={followUpForm.priority} onChange={(e) => setFollowUpForm({ ...followUpForm, priority: e.target.value })}>
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                              </select>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Note *</label>
                            <textarea value={followUpForm.note} onChange={(e) => setFollowUpForm({ ...followUpForm, note: e.target.value })} rows={2} placeholder="Follow-up reason..." />
                          </div>
                          <div className="form-actions">
                            <button
                              className="btn btn-sm btn-primary"
                              disabled={!followUpForm.note.trim()}
                              onClick={() => {
                                markFollowUp(appt.id, followUpForm);
                                setEditingFollowUp(null);
                              }}
                            >
                              <CheckCircle size={14} /> Add Follow-Up
                            </button>
                            <button className="btn btn-sm btn-outline" onClick={() => setEditingFollowUp(null)}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="client-section">
            <h4><FileText size={16} /> Notes ({(client.notes || []).length})</h4>
            {canManage && (
              <div className="add-note">
                <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note about this client..." rows={3} />
                <button className="btn btn-sm btn-primary" onClick={handleAddNote} disabled={!newNote.trim()}><Send size={14} /> Add Note</button>
              </div>
            )}
            {(client.notes || []).length === 0 ? (
              <p className="text-muted">No notes yet</p>
            ) : (
              <div className="notes-list">
                {[...(client.notes || [])].reverse().map((n) => (
                  <div key={n.id} className="note-card">
                    <div className="note-header">
                      <strong>{n.author}</strong>
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                      {canManage && <button className="note-delete" onClick={() => deleteClientNote(client.id, n.id)}><Trash2 size={13} /></button>}
                    </div>
                    <p>{n.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Clients list view
  const activeFilters = [filterStatus, filterTier, filterService].filter((f) => f !== 'all').length + (search ? 1 : 0);

  return (
    <div className="clients-tab">
      {/* View Toggle */}
      <div className="clients-view-toggle">
        <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><BarChart3 size={16} /> List</button>
        <button className={`view-btn ${viewMode === 'staff' ? 'active' : ''}`} onClick={() => setViewMode('staff')}><Users size={16} /> Staff</button>
      </div>

      {viewMode === 'staff' ? (
        /* Staff Kanban View */
        <div className="clients-kanban">
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
                  <span className="kanban-count">{filtered.filter((c) => !c.assignedTo).length}</span>
                </div>
                <div className="kanban-column-content">
                  {filtered.filter((c) => !c.assignedTo).map((client) => (
                    <div
                      key={client.id}
                      className={`kanban-card client-kanban-card ${draggedClient?.id === client.id ? 'dragging' : ''}`}
                      draggable={canManage}
                      onDragStart={(e) => handleDragStart(e, client)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedClient(client.id)}
                    >
                      <div className="kanban-card-header">
                        <strong>{client.name}</strong>
                        <TierBadge tier={client.tier} />
                      </div>
                      <div className="kanban-card-meta">
                        <span><Mail size={12} /> {client.email}</span>
                        {client.phone && <span><Phone size={12} /> {client.phone}</span>}
                      </div>
                      {client.service && <div className="kanban-card-service">{client.service.replace('-', ' ')}</div>}
                    </div>
                  ))}
                  {filtered.filter((c) => !c.assignedTo).length === 0 && <p className="kanban-empty">No unassigned clients</p>}
                </div>
              </div>

              {/* Staff Columns */}
              {staffMembers.map((staff, index) => {
                const staffClients = filtered.filter((c) => c.assignedTo === staff.id);
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
                      <span className="kanban-count">{staffClients.length}</span>
                    </div>
                    <div className="kanban-column-content">
                      {staffClients.map((client) => (
                        <div
                          key={client.id}
                          className={`kanban-card client-kanban-card ${draggedClient?.id === client.id ? 'dragging' : ''}`}
                          style={{ borderLeftColor: staffColor }}
                          draggable={canManage}
                          onDragStart={(e) => handleDragStart(e, client)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelectedClient(client.id)}
                        >
                          <div className="kanban-card-header">
                            <strong>{client.name}</strong>
                            <TierBadge tier={client.tier} />
                          </div>
                          <div className="kanban-card-meta">
                            <span><Mail size={12} /> {client.email}</span>
                            {client.phone && <span><Phone size={12} /> {client.phone}</span>}
                          </div>
                          {client.service && <div className="kanban-card-service">{client.service.replace('-', ' ')}</div>}
                        </div>
                      ))}
                      {staffClients.length === 0 && <p className="kanban-empty">Drop clients here</p>}
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
      <div className="clients-header">
        <div className="clients-search">
          <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="clients-header-right">
          <span className="clients-count">{filtered.length} client{filtered.length !== 1 ? 's' : ''}</span>
          {canManage && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
              <UserPlus size={16} /> {showAddForm ? 'Cancel' : 'Add Client'}
            </button>
          )}
        </div>
      </div>
      <div className="clients-filters">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="vip">VIP</option>
        </select>
        <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="filter-select">
          <option value="all">All Tiers</option>
          {Object.entries(SUBSCRIPTION_TIERS).map(([key, t]) => (
            <option key={key} value={key}>{t.label}</option>
          ))}
        </select>
        <select value={filterService} onChange={(e) => setFilterService(e.target.value)} className="filter-select">
          <option value="all">All Services</option>
          <option value="web-design">Web Design</option>
          <option value="branding">Branding</option>
          <option value="marketing">Digital Marketing</option>
          <option value="app-dev">App Development</option>
          <option value="consulting">Consulting</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name-az">Name A → Z</option>
          <option value="name-za">Name Z → A</option>
        </select>
        {activeFilters > 0 && (
          <button className="btn-clear-filters" onClick={() => { setFilterStatus('all'); setFilterTier('all'); setFilterService('all'); setSortBy('newest'); setSearch(''); }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="um-form-card">
          <h3>Add New Client</h3>
          {addError && <div className="login-error">{addError}</div>}
          <form onSubmit={handleAddClient} className="um-form">
            <div className="form-row">
              <div className="form-group"><label>Name *</label><input type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required /></div>
              <div className="form-group"><label>Email *</label><input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Phone</label><input type="tel" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} /></div>
              <div className="form-group"><label>Service</label><select value={addForm.service} onChange={(e) => setAddForm({ ...addForm, service: e.target.value })}><option value="">Select a service</option><option value="web-design">Web Design</option><option value="branding">Branding</option><option value="marketing">Digital Marketing</option><option value="app-dev">App Development</option><option value="consulting">Consulting</option></select></div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Create Client</button>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state"><UserCheck size={48} /><p>No clients found</p></div>
      ) : (
        <div className="clients-grid">
          {filtered.map((c) => (
            <div key={c.id} className={`client-card ${c.status === 'vip' ? 'vip-card' : ''}`} onClick={() => setSelectedClient(c.id)}>
              <div className="client-card-top">
                <div className={`client-avatar ${c.status === 'vip' ? 'vip-avatar' : ''}`}>{c.name.charAt(0).toUpperCase()}</div>
                <div className="client-card-info">
                  <strong>{c.name} {c.status === 'vip' && <Flag size={13} className="vip-flag" />}</strong>
                  <span>{c.email}</span>
                </div>
                <TierBadge tier={c.tier} />
                <span className={`client-status-dot ${c.status}`} />
              </div>
              <div className="client-card-bottom">
                {c.service && <span className="client-service-tag">{c.service.replace('-', ' ')}</span>}
                <span className="client-card-date">Since {new Date(c.createdAt).toLocaleDateString()}</span>
                {c.status === 'vip' && (c.projects || []).length > 0 && (
                  <span className="client-projects-count"><FolderKanban size={12} /> {(c.projects || []).length} projects</span>
                )}
                {(c.tags || []).length > 0 && (
                  <div className="client-card-tags">
                    {(c.tags || []).slice(0, 3).map((t) => <span key={t} className="mini-tag">{t}</span>)}
                    {(c.tags || []).length > 3 && <span className="mini-tag">+{(c.tags || []).length - 3}</span>}
                  </div>
                )}
              </div>
              {canDelete && (
                <button className="client-card-delete" title="Archive client" onClick={(e) => { e.stopPropagation(); setConfirmArchive(c.id); }}>
                  <Trash2 size={14} />
                </button>
              )}
              <div className="client-card-arrow"><ArrowRight size={16} /></div>
            </div>
          ))}
        </div>
      )}

      {/* Archived Clients Section */}
      {archivedClients.length > 0 && (
        <div className="archived-clients-section">
          <button className="archived-toggle" onClick={() => setShowArchivedClients(!showArchivedClients)}>
            {showArchivedClients ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>Archived Clients ({archivedClients.length})</span>
          </button>
          {showArchivedClients && (
            <div className="archived-clients-list">
              {archivedClients.map((c) => (
                <div key={c.id} className="archived-client-card">
                  <div className="archived-client-info">
                    <div className="client-avatar archived">{c.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <strong>{c.name}</strong>
                      <span>{c.email}</span>
                      <small>Archived {c.archivedAt ? new Date(c.archivedAt).toLocaleDateString() : 'unknown'}</small>
                    </div>
                  </div>
                  <div className="archived-client-actions">
                    <button className="btn btn-sm btn-confirm" onClick={() => handleRestoreClient(c.id)}>
                      <RefreshCw size={14} /> Restore
                    </button>
                    {confirmPermanentDelete === c.id ? (
                      <div className="confirm-delete-inline">
                        <span>Permanently delete?</span>
                        <button className="btn btn-sm btn-delete" onClick={() => handlePermanentDelete(c.id)}>Yes</button>
                        <button className="btn btn-sm btn-outline" onClick={() => setConfirmPermanentDelete(null)}>No</button>
                      </div>
                    ) : (
                      <button className="btn btn-sm btn-delete" onClick={() => setConfirmPermanentDelete(c.id)}>
                        <Trash2 size={14} /> Delete Forever
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* Archive Confirmation Modal */}
      {confirmArchive && (
        <div className="modal-overlay" onClick={() => setConfirmArchive(null)}>
          <div className="modal-content archive-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setConfirmArchive(null)}><X size={20} /></button>
            <div className="archive-modal-icon"><AlertCircle size={48} /></div>
            <h3>Archive Client?</h3>
            <p>This client will be moved to the archive. You can restore them at any time from the Archived Clients section.</p>
            <div className="archive-modal-client">
              {(() => {
                const c = clients.find((cl) => cl.id === confirmArchive);
                return c ? (
                  <>
                    <strong>{c.name}</strong>
                    <span>{c.email}</span>
                  </>
                ) : null;
              })()}
            </div>
            <div className="archive-modal-actions">
              <button className="btn btn-warning" onClick={() => handleArchiveClient(confirmArchive)}>
                <Trash2 size={16} /> Archive Client
              </button>
              <button className="btn btn-outline" onClick={() => setConfirmArchive(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== USER MANAGEMENT TAB ===== */
function UserManagement() {
  const { users, addUser, updateUser, deleteUser, currentUser, ROLES, approveUser, rejectUser } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState({});
  const [approveRoles, setApproveRoles] = useState({});
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', role: 'staff' });
  const resetForm = () => { setForm({ username: '', password: '', name: '', email: '', role: 'staff' }); setShowForm(false); setEditingId(null); setError(''); };
  const handleSubmit = (e) => {
    e.preventDefault(); setError('');
    if (editingId) {
      const updates = { ...form }; if (!updates.password) delete updates.password;
      const result = updateUser(editingId, updates);
      if (!result.success) { setError(result.error); return; }
    } else {
      if (!form.password) { setError('Password is required'); return; }
      const result = addUser(form);
      if (!result.success) { setError(result.error); return; }
    }
    resetForm();
  };
  const startEdit = (user) => { setForm({ username: user.username, password: '', name: user.name, email: user.email, role: user.role }); setEditingId(user.id); setShowForm(true); setError(''); };

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const approvedUsers = users.filter((u) => u.status !== 'pending' && u.status !== 'rejected');
  const rejectedUsers = users.filter((u) => u.status === 'rejected');

  const handleApprove = (userId) => {
    const role = approveRoles[userId] || 'staff';
    approveUser(userId, role);
    setApproveRoles((prev) => { const next = { ...prev }; delete next[userId]; return next; });
  };

  return (
    <div className="user-management">
      <div className="um-header">
        <h2><Users size={20} /> User Management <span className="count-badge">{approvedUsers.length}</span></h2>
        {!showForm && <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true); }}><UserPlus size={16} /> Add User</button>}
      </div>
      {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Pending Registrations */}
      {pendingUsers.length > 0 && (
        <div className="pending-section">
          <h3 className="pending-section-title">
            <AlertCircle size={18} /> Pending Registrations
            <span className="count-badge" style={{ background: 'var(--warning)' }}>{pendingUsers.length}</span>
          </h3>
          <div className="pending-list">
            {pendingUsers.map((user) => (
              <div key={user.id} className="pending-card">
                <div className="pending-card-top">
                  <div className="user-avatar pending-avatar">{user.name.charAt(0).toUpperCase()}</div>
                  <div className="user-info">
                    <div className="user-name-row"><strong>{user.name}</strong><span className="pending-status-tag">Pending</span></div>
                    <span className="user-username">@{user.username}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                </div>
                <div className="pending-card-meta">
                  <span>Registered {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="pending-card-actions">
                  <div className="pending-role-select">
                    <label>Assign Role:</label>
                    <select
                      value={approveRoles[user.id] || 'staff'}
                      onChange={(e) => setApproveRoles((prev) => ({ ...prev, [user.id]: e.target.value }))}
                      className="filter-select"
                    >
                      {Object.entries(ROLES).map(([key, role]) => (
                        <option key={key} value={key}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn btn-sm btn-confirm" onClick={() => handleApprove(user.id)}>
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button className="btn btn-sm btn-delete" onClick={() => rejectUser(user.id)}>
                    <Ban size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejected Users */}
      {rejectedUsers.length > 0 && (
        <div className="rejected-section">
          <h3 className="pending-section-title">
            <Ban size={18} /> Rejected
            <span className="count-badge" style={{ background: 'var(--danger)' }}>{rejectedUsers.length}</span>
          </h3>
          <div className="pending-list">
            {rejectedUsers.map((user) => (
              <div key={user.id} className="pending-card rejected-card">
                <div className="pending-card-top">
                  <div className="user-avatar rejected-avatar">{user.name.charAt(0).toUpperCase()}</div>
                  <div className="user-info">
                    <div className="user-name-row"><strong>{user.name}</strong><span className="rejected-status-tag">Rejected</span></div>
                    <span className="user-username">@{user.username}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                </div>
                <div className="pending-card-actions">
                  <div className="pending-role-select">
                    <label>Assign Role:</label>
                    <select
                      value={approveRoles[user.id] || 'staff'}
                      onChange={(e) => setApproveRoles((prev) => ({ ...prev, [user.id]: e.target.value }))}
                      className="filter-select"
                    >
                      {Object.entries(ROLES).map(([key, role]) => (
                        <option key={key} value={key}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn btn-sm btn-confirm" onClick={() => handleApprove(user.id)}>
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button className="btn btn-sm btn-delete" onClick={() => deleteUser(user.id)}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="um-form-card">
          <h3>{editingId ? 'Edit User' : 'Register New User'}</h3>
          <form onSubmit={handleSubmit} className="um-form">
            <div className="form-row">
              <div className="form-group"><label>Full Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Username *</label><input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
              <div className="form-group"><label>{editingId ? 'New Password (leave blank to keep)' : 'Password *'}</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingId} /></div>
            </div>
            <div className="form-group">
              <label>Role *</label>
              <div className="role-selector">
                {Object.entries(ROLES).map(([key, role]) => (
                  <label key={key} className={`role-option ${form.role === key ? 'selected' : ''}`}>
                    <input type="radio" name="role" value={key} checked={form.role === key} onChange={(e) => setForm({ ...form, role: e.target.value })} />
                    <div><strong>{role.label}</strong><span>{role.description}</span></div>
                  </label>
                ))}
              </div>
            </div>
            <div className="um-form-actions">
              <button type="submit" className="btn btn-primary btn-sm">{editingId ? 'Update User' : 'Create User'}</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      <div className="users-list">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--dark)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} /> Active Users
        </h3>
        {approvedUsers.map((user) => (
          <div key={user.id} className={`user-card ${user.id === currentUser?.id ? 'current-user' : ''}`}>
            <div className="user-card-top">
              <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <div className="user-name-row"><strong>{user.name}</strong>{user.id === currentUser?.id && <span className="you-badge">You</span>}</div>
                <span className="user-username">@{user.username}</span>
                <span className="user-email">{user.email}</span>
              </div>
              <RoleBadge role={user.role} />
            </div>
            <div className="user-card-meta">
              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              {user.id === currentUser?.id && (
                <div className="user-password-peek">
                  <button className="btn-icon" onClick={() => setShowPasswords((p) => ({ ...p, [user.id]: !p[user.id] }))}>{showPasswords[user.id] ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  {showPasswords[user.id] && <code className="password-reveal">{user.password}</code>}
                </div>
              )}
            </div>
            <div className="user-card-actions">
              <button className="btn btn-sm btn-outline" onClick={() => startEdit(user)}><Edit3 size={14} /> Edit</button>
              {user.id !== '1' && user.id !== currentUser?.id && <button className="btn btn-sm btn-delete" onClick={() => deleteUser(user.id)}><Trash2 size={14} /> Delete</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== EXPENSES TAB ===== */
function ExpensesTab() {
  const { expenses, addExpense, deleteExpense, EXPENSE_CATEGORIES, currentUser } = useAppContext();

  const [form, setForm] = useState({ category: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: '', description: '' });
  const [receipt, setReceipt] = useState(null);
  const [receiptName, setReceiptName] = useState('');
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [filterCat, setFilterCat] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printSettings, setPrintSettings] = useState({
    reportType: 'month', // 'month', 'dateRange', 'year', 'all'
    selectedMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    startDate: '',
    endDate: '',
    selectedYear: new Date().getFullYear(),
    category: 'all',
    groupBy: 'none', // 'none', 'category', 'day', 'week'
  });

  const compressImage = (file) => {
    return new Promise((resolve) => {
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 800;
          let w = img.width, h = img.height;
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
            else { w = Math.round(w * MAX / h); h = MAX; }
          }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (file) => {
    if (!file) return;
    setReceiptName(file.name);
    const compressed = await compressImage(file);
    setReceipt(compressed);
    if (file.type.startsWith('image/')) {
      setReceiptPreview(compressed);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.category || !form.amount || !form.date) {
      setFormError('Category, amount, and date are required');
      return;
    }
    const result = addExpense({ ...form, receipt, receiptName });
    if (result.success) {
      setForm({ category: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: '', description: '' });
      setReceipt(null);
      setReceiptName('');
      setReceiptPreview(null);
    } else {
      setFormError(result.error);
    }
  };

  const handleDelete = (id) => {
    deleteExpense(id);
    setDeleteConfirm(null);
  };

  // Summary
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonth = `${now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()}-${String(now.getMonth() === 0 ? 12 : now.getMonth()).padStart(2, '0')}`;

  const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
  const prevMonthExpenses = expenses.filter((e) => e.date.startsWith(prevMonth));
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const prevMonthTotal = prevMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const monthChange = prevMonthTotal > 0 ? ((monthTotal - prevMonthTotal) / prevMonthTotal * 100).toFixed(1) : null;

  const categoryBreakdown = EXPENSE_CATEGORIES.map((cat) => {
    const total = monthExpenses.filter((e) => e.category === cat.value).reduce((s, e) => s + e.amount, 0);
    return { ...cat, total };
  }).filter((c) => c.total > 0);
  const maxCatTotal = Math.max(...categoryBreakdown.map((c) => c.total), 1);

  // Filtered & sorted list
  const filtered = expenses
    .filter((e) => filterCat === 'all' || e.category === filterCat)
    .sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

  const getCatLabel = (val) => EXPENSE_CATEGORIES.find((c) => c.value === val)?.label || val;
  const getCatColor = (val) => EXPENSE_CATEGORIES.find((c) => c.value === val)?.color || '#6b7280';

  // Get available months and years for dropdowns
  const availableMonths = useMemo(() => {
    const months = new Set();
    expenses.forEach((e) => {
      const [year, month] = e.date.split('-');
      months.add(`${year}-${month}`);
    });
    return Array.from(months).sort().reverse();
  }, [expenses]);

  const availableYears = useMemo(() => {
    const years = new Set();
    expenses.forEach((e) => years.add(parseInt(e.date.split('-')[0])));
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [expenses]);

  // Get filtered expenses for print based on settings
  const getFilteredExpensesForPrint = () => {
    let result = [...expenses];

    // Filter by date range/type
    if (printSettings.reportType === 'month') {
      result = result.filter((e) => e.date.startsWith(printSettings.selectedMonth));
    } else if (printSettings.reportType === 'year') {
      result = result.filter((e) => e.date.startsWith(printSettings.selectedYear.toString()));
    } else if (printSettings.reportType === 'dateRange' && printSettings.startDate && printSettings.endDate) {
      result = result.filter((e) => e.date >= printSettings.startDate && e.date <= printSettings.endDate);
    }

    // Filter by category
    if (printSettings.category !== 'all') {
      result = result.filter((e) => e.category === printSettings.category);
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  };

  // Get period label for report
  const getPeriodLabel = () => {
    if (printSettings.reportType === 'month') {
      const [year, month] = printSettings.selectedMonth.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (printSettings.reportType === 'year') {
      return `Year ${printSettings.selectedYear}`;
    } else if (printSettings.reportType === 'dateRange' && printSettings.startDate && printSettings.endDate) {
      const start = new Date(printSettings.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const end = new Date(printSettings.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${start} - ${end}`;
    }
    return 'All Time';
  };

  // Group expenses for report
  const groupExpenses = (expenseList) => {
    if (printSettings.groupBy === 'none') return null;

    const groups = {};
    expenseList.forEach((e) => {
      let key;
      if (printSettings.groupBy === 'category') {
        key = getCatLabel(e.category);
      } else if (printSettings.groupBy === 'day') {
        key = e.date;
      } else if (printSettings.groupBy === 'week') {
        const d = new Date(e.date + 'T00:00:00');
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().split('T')[0];
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return groups;
  };

  // Print expenses report
  const handlePrintExpenses = () => {
    const reportExpenses = getFilteredExpensesForPrint();
    const reportTotal = reportExpenses.reduce((s, e) => s + e.amount, 0);
    const catTotals = EXPENSE_CATEGORIES.map((cat) => ({
      ...cat,
      total: reportExpenses.filter((e) => e.category === cat.value).reduce((s, e) => s + e.amount, 0),
      count: reportExpenses.filter((e) => e.category === cat.value).length,
    })).filter((c) => c.total > 0);

    const groups = groupExpenses(reportExpenses);
    const periodLabel = getPeriodLabel();
    const categoryLabel = printSettings.category === 'all' ? 'All Categories' : getCatLabel(printSettings.category);

    let groupedHtml = '';
    if (groups) {
      const sortedKeys = Object.keys(groups).sort();
      groupedHtml = sortedKeys.map((key) => {
        const items = groups[key];
        const groupTotal = items.reduce((s, e) => s + e.amount, 0);
        let groupLabel = key;
        if (printSettings.groupBy === 'day') {
          groupLabel = new Date(key + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        } else if (printSettings.groupBy === 'week') {
          const weekEnd = new Date(key + 'T00:00:00');
          weekEnd.setDate(weekEnd.getDate() + 6);
          groupLabel = `Week of ${new Date(key + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
        return `
          <div class="group-section">
            <h3 class="group-header">${groupLabel} <span class="group-total">$${groupTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></h3>
            <table class="expense-table">
              <thead><tr><th>Date</th><th>Category</th><th>Vendor</th><th>Description</th><th class="amount">Amount</th></tr></thead>
              <tbody>
                ${items.map((e) => `
                  <tr>
                    <td>${new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                    <td>${getCatLabel(e.category)}</td>
                    <td>${e.vendor || '-'}</td>
                    <td>${e.description || '-'}</td>
                    <td class="amount">$${e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }).join('');
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expense Report - ${periodLabel}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 900px; margin: 0 auto; }
          h1 { color: #1e3a5f; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 5px; }
          h2 { color: #374151; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
          .report-meta { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
          .report-meta span { display: inline-block; margin-right: 20px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 25px 0; }
          .summary-card { background: #f3f4f6; padding: 18px; border-radius: 8px; text-align: center; }
          .summary-card h3 { margin: 0 0 8px; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .summary-card p { margin: 0; font-size: 22px; font-weight: bold; color: #1e3a5f; }
          .category-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .category-table th, .category-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          .category-table th { background: #f9fafb; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          .category-table tr:last-child { background: #f0f9ff; }
          .category-table tr:last-child td { font-weight: bold; border-top: 2px solid #1e3a5f; }
          .expense-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
          .expense-table th, .expense-table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          .expense-table th { background: #f9fafb; font-weight: 600; }
          .expense-table .amount { text-align: right; font-family: monospace; }
          .group-section { margin-bottom: 25px; page-break-inside: avoid; }
          .group-header { display: flex; justify-content: space-between; align-items: center; background: #f0f9ff; padding: 10px 15px; border-radius: 6px; margin: 0 0 10px; font-size: 14px; }
          .group-total { color: #1e3a5f; font-weight: bold; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center; }
          @media print {
            body { padding: 20px; }
            .group-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>Expense Report</h1>
        <div class="report-meta">
          <span><strong>Period:</strong> ${periodLabel}</span>
          <span><strong>Category:</strong> ${categoryLabel}</span>
          <span><strong>Generated:</strong> ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>

        <div class="summary">
          <div class="summary-card">
            <h3>Total Expenses</h3>
            <p>$${reportTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div class="summary-card">
            <h3>Transactions</h3>
            <p>${reportExpenses.length}</p>
          </div>
          <div class="summary-card">
            <h3>Categories</h3>
            <p>${catTotals.length}</p>
          </div>
          <div class="summary-card">
            <h3>Avg per Transaction</h3>
            <p>$${reportExpenses.length > 0 ? (reportTotal / reportExpenses.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</p>
          </div>
        </div>

        <h2>Summary by Category</h2>
        <table class="category-table">
          <thead><tr><th>Category</th><th>Count</th><th style="text-align:right">Amount</th><th style="text-align:right">% of Total</th></tr></thead>
          <tbody>
            ${catTotals.map((c) => `
              <tr>
                <td>${c.label}</td>
                <td>${c.count}</td>
                <td style="text-align:right">$${c.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style="text-align:right">${reportTotal > 0 ? ((c.total / reportTotal) * 100).toFixed(1) : 0}%</td>
              </tr>
            `).join('')}
            <tr>
              <td>TOTAL</td>
              <td>${reportExpenses.length}</td>
              <td style="text-align:right">$${reportTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td style="text-align:right">100%</td>
            </tr>
          </tbody>
        </table>

        <h2>Expense Details${printSettings.groupBy !== 'none' ? ` (Grouped by ${printSettings.groupBy === 'category' ? 'Category' : printSettings.groupBy === 'day' ? 'Day' : 'Week'})` : ''}</h2>
        ${groups ? groupedHtml : `
          <table class="expense-table">
            <thead><tr><th>Date</th><th>Category</th><th>Vendor</th><th>Description</th><th class="amount">Amount</th></tr></thead>
            <tbody>
              ${reportExpenses.map((e) => `
                <tr>
                  <td>${new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>${getCatLabel(e.category)}</td>
                  <td>${e.vendor || '-'}</td>
                  <td>${e.description || '-'}</td>
                  <td class="amount">$${e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}

        <div class="footer">
          <p>Three Seas Digital CRM — Expense Report — Keep this document for your tax records</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    setShowPrintModal(false);
  };

  return (
    <div className="expenses-tab">
      {/* Summary */}
      <div className="expense-summary">
        <div className="expense-summary-card">
          <span className="expense-summary-label">This Month</span>
          <span className="expense-summary-value">${monthTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          {monthChange !== null && (
            <span className={`expense-summary-change ${parseFloat(monthChange) > 0 ? 'up' : 'down'}`}>
              {parseFloat(monthChange) > 0 ? '+' : ''}{monthChange}% vs last month
            </span>
          )}
        </div>
        <div className="expense-summary-card">
          <span className="expense-summary-label">Total Expenses</span>
          <span className="expense-summary-value">${expenses.reduce((s, e) => s + e.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="expense-summary-change neutral">{expenses.length} recorded</span>
        </div>
        {categoryBreakdown.length > 0 && (
          <div className="expense-summary-card wide">
            <span className="expense-summary-label">This Month by Category</span>
            <div className="expense-category-bars">
              {categoryBreakdown.map((cat) => (
                <div key={cat.value} className="expense-category-bar">
                  <div className="expense-cat-bar-label">
                    <span style={{ color: cat.color }}>{cat.label}</span>
                    <span>${cat.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="expense-cat-bar-track">
                    <div className="expense-cat-bar-fill" style={{ width: `${(cat.total / maxCatTotal) * 100}%`, background: cat.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expense Form */}
      <div className="expense-form-wrapper">
        <h3><Plus size={16} /> Record Expense</h3>
        {formError && <div className="login-error">{formError}</div>}
        <form className="expense-form" onSubmit={handleSubmit}>
          <div className="expense-form-group">
            <label>Category *</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
              <option value="">Select category...</option>
              {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="expense-form-group">
            <label>Amount *</label>
            <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
          </div>
          <div className="expense-form-group">
            <label>Date *</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div className="expense-form-group">
            <label>Vendor</label>
            <input type="text" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="Vendor name" />
          </div>
          <div className="expense-form-group full-width">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Expense details..." rows={2} />
          </div>
          <div className="expense-form-group full-width">
            <label>Receipt</label>
            <div
              className={`receipt-upload-area ${isDragging ? 'dragover' : ''} ${receiptPreview ? 'has-file' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('receipt-file-input').click()}
            >
              <input id="receipt-file-input" type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
              {receiptPreview ? (
                <div className="receipt-preview">
                  <img src={receiptPreview} alt="Receipt preview" />
                  <button type="button" className="receipt-remove-btn" onClick={(e) => { e.stopPropagation(); setReceipt(null); setReceiptName(''); setReceiptPreview(null); }}><X size={14} /></button>
                  <span className="receipt-filename">{receiptName}</span>
                </div>
              ) : receiptName ? (
                <div className="receipt-preview">
                  <FileText size={32} />
                  <button type="button" className="receipt-remove-btn" onClick={(e) => { e.stopPropagation(); setReceipt(null); setReceiptName(''); setReceiptPreview(null); }}><X size={14} /></button>
                  <span className="receipt-filename">{receiptName}</span>
                </div>
              ) : (
                <div className="receipt-upload-placeholder">
                  <Receipt size={24} />
                  <span>Drop receipt here or click to upload</span>
                  <span className="receipt-upload-hint">Images or PDF</span>
                </div>
              )}
            </div>
          </div>
          <div className="expense-form-actions">
            <button type="submit" className="btn btn-primary"><Plus size={14} /> Add Expense</button>
          </div>
        </form>
      </div>

      {/* Expense List */}
      <div className="expense-list-section">
        <div className="expense-list-header">
          <h3><Receipt size={16} /> Expense Records ({filtered.length})</h3>
          <div className="expense-list-filters">
            <button className="btn btn-outline btn-sm" onClick={() => setShowPrintModal(true)} title="Print expense report">
              <Printer size={14} /> Print Report
            </button>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state"><Receipt size={48} /><p>No expenses recorded yet</p></div>
        ) : (
          <div className="expense-list">
            {filtered.map((exp) => (
              <div key={exp.id} className="expense-card">
                <div className="expense-card-top">
                  <span className="expense-category-badge" style={{ background: getCatColor(exp.category) }}>{getCatLabel(exp.category)}</span>
                  <span className="expense-amount">${exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {exp.vendor && <div className="expense-vendor">{exp.vendor}</div>}
                {exp.description && <div className="expense-description">{exp.description}</div>}
                <div className="expense-card-bottom">
                  <span className="expense-date">{new Date(exp.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <div className="expense-card-actions">
                    {exp.receipt && (
                      <button className="receipt-indicator" title="View receipt" onClick={() => setReceiptModal(exp)}>
                        <Eye size={14} /> Receipt
                      </button>
                    )}
                    {deleteConfirm === exp.id ? (
                      <>
                        <button className="btn btn-sm btn-delete" onClick={() => handleDelete(exp.id)}>Confirm</button>
                        <button className="btn btn-sm btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-delete" onClick={() => setDeleteConfirm(exp.id)}><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {receiptModal && (
        <div className="receipt-modal" onClick={() => setReceiptModal(null)}>
          <div className="receipt-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="receipt-modal-close" onClick={() => setReceiptModal(null)}><X size={20} /></button>
            <h3>Receipt — {getCatLabel(receiptModal.category)}</h3>
            {receiptModal.vendor && <p>{receiptModal.vendor} — ${receiptModal.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>}
            {receiptModal.receipt && receiptModal.receipt.startsWith('data:image') ? (
              <img src={receiptModal.receipt} alt="Receipt" className="receipt-modal-image" />
            ) : receiptModal.receipt ? (
              <div className="receipt-modal-pdf">
                <FileText size={48} />
                <p>{receiptModal.receiptName || 'PDF Receipt'}</p>
                <a href={receiptModal.receipt} download={receiptModal.receiptName || 'receipt.pdf'} className="btn btn-primary btn-sm">Download PDF</a>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Print Report Modal */}
      {showPrintModal && (
        <div className="print-modal-overlay" onClick={() => setShowPrintModal(false)}>
          <div className="print-modal" onClick={(e) => e.stopPropagation()}>
            <div className="print-modal-header">
              <h3><Printer size={20} /> Print Expense Report</h3>
              <button className="print-modal-close" onClick={() => setShowPrintModal(false)}><X size={20} /></button>
            </div>

            <div className="print-modal-body">
              {/* Report Type */}
              <div className="print-option-group">
                <label className="print-option-label">Report Period</label>
                <div className="print-option-buttons">
                  {[
                    { value: 'month', label: 'Month' },
                    { value: 'year', label: 'Year' },
                    { value: 'dateRange', label: 'Date Range' },
                    { value: 'all', label: 'All Time' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      className={`print-option-btn ${printSettings.reportType === opt.value ? 'active' : ''}`}
                      onClick={() => setPrintSettings({ ...printSettings, reportType: opt.value })}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Month Selector */}
              {printSettings.reportType === 'month' && (
                <div className="print-option-group">
                  <label className="print-option-label">Select Month</label>
                  <select
                    value={printSettings.selectedMonth}
                    onChange={(e) => setPrintSettings({ ...printSettings, selectedMonth: e.target.value })}
                    className="print-select"
                  >
                    {availableMonths.map((m) => {
                      const [year, month] = m.split('-');
                      const label = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      return <option key={m} value={m}>{label}</option>;
                    })}
                  </select>
                </div>
              )}

              {/* Year Selector */}
              {printSettings.reportType === 'year' && (
                <div className="print-option-group">
                  <label className="print-option-label">Select Year</label>
                  <select
                    value={printSettings.selectedYear}
                    onChange={(e) => setPrintSettings({ ...printSettings, selectedYear: parseInt(e.target.value) })}
                    className="print-select"
                  >
                    {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}

              {/* Date Range */}
              {printSettings.reportType === 'dateRange' && (
                <div className="print-option-group">
                  <label className="print-option-label">Date Range</label>
                  <div className="print-date-range">
                    <input
                      type="date"
                      value={printSettings.startDate}
                      onChange={(e) => setPrintSettings({ ...printSettings, startDate: e.target.value })}
                      className="print-date-input"
                    />
                    <span>to</span>
                    <input
                      type="date"
                      value={printSettings.endDate}
                      onChange={(e) => setPrintSettings({ ...printSettings, endDate: e.target.value })}
                      className="print-date-input"
                    />
                  </div>
                </div>
              )}

              {/* Category Filter */}
              <div className="print-option-group">
                <label className="print-option-label">Category</label>
                <select
                  value={printSettings.category}
                  onChange={(e) => setPrintSettings({ ...printSettings, category: e.target.value })}
                  className="print-select"
                >
                  <option value="all">All Categories</option>
                  {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Group By */}
              <div className="print-option-group">
                <label className="print-option-label">Group By</label>
                <div className="print-option-buttons">
                  {[
                    { value: 'none', label: 'None' },
                    { value: 'day', label: 'Day' },
                    { value: 'week', label: 'Week' },
                    { value: 'category', label: 'Category' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      className={`print-option-btn ${printSettings.groupBy === opt.value ? 'active' : ''}`}
                      onClick={() => setPrintSettings({ ...printSettings, groupBy: opt.value })}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview count */}
              <div className="print-preview-info">
                <Receipt size={16} />
                <span>{getFilteredExpensesForPrint().length} expenses will be included in this report</span>
              </div>
            </div>

            <div className="print-modal-footer">
              <button className="btn btn-outline" onClick={() => setShowPrintModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePrintExpenses} disabled={getFilteredExpensesForPrint().length === 0}>
                <Printer size={16} /> Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== REVENUE TAB ===== */
function RevenueTab() {
  const { payments, clients, SUBSCRIPTION_TIERS } = useAppContext();
  const [viewMode, setViewMode] = useState('monthly'); // monthly, quarterly, yearly
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const getPaymentDate = (p) => new Date(p.createdAt);
  const getPaymentYear = (p) => getPaymentDate(p).getFullYear();
  const getPaymentMonth = (p) => getPaymentDate(p).getMonth();
  const getPaymentQuarter = (p) => Math.floor(getPaymentDate(p).getMonth() / 3);

  const availableYears = useMemo(() => {
    const years = new Set();
    payments.forEach((p) => years.add(getPaymentYear(p)));
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [payments]);

  const yearPayments = useMemo(() => {
    return payments.filter((p) => getPaymentYear(p) === selectedYear && p.status === 'completed');
  }, [payments, selectedYear]);

  const totalRevenue = yearPayments.reduce((sum, p) => sum + p.amount, 0);

  // Monthly data
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      name: new Date(selectedYear, i).toLocaleString('en-US', { month: 'short' }),
      fullName: new Date(selectedYear, i).toLocaleString('en-US', { month: 'long' }),
      revenue: 0,
      count: 0,
      payments: [],
    }));
    yearPayments.forEach((p) => {
      const m = getPaymentMonth(p);
      months[m].revenue += p.amount;
      months[m].count += 1;
      months[m].payments.push(p);
    });
    return months;
  }, [yearPayments, selectedYear]);

  // Quarterly data
  const quarterlyData = useMemo(() => {
    const quarters = [
      { name: 'Q1', months: 'Jan - Mar', revenue: 0, count: 0 },
      { name: 'Q2', months: 'Apr - Jun', revenue: 0, count: 0 },
      { name: 'Q3', months: 'Jul - Sep', revenue: 0, count: 0 },
      { name: 'Q4', months: 'Oct - Dec', revenue: 0, count: 0 },
    ];
    yearPayments.forEach((p) => {
      const q = getPaymentQuarter(p);
      quarters[q].revenue += p.amount;
      quarters[q].count += 1;
    });
    return quarters;
  }, [yearPayments]);

  // By service
  const byService = useMemo(() => {
    const services = {};
    yearPayments.forEach((p) => {
      const s = p.service || 'other';
      if (!services[s]) services[s] = { name: s, revenue: 0, count: 0 };
      services[s].revenue += p.amount;
      services[s].count += 1;
    });
    return Object.values(services).sort((a, b) => b.revenue - a.revenue);
  }, [yearPayments]);

  // By tier
  const byTier = useMemo(() => {
    const tiers = {};
    yearPayments.forEach((p) => {
      const t = p.serviceTier || 'basic';
      if (!tiers[t]) tiers[t] = { name: t, label: SUBSCRIPTION_TIERS[t]?.label || t, revenue: 0, count: 0 };
      tiers[t].revenue += p.amount;
      tiers[t].count += 1;
    });
    return Object.values(tiers).sort((a, b) => b.revenue - a.revenue);
  }, [yearPayments, SUBSCRIPTION_TIERS]);

  // By payment method
  const byMethod = useMemo(() => {
    const methods = {};
    yearPayments.forEach((p) => {
      const m = p.method || 'other';
      if (!methods[m]) methods[m] = { name: m, revenue: 0, count: 0 };
      methods[m].revenue += p.amount;
      methods[m].count += 1;
    });
    return Object.values(methods).sort((a, b) => b.revenue - a.revenue);
  }, [yearPayments]);

  const maxMonthRevenue = Math.max(...monthlyData.map((m) => m.revenue), 1);
  const avgMonthly = totalRevenue / 12;
  const currentMonth = new Date().getMonth();
  const ytdRevenue = monthlyData.slice(0, currentMonth + 1).reduce((sum, m) => sum + m.revenue, 0);

  const formatCurrency = (num) => `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatLabel = (str) => str.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Print revenue report
  const handlePrintRevenue = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Revenue Report - ${selectedYear}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 900px; margin: 0 auto; }
          h1 { color: #1e3a5f; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .summary-card { background: #f3f4f6; padding: 18px; border-radius: 8px; text-align: center; }
          .summary-card.highlight { background: #ecfdf5; border: 1px solid #10b981; }
          .summary-card h3 { margin: 0 0 8px; font-size: 11px; color: #6b7280; text-transform: uppercase; }
          .summary-card p { margin: 0; font-size: 20px; font-weight: bold; color: #1e3a5f; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; font-size: 12px; }
          td.amount { text-align: right; font-family: monospace; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Revenue Report - ${selectedYear}</h1>
        <p>Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div class="summary">
          <div class="summary-card highlight"><h3>Total Revenue</h3><p>${formatCurrency(totalRevenue)}</p></div>
          <div class="summary-card"><h3>Transactions</h3><p>${yearPayments.length}</p></div>
          <div class="summary-card"><h3>Avg Monthly</h3><p>${formatCurrency(avgMonthly)}</p></div>
          <div class="summary-card"><h3>YTD Revenue</h3><p>${formatCurrency(ytdRevenue)}</p></div>
        </div>

        <h2>Monthly Breakdown</h2>
        <table>
          <thead><tr><th>Month</th><th>Transactions</th><th class="amount">Revenue</th><th class="amount">% of Total</th></tr></thead>
          <tbody>
            ${monthlyData.map((m) => `<tr><td>${m.fullName}</td><td>${m.count}</td><td class="amount">${formatCurrency(m.revenue)}</td><td class="amount">${totalRevenue > 0 ? ((m.revenue / totalRevenue) * 100).toFixed(1) : 0}%</td></tr>`).join('')}
          </tbody>
        </table>

        <h2>By Service</h2>
        <table>
          <thead><tr><th>Service</th><th>Transactions</th><th class="amount">Revenue</th></tr></thead>
          <tbody>${byService.map((s) => `<tr><td>${formatLabel(s.name)}</td><td>${s.count}</td><td class="amount">${formatCurrency(s.revenue)}</td></tr>`).join('')}</tbody>
        </table>

        <h2>By Tier</h2>
        <table>
          <thead><tr><th>Tier</th><th>Transactions</th><th class="amount">Revenue</th></tr></thead>
          <tbody>${byTier.map((t) => `<tr><td>${t.label}</td><td>${t.count}</td><td class="amount">${formatCurrency(t.revenue)}</td></tr>`).join('')}</tbody>
        </table>

        <div class="footer"><p>Three Seas Digital CRM — Revenue Report</p></div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="revenue-tab">
      <div className="revenue-header">
        <div className="revenue-header-left">
          <h2><DollarSign size={24} /> Revenue Overview</h2>
          <p>Track and analyze your business income</p>
        </div>
        <div className="revenue-header-actions">
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="revenue-year-select">
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="revenue-view-toggle">
            {['monthly', 'quarterly'].map((v) => (
              <button key={v} className={viewMode === v ? 'active' : ''} onClick={() => setViewMode(v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={handlePrintRevenue}>
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="revenue-summary-grid">
        <div className="revenue-summary-card highlight">
          <div className="revenue-summary-icon"><DollarSign size={24} /></div>
          <div className="revenue-summary-content">
            <span className="revenue-summary-label">Total Revenue</span>
            <span className="revenue-summary-value">{formatCurrency(totalRevenue)}</span>
            <span className="revenue-summary-sub">{selectedYear}</span>
          </div>
        </div>
        <div className="revenue-summary-card">
          <div className="revenue-summary-icon"><CreditCard size={24} /></div>
          <div className="revenue-summary-content">
            <span className="revenue-summary-label">Transactions</span>
            <span className="revenue-summary-value">{yearPayments.length}</span>
            <span className="revenue-summary-sub">Completed payments</span>
          </div>
        </div>
        <div className="revenue-summary-card">
          <div className="revenue-summary-icon"><TrendingUp size={24} /></div>
          <div className="revenue-summary-content">
            <span className="revenue-summary-label">Avg Monthly</span>
            <span className="revenue-summary-value">{formatCurrency(avgMonthly)}</span>
            <span className="revenue-summary-sub">Per month avg</span>
          </div>
        </div>
        <div className="revenue-summary-card">
          <div className="revenue-summary-icon"><CalendarIcon size={24} /></div>
          <div className="revenue-summary-content">
            <span className="revenue-summary-label">YTD Revenue</span>
            <span className="revenue-summary-value">{formatCurrency(ytdRevenue)}</span>
            <span className="revenue-summary-sub">Year to date</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="revenue-chart-section">
        <h3>{viewMode === 'monthly' ? 'Monthly Revenue' : 'Quarterly Revenue'}</h3>
        <div className="revenue-bars">
          {viewMode === 'monthly' ? (
            monthlyData.map((m) => (
              <div key={m.month} className="revenue-bar-item">
                <div className="revenue-bar-wrapper">
                  <div
                    className="revenue-bar-fill"
                    style={{ height: `${(m.revenue / maxMonthRevenue) * 100}%` }}
                  />
                </div>
                <span className="revenue-bar-label">{m.name}</span>
                <span className="revenue-bar-value">{formatCurrency(m.revenue)}</span>
              </div>
            ))
          ) : (
            quarterlyData.map((q, i) => (
              <div key={i} className="revenue-bar-item quarterly">
                <div className="revenue-bar-wrapper">
                  <div
                    className="revenue-bar-fill"
                    style={{ height: `${(q.revenue / Math.max(...quarterlyData.map((x) => x.revenue), 1)) * 100}%` }}
                  />
                </div>
                <span className="revenue-bar-label">{q.name}</span>
                <span className="revenue-bar-value">{formatCurrency(q.revenue)}</span>
                <span className="revenue-bar-sub">{q.count} txns</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Breakdown Sections */}
      <div className="revenue-breakdown-grid">
        <div className="revenue-breakdown-card">
          <h4>By Service</h4>
          {byService.length === 0 ? (
            <p className="revenue-empty">No data</p>
          ) : (
            <div className="revenue-breakdown-list">
              {byService.map((s) => (
                <div key={s.name} className="revenue-breakdown-row">
                  <span className="revenue-breakdown-name">{formatLabel(s.name)}</span>
                  <span className="revenue-breakdown-count">{s.count}</span>
                  <span className="revenue-breakdown-amount">{formatCurrency(s.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="revenue-breakdown-card">
          <h4>By Tier</h4>
          {byTier.length === 0 ? (
            <p className="revenue-empty">No data</p>
          ) : (
            <div className="revenue-breakdown-list">
              {byTier.map((t) => (
                <div key={t.name} className="revenue-breakdown-row">
                  <span className="revenue-breakdown-name">{t.label}</span>
                  <span className="revenue-breakdown-count">{t.count}</span>
                  <span className="revenue-breakdown-amount">{formatCurrency(t.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="revenue-breakdown-card">
          <h4>By Payment Method</h4>
          {byMethod.length === 0 ? (
            <p className="revenue-empty">No data</p>
          ) : (
            <div className="revenue-breakdown-list">
              {byMethod.map((m) => (
                <div key={m.name} className="revenue-breakdown-row">
                  <span className="revenue-breakdown-name">{formatLabel(m.name)}</span>
                  <span className="revenue-breakdown-count">{m.count}</span>
                  <span className="revenue-breakdown-amount">{formatCurrency(m.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== INVOICES TAB ===== */
function InvoicesTab() {
  const { clients, markInvoicePaid, unmarkInvoicePaid, deleteInvoice, hasPermission, currentUser } = useAppContext();
  const canManage = hasPermission('manage_clients');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedYear, setSelectedYear] = useState('all');

  // Gather all invoices from all clients
  const allInvoices = useMemo(() => {
    const invoices = [];
    clients.forEach((client) => {
      (client.invoices || []).forEach((inv) => {
        invoices.push({
          ...inv,
          clientId: client.id,
          clientName: client.name,
          clientEmail: client.email,
          clientTier: client.tier || 'free',
        });
      });
    });
    return invoices;
  }, [clients]);

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set();
    allInvoices.forEach((inv) => {
      const year = new Date(inv.createdAt).getFullYear();
      years.add(year);
    });
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [allInvoices]);

  // Get unique clients for filter
  const clientsWithInvoices = useMemo(() => {
    const clientMap = new Map();
    allInvoices.forEach((inv) => {
      if (!clientMap.has(inv.clientId)) {
        clientMap.set(inv.clientId, { id: inv.clientId, name: inv.clientName });
      }
    });
    return Array.from(clientMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allInvoices]);

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    let result = [...allInvoices];

    // Filter by year
    if (selectedYear !== 'all') {
      result = result.filter((inv) => new Date(inv.createdAt).getFullYear() === parseInt(selectedYear));
    }

    // Filter by status
    if (filterStatus !== 'all') {
      if (filterStatus === 'overdue') {
        result = result.filter((inv) => inv.status === 'unpaid' && inv.dueDate && new Date(inv.dueDate) < new Date());
      } else {
        result = result.filter((inv) => inv.status === filterStatus);
      }
    }

    // Filter by client
    if (filterClient !== 'all') {
      result = result.filter((inv) => inv.clientId === filterClient);
    }

    // Filter by search
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((inv) =>
        inv.title.toLowerCase().includes(s) ||
        inv.clientName.toLowerCase().includes(s) ||
        inv.clientEmail.toLowerCase().includes(s) ||
        (inv.description || '').toLowerCase().includes(s)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'amount-high':
          return b.amount - a.amount;
        case 'amount-low':
          return a.amount - b.amount;
        case 'due-date':
          return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
        case 'client':
          return a.clientName.localeCompare(b.clientName);
        default: // newest
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return result;
  }, [allInvoices, selectedYear, filterStatus, filterClient, search, sortBy]);

  // Summary stats
  const stats = useMemo(() => {
    const total = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paid = filteredInvoices.filter((inv) => inv.status === 'paid');
    const unpaid = filteredInvoices.filter((inv) => inv.status === 'unpaid');
    const overdue = unpaid.filter((inv) => inv.dueDate && new Date(inv.dueDate) < new Date());
    return {
      count: filteredInvoices.length,
      total,
      paidCount: paid.length,
      paidAmount: paid.reduce((sum, inv) => sum + inv.amount, 0),
      unpaidCount: unpaid.length,
      unpaidAmount: unpaid.reduce((sum, inv) => sum + inv.amount, 0),
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((sum, inv) => sum + inv.amount, 0),
    };
  }, [filteredInvoices]);

  const formatCurrency = (num) => `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : '-';

  const isOverdue = (inv) => inv.status === 'unpaid' && inv.dueDate && new Date(inv.dueDate) < new Date();

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoices Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .summary { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
          .summary-card { background: #f5f5f5; padding: 15px; border-radius: 8px; min-width: 120px; }
          .summary-card h4 { margin: 0 0 5px 0; font-size: 12px; color: #666; }
          .summary-card p { margin: 0; font-size: 18px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: 600; }
          .paid { color: #22c55e; }
          .unpaid { color: #f59e0b; }
          .overdue { color: #ef4444; }
          .text-right { text-align: right; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Invoices Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <div class="summary">
          <div class="summary-card"><h4>Total Invoices</h4><p>${stats.count}</p></div>
          <div class="summary-card"><h4>Total Amount</h4><p>${formatCurrency(stats.total)}</p></div>
          <div class="summary-card"><h4>Paid</h4><p class="paid">${formatCurrency(stats.paidAmount)}</p></div>
          <div class="summary-card"><h4>Unpaid</h4><p class="unpaid">${formatCurrency(stats.unpaidAmount)}</p></div>
          <div class="summary-card"><h4>Overdue</h4><p class="overdue">${formatCurrency(stats.overdueAmount)}</p></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Client</th>
              <th>Created</th>
              <th>Due Date</th>
              <th>Status</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${filteredInvoices.map((inv) => `
              <tr>
                <td>${inv.title}</td>
                <td>${inv.clientName}</td>
                <td>${formatDate(inv.createdAt)}</td>
                <td>${formatDate(inv.dueDate)}</td>
                <td class="${isOverdue(inv) ? 'overdue' : inv.status}">${isOverdue(inv) ? 'Overdue' : inv.status}</td>
                <td class="text-right">${formatCurrency(inv.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="invoices-tab">
      <div className="invoices-header">
        <h2><FileSpreadsheet size={20} /> All Invoices</h2>
        <button className="btn btn-outline" onClick={handlePrint}>
          <Printer size={16} /> Print Report
        </button>
      </div>

      {/* Summary Stats */}
      <div className="invoices-summary">
        <div className="invoice-stat-card">
          <span className="invoice-stat-label">Total Invoices</span>
          <span className="invoice-stat-value">{stats.count}</span>
        </div>
        <div className="invoice-stat-card">
          <span className="invoice-stat-label">Total Amount</span>
          <span className="invoice-stat-value">{formatCurrency(stats.total)}</span>
        </div>
        <div className="invoice-stat-card paid">
          <span className="invoice-stat-label">Paid ({stats.paidCount})</span>
          <span className="invoice-stat-value">{formatCurrency(stats.paidAmount)}</span>
        </div>
        <div className="invoice-stat-card unpaid">
          <span className="invoice-stat-label">Unpaid ({stats.unpaidCount})</span>
          <span className="invoice-stat-value">{formatCurrency(stats.unpaidAmount)}</span>
        </div>
        {stats.overdueCount > 0 && (
          <div className="invoice-stat-card overdue">
            <span className="invoice-stat-label">Overdue ({stats.overdueCount})</span>
            <span className="invoice-stat-value">{formatCurrency(stats.overdueAmount)}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="invoices-filters">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="filter-select">
          <option value="all">All Years</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="overdue">Overdue</option>
        </select>
        <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="filter-select">
          <option value="all">All Clients</option>
          {clientsWithInvoices.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="amount-high">Amount (High to Low)</option>
          <option value="amount-low">Amount (Low to High)</option>
          <option value="due-date">Due Date</option>
          <option value="client">Client Name</option>
        </select>
      </div>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <div className="empty-state">
          <FileSpreadsheet size={48} />
          <p>No invoices found</p>
        </div>
      ) : (
        <div className="invoices-table-wrapper">
          <table className="invoices-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Created</th>
                <th>Due Date</th>
                <th>Status</th>
                <th className="text-right">Amount</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={`${inv.clientId}-${inv.id}`} className={isOverdue(inv) ? 'overdue-row' : ''}>
                  <td>
                    <div className="invoice-title-cell">
                      <strong>{inv.title}</strong>
                      {inv.description && <span className="invoice-desc">{inv.description}</span>}
                      {inv.recurring && <span className="recurring-badge"><RefreshCw size={10} /> Recurring</span>}
                    </div>
                  </td>
                  <td>
                    <div className="invoice-client-cell">
                      <span>{inv.clientName}</span>
                      <small>{inv.clientEmail}</small>
                    </div>
                  </td>
                  <td>{formatDate(inv.createdAt)}</td>
                  <td>{formatDate(inv.dueDate)}</td>
                  <td>
                    <span className={`invoice-status-badge ${isOverdue(inv) ? 'overdue' : inv.status}`}>
                      {isOverdue(inv) ? 'Overdue' : inv.status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="text-right">
                    <strong>{formatCurrency(inv.amount)}</strong>
                  </td>
                  {canManage && (
                    <td>
                      <div className="invoice-actions">
                        {inv.status === 'unpaid' ? (
                          <button
                            className="btn btn-xs btn-confirm"
                            onClick={() => markInvoicePaid(inv.clientId, inv.id)}
                            title="Mark as paid"
                          >
                            <CheckCircle size={14} />
                          </button>
                        ) : (
                          <button
                            className="btn btn-xs btn-outline"
                            onClick={() => unmarkInvoicePaid(inv.clientId, inv.id)}
                            title="Undo payment"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                        <button
                          className="btn btn-xs btn-delete"
                          onClick={() => deleteInvoice(inv.clientId, inv.id)}
                          title="Delete invoice"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ===== PROFIT TAB ===== */
function ProfitTab() {
  const { payments, expenses, EXPENSE_CATEGORIES } = useAppContext();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const getPaymentDate = (p) => new Date(p.createdAt);
  const getPaymentYear = (p) => getPaymentDate(p).getFullYear();
  const getPaymentMonth = (p) => getPaymentDate(p).getMonth();

  const availableYears = useMemo(() => {
    const years = new Set();
    payments.forEach((p) => years.add(getPaymentYear(p)));
    expenses.forEach((e) => years.add(parseInt(e.date.split('-')[0])));
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [payments, expenses]);

  const yearPayments = useMemo(() => {
    return payments.filter((p) => getPaymentYear(p) === selectedYear && p.status === 'completed');
  }, [payments, selectedYear]);

  const yearExpenses = useMemo(() => {
    return expenses.filter((e) => e.date.startsWith(selectedYear.toString()));
  }, [expenses, selectedYear]);

  const totalRevenue = yearPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
  const grossProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Monthly P&L
  const monthlyPL = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      name: new Date(selectedYear, i).toLocaleString('en-US', { month: 'short' }),
      fullName: new Date(selectedYear, i).toLocaleString('en-US', { month: 'long' }),
      revenue: 0,
      expenses: 0,
      profit: 0,
    }));

    yearPayments.forEach((p) => {
      const m = getPaymentMonth(p);
      months[m].revenue += p.amount;
    });

    yearExpenses.forEach((e) => {
      const m = parseInt(e.date.split('-')[1]) - 1;
      months[m].expenses += e.amount;
    });

    months.forEach((m) => {
      m.profit = m.revenue - m.expenses;
    });

    return months;
  }, [yearPayments, yearExpenses, selectedYear]);

  // Expense breakdown
  const expenseBreakdown = useMemo(() => {
    return EXPENSE_CATEGORIES.map((cat) => ({
      ...cat,
      total: yearExpenses.filter((e) => e.category === cat.value).reduce((sum, e) => sum + e.amount, 0),
    })).filter((c) => c.total > 0);
  }, [yearExpenses, EXPENSE_CATEGORIES]);

  const formatCurrency = (num) => `$${Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const maxValue = Math.max(...monthlyPL.map((m) => Math.max(m.revenue, m.expenses)), 1);

  // Print P&L report
  const handlePrintPL = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Profit & Loss - ${selectedYear}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 900px; margin: 0 auto; }
          h1 { color: #1e3a5f; border-bottom: 2px solid #8b5cf6; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .summary-card { background: #f3f4f6; padding: 18px; border-radius: 8px; text-align: center; }
          .summary-card.profit { background: #ecfdf5; border: 1px solid #10b981; }
          .summary-card.loss { background: #fef2f2; border: 1px solid #ef4444; }
          .summary-card h3 { margin: 0 0 8px; font-size: 11px; color: #6b7280; text-transform: uppercase; }
          .summary-card p { margin: 0; font-size: 20px; font-weight: bold; color: #1e3a5f; }
          .summary-card p.positive { color: #10b981; }
          .summary-card p.negative { color: #ef4444; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; font-size: 12px; }
          td.amount { text-align: right; font-family: monospace; }
          td.positive { color: #10b981; }
          td.negative { color: #ef4444; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Profit & Loss Statement - ${selectedYear}</h1>
        <p>Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div class="summary">
          <div class="summary-card"><h3>Revenue</h3><p>${formatCurrency(totalRevenue)}</p></div>
          <div class="summary-card"><h3>Expenses</h3><p>${formatCurrency(totalExpenses)}</p></div>
          <div class="summary-card ${grossProfit >= 0 ? 'profit' : 'loss'}"><h3>Net Profit</h3><p class="${grossProfit >= 0 ? 'positive' : 'negative'}">${grossProfit >= 0 ? '' : '-'}${formatCurrency(grossProfit)}</p></div>
          <div class="summary-card"><h3>Margin</h3><p>${profitMargin.toFixed(1)}%</p></div>
        </div>

        <h2>Monthly Profit & Loss</h2>
        <table>
          <thead><tr><th>Month</th><th class="amount">Revenue</th><th class="amount">Expenses</th><th class="amount">Profit</th></tr></thead>
          <tbody>
            ${monthlyPL.map((m) => `
              <tr>
                <td>${m.fullName}</td>
                <td class="amount">${formatCurrency(m.revenue)}</td>
                <td class="amount">${formatCurrency(m.expenses)}</td>
                <td class="amount ${m.profit >= 0 ? 'positive' : 'negative'}">${m.profit >= 0 ? '' : '-'}${formatCurrency(m.profit)}</td>
              </tr>
            `).join('')}
            <tr style="font-weight:bold;background:#f9fafb">
              <td>TOTAL</td>
              <td class="amount">${formatCurrency(totalRevenue)}</td>
              <td class="amount">${formatCurrency(totalExpenses)}</td>
              <td class="amount ${grossProfit >= 0 ? 'positive' : 'negative'}">${grossProfit >= 0 ? '' : '-'}${formatCurrency(grossProfit)}</td>
            </tr>
          </tbody>
        </table>

        <h2>Expense Breakdown</h2>
        <table>
          <thead><tr><th>Category</th><th class="amount">Amount</th><th class="amount">% of Expenses</th></tr></thead>
          <tbody>
            ${expenseBreakdown.map((c) => `<tr><td>${c.label}</td><td class="amount">${formatCurrency(c.total)}</td><td class="amount">${totalExpenses > 0 ? ((c.total / totalExpenses) * 100).toFixed(1) : 0}%</td></tr>`).join('')}
          </tbody>
        </table>

        <div class="footer"><p>Three Seas Digital CRM — Profit & Loss Statement</p></div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="profit-tab">
      <div className="profit-header">
        <div className="profit-header-left">
          <h2><TrendingUp size={24} /> Profit & Loss</h2>
          <p>Monitor your business profitability</p>
        </div>
        <div className="profit-header-actions">
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="profit-year-select">
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={handlePrintPL}>
            <Printer size={16} /> Print P&L
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="profit-summary-grid">
        <div className="profit-summary-card revenue">
          <div className="profit-summary-icon"><DollarSign size={24} /></div>
          <div className="profit-summary-content">
            <span className="profit-summary-label">Total Revenue</span>
            <span className="profit-summary-value">{formatCurrency(totalRevenue)}</span>
          </div>
        </div>
        <div className="profit-summary-card expenses">
          <div className="profit-summary-icon"><Receipt size={24} /></div>
          <div className="profit-summary-content">
            <span className="profit-summary-label">Total Expenses</span>
            <span className="profit-summary-value">{formatCurrency(totalExpenses)}</span>
          </div>
        </div>
        <div className={`profit-summary-card ${grossProfit >= 0 ? 'profit' : 'loss'}`}>
          <div className="profit-summary-icon"><TrendingUp size={24} /></div>
          <div className="profit-summary-content">
            <span className="profit-summary-label">Net Profit</span>
            <span className="profit-summary-value">{grossProfit < 0 ? '-' : ''}{formatCurrency(grossProfit)}</span>
          </div>
        </div>
        <div className="profit-summary-card margin">
          <div className="profit-summary-icon"><BarChart3 size={24} /></div>
          <div className="profit-summary-content">
            <span className="profit-summary-label">Profit Margin</span>
            <span className="profit-summary-value">{profitMargin.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="profit-chart-section">
        <h3>Monthly Profit & Loss</h3>
        <div className="profit-chart-legend">
          <span className="profit-legend-item revenue"><span className="profit-legend-dot" /> Revenue</span>
          <span className="profit-legend-item expenses"><span className="profit-legend-dot" /> Expenses</span>
        </div>
        <div className="profit-chart">
          {monthlyPL.map((m) => (
            <div key={m.month} className="profit-chart-col">
              <div className="profit-chart-bars">
                <div
                  className="profit-bar revenue"
                  style={{ height: `${(m.revenue / maxValue) * 100}%` }}
                  title={`Revenue: ${formatCurrency(m.revenue)}`}
                />
                <div
                  className="profit-bar expenses"
                  style={{ height: `${(m.expenses / maxValue) * 100}%` }}
                  title={`Expenses: ${formatCurrency(m.expenses)}`}
                />
              </div>
              <span className="profit-chart-label">{m.name}</span>
              <span className={`profit-chart-value ${m.profit >= 0 ? 'positive' : 'negative'}`}>
                {m.profit >= 0 ? '+' : '-'}{formatCurrency(m.profit)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Details Grid */}
      <div className="profit-details-grid">
        {/* Monthly Table */}
        <div className="profit-details-card wide">
          <h4>Monthly Breakdown</h4>
          <div className="profit-table-wrapper">
            <table className="profit-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="amount">Revenue</th>
                  <th className="amount">Expenses</th>
                  <th className="amount">Profit</th>
                  <th className="amount">Margin</th>
                </tr>
              </thead>
              <tbody>
                {monthlyPL.map((m) => (
                  <tr key={m.month}>
                    <td>{m.fullName}</td>
                    <td className="amount">{formatCurrency(m.revenue)}</td>
                    <td className="amount">{formatCurrency(m.expenses)}</td>
                    <td className={`amount ${m.profit >= 0 ? 'positive' : 'negative'}`}>
                      {m.profit >= 0 ? '' : '-'}{formatCurrency(m.profit)}
                    </td>
                    <td className="amount">{m.revenue > 0 ? ((m.profit / m.revenue) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total</strong></td>
                  <td className="amount"><strong>{formatCurrency(totalRevenue)}</strong></td>
                  <td className="amount"><strong>{formatCurrency(totalExpenses)}</strong></td>
                  <td className={`amount ${grossProfit >= 0 ? 'positive' : 'negative'}`}>
                    <strong>{grossProfit >= 0 ? '' : '-'}{formatCurrency(grossProfit)}</strong>
                  </td>
                  <td className="amount"><strong>{profitMargin.toFixed(1)}%</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="profit-details-card">
          <h4>Expense Categories</h4>
          {expenseBreakdown.length === 0 ? (
            <p className="profit-empty">No expenses recorded</p>
          ) : (
            <div className="profit-expense-list">
              {expenseBreakdown.map((c) => (
                <div key={c.value} className="profit-expense-row">
                  <span className="profit-expense-color" style={{ background: c.color }} />
                  <span className="profit-expense-name">{c.label}</span>
                  <span className="profit-expense-amount">{formatCurrency(c.total)}</span>
                  <span className="profit-expense-pct">{((c.total / totalExpenses) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== TAXES TAB ===== */
function TaxesTab() {
  const { expenses, payments, clients, EXPENSE_CATEGORIES } = useAppContext();
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [businessType, setBusinessType] = useState('sole_proprietor');

  // Helper to get year from payment (uses createdAt ISO string)
  const getPaymentYear = (p) => new Date(p.createdAt).getFullYear();
  const getPaymentMonth = (p) => String(new Date(p.createdAt).getMonth() + 1).padStart(2, '0');

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set();
    expenses.forEach((e) => years.add(parseInt(e.date.split('-')[0])));
    payments.forEach((p) => years.add(getPaymentYear(p)));
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [expenses, payments]);

  // Calculate tax data for selected year
  const taxData = useMemo(() => {
    const yearStr = taxYear.toString();

    // Revenue from payments (uses createdAt ISO string)
    const yearPayments = payments.filter((p) => getPaymentYear(p) === taxYear && p.status === 'completed');
    const grossRevenue = yearPayments.reduce((sum, p) => sum + p.amount, 0);

    // Expenses by category
    const yearExpenses = expenses.filter((e) => e.date.startsWith(yearStr));
    const totalExpenses = yearExpenses.reduce((sum, e) => sum + e.amount, 0);

    const expensesByCategory = EXPENSE_CATEGORIES.map((cat) => {
      const catExpenses = yearExpenses.filter((e) => e.category === cat.value);
      return {
        ...cat,
        total: catExpenses.reduce((sum, e) => sum + e.amount, 0),
        count: catExpenses.length,
        items: catExpenses,
      };
    }).filter((c) => c.total > 0);

    // Net income
    const netIncome = grossRevenue - totalExpenses;

    // Quarterly breakdown
    const quarters = [
      { name: 'Q1', months: ['01', '02', '03'] },
      { name: 'Q2', months: ['04', '05', '06'] },
      { name: 'Q3', months: ['07', '08', '09'] },
      { name: 'Q4', months: ['10', '11', '12'] },
    ].map((q) => {
      const qRevenue = yearPayments
        .filter((p) => q.months.includes(getPaymentMonth(p)))
        .reduce((sum, p) => sum + p.amount, 0);
      const qExpenses = yearExpenses
        .filter((e) => q.months.some((m) => e.date.startsWith(`${yearStr}-${m}`)))
        .reduce((sum, e) => sum + e.amount, 0);
      return { ...q, revenue: qRevenue, expenses: qExpenses, net: qRevenue - qExpenses };
    });

    // Estimated quarterly tax (self-employment + income)
    const selfEmploymentRate = 0.153; // 15.3% SE tax
    const estimatedTaxRate = 0.22; // Estimated income tax bracket
    const estimatedQuarterlyTax = quarters.map((q) => ({
      ...q,
      seTax: Math.max(0, q.net * selfEmploymentRate),
      incomeTax: Math.max(0, q.net * estimatedTaxRate),
      totalTax: Math.max(0, q.net * (selfEmploymentRate + estimatedTaxRate)),
    }));

    // Monthly breakdown for detailed view
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthStr = `${yearStr}-${String(i + 1).padStart(2, '0')}`;
      const monthNum = String(i + 1).padStart(2, '0');
      const mRevenue = yearPayments.filter((p) => getPaymentMonth(p) === monthNum).reduce((sum, p) => sum + p.amount, 0);
      const mExpenses = yearExpenses.filter((e) => e.date.startsWith(monthStr)).reduce((sum, e) => sum + e.amount, 0);
      return {
        name: new Date(taxYear, i).toLocaleString('en-US', { month: 'short' }),
        revenue: mRevenue,
        expenses: mExpenses,
        net: mRevenue - mExpenses,
      };
    });

    // Deductible categories mapping for Schedule C
    const scheduleC = {
      advertising: 0,
      carAndTruck: expensesByCategory.find((c) => c.value === 'fuel')?.total || 0,
      commissions: 0,
      contractLabor: 0,
      depreciation: 0,
      insurance: 0,
      interest: 0,
      legal: 0,
      officeExpense: 0,
      pensionPlans: 0,
      rentLease: 0,
      repairs: 0,
      supplies: 0,
      taxes: 0,
      travel: expensesByCategory.find((c) => c.value === 'trips')?.total || 0,
      meals: (expensesByCategory.find((c) => c.value === 'food')?.total || 0) +
             (expensesByCategory.find((c) => c.value === 'meetings')?.total || 0),
      utilities: 0,
      wages: expensesByCategory.find((c) => c.value === 'wages')?.total || 0,
      otherExpenses: expensesByCategory.find((c) => c.value === 'receipts')?.total || 0,
    };
    scheduleC.totalExpenses = Object.values(scheduleC).reduce((a, b) => a + b, 0);

    return {
      grossRevenue,
      totalExpenses,
      netIncome,
      expensesByCategory,
      quarters,
      estimatedQuarterlyTax,
      months,
      scheduleC,
      transactionCount: yearPayments.length,
      expenseCount: yearExpenses.length,
      clientCount: clients.filter((c) => c.tier && c.tier !== 'free').length,
    };
  }, [taxYear, expenses, payments, clients, EXPENSE_CATEGORIES]);

  const formatCurrency = (num) => `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Print tax summary
  const handlePrintTaxSummary = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Summary - ${taxYear}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
          h1 { color: #1e3a5f; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          h3 { color: #4b5563; margin-top: 20px; }
          .header-info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .header-info p { margin: 5px 0; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
          .summary-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-box.highlight { background: #ecfdf5; border-color: #10b981; }
          .summary-box.warning { background: #fef3c7; border-color: #f59e0b; }
          .summary-box h4 { margin: 0 0 5px; font-size: 12px; color: #6b7280; text-transform: uppercase; }
          .summary-box p { margin: 0; font-size: 20px; font-weight: bold; color: #1e3a5f; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          td.amount { text-align: right; font-family: monospace; }
          .schedule-c { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .schedule-c h3 { margin-top: 0; color: #0369a1; }
          .note { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; }
          @media print { body { padding: 20px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <h1>Business Tax Summary - ${taxYear}</h1>

        <div class="header-info">
          <p><strong>Business Name:</strong> Three Seas Digital</p>
          <p><strong>Tax Year:</strong> ${taxYear}</p>
          <p><strong>Business Type:</strong> ${businessType === 'sole_proprietor' ? 'Sole Proprietor' : businessType === 'llc' ? 'LLC' : 'S-Corp'}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <h2>Annual Summary</h2>
        <div class="summary-grid">
          <div class="summary-box">
            <h4>Gross Revenue</h4>
            <p>${formatCurrency(taxData.grossRevenue)}</p>
          </div>
          <div class="summary-box">
            <h4>Total Expenses</h4>
            <p>${formatCurrency(taxData.totalExpenses)}</p>
          </div>
          <div class="summary-box highlight">
            <h4>Net Income</h4>
            <p>${formatCurrency(taxData.netIncome)}</p>
          </div>
        </div>

        <h2>Quarterly Breakdown</h2>
        <table>
          <thead><tr><th>Quarter</th><th class="amount">Revenue</th><th class="amount">Expenses</th><th class="amount">Net Income</th><th class="amount">Est. Tax Due</th></tr></thead>
          <tbody>
            ${taxData.estimatedQuarterlyTax.map((q) => `
              <tr>
                <td>${q.name}</td>
                <td class="amount">${formatCurrency(q.revenue)}</td>
                <td class="amount">${formatCurrency(q.expenses)}</td>
                <td class="amount">${formatCurrency(q.net)}</td>
                <td class="amount">${formatCurrency(q.totalTax)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Expense Categories (Deductions)</h2>
        <table>
          <thead><tr><th>Category</th><th>Count</th><th class="amount">Total</th></tr></thead>
          <tbody>
            ${taxData.expensesByCategory.map((c) => `
              <tr><td>${c.label}</td><td>${c.count}</td><td class="amount">${formatCurrency(c.total)}</td></tr>
            `).join('')}
            <tr style="font-weight:bold;border-top:2px solid #1e3a5f">
              <td>TOTAL DEDUCTIONS</td>
              <td>${taxData.expenseCount}</td>
              <td class="amount">${formatCurrency(taxData.totalExpenses)}</td>
            </tr>
          </tbody>
        </table>

        <div class="schedule-c">
          <h3>Schedule C Reference (Profit or Loss from Business)</h3>
          <table>
            <tr><td>Line 1 - Gross receipts or sales</td><td class="amount">${formatCurrency(taxData.grossRevenue)}</td></tr>
            <tr><td>Line 4 - Cost of goods sold</td><td class="amount">$0.00</td></tr>
            <tr><td>Line 5 - Gross profit</td><td class="amount">${formatCurrency(taxData.grossRevenue)}</td></tr>
            <tr><td>Line 9 - Car and truck expenses</td><td class="amount">${formatCurrency(taxData.scheduleC.carAndTruck)}</td></tr>
            <tr><td>Line 24a - Travel</td><td class="amount">${formatCurrency(taxData.scheduleC.travel)}</td></tr>
            <tr><td>Line 24b - Meals (50% deductible)</td><td class="amount">${formatCurrency(taxData.scheduleC.meals)}</td></tr>
            <tr><td>Line 26 - Wages</td><td class="amount">${formatCurrency(taxData.scheduleC.wages)}</td></tr>
            <tr><td>Line 27a - Other expenses</td><td class="amount">${formatCurrency(taxData.scheduleC.otherExpenses)}</td></tr>
            <tr style="font-weight:bold;border-top:2px solid #0369a1">
              <td>Line 28 - Total expenses</td>
              <td class="amount">${formatCurrency(taxData.totalExpenses)}</td>
            </tr>
            <tr style="font-weight:bold;background:#ecfdf5">
              <td>Line 31 - Net profit (or loss)</td>
              <td class="amount">${formatCurrency(taxData.netIncome)}</td>
            </tr>
          </table>
        </div>

        <h2>Estimated Tax Liability</h2>
        <div class="summary-grid">
          <div class="summary-box warning">
            <h4>Self-Employment Tax (15.3%)</h4>
            <p>${formatCurrency(taxData.netIncome * 0.153)}</p>
          </div>
          <div class="summary-box warning">
            <h4>Est. Income Tax (22%)</h4>
            <p>${formatCurrency(taxData.netIncome * 0.22)}</p>
          </div>
          <div class="summary-box warning">
            <h4>Total Est. Tax</h4>
            <p>${formatCurrency(taxData.netIncome * 0.373)}</p>
          </div>
        </div>

        <div class="note">
          <strong>Important Notes:</strong>
          <ul>
            <li>This is an estimate only. Consult a tax professional for accurate tax advice.</li>
            <li>Meals and entertainment are typically 50% deductible.</li>
            <li>Vehicle expenses may be calculated using actual expenses or standard mileage rate.</li>
            <li>Keep all receipts and documentation for at least 7 years.</li>
            <li>Quarterly estimated taxes are due Apr 15, Jun 15, Sep 15, and Jan 15.</li>
          </ul>
        </div>

        <div class="footer">
          <p>Generated by Three Seas Digital CRM | This document is for reference purposes only and does not constitute tax advice.</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="taxes-tab">
      {/* Header */}
      <div className="taxes-header">
        <div className="taxes-header-left">
          <h2><FileText size={24} /> Business Tax Center</h2>
          <p>Auto-generated tax information from your financial records</p>
        </div>
        <div className="taxes-header-actions">
          <select value={taxYear} onChange={(e) => setTaxYear(parseInt(e.target.value))} className="taxes-year-select">
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="taxes-type-select">
            <option value="sole_proprietor">Sole Proprietor</option>
            <option value="llc">LLC</option>
            <option value="scorp">S-Corp</option>
          </select>
          <button className="btn btn-primary" onClick={handlePrintTaxSummary}>
            <Printer size={16} /> Print Tax Summary
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="taxes-summary-grid">
        <div className="taxes-summary-card">
          <div className="taxes-summary-icon revenue"><DollarSign size={24} /></div>
          <div className="taxes-summary-content">
            <span className="taxes-summary-label">Gross Revenue</span>
            <span className="taxes-summary-value">{formatCurrency(taxData.grossRevenue)}</span>
            <span className="taxes-summary-sub">{taxData.transactionCount} transactions</span>
          </div>
        </div>
        <div className="taxes-summary-card">
          <div className="taxes-summary-icon expenses"><Receipt size={24} /></div>
          <div className="taxes-summary-content">
            <span className="taxes-summary-label">Total Deductions</span>
            <span className="taxes-summary-value">{formatCurrency(taxData.totalExpenses)}</span>
            <span className="taxes-summary-sub">{taxData.expenseCount} expenses</span>
          </div>
        </div>
        <div className="taxes-summary-card highlight">
          <div className="taxes-summary-icon net"><TrendingUp size={24} /></div>
          <div className="taxes-summary-content">
            <span className="taxes-summary-label">Net Income</span>
            <span className="taxes-summary-value">{formatCurrency(taxData.netIncome)}</span>
            <span className="taxes-summary-sub">Taxable income</span>
          </div>
        </div>
        <div className="taxes-summary-card warning">
          <div className="taxes-summary-icon tax"><Wallet size={24} /></div>
          <div className="taxes-summary-content">
            <span className="taxes-summary-label">Est. Tax Liability</span>
            <span className="taxes-summary-value">{formatCurrency(taxData.netIncome * 0.373)}</span>
            <span className="taxes-summary-sub">SE + Income tax</span>
          </div>
        </div>
      </div>

      {/* Quarterly Estimates */}
      <div className="taxes-section">
        <h3><CalendarIcon size={18} /> Quarterly Tax Estimates</h3>
        <div className="taxes-quarterly-grid">
          {taxData.estimatedQuarterlyTax.map((q) => (
            <div key={q.name} className="taxes-quarter-card">
              <div className="taxes-quarter-header">
                <span className="taxes-quarter-name">{q.name}</span>
                <span className={`taxes-quarter-net ${q.net >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(q.net)}
                </span>
              </div>
              <div className="taxes-quarter-details">
                <div className="taxes-quarter-row">
                  <span>Revenue</span>
                  <span>{formatCurrency(q.revenue)}</span>
                </div>
                <div className="taxes-quarter-row">
                  <span>Expenses</span>
                  <span>-{formatCurrency(q.expenses)}</span>
                </div>
                <div className="taxes-quarter-row highlight">
                  <span>Est. Tax Due</span>
                  <span>{formatCurrency(q.totalTax)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="taxes-section">
        <h3><Receipt size={18} /> Deductible Expenses by Category</h3>
        {taxData.expensesByCategory.length === 0 ? (
          <div className="taxes-empty">
            <Receipt size={48} />
            <p>No expenses recorded for {taxYear}</p>
          </div>
        ) : (
          <div className="taxes-expense-list">
            {taxData.expensesByCategory.map((cat) => (
              <div key={cat.value} className="taxes-expense-row">
                <div className="taxes-expense-info">
                  <span className="taxes-expense-color" style={{ background: cat.color }} />
                  <span className="taxes-expense-name">{cat.label}</span>
                  <span className="taxes-expense-count">{cat.count} items</span>
                </div>
                <span className="taxes-expense-amount">{formatCurrency(cat.total)}</span>
              </div>
            ))}
            <div className="taxes-expense-row total">
              <div className="taxes-expense-info">
                <span className="taxes-expense-name">Total Deductions</span>
              </div>
              <span className="taxes-expense-amount">{formatCurrency(taxData.totalExpenses)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Schedule C Preview */}
      <div className="taxes-section schedule-c">
        <h3><FileText size={18} /> Schedule C Reference</h3>
        <p className="taxes-section-note">Preview of key Schedule C line items based on your records</p>
        <div className="taxes-schedule-grid">
          <div className="taxes-schedule-row">
            <span className="taxes-schedule-line">Line 1</span>
            <span className="taxes-schedule-desc">Gross receipts or sales</span>
            <span className="taxes-schedule-amount">{formatCurrency(taxData.grossRevenue)}</span>
          </div>
          <div className="taxes-schedule-row">
            <span className="taxes-schedule-line">Line 5</span>
            <span className="taxes-schedule-desc">Gross profit</span>
            <span className="taxes-schedule-amount">{formatCurrency(taxData.grossRevenue)}</span>
          </div>
          <div className="taxes-schedule-row">
            <span className="taxes-schedule-line">Line 9</span>
            <span className="taxes-schedule-desc">Car and truck expenses (Fuel)</span>
            <span className="taxes-schedule-amount">{formatCurrency(taxData.scheduleC.carAndTruck)}</span>
          </div>
          <div className="taxes-schedule-row">
            <span className="taxes-schedule-line">Line 24a</span>
            <span className="taxes-schedule-desc">Travel expenses (Trips)</span>
            <span className="taxes-schedule-amount">{formatCurrency(taxData.scheduleC.travel)}</span>
          </div>
          <div className="taxes-schedule-row">
            <span className="taxes-schedule-line">Line 24b</span>
            <span className="taxes-schedule-desc">Meals & meetings (50% deductible)</span>
            <span className="taxes-schedule-amount">{formatCurrency(taxData.scheduleC.meals)}</span>
          </div>
          <div className="taxes-schedule-row">
            <span className="taxes-schedule-line">Line 26</span>
            <span className="taxes-schedule-desc">Wages paid</span>
            <span className="taxes-schedule-amount">{formatCurrency(taxData.scheduleC.wages)}</span>
          </div>
          <div className="taxes-schedule-row">
            <span className="taxes-schedule-line">Line 27a</span>
            <span className="taxes-schedule-desc">Other expenses</span>
            <span className="taxes-schedule-amount">{formatCurrency(taxData.scheduleC.otherExpenses)}</span>
          </div>
          <div className="taxes-schedule-row total">
            <span className="taxes-schedule-line">Line 28</span>
            <span className="taxes-schedule-desc">Total expenses</span>
            <span className="taxes-schedule-amount">{formatCurrency(taxData.totalExpenses)}</span>
          </div>
          <div className="taxes-schedule-row net-profit">
            <span className="taxes-schedule-line">Line 31</span>
            <span className="taxes-schedule-desc">Net profit (or loss)</span>
            <span className="taxes-schedule-amount">{formatCurrency(taxData.netIncome)}</span>
          </div>
        </div>
      </div>

      {/* Tax Tips */}
      <div className="taxes-tips">
        <h3><AlertCircle size={18} /> Important Tax Reminders</h3>
        <ul>
          <li><strong>Quarterly Payments:</strong> Due April 15, June 15, September 15, January 15</li>
          <li><strong>Meals Deduction:</strong> Business meals are typically 50% deductible</li>
          <li><strong>Vehicle Expenses:</strong> Track mileage or actual expenses for car deductions</li>
          <li><strong>Record Keeping:</strong> Keep all receipts and records for at least 7 years</li>
          <li><strong>Professional Advice:</strong> Consult a CPA for accurate tax preparation</li>
        </ul>
      </div>
    </div>
  );
}

/* ===== CLIENTS DATABASE TAB ===== */
function ClientsDatabaseTab() {
  const { clients, payments, SUBSCRIPTION_TIERS } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterHasProjects, setFilterHasProjects] = useState('all');
  const [filterHasInvoices, setFilterHasInvoices] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedClients, setSelectedClients] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Get unique values for filters
  const sources = useMemo(() => {
    const s = new Set(clients.map((c) => c.source).filter(Boolean));
    return Array.from(s).sort();
  }, [clients]);

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    return clients
      .filter((c) => c.status !== 'pending') // Exclude pending registrations
      .filter((c) => {
        // Search
        if (search) {
          const q = search.toLowerCase();
          const matchName = c.name?.toLowerCase().includes(q);
          const matchEmail = c.email?.toLowerCase().includes(q);
          const matchPhone = c.phone?.toLowerCase().includes(q);
          const matchBusiness = c.businessName?.toLowerCase().includes(q);
          const matchTags = (c.tags || []).some((t) => t.toLowerCase().includes(q));
          if (!matchName && !matchEmail && !matchPhone && !matchBusiness && !matchTags) return false;
        }
        // Status filter
        if (filterStatus !== 'all' && c.status !== filterStatus) return false;
        // Tier filter
        if (filterTier !== 'all' && c.tier !== filterTier) return false;
        // Source filter
        if (filterSource !== 'all' && c.source !== filterSource) return false;
        // Has projects filter
        if (filterHasProjects === 'yes' && (!c.projects || c.projects.length === 0)) return false;
        if (filterHasProjects === 'no' && c.projects && c.projects.length > 0) return false;
        // Has invoices filter
        if (filterHasInvoices === 'yes' && (!c.invoices || c.invoices.length === 0)) return false;
        if (filterHasInvoices === 'no' && c.invoices && c.invoices.length > 0) return false;
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        switch (sortBy) {
          case 'name':
            cmp = (a.name || '').localeCompare(b.name || '');
            break;
          case 'email':
            cmp = (a.email || '').localeCompare(b.email || '');
            break;
          case 'tier':
            const tierOrder = { enterprise: 4, premium: 3, basic: 2, free: 1 };
            cmp = (tierOrder[b.tier] || 0) - (tierOrder[a.tier] || 0);
            break;
          case 'status':
            cmp = (a.status || '').localeCompare(b.status || '');
            break;
          case 'invoices':
            cmp = (b.invoices?.length || 0) - (a.invoices?.length || 0);
            break;
          case 'projects':
            cmp = (b.projects?.length || 0) - (a.projects?.length || 0);
            break;
          case 'newest':
          default:
            cmp = new Date(b.createdAt) - new Date(a.createdAt);
            break;
        }
        return sortDir === 'desc' ? cmp : -cmp;
      });
  }, [clients, search, filterStatus, filterTier, filterSource, filterHasProjects, filterHasInvoices, sortBy, sortDir]);

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / pageSize);
  const paginatedClients = filteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterTier, filterSource, filterHasProjects, filterHasInvoices, sortBy, sortDir, pageSize]);

  // Stats
  const stats = useMemo(() => {
    const activeClients = clients.filter((c) => c.status === 'active' || c.status === 'vip');
    const totalRevenue = payments.filter((p) => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);
    const tierCounts = {};
    Object.keys(SUBSCRIPTION_TIERS).forEach((t) => { tierCounts[t] = 0; });
    activeClients.forEach((c) => {
      if (tierCounts[c.tier] !== undefined) tierCounts[c.tier]++;
    });
    return {
      total: clients.filter((c) => c.status !== 'pending').length,
      active: activeClients.length,
      archived: clients.filter((c) => c.status === 'archived').length,
      vip: clients.filter((c) => c.status === 'vip').length,
      totalRevenue,
      tierCounts,
    };
  }, [clients, payments, SUBSCRIPTION_TIERS]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const toggleSelectClient = (id) => {
    setSelectedClients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedClients.size === paginatedClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(paginatedClients.map((c) => c.id)));
    }
  };

  const exportToCSV = () => {
    const data = (selectedClients.size > 0 ? filteredClients.filter((c) => selectedClients.has(c.id)) : filteredClients);
    const headers = ['Name', 'Email', 'Phone', 'Business', 'Status', 'Tier', 'Source', 'Projects', 'Invoices', 'Created'];
    const rows = data.map((c) => [
      c.name || '',
      c.email || '',
      c.phone || '',
      c.businessName || '',
      c.status || '',
      c.tier || '',
      c.source || '',
      (c.projects || []).length,
      (c.invoices || []).length,
      c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('all');
    setFilterTier('all');
    setFilterSource('all');
    setFilterHasProjects('all');
    setFilterHasInvoices('all');
    setSortBy('newest');
    setSortDir('desc');
  };

  const hasActiveFilters = search || filterStatus !== 'all' || filterTier !== 'all' || filterSource !== 'all' || filterHasProjects !== 'all' || filterHasInvoices !== 'all';

  return (
    <div className="clients-database-tab">
      <div className="db-header">
        <h2><Users size={24} /> Clients Database</h2>
        <p className="db-subtitle">Comprehensive view of all clients with advanced search and filtering</p>
      </div>

      {/* Stats Row */}
      <div className="db-stats-row">
        <div className="db-stat"><span className="db-stat-value">{stats.total}</span><span className="db-stat-label">Total Clients</span></div>
        <div className="db-stat active"><span className="db-stat-value">{stats.active}</span><span className="db-stat-label">Active</span></div>
        <div className="db-stat vip"><span className="db-stat-value">{stats.vip}</span><span className="db-stat-label">VIP</span></div>
        <div className="db-stat archived"><span className="db-stat-value">{stats.archived}</span><span className="db-stat-label">Archived</span></div>
        <div className="db-stat revenue"><span className="db-stat-value">${stats.totalRevenue.toLocaleString()}</span><span className="db-stat-label">Total Revenue</span></div>
      </div>

      {/* Tier Breakdown */}
      <div className="db-tier-breakdown">
        {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
          <div key={key} className="db-tier-chip" style={{ borderColor: tier.color }}>
            <span className="db-tier-dot" style={{ background: tier.color }}></span>
            <span className="db-tier-label">{tier.label}</span>
            <span className="db-tier-count">{stats.tierCounts[key] || 0}</span>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="db-controls">
        <div className="db-search-row">
          <div className="db-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by name, email, phone, business, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button className="db-search-clear" onClick={() => setSearch('')}><X size={14} /></button>}
          </div>
          <div className="db-actions">
            <button className="btn btn-sm btn-outline" onClick={exportToCSV}>
              <Download size={14} /> Export {selectedClients.size > 0 ? `(${selectedClients.size})` : 'All'}
            </button>
          </div>
        </div>

        <div className="db-filters-row">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="vip">VIP</option>
            <option value="archived">Archived</option>
          </select>
          <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)}>
            <option value="all">All Tiers</option>
            {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
              <option key={key} value={key}>{tier.label}</option>
            ))}
          </select>
          <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
            <option value="all">All Sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select value={filterHasProjects} onChange={(e) => setFilterHasProjects(e.target.value)}>
            <option value="all">Projects: Any</option>
            <option value="yes">Has Projects</option>
            <option value="no">No Projects</option>
          </select>
          <select value={filterHasInvoices} onChange={(e) => setFilterHasInvoices(e.target.value)}>
            <option value="all">Invoices: Any</option>
            <option value="yes">Has Invoices</option>
            <option value="no">No Invoices</option>
          </select>
          {hasActiveFilters && (
            <button className="btn btn-sm btn-ghost" onClick={clearFilters}>
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="db-results-info">
        <span>Showing {paginatedClients.length} of {filteredClients.length} clients</span>
        <div className="db-page-size">
          <span>Per page:</span>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="db-table-container">
        <table className="db-table">
          <thead>
            <tr>
              <th className="db-th-check">
                <div className="db-checkbox" onClick={selectAll}>
                  {selectedClients.size === paginatedClients.length && paginatedClients.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
              </th>
              <th className={`db-th-sortable ${sortBy === 'name' ? 'active' : ''}`} onClick={() => handleSort('name')}>
                Name {sortBy === 'name' && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </th>
              <th className={`db-th-sortable ${sortBy === 'email' ? 'active' : ''}`} onClick={() => handleSort('email')}>
                Email {sortBy === 'email' && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </th>
              <th>Phone</th>
              <th className={`db-th-sortable ${sortBy === 'status' ? 'active' : ''}`} onClick={() => handleSort('status')}>
                Status {sortBy === 'status' && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </th>
              <th className={`db-th-sortable ${sortBy === 'tier' ? 'active' : ''}`} onClick={() => handleSort('tier')}>
                Tier {sortBy === 'tier' && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </th>
              <th className={`db-th-sortable ${sortBy === 'projects' ? 'active' : ''}`} onClick={() => handleSort('projects')}>
                Projects {sortBy === 'projects' && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </th>
              <th className={`db-th-sortable ${sortBy === 'invoices' ? 'active' : ''}`} onClick={() => handleSort('invoices')}>
                Invoices {sortBy === 'invoices' && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </th>
              <th className={`db-th-sortable ${sortBy === 'newest' ? 'active' : ''}`} onClick={() => handleSort('newest')}>
                Created {sortBy === 'newest' && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedClients.length === 0 ? (
              <tr><td colSpan="9" className="db-empty">No clients found matching your criteria</td></tr>
            ) : (
              paginatedClients.map((client) => {
                const tierInfo = SUBSCRIPTION_TIERS[client.tier] || SUBSCRIPTION_TIERS.free;
                const isSelected = selectedClients.has(client.id);
                return (
                  <tr key={client.id} className={isSelected ? 'selected' : ''}>
                    <td>
                      <div className="db-checkbox" onClick={() => toggleSelectClient(client.id)}>
                        {isSelected ? <CheckSquare size={16} className="checked" /> : <Square size={16} />}
                      </div>
                    </td>
                    <td className="db-td-name">
                      <div className="db-client-name">
                        <span className="db-name-text">{client.name}</span>
                        {client.businessName && <span className="db-business-text">{client.businessName}</span>}
                      </div>
                    </td>
                    <td className="db-td-email">{client.email}</td>
                    <td className="db-td-phone">{client.phone || '-'}</td>
                    <td>
                      <span className={`db-status-badge ${client.status}`}>
                        {client.status === 'vip' ? 'VIP' : client.status?.charAt(0).toUpperCase() + client.status?.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span className="db-tier-badge" style={{ background: tierInfo.color }}>{tierInfo.label}</span>
                    </td>
                    <td className="db-td-count">{(client.projects || []).length}</td>
                    <td className="db-td-count">{(client.invoices || []).length}</td>
                    <td className="db-td-date">{client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="db-pagination">
          <button
            className="btn btn-sm btn-outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
          >
            First
          </button>
          <button
            className="btn btn-sm btn-outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="db-page-info">Page {currentPage} of {totalPages}</span>
          <button
            className="btn btn-sm btn-outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
          </button>
          <button
            className="btn btn-sm btn-outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            Last
          </button>
        </div>
      )}
    </div>
  );
}

/* ===== ANALYTICS TAB ===== */
const CHART_COLORS = ['#0f4c75', '#00b4d8', '#3282b8', '#40c057', '#f59e0b', '#8b5cf6', '#f03e3e', '#fab005'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function AnalyticsTab() {
  const { clients, payments, appointments, expenses, SUBSCRIPTION_TIERS } = useAppContext();

  // Filter state
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // Revenue-specific filters
  const [filterService, setFilterService] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');

  // Chart visibility toggles
  const [chartVis, setChartVis] = useState({
    revenue: true,
    breakdown: true,
    profitLoss: true,
    invoices: true,
    clients: true,
  });
  const toggleChart = (key) => setChartVis((prev) => ({ ...prev, [key]: !prev[key] }));
  const allChartsVisible = Object.values(chartVis).every(Boolean);
  const toggleAll = () => {
    const next = !allChartsVisible;
    setChartVis({ revenue: next, breakdown: next, profitLoss: next, invoices: next, clients: next });
  };

  const clearFilters = () => {
    setFilterYear('all');
    setFilterMonth('all');
    setStartDate('');
    setEndDate('');
    setFilterService('all');
    setFilterTier('all');
    setFilterMethod('all');
  };

  const hasActiveFilters = filterYear !== 'all' || filterMonth !== 'all' || startDate || endDate;
  const hasRevenueFilters = filterService !== 'all' || filterTier !== 'all' || filterMethod !== 'all';

  // Distinct years from all data sources
  const availableYears = useMemo(() => {
    const years = new Set();
    payments.forEach((p) => years.add(new Date(p.createdAt).getFullYear()));
    clients.forEach((c) => years.add(new Date(c.createdAt).getFullYear()));
    appointments.forEach((a) => {
      if (a.date) {
        const [y] = a.date.split('-');
        years.add(parseInt(y));
      } else if (a.createdAt) {
        years.add(new Date(a.createdAt).getFullYear());
      }
    });
    return [...years].sort((a, b) => b - a);
  }, [payments, clients, appointments]);

  // Filter helper
  const filterByDate = useCallback((items, dateAccessor = 'createdAt') => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return items.filter((item) => {
        const val = dateAccessor === 'date' && item.date ? item.date : item.createdAt;
        const d = new Date(val);
        return d >= start && d <= end;
      });
    }
    if (filterYear !== 'all') {
      const yr = parseInt(filterYear);
      return items.filter((item) => {
        const val = dateAccessor === 'date' && item.date ? item.date : item.createdAt;
        const d = new Date(val);
        if (d.getFullYear() !== yr) return false;
        if (filterMonth !== 'all') {
          return d.getMonth() === parseInt(filterMonth);
        }
        return true;
      });
    }
    return items;
  }, [filterYear, filterMonth, startDate, endDate]);

  // Filtered data (date filters)
  const dateFilteredPayments = useMemo(() => filterByDate(payments), [payments, filterByDate]);
  const filteredClients = useMemo(() => filterByDate(clients), [clients, filterByDate]);
  const filteredAppointments = useMemo(() => filterByDate(appointments, 'date'), [appointments, filterByDate]);

  // Revenue-filtered payments (date + service/tier/method)
  const filteredPayments = useMemo(() => {
    let result = dateFilteredPayments;
    if (filterService !== 'all') result = result.filter((p) => p.service === filterService);
    if (filterTier !== 'all') result = result.filter((p) => p.serviceTier === filterTier);
    if (filterMethod !== 'all') result = result.filter((p) => p.method === filterMethod);
    return result;
  }, [dateFilteredPayments, filterService, filterTier, filterMethod]);

  // Available revenue filter options (derived from date-filtered payments)
  const availableServices = useMemo(() => [...new Set(dateFilteredPayments.map((p) => p.service).filter(Boolean))].sort(), [dateFilteredPayments]);
  const availableMethods = useMemo(() => [...new Set(dateFilteredPayments.map((p) => p.method).filter(Boolean))].sort(), [dateFilteredPayments]);

  // Period label for display
  const periodLabel = useMemo(() => {
    if (startDate && endDate) return `${startDate} to ${endDate}`;
    if (filterYear !== 'all' && filterMonth !== 'all') return `${MONTH_NAMES[parseInt(filterMonth)]} ${filterYear}`;
    if (filterYear !== 'all') return `${filterYear}`;
    return 'All Time';
  }, [filterYear, filterMonth, startDate, endDate]);

  const monthlyRevenue = useMemo(() => {
    const map = {};
    filteredPayments.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + p.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => {
        const [y, m] = month.split('-');
        return { month, label: new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), revenue };
      });
  }, [filteredPayments]);

  const kpis = useMemo(() => {
    // Revenue growth logic adapts to filter context
    let curRev, prevRev, growthLabel;

    if (filterMonth !== 'all' && filterYear !== 'all') {
      // Specific month selected: compare to previous month
      const yr = parseInt(filterYear);
      const mo = parseInt(filterMonth);
      curRev = filteredPayments.reduce((s, p) => s + p.amount, 0);
      const prevMo = mo === 0 ? 11 : mo - 1;
      const prevYr = mo === 0 ? yr - 1 : yr;
      prevRev = payments.filter((p) => {
        const d = new Date(p.createdAt);
        return d.getFullYear() === prevYr && d.getMonth() === prevMo;
      }).reduce((s, p) => s + p.amount, 0);
      growthLabel = `vs ${MONTH_NAMES[prevMo].slice(0, 3)}`;
    } else if (startDate && endDate) {
      // Date range: show total for range, no growth comparison
      curRev = filteredPayments.reduce((s, p) => s + p.amount, 0);
      prevRev = 0;
      growthLabel = 'filtered period';
    } else {
      // All time or year: compare current month vs previous month (as today)
      const now = new Date();
      const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

      curRev = filteredPayments.filter((p) => {
        const d = new Date(p.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === curMonth;
      }).reduce((s, p) => s + p.amount, 0);

      prevRev = filteredPayments.filter((p) => {
        const d = new Date(p.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === prevMonth;
      }).reduce((s, p) => s + p.amount, 0);
      growthLabel = 'vs last month';
    }

    const growth = prevRev > 0 ? ((curRev - prevRev) / prevRev * 100) : (curRev > 0 ? 100 : 0);

    const totalAppts = filteredAppointments.length;
    const converted = filteredAppointments.filter((a) => a.convertedToClient).length;
    const conversionRate = totalAppts > 0 ? (converted / totalAppts * 100) : 0;

    const totalRevenue = filteredPayments.reduce((s, p) => s + p.amount, 0);
    const avgValue = filteredClients.length > 0 ? totalRevenue / filteredClients.length : 0;

    // When showing a specific month, use filtered total as "monthly revenue"
    const displayRevenue = (filterMonth !== 'all' || (startDate && endDate))
      ? filteredPayments.reduce((s, p) => s + p.amount, 0)
      : curRev;

    return { curRev: displayRevenue, growth, growthLabel, conversionRate, avgValue };
  }, [filteredPayments, filteredAppointments, filteredClients, payments, filterYear, filterMonth, startDate, endDate]);

  const clientGrowth = useMemo(() => {
    const sorted = [...filteredClients].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const map = {};
    let cumulative = 0;
    sorted.forEach((c) => {
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      cumulative++;
      map[key] = cumulative;
    });
    return Object.entries(map).map(([month, total]) => {
      const [y, m] = month.split('-');
      return { month, label: new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), total };
    });
  }, [filteredClients]);

  const revenueByService = useMemo(() => {
    const map = {};
    filteredPayments.forEach((p) => {
      const svc = p.service || 'Other';
      map[svc] = (map[svc] || 0) + p.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.replace('-', ' '), value }));
  }, [filteredPayments]);

  const tierDistribution = useMemo(() => {
    const map = {};
    Object.keys(SUBSCRIPTION_TIERS).forEach((k) => { map[k] = 0; });
    filteredClients.forEach((c) => { const t = c.tier || 'free'; map[t] = (map[t] || 0) + 1; });
    return Object.entries(map).map(([tier, count]) => ({
      tier: SUBSCRIPTION_TIERS[tier]?.label || tier,
      count,
      color: SUBSCRIPTION_TIERS[tier]?.color || '#9ca3af',
    }));
  }, [filteredClients, SUBSCRIPTION_TIERS]);

  const conversionFunnel = useMemo(() => {
    const booked = filteredAppointments.length;
    const confirmed = filteredAppointments.filter((a) => a.status === 'confirmed').length;
    const converted = filteredAppointments.filter((a) => a.convertedToClient).length;
    return [
      { stage: 'Booked', count: booked },
      { stage: 'Confirmed', count: confirmed },
      { stage: 'Converted', count: converted },
    ];
  }, [filteredAppointments]);

  const clientSources = useMemo(() => {
    const map = { appointment: 0, manual: 0, 'self-registration': 0 };
    filteredClients.forEach((c) => {
      const src = c.source || 'manual';
      map[src] = (map[src] || 0) + 1;
    });
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.replace('-', ' '), value }));
  }, [filteredClients]);

  // Yearly revenue comparison (uses ALL payments, not filtered, so you can compare years)
  const yearlyRevenue = useMemo(() => {
    const map = {};
    payments.forEach((p) => {
      const yr = new Date(p.createdAt).getFullYear();
      map[yr] = (map[yr] || 0) + p.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a - b)
      .map(([year, revenue]) => ({ year, revenue }));
  }, [payments]);

  // Cumulative revenue over time
  const cumulativeRevenue = useMemo(() => {
    const sorted = [...filteredPayments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const map = {};
    let running = 0;
    sorted.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      running += p.amount;
      map[key] = running;
    });
    return Object.entries(map).map(([month, total]) => {
      const [y, m] = month.split('-');
      return { month, label: new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), total };
    });
  }, [filteredPayments]);

  // Revenue by tier
  const revenueByTier = useMemo(() => {
    const map = {};
    filteredPayments.forEach((p) => {
      const tier = p.serviceTier || 'free';
      map[tier] = (map[tier] || 0) + p.amount;
    });
    return Object.entries(map).map(([tier, value]) => ({
      name: SUBSCRIPTION_TIERS[tier]?.label || tier,
      value,
      color: SUBSCRIPTION_TIERS[tier]?.color || '#9ca3af',
    }));
  }, [filteredPayments, SUBSCRIPTION_TIERS]);

  // Revenue by payment method
  const revenueByMethod = useMemo(() => {
    const map = {};
    filteredPayments.forEach((p) => {
      const method = (p.method || 'unknown').replace('-', ' ');
      map[method] = (map[method] || 0) + p.amount;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([method, revenue]) => ({ method, revenue }));
  }, [filteredPayments]);

  // Monthly revenue as bar chart data (payment count + revenue)
  const monthlyRevenueDetailed = useMemo(() => {
    const map = {};
    filteredPayments.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { count: 0, revenue: 0 };
      map[key].count++;
      map[key].revenue += p.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const [y, m] = month.split('-');
        return {
          month,
          label: new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          revenue: data.revenue,
          count: data.count,
          avg: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
        };
      });
  }, [filteredPayments]);

  // Average payment value over time
  const avgPaymentOverTime = useMemo(() => {
    const map = {};
    filteredPayments.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { total: 0, count: 0 };
      map[key].total += p.amount;
      map[key].count++;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const [y, m] = month.split('-');
        return {
          month,
          label: new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          avg: Math.round(data.total / data.count),
        };
      });
  }, [filteredPayments]);

  // Profit & Loss — uses real expenses when available, falls back to estimated costs
  const COST_RATIO = 0.6;
  const hasRealExpenses = expenses.length > 0;
  const profitOverTime = useMemo(() => {
    const revenueMap = {};
    filteredPayments.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!revenueMap[key]) revenueMap[key] = 0;
      revenueMap[key] += p.amount;
    });
    const expenseMap = {};
    if (hasRealExpenses) {
      expenses.forEach((e) => {
        const key = e.date.substring(0, 7); // "YYYY-MM"
        if (!expenseMap[key]) expenseMap[key] = 0;
        expenseMap[key] += e.amount;
      });
    }
    const allMonths = new Set([...Object.keys(revenueMap), ...Object.keys(expenseMap)]);
    return [...allMonths]
      .sort((a, b) => a.localeCompare(b))
      .map((month) => {
        const [y, m] = month.split('-');
        const revenue = revenueMap[month] || 0;
        const costs = hasRealExpenses ? (expenseMap[month] || 0) : Math.round(revenue * COST_RATIO);
        return {
          month,
          label: new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          revenue,
          costs,
          profit: revenue - costs,
        };
      });
  }, [filteredPayments, expenses, hasRealExpenses]);

  // Liabilities — unpaid invoices from clients (accounts receivable / outstanding)
  const liabilitiesData = useMemo(() => {
    const allInvoices = [];
    filteredClients.forEach((c) => {
      (c.invoices || []).forEach((inv) => {
        allInvoices.push({ ...inv, clientName: c.name, clientId: c.id });
      });
    });
    const unpaid = allInvoices.filter((inv) => inv.status === 'unpaid');
    const paid = allInvoices.filter((inv) => inv.status === 'paid');
    const overdue = unpaid.filter((inv) => inv.dueDate && new Date(inv.dueDate) < new Date());
    const totalOutstanding = unpaid.reduce((s, inv) => s + inv.amount, 0);
    const totalOverdue = overdue.reduce((s, inv) => s + inv.amount, 0);
    const totalPaid = paid.reduce((s, inv) => s + inv.amount, 0);
    const totalBilled = allInvoices.reduce((s, inv) => s + inv.amount, 0);

    // Outstanding by month
    const monthMap = {};
    unpaid.forEach((inv) => {
      const d = new Date(inv.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { outstanding: 0, overdue: 0 };
      monthMap[key].outstanding += inv.amount;
      if (inv.dueDate && new Date(inv.dueDate) < new Date()) {
        monthMap[key].overdue += inv.amount;
      }
    });
    const outstandingByMonth = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const [y, m] = month.split('-');
        return { month, label: new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), ...data };
      });

    // Paid vs Unpaid breakdown for pie
    const statusBreakdown = [
      { name: 'Paid', value: totalPaid, color: '#40c057' },
      { name: 'Outstanding', value: totalOutstanding - totalOverdue, color: '#f59e0b' },
      { name: 'Overdue', value: totalOverdue, color: '#f03e3e' },
    ].filter((d) => d.value > 0);

    return {
      totalBilled, totalPaid, totalOutstanding, totalOverdue,
      unpaidCount: unpaid.length, overdueCount: overdue.length, paidCount: paid.length,
      outstandingByMonth, statusBreakdown,
      collectionRate: totalBilled > 0 ? (totalPaid / totalBilled * 100) : 0,
    };
  }, [filteredClients]);

  // Tax report generator
  const generateTaxReport = useCallback(() => {
    const fp = filteredPayments;
    const fc = filteredClients;
    const totalRevenue = fp.reduce((s, p) => s + p.amount, 0);
    const avgPayment = fp.length > 0 ? totalRevenue / fp.length : 0;

    // Revenue by month
    const revByMonth = {};
    fp.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!revByMonth[key]) revByMonth[key] = { count: 0, revenue: 0 };
      revByMonth[key].count++;
      revByMonth[key].revenue += p.amount;
    });
    const monthlyRows = Object.entries(revByMonth).sort(([a], [b]) => a.localeCompare(b));
    let runningTotal = 0;
    const monthlyTableRows = monthlyRows.map(([month, data]) => {
      runningTotal += data.revenue;
      const [y, m] = month.split('-');
      const label = new Date(y, m - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return `<tr><td>${label}</td><td style="text-align:center">${data.count}</td><td style="text-align:right;font-family:monospace">$${data.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td><td style="text-align:right;font-family:monospace">$${runningTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>`;
    }).join('');

    // Revenue by service
    const revByService = {};
    fp.forEach((p) => {
      const svc = p.service || 'Other';
      if (!revByService[svc]) revByService[svc] = { count: 0, revenue: 0 };
      revByService[svc].count++;
      revByService[svc].revenue += p.amount;
    });
    const serviceRows = Object.entries(revByService)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .map(([svc, data]) => {
        const pct = totalRevenue > 0 ? ((data.revenue / totalRevenue) * 100).toFixed(1) : '0.0';
        return `<tr><td>${svc.replace('-', ' ')}</td><td style="text-align:center">${data.count}</td><td style="text-align:right;font-family:monospace">$${data.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td><td style="text-align:right">${pct}%</td></tr>`;
      }).join('');

    // Payment details
    const paymentDetailRows = [...fp]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((p) => {
        const date = new Date(p.createdAt).toLocaleDateString('en-US');
        const clientName = fc.find((c) => c.id === p.clientId)?.name || p.clientName || 'Unknown';
        return `<tr><td>${date}</td><td>${clientName}</td><td>${(p.service || 'N/A').replace('-', ' ')}</td><td>${p.serviceTier || 'N/A'}</td><td style="text-align:right;font-family:monospace">$${p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td><td>${(p.method || 'N/A').replace('-', ' ')}</td></tr>`;
      }).join('');

    // Client summary
    const tierCounts = {};
    fc.forEach((c) => {
      const t = c.tier || 'free';
      tierCounts[t] = (tierCounts[t] || 0) + 1;
    });
    const tierRows = Object.entries(tierCounts).map(([tier, count]) => {
      const label = SUBSCRIPTION_TIERS[tier]?.label || tier;
      return `<tr><td>${label}</td><td style="text-align:center">${count}</td></tr>`;
    }).join('');

    const sourceCounts = {};
    fc.forEach((c) => {
      const src = c.source || 'manual';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });
    const sourceRows = Object.entries(sourceCounts).map(([src, count]) => {
      return `<tr><td>${src.replace('-', ' ')}</td><td style="text-align:center">${count}</td></tr>`;
    }).join('');

    const noDataMsg = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#666">No data for this period</td></tr>';

    const html = `<!DOCTYPE html>
<html><head><title>Three Seas Digital — Tax Report</title></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;max-width:900px;margin:0 auto;padding:40px 24px;color:#1a1a2e;line-height:1.6">
<div style="border-bottom:3px solid #0f4c75;padding-bottom:16px;margin-bottom:32px">
  <h1 style="margin:0 0 4px;font-size:1.6rem;color:#0f4c75">Three Seas Digital — Tax Report</h1>
  <p style="margin:0;color:#585b70;font-size:0.95rem">Period: <strong>${periodLabel}</strong></p>
  <p style="margin:0;color:#585b70;font-size:0.85rem">Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US')}</p>
</div>

<h2 style="font-size:1.15rem;color:#0f4c75;border-bottom:1px solid #e2e5f1;padding-bottom:8px;margin:24px 0 12px">Revenue Summary</h2>
<table style="width:100%;border-collapse:collapse;margin-bottom:24px">
  <tr><td style="padding:8px 12px;border:1px solid #e2e5f1;background:#f8f9fa;font-weight:600">Total Revenue</td><td style="padding:8px 12px;border:1px solid #e2e5f1;text-align:right;font-family:monospace;font-size:1.1rem;font-weight:700">$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
  <tr><td style="padding:8px 12px;border:1px solid #e2e5f1;background:#f8f9fa;font-weight:600">Payment Count</td><td style="padding:8px 12px;border:1px solid #e2e5f1;text-align:right">${fp.length}</td></tr>
  <tr><td style="padding:8px 12px;border:1px solid #e2e5f1;background:#f8f9fa;font-weight:600">Average Payment</td><td style="padding:8px 12px;border:1px solid #e2e5f1;text-align:right;font-family:monospace">$${avgPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
</table>

<h2 style="font-size:1.15rem;color:#0f4c75;border-bottom:1px solid #e2e5f1;padding-bottom:8px;margin:24px 0 12px">Revenue by Month</h2>
<table style="width:100%;border-collapse:collapse;margin-bottom:24px">
  <thead><tr style="background:#0f4c75;color:#fff"><th style="padding:10px 12px;text-align:left">Month</th><th style="padding:10px 12px;text-align:center"># Payments</th><th style="padding:10px 12px;text-align:right">Revenue</th><th style="padding:10px 12px;text-align:right">Running Total</th></tr></thead>
  <tbody>${monthlyTableRows || noDataMsg}</tbody>
</table>

<h2 style="font-size:1.15rem;color:#0f4c75;border-bottom:1px solid #e2e5f1;padding-bottom:8px;margin:24px 0 12px">Revenue by Service</h2>
<table style="width:100%;border-collapse:collapse;margin-bottom:24px">
  <thead><tr style="background:#0f4c75;color:#fff"><th style="padding:10px 12px;text-align:left">Service</th><th style="padding:10px 12px;text-align:center"># Payments</th><th style="padding:10px 12px;text-align:right">Revenue</th><th style="padding:10px 12px;text-align:right">% of Total</th></tr></thead>
  <tbody>${serviceRows || noDataMsg}</tbody>
</table>

<h2 style="font-size:1.15rem;color:#0f4c75;border-bottom:1px solid #e2e5f1;padding-bottom:8px;margin:24px 0 12px">Payment Details</h2>
<table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:0.88rem">
  <thead><tr style="background:#0f4c75;color:#fff"><th style="padding:10px 12px;text-align:left">Date</th><th style="padding:10px 12px;text-align:left">Client</th><th style="padding:10px 12px;text-align:left">Service</th><th style="padding:10px 12px;text-align:left">Tier</th><th style="padding:10px 12px;text-align:right">Amount</th><th style="padding:10px 12px;text-align:left">Method</th></tr></thead>
  <tbody>${paymentDetailRows || noDataMsg}</tbody>
</table>

<h2 style="font-size:1.15rem;color:#0f4c75;border-bottom:1px solid #e2e5f1;padding-bottom:8px;margin:24px 0 12px">Client Summary</h2>
<p style="margin:0 0 8px"><strong>New clients in period:</strong> ${fc.length}</p>
<div style="display:flex;gap:32px;margin-bottom:24px">
  <div>
    <h3 style="font-size:0.95rem;margin:0 0 8px;color:#585b70">By Tier</h3>
    <table style="border-collapse:collapse">
      <thead><tr style="background:#0f4c75;color:#fff"><th style="padding:8px 12px;text-align:left">Tier</th><th style="padding:8px 12px;text-align:center">Count</th></tr></thead>
      <tbody>${tierRows || '<tr><td colspan="2" style="padding:8px 12px;color:#666">No clients</td></tr>'}</tbody>
    </table>
  </div>
  <div>
    <h3 style="font-size:0.95rem;margin:0 0 8px;color:#585b70">By Source</h3>
    <table style="border-collapse:collapse">
      <thead><tr style="background:#0f4c75;color:#fff"><th style="padding:8px 12px;text-align:left">Source</th><th style="padding:8px 12px;text-align:center">Count</th></tr></thead>
      <tbody>${sourceRows || '<tr><td colspan="2" style="padding:8px 12px;color:#666">No clients</td></tr>'}</tbody>
    </table>
  </div>
</div>

<div style="margin-top:40px;padding:16px;background:#f8f9fa;border:1px solid #e2e5f1;border-radius:6px;font-size:0.85rem;color:#585b70">
  <strong>Note:</strong> This report was generated from local data for reference purposes. Please consult with a tax professional for official filings.
</div>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 500);
    }
  }, [filteredPayments, filteredClients, periodLabel, SUBSCRIPTION_TIERS]);

  const hasData = payments.length > 0 || clients.length > 0 || appointments.length > 0;

  if (!hasData) {
    return (
      <div className="analytics-tab">
        <div className="empty-state">
          <TrendingUp size={48} />
          <p>No data yet. Analytics will appear once you have clients, appointments, or payments.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="analytics-tab">
      {/* Filter Bar */}
      <div className="analytics-filters">
        <div className="analytics-filter-group">
          <label>Year</label>
          <select
            value={filterYear}
            onChange={(e) => { setFilterYear(e.target.value); if (e.target.value === 'all') setFilterMonth('all'); }}
            className="filter-select"
          >
            <option value="all">All Years</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="analytics-filter-group">
          <label>Month</label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="filter-select"
            disabled={filterYear === 'all'}
          >
            <option value="all">All Months</option>
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>
        </div>
        <div className="analytics-filter-group">
          <label>Date Range</label>
          <div className="analytics-date-range">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start"
            />
            <span className="date-range-separator">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End"
            />
          </div>
        </div>
        <div className="analytics-filter-divider" />
        <div className="analytics-filter-group">
          <label>Service</label>
          <select value={filterService} onChange={(e) => setFilterService(e.target.value)} className="filter-select">
            <option value="all">All Services</option>
            {availableServices.map((s) => (
              <option key={s} value={s}>{s.replace('-', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="analytics-filter-group">
          <label>Tier</label>
          <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="filter-select">
            <option value="all">All Tiers</option>
            {Object.entries(SUBSCRIPTION_TIERS).map(([key, t]) => (
              <option key={key} value={key}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="analytics-filter-group">
          <label>Method</label>
          <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} className="filter-select">
            <option value="all">All Methods</option>
            {availableMethods.map((m) => (
              <option key={m} value={m}>{m.replace('-', ' ')}</option>
            ))}
          </select>
        </div>
        {(hasActiveFilters || hasRevenueFilters) && (
          <div className="analytics-filter-group" style={{ alignSelf: 'flex-end' }}>
            <button className="btn-clear-filters" onClick={clearFilters}>
              <X size={14} /> Clear Filters
            </button>
          </div>
        )}
        <div className="analytics-filter-group" style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
          <button className="btn-tax-report" onClick={generateTaxReport}>
            <Printer size={15} /> Generate Tax Report
          </button>
        </div>
      </div>

      {(hasActiveFilters || hasRevenueFilters) && (
        <div className="analytics-period-label">
          <Filter size={14} /> Showing data for: <strong>{periodLabel}</strong>
          {filterService !== 'all' && <span className="filter-chip">{filterService.replace('-', ' ')}</span>}
          {filterTier !== 'all' && <span className="filter-chip">{SUBSCRIPTION_TIERS[filterTier]?.label || filterTier}</span>}
          {filterMethod !== 'all' && <span className="filter-chip">{filterMethod.replace('-', ' ')}</span>}
        </div>
      )}

      {/* Chart Visibility Toggles */}
      <div className="chart-visibility-toggles">
        <span className="chart-vis-label"><Eye size={14} /> Charts:</span>
        <button className={`chart-vis-btn ${allChartsVisible ? 'active' : ''}`} onClick={toggleAll}>All</button>
        <button className={`chart-vis-btn ${chartVis.revenue ? 'active' : ''}`} onClick={() => toggleChart('revenue')}>
          <DollarSign size={13} /> Revenue
        </button>
        <button className={`chart-vis-btn ${chartVis.breakdown ? 'active' : ''}`} onClick={() => toggleChart('breakdown')}>
          <BarChart3 size={13} /> Breakdown
        </button>
        <button className={`chart-vis-btn ${chartVis.profitLoss ? 'active' : ''}`} onClick={() => toggleChart('profitLoss')}>
          <TrendingUp size={13} /> Profit &amp; Loss
        </button>
        <button className={`chart-vis-btn ${chartVis.invoices ? 'active' : ''}`} onClick={() => toggleChart('invoices')}>
          <Receipt size={13} /> Invoices
        </button>
        <button className={`chart-vis-btn ${chartVis.clients ? 'active' : ''}`} onClick={() => toggleChart('clients')}>
          <Users size={13} /> Clients
        </button>
      </div>

      {/* KPI Row */}
      <div className="analytics-kpi-row">
        <div className="analytics-kpi-card">
          <span className="kpi-label">{filterMonth !== 'all' || (startDate && endDate) ? 'Period Revenue' : 'Monthly Revenue'}</span>
          <span className="kpi-value">{formatCurrency(kpis.curRev)}</span>
        </div>
        <div className="analytics-kpi-card">
          <span className="kpi-label">Revenue Growth</span>
          <span className="kpi-value">
            {kpis.growth >= 0 ? '+' : ''}{kpis.growth.toFixed(1)}%
          </span>
          <span className={`kpi-delta ${kpis.growth >= 0 ? 'positive' : 'negative'}`}>
            {kpis.growthLabel}
          </span>
        </div>
        <div className="analytics-kpi-card">
          <span className="kpi-label">Conversion Rate</span>
          <span className="kpi-value">{kpis.conversionRate.toFixed(1)}%</span>
          <span className="kpi-delta neutral">appointments → clients</span>
        </div>
        <div className="analytics-kpi-card">
          <span className="kpi-label">Avg Client Value</span>
          <span className="kpi-value">{formatCurrency(kpis.avgValue)}</span>
        </div>
      </div>

      {/* Profit & Liabilities KPI Row */}
      <div className="analytics-kpi-row">
        <div className="analytics-kpi-card">
          <span className="kpi-label">Total Revenue</span>
          <span className="kpi-value">{formatCurrency(filteredPayments.reduce((s, p) => s + p.amount, 0))}</span>
          <span className="kpi-delta neutral">{filteredPayments.length} payments</span>
        </div>
        <div className="analytics-kpi-card">
          <span className="kpi-label">{hasRealExpenses ? 'Actual Profit' : 'Est. Profit (40%)'}</span>
          <span className="kpi-value" style={{ color: 'var(--success)' }}>
            {formatCurrency(
              hasRealExpenses
                ? filteredPayments.reduce((s, p) => s + p.amount, 0) - expenses.reduce((s, e) => s + e.amount, 0)
                : filteredPayments.reduce((s, p) => s + p.amount, 0) * (1 - COST_RATIO)
            )}
          </span>
          <span className="kpi-delta positive">{hasRealExpenses ? 'based on actual costs' : 'after est. operating costs'}</span>
        </div>
        <div className="analytics-kpi-card">
          <span className="kpi-label">Outstanding</span>
          <span className="kpi-value" style={{ color: 'var(--warning)' }}>
            {formatCurrency(liabilitiesData.totalOutstanding)}
          </span>
          <span className="kpi-delta neutral">{liabilitiesData.unpaidCount} unpaid invoice{liabilitiesData.unpaidCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="analytics-kpi-card">
          <span className="kpi-label">Overdue</span>
          <span className="kpi-value" style={{ color: 'var(--danger)' }}>
            {formatCurrency(liabilitiesData.totalOverdue)}
          </span>
          <span className="kpi-delta negative">{liabilitiesData.overdueCount} overdue invoice{liabilitiesData.overdueCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Revenue Over Time — full width area */}
      {chartVis.revenue && monthlyRevenue.length > 0 ? (
        <div className="analytics-chart-card full">
          <h3><DollarSign size={16} /> Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f4c75" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0f4c75" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#0f4c75" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : chartVis.revenue && hasActiveFilters && (
        <div className="analytics-chart-card full">
          <h3><DollarSign size={16} /> Revenue Over Time</h3>
          <div className="empty-state-sm"><p>No revenue data for this period</p></div>
        </div>
      )}

      {/* Monthly Revenue Bars + Payment Count — full width composed */}
      {chartVis.revenue && monthlyRevenueDetailed.length > 1 && (
        <div className="analytics-chart-card full">
          <h3><BarChart3 size={16} /> Monthly Revenue &amp; Payments</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={monthlyRevenueDetailed}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="rev" tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="count" orientation="right" allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v, name) => name === 'revenue' ? formatCurrency(v) : v} />
              <Legend />
              <Bar yAxisId="rev" dataKey="revenue" name="Revenue" fill="#0f4c75" radius={[4, 4, 0, 0]} barSize={32} />
              <Line yAxisId="count" type="monotone" dataKey="count" name="Payments" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Revenue charts row */}
      {(chartVis.revenue || chartVis.breakdown) && <div className="analytics-charts-row">
        {/* Yearly Revenue Comparison */}
        {chartVis.revenue && yearlyRevenue.length > 0 && (
          <div className="analytics-chart-card">
            <h3><CalendarIcon size={16} /> Yearly Revenue</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={yearlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                  {yearlyRevenue.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue by Tier */}
        {chartVis.breakdown && revenueByTier.length > 0 && (
          <div className="analytics-chart-card">
            <h3><Shield size={16} /> Revenue by Tier</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={revenueByTier} cx="50%" cy="50%" innerRadius={45} outerRadius={85} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {revenueByTier.map((entry, i) => (
                    <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue by Payment Method */}
        {chartVis.breakdown && revenueByMethod.length > 0 && (
          <div className="analytics-chart-card">
            <h3><CreditCard size={16} /> Revenue by Payment Method</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueByMethod} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
                <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="method" tick={{ fontSize: 12 }} width={100} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                  {revenueByMethod.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Average Payment Over Time */}
        {chartVis.revenue && avgPaymentOverTime.length > 1 && (
          <div className="analytics-chart-card">
            <h3><TrendingUp size={16} /> Avg Payment Value</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={avgPaymentOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Line type="monotone" dataKey="avg" name="Avg Payment" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4, fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>}

      {/* Cumulative Revenue — full width */}
      {chartVis.revenue && cumulativeRevenue.length > 1 && (
        <div className="analytics-chart-card full">
          <h3><TrendingUp size={16} /> Cumulative Revenue</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={cumulativeRevenue}>
              <defs>
                <linearGradient id="cumRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#40c057" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#40c057" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Area type="monotone" dataKey="total" name="Cumulative Revenue" stroke="#40c057" fill="url(#cumRevGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Profit & Loss — full width */}
      {chartVis.profitLoss && profitOverTime.length > 1 && (
        <div className="analytics-chart-card full">
          <h3><DollarSign size={16} /> Profit &amp; Loss</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={profitOverTime}>
              <defs>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#40c057" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#40c057" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#0f4c75" radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="costs" name={hasRealExpenses ? "Actual Costs" : "Est. Costs"} fill="#f03e3e" radius={[4, 4, 0, 0]} barSize={28} opacity={0.7} />
              <Area type="monotone" dataKey="profit" name="Profit" stroke="#40c057" fill="url(#profitGrad)" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Liabilities / Invoices charts row */}
      {(chartVis.invoices || chartVis.profitLoss) && <div className="analytics-charts-row">
        {/* Invoice Status Breakdown */}
        {chartVis.invoices && liabilitiesData.statusBreakdown.length > 0 && (
          <div className="analytics-chart-card">
            <h3><Receipt size={16} /> Invoice Status</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={liabilitiesData.statusBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={85} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {liabilitiesData.statusBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Outstanding by Month */}
        {chartVis.invoices && liabilitiesData.outstandingByMonth.length > 0 && (
          <div className="analytics-chart-card">
            <h3><AlertCircle size={16} /> Outstanding by Month</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={liabilitiesData.outstandingByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="outstanding" name="Outstanding" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overdue" name="Overdue" fill="#f03e3e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Collection Rate */}
        {chartVis.invoices && liabilitiesData.totalBilled > 0 && (
          <div className="analytics-chart-card">
            <h3><CreditCard size={16} /> Collections Overview</h3>
            <div className="collections-overview">
              <div className="collection-stat">
                <span className="collection-stat-label">Total Billed</span>
                <span className="collection-stat-value">{formatCurrency(liabilitiesData.totalBilled)}</span>
              </div>
              <div className="collection-stat">
                <span className="collection-stat-label">Collected</span>
                <span className="collection-stat-value" style={{ color: 'var(--success)' }}>{formatCurrency(liabilitiesData.totalPaid)}</span>
              </div>
              <div className="collection-stat">
                <span className="collection-stat-label">Outstanding</span>
                <span className="collection-stat-value" style={{ color: 'var(--warning)' }}>{formatCurrency(liabilitiesData.totalOutstanding)}</span>
              </div>
              <div className="collection-stat">
                <span className="collection-stat-label">Overdue</span>
                <span className="collection-stat-value" style={{ color: 'var(--danger)' }}>{formatCurrency(liabilitiesData.totalOverdue)}</span>
              </div>
              <div className="collection-rate-bar">
                <div className="collection-rate-label">
                  <span>Collection Rate</span>
                  <strong>{liabilitiesData.collectionRate.toFixed(1)}%</strong>
                </div>
                <div className="collection-rate-track">
                  <div className="collection-rate-fill" style={{ width: `${Math.min(liabilitiesData.collectionRate, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profit Margin by Month */}
        {chartVis.profitLoss && profitOverTime.length > 1 && (
          <div className="analytics-chart-card">
            <h3><TrendingUp size={16} /> Profit Margin</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={profitOverTime.map((d) => ({ ...d, margin: d.revenue > 0 ? Math.round((d.profit / d.revenue) * 100) : 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Line type="monotone" dataKey="margin" name="Profit Margin" stroke="#40c057" strokeWidth={2} dot={{ r: 4, fill: '#40c057' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>}

      {/* Client & Operations charts row */}
      {(chartVis.clients || chartVis.breakdown) && <div className="analytics-charts-row">
        {/* Client Growth */}
        {chartVis.clients && clientGrowth.length > 0 && (
          <div className="analytics-chart-card">
            <h3><Users size={16} /> Client Growth</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={clientGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#00b4d8" strokeWidth={2} dot={{ r: 4, fill: '#00b4d8' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue by Service */}
        {chartVis.breakdown && revenueByService.length > 0 && (
          <div className="analytics-chart-card">
            <h3><Briefcase size={16} /> Revenue by Service</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={revenueByService} cx="50%" cy="50%" outerRadius={85} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {revenueByService.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Client Tiers */}
        {chartVis.clients && <div className="analytics-chart-card">
          <h3><Shield size={16} /> Client Tiers</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tierDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="tier" tick={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {tierDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>}

        {/* Conversion Funnel */}
        {chartVis.clients && <div className="analytics-chart-card">
          <h3><TrendingUp size={16} /> Conversion Funnel</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={conversionFunnel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
              <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {conversionFunnel.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>}

        {/* Client Sources */}
        {chartVis.clients && clientSources.length > 0 && (
          <div className="analytics-chart-card">
            <h3><UserPlus size={16} /> Client Sources</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={clientSources} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {clientSources.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>}
    </div>
  );
}

/* ===== LEADS TAB ===== */
const LEAD_STATUSES = [
  { value: 'new', label: 'New', color: '#3b82f6' },
  { value: 'contacted', label: 'Contacted', color: '#f59e0b' },
  { value: 'followup', label: 'Follow Up', color: '#8b5cf6' },
  { value: 'interested', label: 'Interested', color: '#10b981' },
  { value: 'not-interested', label: 'Not Interested', color: '#ef4444' },
  { value: 'converted', label: 'Converted', color: '#06b6d4' },
];

const BUSINESS_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'retail', label: 'Retail / Shop' },
  { value: 'restaurant', label: 'Restaurant / Cafe' },
  { value: 'office', label: 'Office' },
  { value: 'services', label: 'Services' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Other' },
];

function classifyBusiness(tags) {
  if (tags.shop) return 'retail';
  if (tags.amenity && /restaurant|cafe|bar|fast_food/.test(tags.amenity)) return 'restaurant';
  if (tags.office) return 'office';
  if (tags.amenity && /pharmacy|clinic|dentist|doctor|veterinary|hospital/.test(tags.amenity)) return 'medical';
  if (tags.craft || tags.amenity === 'bank') return 'services';
  if (tags.tourism) return 'services';
  return 'other';
}

function getBusinessType(tags) {
  return tags.shop || tags.office || tags.amenity || tags.craft || tags.tourism || tags.landuse || 'business';
}

function LeadsTab() {
  const { leads, addLead, updateLead, deleteLead, addLeadNote, deleteLeadNote, currentUser, addAppointment, markFollowUp, addProspect, businessDatabase, saveToBusinessDb, getFromBusinessDb, deleteFromBusinessDb } = useAppContext();

  const [searchAddress, setSearchAddress] = useState('');
  const [searchRadius, setSearchRadius] = useState(1000);
  const [searchCategory, setSearchCategory] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchCenter, setSearchCenter] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nameSearch, setNameSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualForm, setManualForm] = useState({ businessName: '', address: '', phone: '', email: '', type: '', website: '', notes: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [sendToFollowUpConfirm, setSendToFollowUpConfirm] = useState(null);
  const [sendToPipelineConfirm, setSendToPipelineConfirm] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  const [enrichData, setEnrichData] = useState({});
  const [leadsView, setLeadsView] = useState('pipeline'); // 'pipeline' or 'database'
  const [dbSearch, setDbSearch] = useState('');
  const [selectedDbEntry, setSelectedDbEntry] = useState(null);

  // Open business details modal - check if already in database
  const handleViewDetails = (result) => {
    const existing = getFromBusinessDb(result.name, result.address);
    if (existing) {
      setSelectedResult({ ...result, enrichment: existing.enrichment, dbId: existing.id });
      setEnrichData(existing.enrichment || {});
    } else {
      setSelectedResult(result);
      setEnrichData(result.enrichment || {});
    }
  };

  // Save enrichment data to database
  const handleSaveEnrichment = () => {
    if (selectedResult) {
      // Save to business database
      saveToBusinessDb({
        name: selectedResult.name,
        address: selectedResult.address,
        phone: selectedResult.phone,
        website: selectedResult.website,
        type: selectedResult.type,
        coordinates: selectedResult.coordinates,
        enrichment: enrichData,
        source: 'osm',
      });
      // Also update the search result
      setSearchResults((prev) =>
        prev.map((r) => r.id === selectedResult.id ? { ...r, enrichment: enrichData } : r)
      );
      setSelectedResult({ ...selectedResult, enrichment: enrichData });
    }
  };

  // Filter database entries
  const filteredDatabase = useMemo(() => {
    if (!dbSearch.trim()) return businessDatabase;
    const search = dbSearch.toLowerCase();
    return businessDatabase.filter((b) =>
      b.name?.toLowerCase().includes(search) ||
      b.address?.toLowerCase().includes(search) ||
      b.type?.toLowerCase().includes(search)
    );
  }, [businessDatabase, dbSearch]);

  // Handle lead status change - archive "not-interested" to database, send "converted" to pipeline
  const handleLeadStatusChange = (lead, newStatus) => {
    if (newStatus === 'not-interested') {
      // Save to database with all enrichment data
      saveToBusinessDb({
        name: lead.businessName,
        address: lead.address,
        phone: lead.phone,
        website: lead.website,
        type: lead.type,
        coordinates: lead.coordinates,
        enrichment: {
          ...lead.enrichment,
          archivedReason: 'not-interested',
          archivedAt: new Date().toISOString(),
          notes: lead.notes?.map((n) => n.text).join('\n') || '',
        },
        source: lead.source || 'manual',
      });
      // Remove from leads
      deleteLead(lead.id);
      setToastMsg('Lead archived to database');
      setTimeout(() => setToastMsg(''), 3000);
    } else if (newStatus === 'converted') {
      // Archive to database AND send to pipeline
      saveToBusinessDb({
        name: lead.businessName,
        address: lead.address,
        phone: lead.phone,
        website: lead.website,
        type: lead.type,
        coordinates: lead.coordinates,
        enrichment: {
          ...lead.enrichment,
          archivedReason: 'converted',
          archivedAt: new Date().toISOString(),
          notes: lead.notes?.map((n) => n.text).join('\n') || '',
        },
        source: lead.source || 'manual',
      });
      // Send to pipeline
      const leadNotesFormatted = (lead.notes || []).map((n) => ({
        id: n.id,
        text: n.text,
        author: n.author || 'From Lead',
        createdAt: n.createdAt,
      }));
      const result = addProspect({
        name: lead.businessName,
        email: lead.email || '',
        phone: lead.phone || '',
        service: lead.type || '',
        stage: 'negotiating',
        source: 'lead',
        notes: leadNotesFormatted,
      });
      if (result.success) {
        deleteLead(lead.id);
        setToastMsg('Lead converted & sent to Pipeline!');
      } else {
        setToastMsg('Failed to convert lead');
      }
      setTimeout(() => setToastMsg(''), 3000);
    } else {
      updateLead(lead.id, { status: newStatus });
    }
  };

  // Lookup URLs
  const getLookupUrls = (business) => {
    const name = encodeURIComponent(business.name || '');
    const addr = encodeURIComponent(business.address || '');
    const query = encodeURIComponent(`${business.name} ${business.address}`.trim());
    return {
      google: `https://www.google.com/search?q=${query}`,
      googleMaps: `https://www.google.com/maps/search/${query}`,
      yelp: `https://www.yelp.com/search?find_desc=${name}&find_loc=${addr}`,
      linkedin: `https://www.linkedin.com/search/results/companies/?keywords=${name}`,
      facebook: `https://www.facebook.com/search/pages/?q=${name}`,
      bbb: `https://www.bbb.org/search?find_text=${name}&find_loc=${addr}`,
    };
  };

  // Send to Follow-Ups (creates appointment with follow-up)
  const handleSendToFollowUp = (lead) => {
    const today = new Date().toISOString().split('T')[0];
    // Convert lead notes to follow-up notes format
    const leadNotesFormatted = (lead.notes || []).map((n) => ({
      id: n.id,
      text: n.text,
      author: n.author || 'From Lead',
      createdAt: n.createdAt,
    }));
    const newAppt = addAppointment({
      name: lead.businessName,
      email: lead.email || '',
      phone: lead.phone || '',
      date: today,
      time: '09:00',
      service: lead.type || '',
      message: `Lead from prospecting: ${lead.address || ''}`,
      status: 'pending',
      leadNotes: leadNotesFormatted, // Store original lead notes
      followUp: {
        note: `Contacted lead - ${lead.notes?.length > 0 ? lead.notes[0].text : 'Needs follow-up'}`,
        priority: 'normal',
        followUpDate: today,
        status: 'pending',
        createdAt: new Date().toISOString(),
        notes: [], // Start empty - additional notes added during follow-up
      },
    });
    if (newAppt && newAppt.id) {
      deleteLead(lead.id);
      setToastMsg('Lead sent to Follow-Ups!');
    } else {
      setToastMsg('Failed to send to Follow-Ups');
    }
    setSendToFollowUpConfirm(null);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Send to Pipeline (creates prospect)
  const handleSendToPipeline = (lead) => {
    // Convert lead notes to prospect notes format
    const leadNotesFormatted = (lead.notes || []).map((n) => ({
      id: n.id,
      text: n.text,
      author: n.author || 'From Lead',
      createdAt: n.createdAt,
    }));
    const result = addProspect({
      name: lead.businessName,
      email: lead.email || '',
      phone: lead.phone || '',
      service: lead.type || '',
      stage: lead.status === 'converted' ? 'negotiating' : 'inquiry',
      source: 'lead',
      notes: leadNotesFormatted, // Pass lead notes
    });
    if (result.success) {
      deleteLead(lead.id);
      setToastMsg('Lead sent to Pipeline!');
    } else {
      setToastMsg('Failed to send to Pipeline');
    }
    setSendToPipelineConfirm(null);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const statusCounts = useMemo(() => {
    const counts = {};
    LEAD_STATUSES.forEach((s) => { counts[s.value] = 0; });
    leads.forEach((l) => { counts[l.status] = (counts[l.status] || 0) + 1; });
    return counts;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const filtered = leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (nameSearch && !l.businessName.toLowerCase().includes(nameSearch.toLowerCase())) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'updated': return new Date(b.updatedAt) - new Date(a.updatedAt);
        case 'name-az': return a.businessName.localeCompare(b.businessName);
        case 'name-za': return b.businessName.localeCompare(a.businessName);
        default: return 0;
      }
    });
  }, [leads, statusFilter, nameSearch, sortBy]);

  const isAlreadySaved = useCallback((name, address) => {
    return leads.some(
      (l) => l.businessName.toLowerCase() === name.toLowerCase() && l.address.toLowerCase() === address.toLowerCase()
    );
  }, [leads]);

  const handleSearch = async () => {
    if (!searchAddress.trim()) { setSearchError('Please enter an address'); return; }
    setSearching(true);
    setSearchError('');
    setSearchResults([]);
    setSearchCenter(null);
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddress)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'ThreeSeasDigital/1.0' },
      });
      const geoData = await geoRes.json();
      if (!geoData.length) { setSearchError('Address not found. Try a more specific address.'); setSearching(false); return; }
      const { lat, lon, display_name } = geoData[0];
      setSearchCenter({ lat: parseFloat(lat), lon: parseFloat(lon), name: display_name });

      const query = `[out:json][timeout:15];(
  node["shop"](around:${searchRadius},${lat},${lon});
  node["office"](around:${searchRadius},${lat},${lon});
  node["amenity"~"restaurant|cafe|bar|fast_food|bank|pharmacy|clinic|dentist|doctor|veterinary"](around:${searchRadius},${lat},${lon});
  node["craft"](around:${searchRadius},${lat},${lon});
  node["tourism"~"hotel|motel|guest_house"](around:${searchRadius},${lat},${lon});
  way["shop"](around:${searchRadius},${lat},${lon});
  way["office"](around:${searchRadius},${lat},${lon});
);out center;`;
      const overRes = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const overData = await overRes.json();

      const results = (overData.elements || [])
        .filter((el) => el.tags && el.tags.name)
        .map((el) => {
          const coords = el.type === 'way' ? { lat: el.center?.lat, lon: el.center?.lon } : { lat: el.lat, lon: el.lon };
          const tags = el.tags;
          const addr = [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']].filter(Boolean).join(', ') || '';
          return {
            id: el.id,
            name: tags.name,
            type: getBusinessType(tags),
            category: classifyBusiness(tags),
            address: addr,
            phone: tags.phone || tags['contact:phone'] || '',
            website: tags.website || tags['contact:website'] || '',
            coordinates: coords,
          };
        });

      const filtered = searchCategory === 'all' ? results : results.filter((r) => r.category === searchCategory);
      setSearchResults(filtered);
      if (!filtered.length) setSearchError('No businesses found in this area. Try a larger radius or different address.');
    } catch (err) {
      setSearchError('Search failed. Please check your connection and try again.');
    }
    setSearching(false);
  };

  const handleSaveResult = (result) => {
    addLead({
      businessName: result.name,
      address: result.address,
      phone: result.phone,
      website: result.website,
      type: result.type,
      source: 'osm',
      coordinates: result.coordinates,
      enrichment: result.enrichment || {},
    });
  };

  const handleManualAdd = (e) => {
    e.preventDefault();
    const result = addLead({ ...manualForm, source: 'manual' });
    if (result.success) {
      setManualForm({ businessName: '', address: '', phone: '', email: '', type: '', website: '', notes: '' });
      if (manualForm.notes.trim()) {
        addLeadNote(result.lead.id, manualForm.notes);
      }
      setShowAddForm(false);
    }
  };

  const handleGoogleMaps = () => {
    const q = searchAddress.trim() || 'businesses';
    window.open(`https://www.google.com/maps/search/businesses+near+${encodeURIComponent(q)}`, '_blank');
  };

  const handleAddNote = (leadId) => {
    if (!newNote.trim()) return;
    addLeadNote(leadId, newNote.trim());
    setNewNote('');
  };

  const handleDelete = (id) => {
    deleteLead(id);
    setDeleteConfirm(null);
    if (selectedLead?.id === id) setSelectedLead(null);
  };

  const sel = selectedLead ? leads.find((l) => l.id === selectedLead.id) : null;

  return (
    <div className="leads-tab">
      {toastMsg && <div className="convert-toast">{toastMsg}</div>}

      {/* Header with View Toggle */}
      <div className="leads-header-bar">
        <div className="leads-stats-row">
          <div className="leads-stat-chip">
            <span className="leads-stat-value">{leads.length}</span>
            <span className="leads-stat-label">Leads</span>
          </div>
          <div className="leads-stat-chip">
            <span className="leads-stat-value">{businessDatabase.length}</span>
            <span className="leads-stat-label">Database</span>
          </div>
          {LEAD_STATUSES.slice(0, 4).map((s) => (
            <div key={s.value} className="leads-stat-chip">
              <span className="leads-status-dot" style={{ background: s.color }} />
              <span className="leads-stat-value">{statusCounts[s.value]}</span>
              <span className="leads-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="leads-view-toggle">
          <button className={`view-btn ${leadsView === 'pipeline' ? 'active' : ''}`} onClick={() => setLeadsView('pipeline')}>
            <Search size={14} /> Pipeline
          </button>
          <button className={`view-btn ${leadsView === 'database' ? 'active' : ''}`} onClick={() => setLeadsView('database')}>
            <Building2 size={14} /> Database
          </button>
        </div>
      </div>

      {/* Business Details Modal */}
      {selectedResult && (
        <div className="business-modal-overlay" onClick={() => setSelectedResult(null)}>
          <div className="business-modal" onClick={(e) => e.stopPropagation()}>
            <button className="business-modal-close" onClick={() => setSelectedResult(null)}><X size={20} /></button>

            <div className="business-modal-header">
              <div className="business-modal-icon">
                <Building2 size={28} />
              </div>
              <div>
                <h2>{selectedResult.name}</h2>
                <span className="business-type-badge">{selectedResult.type}</span>
              </div>
            </div>

            <div className="business-modal-content">
              {/* Basic Info */}
              <div className="business-section">
                <h4>Business Information</h4>
                <div className="business-info-grid">
                  {selectedResult.address && (
                    <div className="business-info-item">
                      <MapPin size={14} />
                      <span>{selectedResult.address}</span>
                    </div>
                  )}
                  {selectedResult.phone && (
                    <div className="business-info-item">
                      <Phone size={14} />
                      <a href={`tel:${selectedResult.phone}`}>{selectedResult.phone}</a>
                    </div>
                  )}
                  {selectedResult.website && (
                    <div className="business-info-item">
                      <Globe size={14} />
                      <a href={selectedResult.website.startsWith('http') ? selectedResult.website : `https://${selectedResult.website}`} target="_blank" rel="noopener noreferrer">
                        {selectedResult.website}
                      </a>
                    </div>
                  )}
                  {selectedResult.coordinates && (
                    <div className="business-info-item">
                      <MapPin size={14} />
                      <span>Lat: {selectedResult.coordinates.lat?.toFixed(4)}, Lon: {selectedResult.coordinates.lon?.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Lookup Links */}
              <div className="business-section">
                <h4>Look Up Business</h4>
                <p className="business-section-desc">Research this business on external platforms:</p>
                <div className="business-lookup-grid">
                  {(() => {
                    const urls = getLookupUrls(selectedResult);
                    return (
                      <>
                        <a href={urls.google} target="_blank" rel="noopener noreferrer" className="lookup-btn google">
                          <Search size={16} /> Google Search
                        </a>
                        <a href={urls.googleMaps} target="_blank" rel="noopener noreferrer" className="lookup-btn gmaps">
                          <MapPin size={16} /> Google Maps
                        </a>
                        <a href={urls.yelp} target="_blank" rel="noopener noreferrer" className="lookup-btn yelp">
                          <MessageSquare size={16} /> Yelp Reviews
                        </a>
                        <a href={urls.linkedin} target="_blank" rel="noopener noreferrer" className="lookup-btn linkedin">
                          <Users size={16} /> LinkedIn
                        </a>
                        <a href={urls.facebook} target="_blank" rel="noopener noreferrer" className="lookup-btn facebook">
                          <Users size={16} /> Facebook
                        </a>
                        <a href={urls.bbb} target="_blank" rel="noopener noreferrer" className="lookup-btn bbb">
                          <Shield size={16} /> BBB
                        </a>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Manual Enrichment */}
              <div className="business-section">
                <h4>Business Intel (Manual Entry)</h4>
                <p className="business-section-desc">Add data you find from research:</p>
                <div className="enrich-form">
                  <div className="enrich-row">
                    <div className="enrich-field">
                      <label>Est. Revenue</label>
                      <select value={enrichData.revenue || ''} onChange={(e) => setEnrichData({ ...enrichData, revenue: e.target.value })}>
                        <option value="">Unknown</option>
                        <option value="<100k">Under $100K</option>
                        <option value="100k-500k">$100K - $500K</option>
                        <option value="500k-1m">$500K - $1M</option>
                        <option value="1m-5m">$1M - $5M</option>
                        <option value="5m-10m">$5M - $10M</option>
                        <option value="10m+">$10M+</option>
                      </select>
                    </div>
                    <div className="enrich-field">
                      <label>Employees</label>
                      <select value={enrichData.employees || ''} onChange={(e) => setEnrichData({ ...enrichData, employees: e.target.value })}>
                        <option value="">Unknown</option>
                        <option value="1-5">1-5</option>
                        <option value="6-10">6-10</option>
                        <option value="11-25">11-25</option>
                        <option value="26-50">26-50</option>
                        <option value="51-100">51-100</option>
                        <option value="100+">100+</option>
                      </select>
                    </div>
                    <div className="enrich-field">
                      <label>Years in Business</label>
                      <input type="text" placeholder="e.g. 5" value={enrichData.yearsInBusiness || ''} onChange={(e) => setEnrichData({ ...enrichData, yearsInBusiness: e.target.value })} />
                    </div>
                  </div>
                  <div className="enrich-row">
                    <div className="enrich-field">
                      <label>Google Rating</label>
                      <input type="text" placeholder="e.g. 4.5" value={enrichData.googleRating || ''} onChange={(e) => setEnrichData({ ...enrichData, googleRating: e.target.value })} />
                    </div>
                    <div className="enrich-field">
                      <label>Google Reviews</label>
                      <input type="text" placeholder="e.g. 127" value={enrichData.googleReviews || ''} onChange={(e) => setEnrichData({ ...enrichData, googleReviews: e.target.value })} />
                    </div>
                    <div className="enrich-field">
                      <label>Yelp Rating</label>
                      <input type="text" placeholder="e.g. 4.0" value={enrichData.yelpRating || ''} onChange={(e) => setEnrichData({ ...enrichData, yelpRating: e.target.value })} />
                    </div>
                  </div>
                  <div className="enrich-row">
                    <div className="enrich-field wide">
                      <label>Owner/Decision Maker</label>
                      <input type="text" placeholder="Name and title" value={enrichData.decisionMaker || ''} onChange={(e) => setEnrichData({ ...enrichData, decisionMaker: e.target.value })} />
                    </div>
                    <div className="enrich-field">
                      <label>Direct Email</label>
                      <input type="email" placeholder="owner@business.com" value={enrichData.directEmail || ''} onChange={(e) => setEnrichData({ ...enrichData, directEmail: e.target.value })} />
                    </div>
                  </div>
                  <div className="enrich-row">
                    <div className="enrich-field full">
                      <label>Notes / Research Findings</label>
                      <textarea placeholder="Website quality, current marketing, pain points observed..." value={enrichData.notes || ''} onChange={(e) => setEnrichData({ ...enrichData, notes: e.target.value })} rows={3} />
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={handleSaveEnrichment}>
                    <CheckCircle size={14} /> Save Intel
                  </button>
                </div>
              </div>
            </div>

            <div className="business-modal-footer">
              {(() => {
                const saved = isAlreadySaved(selectedResult.name, selectedResult.address);
                return (
                  <button
                    className={`btn ${saved ? 'btn-outline' : 'btn-primary'}`}
                    onClick={() => { if (!saved) handleSaveResult({ ...selectedResult, enrichment: enrichData }); }}
                    disabled={saved}
                  >
                    {saved ? <><CheckCircle size={14} /> Already Saved</> : <><Plus size={14} /> Save as Lead</>}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {leadsView === 'database' ? (
        <div className="business-database">
          <div className="db-search-bar">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search database by name, address, or type..."
              value={dbSearch}
              onChange={(e) => setDbSearch(e.target.value)}
            />
            <span className="db-count">{filteredDatabase.length} businesses</span>
          </div>

          {filteredDatabase.length === 0 ? (
            <div className="db-empty">
              <Building2 size={48} />
              <h3>{businessDatabase.length === 0 ? 'No businesses saved yet' : 'No matching businesses'}</h3>
              <p>{businessDatabase.length === 0 ? 'Research businesses and save their intel to build your database' : 'Try a different search term'}</p>
            </div>
          ) : (
            <div className="db-grid">
              {filteredDatabase.map((biz) => (
                <div key={biz.id} className="db-card" onClick={() => setSelectedDbEntry(biz)}>
                  <div className="db-card-header">
                    <Building2 size={18} />
                    <div>
                      <h4>{biz.name}</h4>
                      <span className="db-type">{biz.type || 'Business'}</span>
                    </div>
                  </div>
                  <div className="db-card-body">
                    {biz.address && <p><MapPin size={12} /> {biz.address}</p>}
                    {biz.phone && <p><Phone size={12} /> {biz.phone}</p>}
                    {biz.enrichment?.revenue && <p><DollarSign size={12} /> {biz.enrichment.revenue}</p>}
                    {biz.enrichment?.employees && <p><Users size={12} /> {biz.enrichment.employees} employees</p>}
                    {biz.enrichment?.googleRating && <p>⭐ {biz.enrichment.googleRating} ({biz.enrichment.googleReviews || 0} reviews)</p>}
                  </div>
                  <div className="db-card-footer">
                    <span>Updated {new Date(biz.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Database Entry Detail Modal */}
          {selectedDbEntry && (
            <div className="business-modal-overlay" onClick={() => setSelectedDbEntry(null)}>
              <div className="business-modal" onClick={(e) => e.stopPropagation()}>
                <button className="business-modal-close" onClick={() => setSelectedDbEntry(null)}><X size={20} /></button>

                <div className="business-modal-header">
                  <div className="business-modal-icon"><Building2 size={28} /></div>
                  <div>
                    <h2>{selectedDbEntry.name}</h2>
                    <span className="business-type-badge">{selectedDbEntry.type || 'Business'}</span>
                  </div>
                </div>

                <div className="business-modal-content">
                  <div className="business-section">
                    <h4>Contact Info</h4>
                    <div className="business-info-grid">
                      {selectedDbEntry.address && <div className="business-info-item"><MapPin size={14} /><span>{selectedDbEntry.address}</span></div>}
                      {selectedDbEntry.phone && <div className="business-info-item"><Phone size={14} /><a href={`tel:${selectedDbEntry.phone}`}>{selectedDbEntry.phone}</a></div>}
                      {selectedDbEntry.website && <div className="business-info-item"><Globe size={14} /><a href={selectedDbEntry.website} target="_blank" rel="noopener noreferrer">{selectedDbEntry.website}</a></div>}
                      {selectedDbEntry.enrichment?.directEmail && <div className="business-info-item"><Mail size={14} /><a href={`mailto:${selectedDbEntry.enrichment.directEmail}`}>{selectedDbEntry.enrichment.directEmail}</a></div>}
                    </div>
                  </div>

                  {selectedDbEntry.enrichment && Object.keys(selectedDbEntry.enrichment).length > 0 && (
                    <div className="business-section">
                      <h4>Business Intel</h4>
                      <div className="db-intel-grid">
                        {selectedDbEntry.enrichment.revenue && <div className="intel-item"><span className="intel-label">Revenue</span><span className="intel-value">{selectedDbEntry.enrichment.revenue}</span></div>}
                        {selectedDbEntry.enrichment.employees && <div className="intel-item"><span className="intel-label">Employees</span><span className="intel-value">{selectedDbEntry.enrichment.employees}</span></div>}
                        {selectedDbEntry.enrichment.yearsInBusiness && <div className="intel-item"><span className="intel-label">Years in Business</span><span className="intel-value">{selectedDbEntry.enrichment.yearsInBusiness}</span></div>}
                        {selectedDbEntry.enrichment.googleRating && <div className="intel-item"><span className="intel-label">Google Rating</span><span className="intel-value">⭐ {selectedDbEntry.enrichment.googleRating} ({selectedDbEntry.enrichment.googleReviews || 0})</span></div>}
                        {selectedDbEntry.enrichment.yelpRating && <div className="intel-item"><span className="intel-label">Yelp Rating</span><span className="intel-value">⭐ {selectedDbEntry.enrichment.yelpRating}</span></div>}
                        {selectedDbEntry.enrichment.decisionMaker && <div className="intel-item"><span className="intel-label">Decision Maker</span><span className="intel-value">{selectedDbEntry.enrichment.decisionMaker}</span></div>}
                      </div>
                      {selectedDbEntry.enrichment.notes && (
                        <div className="intel-notes">
                          <span className="intel-label">Research Notes</span>
                          <p>{selectedDbEntry.enrichment.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="business-section">
                    <h4>Record Info</h4>
                    <div className="db-meta">
                      <span>Added: {new Date(selectedDbEntry.createdAt).toLocaleString()}</span>
                      <span>Updated: {new Date(selectedDbEntry.updatedAt).toLocaleString()}</span>
                      <span>Source: {selectedDbEntry.source === 'osm' ? 'OpenStreetMap' : 'Manual'}</span>
                    </div>
                  </div>
                </div>

                <div className="business-modal-footer">
                  <button className="btn btn-outline-danger" onClick={() => { deleteFromBusinessDb(selectedDbEntry.id); setSelectedDbEntry(null); }}>
                    <Trash2 size={14} /> Delete
                  </button>
                  <button className="btn btn-primary" onClick={() => {
                    const saved = leads.some((l) => l.businessName.toLowerCase() === selectedDbEntry.name.toLowerCase());
                    if (!saved) {
                      addLead({
                        businessName: selectedDbEntry.name,
                        address: selectedDbEntry.address,
                        phone: selectedDbEntry.phone,
                        website: selectedDbEntry.website,
                        type: selectedDbEntry.type,
                        source: 'database',
                        coordinates: selectedDbEntry.coordinates,
                        enrichment: selectedDbEntry.enrichment,
                      });
                      setToastMsg('Added to leads pipeline!');
                      setTimeout(() => setToastMsg(''), 3000);
                    }
                    setSelectedDbEntry(null);
                  }}>
                    <Plus size={14} /> Add to Pipeline
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
      <>
      {/* Search Section */}
      <div className="leads-search-card">
        <h3><Search size={18} /> Business Search</h3>
        <div className="leads-search-row">
          <input
            type="text"
            placeholder="Enter address (e.g. 123 Main St, City)"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="leads-search-input"
          />
          <select value={searchRadius} onChange={(e) => setSearchRadius(Number(e.target.value))} className="leads-select">
            <option value={500}>0.5 km</option>
            <option value={1000}>1 km</option>
            <option value={2000}>2 km</option>
            <option value={5000}>5 km</option>
          </select>
          <select value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)} className="leads-select">
            {BUSINESS_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="leads-search-actions">
          <button className="btn btn-primary" onClick={handleSearch} disabled={searching}>
            {searching ? <><span className="leads-spinner" /> Searching...</> : <><Search size={14} /> Search</>}
          </button>
          <button className="btn btn-outline" onClick={handleGoogleMaps}>
            <ExternalLink size={14} /> Search on Google Maps
          </button>
        </div>
        {searchError && <p className="leads-error">{searchError}</p>}

        {searchCenter && (
          <div className="leads-map-section">
            <div className="leads-map-header">
              <MapPin size={16} />
              <span>Search Area: {searchCenter.name?.split(',').slice(0, 3).join(',')}</span>
              <span className="leads-map-radius">Radius: {searchRadius >= 1000 ? `${searchRadius / 1000} km` : `${searchRadius} m`}</span>
            </div>
            <div className="leads-map-container">
              <iframe
                title="Search Location Map"
                width="100%"
                height="300"
                frameBorder="0"
                scrolling="no"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${searchCenter.lon - 0.02},${searchCenter.lat - 0.015},${searchCenter.lon + 0.02},${searchCenter.lat + 0.015}&layer=mapnik&marker=${searchCenter.lat},${searchCenter.lon}`}
              />
              <div className="leads-map-links">
                <a href={`https://www.openstreetmap.org/?mlat=${searchCenter.lat}&mlon=${searchCenter.lon}#map=15/${searchCenter.lat}/${searchCenter.lon}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={12} /> View larger map
                </a>
                <a href={`https://www.google.com/maps/search/?api=1&query=${searchCenter.lat},${searchCenter.lon}`} target="_blank" rel="noopener noreferrer">
                  <Globe size={12} /> Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="leads-results-list">
            <p className="leads-results-count">{searchResults.length} businesses found</p>
            {searchResults.map((r) => {
              const saved = isAlreadySaved(r.name, r.address);
              return (
                <div key={r.id} className="leads-result-item">
                  <div className="leads-result-info">
                    <strong>{r.name}</strong>
                    <span className="leads-type-badge">{r.type}</span>
                    {r.address && <span className="leads-result-addr"><MapPin size={12} /> {r.address}</span>}
                    {r.phone && <span className="leads-result-phone"><Phone size={12} /> {r.phone}</span>}
                  </div>
                  <div className="leads-result-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => handleViewDetails(r)}>
                      <Eye size={14} /> Details
                    </button>
                    <button
                      className={`btn btn-sm ${saved ? 'leads-result-saved' : 'btn-primary'}`}
                      onClick={() => handleSaveResult(r)}
                      disabled={saved}
                    >
                      {saved ? <><CheckCircle size={14} /> Saved</> : <><Plus size={14} /> Save</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Add */}
      <div className="leads-add-section">
        <button className="btn btn-outline" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={14} /> {showAddForm ? 'Cancel' : 'Add Lead Manually'}
        </button>
        {showAddForm && (
          <form className="leads-add-form" onSubmit={handleManualAdd}>
            <div className="leads-form-row">
              <div className="leads-form-group">
                <label>Business Name *</label>
                <input type="text" value={manualForm.businessName} onChange={(e) => setManualForm((p) => ({ ...p, businessName: e.target.value }))} required />
              </div>
              <div className="leads-form-group">
                <label>Type</label>
                <input type="text" value={manualForm.type} onChange={(e) => setManualForm((p) => ({ ...p, type: e.target.value }))} placeholder="e.g. Restaurant, Retail" />
              </div>
            </div>
            <div className="leads-form-row">
              <div className="leads-form-group">
                <label>Address</label>
                <input type="text" value={manualForm.address} onChange={(e) => setManualForm((p) => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="leads-form-group">
                <label>Phone</label>
                <input type="text" value={manualForm.phone} onChange={(e) => setManualForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div className="leads-form-row">
              <div className="leads-form-group">
                <label>Email</label>
                <input type="email" value={manualForm.email} onChange={(e) => setManualForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="leads-form-group">
                <label>Website</label>
                <input type="text" value={manualForm.website} onChange={(e) => setManualForm((p) => ({ ...p, website: e.target.value }))} />
              </div>
            </div>
            <div className="leads-form-group full-width">
              <label>Initial Notes</label>
              <textarea value={manualForm.notes} onChange={(e) => setManualForm((p) => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
            <div className="leads-form-actions">
              <button type="submit" className="btn btn-primary"><Plus size={14} /> Add Lead</button>
            </div>
          </form>
        )}
      </div>

      {/* Saved Leads */}
      <div className="leads-list-section">
        <div className="leads-list-header">
          <h3><Building2 size={18} /> Saved Leads ({filteredLeads.length})</h3>
          <div className="leads-filter-bar">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="leads-select">
              <option value="all">All Statuses</option>
              {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="leads-select">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="updated">Recently Updated</option>
              <option value="name-az">Name A-Z</option>
              <option value="name-za">Name Z-A</option>
            </select>
            <input
              type="text"
              placeholder="Search by name..."
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className="leads-name-search"
            />
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="empty-state"><Building2 size={48} /><p>No leads found</p></div>
        ) : (
          <div className="leads-cards">
            {filteredLeads.map((lead) => {
              const isSelected = sel?.id === lead.id;
              const statusInfo = LEAD_STATUSES.find((s) => s.value === lead.status) || LEAD_STATUSES[0];
              return (
                <div key={lead.id} className={`leads-card ${isSelected ? 'leads-card-selected' : ''}`}>
                  <div className="leads-card-header" onClick={() => setSelectedLead(isSelected ? null : lead)}>
                    <div className="leads-card-title">
                      <span className="leads-status-dot" style={{ background: statusInfo.color }} />
                      <strong>{lead.businessName}</strong>
                      {lead.type && <span className="leads-type-badge">{lead.type}</span>}
                      {lead.source === 'osm' && <span className="leads-source-badge"><Globe size={10} /> OSM</span>}
                    </div>
                    <select
                      value={lead.status}
                      onChange={(e) => { e.stopPropagation(); handleLeadStatusChange(lead, e.target.value); }}
                      className="leads-status-select"
                      onClick={(e) => e.stopPropagation()}
                      style={{ borderColor: statusInfo.color }}
                    >
                      {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>

                  <div className="leads-card-meta">
                    {lead.address && <span><MapPin size={12} /> {lead.address}</span>}
                    {lead.phone && <span><Phone size={12} /> {lead.phone}</span>}
                    {lead.email && <span><Mail size={12} /> {lead.email}</span>}
                    {lead.website && <span><Globe size={12} /> {lead.website}</span>}
                  </div>

                  {/* Action buttons based on status */}
                  {(lead.status === 'contacted' || lead.status === 'followup') && (
                    <div className="leads-action-buttons">
                      {sendToFollowUpConfirm === lead.id ? (
                        <div className="leads-confirm-action">
                          <span>Send to Follow-Ups?</span>
                          <button className="btn btn-sm btn-primary" onClick={() => handleSendToFollowUp(lead)}><CheckCircle size={14} /> Yes</button>
                          <button className="btn btn-sm btn-outline" onClick={() => setSendToFollowUpConfirm(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button className="btn btn-sm btn-followup" onClick={() => setSendToFollowUpConfirm(lead.id)}>
                          <PhoneForwarded size={14} /> Send to Follow-Ups
                        </button>
                      )}
                    </div>
                  )}

                  {(lead.status === 'interested' || lead.status === 'converted') && (
                    <div className="leads-action-buttons">
                      {sendToPipelineConfirm === lead.id ? (
                        <div className="leads-confirm-action">
                          <span>Send to Pipeline?</span>
                          <button className="btn btn-sm btn-primary" onClick={() => handleSendToPipeline(lead)}><CheckCircle size={14} /> Yes</button>
                          <button className="btn btn-sm btn-outline" onClick={() => setSendToPipelineConfirm(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button className="btn btn-sm btn-pipeline" onClick={() => setSendToPipelineConfirm(lead.id)}>
                          <Briefcase size={14} /> Send to Pipeline
                        </button>
                      )}
                    </div>
                  )}

                  <div className="leads-card-footer">
                    <span className="leads-card-date">{new Date(lead.createdAt).toLocaleDateString()}</span>
                    <span className="leads-card-notes-count"><MessageSquare size={12} /> {lead.notes.length} notes</span>
                    {deleteConfirm === lead.id ? (
                      <div className="leads-delete-confirm">
                        <span>Delete?</span>
                        <button className="btn btn-sm btn-delete" onClick={() => handleDelete(lead.id)}>Yes</button>
                        <button className="btn btn-sm btn-outline" onClick={() => setDeleteConfirm(null)}>No</button>
                      </div>
                    ) : (
                      <button className="btn btn-sm btn-ghost" onClick={() => setDeleteConfirm(lead.id)}><Trash2 size={13} /></button>
                    )}
                  </div>

                  {isSelected && (
                    <div className="leads-detail">
                      <div className="leads-notes-section">
                        <h4><PhoneCall size={14} /> Call Log / Notes</h4>
                        <div className="leads-note-input">
                          <input
                            type="text"
                            placeholder="Point of contact, phone number, needs, or other relevant info..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddNote(lead.id)}
                          />
                          <button className="btn btn-sm btn-primary" onClick={() => handleAddNote(lead.id)}><Plus size={14} /> Add</button>
                        </div>
                        {lead.notes.length > 0 ? (
                          <div className="leads-notes-list">
                            {[...lead.notes].reverse().map((note) => (
                              <div key={note.id} className="leads-note-item">
                                <div className="leads-note-header">
                                  <strong>{note.author}</strong>
                                  <span>{new Date(note.createdAt).toLocaleString()}</span>
                                  <button className="leads-note-delete" onClick={() => deleteLeadNote(lead.id, note.id)}><X size={12} /></button>
                                </div>
                                <p>{note.text}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="leads-no-notes">No notes yet</p>
                        )}
                      </div>
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

/* ===== ARCHIVED TAB ===== */
function ArchivedTab() {
  const { appointments, updateFollowUp, deleteAppointment, currentUser } = useAppContext();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const archivedItems = appointments.filter((a) => a.followUp && a.followUp.status === 'archived');

  const handleUnarchive = (apptId) => {
    updateFollowUp(apptId, { status: 'pending' });
  };

  return (
    <div className="archived-tab">
      <div className="archived-header">
        <h3><FolderKanban size={20} /> Follow-ups Archived</h3>
        <span className="archived-count">{archivedItems.length} item{archivedItems.length !== 1 ? 's' : ''}</span>
      </div>

      {archivedItems.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={48} />
          <p>No archived items</p>
        </div>
      ) : (
        <div className="archived-list">
          {archivedItems.map((appt) => (
            <div key={appt.id} className="archived-card">
              <div className="archived-card-header">
                <strong>{appt.name}</strong>
                <span className="archived-date">Archived</span>
              </div>
              <div className="archived-card-meta">
                <span><Mail size={12} /> {appt.email}</span>
                {appt.phone && <span><Phone size={12} /> {appt.phone}</span>}
                {appt.service && <span>Service: {appt.service.replace('-', ' ')}</span>}
              </div>
              {appt.followUp?.note && (
                <div className="archived-card-note">
                  <p>{appt.followUp.note}</p>
                </div>
              )}
              <div className="archived-card-actions">
                <button className="btn btn-sm btn-primary" onClick={() => handleUnarchive(appt.id)}>
                  <FolderKanban size={14} /> Restore
                </button>
                {canDelete && (
                  deleteConfirm === appt.id ? (
                    <div className="archived-delete-confirm">
                      <span>Delete permanently?</span>
                      <button className="btn btn-sm btn-danger" onClick={() => { deleteAppointment(appt.id); setDeleteConfirm(null); }}>
                        <Trash2 size={14} /> Yes
                      </button>
                      <button className="btn btn-sm btn-outline" onClick={() => setDeleteConfirm(null)}>No</button>
                    </div>
                  ) : (
                    <button className="btn btn-sm btn-danger-outline" onClick={() => setDeleteConfirm(appt.id)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== RESEARCH TAB ===== */
const RACE_COLORS = {
  white: '#3b82f6',
  black: '#10b981',
  asian: '#f59e0b',
  hispanic: '#ef4444',
  native: '#8b5cf6',
  pacific: '#06b6d4',
  other: '#6b7280',
  multiracial: '#ec4899',
};

const AGE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const RESEARCH_CATEGORIES = [
  { id: 'demographics', label: 'Demographics', icon: 'Users' },
  { id: 'schools', label: 'Schools', icon: 'GraduationCap' },
  { id: 'businesses', label: 'Businesses', icon: 'Building2' },
  { id: 'healthcare', label: 'Healthcare', icon: 'Activity' },
  { id: 'dining', label: 'Dining', icon: 'Coffee' },
  { id: 'services', label: 'Services', icon: 'Briefcase' },
  { id: 'recreation', label: 'Recreation', icon: 'Trees' },
  { id: 'government', label: 'Government', icon: 'Landmark' },
];

const BUSINESS_TYPES = {
  retail: { label: 'Retail/Shops', query: 'shop', color: '#3b82f6' },
  office: { label: 'Offices', query: 'office', color: '#10b981' },
  restaurant: { label: 'Restaurants', query: 'amenity~"restaurant|fast_food"', color: '#f59e0b' },
  cafe: { label: 'Cafes/Coffee', query: 'amenity~"cafe|coffee"', color: '#8b5cf6' },
  bank: { label: 'Banks', query: 'amenity=bank', color: '#06b6d4' },
  hotel: { label: 'Hotels', query: 'tourism~"hotel|motel"', color: '#ec4899' },
  salon: { label: 'Salons/Spas', query: 'shop~"hairdresser|beauty|spa"', color: '#f43f5e' },
  gym: { label: 'Gyms/Fitness', query: 'leisure~"fitness_centre|sports_centre"', color: '#84cc16' },
  auto: { label: 'Auto Services', query: 'shop~"car|car_repair|tyres"', color: '#64748b' },
};

const SCHOOL_TYPES = {
  elementary: { label: 'Elementary', query: 'amenity=school', color: '#3b82f6' },
  secondary: { label: 'High School', query: 'amenity=school', color: '#10b981' },
  university: { label: 'College/University', query: 'amenity~"university|college"', color: '#8b5cf6' },
  kindergarten: { label: 'Preschool/Daycare', query: 'amenity~"kindergarten|childcare"', color: '#f59e0b' },
  library: { label: 'Libraries', query: 'amenity=library', color: '#06b6d4' },
};

const HEALTHCARE_TYPES = {
  hospital: { label: 'Hospitals', query: 'amenity=hospital', color: '#ef4444' },
  clinic: { label: 'Clinics', query: 'amenity~"clinic|doctors"', color: '#3b82f6' },
  pharmacy: { label: 'Pharmacies', query: 'amenity=pharmacy', color: '#10b981' },
  dentist: { label: 'Dentists', query: 'amenity=dentist', color: '#8b5cf6' },
  veterinary: { label: 'Veterinary', query: 'amenity=veterinary', color: '#f59e0b' },
};

function ResearchTab() {
  const { marketResearch, saveResearch, updateResearch, deleteResearch, currentUser } = useAppContext();

  const [searchLocation, setSearchLocation] = useState('');
  const [searchRadius, setSearchRadius] = useState(5000);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [currentData, setCurrentData] = useState(null);
  const [selectedResearch, setSelectedResearch] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewMode, setViewMode] = useState('search');
  const [activeCategory, setActiveCategory] = useState('demographics');
  const [categoryData, setCategoryData] = useState({});
  const [loadingCategory, setLoadingCategory] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Search for demographics by location
  const handleSearch = async () => {
    if (!searchLocation.trim()) return;
    setSearching(true);
    setSearchError('');
    setCurrentData(null);
    setCategoryData({});

    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchLocation)}&format=json&limit=1&addressdetails=1`,
        { headers: { 'User-Agent': 'ThreeSeasDigital/1.0' } }
      );
      const geoData = await geoRes.json();

      if (!geoData.length) {
        setSearchError('Location not found. Try a city name, zip code, or address.');
        setSearching(false);
        return;
      }

      const geo = geoData[0];
      const lat = parseFloat(geo.lat);
      const lon = parseFloat(geo.lon);
      const address = geo.address || {};
      const state = address.state || address.county || '';
      const city = address.city || address.town || address.village || address.county || '';
      const zip = address.postcode || '';

      let censusData = null;
      if (address.country_code === 'us' && state) {
        try {
          const stateRes = await fetch('https://api.census.gov/data/2021/acs/acs5?get=NAME&for=state:*');
          const stateList = await stateRes.json();
          const stateRow = stateList.find((row) => row[0]?.toLowerCase().includes(state.toLowerCase()));
          const stateFips = stateRow ? stateRow[1] : null;

          if (stateFips) {
            const censusUrl = `https://api.census.gov/data/2021/acs/acs5?get=NAME,B01003_001E,B01002_001E,B19013_001E,B25077_001E,B15003_022E,B15003_023E,B15003_024E,B15003_025E,B02001_002E,B02001_003E,B02001_004E,B02001_005E,B02001_006E,B02001_007E,B02001_008E,B03003_003E,B01001_003E,B01001_004E,B01001_005E,B01001_006E,B01001_007E,B01001_020E,B01001_021E,B01001_022E,B01001_023E,B01001_024E,B01001_025E,B25003_002E,B25003_003E&for=state:${stateFips}`;
            const dataRes = await fetch(censusUrl);
            if (dataRes.ok) {
              const data = await dataRes.json();
              if (data.length > 1) {
                const headers = data[0];
                const values = data[1];
                const getVal = (col) => {
                  const idx = headers.indexOf(col);
                  return idx >= 0 ? parseInt(values[idx]) || 0 : 0;
                };

                const totalPop = getVal('B01003_001E');
                const medianAge = getVal('B01002_001E');
                const medianIncome = getVal('B19013_001E');
                const medianHomeValue = getVal('B25077_001E');

                censusData = {
                  totalPopulation: totalPop,
                  medianAge,
                  medianIncome,
                  medianHomeValue,
                  race: {
                    white: getVal('B02001_002E'),
                    black: getVal('B02001_003E'),
                    native: getVal('B02001_004E'),
                    asian: getVal('B02001_005E'),
                    pacific: getVal('B02001_006E'),
                    other: getVal('B02001_007E'),
                    multiracial: getVal('B02001_008E'),
                    hispanic: getVal('B03003_003E'),
                  },
                  education: {
                    bachelors: getVal('B15003_022E'),
                    masters: getVal('B15003_023E'),
                    professional: getVal('B15003_024E'),
                    doctorate: getVal('B15003_025E'),
                    highEducation: getVal('B15003_022E') + getVal('B15003_023E') + getVal('B15003_024E') + getVal('B15003_025E'),
                  },
                  housing: {
                    ownerOccupied: getVal('B25003_002E'),
                    renterOccupied: getVal('B25003_003E'),
                  },
                  ageGroups: {
                    under18: getVal('B01001_003E') * 2 + getVal('B01001_004E') * 2 + getVal('B01001_005E') * 2 + getVal('B01001_006E') * 2,
                    age18to24: (getVal('B01001_007E') + getVal('B01001_020E')) * 1.5,
                    age25to34: (getVal('B01001_021E') + getVal('B01001_022E')) * 2,
                    age35to64: totalPop * 0.4,
                    age65plus: (getVal('B01001_023E') + getVal('B01001_024E') + getVal('B01001_025E')) * 2,
                  },
                };
              }
            }
          }
        } catch (censusErr) {
          console.log('Census API unavailable');
        }
      }

      if (!censusData) {
        censusData = { note: 'Census data unavailable for this location.' };
      }

      const result = {
        location: `${city}${state ? `, ${state}` : ''}${zip ? ` ${zip}` : ''}`,
        searchQuery: searchLocation,
        coordinates: { lat, lon },
        address,
        demographics: censusData,
      };

      setCurrentData(result);
      // Auto-load all category data in parallel
      loadCategoryData('schools', lat, lon);
      loadCategoryData('businesses', lat, lon);
      loadCategoryData('healthcare', lat, lon);
      loadCategoryData('dining', lat, lon);
      loadCategoryData('services', lat, lon);
      loadCategoryData('recreation', lat, lon);
      loadCategoryData('government', lat, lon);
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Search failed. Please try again.');
    }
    setSearching(false);
  };

  // Load category-specific data from Overpass API
  const loadCategoryData = async (category, lat, lon) => {
    if (categoryData[category]) return; // Already loaded
    setLoadingCategory(category);

    try {
      let query = '';
      const radius = searchRadius;

      if (category === 'schools') {
        query = `[out:json][timeout:25];(
          node["amenity"="school"](around:${radius},${lat},${lon});
          node["amenity"="university"](around:${radius},${lat},${lon});
          node["amenity"="college"](around:${radius},${lat},${lon});
          node["amenity"="kindergarten"](around:${radius},${lat},${lon});
          node["amenity"="childcare"](around:${radius},${lat},${lon});
          node["amenity"="library"](around:${radius},${lat},${lon});
          node["amenity"="language_school"](around:${radius},${lat},${lon});
          node["amenity"="music_school"](around:${radius},${lat},${lon});
          node["amenity"="driving_school"](around:${radius},${lat},${lon});
          node["amenity"="training"](around:${radius},${lat},${lon});
          way["amenity"="school"](around:${radius},${lat},${lon});
          way["amenity"="university"](around:${radius},${lat},${lon});
          way["amenity"="college"](around:${radius},${lat},${lon});
        );out center;`;
      } else if (category === 'businesses') {
        query = `[out:json][timeout:25];(
          node["shop"](around:${radius},${lat},${lon});
          node["office"](around:${radius},${lat},${lon});
          node["craft"](around:${radius},${lat},${lon});
          node["industrial"](around:${radius},${lat},${lon});
          way["shop"](around:${radius},${lat},${lon});
          way["office"](around:${radius},${lat},${lon});
          way["craft"](around:${radius},${lat},${lon});
          way["landuse"="commercial"](around:${radius},${lat},${lon});
          way["landuse"="industrial"](around:${radius},${lat},${lon});
        );out center;`;
      } else if (category === 'healthcare') {
        query = `[out:json][timeout:25];(
          node["amenity"="hospital"](around:${radius},${lat},${lon});
          node["amenity"="clinic"](around:${radius},${lat},${lon});
          node["amenity"="doctors"](around:${radius},${lat},${lon});
          node["amenity"="pharmacy"](around:${radius},${lat},${lon});
          node["amenity"="dentist"](around:${radius},${lat},${lon});
          node["amenity"="veterinary"](around:${radius},${lat},${lon});
          node["amenity"="nursing_home"](around:${radius},${lat},${lon});
          node["amenity"="social_facility"](around:${radius},${lat},${lon});
          node["healthcare"](around:${radius},${lat},${lon});
          node["shop"="optician"](around:${radius},${lat},${lon});
          node["shop"="hearing_aids"](around:${radius},${lat},${lon});
          node["shop"="medical_supply"](around:${radius},${lat},${lon});
          way["amenity"="hospital"](around:${radius},${lat},${lon});
          way["amenity"="clinic"](around:${radius},${lat},${lon});
          way["amenity"="nursing_home"](around:${radius},${lat},${lon});
        );out center;`;
      } else if (category === 'dining') {
        query = `[out:json][timeout:25];(
          node["amenity"="restaurant"](around:${radius},${lat},${lon});
          node["amenity"="fast_food"](around:${radius},${lat},${lon});
          node["amenity"="cafe"](around:${radius},${lat},${lon});
          node["amenity"="bar"](around:${radius},${lat},${lon});
          node["amenity"="pub"](around:${radius},${lat},${lon});
          node["amenity"="food_court"](around:${radius},${lat},${lon});
          node["amenity"="ice_cream"](around:${radius},${lat},${lon});
          node["amenity"="biergarten"](around:${radius},${lat},${lon});
          node["shop"="bakery"](around:${radius},${lat},${lon});
          node["shop"="butcher"](around:${radius},${lat},${lon});
          node["shop"="deli"](around:${radius},${lat},${lon});
          node["shop"="coffee"](around:${radius},${lat},${lon});
          node["shop"="confectionery"](around:${radius},${lat},${lon});
          node["cuisine"](around:${radius},${lat},${lon});
        );out center;`;
      } else if (category === 'services') {
        query = `[out:json][timeout:25];(
          node["amenity"="bank"](around:${radius},${lat},${lon});
          node["amenity"="atm"](around:${radius},${lat},${lon});
          node["amenity"="post_office"](around:${radius},${lat},${lon});
          node["amenity"="fuel"](around:${radius},${lat},${lon});
          node["amenity"="car_wash"](around:${radius},${lat},${lon});
          node["amenity"="car_rental"](around:${radius},${lat},${lon});
          node["shop"="hairdresser"](around:${radius},${lat},${lon});
          node["shop"="beauty"](around:${radius},${lat},${lon});
          node["shop"="massage"](around:${radius},${lat},${lon});
          node["shop"="tattoo"](around:${radius},${lat},${lon});
          node["shop"="dry_cleaning"](around:${radius},${lat},${lon});
          node["shop"="laundry"](around:${radius},${lat},${lon});
          node["shop"="car_repair"](around:${radius},${lat},${lon});
          node["shop"="car_parts"](around:${radius},${lat},${lon});
          node["shop"="tyres"](around:${radius},${lat},${lon});
          node["shop"="copyshop"](around:${radius},${lat},${lon});
          node["shop"="travel_agency"](around:${radius},${lat},${lon});
          node["shop"="insurance"](around:${radius},${lat},${lon});
          node["shop"="electronics_repair"](around:${radius},${lat},${lon});
          node["shop"="mobile_phone"](around:${radius},${lat},${lon});
          node["leisure"="fitness_centre"](around:${radius},${lat},${lon});
          node["leisure"="sports_centre"](around:${radius},${lat},${lon});
          node["leisure"="swimming_pool"](around:${radius},${lat},${lon});
          node["tourism"="hotel"](around:${radius},${lat},${lon});
          node["tourism"="motel"](around:${radius},${lat},${lon});
          node["tourism"="guest_house"](around:${radius},${lat},${lon});
          node["office"="lawyer"](around:${radius},${lat},${lon});
          node["office"="accountant"](around:${radius},${lat},${lon});
          node["office"="insurance"](around:${radius},${lat},${lon});
          node["office"="estate_agent"](around:${radius},${lat},${lon});
          node["office"="notary"](around:${radius},${lat},${lon});
          node["office"="tax_advisor"](around:${radius},${lat},${lon});
        );out center;`;
      } else if (category === 'recreation') {
        query = `[out:json][timeout:25];(
          node["leisure"="park"](around:${radius},${lat},${lon});
          node["leisure"="playground"](around:${radius},${lat},${lon});
          node["leisure"="garden"](around:${radius},${lat},${lon});
          node["leisure"="golf_course"](around:${radius},${lat},${lon});
          node["leisure"="stadium"](around:${radius},${lat},${lon});
          node["leisure"="pitch"](around:${radius},${lat},${lon});
          node["leisure"="nature_reserve"](around:${radius},${lat},${lon});
          node["leisure"="dog_park"](around:${radius},${lat},${lon});
          node["leisure"="beach_resort"](around:${radius},${lat},${lon});
          node["leisure"="marina"](around:${radius},${lat},${lon});
          node["amenity"="theatre"](around:${radius},${lat},${lon});
          node["amenity"="cinema"](around:${radius},${lat},${lon});
          node["amenity"="arts_centre"](around:${radius},${lat},${lon});
          node["amenity"="community_centre"](around:${radius},${lat},${lon});
          node["amenity"="nightclub"](around:${radius},${lat},${lon});
          node["amenity"="casino"](around:${radius},${lat},${lon});
          node["tourism"="museum"](around:${radius},${lat},${lon});
          node["tourism"="gallery"](around:${radius},${lat},${lon});
          node["tourism"="zoo"](around:${radius},${lat},${lon});
          node["tourism"="aquarium"](around:${radius},${lat},${lon});
          node["tourism"="theme_park"](around:${radius},${lat},${lon});
          node["tourism"="attraction"](around:${radius},${lat},${lon});
          node["sport"](around:${radius},${lat},${lon});
          way["leisure"="park"](around:${radius},${lat},${lon});
          way["leisure"="golf_course"](around:${radius},${lat},${lon});
          way["leisure"="stadium"](around:${radius},${lat},${lon});
          way["leisure"="nature_reserve"](around:${radius},${lat},${lon});
        );out center;`;
      } else if (category === 'government') {
        query = `[out:json][timeout:25];(
          node["amenity"="townhall"](around:${radius},${lat},${lon});
          node["amenity"="courthouse"](around:${radius},${lat},${lon});
          node["amenity"="police"](around:${radius},${lat},${lon});
          node["amenity"="fire_station"](around:${radius},${lat},${lon});
          node["amenity"="prison"](around:${radius},${lat},${lon});
          node["amenity"="post_office"](around:${radius},${lat},${lon});
          node["amenity"="social_facility"](around:${radius},${lat},${lon});
          node["amenity"="place_of_worship"](around:${radius},${lat},${lon});
          node["amenity"="grave_yard"](around:${radius},${lat},${lon});
          node["office"="government"](around:${radius},${lat},${lon});
          node["office"="diplomatic"](around:${radius},${lat},${lon});
          node["office"="ngo"](around:${radius},${lat},${lon});
          node["office"="political_party"](around:${radius},${lat},${lon});
          node["building"="government"](around:${radius},${lat},${lon});
          node["building"="public"](around:${radius},${lat},${lon});
          node["government"](around:${radius},${lat},${lon});
          way["amenity"="townhall"](around:${radius},${lat},${lon});
          way["amenity"="courthouse"](around:${radius},${lat},${lon});
          way["amenity"="police"](around:${radius},${lat},${lon});
          way["amenity"="fire_station"](around:${radius},${lat},${lon});
          way["amenity"="place_of_worship"](around:${radius},${lat},${lon});
        );out center;`;
      }

      if (query) {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
        });
        const data = await res.json();

        const items = (data.elements || []).map((el) => {
          const tags = el.tags || {};
          return {
            id: el.id,
            name: tags.name || 'Unnamed',
            type: getItemType(tags, category),
            address: tags['addr:street'] ? `${tags['addr:housenumber'] || ''} ${tags['addr:street']}`.trim() : '',
            phone: tags.phone || tags['contact:phone'] || '',
            website: tags.website || tags['contact:website'] || '',
            lat: el.lat || el.center?.lat,
            lon: el.lon || el.center?.lon,
            tags,
          };
        }).filter((item) => item.name !== 'Unnamed' || item.address);

        setCategoryData((prev) => ({ ...prev, [category]: items }));
      }
    } catch (err) {
      console.error(`Error loading ${category}:`, err);
      setCategoryData((prev) => ({ ...prev, [category]: [] }));
    }
    setLoadingCategory(null);
  };

  const getItemType = (tags, category) => {
    if (category === 'schools') {
      if (tags.amenity === 'university' || tags.amenity === 'college') return 'university';
      if (tags.amenity === 'kindergarten' || tags.amenity === 'childcare') return 'childcare';
      if (tags.amenity === 'library') return 'library';
      if (tags.amenity === 'language_school') return 'language_school';
      if (tags.amenity === 'music_school') return 'music_school';
      if (tags.amenity === 'driving_school') return 'driving_school';
      if (tags.amenity === 'training') return 'training';
      return 'school';
    }
    if (category === 'healthcare') {
      if (tags.healthcare) return tags.healthcare;
      if (tags.amenity === 'nursing_home') return 'nursing_home';
      if (tags.amenity === 'social_facility') return 'social_facility';
      if (tags.shop === 'optician') return 'optician';
      if (tags.shop === 'hearing_aids') return 'hearing_aids';
      if (tags.shop === 'medical_supply') return 'medical_supply';
      return tags.amenity || 'clinic';
    }
    if (category === 'dining') {
      if (tags.shop === 'bakery') return 'bakery';
      if (tags.shop === 'butcher') return 'butcher';
      if (tags.shop === 'deli') return 'deli';
      if (tags.shop === 'coffee') return 'coffee';
      if (tags.shop === 'confectionery') return 'confectionery';
      if (tags.amenity === 'ice_cream') return 'ice_cream';
      if (tags.amenity === 'food_court') return 'food_court';
      if (tags.amenity === 'biergarten') return 'biergarten';
      return tags.amenity || 'restaurant';
    }
    if (category === 'services') {
      // Professional services
      if (tags.office === 'lawyer') return 'lawyer';
      if (tags.office === 'accountant') return 'accountant';
      if (tags.office === 'insurance') return 'insurance';
      if (tags.office === 'estate_agent') return 'real_estate';
      if (tags.office === 'notary') return 'notary';
      if (tags.office === 'tax_advisor') return 'tax_advisor';
      // Financial
      if (tags.amenity === 'bank') return 'bank';
      if (tags.amenity === 'atm') return 'atm';
      // Personal care
      if (tags.shop === 'hairdresser') return 'hairdresser';
      if (tags.shop === 'beauty') return 'beauty';
      if (tags.shop === 'massage') return 'massage';
      if (tags.shop === 'tattoo') return 'tattoo';
      // Laundry/cleaning
      if (tags.shop === 'dry_cleaning') return 'dry_cleaning';
      if (tags.shop === 'laundry') return 'laundry';
      // Auto
      if (tags.shop === 'car_repair') return 'car_repair';
      if (tags.shop === 'car_parts') return 'car_parts';
      if (tags.shop === 'tyres') return 'tyres';
      if (tags.amenity === 'fuel') return 'gas_station';
      if (tags.amenity === 'car_wash') return 'car_wash';
      if (tags.amenity === 'car_rental') return 'car_rental';
      // Other services
      if (tags.amenity === 'post_office') return 'post_office';
      if (tags.shop === 'copyshop') return 'print_shop';
      if (tags.shop === 'travel_agency') return 'travel_agency';
      if (tags.shop === 'insurance') return 'insurance';
      if (tags.shop === 'electronics_repair') return 'electronics_repair';
      if (tags.shop === 'mobile_phone') return 'mobile_phone';
      // Fitness
      if (tags.leisure === 'fitness_centre') return 'gym';
      if (tags.leisure === 'sports_centre') return 'sports_center';
      if (tags.leisure === 'swimming_pool') return 'swimming_pool';
      // Lodging
      if (tags.tourism === 'hotel') return 'hotel';
      if (tags.tourism === 'motel') return 'motel';
      if (tags.tourism === 'guest_house') return 'guest_house';
      return tags.amenity || tags.shop || tags.leisure || tags.tourism || tags.office || 'service';
    }
    if (category === 'recreation') {
      // Parks & nature
      if (tags.leisure === 'park') return 'park';
      if (tags.leisure === 'playground') return 'playground';
      if (tags.leisure === 'garden') return 'garden';
      if (tags.leisure === 'nature_reserve') return 'nature_reserve';
      if (tags.leisure === 'dog_park') return 'dog_park';
      if (tags.leisure === 'beach_resort') return 'beach';
      if (tags.leisure === 'marina') return 'marina';
      // Sports
      if (tags.leisure === 'golf_course') return 'golf';
      if (tags.leisure === 'stadium') return 'stadium';
      if (tags.leisure === 'pitch') return 'sports_field';
      if (tags.sport) return tags.sport;
      // Entertainment
      if (tags.amenity === 'theatre') return 'theatre';
      if (tags.amenity === 'cinema') return 'cinema';
      if (tags.amenity === 'arts_centre') return 'arts_center';
      if (tags.amenity === 'community_centre') return 'community_center';
      if (tags.amenity === 'nightclub') return 'nightclub';
      if (tags.amenity === 'casino') return 'casino';
      // Tourism attractions
      if (tags.tourism === 'museum') return 'museum';
      if (tags.tourism === 'gallery') return 'gallery';
      if (tags.tourism === 'zoo') return 'zoo';
      if (tags.tourism === 'aquarium') return 'aquarium';
      if (tags.tourism === 'theme_park') return 'theme_park';
      if (tags.tourism === 'attraction') return 'attraction';
      return tags.leisure || tags.tourism || 'recreation';
    }
    if (category === 'government') {
      // Government buildings
      if (tags.amenity === 'townhall') return 'city_hall';
      if (tags.amenity === 'courthouse') return 'courthouse';
      if (tags.amenity === 'police') return 'police';
      if (tags.amenity === 'fire_station') return 'fire_station';
      if (tags.amenity === 'prison') return 'prison';
      if (tags.amenity === 'post_office') return 'post_office';
      // Social services
      if (tags.amenity === 'social_facility') return 'social_services';
      // Religious
      if (tags.amenity === 'place_of_worship') return tags.religion || 'place_of_worship';
      if (tags.amenity === 'grave_yard') return 'cemetery';
      // Offices
      if (tags.office === 'government') return 'government_office';
      if (tags.office === 'diplomatic') return 'embassy';
      if (tags.office === 'ngo') return 'nonprofit';
      if (tags.office === 'political_party') return 'political';
      if (tags.government) return tags.government;
      if (tags.building === 'government' || tags.building === 'public') return 'public_building';
      return tags.amenity || tags.office || 'government';
    }
    // Businesses
    if (tags.craft) return tags.craft;
    if (tags.landuse === 'commercial') return 'commercial';
    if (tags.landuse === 'industrial') return 'industrial';
    return tags.shop || tags.office || 'business';
  };

  const getTypeCounts = (items, category) => {
    const counts = {};
    items.forEach((item) => {
      const type = item.type;
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setTypeFilter('all');
    if (currentData && !categoryData[cat] && cat !== 'demographics') {
      loadCategoryData(cat, currentData.coordinates.lat, currentData.coordinates.lon);
    }
  };

  const handleSaveResearch = () => {
    if (!currentData) return;
    const result = saveResearch({ ...currentData, categoryData });
    if (result.success) {
      setToastMsg(result.updated ? 'Research updated!' : 'Research saved!');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const formatNumber = (num) => num?.toLocaleString() || 'N/A';
  const formatCurrency = (num) => num ? `$${num.toLocaleString()}` : 'N/A';
  const formatPercent = (num, total) => total ? `${((num / total) * 100).toFixed(1)}%` : 'N/A';

  const getRaceChartData = (race, total) => {
    if (!race || !total) return [];
    return [
      { name: 'White', value: race.white, color: RACE_COLORS.white },
      { name: 'Black', value: race.black, color: RACE_COLORS.black },
      { name: 'Hispanic', value: race.hispanic, color: RACE_COLORS.hispanic },
      { name: 'Asian', value: race.asian, color: RACE_COLORS.asian },
      { name: 'Other', value: (race.native || 0) + (race.pacific || 0) + (race.other || 0) + (race.multiracial || 0), color: RACE_COLORS.other },
    ].filter((d) => d.value > 0);
  };

  const getAgeChartData = (ageGroups) => {
    if (!ageGroups) return [];
    return [
      { name: 'Under 18', value: ageGroups.under18 },
      { name: '18-24', value: ageGroups.age18to24 },
      { name: '25-34', value: ageGroups.age25to34 },
      { name: '35-64', value: ageGroups.age35to64 },
      { name: '65+', value: ageGroups.age65plus },
    ].filter((d) => d.value > 0);
  };

  const displayData = selectedResearch?.demographics || currentData?.demographics;
  const currentCategoryItems = categoryData[activeCategory] || [];
  const filteredItems = typeFilter === 'all' ? currentCategoryItems : currentCategoryItems.filter((i) => i.type === typeFilter);
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'type') return a.type.localeCompare(b.type);
    return 0;
  });

  const getCategoryIcon = (id) => {
    const icons = { demographics: <Users size={16} />, schools: <GraduationCap size={16} />, businesses: <Building2 size={16} />, healthcare: <Activity size={16} />, dining: <Coffee size={16} />, services: <Briefcase size={16} />, recreation: <Trees size={16} />, government: <Landmark size={16} /> };
    return icons[id] || <Globe size={16} />;
  };

  const Coffee = (props) => <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>;

  return (
    <div className="research-tab">
      {toastMsg && <div className="toast-message">{toastMsg}</div>}

      <div className="research-view-toggle">
        <button className={viewMode === 'search' ? 'active' : ''} onClick={() => { setViewMode('search'); setSelectedResearch(null); }}>
          <Search size={16} /> Search
        </button>
        <button className={viewMode === 'saved' ? 'active' : ''} onClick={() => setViewMode('saved')}>
          <FolderKanban size={16} /> Saved ({marketResearch.length})
        </button>
      </div>

      {viewMode === 'search' && (
        <>
          <div className="research-search-card">
            <h3><Globe size={18} /> Market Research</h3>
            <p className="research-subtitle">Search for demographics, schools, businesses, and more by location</p>
            <div className="research-search-row">
              <input
                type="text"
                placeholder="Enter city, zip code, or address..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="research-input"
              />
              <select value={searchRadius} onChange={(e) => setSearchRadius(parseInt(e.target.value))} className="research-radius-select">
                <option value={1000}>1 km</option>
                <option value={2000}>2 km</option>
                <option value={5000}>5 km</option>
                <option value={10000}>10 km</option>
                <option value={20000}>20 km</option>
              </select>
              <button onClick={handleSearch} disabled={searching || !searchLocation.trim()} className="btn btn-primary">
                {searching ? 'Searching...' : <><Search size={16} /> Search</>}
              </button>
            </div>
            {searchError && <p className="research-error">{searchError}</p>}
          </div>

          {currentData && (
            <div className="research-results">
              <div className="research-header">
                <h3><MapPin size={18} /> {currentData.location}</h3>
                <div className="research-header-actions">
                  <button onClick={handleSaveResearch} className="btn btn-sm btn-primary">
                    <CheckCircle size={14} /> Save Research
                  </button>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="research-category-tabs">
                {RESEARCH_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    className={`research-cat-tab ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(cat.id)}
                  >
                    {getCategoryIcon(cat.id)}
                    <span>{cat.label}</span>
                    {cat.id !== 'demographics' && categoryData[cat.id] && (
                      <span className="research-cat-count">{categoryData[cat.id].length}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Demographics Tab */}
              {activeCategory === 'demographics' && displayData && (
                <>
                  {displayData.note && (
                    <div className="research-note">
                      <AlertCircle size={16} /> {displayData.note}
                    </div>
                  )}
                  {displayData.totalPopulation && (
                    <>
                      <div className="research-metrics-grid">
                        <div className="research-metric-card">
                          <Users size={24} />
                          <div className="metric-value">{formatNumber(displayData.totalPopulation)}</div>
                          <div className="metric-label">Population</div>
                        </div>
                        <div className="research-metric-card">
                          <Activity size={24} />
                          <div className="metric-value">{displayData.medianAge || 'N/A'}</div>
                          <div className="metric-label">Median Age</div>
                        </div>
                        <div className="research-metric-card">
                          <Wallet size={24} />
                          <div className="metric-value">{formatCurrency(displayData.medianIncome)}</div>
                          <div className="metric-label">Median Income</div>
                        </div>
                        <div className="research-metric-card">
                          <Home size={24} />
                          <div className="metric-value">{formatCurrency(displayData.medianHomeValue)}</div>
                          <div className="metric-label">Median Home Value</div>
                        </div>
                      </div>

                      <div className="research-charts-row">
                        {displayData.race && (
                          <div className="research-chart-card">
                            <h4><PieChartIcon size={16} /> Race & Ethnicity</h4>
                            <div className="research-chart-container">
                              <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                  <Pie data={getRaceChartData(displayData.race, displayData.totalPopulation)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                    {getRaceChartData(displayData.race, displayData.totalPopulation).map((entry, i) => (
                                      <Cell key={i} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(val) => formatNumber(val)} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                        {displayData.ageGroups && (
                          <div className="research-chart-card">
                            <h4><Baby size={16} /> Age Distribution</h4>
                            <div className="research-chart-container">
                              <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={getAgeChartData(displayData.ageGroups)}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                                  <Tooltip formatter={(val) => formatNumber(val)} />
                                  <Bar dataKey="value" fill="var(--primary)">
                                    {getAgeChartData(displayData.ageGroups).map((_, i) => (
                                      <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="research-stats-row">
                        {displayData.education && (
                          <div className="research-stat-card">
                            <h4><GraduationCap size={16} /> Education</h4>
                            <div className="stat-items">
                              <div className="stat-item"><span>Bachelor's</span><span>{formatNumber(displayData.education.bachelors)}</span></div>
                              <div className="stat-item"><span>Master's</span><span>{formatNumber(displayData.education.masters)}</span></div>
                              <div className="stat-item"><span>Doctorate</span><span>{formatNumber(displayData.education.doctorate)}</span></div>
                              <div className="stat-item total"><span>Higher Ed Total</span><span>{formatNumber(displayData.education.highEducation)}</span></div>
                            </div>
                          </div>
                        )}
                        {displayData.housing && (
                          <div className="research-stat-card">
                            <h4><Home size={16} /> Housing</h4>
                            <div className="stat-items">
                              <div className="stat-item"><span>Owner Occupied</span><span>{formatNumber(displayData.housing.ownerOccupied)}</span></div>
                              <div className="stat-item"><span>Renter Occupied</span><span>{formatNumber(displayData.housing.renterOccupied)}</span></div>
                              <div className="stat-item"><span>Ownership Rate</span><span>{formatPercent(displayData.housing.ownerOccupied, displayData.housing.ownerOccupied + displayData.housing.renterOccupied)}</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Other Category Tabs (Schools, Businesses, etc.) */}
              {activeCategory !== 'demographics' && (
                <div className="research-category-content">
                  {loadingCategory === activeCategory ? (
                    <div className="research-loading"><RefreshCw size={20} className="spin" /> Loading {activeCategory}...</div>
                  ) : (
                    <>
                      {/* Summary Stats */}
                      <div className="research-cat-summary">
                        <div className="research-cat-total">
                          <strong>{currentCategoryItems.length}</strong>
                          <span>{activeCategory} found within {searchRadius / 1000} km</span>
                        </div>
                        {currentCategoryItems.length > 0 && (
                          <div className="research-type-chips">
                            {getTypeCounts(currentCategoryItems, activeCategory).slice(0, 8).map(([type, count]) => (
                              <button
                                key={type}
                                className={`research-type-chip ${typeFilter === type ? 'active' : ''}`}
                                onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
                              >
                                {type.replace(/_/g, ' ')} <span>{count}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Filters */}
                      {currentCategoryItems.length > 0 && (
                        <div className="research-filters-bar">
                          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="research-select">
                            <option value="all">All Types ({currentCategoryItems.length})</option>
                            {getTypeCounts(currentCategoryItems, activeCategory).map(([type, count]) => (
                              <option key={type} value={type}>{type.replace(/_/g, ' ')} ({count})</option>
                            ))}
                          </select>
                          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="research-select">
                            <option value="name">Sort by Name</option>
                            <option value="type">Sort by Type</option>
                          </select>
                          <span className="research-results-count">{filteredItems.length} results</span>
                        </div>
                      )}

                      {/* Results List */}
                      {sortedItems.length > 0 ? (
                        <div className="research-items-list">
                          {sortedItems.slice(0, 50).map((item) => (
                            <div key={item.id} className="research-item-card">
                              <div className="research-item-header">
                                <h4>{item.name}</h4>
                                <span className="research-item-type">{item.type.replace(/_/g, ' ')}</span>
                              </div>
                              {item.address && <p className="research-item-address"><MapPin size={12} /> {item.address}</p>}
                              <div className="research-item-meta">
                                {item.phone && <span><Phone size={12} /> {item.phone}</span>}
                                {item.website && <a href={item.website.startsWith('http') ? item.website : `https://${item.website}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={12} /> Website</a>}
                              </div>
                            </div>
                          ))}
                          {sortedItems.length > 50 && (
                            <p className="research-more-note">Showing 50 of {sortedItems.length} results</p>
                          )}
                        </div>
                      ) : (
                        <div className="research-empty-cat">
                          <Building2 size={32} />
                          <p>No {activeCategory} found in this area</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {viewMode === 'saved' && (
        <div className="research-saved-section">
          <h3><FolderKanban size={18} /> Saved Research ({marketResearch.length})</h3>
          {marketResearch.length === 0 ? (
            <p className="research-empty">No saved research yet. Search for a location and save it.</p>
          ) : (
            <div className="research-saved-list">
              {marketResearch.map((research) => (
                <div key={research.id} className={`research-saved-card ${selectedResearch?.id === research.id ? 'selected' : ''}`}>
                  <div className="saved-card-header" onClick={() => setSelectedResearch(selectedResearch?.id === research.id ? null : research)}>
                    <div className="saved-card-title">
                      <MapPin size={16} />
                      <span>{research.location}</span>
                    </div>
                    <div className="saved-card-meta">
                      <span>{new Date(research.createdAt).toLocaleDateString()}</span>
                      <ChevronDown size={16} className={selectedResearch?.id === research.id ? 'rotated' : ''} />
                    </div>
                  </div>
                  {selectedResearch?.id === research.id && (
                    <div className="saved-card-body">
                      {research.demographics?.totalPopulation ? (
                        <div className="saved-card-stats">
                          <div className="saved-stat"><span className="saved-stat-label">Population</span><span className="saved-stat-value">{formatNumber(research.demographics.totalPopulation)}</span></div>
                          <div className="saved-stat"><span className="saved-stat-label">Median Income</span><span className="saved-stat-value">{formatCurrency(research.demographics.medianIncome)}</span></div>
                          <div className="saved-stat"><span className="saved-stat-label">Median Age</span><span className="saved-stat-value">{research.demographics.medianAge || 'N/A'}</span></div>
                          <div className="saved-stat"><span className="saved-stat-label">Home Value</span><span className="saved-stat-value">{formatCurrency(research.demographics.medianHomeValue)}</span></div>
                        </div>
                      ) : (
                        <p className="saved-card-note">No demographic data available</p>
                      )}
                      <div className="saved-card-actions">
                        <button onClick={() => { setCurrentData(research); setCategoryData(research.categoryData || {}); setViewMode('search'); setSelectedResearch(null); }} className="btn btn-sm btn-outline">
                          <Eye size={14} /> View Full
                        </button>
                        {deleteConfirm === research.id ? (
                          <div className="delete-confirm">
                            <span>Delete?</span>
                            <button onClick={() => { deleteResearch(research.id); setDeleteConfirm(null); setSelectedResearch(null); }} className="btn btn-sm btn-danger">Yes</button>
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-sm btn-outline">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(research.id)} className="btn btn-sm btn-ghost">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ===== TIERS TAB ===== */
function TiersTab() {
  const packages = [
    {
      name: 'Starter',
      color: '#9ca3af',
      description: 'Perfect for personal sites & small businesses getting online',
      total: '$800 - $1,500',
      components: [
        { name: 'Landing Page Design', price: '$300-500', desc: 'Single page with sections (hero, about, services, contact)' },
        { name: 'Mobile Responsive', price: '$150-200', desc: 'Optimized for all screen sizes' },
        { name: 'Contact Form', price: '$100-150', desc: 'Basic form with email notifications' },
        { name: 'Basic SEO Setup', price: '$100-150', desc: 'Meta tags, sitemap, Google indexing' },
        { name: 'Social Media Links', price: '$50', desc: 'Icons linking to your profiles' },
        { name: 'Google Analytics', price: '$100', desc: 'Traffic tracking setup' },
      ],
    },
    {
      name: 'Business',
      color: '#3b82f6',
      description: 'Full website for established businesses',
      total: '$2,500 - $5,000',
      components: [
        { name: 'Multi-Page Website (5-10 pages)', price: '$1,200-2,000', desc: 'Home, About, Services, Portfolio, Contact, etc.' },
        { name: 'Custom Design & Branding', price: '$500-800', desc: 'Unique look matching your brand identity' },
        { name: 'Mobile Responsive', price: '$200-300', desc: 'Tablet & mobile optimized' },
        { name: 'Contact Forms (Advanced)', price: '$150-250', desc: 'Multiple forms, file uploads, validation' },
        { name: 'Blog/News Section', price: '$300-500', desc: 'Post articles, categories, archive' },
        { name: 'SEO Optimization', price: '$200-400', desc: 'On-page SEO, schema markup, speed optimization' },
        { name: 'Social Media Integration', price: '$100-200', desc: 'Feeds, sharing buttons, embeds' },
        { name: 'Google Maps Integration', price: '$100', desc: 'Location map on contact page' },
        { name: 'Analytics Dashboard', price: '$150-250', desc: 'Google Analytics + basic reporting' },
      ],
    },
    {
      name: 'Premium',
      color: '#8b5cf6',
      description: 'Advanced features & custom functionality',
      total: '$5,000 - $12,000',
      components: [
        { name: 'Multi-Page Website (10-20 pages)', price: '$2,000-4,000', desc: 'Comprehensive site structure' },
        { name: 'Custom UI/UX Design', price: '$1,000-2,000', desc: 'User research, wireframes, prototypes' },
        { name: 'Content Management System (CMS)', price: '$800-1,500', desc: 'Edit content without code knowledge' },
        { name: 'User Authentication', price: '$500-1,000', desc: 'Login, registration, password reset' },
        { name: 'Client Portal/Dashboard', price: '$800-1,500', desc: 'Private area for clients to view info' },
        { name: 'Booking/Scheduling System', price: '$600-1,200', desc: 'Appointment booking with calendar' },
        { name: 'Payment Integration', price: '$500-800', desc: 'Stripe, PayPal, invoice generation' },
        { name: 'Email Marketing Integration', price: '$200-400', desc: 'Mailchimp, newsletters, automation' },
        { name: 'Advanced SEO', price: '$400-800', desc: 'Technical SEO, local SEO, content strategy' },
        { name: 'Performance Optimization', price: '$300-500', desc: 'Fast load times, caching, CDN setup' },
      ],
    },
    {
      name: 'Enterprise',
      color: '#f59e0b',
      description: 'Full custom web applications & complex solutions',
      total: '$12,000 - $50,000+',
      components: [
        { name: 'Custom Web Application', price: '$5,000-20,000', desc: 'Built from scratch to your specifications' },
        { name: 'Database Design & Setup', price: '$1,000-3,000', desc: 'Data modeling, relationships, optimization' },
        { name: 'API Development', price: '$2,000-5,000', desc: 'Custom APIs for integrations' },
        { name: 'Third-Party Integrations', price: '$500-2,000/each', desc: 'CRM, ERP, payment gateways, etc.' },
        { name: 'Admin Dashboard', price: '$2,000-5,000', desc: 'Full control panel for your business' },
        { name: 'Multi-User Roles & Permissions', price: '$800-1,500', desc: 'Admin, staff, client access levels' },
        { name: 'E-Commerce Platform', price: '$3,000-8,000', desc: 'Product catalog, cart, checkout, inventory' },
        { name: 'Real-Time Features', price: '$1,500-4,000', desc: 'Live chat, notifications, updates' },
        { name: 'Mobile App (React Native)', price: '$8,000-25,000', desc: 'iOS & Android from same codebase' },
        { name: 'Ongoing Support Package', price: '$500-2,000/mo', desc: 'Maintenance, updates, priority support' },
      ],
    },
  ];

  const getTotalRange = (components) => {
    let min = 0; let max = 0;
    components.forEach((c) => {
      const match = c.price.match(/\$([0-9,]+)(?:-([0-9,]+))?/);
      if (match) {
        min += parseInt(match[1].replace(/,/g, ''), 10);
        max += parseInt((match[2] || match[1]).replace(/,/g, ''), 10);
      }
    });
    return { min, max };
  };

  return (
    <div className="tiers-tab">
      <div className="tiers-header">
        <h2><Layers size={20} /> Development Packages</h2>
        <p>One-time fees — you own the code. Customized to your needs.</p>
      </div>
      <div className="tiers-list">
        {packages.map((pkg) => {
          const range = getTotalRange(pkg.components);
          return (
            <div key={pkg.name} className="tier-package" style={{ borderLeftColor: pkg.color }}>
              <div className="tier-package-header">
                <div className="tier-package-title">
                  <span className="tier-dot" style={{ background: pkg.color }} />
                  <h3>{pkg.name}</h3>
                  <span className="tier-total">{pkg.total}</span>
                </div>
                <p className="tier-package-desc">{pkg.description}</p>
              </div>
              <div className="tier-components">
                <table className="tier-components-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Description</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pkg.components.map((comp, idx) => (
                      <tr key={idx}>
                        <td className="comp-name">{comp.name}</td>
                        <td className="comp-desc">{comp.desc}</td>
                        <td className="comp-price">{comp.price}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="2"><strong>Package Total (all components)</strong></td>
                      <td className="comp-price"><strong>${range.min.toLocaleString()} - ${range.max.toLocaleString()}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Featured Example */}
      <div className="tier-example">
        <div className="tier-example-header">
          <h3><Briefcase size={18} /> Example: CRM & Business Management System</h3>
          <span className="tier-example-badge" style={{ background: '#f59e0b' }}>Enterprise</span>
        </div>
        <p className="tier-example-desc">
          A complete business management platform like this admin dashboard — with client management,
          appointment scheduling, lead prospecting, sales pipeline, expense tracking, and analytics.
        </p>
        <div className="tier-example-breakdown">
          <table className="tier-components-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>What's Included</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="comp-name">Public Website</td>
                <td className="comp-desc">Home, About, Portfolio, Contact pages with responsive design</td>
                <td className="comp-price">$1,500</td>
              </tr>
              <tr>
                <td className="comp-name">Custom UI/UX Design</td>
                <td className="comp-desc">Dashboard layout, calendar views, data tables, forms</td>
                <td className="comp-price">$1,500</td>
              </tr>
              <tr>
                <td className="comp-name">User Authentication</td>
                <td className="comp-desc">Admin login + client registration with password reset</td>
                <td className="comp-price">$800</td>
              </tr>
              <tr>
                <td className="comp-name">Client Portal</td>
                <td className="comp-desc">Client dashboard, invoice viewing, project tracking</td>
                <td className="comp-price">$1,200</td>
              </tr>
              <tr>
                <td className="comp-name">Booking System</td>
                <td className="comp-desc">Appointment scheduling with calendar, confirmations</td>
                <td className="comp-price">$1,000</td>
              </tr>
              <tr>
                <td className="comp-name">Payment Integration</td>
                <td className="comp-desc">Stripe-ready checkout, invoice generation</td>
                <td className="comp-price">$600</td>
              </tr>
              <tr>
                <td className="comp-name">CRM Core System</td>
                <td className="comp-desc">Client database, notes, tags, VIP tracking, history</td>
                <td className="comp-price">$3,500</td>
              </tr>
              <tr>
                <td className="comp-name">Admin Dashboard</td>
                <td className="comp-desc">Multi-tab control panel, stats, quick actions</td>
                <td className="comp-price">$4,000</td>
              </tr>
              <tr>
                <td className="comp-name">Roles & Permissions</td>
                <td className="comp-desc">Admin, manager, staff, client access levels</td>
                <td className="comp-price">$1,200</td>
              </tr>
              <tr>
                <td className="comp-name">Database Architecture</td>
                <td className="comp-desc">7 data models with relationships and persistence</td>
                <td className="comp-price">$2,000</td>
              </tr>
              <tr>
                <td className="comp-name">Lead Prospecting</td>
                <td className="comp-desc">Address search, OSM/Overpass API, manual entry, pipeline</td>
                <td className="comp-price">$2,000</td>
              </tr>
              <tr>
                <td className="comp-name">Sales Pipeline</td>
                <td className="comp-desc">Lead → Follow-Up → Pipeline → Client workflow</td>
                <td className="comp-price">$1,800</td>
              </tr>
              <tr>
                <td className="comp-name">Follow-Up Tracker</td>
                <td className="comp-desc">Call scheduling, notes, status tracking, archiving</td>
                <td className="comp-price">$1,200</td>
              </tr>
              <tr>
                <td className="comp-name">Expense Tracking</td>
                <td className="comp-desc">Categories, receipt uploads, filtering, summaries</td>
                <td className="comp-price">$1,000</td>
              </tr>
              <tr>
                <td className="comp-name">Analytics Dashboard</td>
                <td className="comp-desc">Revenue charts, P&L, monthly trends, projections</td>
                <td className="comp-price">$1,500</td>
              </tr>
              <tr>
                <td className="comp-name">Third-Party Integration</td>
                <td className="comp-desc">OpenStreetMap/Overpass API for business search</td>
                <td className="comp-price">$800</td>
              </tr>
              <tr>
                <td className="comp-name">Business Database</td>
                <td className="comp-desc">Intel storage, enrichment forms, lookup links, archiving</td>
                <td className="comp-price">$1,200</td>
              </tr>
              <tr>
                <td className="comp-name">Client Approval Workflow</td>
                <td className="comp-desc">Pending registration, admin approval, rejection flow</td>
                <td className="comp-price">$600</td>
              </tr>
              <tr>
                <td className="comp-name">Market Research Dashboard</td>
                <td className="comp-desc">Census API demographics, population, income, charts, saved research</td>
                <td className="comp-price">$2,500</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2"><strong>Total Project Value</strong></td>
                <td className="comp-price"><strong>$29,900</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="tiers-note">
        <p><strong>Note:</strong> Prices are estimates. Final quote depends on project complexity and customization. All projects include source code ownership and deployment assistance.</p>
      </div>
    </div>
  );
}

/* ===== KANBAN VIEW ===== */
function KanbanView({ appointments, users, onAssign, onStatusChange, canManage, STAFF_COLORS }) {
  const [draggedAppt, setDraggedAppt] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Get staff members (admin, manager, staff roles)
  const staffMembers = users.filter((u) => ['admin', 'manager', 'staff'].includes(u.role));

  // Group appointments by assignee
  const unassigned = appointments.filter((a) => !a.assignedTo);
  const getAssignedTo = (userId) => appointments.filter((a) => a.assignedTo === userId);

  const handleDragStart = (e, appt) => {
    setDraggedAppt(appt);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', appt.id);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, userId) => {
    e.preventDefault();
    if (draggedAppt && canManage) {
      onAssign(draggedAppt.id, userId === 'unassigned' ? null : userId);
    }
    setDraggedAppt(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedAppt(null);
    setDragOverColumn(null);
  };

  const renderCard = (appt, staffColor) => {
    const assignedUser = appt.assignedTo ? users.find((u) => u.id === appt.assignedTo) : null;
    return (
      <div
        key={appt.id}
        className={`kanban-card ${draggedAppt?.id === appt.id ? 'dragging' : ''}`}
        draggable={canManage}
        onDragStart={(e) => handleDragStart(e, appt)}
        onDragEnd={handleDragEnd}
        style={staffColor ? { borderLeftColor: staffColor } : {}}
      >
        <div className="kanban-card-header">
          <strong>{appt.name}</strong>
          <StatusBadge status={appt.status} />
        </div>
        <div className="kanban-card-meta">
          <span><CalendarDays size={12} /> {formatDisplayDate(appt.date)}</span>
          <span><Clock size={12} /> {appt.time}</span>
        </div>
        {appt.service && <div className="kanban-card-service">{appt.service.replace('-', ' ')}</div>}
        {assignedUser && (
          <div className="kanban-card-assignee">
            <span className="staff-dot" style={{ background: assignedUser.color || STAFF_COLORS[0] }}></span>
            {assignedUser.name}
          </div>
        )}
        {canManage && (
          <div className="kanban-card-actions">
            {appt.status === 'pending' && (
              <button className="btn btn-xs btn-confirm" onClick={() => onStatusChange(appt.id, 'confirmed')}>
                <CheckCircle size={12} /> Confirm
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
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
          <span className="kanban-count">{unassigned.length}</span>
        </div>
        <div className="kanban-column-content">
          {unassigned.map((appt) => renderCard(appt, null))}
          {unassigned.length === 0 && <p className="kanban-empty">No unassigned appointments</p>}
        </div>
      </div>

      {/* Staff Columns */}
      {staffMembers.map((staff, index) => {
        const staffAppts = getAssignedTo(staff.id);
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
              <span className="kanban-count">{staffAppts.length}</span>
            </div>
            <div className="kanban-column-content">
              {staffAppts.map((appt) => renderCard(appt, staffColor))}
              {staffAppts.length === 0 && <p className="kanban-empty">Drop appointments here</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===== MAIN ADMIN ===== */
export default function Admin() {
  useEffect(() => { document.title = 'Admin Dashboard — Three Seas Digital'; }, []);
  const {
    appointments, updateAppointmentStatus, deleteAppointment, assignAppointment,
    currentUser, needsSetup, logout, hasPermission, clients, users, STAFF_COLORS, prospects, leads, marketResearch,
  } = useAppContext();
  const [selectedDate, setSelectedDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [view, setView] = useState('calendar');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [deleteApptConfirm, setDeleteApptConfirm] = useState(null);
  const [deleteApptInput, setDeleteApptInput] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedAppointments, setSelectedAppointments] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Clear bulk selections when view or filter changes
  useEffect(() => {
    setSelectedAppointments(new Set());
    setBulkMode(false);
  }, [view, filterStatus, selectedDate]);

  if (needsSetup) return <AdminSetup />;
  if (!currentUser) return <AdminLogin />;

  // Bulk Operations
  const toggleAppointmentSelection = (id) => {
    setSelectedAppointments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllAppointments = () => {
    if (selectedAppointments.size === filtered.length) {
      setSelectedAppointments(new Set());
    } else {
      setSelectedAppointments(new Set(filtered.map((a) => a.id)));
    }
  };

  const bulkConfirmAppointments = () => {
    selectedAppointments.forEach((id) => {
      const appt = appointments.find((a) => a.id === id);
      if (appt && appt.status === 'pending') {
        updateAppointmentStatus(id, 'confirmed');
      }
    });
    setSelectedAppointments(new Set());
    setBulkMode(false);
  };

  const bulkCancelAppointments = () => {
    if (!window.confirm(`Are you sure you want to cancel ${selectedAppointments.size} appointments?`)) return;
    selectedAppointments.forEach((id) => {
      const appt = appointments.find((a) => a.id === id);
      if (appt && appt.status !== 'cancelled') {
        updateAppointmentStatus(id, 'cancelled');
      }
    });
    setSelectedAppointments(new Set());
    setBulkMode(false);
  };

  const bulkDeleteAppointments = () => {
    if (!window.confirm(`Are you sure you want to DELETE ${selectedAppointments.size} appointments? This cannot be undone.`)) return;
    selectedAppointments.forEach((id) => deleteAppointment(id));
    setSelectedAppointments(new Set());
    setBulkMode(false);
  };

  const bulkExportSelected = () => {
    const selected = filtered.filter((a) => selectedAppointments.has(a.id));
    exportToICal(selected, 'selected-appointments.ics');
  };

  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const sidebarTabs = ['users', 'expenses', 'analytics'];

  const canManageAppointments = hasPermission('manage_appointments');
  const canConfirmAppointments = hasPermission('confirm_appointments') || canManageAppointments;
  const canManageUsers = hasPermission('manage_users');
  const canManageClients = hasPermission('manage_clients');
  const canViewClients = hasPermission('view_clients') || canManageClients;

  const filtered = appointments
    .filter((a) => (filterStatus === 'all' ? true : a.status === filterStatus))
    .filter((a) => (selectedDate ? a.date === selectedDate : true))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const followUpCount = appointments.filter((a) => a.followUp && a.followUp.status !== 'completed' && a.followUp.status !== 'archived' && !a.sentToPipeline).length;
  const archivedCount = appointments.filter((a) => a.followUp && a.followUp.status === 'archived').length;
  const pipelineCount = prospects.filter((p) => !p.closedAt).length;
  const pendingClientCount = clients.filter((c) => c.status === 'pending').length;
  const clientCount = clients.filter((c) => c.status !== 'pending').length;
  const vipCount = clients.filter((c) => c.status === 'vip').length;
  const pendingUserCount = users.filter((u) => u.status === 'pending').length;

  return (
    <div className="page admin-page">
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-inner">
            <div>
              <h1><CalendarDays size={28} /> Admin Dashboard</h1>
              <p className="admin-welcome">Welcome, <strong>{currentUser.name}</strong> <RoleBadge role={currentUser.role} /></p>
            </div>
            <div className="admin-header-actions">
              <NotificationsDropdown />
              <button className="btn btn-outline btn-sm" onClick={logout}><LogOut size={16} /> Logout</button>
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="admin-stats">
          <div className="admin-stat-card"><CalendarDays size={24} /><div><h3>{selectedDate ? appointments.filter((a) => a.date === selectedDate).length : appointments.length}</h3><p>{selectedDate ? `Bookings on ${formatDisplayDate(selectedDate)}` : 'Total Bookings'}</p></div></div>
          <div className="admin-stat-card pending"><AlertCircle size={24} /><div><h3>{pendingCount}</h3><p>Pending</p></div></div>
          <div className="admin-stat-card" style={{ color: 'var(--accent)' }}><PhoneForwarded size={24} /><div><h3>{followUpCount}</h3><p>Open Follow-Ups</p></div></div>
          <div className="admin-stat-card confirmed"><UserCheck size={24} /><div><h3>{clientCount}</h3><p>Clients ({vipCount} VIP)</p></div></div>

        </div>

        <div className="admin-layout">
          {/* Sidebar */}
          {isAdminOrManager && (
            <div className={`admin-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
              <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronDown size={18} />}
              </button>
              {sidebarOpen && (
                <>
                  <div className="sidebar-group">
                    <h4 className="sidebar-group-title"><Users size={14} /> Team</h4>
                    {canManageUsers && (
                      <button
                        className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                      >
                        <Shield size={16} /> Users
                        {pendingUserCount > 0 && <span className="sidebar-badge">{pendingUserCount}</span>}
                      </button>
                    )}
                  </div>
                  <div className="sidebar-group">
                    <h4 className="sidebar-group-title"><PhoneForwarded size={14} /> Follow-ups</h4>
                    <button
                      className={`sidebar-item ${activeTab === 'archived' ? 'active' : ''}`}
                      onClick={() => setActiveTab('archived')}
                    >
                      <FolderKanban size={16} /> Archived
                      {archivedCount > 0 && <span className="sidebar-badge">{archivedCount}</span>}
                    </button>
                  </div>
                  <div className="sidebar-group">
                    <h4 className="sidebar-group-title"><UserCheck size={14} /> Clients</h4>
                    <button
                      className={`sidebar-item ${activeTab === 'clientrequests' ? 'active' : ''}`}
                      onClick={() => setActiveTab('clientrequests')}
                    >
                      <UserPlus size={16} /> Requests
                      {pendingClientCount > 0 && <span className="sidebar-badge">{pendingClientCount}</span>}
                    </button>
                  </div>
                  <div className="sidebar-group">
                    <h4 className="sidebar-group-title"><Briefcase size={14} /> Sales</h4>
                    <button
                      className={`sidebar-item ${activeTab === 'leads' ? 'active' : ''}`}
                      onClick={() => setActiveTab('leads')}
                    >
                      <MapPin size={16} /> Leads
                      {leads.length > 0 && <span className="sidebar-badge">{leads.length}</span>}
                    </button>
                    <button
                      className={`sidebar-item ${activeTab === 'research' ? 'active' : ''}`}
                      onClick={() => setActiveTab('research')}
                    >
                      <BarChart2 size={16} /> Research
                      {marketResearch.length > 0 && <span className="sidebar-badge">{marketResearch.length}</span>}
                    </button>
                  </div>
                  <div className="sidebar-group">
                    <h4 className="sidebar-group-title"><DollarSign size={14} /> Finance</h4>
                    <button
                      className={`sidebar-item ${activeTab === 'revenue' ? 'active' : ''}`}
                      onClick={() => setActiveTab('revenue')}
                    >
                      <DollarSign size={16} /> Revenue
                    </button>
                    <button
                      className={`sidebar-item ${activeTab === 'invoices' ? 'active' : ''}`}
                      onClick={() => setActiveTab('invoices')}
                    >
                      <FileSpreadsheet size={16} /> Invoices
                    </button>
                    <button
                      className={`sidebar-item ${activeTab === 'expenses' ? 'active' : ''}`}
                      onClick={() => setActiveTab('expenses')}
                    >
                      <Receipt size={16} /> Expenses
                    </button>
                    <button
                      className={`sidebar-item ${activeTab === 'profit' ? 'active' : ''}`}
                      onClick={() => setActiveTab('profit')}
                    >
                      <TrendingUp size={16} /> Profit
                    </button>
                    <button
                      className={`sidebar-item ${activeTab === 'taxes' ? 'active' : ''}`}
                      onClick={() => setActiveTab('taxes')}
                    >
                      <FileText size={16} /> Taxes
                    </button>
                    <button
                      className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}
                      onClick={() => setActiveTab('analytics')}
                    >
                      <BarChart3 size={16} /> Analytics
                    </button>
                  </div>
                  <div className="sidebar-group">
                    <h4 className="sidebar-group-title"><Layers size={14} /> Pricing</h4>
                    <button
                      className={`sidebar-item ${activeTab === 'tiers' ? 'active' : ''}`}
                      onClick={() => setActiveTab('tiers')}
                    >
                      <Layers size={16} /> Tiers
                    </button>
                  </div>
                  <div className="sidebar-group">
                    <h4 className="sidebar-group-title"><FolderKanban size={14} /> Database</h4>
                    <button
                      className={`sidebar-item ${activeTab === 'clientsdb' ? 'active' : ''}`}
                      onClick={() => setActiveTab('clientsdb')}
                    >
                      <Users size={16} /> Clients
                      {clients.filter((c) => c.status !== 'pending').length > 0 && <span className="sidebar-badge">{clients.filter((c) => c.status !== 'pending').length}</span>}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Main Content */}
          <div className="admin-main">
            <div className="admin-tabs">
              <button className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><LayoutDashboard size={16} /> Dashboard</button>
              <button className={`admin-tab ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}><CalendarIcon size={16} /> Appointments</button>
              {canManageAppointments && (
                <button className={`admin-tab ${activeTab === 'followups' ? 'active' : ''}`} onClick={() => setActiveTab('followups')}>
                  <PhoneForwarded size={16} /> Follow-Ups {followUpCount > 0 && <span className="tab-badge">{followUpCount}</span>}
                </button>
              )}
              {isAdminOrManager && (
                <button className={`admin-tab ${activeTab === 'pipeline' ? 'active' : ''}`} onClick={() => setActiveTab('pipeline')}>
                  <Briefcase size={16} /> Pipeline {pipelineCount > 0 && <span className="tab-badge">{pipelineCount}</span>}
                </button>
              )}
              {canViewClients && (
                <button className={`admin-tab ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => setActiveTab('clients')}>
                  <UserCheck size={16} /> Clients {vipCount > 0 && <span className="tab-badge vip-tab-badge">{vipCount} VIP</span>}
                </button>
              )}
            </div>

        {activeTab === 'dashboard' && <DashboardHomeTab onNavigate={setActiveTab} />}
        {activeTab === 'appointments' && (
          <>
            <div className="admin-controls">
              <div className="view-toggles">
                <button className={`view-btn ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}><CalendarIcon size={16} /> Calendar</button>
                <button className={`view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}><BarChart3 size={16} /> List</button>
                <button className={`view-btn ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}><Users size={16} /> Staff</button>
              </div>
              <div className="filter-controls">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select"><option value="all">All Status</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select>
                {selectedDate && <button className="btn btn-sm btn-outline" onClick={() => setSelectedDate('')}>Clear Date</button>}
                <button className="btn btn-sm btn-outline calendar-export-btn" onClick={() => exportToICal(filtered.filter((a) => a.status !== 'cancelled'), selectedDate ? `appointments-${selectedDate}.ics` : 'all-appointments.ics')}>
                  <Download size={14} /> Export iCal
                </button>
                {canManageAppointments && view !== 'kanban' && (
                  <button className={`btn btn-sm ${bulkMode ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setBulkMode(!bulkMode); setSelectedAppointments(new Set()); }}>
                    <CheckSquare size={14} /> {bulkMode ? 'Exit Bulk Mode' : 'Bulk Actions'}
                  </button>
                )}
              </div>
            </div>
            {bulkMode && selectedAppointments.size > 0 && (
              <div className="bulk-actions-bar">
                <span className="bulk-count">{selectedAppointments.size} selected</span>
                <div className="bulk-buttons">
                  <button className="btn btn-sm btn-confirm" onClick={bulkConfirmAppointments}><CheckCircle size={14} /> Confirm All</button>
                  <button className="btn btn-sm btn-outline" onClick={bulkExportSelected}><Download size={14} /> Export Selected</button>
                  <button className="btn btn-sm btn-cancel" onClick={bulkCancelAppointments}><XCircle size={14} /> Cancel All</button>
                  <button className="btn btn-sm btn-delete" onClick={bulkDeleteAppointments}><Trash2 size={14} /> Delete All</button>
                </div>
              </div>
            )}
            {view === 'kanban' ? (
              <KanbanView
                appointments={filtered}
                users={users.filter((u) => u.status === 'approved')}
                onAssign={assignAppointment}
                onStatusChange={updateAppointmentStatus}
                canManage={canManageAppointments}
                STAFF_COLORS={STAFF_COLORS}
              />
            ) : (
              <div className="admin-content">
                {view === 'calendar' && (
                  <div className="admin-calendar-section">
                    <Calendar onDateSelect={setSelectedDate} selectedDate={selectedDate} showDots={true} />
                    {selectedDate && <p className="date-filter-label">Showing: {formatDisplayDate(selectedDate)}</p>}
                  </div>
                )}
                <div className="admin-appointments">
                  <div className="appointments-header">
                    <h2>Appointments {filtered.length > 0 && <span className="count-badge">{filtered.length}</span>}</h2>
                    {bulkMode && filtered.length > 0 && (
                      <button className="btn btn-sm btn-outline" onClick={selectAllAppointments}>
                        {selectedAppointments.size === filtered.length ? <><Square size={14} /> Deselect All</> : <><CheckSquare size={14} /> Select All</>}
                      </button>
                    )}
                  </div>
                  {filtered.length === 0 ? (
                    <div className="empty-state"><CalendarDays size={48} /><p>No appointments found</p></div>
                  ) : (
                    <div className="appointment-list">
                      {filtered.map((appt) => {
                        const assignedUser = appt.assignedTo ? users.find((u) => u.id === appt.assignedTo) : null;
                        const isSelected = selectedAppointments.has(appt.id);
                        return (
                          <div key={appt.id} className={`appointment-card ${isSelected ? 'selected' : ''}`} style={assignedUser ? { borderLeftColor: assignedUser.color || STAFF_COLORS[0], borderLeftWidth: '4px' } : {}}>
                            {bulkMode && (
                              <div className="appt-checkbox" onClick={() => toggleAppointmentSelection(appt.id)}>
                                {isSelected ? <CheckSquare size={18} className="checked" /> : <Square size={18} />}
                              </div>
                            )}
                            <div className="appt-header">
                              <div className="appt-datetime"><span className="appt-date"><CalendarDays size={14} /> {formatDisplayDate(appt.date)}</span><span className="appt-time"><Clock size={14} /> {appt.time}</span></div>
                              <div className="appt-badges">
                                {assignedUser && <span className="staff-badge" style={{ background: assignedUser.color || STAFF_COLORS[0] }}>{assignedUser.name}</span>}
                                <StatusBadge status={appt.status} /><FollowUpBadge followUp={appt.followUp} />{appt.convertedToClient && <span className="converted-tag"><UserCheck size={12} /> Client</span>}
                              </div>
                            </div>
                            <div className="appt-details">
                              <div className="appt-detail"><User size={14} /><span>{appt.name}</span></div>
                              <div className="appt-detail"><Mail size={14} /><span>{appt.email}</span></div>
                              {appt.phone && <div className="appt-detail"><Phone size={14} /><span>{appt.phone}</span></div>}
                              {appt.service && <div className="appt-service">Service: {appt.service.replace('-', ' ')}</div>}
                              {appt.message && <div className="appt-message">"{appt.message}"</div>}
                              {(() => {
                                const uniqueNotes = appt.leadNotes?.filter((n, i, arr) => arr.findIndex((x) => x.id === n.id) === i) || [];
                                return uniqueNotes.length > 0 && (
                                  <div className="appt-lead-notes">
                                    <span className="appt-notes-label"><MessageSquare size={12} /> Notes from Lead ({uniqueNotes.length}):</span>
                                    {uniqueNotes.map((n) => (
                                      <div key={n.id} className="appt-note-item">
                                        <p>{n.text}</p>
                                        <span className="appt-note-meta">{n.author} · {new Date(n.createdAt).toLocaleDateString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                            {(canConfirmAppointments || canManageAppointments) && (
                              <div className="appt-actions">
                                {canConfirmAppointments && appt.status === 'pending' && <button className="btn btn-sm btn-confirm" onClick={() => updateAppointmentStatus(appt.id, 'confirmed')}><CheckCircle size={14} /> Confirm</button>}
                                {canManageAppointments && appt.status !== 'cancelled' && <button className="btn btn-sm btn-cancel" onClick={() => updateAppointmentStatus(appt.id, 'cancelled')}><XCircle size={14} /> Cancel</button>}
                                {canManageAppointments && (
                                  deleteApptConfirm === appt.id ? (
                                    <div className="appt-delete-confirm">
                                      {cancelConfirm ? (
                                        <>
                                          <span className="cancel-confirm-text">Are you sure you want to cancel?</span>
                                          <button className="btn btn-sm btn-outline" onClick={() => { setDeleteApptConfirm(null); setDeleteApptInput(''); setCancelConfirm(false); }}>Yes, Cancel</button>
                                          <button className="btn btn-sm btn-primary" onClick={() => setCancelConfirm(false)}>No, Go Back</button>
                                        </>
                                      ) : (
                                        <>
                                          <span>Type "<strong>{appt.name}</strong>" to confirm:</span>
                                          <input
                                            type="text"
                                            value={deleteApptInput}
                                            onChange={(e) => setDeleteApptInput(e.target.value)}
                                            placeholder="Type name..."
                                            className="delete-confirm-input"
                                            autoFocus
                                          />
                                          {deleteApptInput === appt.name ? (
                                            <button
                                              className="btn btn-sm btn-delete"
                                              onClick={() => { deleteAppointment(appt.id); setDeleteApptConfirm(null); setDeleteApptInput(''); }}
                                            >Confirm Delete</button>
                                          ) : (
                                            <button className="btn btn-sm btn-outline" onClick={() => setCancelConfirm(true)}>Cancel</button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  ) : (
                                    <button className="btn btn-sm btn-delete" onClick={() => setDeleteApptConfirm(appt.id)}><Trash2 size={14} /> Delete</button>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        {activeTab === 'followups' && canManageAppointments && <FollowUpsTab />}
        {activeTab === 'pipeline' && isAdminOrManager && <PipelineTab />}
        {activeTab === 'clients' && canViewClients && <ClientsTab />}
        {activeTab === 'clientrequests' && isAdminOrManager && <ClientRequestsTab />}
        {activeTab === 'users' && canManageUsers && <UserManagement />}
        {activeTab === 'revenue' && isAdminOrManager && <RevenueTab />}
        {activeTab === 'invoices' && isAdminOrManager && <InvoicesTab />}
        {activeTab === 'expenses' && isAdminOrManager && <ExpensesTab />}
        {activeTab === 'profit' && isAdminOrManager && <ProfitTab />}
        {activeTab === 'taxes' && isAdminOrManager && <TaxesTab />}
        {activeTab === 'analytics' && isAdminOrManager && <AnalyticsTab />}
        {activeTab === 'leads' && isAdminOrManager && <LeadsTab />}
        {activeTab === 'research' && isAdminOrManager && <ResearchTab />}
        {activeTab === 'archived' && canManageAppointments && <ArchivedTab />}
        {activeTab === 'tiers' && isAdminOrManager && <TiersTab />}
        {activeTab === 'clientsdb' && isAdminOrManager && <ClientsDatabaseTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
