import { useState, useMemo, useEffect } from 'react';
import {
  Users, Search, X, Download,
  ChevronLeft, ChevronUp, ChevronDown,
  CheckSquare, Square,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function ClientsDatabaseTab() {
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
          case 'tier': {
            const tierOrder = { enterprise: 4, premium: 3, basic: 2, free: 1 };
            cmp = (tierOrder[b.tier] || 0) - (tierOrder[a.tier] || 0);
            break;
          }
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

  // Reset page when filters change
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterTier, filterSource, filterHasProjects, filterHasInvoices, sortBy, sortDir, pageSize]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / pageSize);
  const paginatedClients = filteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
