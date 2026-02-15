import { useState, useMemo } from 'react';
import {
  FileSpreadsheet, Printer, Search,
  CheckCircle, XCircle, Trash2, RefreshCw,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { escapeHtml } from '../../constants';

export default function InvoicesTab() {
  const { clients, markInvoicePaid, unmarkInvoicePaid, deleteInvoice, hasPermission } = useAppContext();
  const canManage = hasPermission('manage_finance') || hasPermission('manage_clients');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedYear, setSelectedYear] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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
                <td>${escapeHtml(inv.title)}</td>
                <td>${escapeHtml(inv.clientName)}</td>
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
                        {deleteConfirm === `${inv.clientId}-${inv.id}` ? (
                          <div className="delete-confirm-inline">
                            <span>Delete?</span>
                            <button className="btn btn-xs btn-delete" onClick={() => { deleteInvoice(inv.clientId, inv.id); setDeleteConfirm(null); }}>Yes</button>
                            <button className="btn btn-xs btn-outline" onClick={() => setDeleteConfirm(null)}>No</button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-xs btn-delete"
                            onClick={() => setDeleteConfirm(`${inv.clientId}-${inv.id}`)}
                            title="Delete invoice"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
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
