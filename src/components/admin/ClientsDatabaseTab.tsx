import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, Search, X, Download,
  ChevronLeft, ChevronUp, ChevronDown,
  CheckSquare, Square,
  FileText, Briefcase, BarChart3, Activity, Clock, DollarSign,
  Target, Lightbulb, ChevronRight, Crosshair, Star, MessageSquare, FolderOpen,
  User, Mail, Phone, Globe, MapPin, Building2, Calendar,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { safeGetItem } from '../../constants';

export default function ClientsDatabaseTab() {
  const { clients, payments, SUBSCRIPTION_TIERS, businessDatabase, prospects } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterHasProjects, setFilterHasProjects] = useState('all');
  const [filterHasInvoices, setFilterHasInvoices] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Get unique values for filters
  const sources = useMemo(() => {
    const s = new Set(clients.map((c: any) => c.source).filter(Boolean));
    return Array.from(s).sort();
  }, [clients]);

  // Score map for table column + sorting (must be above filteredClients which depends on it)
  const scoreMap = useMemo(() => {
    const allAudits = safeGetItem('threeseas_bi_audits', []);
    const map: Record<string, any> = {};
    allAudits.forEach((a: any) => {
      if (!map[a.clientId] || new Date(a.createdAt) > new Date(map[a.clientId].createdAt)) {
        map[a.clientId] = a;
      }
    });
    const scores: Record<string, number | null> = {};
    Object.entries(map).forEach(([cid, audit]: [string, any]) => {
      const vals = Object.values(audit.scores || {}).filter((v: any) => typeof v === 'number' && v > 0) as number[];
      scores[cid] = vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : null;
    });
    return scores;
  }, [clients]);

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    return clients
      .filter((c: any) => c.status !== 'pending') // Exclude pending registrations
      .filter((c: any) => {
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
          case 'score':
            cmp = (scoreMap[b.id] || 0) - (scoreMap[a.id] || 0);
            break;
          case 'newest':
          default:
            cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            break;
        }
        return sortDir === 'desc' ? cmp : -cmp;
      });
  }, [clients, search, filterStatus, filterTier, filterSource, filterHasProjects, filterHasInvoices, sortBy, sortDir, scoreMap]);

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
    const activeClients = clients.filter((c: any) => c.status === 'active' || c.status === 'vip');
    const totalRevenue = payments.filter((p) => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);
    const tierCounts: Record<string, number> = {};
    Object.keys(SUBSCRIPTION_TIERS).forEach((t: string) => { tierCounts[t] = 0; });
    activeClients.forEach((c: any) => {
      if (tierCounts[c.tier] !== undefined) tierCounts[c.tier]++;
    });
    return {
      total: clients.filter((c: any) => c.status !== 'pending').length,
      active: activeClients.length,
      archived: clients.filter((c: any) => c.status === 'archived').length,
      vip: clients.filter((c: any) => c.status === 'vip').length,
      totalRevenue,
      tierCounts,
    };
  }, [clients, payments, SUBSCRIPTION_TIERS]);

  // Compiled BI data for expanded client
  const expandedData = useMemo(() => {
    if (!expandedClientId) return null;
    const client = clients.find(c => c.id === expandedClientId);
    if (!client) return null;

    // BI Data
    const intakes = safeGetItem('threeseas_bi_intakes', {});
    const intake = intakes[expandedClientId] || null;

    const allAudits = safeGetItem('threeseas_bi_audits', []);
    const audits = allAudits.filter((a: any) => a.clientId === expandedClientId);
    const latestAudit = audits.length ? audits.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : null;

    const allRecs = safeGetItem('threeseas_bi_recommendations', {});
    const recs: any[] = [];
    audits.forEach((a: any) => { (allRecs[a.id] || []).forEach((r: any) => recs.push(r)); });

    const financials = safeGetItem('threeseas_bi_client_financials', {});
    const finData = financials[expandedClientId];
    const finEntries = finData?.entries || [];
    const totalRevenue = finEntries.reduce((s: number, e: any) => s + (e.revenue || 0), 0);
    const totalExpenses = finEntries.reduce((s: number, e: any) => s + (e.expenses || 0), 0);

    const allTargets = safeGetItem('threeseas_bi_growth_targets', []);
    const targets = allTargets.filter(t => t.clientId === expandedClientId);

    const allInterventions = safeGetItem('threeseas_bi_interventions', {});
    const interventions = allInterventions[expandedClientId]?.interventions || [];

    // Compute overall audit score from latest audit
    let overallScore = null;
    if (latestAudit?.scores) {
      const vals = Object.values(latestAudit.scores).filter((v: any) => typeof v === 'number' && v > 0) as number[];
      overallScore = vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : null;
    }

    // Projects summary
    const projects = client.projects || [];
    const activeProjects = projects.filter(p => p.status === 'in-progress' || p.status === 'planning' || p.status === 'review');
    const completedProjects = projects.filter(p => p.status === 'completed' || p.status === 'archived');

    // Invoices summary
    const invoices = client.invoices || [];
    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const unpaidInvoices = invoices.filter(i => i.status !== 'paid');
    const invoiceTotal = invoices.reduce((s, i) => s + (i.amount || 0), 0);
    const paidTotal = paidInvoices.reduce((s, i) => s + (i.amount || 0), 0);

    // Business Database entry (matched by name)
    const bizEntry = businessDatabase.find(b =>
      b.name && client.name && b.name.toLowerCase().trim() === client.name.toLowerCase().trim()
    ) || null;

    // Source prospect (if converted from pipeline)
    const sourceProspect = client.sourceProspectId
      ? prospects.find(p => p.id === client.sourceProspectId) || null
      : null;

    // Point of contact info (compiled from enrichment + client)
    const poc = {
      name: bizEntry?.enrichment?.pointOfContact || client.name || '',
      email: bizEntry?.enrichment?.contactEmail || client.email || '',
      phone: bizEntry?.enrichment?.contactPhone || client.phone || '',
      website: bizEntry?.website || client.website || '',
      address: bizEntry?.address || '',
      decisionMaker: bizEntry?.enrichment?.decisionMaker || '',
      directEmail: bizEntry?.enrichment?.directEmail || '',
    };

    return {
      client, intake, audits, latestAudit, overallScore, recs,
      finEntries, totalRevenue, totalExpenses,
      targets, interventions,
      projects, activeProjects, completedProjects,
      invoices, paidInvoices, unpaidInvoices, invoiceTotal, paidTotal,
      notes: client.notes || [],
      tags: client.tags || [],
      documents: client.documents || [],
      bizEntry, sourceProspect, poc,
    };
  }, [expandedClientId, clients, businessDatabase, prospects]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const toggleSelectClient = (id: string) => {
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
      setSelectedClients(new Set(paginatedClients.map((c: any) => c.id)));
    }
  };

  const exportToCSV = () => {
    const data = (selectedClients.size > 0 ? filteredClients.filter((c: any) => selectedClients.has(c.id)) : filteredClients);
    const headers = ['Name', 'Email', 'Phone', 'Business', 'Status', 'Tier', 'Source', 'Projects', 'Invoices', 'Health Score', 'BI Revenue', 'Interventions', 'Recommendations', 'Notes Count', 'Created'];

    const allAudits = safeGetItem('threeseas_bi_audits', []);
    const allFinancials = safeGetItem('threeseas_bi_client_financials', {});
    const allInterventions = safeGetItem('threeseas_bi_interventions', {});
    const allRecs = safeGetItem('threeseas_bi_recommendations', {});

    const rows = data.map((c: any) => {
      const clientAudits = allAudits.filter(a => a.clientId === c.id);
      const latest = clientAudits.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      const vals = latest?.scores ? (Object.values(latest.scores).filter((v: any) => typeof v === 'number' && v > 0) as number[]) : [];
      const score = vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : '';
      const fin = allFinancials[c.id]?.entries || [];
      const biRev = fin.reduce((s, e) => s + (e.revenue || 0), 0);
      const ivs = allInterventions[c.id]?.interventions || [];
      let recCount = 0;
      clientAudits.forEach(a => { recCount += (allRecs[a.id] || []).length; });
      return [
        c.name || '', c.email || '', c.phone || '', c.businessName || '',
        c.status || '', c.tier || '', c.source || '',
        (c.projects || []).length, (c.invoices || []).length,
        score, biRev, ivs.length, recCount, (c.notes || []).length,
        c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      ];
    });
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
        {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]: [string, any]) => (
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
            {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]: [string, any]) => (
              <option key={key} value={key}>{tier.label}</option>
            ))}
          </select>
          <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
            <option value="all">All Sources</option>
            {sources.map((s: any) => (
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
              <th className={`db-th-sortable ${sortBy === 'score' ? 'active' : ''}`} onClick={() => handleSort('score')}>
                Score {sortBy === 'score' && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </th>
              <th>Source</th>
              <th className={`db-th-sortable ${sortBy === 'projects' ? 'active' : ''}`} onClick={() => handleSort('projects')}>
                Projects {sortBy === 'projects' && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </th>
              <th className={`db-th-sortable ${sortBy === 'invoices' ? 'active' : ''}`} onClick={() => handleSort('invoices')}>
                Invoices {sortBy === 'invoices' && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </th>
              <th className={`db-th-sortable ${sortBy === 'newest' ? 'active' : ''}`} onClick={() => handleSort('newest')}>
                Created {sortBy === 'newest' && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginatedClients.length === 0 ? (
              <tr><td colSpan={12} className="db-empty">No clients found matching your criteria</td></tr>
            ) : (
              paginatedClients.map((client) => {
                const tierInfo = SUBSCRIPTION_TIERS[client.tier] || SUBSCRIPTION_TIERS.free;
                const isSelected = selectedClients.has(client.id);
                return (
                  <React.Fragment key={client.id}>
                  <tr className={`${isSelected ? 'selected' : ''} ${expandedClientId === client.id ? 'expanded-row' : ''}`}
                    onClick={() => setExpandedClientId(expandedClientId === client.id ? null : client.id)}
                    style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="db-checkbox" onClick={(e) => { e.stopPropagation(); toggleSelectClient(client.id); }}>
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
                    <td className="db-td-score">
                      {scoreMap[client.id] != null
                        ? <span className={`db-score ${scoreMap[client.id] >= 7 ? 'good' : scoreMap[client.id] >= 4 ? 'fair' : 'poor'}`}>{scoreMap[client.id].toFixed(1)}</span>
                        : <span className="db-score-none">--</span>
                      }
                    </td>
                    <td>
                      <span className="db-source-badge" style={{
                        background: client.sourceProspectId ? '#ecfdf5' : client.source === 'self-registered' ? '#eff6ff' : '#f3f4f6',
                        color: client.sourceProspectId ? '#059669' : client.source === 'self-registered' ? '#2563eb' : '#6b7280',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>
                        {client.sourceProspectId ? 'Pipeline' : client.source === 'self-registered' ? 'Self-registered' : 'Manual'}
                      </span>
                    </td>
                    <td className="db-td-count">{(client.projects || []).length}</td>
                    <td className="db-td-count">{(client.invoices || []).length}</td>
                    <td className="db-td-date">{client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="db-td-expand">
                      <ChevronRight size={16} style={{ transform: expandedClientId === client.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </td>
                  </tr>
                  </React.Fragment>
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

      {/* Full-Page Detail Overlay */}
      {expandedClientId && expandedData && (
        <div className="db-overlay" onClick={() => setExpandedClientId(null)}>
          <div className="db-overlay-panel" onClick={(e) => e.stopPropagation()}>
            {/* Overlay Header */}
            <div className="db-overlay-header">
              <div className="db-overlay-title-row">
                <div>
                  <h2>{expandedData.client.name}</h2>
                  {expandedData.client.businessName && <p className="db-overlay-business">{expandedData.client.businessName}</p>}
                </div>
                <div className="db-overlay-header-actions">
                  <div className="db-detail-badges">
                    <span className={`db-detail-badge ${expandedData.client.status}`}>
                      {expandedData.client.status === 'vip' ? 'VIP' : expandedData.client.status?.charAt(0).toUpperCase() + expandedData.client.status?.slice(1)}
                    </span>
                    {expandedData.client.tier && (
                      <span className="db-tier-badge" style={{ background: (SUBSCRIPTION_TIERS[expandedData.client.tier] || {}).color }}>
                        {(SUBSCRIPTION_TIERS[expandedData.client.tier] || {}).label || expandedData.client.tier}
                      </span>
                    )}
                    {expandedData.client.sourceProspectId && <span className="db-detail-badge pipeline">Pipeline</span>}
                  </div>
                  <button className="btn btn-sm btn-outline" onClick={() => setExpandedClientId(null)} aria-label="Close detail view">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Contact & POC Info */}
              <div className="db-overlay-contact">
                {expandedData.poc.email && <span><Mail size={14} /> {expandedData.poc.email}</span>}
                {expandedData.poc.phone && <span><Phone size={14} /> {expandedData.poc.phone}</span>}
                {expandedData.poc.website && <span><Globe size={14} /> {expandedData.poc.website}</span>}
                {expandedData.poc.address && <span><MapPin size={14} /> {expandedData.poc.address}</span>}
                {expandedData.poc.decisionMaker && <span><User size={14} /> Decision Maker: {expandedData.poc.decisionMaker}</span>}
                {expandedData.poc.directEmail && expandedData.poc.directEmail !== expandedData.poc.email && (
                  <span><Mail size={14} /> Direct: {expandedData.poc.directEmail}</span>
                )}
                {expandedData.client.createdAt && <span><Calendar size={14} /> Client since {new Date(expandedData.client.createdAt).toLocaleDateString()}</span>}
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="db-detail-stats">
              <div className="db-detail-stat">
                <BarChart3 size={16} />
                <div><strong>{expandedData.overallScore || '--'}</strong><span>Health Score</span></div>
              </div>
              <div className="db-detail-stat">
                <DollarSign size={16} />
                <div><strong>${expandedData.totalRevenue.toLocaleString()}</strong><span>Total Revenue</span></div>
              </div>
              <div className="db-detail-stat">
                <Briefcase size={16} />
                <div><strong>{expandedData.activeProjects.length}/{expandedData.projects.length}</strong><span>Active/Total Projects</span></div>
              </div>
              <div className="db-detail-stat">
                <FileText size={16} />
                <div><strong>${expandedData.paidTotal.toLocaleString()}</strong><span>Paid of ${expandedData.invoiceTotal.toLocaleString()}</span></div>
              </div>
              <div className="db-detail-stat">
                <Crosshair size={16} />
                <div><strong>{expandedData.interventions.length}</strong><span>Interventions</span></div>
              </div>
              <div className="db-detail-stat">
                <Lightbulb size={16} />
                <div><strong>{expandedData.recs.length}</strong><span>Recommendations</span></div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="db-overlay-body">
              <div className="db-detail-grid">

                {/* Business Intel from DB */}
                {expandedData.bizEntry && (
                  <div className="db-detail-section">
                    <h4><Building2 size={16} /> Business Intelligence</h4>
                    <div className="db-detail-kv">
                      {expandedData.bizEntry.type && <div><span>Business Type:</span><strong>{expandedData.bizEntry.type}</strong></div>}
                      {expandedData.bizEntry.enrichment?.industry && <div><span>Industry:</span><strong>{expandedData.bizEntry.enrichment.industry}</strong></div>}
                      {expandedData.bizEntry.enrichment?.revenue && <div><span>Est. Revenue:</span><strong>{expandedData.bizEntry.enrichment.revenue}</strong></div>}
                      {expandedData.bizEntry.enrichment?.employees && <div><span>Employees:</span><strong>{expandedData.bizEntry.enrichment.employees}</strong></div>}
                      {expandedData.bizEntry.enrichment?.yearsInBusiness && <div><span>Years in Business:</span><strong>{expandedData.bizEntry.enrichment.yearsInBusiness}</strong></div>}
                      {expandedData.bizEntry.enrichment?.googleRating && <div><span>Google Rating:</span><strong>{expandedData.bizEntry.enrichment.googleRating} ({expandedData.bizEntry.enrichment.googleReviews || 0} reviews)</strong></div>}
                      {expandedData.bizEntry.enrichment?.yelpRating && <div><span>Yelp Rating:</span><strong>{expandedData.bizEntry.enrichment.yelpRating}</strong></div>}
                      {expandedData.bizEntry.enrichment?.pipelineStatus && <div><span>Pipeline Status:</span><strong>{expandedData.bizEntry.enrichment.pipelineStatus}</strong></div>}
                      {expandedData.bizEntry.enrichment?.dealValue > 0 && <div><span>Deal Value:</span><strong>${Number(expandedData.bizEntry.enrichment.dealValue).toLocaleString()}</strong></div>}
                      {expandedData.bizEntry.enrichment?.serviceInterest && <div><span>Service Interest:</span><strong>{expandedData.bizEntry.enrichment.serviceInterest}</strong></div>}
                      {expandedData.bizEntry.enrichment?.sentToPipelineAt && <div><span>Pipeline Date:</span><strong>{new Date(expandedData.bizEntry.enrichment.sentToPipelineAt).toLocaleDateString()}</strong></div>}
                      {expandedData.bizEntry.enrichment?.convertedToClientAt && <div><span>Converted:</span><strong>{new Date(expandedData.bizEntry.enrichment.convertedToClientAt).toLocaleDateString()}</strong></div>}
                      {expandedData.bizEntry.enrichment?.notes && <div className="db-detail-full"><span>Intel Notes:</span><p>{expandedData.bizEntry.enrichment.notes}</p></div>}
                    </div>
                  </div>
                )}

                {/* Source Prospect */}
                {expandedData.sourceProspect && (
                  <div className="db-detail-section">
                    <h4><Briefcase size={16} /> Pipeline Origin</h4>
                    <div className="db-detail-kv">
                      <div><span>Stage Reached:</span><strong>{expandedData.sourceProspect.stage}</strong></div>
                      {expandedData.sourceProspect.dealValue > 0 && <div><span>Deal Value:</span><strong>${expandedData.sourceProspect.dealValue.toLocaleString()}</strong></div>}
                      {expandedData.sourceProspect.source && <div><span>Lead Source:</span><strong>{expandedData.sourceProspect.source}</strong></div>}
                      <div><span>Created:</span><strong>{new Date(expandedData.sourceProspect.createdAt).toLocaleDateString()}</strong></div>
                      {expandedData.sourceProspect.closedAt && <div><span>Closed:</span><strong>{new Date(expandedData.sourceProspect.closedAt).toLocaleDateString()}</strong></div>}
                    </div>
                  </div>
                )}

                {/* Intake Summary */}
                {expandedData.intake && (
                  <div className="db-detail-section">
                    <h4><FolderOpen size={16} /> Business Intake</h4>
                    <div className="db-detail-kv">
                      {expandedData.intake.industry && <div><span>Industry:</span><strong>{expandedData.intake.industry}</strong></div>}
                      {expandedData.intake.annual_revenue_range && <div><span>Revenue Range:</span><strong>{expandedData.intake.annual_revenue_range}</strong></div>}
                      {expandedData.intake.employee_count_range && <div><span>Employees:</span><strong>{expandedData.intake.employee_count_range}</strong></div>}
                      {expandedData.intake.current_website_url && <div><span>Website:</span><strong>{expandedData.intake.current_website_url}</strong></div>}
                      {expandedData.intake.budget_range && <div><span>Budget:</span><strong>{expandedData.intake.budget_range}</strong></div>}
                      {expandedData.intake.pain_points && <div className="db-detail-full"><span>Pain Points:</span><p>{expandedData.intake.pain_points}</p></div>}
                      {expandedData.intake.goals && <div className="db-detail-full"><span>Goals:</span><p>{expandedData.intake.goals}</p></div>}
                    </div>
                  </div>
                )}

                {/* Audit History */}
                {expandedData.audits.length > 0 && (
                  <div className="db-detail-section">
                    <h4><BarChart3 size={16} /> Audit History ({expandedData.audits.length})</h4>
                    <div className="db-detail-list">
                      {expandedData.audits.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map((audit: any) => {
                        const vals: number[] = Object.values(audit.scores || {}).filter((v: any) => typeof v === 'number' && v > 0) as number[];
                        const avg = vals.length ? (vals.reduce((x, y) => x + y, 0) / vals.length).toFixed(1) : '--';
                        return (
                          <div key={audit.id} className="db-detail-list-item">
                            <span className="db-detail-list-date">{new Date(audit.createdAt).toLocaleDateString()}</span>
                            <span className={`db-detail-score ${Number(avg) >= 7 ? 'good' : Number(avg) >= 4 ? 'fair' : 'poor'}`}>{avg}/10</span>
                            <span className={`db-detail-badge ${audit.status}`}>{audit.status}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {expandedData.projects.length > 0 && (
                  <div className="db-detail-section">
                    <h4><Briefcase size={16} /> Projects ({expandedData.projects.length})</h4>
                    <div className="db-detail-list">
                      {expandedData.projects.map(p => (
                        <div key={p.id} className="db-detail-list-item">
                          <span className="db-detail-list-title">{p.title}</span>
                          <span className={`db-detail-badge ${p.status}`}>{p.status?.replace('-', ' ')}</span>
                          {p.progress != null && <span className="db-detail-progress">{p.progress}%</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Invoices */}
                {expandedData.invoices.length > 0 && (
                  <div className="db-detail-section">
                    <h4><FileText size={16} /> Invoices ({expandedData.invoices.length})</h4>
                    <div className="db-detail-list">
                      {expandedData.invoices.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map((inv: any) => (
                        <div key={inv.id} className="db-detail-list-item">
                          <span className="db-detail-list-title">{inv.title || 'Invoice'}</span>
                          <span className="db-detail-list-amount">${(inv.amount || 0).toLocaleString()}</span>
                          <span className={`db-detail-badge ${inv.status}`}>{inv.status}</span>
                          {inv.dueDate && <span className="db-detail-list-date">{new Date(inv.dueDate).toLocaleDateString()}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Growth Targets */}
                {expandedData.targets.length > 0 && (
                  <div className="db-detail-section">
                    <h4><Target size={16} /> Growth Targets ({expandedData.targets.length})</h4>
                    <div className="db-detail-list">
                      {expandedData.targets.map(t => {
                        const pct = t.target > 0 ? Math.round((t.current / t.target) * 100) : 0;
                        return (
                          <div key={t.id} className="db-detail-list-item">
                            <span className="db-detail-list-title">{t.name}</span>
                            <div className="db-detail-target-bar">
                              <div className="db-detail-target-fill" style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? '#22c55e' : pct >= 50 ? '#3b82f6' : '#f59e0b' }} />
                            </div>
                            <span className="db-detail-target-pct">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {expandedData.recs.length > 0 && (
                  <div className="db-detail-section">
                    <h4><Lightbulb size={16} /> Recommendations ({expandedData.recs.length})</h4>
                    <div className="db-detail-rec-summary">
                      {['proposed','accepted','in_progress','completed','declined'].map(status => {
                        const count = expandedData.recs.filter(r => r.status === status).length;
                        if (count === 0) return null;
                        return <span key={status} className={`db-detail-badge ${status}`}>{count} {status.replace('_', ' ')}</span>;
                      })}
                    </div>
                    <div className="db-detail-list">
                      {expandedData.recs.map(r => (
                        <div key={r.id} className="db-detail-list-item">
                          <span className="db-detail-list-title">{r.title}</span>
                          <span className={`db-detail-badge ${r.priority}`}>{r.priority}</span>
                          <span className={`db-detail-badge ${r.status}`}>{r.status?.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interventions */}
                {expandedData.interventions.length > 0 && (
                  <div className="db-detail-section">
                    <h4><Crosshair size={16} /> Interventions ({expandedData.interventions.length})</h4>
                    <div className="db-detail-list">
                      {expandedData.interventions.map(iv => {
                        const revChange = (iv.afterMetrics?.revenue || 0) - (iv.beforeMetrics?.revenue || 0);
                        const roiVal = iv.cost > 0 ? ((revChange - iv.cost) / iv.cost * 100).toFixed(0) : null;
                        return (
                          <div key={iv.id} className="db-detail-list-item">
                            <span className="db-detail-list-title">{iv.title}</span>
                            <span className={`db-detail-badge ${iv.status}`}>{iv.status?.replace('_', ' ')}</span>
                            {iv.cost > 0 && <span className="db-detail-list-amount">${iv.cost.toLocaleString()}</span>}
                            {roiVal && <span className={`db-detail-roi ${Number(roiVal) >= 0 ? 'positive' : 'negative'}`}>{roiVal}% ROI</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Financial Summary */}
                {expandedData.finEntries.length > 0 && (
                  <div className="db-detail-section">
                    <h4><DollarSign size={16} /> Financial History ({expandedData.finEntries.length} months)</h4>
                    <div className="db-detail-kv">
                      <div><span>Total Revenue:</span><strong style={{ color: '#22c55e' }}>${expandedData.totalRevenue.toLocaleString()}</strong></div>
                      <div><span>Total Expenses:</span><strong style={{ color: '#ef4444' }}>${expandedData.totalExpenses.toLocaleString()}</strong></div>
                      <div><span>Net Profit:</span><strong style={{ color: expandedData.totalRevenue - expandedData.totalExpenses >= 0 ? '#22c55e' : '#ef4444' }}>${(expandedData.totalRevenue - expandedData.totalExpenses).toLocaleString()}</strong></div>
                      <div><span>Avg Revenue/Mo:</span><strong>${Math.round(expandedData.totalRevenue / expandedData.finEntries.length).toLocaleString()}</strong></div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {expandedData.notes.length > 0 && (
                  <div className="db-detail-section">
                    <h4><MessageSquare size={16} /> Notes ({expandedData.notes.length})</h4>
                    <div className="db-detail-notes">
                      {expandedData.notes.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((n: any) => (
                        <div key={n.id} className="db-detail-note">
                          <p>{n.text}</p>
                          <span className="db-detail-note-meta">{n.author} · {new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {expandedData.documents.length > 0 && (
                  <div className="db-detail-section">
                    <h4><FolderOpen size={16} /> Documents ({expandedData.documents.length})</h4>
                    <div className="db-detail-list">
                      {expandedData.documents.map(d => (
                        <div key={d.id} className="db-detail-list-item">
                          <span className="db-detail-list-title">{d.name}</span>
                          <span className="db-detail-badge">{d.type}</span>
                          {d.fileSize && <span className="db-detail-list-date">{(d.fileSize / 1024).toFixed(0)} KB</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {expandedData.tags.length > 0 && (
                  <div className="db-detail-section db-detail-section-sm">
                    <h4>Tags</h4>
                    <div className="db-detail-tags">
                      {expandedData.tags.map((tag, i) => <span key={i} className="db-detail-tag">{tag}</span>)}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!expandedData.intake && !expandedData.bizEntry && expandedData.audits.length === 0 && expandedData.finEntries.length === 0 && expandedData.recs.length === 0 && expandedData.interventions.length === 0 && expandedData.targets.length === 0 && expandedData.notes.length === 0 && expandedData.projects.length === 0 && expandedData.invoices.length === 0 && (
                  <div className="db-detail-empty">
                    <Activity size={24} />
                    <p>No detailed data available for this client yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
