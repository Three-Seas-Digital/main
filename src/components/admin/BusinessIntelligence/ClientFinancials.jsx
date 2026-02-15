import { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, Users, Globe, Save, Trash2, Edit3, Printer, ChevronDown, BarChart3, Download, Search, Calculator, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import { safeGetItem, safeSetItem, generateId, escapeHtml } from '../../../constants';
import { syncToApi } from '../../../api/apiSync';
import {
  ComposedChart, Bar, Line, LineChart, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const STORAGE_KEY = 'threeseas_bi_client_financials';

const EMPTY_ENTRY = {
  month: '', revenue: '', expenses: '', adSpend: '',
  newCustomers: '', websiteTraffic: '', conversionRate: '', leadCount: '', notes: '',
};

const DATE_RANGES = ['All', 'Last 3 Months', 'Last 6 Months', 'This Year', 'Custom'];

const MONTHS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' },   { value: '04', label: 'April' },
  { value: '05', label: 'May' },     { value: '06', label: 'June' },
  { value: '07', label: 'July' },    { value: '08', label: 'August' },
  { value: '09', label: 'September' },{ value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const buildYearOptions = () => {
  const years = [];
  for (let y = 2050; y >= 2020; y--) years.push(y);
  return years;
};

const fmt = v => '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 0 });
const pct = v => Number(v || 0).toFixed(1) + '%';
const monthLabel = m => {
  const [y, mo] = m.split('-');
  return new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const getMonthsAgo = n => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 7);
};

/* --- Module-scope sub-components (prevents re-mount on parent state change) --- */
const TrendArrow = ({ value }) => {
  if (value == null || value === 0) return null;
  const positive = value > 0;
  return (
    <span className="bi-financials-trend" style={{ color: positive ? '#16a34a' : '#dc2626', fontSize: '0.75rem', marginLeft: 4 }}>
      {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
};

const SummaryCard = ({ icon, label, value, color, trendValue }) => (
  <div className="bi-financials-card" style={{ borderLeft: `4px solid ${color}` }}>
    <div className="bi-financials-card-icon" style={{ color }}>{icon}</div>
    <div>
      <div className="bi-financials-card-label">{label}</div>
      <div className="bi-financials-card-value">{value}<TrendArrow value={trendValue} /></div>
    </div>
  </div>
);

const Th = ({ col, label, sortCol, sortDir, onToggleSort }) => (
  <th onClick={() => onToggleSort(col)} style={{ cursor: 'pointer' }}>
    {label} {sortCol === col ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
  </th>
);

const YoYRow = ({ label, thisVal, lastVal, change, isCurrency }) => (
  <tr>
    <td>{label}</td>
    <td>{isCurrency ? fmt(lastVal) : lastVal}</td>
    <td>{isCurrency ? fmt(thisVal) : thisVal}</td>
    <td style={{ color: change >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
      {change >= 0 ? '+' : ''}{change.toFixed(1)}% {change >= 0 ? '\u2191' : '\u2193'}
    </td>
  </tr>
);

export default function ClientFinancials({ biClientId, onBiClientChange }) {
  const { clients } = useAppContext();
  const [selectedClientId, setSelectedClientId] = useState(biClientId || '');
  const [clientSearch, setClientSearch] = useState(() => {
    if (!biClientId) return '';
    const c = clients.find(cl => cl.id === biClientId);
    return c ? c.name + (c.businessName ? ' (' + c.businessName + ')' : '') : '';
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_ENTRY });
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(true);
  const [roiOpen, setRoiOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sortCol, setSortCol] = useState('month');
  const [sortDir, setSortDir] = useState('asc');
  const [dateRange, setDateRange] = useState('All');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const activeClients = clients.filter(c => c.status !== 'archived' && c.status !== 'rejected');

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return activeClients;
    const q = clientSearch.toLowerCase();
    return activeClients.filter(c =>
      c.name?.toLowerCase().includes(q) || c.businessName?.toLowerCase().includes(q)
    );
  }, [activeClients, clientSearch]);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const [dataVersion, setDataVersion] = useState(0);
  const allData = useMemo(() => safeGetItem(STORAGE_KEY, {}), [dataVersion, selectedClientId]);
  const rawEntries = useMemo(() =>
    (allData[selectedClientId]?.entries || []).slice().sort((a, b) => a.month.localeCompare(b.month)),
    [allData, selectedClientId]
  );

  // Date range filtering
  const entries = useMemo(() => {
    if (dateRange === 'All') return rawEntries;
    let start, end;
    const now = new Date().toISOString().slice(0, 7);
    if (dateRange === 'Last 3 Months') { start = getMonthsAgo(3); end = now; }
    else if (dateRange === 'Last 6 Months') { start = getMonthsAgo(6); end = now; }
    else if (dateRange === 'This Year') { start = new Date().getFullYear() + '-01'; end = now; }
    else if (dateRange === 'Custom') { start = customStart; end = customEnd; }
    return rawEntries.filter(e => (!start || e.month >= start) && (!end || e.month <= end));
  }, [rawEntries, dateRange, customStart, customEnd]);

  useEffect(() => {
    setForm({ ...EMPTY_ENTRY });
    setEditingId(null);
    setDateRange('All');
  }, [selectedClientId]);

  useEffect(() => {
    if (!form.month || !selectedClientId) return;
    const existing = entries.find(e => e.month === form.month && e.id !== editingId);
    if (existing && !editingId) { setForm({ ...existing }); setEditingId(existing.id); }
  }, [form.month, entries, selectedClientId, editingId]);

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const selectClient = (c) => {
    setSelectedClientId(c.id);
    setClientSearch(c.name + (c.businessName ? ' (' + c.businessName + ')' : ''));
    setDropdownOpen(false);
    onBiClientChange?.(c.id);
  };

  const handleSave = () => {
    if (!selectedClientId || !form.month) return;
    setSaving(true);
    const data = safeGetItem(STORAGE_KEY, {});
    if (!data[selectedClientId]) data[selectedClientId] = { clientId: selectedClientId, entries: [] };
    const now = new Date().toISOString();
    const numFields = ['revenue', 'expenses', 'adSpend', 'newCustomers', 'websiteTraffic', 'conversionRate', 'leadCount'];
    const entry = { ...form };
    numFields.forEach(f => { entry[f] = Number(entry[f]) || 0; });
    if (editingId) {
      const idx = data[selectedClientId].entries.findIndex(e => e.id === editingId);
      if (idx !== -1) data[selectedClientId].entries[idx] = { ...entry, id: editingId, updatedAt: now };
    } else {
      entry.id = generateId();
      entry.createdAt = now;
      entry.updatedAt = now;
      data[selectedClientId].entries.push(entry);
    }
    safeSetItem(STORAGE_KEY, JSON.stringify(data));
    setDataVersion(v => v + 1);
    syncToApi(() => Promise.resolve(), 'client-financials-save');
    setForm({ ...EMPTY_ENTRY });
    setEditingId(null);
    setSaving(false);
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const handleEdit = (entry) => { setForm({ ...entry }); setEditingId(entry.id); setFormOpen(true); };

  const handleDelete = (id) => {
    const data = safeGetItem(STORAGE_KEY, {});
    if (data[selectedClientId]) {
      data[selectedClientId].entries = data[selectedClientId].entries.filter(e => e.id !== id);
      safeSetItem(STORAGE_KEY, JSON.stringify(data));
      setDataVersion(v => v + 1);
    }
    setConfirmDelete(null);
    if (editingId === id) { setForm({ ...EMPTY_ENTRY }); setEditingId(null); }
  };

  // Summary stats
  const totals = useMemo(() => {
    const r = entries.reduce((a, e) => a + e.revenue, 0);
    const x = entries.reduce((a, e) => a + e.expenses, 0);
    const cust = entries.reduce((a, e) => a + e.newCustomers, 0);
    const leads = entries.reduce((a, e) => a + e.leadCount, 0);
    const adSpend = entries.reduce((a, e) => a + e.adSpend, 0);
    const cr = entries.length ? entries.reduce((a, e) => a + e.conversionRate, 0) / entries.length : 0;
    const avgRevMonth = entries.length ? r / entries.length : 0;
    const revPerCustomer = cust > 0 ? r / cust : 0;
    return { revenue: r, expenses: x, profit: r - x, avgConversion: cr, avgRevMonth, revPerCustomer, customers: cust, leads, adSpend };
  }, [entries]);

  // MoM calculations
  const momMap = useMemo(() => {
    const map = {};
    const sorted = [...entries].sort((a, b) => a.month.localeCompare(b.month));
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) { map[sorted[i].id] = null; continue; }
      const prev = sorted[i - 1].revenue;
      const curr = sorted[i].revenue;
      map[sorted[i].id] = prev > 0 ? ((curr - prev) / prev) * 100 : (curr > 0 ? 100 : 0);
    }
    return map;
  }, [entries]);

  // Trend: last entry vs second-to-last for summary cards
  const trend = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.month.localeCompare(b.month));
    if (sorted.length < 2) return null;
    const last = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    return {
      revenue: prev.revenue > 0 ? ((last.revenue - prev.revenue) / prev.revenue) * 100 : 0,
      expenses: prev.expenses > 0 ? ((last.expenses - prev.expenses) / prev.expenses) * 100 : 0,
      profit: prev.revenue - prev.expenses !== 0 ? (((last.revenue - last.expenses) - (prev.revenue - prev.expenses)) / Math.abs(prev.revenue - prev.expenses)) * 100 : 0,
    };
  }, [entries]);

  // YoY comparison
  const yoy = useMemo(() => {
    if (rawEntries.length === 0) return null;
    const months = rawEntries.map(e => e.month).sort();
    const first = months[0];
    const last = months[months.length - 1];
    const [fy] = first.split('-').map(Number);
    const [ly] = last.split('-').map(Number);
    if (ly - fy < 1) return null;
    const thisYear = ly;
    const lastYear = ly - 1;
    const thisYearEntries = rawEntries.filter(e => e.month.startsWith(String(thisYear)));
    const lastYearEntries = rawEntries.filter(e => e.month.startsWith(String(lastYear)));
    if (!lastYearEntries.length) return null;
    const calc = (arr, field) => arr.reduce((a, e) => a + (field === 'profit' ? e.revenue - e.expenses : e[field]), 0);
    const tyRev = calc(thisYearEntries, 'revenue');
    const lyRev = calc(lastYearEntries, 'revenue');
    const tyExp = calc(thisYearEntries, 'expenses');
    const lyExp = calc(lastYearEntries, 'expenses');
    const tyProfit = calc(thisYearEntries, 'profit');
    const lyProfit = calc(lastYearEntries, 'profit');
    const pctChange = (curr, prev) => prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0;
    return { thisYear, lastYear, tyRev, lyRev, tyExp, lyExp, tyProfit, lyProfit,
      revChange: pctChange(tyRev, lyRev), expChange: pctChange(tyExp, lyExp), profitChange: pctChange(tyProfit, lyProfit) };
  }, [rawEntries]);

  // ROI calculations
  const roi = useMemo(() => {
    const adSpend = totals.adSpend;
    const revenue = totals.revenue;
    const customers = totals.customers;
    const leads = totals.leads;
    return {
      adSpend, revenue,
      roi: adSpend > 0 ? ((revenue - adSpend) / adSpend) * 100 : 0,
      roas: adSpend > 0 ? revenue / adSpend : 0,
      costPerCustomer: customers > 0 ? adSpend / customers : 0,
      costPerLead: leads > 0 ? adSpend / leads : 0,
    };
  }, [totals]);

  // Chart data
  const chartData = useMemo(() =>
    entries.map(e => ({
      month: monthLabel(e.month), revenue: e.revenue, expenses: e.expenses,
      profit: e.revenue - e.expenses, traffic: e.websiteTraffic,
      customers: e.newCustomers, leads: e.leadCount,
    })), [entries]);

  const pieData = useMemo(() => {
    const ad = entries.reduce((a, e) => a + e.adSpend, 0);
    const other = entries.reduce((a, e) => a + e.expenses, 0) - ad;
    return ad > 0 || other > 0 ? [{ name: 'Ad Spend', value: ad }, { name: 'Other Expenses', value: Math.max(other, 0) }] : [];
  }, [entries]);

  const PIE_COLORS = ['#6366f1', '#f59e0b'];

  // Sorting
  const sortedEntries = useMemo(() => {
    const s = [...entries];
    s.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === 'profit') { va = a.revenue - a.expenses; vb = b.revenue - b.expenses; }
      if (sortCol === 'mom') { va = momMap[a.id] ?? -Infinity; vb = momMap[b.id] ?? -Infinity; }
      if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return s;
  }, [entries, sortCol, sortDir, momMap]);

  const toggleSort = col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Month', 'Revenue', 'Expenses', 'Profit', 'Ad Spend', 'Traffic', 'Customers', 'Leads', 'Conv Rate', 'MoM %', 'Notes'];
    const rows = sortedEntries.map(e => [
      e.month, e.revenue, e.expenses, e.revenue - e.expenses, e.adSpend,
      e.websiteTraffic, e.newCustomers, e.leadCount, e.conversionRate,
      momMap[e.id] != null ? momMap[e.id].toFixed(1) : '',
      '"' + (e.notes || '').replace(/"/g, '""') + '"',
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const clientName = selectedClient?.name?.replace(/\s+/g, '_') || 'client';
    a.download = `financials_${clientName}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print report
  const handlePrint = () => {
    const name = selectedClient ? escapeHtml(selectedClient.name) : 'Unknown';
    const rows = sortedEntries.map(e => `<tr>
      <td>${escapeHtml(e.month)}</td><td>${fmt(e.revenue)}</td><td>${fmt(e.expenses)}</td>
      <td>${fmt(e.revenue - e.expenses)}</td><td>${fmt(e.adSpend)}</td><td>${e.websiteTraffic}</td>
      <td>${e.newCustomers}</td><td>${pct(e.conversionRate)}</td>
      <td>${momMap[e.id] != null ? (momMap[e.id] >= 0 ? '+' : '') + momMap[e.id].toFixed(1) + '%' : '-'}</td></tr>`).join('');
    const pw = window.open('', '_blank');
    pw.document.write(`<!DOCTYPE html><html><head><title>Financial Report - ${name}</title>
      <style>body{font-family:system-ui;padding:20px}table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f3f4f6}
      td:first-child,th:first-child{text-align:left}.summary{display:flex;gap:24px;margin:16px 0}
      .summary div{padding:12px;background:#f9fafb;border-radius:8px;flex:1;text-align:center}
      h1{margin-bottom:4px}@media print{body{padding:0}}</style></head><body>
      <h1>Financial Report</h1><p>Client: ${name}</p>
      <div class="summary"><div><strong>Revenue</strong><br/>${fmt(totals.revenue)}</div>
      <div><strong>Expenses</strong><br/>${fmt(totals.expenses)}</div>
      <div><strong>Net Profit</strong><br/>${fmt(totals.profit)}</div>
      <div><strong>Avg Rev/Mo</strong><br/>${fmt(totals.avgRevMonth)}</div>
      <div><strong>Avg Conv.</strong><br/>${pct(totals.avgConversion)}</div></div>
      <table><thead><tr><th>Month</th><th>Revenue</th><th>Expenses</th><th>Profit</th><th>Ad Spend</th>
      <th>Traffic</th><th>Customers</th><th>Conv %</th><th>MoM</th></tr></thead><tbody>${rows}
      <tr style="font-weight:bold"><td>Totals</td><td>${fmt(totals.revenue)}</td>
      <td>${fmt(totals.expenses)}</td><td>${fmt(totals.profit)}</td><td>${fmt(totals.adSpend)}</td>
      <td>${entries.reduce((a, e) => a + e.websiteTraffic, 0)}</td>
      <td>${totals.customers}</td><td>${pct(totals.avgConversion)}</td><td></td></tr></tbody></table></body></html>`);
    pw.document.close();
    pw.print();
  };

  return (
    <div className="bi-financials">
      <div className="bi-header">
        <h3><BarChart3 size={20} /> Client Financials</h3>
        {selectedClientId && entries.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={handleExportCSV}><Download size={16} /> Export CSV</button>
            <button className="btn-secondary" onClick={handlePrint}><Printer size={16} /> Print Report</button>
          </div>
        )}
      </div>

      {/* Client Search Dropdown */}
      <div className="form-group" style={{ position: 'relative' }}>
        <label>Select Client</label>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
          <input
            type="text" value={clientSearch} placeholder="Search by name or business..."
            style={{ paddingLeft: 32, width: '100%' }}
            onChange={e => { setClientSearch(e.target.value); setDropdownOpen(true); if (!e.target.value) setSelectedClientId(''); }}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
          />
        </div>
        {dropdownOpen && filteredClients.length > 0 && (
          <div className="bi-financials-dropdown">
            {filteredClients.map(c => (
              <div key={c.id} className={`bi-financials-dropdown-item${c.id === selectedClientId ? ' active' : ''}`}
                onMouseDown={() => selectClient(c)}>
                {c.name}{c.businessName ? ` (${c.businessName})` : ''}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedClientId && (<>
        {/* Date Range Filter */}
        {rawEntries.length > 0 && (
          <div className="bi-financials-date-filters">
            {DATE_RANGES.map(r => (
              <button key={r} className={`bi-financials-pill${dateRange === r ? ' active' : ''}`}
                onClick={() => setDateRange(r)}>{r}</button>
            ))}
            {dateRange === 'Custom' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 8 }}>
                <input type="month" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                <span>to</span>
                <input type="month" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
              </div>
            )}
          </div>
        )}

        {/* Data Entry Form */}
        <div className="bi-section">
          <button className="bi-section-header" onClick={() => setFormOpen(p => !p)} type="button">
            <span className="bi-section-title"><Edit3 size={16} /> {editingId ? 'Edit Entry' : 'Add Monthly Data'}</span>
            <ChevronDown size={18} style={{ transform: formOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {formOpen && (
            <div className="bi-section-body">
              <div className="bi-form-grid">
                <div className="form-group"><label>Month</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select value={form.month ? form.month.split('-')[1] : ''} onChange={e => {
                      const yr = form.month ? form.month.split('-')[0] : String(new Date().getFullYear());
                      set('month', e.target.value ? `${yr}-${e.target.value}` : '');
                    }} style={{ flex: 1 }}>
                      <option value="">-- Month --</option>
                      {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select value={form.month ? form.month.split('-')[0] : ''} onChange={e => {
                      const mo = form.month ? form.month.split('-')[1] : '';
                      set('month', mo ? `${e.target.value}-${mo}` : (e.target.value ? `${e.target.value}-01` : ''));
                    }} style={{ width: 90 }}>
                      <option value="">-- Year --</option>
                      {buildYearOptions().map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group"><label>Revenue ($)</label>
                  <input type="number" min="0" value={form.revenue} onChange={e => set('revenue', e.target.value)} placeholder="0" /></div>
                <div className="form-group"><label>Expenses ($)</label>
                  <input type="number" min="0" value={form.expenses} onChange={e => set('expenses', e.target.value)} placeholder="0" /></div>
                <div className="form-group"><label>Ad Spend ($)</label>
                  <input type="number" min="0" value={form.adSpend} onChange={e => set('adSpend', e.target.value)} placeholder="0" /></div>
                <div className="form-group"><label>New Customers</label>
                  <input type="number" min="0" value={form.newCustomers} onChange={e => set('newCustomers', e.target.value)} placeholder="0" /></div>
                <div className="form-group"><label>Website Traffic</label>
                  <input type="number" min="0" value={form.websiteTraffic} onChange={e => set('websiteTraffic', e.target.value)} placeholder="0" /></div>
                <div className="form-group"><label>Lead Count</label>
                  <input type="number" min="0" value={form.leadCount} onChange={e => set('leadCount', e.target.value)} placeholder="0" /></div>
                <div className="form-group"><label>Conversion Rate (%)</label>
                  <input type="number" min="0" max="100" step="0.1" value={form.conversionRate} onChange={e => set('conversionRate', e.target.value)} placeholder="0.0" /></div>
              </div>
              <div className="form-group"><label>Notes</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Optional notes for this month..." /></div>
              <div className="bi-actions">
                <button className="btn-primary" onClick={handleSave} disabled={saving || !form.month}>
                  <Save size={16} /> {saving ? 'Saving...' : editingId ? 'Update Entry' : 'Save Entry'}
                </button>
                {editingId && <button className="btn-secondary" onClick={() => { setForm({ ...EMPTY_ENTRY }); setEditingId(null); }}>Cancel Edit</button>}
                {saveMsg && <span className="bi-save-msg">{saveMsg}</span>}
              </div>
            </div>
          )}
        </div>

        {entries.length > 0 && (<>
          {/* Summary Cards */}
          <div className="bi-financials-cards">
            <SummaryCard icon={<DollarSign size={20} />} label="Total Revenue" value={fmt(totals.revenue)} color="#22c55e" trendValue={trend?.revenue} />
            <SummaryCard icon={<DollarSign size={20} />} label="Total Expenses" value={fmt(totals.expenses)} color="#ef4444" trendValue={trend?.expenses} />
            <SummaryCard icon={<TrendingUp size={20} />} label="Net Profit" value={fmt(totals.profit)} color={totals.profit >= 0 ? '#3b82f6' : '#ef4444'} trendValue={trend?.profit} />
            <SummaryCard icon={<Users size={20} />} label="Avg Conversion" value={pct(totals.avgConversion)} color="#8b5cf6" />
            <SummaryCard icon={<BarChart3 size={20} />} label="Avg Revenue/Month" value={fmt(totals.avgRevMonth)} color="#14b8a6" />
            <SummaryCard icon={<Users size={20} />} label="Revenue/Customer" value={fmt(totals.revPerCustomer)} color="#f59e0b" />
          </div>

          {/* YoY Comparison */}
          {yoy && (
            <div className="bi-section">
              <h4 className="bi-chart-title">Year-over-Year Comparison ({yoy.lastYear} vs {yoy.thisYear})</h4>
              <div className="bi-financials-table-wrap">
                <table className="bi-financials-table">
                  <thead><tr><th>Metric</th><th>{yoy.lastYear}</th><th>{yoy.thisYear}</th><th>Change</th></tr></thead>
                  <tbody>
                    <YoYRow label="Revenue" thisVal={yoy.tyRev} lastVal={yoy.lyRev} change={yoy.revChange} isCurrency />
                    <YoYRow label="Expenses" thisVal={yoy.tyExp} lastVal={yoy.lyExp} change={yoy.expChange} isCurrency />
                    <YoYRow label="Profit" thisVal={yoy.tyProfit} lastVal={yoy.lyProfit} change={yoy.profitChange} isCurrency />
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ROI Calculator */}
          <div className="bi-section">
            <button className="bi-section-header" onClick={() => setRoiOpen(p => !p)} type="button">
              <span className="bi-section-title"><Calculator size={16} /> ROI Calculator</span>
              <ChevronDown size={18} style={{ transform: roiOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {roiOpen && (
              <div className="bi-section-body">
                <div className="bi-financials-cards">
                  <div className="bi-financials-card" style={{ borderLeft: '4px solid #6366f1' }}>
                    <div><div className="bi-financials-card-label">ROI</div>
                      <div className="bi-financials-card-value" style={{ color: roi.roi >= 0 ? '#16a34a' : '#dc2626' }}>
                        {roi.roi.toFixed(1)}%</div></div>
                  </div>
                  <div className="bi-financials-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                    <div><div className="bi-financials-card-label">ROAS</div>
                      <div className="bi-financials-card-value">{roi.roas.toFixed(2)}x</div></div>
                  </div>
                  <div className="bi-financials-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div><div className="bi-financials-card-label">Cost/Customer</div>
                      <div className="bi-financials-card-value">{fmt(roi.costPerCustomer)}</div></div>
                  </div>
                  <div className="bi-financials-card" style={{ borderLeft: '4px solid #14b8a6' }}>
                    <div><div className="bi-financials-card-label">Cost/Lead</div>
                      <div className="bi-financials-card-value">{fmt(roi.costPerLead)}</div></div>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 8 }}>
                  Based on total ad spend of {fmt(roi.adSpend)} across {entries.length} month{entries.length !== 1 ? 's' : ''}.
                  Revenue: {fmt(roi.revenue)} | Customers: {totals.customers} | Leads: {totals.leads}
                </div>
              </div>
            )}
          </div>

          {/* Revenue vs Expenses Chart */}
          <div className="bi-section">
            <h4 className="bi-chart-title">Revenue vs Expenses</h4>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)} />
                <Tooltip formatter={(v, n) => [fmt(v), n]} />
                <Legend />
                <Bar dataKey="revenue" fill="#22c55e" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="Profit" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Growth Trends Chart */}
          <div className="bi-section">
            <h4 className="bi-chart-title">Growth Trends</h4>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="traffic" stroke="#6366f1" name="Traffic" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="customers" stroke="#f59e0b" name="New Customers" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="leads" stroke="#14b8a6" name="Leads" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Expense Breakdown Pie */}
          {pieData.length > 0 && (
            <div className="bi-section">
              <h4 className="bi-chart-title">Expense Breakdown</h4>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Monthly Data Table */}
          <div className="bi-section">
            <h4 className="bi-chart-title">Monthly Data</h4>
            <div className="bi-financials-table-wrap">
              <table className="bi-financials-table">
                <thead>
                  <tr>
                    <Th col="month" label="Month" sortCol={sortCol} sortDir={sortDir} onToggleSort={toggleSort} />
                    <Th col="revenue" label="Revenue" sortCol={sortCol} sortDir={sortDir} onToggleSort={toggleSort} />
                    <Th col="expenses" label="Expenses" sortCol={sortCol} sortDir={sortDir} onToggleSort={toggleSort} />
                    <Th col="profit" label="Profit" sortCol={sortCol} sortDir={sortDir} onToggleSort={toggleSort} />
                    <Th col="mom" label="MoM" sortCol={sortCol} sortDir={sortDir} onToggleSort={toggleSort} />
                    <Th col="websiteTraffic" label="Traffic" sortCol={sortCol} sortDir={sortDir} onToggleSort={toggleSort} />
                    <Th col="newCustomers" label="Customers" sortCol={sortCol} sortDir={sortDir} onToggleSort={toggleSort} />
                    <Th col="conversionRate" label="Conv %" sortCol={sortCol} sortDir={sortDir} onToggleSort={toggleSort} />
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map(e => {
                    const mom = momMap[e.id];
                    return (
                      <tr key={e.id}>
                        <td>{monthLabel(e.month)}</td>
                        <td>{fmt(e.revenue)}</td>
                        <td>{fmt(e.expenses)}</td>
                        <td style={{ color: e.revenue - e.expenses >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(e.revenue - e.expenses)}</td>
                        <td style={{ color: mom == null ? '#9ca3af' : mom >= 0 ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
                          {mom == null ? '-' : `${mom >= 0 ? '\u2191' : '\u2193'} ${Math.abs(mom).toFixed(1)}%`}
                        </td>
                        <td>{e.websiteTraffic.toLocaleString()}</td>
                        <td>{e.newCustomers}</td>
                        <td>{pct(e.conversionRate)}</td>
                        <td className="bi-financials-actions">
                          <button className="btn-icon" onClick={() => handleEdit(e)} aria-label="Edit entry" title="Edit"><Edit3 size={14} /></button>
                          {confirmDelete === e.id
                            ? (<><button className="btn-danger-sm" onClick={() => handleDelete(e.id)}>Confirm</button>
                              <button className="btn-secondary-sm" onClick={() => setConfirmDelete(null)}>Cancel</button></>)
                            : <button className="btn-icon" onClick={() => setConfirmDelete(e.id)} aria-label="Delete entry" title="Delete"><Trash2 size={14} /></button>}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bi-financials-totals">
                    <td><strong>Totals</strong></td>
                    <td><strong>{fmt(totals.revenue)}</strong></td>
                    <td><strong>{fmt(totals.expenses)}</strong></td>
                    <td style={{ color: totals.profit >= 0 ? '#16a34a' : '#dc2626' }}><strong>{fmt(totals.profit)}</strong></td>
                    <td></td>
                    <td><strong>{entries.reduce((a, e) => a + e.websiteTraffic, 0).toLocaleString()}</strong></td>
                    <td><strong>{totals.customers}</strong></td>
                    <td><strong>{pct(totals.avgConversion)}</strong></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>)}

        {entries.length === 0 && (
          <div className="bi-financials-empty">
            <Globe size={32} />
            <p>No financial data yet. Add your first monthly entry above.</p>
          </div>
        )}
      </>)}
    </div>
  );
}
