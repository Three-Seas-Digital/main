import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
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
  Database, PieChart, Crosshair, Target, ClipboardCheck, Plus,
  AlertTriangle, Filter, Grid3x3, Calculator, Brain,
} from 'lucide-react';
import Calendar from '../components/Calendar';
import { useAppContext } from '../context/AppContext';
import { safeGetItem, safeSetItem } from '../constants';
import AdminSetup from '../components/admin/AdminSetup';
import AdminLogin from '../components/admin/AdminLogin';
import NotificationsDropdown from '../components/admin/NotificationsDropdown';
import { StatusBadge, RoleBadge, FollowUpBadge, formatDisplayDate, exportToICal } from '../components/admin/adminUtils';
import ErrorBoundary from '../components/ErrorBoundary';

/* ===== Lazy-loaded tab components ===== */
const DashboardHomeTab = lazy(() => import('../components/admin/DashboardHomeTab'));
const FollowUpsTab = lazy(() => import('../components/admin/FollowUpsTab'));
const PipelineTab = lazy(() => import('../components/admin/PipelineTab'));
const ClientRequestsTab = lazy(() => import('../components/admin/ClientRequestsTab'));
const ClientsTab = lazy(() => import('../components/admin/ClientsTab'));
const UserManagement = lazy(() => import('../components/admin/UserManagement'));
const ExpensesTab = lazy(() => import('../components/admin/ExpensesTab'));
const RevenueTab = lazy(() => import('../components/admin/RevenueTab'));
const InvoicesTab = lazy(() => import('../components/admin/InvoicesTab'));
const ProfitTab = lazy(() => import('../components/admin/ProfitTab'));
const TaxesTab = lazy(() => import('../components/admin/TaxesTab'));
const AnalyticsTab = lazy(() => import('../components/admin/AnalyticsTab'));
const LeadsTab = lazy(() => import('../components/admin/LeadsTab'));
const BusinessDatabaseTab = lazy(() => import('../components/admin/BusinessDatabaseTab'));
const ResearchTab = lazy(() => import('../components/admin/ResearchTab'));
const ArchivedTab = lazy(() => import('../components/admin/ArchivedTab'));
const OnboardingTab = lazy(() => import('../components/admin/OnboardingTab'));
const TiersTab = lazy(() => import('../components/admin/TiersTab'));
const ClientsDatabaseTab = lazy(() => import('../components/admin/ClientsDatabaseTab'));
const KanbanView = lazy(() => import('../components/admin/KanbanView'));
const TemplatesManagerTab = lazy(() => import('../components/admin/TemplatesManagerTab'));

/* ===== Lazy-loaded Business Intelligence tabs ===== */
const IntakeForm = lazy(() => import('../components/admin/BusinessIntelligence/IntakeForm'));
const AuditQueue = lazy(() => import('../components/admin/BusinessIntelligence/AuditQueue'));
const AuditScoring = lazy(() => import('../components/admin/BusinessIntelligence/AuditScoring'));
const RecommendationsBuilder = lazy(() => import('../components/admin/BusinessIntelligence/RecommendationsBuilder'));
const ClientAnalytics = lazy(() => import('../components/admin/BusinessIntelligence/ClientAnalytics'));
const ClientFinancials = lazy(() => import('../components/admin/BusinessIntelligence/ClientFinancials'));
const InterventionTracker = lazy(() => import('../components/admin/BusinessIntelligence/InterventionTracker'));
const KPIDashboard = lazy(() => import('../components/admin/BusinessIntelligence/KPIDashboard'));
const ExecutionTracker = lazy(() => import('../components/admin/BusinessIntelligence/ExecutionTracker'));
const HealthOverview = lazy(() => import('../components/admin/BusinessIntelligence/HealthOverview'));
const SWOTAnalysis = lazy(() => import('../components/admin/BusinessIntelligence/SWOTAnalysis'));
const PortersFiveForces = lazy(() => import('../components/admin/BusinessIntelligence/PortersFiveForces'));
const MarketSizing = lazy(() => import('../components/admin/BusinessIntelligence/MarketSizing'));
const RiskAssessment = lazy(() => import('../components/admin/BusinessIntelligence/RiskAssessment'));
const JourneyFunnel = lazy(() => import('../components/admin/BusinessIntelligence/JourneyFunnel'));
const ForecastingEngine = lazy(() => import('../components/admin/BusinessIntelligence/ForecastingEngine'));
const AIAdvisor = lazy(() => import('../components/admin/BusinessIntelligence/AIAdvisor'));


/* ===== Sidebar navigation structure ===== */
const SIDEBAR_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, type: 'standalone', permission: 'view_dashboard' },
  { id: 'clients-group', label: 'Clients', icon: UserCheck, type: 'group', permission: 'view_clients', items: [
    { id: 'clients', label: 'All Clients', icon: Users, permission: 'view_clients' },
    { id: 'clientrequests', label: 'Client Requests', icon: UserPlus, permission: 'approve_clients' },
    { id: 'clientsdb', label: 'Clients Database', icon: Database, permission: 'view_clients' },
    { id: 'archived', label: 'Archived', icon: FolderKanban, permission: 'manage_clients' },
  ]},
  { id: 'bi-group', label: 'Business Intelligence', icon: Search, type: 'group', permission: 'view_bi', items: [
    { id: 'intake', label: 'Intake Forms', icon: ClipboardList, permission: 'manage_bi' },
    { id: 'audit-queue', label: 'Audit Queue', icon: Eye, permission: 'view_bi' },
    { id: 'audit-scoring', label: 'Audit Scoring', icon: BarChart3, permission: 'manage_bi' },
    { id: 'kpi-dashboard', label: 'KPI Dashboard', icon: Activity, permission: 'view_bi' },
    { id: 'client-analytics', label: 'Client Analytics', icon: PieChart, permission: 'view_bi' },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb, permission: 'manage_bi' },
    { id: 'client-financials', label: 'Client Financials', icon: DollarSign, permission: 'manage_bi' },
    { id: 'interventions', label: 'Interventions', icon: Crosshair, permission: 'manage_bi' },
    { id: 'execution', label: '30/60/90 Plan', icon: Target, permission: 'manage_bi' },
    { id: 'health-overview', label: 'Health Overview', icon: Grid3x3, permission: 'view_bi' },
    { id: 'swot', label: 'SWOT Analysis', icon: Shield, permission: 'manage_bi' },
    { id: 'porters', label: "Porter's Five Forces", icon: Layers, permission: 'manage_bi' },
    { id: 'market-sizing', label: 'Market Sizing', icon: Calculator, permission: 'manage_bi' },
    { id: 'risk', label: 'Risk Assessment', icon: AlertTriangle, permission: 'view_bi' },
    { id: 'funnel', label: 'Journey Funnel', icon: Filter, permission: 'view_bi' },
    { id: 'forecasting', label: 'Forecasting', icon: TrendingUp, permission: 'view_bi' },
    { id: 'ai-advisor', label: 'AI Advisor', icon: Brain, permission: 'manage_bi' },
  ]},
  { id: 'business-db', label: 'Business Database', icon: Database, type: 'standalone', permission: 'view_sales' },
  { id: 'appointments', label: 'Appointments', icon: CalendarIcon, type: 'standalone', permission: 'view_appointments' },
  { id: 'sales-group', label: 'Sales', icon: Briefcase, type: 'group', permission: 'view_sales', items: [
    { id: 'pipeline', label: 'Pipeline', icon: Briefcase, permission: 'view_sales' },
    { id: 'leads', label: 'Leads', icon: MapPin, permission: 'view_sales' },
    { id: 'followups', label: 'Follow-Ups', icon: PhoneForwarded, permission: 'manage_appointments' },
  ]},
  { id: 'finance-group', label: 'Finance', icon: DollarSign, type: 'group', permission: 'view_finance', items: [
    { id: 'revenue', label: 'Revenue', icon: DollarSign, permission: 'view_finance' },
    { id: 'expenses', label: 'Expenses', icon: Receipt, permission: 'view_finance' },
    { id: 'invoices', label: 'Invoices', icon: FileSpreadsheet, permission: 'view_finance' },
    { id: 'profit', label: 'Profit', icon: TrendingUp, permission: 'view_finance' },
    { id: 'taxes', label: 'Taxes', icon: FileText, permission: 'view_finance' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, permission: 'view_finance' },
  ]},
  { id: 'projects', label: 'Projects', icon: FolderKanban, type: 'standalone', permission: 'view_projects' },
  { id: 'research', label: 'Research', icon: BarChart2, type: 'standalone', permission: 'view_research' },
  { id: 'admin-group', label: 'Admin', icon: Settings, type: 'group', permission: 'manage_users', items: [
    { id: 'users', label: 'Users & Roles', icon: Shield, permission: 'manage_users' },
    { id: 'email-templates', label: 'Email Templates', icon: Mail, permission: 'manage_settings' },
    { id: 'tiers', label: 'Tiers', icon: Layers, permission: 'manage_settings' },
    { id: 'templates-mgr', label: 'Templates', icon: FileText, permission: 'manage_settings' },
    { id: 'activity-log', label: 'Activity Log', icon: Activity, permission: 'manage_settings' },
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
    appointments, addAppointment, updateAppointmentStatus, deleteAppointment, assignAppointment,
    currentUser, needsSetup, logout, hasPermission, clients, users, STAFF_COLORS, prospects, leads, marketResearch, businessDatabase,
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
  const [showNewApptForm, setShowNewApptForm] = useState(false);
  const [newAppt, setNewAppt] = useState({ name: '', email: '', phone: '', service: '', date: '', time: '', message: '', clientId: '' });
  const [clientSearch, setClientSearch] = useState('');
  const [viewedClients, setViewedClients] = useState(() => {
    const stored = safeGetItem('threeseas_viewed_clients', []);
    return new Set(stored);
  });

  const markClientViewed = (clientId) => {
    setViewedClients((prev) => {
      if (prev.has(clientId)) return prev;
      const next = new Set(prev);
      next.add(clientId);
      safeSetItem('threeseas_viewed_clients', JSON.stringify([...next]));
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

  const canManageAppointments = hasPermission('manage_appointments');
  const canConfirmAppointments = hasPermission('confirm_appointments') || canManageAppointments;
  const canManageUsers = hasPermission('manage_users');
  const canManageClients = hasPermission('manage_clients');
  const canViewClients = hasPermission('view_clients') || canManageClients;
  const canViewSales = hasPermission('view_sales');
  const canViewFinance = hasPermission('view_finance');
  const canViewBI = hasPermission('view_bi');
  const canViewResearch = hasPermission('view_research');
  const canViewProjects = hasPermission('view_projects');
  const canManageSettings = hasPermission('manage_settings');
  const hasSidebar = hasPermission('view_clients') || canViewSales || canViewFinance || canViewBI || canViewResearch || canManageUsers || canManageSettings;

  const filtered = useMemo(() => appointments
    .filter((a) => (filterStatus === 'all' ? true : a.status === filterStatus))
    .filter((a) => (selectedDate ? a.date === selectedDate : true))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  [appointments, filterStatus, selectedDate]);

  const { pendingCount, followUpCount, archivedCount, pipelineCount, pendingClientCount, clientCount, vipCount, pendingUserCount, unviewedClientCount } = useMemo(() => {
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
    const unviewedClientCount = clients.filter((c) => c.status !== 'pending' && c.status !== 'archived' && !viewedClients.has(c.id)).length;
    return { pendingCount, followUpCount, archivedCount, pipelineCount, pendingClientCount, clientCount, vipCount, pendingUserCount, unviewedClientCount };
  }, [appointments, clients, prospects, users, viewedClients]);

  // Badge counts for sidebar items — returns { count, color } or null
  // color: 'danger' = red (action needed), 'info' = blue (new/unviewed), 'warning' = amber (attention), 'neutral' = gray (informational)
  const getBadge = (tabId) => {
    switch (tabId) {
      case 'clientrequests': return pendingClientCount > 0 ? { count: pendingClientCount, color: 'danger' } : null;
      case 'clients': return unviewedClientCount > 0 ? { count: unviewedClientCount, color: 'info' } : null;
      case 'clientsdb': return null; // search tool, no badge needed
      case 'archived': return archivedCount > 0 ? { count: archivedCount, color: 'neutral' } : null;
      case 'appointments': return pendingCount > 0 ? { count: pendingCount, color: 'danger' } : null;
      case 'pipeline': return pipelineCount > 0 ? { count: pipelineCount, color: 'info' } : null;
      case 'leads': return leads.length > 0 ? { count: leads.length, color: 'info' } : null;
      case 'business-db': return businessDatabase.length > 0 ? { count: businessDatabase.length, color: 'neutral' } : null;
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

        {hasSidebar && (
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar menu">
            <Menu size={18} /> Menu
          </button>
        )}
        <div className="admin-layout">
          {/* Sidebar */}
          {hasSidebar && (
            <>
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
            <div className={`admin-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
              <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronDown size={18} />}
              </button>
              {sidebarOpen && (
                <nav className="sidebar-nav">
                  {SIDEBAR_NAV.map((section) => {
                    // Skip items the user doesn't have permission for
                    if (section.permission && !hasPermission(section.permission)) return null;

                    if (section.type === 'standalone') {
                      return renderSidebarItem(section);
                    }

                    // Group with collapsible items — filter children by permission
                    const visibleItems = section.items.filter((item) => !item.permission || hasPermission(item.permission));
                    if (visibleItems.length === 0) return null;

                    const GroupIcon = section.icon;
                    const isExpanded = expandedGroups.has(section.id);
                    const hasActiveChild = visibleItems.some((item) => item.id === activeTab);

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
                          {visibleItems.map((item) => renderSidebarItem(item, true))}
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
              {canViewSales && (
                <button className={`admin-tab ${activeTab === 'pipeline' ? 'active' : ''}`} onClick={() => setActiveTab('pipeline')}>
                  <Briefcase size={16} /> Pipeline {pipelineCount > 0 && <span className="tab-badge">{pipelineCount}</span>}
                </button>
              )}
              {canManageClients && (() => {
                const onboardingCount = clients.filter((c) => c.onboarding && !c.onboarding.complete && c.status !== 'archived').length;
                return (
                  <button className={`admin-tab ${activeTab === 'onboarding' ? 'active' : ''}`} onClick={() => setActiveTab('onboarding')}>
                    <ClipboardCheck size={16} /> Onboarding {onboardingCount > 0 && <span className="tab-badge">{onboardingCount}</span>}
                  </button>
                );
              })()}
              {canViewClients && (
                <button className={`admin-tab ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => setActiveTab('clients')}>
                  <UserCheck size={16} /> Clients {vipCount > 0 && <span className="tab-badge vip-tab-badge">{vipCount} VIP</span>}
                </button>
              )}
            </div>

        <Suspense fallback={<div className="tab-loading">Loading...</div>}>
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
                {canManageAppointments && (
                  <button className="btn btn-sm btn-primary" onClick={() => setShowNewApptForm(!showNewApptForm)}>
                    <Plus size={14} /> New Appointment
                  </button>
                )}
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
            {showNewApptForm && canManageAppointments && (() => {
              const filteredClients = clientSearch.trim()
                ? clients.filter((c) => c.status !== 'archived' && c.status !== 'pending' && (
                    c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                    c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                    c.businessName?.toLowerCase().includes(clientSearch.toLowerCase())
                  )).slice(0, 8)
                : [];
              const handleSelectClient = (c) => {
                setNewAppt((prev) => ({ ...prev, name: c.name, email: c.email, phone: c.phone || '', clientId: c.id }));
                setClientSearch('');
              };
              const handleClearClient = () => {
                setNewAppt((prev) => ({ ...prev, name: '', email: '', phone: '', clientId: '' }));
              };
              const handleSubmitAppt = (e) => {
                e.preventDefault();
                if (!newAppt.name || !newAppt.date || !newAppt.time) return;
                addAppointment({ name: newAppt.name, email: newAppt.email, phone: newAppt.phone, service: newAppt.service, date: newAppt.date, time: newAppt.time, message: newAppt.message, clientId: newAppt.clientId || undefined });
                setNewAppt({ name: '', email: '', phone: '', service: '', date: '', time: '', message: '', clientId: '' });
                setShowNewApptForm(false);
              };
              return (
                <div className="new-appt-form-panel" style={{ background: 'var(--gray-50, #f9fafb)', border: '1px solid var(--gray-200, #e5e7eb)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>New Appointment</h3>
                  <form onSubmit={handleSubmitAppt}>
                    <div style={{ marginBottom: '12px', position: 'relative' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Link to Client (optional)</label>
                      {newAppt.clientId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--primary-bg, #eff6ff)', borderRadius: '6px', fontSize: '0.9rem' }}>
                          <UserCheck size={14} />
                          <span style={{ flex: 1 }}>{newAppt.name} ({newAppt.email})</span>
                          <button type="button" className="btn btn-sm btn-outline" onClick={handleClearClient} style={{ fontSize: '0.8rem', padding: '2px 8px' }}>Clear</button>
                        </div>
                      ) : (
                        <>
                          <input type="text" placeholder="Search clients by name, email, or business..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="form-input" style={{ width: '100%' }} />
                          {filteredClients.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'white', border: '1px solid var(--gray-200, #e5e7eb)', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
                              {filteredClients.map((c) => (
                                <div key={c.id} onClick={() => handleSelectClient(c)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--gray-100, #f3f4f6)', fontSize: '0.85rem' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50, #f9fafb)'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                                  <strong>{c.name}</strong> — {c.email} {c.businessName && <span style={{ color: 'var(--gray-500)', marginLeft: '4px' }}>({c.businessName})</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Name *</label>
                        <input type="text" required value={newAppt.name} onChange={(e) => setNewAppt((p) => ({ ...p, name: e.target.value }))} className="form-input" style={{ width: '100%' }} disabled={!!newAppt.clientId} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Email</label>
                        <input type="email" value={newAppt.email} onChange={(e) => setNewAppt((p) => ({ ...p, email: e.target.value }))} className="form-input" style={{ width: '100%' }} disabled={!!newAppt.clientId} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Phone</label>
                        <input type="tel" value={newAppt.phone} onChange={(e) => setNewAppt((p) => ({ ...p, phone: e.target.value }))} className="form-input" style={{ width: '100%' }} disabled={!!newAppt.clientId} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Date *</label>
                        <input type="date" required value={newAppt.date} onChange={(e) => setNewAppt((p) => ({ ...p, date: e.target.value }))} className="form-input" style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Time *</label>
                        <input type="time" required value={newAppt.time} onChange={(e) => setNewAppt((p) => ({ ...p, time: e.target.value }))} className="form-input" style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Service</label>
                        <select value={newAppt.service} onChange={(e) => setNewAppt((p) => ({ ...p, service: e.target.value }))} className="form-input" style={{ width: '100%' }}>
                          <option value="">Select a service</option>
                          <option value="web-design">Web Design</option>
                          <option value="branding">Branding</option>
                          <option value="marketing">Digital Marketing</option>
                          <option value="app-dev">App Development</option>
                          <option value="consulting">Consulting</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Message</label>
                      <textarea value={newAppt.message} onChange={(e) => setNewAppt((p) => ({ ...p, message: e.target.value }))} className="form-input" rows={2} style={{ width: '100%', resize: 'vertical' }} placeholder="Optional notes..." />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="submit" className="btn btn-sm btn-primary"><Plus size={14} /> Create Appointment</button>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => { setShowNewApptForm(false); setNewAppt({ name: '', email: '', phone: '', service: '', date: '', time: '', message: '', clientId: '' }); setClientSearch(''); }}>Cancel</button>
                    </div>
                  </form>
                </div>
              );
            })()}
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
        {activeTab === 'pipeline' && canViewSales && <PipelineTab />}
        {activeTab === 'onboarding' && canManageClients && <OnboardingTab />}
        {activeTab === 'clients' && canViewClients && <ClientsTab onClientViewed={markClientViewed} />}
        {activeTab === 'clientrequests' && hasPermission('approve_clients') && <ClientRequestsTab />}
        {activeTab === 'users' && canManageUsers && <UserManagement />}
        {activeTab === 'revenue' && canViewFinance && <RevenueTab />}
        {activeTab === 'invoices' && canViewFinance && <InvoicesTab />}
        {activeTab === 'expenses' && canViewFinance && <ExpensesTab />}
        {activeTab === 'profit' && canViewFinance && <ProfitTab />}
        {activeTab === 'taxes' && canViewFinance && <TaxesTab />}
        {activeTab === 'analytics' && canViewFinance && <AnalyticsTab />}
        {activeTab === 'leads' && canViewSales && <LeadsTab />}
        {activeTab === 'business-db' && canViewSales && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><BusinessDatabaseTab /></Suspense></ErrorBoundary>}
        {activeTab === 'research' && canViewResearch && <ResearchTab />}
        {activeTab === 'archived' && canManageClients && <ArchivedTab />}
        {activeTab === 'tiers' && canManageSettings && <TiersTab />}
        {activeTab === 'templates-mgr' && canManageSettings && <TemplatesManagerTab />}
        {activeTab === 'clientsdb' && canViewClients && <ClientsDatabaseTab />}
        </Suspense>
        {/* Business Intelligence tabs (Phase 6A + 6C) — wrapped in ErrorBoundary */}
        {activeTab === 'intake' && canViewBI && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><IntakeForm biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'audit-queue' && canViewBI && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><AuditQueue biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'audit-scoring' && canViewBI && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><AuditScoring biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'recommendations' && canViewBI && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><RecommendationsBuilder biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'client-analytics' && canViewBI && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><ClientAnalytics biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'client-financials' && canViewBI && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><ClientFinancials biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'interventions' && canViewBI && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><InterventionTracker biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'kpi-dashboard' && canViewBI && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><KPIDashboard biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'execution' && canViewBI && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><ExecutionTracker biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'health-overview' && canViewBI && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><HealthOverview biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'swot' && canViewBI && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><SWOTAnalysis biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'porters' && canViewBI && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><PortersFiveForces biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'market-sizing' && canViewBI && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><MarketSizing biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'risk' && canViewBI && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><RiskAssessment biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'funnel' && canViewBI && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><JourneyFunnel biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'forecasting' && canViewBI && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><ForecastingEngine biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
        {activeTab === 'ai-advisor' && canViewBI && <ErrorBoundary><Suspense fallback={<div className="tab-loading">Loading...</div>}><AIAdvisor biClientId={biClientId} onBiClientChange={setBiClientId} /></Suspense></ErrorBoundary>}
          </div>
        </div>
      </div>
    </div>
  );
}
