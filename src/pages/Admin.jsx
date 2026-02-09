import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  LogOut, CalendarDays, Clock, User, Mail, Phone, Trash2,
  CheckCircle, XCircle, AlertCircle, BarChart3, Users,
  Calendar as CalendarIcon, UserPlus, Shield, Edit3, Eye,
  PhoneForwarded, UserCheck, MessageSquare, Plus, X, Tag, FileText,
  ArrowRight, ChevronLeft, ChevronUp, ChevronDown, Briefcase, Send, FolderKanban,
  DollarSign, Receipt, CreditCard, MapPin, TrendingUp, Printer,
  Filter, PhoneCall, Building2, ExternalLink, Search, Globe, Layers,
  BarChart2, PieChart as PieChartIcon, Activity, Home, Wallet, GraduationCap, Baby,
  Coffee, Trees, Landmark, RefreshCw, Zap, Download, Upload, Copy,
  CheckSquare, Square, MoreHorizontal,
  FileSpreadsheet, ClipboardList, LayoutDashboard,
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart,
} from 'recharts';
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
