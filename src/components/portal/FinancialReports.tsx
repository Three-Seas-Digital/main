import { useState, useMemo } from 'react';
import { FileText, Download, Printer, Calendar, Inbox } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { safeGetItem, escapeHtml } from '../../constants';

const DATE_RANGES = ['3M', '6M', '1Y', 'All'];

const monthLabel = (m: string) => {
  const [y, mo] = m.split('-');
  return new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const getMonthsAgo = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 7);
};

const fmt = (v: any) => '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v: any) => Number(v || 0).toFixed(1) + '%';

export default function FinancialReports() {
  const { currentClient } = useAppContext();
  const clientId = currentClient?.id;

  const [dateRange, setDateRange] = useState('All');

  // Get financial data from localStorage
  const allFinancials = useMemo(() => safeGetItem('threeseas_bi_client_financials', {}), []);
  const clientData = (allFinancials as Record<string, any>)[clientId as string];
  const rawEntries = useMemo(
    () => (clientData?.entries || []).slice().sort((a: any, b: any) => a.month.localeCompare(b.month)),
    [clientData]
  );

  // Date range filtering
  const entries = useMemo(() => {
    if (dateRange === 'All') return rawEntries;
    let start;
    const now = new Date().toISOString().slice(0, 7);
    if (dateRange === '3M') start = getMonthsAgo(3);
    else if (dateRange === '6M') start = getMonthsAgo(6);
    else if (dateRange === '1Y') start = getMonthsAgo(12);
    return rawEntries.filter(e => (!start || e.month >= start) && e.month <= now);
  }, [rawEntries, dateRange]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const revenue = entries.reduce((sum, e) => sum + (e.revenue || 0), 0);
    const expenses = entries.reduce((sum, e) => sum + (e.expenses || 0), 0);
    const adSpend = entries.reduce((sum, e) => sum + (e.adSpend || 0), 0);
    const profit = revenue - expenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const customers = entries.reduce((sum, e) => sum + (e.newCustomers || 0), 0);
    const leads = entries.reduce((sum, e) => sum + (e.leadCount || 0), 0);
    const avgRevenue = entries.length > 0 ? revenue / entries.length : 0;
    const avgExpenses = entries.length > 0 ? expenses / entries.length : 0;
    const conversionRate = entries.length > 0
      ? entries.reduce((sum, e) => sum + (e.conversionRate || 0), 0) / entries.length
      : 0;

    return {
      revenue,
      expenses,
      adSpend,
      profit,
      margin,
      customers,
      leads,
      avgRevenue,
      avgExpenses,
      conversionRate,
      monthCount: entries.length,
    };
  }, [entries]);

  // Expense breakdown
  const expenseBreakdown = useMemo(() => {
    const adSpend = entries.reduce((sum, e) => sum + (e.adSpend || 0), 0);
    const other = summary.expenses - adSpend;
    return [
      { category: 'Ad Spend', amount: adSpend },
      { category: 'Other Expenses', amount: Math.max(other, 0) },
    ].filter(item => item.amount > 0);
  }, [entries, summary.expenses]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Month', 'Revenue', 'Expenses', 'Profit', 'Profit Margin %', 'Ad Spend', 'Customers', 'Leads', 'Conversion Rate'];
    const rows = entries.map(e => [
      e.month,
      e.revenue || 0,
      e.expenses || 0,
      (e.revenue || 0) - (e.expenses || 0),
      e.revenue > 0 ? (((e.revenue - e.expenses) / e.revenue) * 100).toFixed(1) : 0,
      e.adSpend || 0,
      e.newCustomers || 0,
      e.leadCount || 0,
      (e.conversionRate || 0).toFixed(1),
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const clientName = currentClient?.name?.replace(/\s+/g, '_') || 'client';
    const rangeLabel = dateRange.toLowerCase();
    a.download = `financial_report_${clientName}_${rangeLabel}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print Report
  const handlePrint = () => {
    const name = currentClient ? escapeHtml(currentClient.name) : 'Unknown';
    const businessName = currentClient?.businessName ? escapeHtml(currentClient.businessName) : '';
    const rangeName = dateRange === 'All' ? 'All Time' : `Last ${dateRange}`;

    const monthRows = entries.map(e => {
      const profit = (e.revenue || 0) - (e.expenses || 0);
      const margin = e.revenue > 0 ? ((profit / e.revenue) * 100).toFixed(1) : '0.0';
      return `<tr>
        <td>${escapeHtml(monthLabel(e.month))}</td>
        <td>${fmt(e.revenue)}</td>
        <td>${fmt(e.expenses)}</td>
        <td style="color: ${profit >= 0 ? '#22c55e' : '#ef4444'}">${fmt(profit)}</td>
        <td>${margin}%</td>
      </tr>`;
    }).join('');

    const expenseRows = expenseBreakdown.map(item => `<tr>
      <td>${escapeHtml(item.category)}</td>
      <td>${fmt(item.amount)}</td>
      <td>${summary.expenses > 0 ? ((item.amount / summary.expenses) * 100).toFixed(1) : 0}%</td>
    </tr>`).join('');

    const pw = window.open('', '_blank');
    pw.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Financial Report - ${name}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 32px;
      max-width: 1000px;
      margin: 0 auto;
    }
    h1 {
      color: #1f2937;
      margin: 0 0 8px;
      font-size: 2rem;
    }
    .subtitle {
      color: #6b7280;
      margin: 0 0 24px;
      font-size: 1rem;
    }
    .report-header {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .section {
      margin-bottom: 32px;
    }
    h2 {
      color: #374151;
      font-size: 1.3rem;
      margin: 0 0 12px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .summary-card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 16px;
      border-left: 4px solid #3b82f6;
    }
    .summary-card.positive {
      border-left-color: #22c55e;
    }
    .summary-card.negative {
      border-left-color: #ef4444;
    }
    .summary-label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    th, td {
      text-align: left;
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
    }
    th {
      background: #f3f4f6;
      font-weight: 600;
      color: #374151;
    }
    td {
      color: #1f2937;
    }
    tr:nth-child(even) {
      background: #f9fafb;
    }
    .totals-row {
      font-weight: 700;
      background: #e5e7eb !important;
    }
    .text-right {
      text-align: right;
    }
    @media print {
      body {
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <h1>Financial Report</h1>
    <p class="subtitle">
      ${businessName ? `${businessName} — ` : ''}${name}<br/>
      Report Period: ${escapeHtml(rangeName)} (${entries.length} month${entries.length !== 1 ? 's' : ''})<br/>
      Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </p>
  </div>

  <div class="section">
    <h2>Executive Summary</h2>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">Total Revenue</div>
        <div class="summary-value">${fmt(summary.revenue)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Total Expenses</div>
        <div class="summary-value">${fmt(summary.expenses)}</div>
      </div>
      <div class="summary-card ${summary.profit >= 0 ? 'positive' : 'negative'}">
        <div class="summary-label">Net Profit</div>
        <div class="summary-value" style="color: ${summary.profit >= 0 ? '#22c55e' : '#ef4444'}">${fmt(summary.profit)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Profit Margin</div>
        <div class="summary-value">${pct(summary.margin)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Revenue Summary</h2>
    <table>
      <tr>
        <td>Average Monthly Revenue</td>
        <td class="text-right"><strong>${fmt(summary.avgRevenue)}</strong></td>
      </tr>
      <tr>
        <td>Total Customers Acquired</td>
        <td class="text-right"><strong>${summary.customers}</strong></td>
      </tr>
      <tr>
        <td>Total Leads Generated</td>
        <td class="text-right"><strong>${summary.leads}</strong></td>
      </tr>
      <tr>
        <td>Average Conversion Rate</td>
        <td class="text-right"><strong>${pct(summary.conversionRate)}</strong></td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>Expense Breakdown</h2>
    ${expenseBreakdown.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th class="text-right">Amount</th>
          <th class="text-right">% of Total</th>
        </tr>
      </thead>
      <tbody>
        ${expenseRows}
        <tr class="totals-row">
          <td>Total Expenses</td>
          <td class="text-right">${fmt(summary.expenses)}</td>
          <td class="text-right">100.0%</td>
        </tr>
      </tbody>
    </table>
    ` : '<p>No expense breakdown available.</p>'}
  </div>

  <div class="section">
    <h2>Profit Analysis</h2>
    <table>
      <tr>
        <td>Gross Revenue</td>
        <td class="text-right"><strong>${fmt(summary.revenue)}</strong></td>
      </tr>
      <tr>
        <td>Total Expenses</td>
        <td class="text-right"><strong>${fmt(summary.expenses)}</strong></td>
      </tr>
      <tr class="totals-row">
        <td>Net Profit</td>
        <td class="text-right" style="color: ${summary.profit >= 0 ? '#22c55e' : '#ef4444'}"><strong>${fmt(summary.profit)}</strong></td>
      </tr>
      <tr>
        <td>Profit Margin</td>
        <td class="text-right"><strong>${pct(summary.margin)}</strong></td>
      </tr>
      <tr>
        <td>Average Monthly Profit</td>
        <td class="text-right"><strong>${fmt((summary.profit / (entries.length || 1)))}</strong></td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>Monthly Breakdown</h2>
    <table>
      <thead>
        <tr>
          <th>Month</th>
          <th class="text-right">Revenue</th>
          <th class="text-right">Expenses</th>
          <th class="text-right">Profit</th>
          <th class="text-right">Margin %</th>
        </tr>
      </thead>
      <tbody>
        ${monthRows}
        <tr class="totals-row">
          <td>Totals</td>
          <td class="text-right">${fmt(summary.revenue)}</td>
          <td class="text-right">${fmt(summary.expenses)}</td>
          <td class="text-right" style="color: ${summary.profit >= 0 ? '#22c55e' : '#ef4444'}">${fmt(summary.profit)}</td>
          <td class="text-right">${pct(summary.margin)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Key Metrics</h2>
    <table>
      <tr>
        <td>Total Months Analyzed</td>
        <td class="text-right"><strong>${summary.monthCount}</strong></td>
      </tr>
      <tr>
        <td>Average Monthly Revenue</td>
        <td class="text-right"><strong>${fmt(summary.avgRevenue)}</strong></td>
      </tr>
      <tr>
        <td>Average Monthly Expenses</td>
        <td class="text-right"><strong>${fmt(summary.avgExpenses)}</strong></td>
      </tr>
      <tr>
        <td>Total Ad Spend</td>
        <td class="text-right"><strong>${fmt(summary.adSpend)}</strong></td>
      </tr>
      <tr>
        <td>Marketing % of Expenses</td>
        <td class="text-right"><strong>${summary.expenses > 0 ? ((summary.adSpend / summary.expenses) * 100).toFixed(1) : 0}%</strong></td>
      </tr>
    </table>
  </div>
</body>
</html>`);
    pw.document.close();
    pw.print();
  };

  if (!clientId) {
    return (
      <div className="portal-empty-state">
        <FileText size={48} />
        <h3>Not Logged In</h3>
        <p>Please log in to generate financial reports.</p>
      </div>
    );
  }

  if (rawEntries.length === 0) {
    return (
      <div className="portal-reports">
        <div className="portal-reports-header">
          <h2>Financial Reports</h2>
          <p className="portal-reports-subtitle">Export and print your financial summaries.</p>
        </div>
        <div className="portal-empty-state">
          <Inbox size={48} />
          <h3>No Financial Data</h3>
          <p>Your financial data has not been recorded yet. Check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-reports">
      <div className="portal-reports-header">
        <h2>Financial Reports</h2>
        <p className="portal-reports-subtitle">
          Generate and download comprehensive financial reports for your business.
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="portal-reports-controls">
        <div className="portal-reports-filters">
          <Calendar size={16} />
          <span className="portal-reports-label">Report Period:</span>
          {DATE_RANGES.map(range => (
            <button
              key={range}
              className={`portal-filter-btn ${dateRange === range ? 'portal-filter-btn-active' : ''}`}
              onClick={() => setDateRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="portal-empty-state">
          <Inbox size={48} />
          <h3>No Data for This Period</h3>
          <p>No financial entries found for the selected period. Try a different range.</p>
        </div>
      ) : (
      <>
      {/* Report Preview */}
      <div className="portal-reports-preview">
        <h3 className="portal-section-title">Report Summary</h3>
        <div className="portal-reports-summary">
          <div className="portal-reports-stat">
            <span className="portal-reports-stat-label">Period</span>
            <strong className="portal-reports-stat-value">
              {dateRange === 'All' ? 'All Time' : `Last ${dateRange}`}
            </strong>
          </div>
          <div className="portal-reports-stat">
            <span className="portal-reports-stat-label">Months Included</span>
            <strong className="portal-reports-stat-value">{entries.length}</strong>
          </div>
          <div className="portal-reports-stat">
            <span className="portal-reports-stat-label">Total Revenue</span>
            <strong className="portal-reports-stat-value">{fmt(summary.revenue)}</strong>
          </div>
          <div className="portal-reports-stat">
            <span className="portal-reports-stat-label">Total Expenses</span>
            <strong className="portal-reports-stat-value">{fmt(summary.expenses)}</strong>
          </div>
          <div className="portal-reports-stat">
            <span className="portal-reports-stat-label">Net Profit</span>
            <strong
              className="portal-reports-stat-value"
              style={{ color: summary.profit >= 0 ? '#22c55e' : '#ef4444' }}
            >
              {fmt(summary.profit)}
            </strong>
          </div>
          <div className="portal-reports-stat">
            <span className="portal-reports-stat-label">Profit Margin</span>
            <strong className="portal-reports-stat-value">{pct(summary.margin)}</strong>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="portal-reports-actions">
        <h3 className="portal-section-title">Export Options</h3>
        <div className="portal-reports-buttons">
          <button className="portal-btn-primary" onClick={handleExportCSV}>
            <Download size={18} />
            <span>Download CSV</span>
          </button>
          <button className="portal-btn-secondary" onClick={handlePrint}>
            <Printer size={18} />
            <span>Print Report</span>
          </button>
        </div>
        <p className="portal-reports-help">
          Download as CSV to import into spreadsheet software, or print a formatted report for your records.
        </p>
      </div>
      </>
      )}
    </div>
  );
}
