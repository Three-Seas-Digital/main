import { useState, useEffect, lazy, Suspense } from 'react';
import {
  LogOut, CalendarDays, Clock, User, Mail, Phone, Trash2,
  CheckCircle, XCircle, AlertCircle, BarChart3, Users,
  Calendar as CalendarIcon, UserPlus, Shield, UserCheck,
  PhoneForwarded, MessageSquare,
  ChevronLeft, ChevronDown, ChevronRight, Briefcase, FolderKanban,
  DollarSign, Receipt, MapPin, TrendingUp,
  BarChart2, Download, CheckSquare, Square,
  FileSpreadsheet, LayoutDashboard, FileText, Layers, Menu,
  ClipboardList, Activity, Eye, Lightbulb, Search, Settings,
  Database, PieChart, Crosshair, Target, ClipboardCheck,
} from 'lucide-react';
import Calendar from '../components/Calendar';
import { useAppContext } from '../context/AppContext';
import AdminSetup from '../components/admin/AdminSetup';
import AdminLogin from '../components/admin/AdminLogin';
import NotificationsDropdown from '../components/admin/NotificationsDropdown';
import DashboardHomeTab from '../components/admin/DashboardHomeTab';
import { StatusBadge, RoleBadge, FollowUpBadge, formatDisplayDate, exportToICal } from '../components/admin/adminUtils';
import FollowUpsTab from '../components/admin/FollowUpsTab';
import PipelineTab from '../components/admin/PipelineTab';
import ClientRequestsTab from '../components/admin/ClientRequestsTab';
import ClientsTab from '../components/admin/ClientsTab';
import UserManagement from '../components/admin/UserManagement';
import ExpensesTab from '../components/admin/ExpensesTab';
import RevenueTab from '../components/admin/RevenueTab';
import InvoicesTab from '../components/admin/InvoicesTab';
import ProfitTab from '../components/admin/ProfitTab';
import TaxesTab from '../components/admin/TaxesTab';
import AnalyticsTab from '../components/admin/AnalyticsTab';
import LeadsTab from '../components/admin/LeadsTab';
import ResearchTab from '../components/admin/ResearchTab';
import ArchivedTab from '../components/admin/ArchivedTab';
import OnboardingTab from '../components/admin/OnboardingTab';
import TiersTab from '../components/admin/TiersTab';
import ClientsDatabaseTab from '../components/admin/ClientsDatabaseTab';
import KanbanView from '../components/admin/KanbanView';
import ErrorBoundary from '../components/ErrorBoundary';

/* ===== Lazy-loaded Business Intelligence tabs (Phase 6A + 6C) ===== */
const IntakeForm = lazy(() => import('../components/admin/BusinessIntelligence/IntakeForm'));
const AuditQueue = lazy(() => import('../components/admin/BusinessIntelligence/AuditQueue'));
const AuditScoring = lazy(() => import('../components/admin/BusinessIntelligence/AuditScoring'));
const HealthOverview = lazy(() => import('../components/admin/BusinessIntelligence/HealthOverview'));
const RecommendationsBuilder = lazy(() => import('../components/admin/BusinessIntelligence/RecommendationsBuilder'));
const ClientAnalytics = lazy(() => import('../components/admin/BusinessIntelligence/ClientAnalytics'));
const ClientFinancials = lazy(() => import('../components/admin/BusinessIntelligence/ClientFinancials'));
const InterventionTracker = lazy(() => import('../components/admin/BusinessIntelligence/InterventionTracker'));
const RevenueAuditTab = lazy(() => import('../components/admin/BusinessIntelligence/RevenueAuditTab'));
const ExecutionTracker = lazy(() => import('../components/admin/BusinessIntelligence/ExecutionTracker'));


/* ===== Sidebar navigation structure ===== */
const SIDEBAR_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, type: 'standalone' },
  { id: 'clients-group', label: 'Clients', icon: UserCheck, type: 'group', items: [
    { id: 'onboarding', label: 'Onboarding', icon: ClipboardCheck },
    { id: 'clients', label: 'All Clients', icon: Users },
    { id: 'clientrequests', label: 'Client Requests', icon: UserPlus },
    { id: 'clientsdb', label: 'Clients Database', icon: Database },
    { id: 'archived', label: 'Archived', icon: FolderKanban },
  ]},
  { id: 'bi-group', label: 'Business Intelligence', icon: Search, type: 'group', items: [
    { id: 'intake', label: 'Intake Forms', icon: ClipboardList },
    { id: 'audit-queue', label: 'Audit Queue', icon: Eye },
    { id: 'audit-scoring', label: 'Audit Scoring', icon: BarChart3 },
    { id: 'health-overview', label: 'Health Overview', icon: Activity },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
    { id: 'client-analytics', label: 'Client Analytics', icon: PieChart },
    { id: 'client-financials', label: 'Client Financials', icon: DollarSign },
    { id: 'interventions', label: 'Interventions', icon: Crosshair },
    { id: 'revenue-audit', label: 'Revenue Audit', icon: BarChart3 },
    { id: 'execution', label: '30/60/90 Plan', icon: Target },
  ]},
  { id: 'appointments', label: 'Appointments', icon: CalendarIcon, type: 'standalone' },
  { id: 'sales-group', label: 'Sales', icon: Briefcase, type: 'group', items: [
    { id: 'pipeline', label: 'Pipeline', icon: Briefcase },
    { id: 'leads', label: 'Leads', icon: MapPin },
    { id: 'followups', label: 'Follow-Ups', icon: PhoneForwarded },
    { id: 'business-db', label: 'Business Database', icon: Database },
  ]},
  { id: 'finance-group', label: 'Finance', icon: DollarSign, type: 'group', items: [
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'invoices', label: 'Invoices', icon: FileSpreadsheet },
    { id: 'profit', label: 'Profit', icon: TrendingUp },
    { id: 'taxes', label: 'Taxes', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]},
  { id: 'projects', label: 'Projects', icon: FolderKanban, type: 'standalone' },
  { id: 'research', label: 'Research', icon: BarChart2, type: 'standalone' },
  { id: 'admin-group', label: 'Admin', icon: Settings, type: 'group', items: [
    { id: 'users', label: 'Users & Roles', icon: Shield },
    { id: 'email-templates', label: 'Email Templates', icon: Mail },
    { id: 'tiers', label: 'Tiers', icon: Layers },
    { id: 'activity-log', label: 'Activity Log', icon: Activity },
  ]},
];

/* Helper: check if a group contains the active tab */
function groupContainsTab(group, tabId) {
  if (group.type !== 'group') return false;
  return group.items.some((item) => item.id === tabId);
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
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [selectedAppointments, setSelectedAppointments] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [biClientId, setBiClientId] = useState('');
  const [viewedClients, setViewedClients] = useState(() => {
    try {
      const stored = localStorage.getItem('threeseas_viewed_clients');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const markClientViewed = (clientId) => {
    setViewedClients((prev) => {
      if (prev.has(clientId)) return prev;
      const next = new Set(prev);
      next.add(clientId);
      try { localStorage.setItem('threeseas_viewed_clients', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initial = new Set();
    SIDEBAR_NAV.forEach((section) => {
      if (groupContainsTab(section, 'dashboard')) initial.add(section.id);
    });
    return initial;
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  // Auto-expand the group containing the active tab
  useEffect(() => {
    SIDEBAR_NAV.forEach((section) => {
      if (groupContainsTab(section, activeTab)) {
        setExpandedGroups((prev) => {
          if (prev.has(section.id)) return prev;
          const next = new Set(prev);
          next.add(section.id);
          return next;
        });
      }
    });
  }, [activeTab]);

  // Clear bulk selections when view or filter changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setSelectedAppointments(new Set());
    setBulkMode(false);
  }, [view, filterStatus, selectedDate]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
  const archivedFollowUpCount = appointments.filter((a) => a.followUp && a.followUp.status === 'archived').length;
  const archivedClientCount = clients.filter((c) => c.status === 'archived').length;
  const archivedCount = archivedFollowUpCount + archivedClientCount;
  const pipelineCount = prospects.filter((p) => !p.closedAt).length;
  const pendingClientCount = clients.filter((c) => c.status === 'pending').length;
  const clientCount = clients.filter((c) => c.status !== 'pending').length;
  const vipCount = clients.filter((c) => c.status === 'vip').length;
  const pendingUserCount = users.filter((u) => u.status === 'pending').length;

  // Unviewed clients: active/vip clients admin hasn't clicked on yet
  const unviewedClientCount = clients.filter((c) => c.status !== 'pending' && c.status !== 'archived' && !viewedClients.has(c.id)).length;

  // Badge counts for sidebar items — returns { count, color } or null
  // color: 'danger' = red (action needed), 'info' = blue (new/unviewed), 'warning' = amber (attention), 'neutral' = gray (informational)
  const getBadge = (tabId) => {
    switch (tabId) {
      case 'onboarding': {
        const onboardingCount = clients.filter((c) => c.onboarding && !c.onboarding.complete && c.status !== 'archived').length;
        return onboardingCount > 0 ? { count: onboardingCount, color: 'warning' } : null;
      }
      case 'clientrequests': return pendingClientCount > 0 ? { count: pendingClientCount, color: 'danger' } : null;
      case 'clients': return unviewedClientCount > 0 ? { count: unviewedClientCount, color: 'info' } : null;
      case 'clientsdb': return null; // search tool, no badge needed
      case 'archived': return archivedCount > 0 ? { count: archivedCount, color: 'neutral' } : null;
      case 'appointments': return pendingCount > 0 ? { count: pendingCount, color: 'danger' } : null;
      case 'pipeline': return pipelineCount > 0 ? { count: pipelineCount, color: 'info' } : null;
      case 'leads': return leads.length > 0 ? { count: leads.length, color: 'info' } : null;
      case 'followups': return followUpCount > 0 ? { count: followUpCount, color: 'warning' } : null;
      case 'research': return marketResearch.length > 0 ? { count: marketResearch.length, color: 'neutral' } : null;
      case 'users': return pendingUserCount > 0 ? { count: pendingUserCount, color: 'danger' } : null;
      default: return null;
    }
  };

  // Render a single sidebar item button
  const renderSidebarItem = (item, indented = false) => {
    const Icon = item.icon;
    const badge = getBadge(item.id);
    return (
      <button
        key={item.id}
        className={`sidebar-item ${activeTab === item.id ? 'active' : ''} ${indented ? 'sidebar-item-indented' : ''}`}
        onClick={() => handleTabChange(item.id)}
      >
        <Icon size={16} /> {item.label}
        {badge != null && <span className={`sidebar-badge sidebar-badge-${badge.color}`}>{badge.count}</span>}
      </button>
    );
  };

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

        {isAdminOrManager && (
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar menu">
            <Menu size={18} /> Menu
          </button>
        )}
        <div className="admin-layout">
          {/* Sidebar */}
          {isAdminOrManager && (
            <>
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
            <div className={`admin-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
              <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronDown size={18} />}
              </button>
              {sidebarOpen && (
                <nav className="sidebar-nav">
                  {SIDEBAR_NAV.map((section) => {
                    if (section.type === 'standalone') {
                      return renderSidebarItem(section);
                    }

                    // Group with collapsible items
                    const GroupIcon = section.icon;
                    const isExpanded = expandedGroups.has(section.id);
                    const hasActiveChild = section.items.some((item) => item.id === activeTab);

                    return (
                      <div key={section.id} className={`sidebar-section ${hasActiveChild ? 'has-active' : ''}`}>
                        <button
                          className={`sidebar-section-header ${isExpanded ? 'expanded' : ''}`}
                          onClick={() => toggleGroup(section.id)}
                          aria-expanded={isExpanded}
                        >
                          <GroupIcon size={14} />
                          <span className="sidebar-section-label">{section.label}</span>
                          <ChevronRight size={14} className={`sidebar-chevron ${isExpanded ? 'rotated' : ''}`} />
                        </button>
                        <div className={`sidebar-section-items ${isExpanded ? 'expanded' : ''}`}>
                          {section.items.map((item) => renderSidebarItem(item, true))}
                        </div>
                      </div>
                    );
                  })}
                </nav>
              )}
            </div>
            </>
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
        {activeTab === 'onboarding' && isAdminOrManager && <OnboardingTab />}
        {activeTab === 'clients' && canViewClients && <ClientsTab onClientViewed={markClientViewed} />}
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
        {/* Business Intelligence tabs (Phase 6A + 6C) — wrapped in ErrorBoundary */}
        {activeTab === 'intake' && isAdminOrManager && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><IntakeForm biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'audit-queue' && isAdminOrManager && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><AuditQueue biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'audit-scoring' && isAdminOrManager && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><AuditScoring biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'health-overview' && isAdminOrManager && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><HealthOverview biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'recommendations' && isAdminOrManager && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><RecommendationsBuilder biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'client-analytics' && isAdminOrManager && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><ClientAnalytics biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'client-financials' && isAdminOrManager && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><ClientFinancials biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'interventions' && isAdminOrManager && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><InterventionTracker biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'revenue-audit' && isAdminOrManager && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><RevenueAuditTab biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'execution' && isAdminOrManager && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><ExecutionTracker biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
          </div>
        </div>
      </div>
    </div>
  );
}
