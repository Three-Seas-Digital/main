import { useState, useMemo } from 'react';
import {
  TrendingUp, DollarSign, Receipt,
  BarChart3, Printer,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { escapeHtml } from '../../constants';

const getPaymentDate = (p) => new Date(p.createdAt);
const getPaymentYear = (p) => getPaymentDate(p).getFullYear();
const getPaymentMonth = (p) => getPaymentDate(p).getMonth();

export default function ProfitTab() {
  const { payments, expenses, EXPENSE_CATEGORIES } = useAppContext();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const availableYears = useMemo(() => {
    const years = new Set();
    payments.forEach((p) => years.add(getPaymentYear(p)));
    expenses.forEach((e) => years.add(parseInt(e.date.split('-')[0])));
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [payments, expenses]);

  const yearPayments = useMemo(() => {
    return payments.filter((p) => getPaymentYear(p) === selectedYear && p.status === 'completed');
  }, [payments, selectedYear]);

  const yearExpenses = useMemo(() => {
    return expenses.filter((e) => e.date.startsWith(selectedYear.toString()));
  }, [expenses, selectedYear]);

  const totalRevenue = yearPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
  const grossProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Monthly P&L
  const monthlyPL = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      name: new Date(selectedYear, i).toLocaleString('en-US', { month: 'short' }),
      fullName: new Date(selectedYear, i).toLocaleString('en-US', { month: 'long' }),
      revenue: 0,
      expenses: 0,
      profit: 0,
    }));

    yearPayments.forEach((p) => {
      const m = getPaymentMonth(p);
      months[m].revenue += p.amount;
    });

    yearExpenses.forEach((e) => {
      const m = parseInt(e.date.split('-')[1]) - 1;
      months[m].expenses += e.amount;
    });

    months.forEach((m) => {
      m.profit = m.revenue - m.expenses;
    });

    return months;
  }, [yearPayments, yearExpenses, selectedYear]);

  // Expense breakdown
  const expenseBreakdown = useMemo(() => {
    return EXPENSE_CATEGORIES.map((cat) => ({
      ...cat,
      total: yearExpenses.filter((e) => e.category === cat.value).reduce((sum, e) => sum + e.amount, 0),
    })).filter((c) => c.total > 0);
  }, [yearExpenses, EXPENSE_CATEGORIES]);

  const formatCurrency = (num) => `$${Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const maxValue = Math.max(...monthlyPL.map((m) => Math.max(m.revenue, m.expenses)), 1);

  // Print P&L report
  const handlePrintPL = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Profit & Loss - ${selectedYear}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 900px; margin: 0 auto; }
          h1 { color: #1e3a5f; border-bottom: 2px solid #8b5cf6; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .summary-card { background: #f3f4f6; padding: 18px; border-radius: 8px; text-align: center; }
          .summary-card.profit { background: #ecfdf5; border: 1px solid #10b981; }
          .summary-card.loss { background: #fef2f2; border: 1px solid #ef4444; }
          .summary-card h3 { margin: 0 0 8px; font-size: 11px; color: #6b7280; text-transform: uppercase; }
          .summary-card p { margin: 0; font-size: 20px; font-weight: bold; color: #1e3a5f; }
          .summary-card p.positive { color: #10b981; }
          .summary-card p.negative { color: #ef4444; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; font-size: 12px; }
          td.amount { text-align: right; font-family: monospace; }
          td.positive { color: #10b981; }
          td.negative { color: #ef4444; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Profit & Loss Statement - ${selectedYear}</h1>
        <p>Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div class="summary">
          <div class="summary-card"><h3>Revenue</h3><p>${formatCurrency(totalRevenue)}</p></div>
          <div class="summary-card"><h3>Expenses</h3><p>${formatCurrency(totalExpenses)}</p></div>
          <div class="summary-card ${grossProfit >= 0 ? 'profit' : 'loss'}"><h3>Net Profit</h3><p class="${grossProfit >= 0 ? 'positive' : 'negative'}">${grossProfit >= 0 ? '' : '-'}${formatCurrency(grossProfit)}</p></div>
          <div class="summary-card"><h3>Margin</h3><p>${profitMargin.toFixed(1)}%</p></div>
        </div>

        <h2>Monthly Profit & Loss</h2>
        <table>
          <thead><tr><th>Month</th><th class="amount">Revenue</th><th class="amount">Expenses</th><th class="amount">Profit</th></tr></thead>
          <tbody>
            ${monthlyPL.map((m) => `
              <tr>
                <td>${m.fullName}</td>
                <td class="amount">${formatCurrency(m.revenue)}</td>
                <td class="amount">${formatCurrency(m.expenses)}</td>
                <td class="amount ${m.profit >= 0 ? 'positive' : 'negative'}">${m.profit >= 0 ? '' : '-'}${formatCurrency(m.profit)}</td>
              </tr>
            `).join('')}
            <tr style="font-weight:bold;background:#f9fafb">
              <td>TOTAL</td>
              <td class="amount">${formatCurrency(totalRevenue)}</td>
              <td class="amount">${formatCurrency(totalExpenses)}</td>
              <td class="amount ${grossProfit >= 0 ? 'positive' : 'negative'}">${grossProfit >= 0 ? '' : '-'}${formatCurrency(grossProfit)}</td>
            </tr>
          </tbody>
        </table>

        <h2>Expense Breakdown</h2>
        <table>
          <thead><tr><th>Category</th><th class="amount">Amount</th><th class="amount">% of Expenses</th></tr></thead>
          <tbody>
            ${expenseBreakdown.map((c) => `<tr><td>${escapeHtml(c.label)}</td><td class="amount">${formatCurrency(c.total)}</td><td class="amount">${totalExpenses > 0 ? ((c.total / totalExpenses) * 100).toFixed(1) : 0}%</td></tr>`).join('')}
          </tbody>
        </table>

        <div class="footer"><p>Three Seas Digital CRM — Profit & Loss Statement</p></div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="profit-tab">
      <div className="profit-header">
        <div className="profit-header-left">
          <h2><TrendingUp size={24} /> Profit & Loss</h2>
          <p>Monitor your business profitability</p>
        </div>
        <div className="profit-header-actions">
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="profit-year-select">
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={handlePrintPL}>
            <Printer size={16} /> Print P&L
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="profit-summary-grid">
        <div className="profit-summary-card revenue">
          <div className="profit-summary-icon"><DollarSign size={24} /></div>
          <div className="profit-summary-content">
            <span className="profit-summary-label">Total Revenue</span>
            <span className="profit-summary-value">{formatCurrency(totalRevenue)}</span>
          </div>
        </div>
        <div className="profit-summary-card expenses">
          <div className="profit-summary-icon"><Receipt size={24} /></div>
          <div className="profit-summary-content">
            <span className="profit-summary-label">Total Expenses</span>
            <span className="profit-summary-value">{formatCurrency(totalExpenses)}</span>
          </div>
        </div>
        <div className={`profit-summary-card ${grossProfit >= 0 ? 'profit' : 'loss'}`}>
          <div className="profit-summary-icon"><TrendingUp size={24} /></div>
          <div className="profit-summary-content">
            <span className="profit-summary-label">Net Profit</span>
            <span className="profit-summary-value">{grossProfit < 0 ? '-' : ''}{formatCurrency(grossProfit)}</span>
          </div>
        </div>
        <div className="profit-summary-card margin">
          <div className="profit-summary-icon"><BarChart3 size={24} /></div>
          <div className="profit-summary-content">
            <span className="profit-summary-label">Profit Margin</span>
            <span className="profit-summary-value">{profitMargin.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="profit-chart-section">
        <h3>Monthly Profit & Loss</h3>
        <div className="profit-chart-legend">
          <span className="profit-legend-item revenue"><span className="profit-legend-dot" /> Revenue</span>
          <span className="profit-legend-item expenses"><span className="profit-legend-dot" /> Expenses</span>
        </div>
        <div className="profit-chart">
          {monthlyPL.map((m) => (
            <div key={m.month} className="profit-chart-col">
              <div className="profit-chart-bars">
                <div
                  className="profit-bar revenue"
                  style={{ height: `${(m.revenue / maxValue) * 100}%` }}
                  title={`Revenue: ${formatCurrency(m.revenue)}`}
                />
                <div
                  className="profit-bar expenses"
                  style={{ height: `${(m.expenses / maxValue) * 100}%` }}
                  title={`Expenses: ${formatCurrency(m.expenses)}`}
                />
              </div>
              <span className="profit-chart-label">{m.name}</span>
              <span className={`profit-chart-value ${m.profit >= 0 ? 'positive' : 'negative'}`}>
                {m.profit >= 0 ? '+' : '-'}{formatCurrency(m.profit)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Details Grid */}
      <div className="profit-details-grid">
        {/* Monthly Table */}
        <div className="profit-details-card wide">
          <h4>Monthly Breakdown</h4>
          <div className="profit-table-wrapper">
            <table className="profit-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="amount">Revenue</th>
                  <th className="amount">Expenses</th>
                  <th className="amount">Profit</th>
                  <th className="amount">Margin</th>
                </tr>
              </thead>
              <tbody>
                {monthlyPL.map((m) => (
                  <tr key={m.month}>
                    <td>{m.fullName}</td>
                    <td className="amount">{formatCurrency(m.revenue)}</td>
                    <td className="amount">{formatCurrency(m.expenses)}</td>
                    <td className={`amount ${m.profit >= 0 ? 'positive' : 'negative'}`}>
                      {m.profit >= 0 ? '' : '-'}{formatCurrency(m.profit)}
                    </td>
                    <td className="amount">{m.revenue > 0 ? ((m.profit / m.revenue) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total</strong></td>
                  <td className="amount"><strong>{formatCurrency(totalRevenue)}</strong></td>
                  <td className="amount"><strong>{formatCurrency(totalExpenses)}</strong></td>
                  <td className={`amount ${grossProfit >= 0 ? 'positive' : 'negative'}`}>
                    <strong>{grossProfit >= 0 ? '' : '-'}{formatCurrency(grossProfit)}</strong>
                  </td>
                  <td className="amount"><strong>{profitMargin.toFixed(1)}%</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="profit-details-card">
          <h4>Expense Categories</h4>
          {expenseBreakdown.length === 0 ? (
            <p className="profit-empty">No expenses recorded</p>
          ) : (
            <div className="profit-expense-list">
              {expenseBreakdown.map((c) => (
                <div key={c.value} className="profit-expense-row">
                  <span className="profit-expense-color" style={{ background: c.color }} />
                  <span className="profit-expense-name">{c.label}</span>
                  <span className="profit-expense-amount">{formatCurrency(c.total)}</span>
                  <span className="profit-expense-pct">{((c.total / totalExpenses) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
