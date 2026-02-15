import { useState, useMemo } from 'react';
import {
  DollarSign, CreditCard, TrendingUp,
  Calendar as CalendarIcon, Printer,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { escapeHtml } from '../../constants';

const getPaymentDate = (p) => new Date(p.createdAt);
const getPaymentYear = (p) => getPaymentDate(p).getFullYear();
const getPaymentMonth = (p) => getPaymentDate(p).getMonth();
const getPaymentQuarter = (p) => Math.floor(getPaymentDate(p).getMonth() / 3);

export default function RevenueTab() {
  const { payments, SUBSCRIPTION_TIERS } = useAppContext();
  const [viewMode, setViewMode] = useState('monthly'); // monthly, quarterly, yearly
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const availableYears = useMemo(() => {
    const years = new Set();
    payments.forEach((p) => years.add(getPaymentYear(p)));
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [payments]);

  const yearPayments = useMemo(() => {
    return payments.filter((p) => getPaymentYear(p) === selectedYear && p.status === 'completed');
  }, [payments, selectedYear]);

  const totalRevenue = yearPayments.reduce((sum, p) => sum + p.amount, 0);

  // Monthly data
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      name: new Date(selectedYear, i).toLocaleString('en-US', { month: 'short' }),
      fullName: new Date(selectedYear, i).toLocaleString('en-US', { month: 'long' }),
      revenue: 0,
      count: 0,
      payments: [],
    }));
    yearPayments.forEach((p) => {
      const m = getPaymentMonth(p);
      months[m].revenue += p.amount;
      months[m].count += 1;
      months[m].payments.push(p);
    });
    return months;
  }, [yearPayments, selectedYear]);

  // Quarterly data
  const quarterlyData = useMemo(() => {
    const quarters = [
      { name: 'Q1', months: 'Jan - Mar', revenue: 0, count: 0 },
      { name: 'Q2', months: 'Apr - Jun', revenue: 0, count: 0 },
      { name: 'Q3', months: 'Jul - Sep', revenue: 0, count: 0 },
      { name: 'Q4', months: 'Oct - Dec', revenue: 0, count: 0 },
    ];
    yearPayments.forEach((p) => {
      const q = getPaymentQuarter(p);
      quarters[q].revenue += p.amount;
      quarters[q].count += 1;
    });
    return quarters;
  }, [yearPayments]);

  // By service
  const byService = useMemo(() => {
    const services = {};
    yearPayments.forEach((p) => {
      const s = p.service || 'other';
      if (!services[s]) services[s] = { name: s, revenue: 0, count: 0 };
      services[s].revenue += p.amount;
      services[s].count += 1;
    });
    return Object.values(services).sort((a, b) => b.revenue - a.revenue);
  }, [yearPayments]);

  // By tier
  const byTier = useMemo(() => {
    const tiers = {};
    yearPayments.forEach((p) => {
      const t = p.serviceTier || 'basic';
      if (!tiers[t]) tiers[t] = { name: t, label: SUBSCRIPTION_TIERS[t]?.label || t, revenue: 0, count: 0 };
      tiers[t].revenue += p.amount;
      tiers[t].count += 1;
    });
    return Object.values(tiers).sort((a, b) => b.revenue - a.revenue);
  }, [yearPayments, SUBSCRIPTION_TIERS]);

  // By payment method
  const byMethod = useMemo(() => {
    const methods = {};
    yearPayments.forEach((p) => {
      const m = p.method || 'other';
      if (!methods[m]) methods[m] = { name: m, revenue: 0, count: 0 };
      methods[m].revenue += p.amount;
      methods[m].count += 1;
    });
    return Object.values(methods).sort((a, b) => b.revenue - a.revenue);
  }, [yearPayments]);

  const maxMonthRevenue = Math.max(...monthlyData.map((m) => m.revenue), 1);
  const avgMonthly = totalRevenue / 12;
  const currentMonth = new Date().getMonth();
  const ytdRevenue = monthlyData.slice(0, currentMonth + 1).reduce((sum, m) => sum + m.revenue, 0);

  const formatCurrency = (num) => `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatLabel = (str) => str.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Print revenue report
  const handlePrintRevenue = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Revenue Report - ${selectedYear}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 900px; margin: 0 auto; }
          h1 { color: #1e3a5f; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .summary-card { background: #f3f4f6; padding: 18px; border-radius: 8px; text-align: center; }
          .summary-card.highlight { background: #ecfdf5; border: 1px solid #10b981; }
          .summary-card h3 { margin: 0 0 8px; font-size: 11px; color: #6b7280; text-transform: uppercase; }
          .summary-card p { margin: 0; font-size: 20px; font-weight: bold; color: #1e3a5f; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; font-size: 12px; }
          td.amount { text-align: right; font-family: monospace; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Revenue Report - ${selectedYear}</h1>
        <p>Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div class="summary">
          <div class="summary-card highlight"><h3>Total Revenue</h3><p>${formatCurrency(totalRevenue)}</p></div>
          <div class="summary-card"><h3>Transactions</h3><p>${yearPayments.length}</p></div>
          <div class="summary-card"><h3>Avg Monthly</h3><p>${formatCurrency(avgMonthly)}</p></div>
          <div class="summary-card"><h3>YTD Revenue</h3><p>${formatCurrency(ytdRevenue)}</p></div>
        </div>

        <h2>Monthly Breakdown</h2>
        <table>
          <thead><tr><th>Month</th><th>Transactions</th><th class="amount">Revenue</th><th class="amount">% of Total</th></tr></thead>
          <tbody>
            ${monthlyData.map((m) => `<tr><td>${m.fullName}</td><td>${m.count}</td><td class="amount">${formatCurrency(m.revenue)}</td><td class="amount">${totalRevenue > 0 ? ((m.revenue / totalRevenue) * 100).toFixed(1) : 0}%</td></tr>`).join('')}
          </tbody>
        </table>

        <h2>By Service</h2>
        <table>
          <thead><tr><th>Service</th><th>Transactions</th><th class="amount">Revenue</th></tr></thead>
          <tbody>${byService.map((s) => `<tr><td>${escapeHtml(formatLabel(s.name))}</td><td>${s.count}</td><td class="amount">${formatCurrency(s.revenue)}</td></tr>`).join('')}</tbody>
        </table>

        <h2>By Tier</h2>
        <table>
          <thead><tr><th>Tier</th><th>Transactions</th><th class="amount">Revenue</th></tr></thead>
          <tbody>${byTier.map((t) => `<tr><td>${escapeHtml(t.label)}</td><td>${t.count}</td><td class="amount">${formatCurrency(t.revenue)}</td></tr>`).join('')}</tbody>
        </table>

        <div class="footer"><p>Three Seas Digital CRM — Revenue Report</p></div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="revenue-tab">
      <div className="revenue-header">
        <div className="revenue-header-left">
          <h2><DollarSign size={24} /> Revenue Overview</h2>
          <p>Track and analyze your business income</p>
        </div>
        <div className="revenue-header-actions">
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="revenue-year-select">
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="revenue-view-toggle">
            {['monthly', 'quarterly'].map((v) => (
              <button key={v} className={viewMode === v ? 'active' : ''} onClick={() => setViewMode(v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={handlePrintRevenue}>
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="revenue-summary-grid">
        <div className="revenue-summary-card highlight">
          <div className="revenue-summary-icon"><DollarSign size={24} /></div>
          <div className="revenue-summary-content">
            <span className="revenue-summary-label">Total Revenue</span>
            <span className="revenue-summary-value">{formatCurrency(totalRevenue)}</span>
            <span className="revenue-summary-sub">{selectedYear}</span>
          </div>
        </div>
        <div className="revenue-summary-card">
          <div className="revenue-summary-icon"><CreditCard size={24} /></div>
          <div className="revenue-summary-content">
            <span className="revenue-summary-label">Transactions</span>
            <span className="revenue-summary-value">{yearPayments.length}</span>
            <span className="revenue-summary-sub">Completed payments</span>
          </div>
        </div>
        <div className="revenue-summary-card">
          <div className="revenue-summary-icon"><TrendingUp size={24} /></div>
          <div className="revenue-summary-content">
            <span className="revenue-summary-label">Avg Monthly</span>
            <span className="revenue-summary-value">{formatCurrency(avgMonthly)}</span>
            <span className="revenue-summary-sub">Per month avg</span>
          </div>
        </div>
        <div className="revenue-summary-card">
          <div className="revenue-summary-icon"><CalendarIcon size={24} /></div>
          <div className="revenue-summary-content">
            <span className="revenue-summary-label">YTD Revenue</span>
            <span className="revenue-summary-value">{formatCurrency(ytdRevenue)}</span>
            <span className="revenue-summary-sub">Year to date</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="revenue-chart-section">
        <h3>{viewMode === 'monthly' ? 'Monthly Revenue' : 'Quarterly Revenue'}</h3>
        <div className="revenue-bars">
          {viewMode === 'monthly' ? (
            monthlyData.map((m) => (
              <div key={m.month} className="revenue-bar-item">
                <div className="revenue-bar-wrapper">
                  <div
                    className="revenue-bar-fill"
                    style={{ height: `${(m.revenue / maxMonthRevenue) * 100}%` }}
                  />
                </div>
                <span className="revenue-bar-label">{m.name}</span>
                <span className="revenue-bar-value">{formatCurrency(m.revenue)}</span>
              </div>
            ))
          ) : (
            quarterlyData.map((q, i) => (
              <div key={i} className="revenue-bar-item quarterly">
                <div className="revenue-bar-wrapper">
                  <div
                    className="revenue-bar-fill"
                    style={{ height: `${(q.revenue / Math.max(...quarterlyData.map((x) => x.revenue), 1)) * 100}%` }}
                  />
                </div>
                <span className="revenue-bar-label">{q.name}</span>
                <span className="revenue-bar-value">{formatCurrency(q.revenue)}</span>
                <span className="revenue-bar-sub">{q.count} txns</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Breakdown Sections */}
      <div className="revenue-breakdown-grid">
        <div className="revenue-breakdown-card">
          <h4>By Service</h4>
          {byService.length === 0 ? (
            <p className="revenue-empty">No data</p>
          ) : (
            <div className="revenue-breakdown-list">
              {byService.map((s) => (
                <div key={s.name} className="revenue-breakdown-row">
                  <span className="revenue-breakdown-name">{formatLabel(s.name)}</span>
                  <span className="revenue-breakdown-count">{s.count}</span>
                  <span className="revenue-breakdown-amount">{formatCurrency(s.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="revenue-breakdown-card">
          <h4>By Tier</h4>
          {byTier.length === 0 ? (
            <p className="revenue-empty">No data</p>
          ) : (
            <div className="revenue-breakdown-list">
              {byTier.map((t) => (
                <div key={t.name} className="revenue-breakdown-row">
                  <span className="revenue-breakdown-name">{t.label}</span>
                  <span className="revenue-breakdown-count">{t.count}</span>
                  <span className="revenue-breakdown-amount">{formatCurrency(t.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="revenue-breakdown-card">
          <h4>By Payment Method</h4>
          {byMethod.length === 0 ? (
            <p className="revenue-empty">No data</p>
          ) : (
            <div className="revenue-breakdown-list">
              {byMethod.map((m) => (
                <div key={m.name} className="revenue-breakdown-row">
                  <span className="revenue-breakdown-name">{formatLabel(m.name)}</span>
                  <span className="revenue-breakdown-count">{m.count}</span>
                  <span className="revenue-breakdown-amount">{formatCurrency(m.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
