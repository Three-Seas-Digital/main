import { useState, useEffect } from 'react';
import {
  LogOut, CalendarDays, Clock, User, Mail, Phone, Trash2,
  CheckCircle, XCircle, AlertCircle, BarChart3, Users,
  Calendar as CalendarIcon, UserPlus, Shield, UserCheck,
  PhoneForwarded, MessageSquare, X,
  ChevronLeft, ChevronDown, Briefcase, FolderKanban,
  DollarSign, Receipt, MapPin, TrendingUp,
  BarChart2, Download, CheckSquare, Square,
  FileSpreadsheet, LayoutDashboard, FileText, Layers,
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
import TiersTab from '../components/admin/TiersTab';
import ClientsDatabaseTab from '../components/admin/ClientsDatabaseTab';
import KanbanView from '../components/admin/KanbanView';

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
