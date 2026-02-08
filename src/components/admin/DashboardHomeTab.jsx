import { useMemo } from 'react';
import {
  CalendarDays, Clock, AlertCircle, UserPlus,
  PhoneForwarded, CheckCircle, DollarSign, TrendingUp, Briefcase,
  Receipt, CreditCard, Timer, RefreshCw, Activity,
  ArrowRight, Zap, BarChart3, Search, History,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { StatusBadge, formatDisplayDate } from './adminUtils';

export default function DashboardHomeTab({ onNavigate }) {
  const {
    appointments, clients, payments, prospects,
    activityLog,
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
