import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  LogOut, CalendarDays, Clock, User, Mail, Phone, Trash2,
  CheckCircle, XCircle, AlertCircle, BarChart3, Users,
  Calendar as CalendarIcon, UserPlus, Shield, UserCheck,
  PhoneForwarded, MessageSquare, X, FileText,
  ChevronLeft, ChevronUp, ChevronDown, Briefcase, FolderKanban,
  DollarSign, Receipt, MapPin, TrendingUp, Search, Layers,
  BarChart2, Download, CheckSquare, Square,
  FileSpreadsheet, LayoutDashboard,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Calendar from '../components/Calendar';
import { useAppContext } from '../context/AppContext';
import AdminSetup from '../components/admin/AdminSetup';
import AdminLogin from '../components/admin/AdminLogin';
import NotificationsDropdown from '../components/admin/NotificationsDropdown';
import DashboardHomeTab from '../components/admin/DashboardHomeTab';
import TimeTracker from '../components/admin/TimeTracker';
import { StatusBadge, RoleBadge, FollowUpBadge, TierBadge, formatDisplayDate, exportToICal } from '../components/admin/adminUtils';
import FollowUpsTab from '../components/admin/FollowUpsTab';
import PipelineTab from '../components/admin/PipelineTab';
import ClientRequestsTab from '../components/admin/ClientRequestsTab';
import ProjectBoard from '../components/admin/ProjectBoard';
import ClientsTab from '../components/admin/ClientsTab';

import UserManagement from '../components/admin/UserManagement';
import ExpensesTab from '../components/admin/ExpensesTab';

import RevenueTab from '../components/admin/RevenueTab';
import InvoicesTab from '../components/admin/InvoicesTab';
import ProfitTab from '../components/admin/ProfitTab';
import TaxesTab from '../components/admin/TaxesTab';

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

import AnalyticsTab from '../components/admin/AnalyticsTab';
import LeadsTab from '../components/admin/LeadsTab';
import ResearchTab from '../components/admin/ResearchTab';

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
