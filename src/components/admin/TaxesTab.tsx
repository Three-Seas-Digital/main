import { useState, useMemo } from 'react';
import {
  FileText, DollarSign, Receipt, TrendingUp,
  Wallet, Calendar as CalendarIcon, AlertCircle, Printer,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { escapeHtml } from '../../constants';

export default function TaxesTab() {
  const { expenses, payments, clients, EXPENSE_CATEGORIES } = useAppContext();
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [businessType, setBusinessType] = useState('sole_proprietor');

  // Helper to get year from payment (uses createdAt ISO string)
  const getPaymentYear = (p: any): number => new Date(p.createdAt).getFullYear();
  const getPaymentMonth = (p: any): string => String(new Date(p.createdAt).getMonth() + 1).padStart(2, '0');

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    expenses.forEach((e) => years.add(parseInt(e.date.split('-')[0])));
    payments.forEach((p) => years.add(getPaymentYear(p)));
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [expenses, payments]);

  // Calculate tax data for selected year
  const taxData = useMemo(() => {
    const yearStr = taxYear.toString();

    // Revenue from payments (uses createdAt ISO string)
    const yearPayments = payments.filter((p) => getPaymentYear(p) === taxYear && p.status === 'completed');
    const grossRevenue = yearPayments.reduce((sum, p) => sum + p.amount, 0);

    // Expenses by category
    const yearExpenses = expenses.filter((e) => e.date.startsWith(yearStr));
    const totalExpenses = yearExpenses.reduce((sum, e) => sum + e.amount, 0);

    const expensesByCategory = EXPENSE_CATEGORIES.map((cat) => {
      const catExpenses = yearExpenses.filter((e) => e.category === cat.value);
      return {
        ...cat,
        total: catExpenses.reduce((sum, e) => sum + e.amount, 0),
        count: catExpenses.length,
        items: catExpenses,
      };
    }).filter((c) => c.total > 0);

    // Net income
    const netIncome = grossRevenue - totalExpenses;

    // Quarterly breakdown
    const quarters = [
      { name: 'Q1', months: ['01', '02', '03'] },
      { name: 'Q2', months: ['04', '05', '06'] },
      { name: 'Q3', months: ['07', '08', '09'] },
      { name: 'Q4', months: ['10', '11', '12'] },
    ].map((q) => {
      const qRevenue = yearPayments
        .filter((p) => q.months.includes(getPaymentMonth(p)))
        .reduce((sum, p) => sum + p.amount, 0);
      const qExpenses = yearExpenses
        .filter((e) => q.months.some((m) => e.date.startsWith(`${yearStr}-${m}`)))
        .reduce((sum, e) => sum + e.amount, 0);
      return { ...q, revenue: qRevenue, expenses: qExpenses, net: qRevenue - qExpenses };
    });

    // Estimated quarterly tax (self-employment + income)
    const selfEmploymentRate = 0.153; // 15.3% SE tax
    const estimatedTaxRate = 0.22; // Estimated income tax bracket
    const estimatedQuarterlyTax = quarters.map((q) => ({
      ...q,
      seTax: Math.max(0, q.net * selfEmploymentRate),
      incomeTax: Math.max(0, q.net * estimatedTaxRate),
      totalTax: Math.max(0, q.net * (selfEmploymentRate + estimatedTaxRate)),
    }));

    // Monthly breakdown for detailed view
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthStr = `${yearStr}-${String(i + 1).padStart(2, '0')}`;
      const monthNum = String(i + 1).padStart(2, '0');
      const mRevenue = yearPayments.filter((p) => getPaymentMonth(p) === monthNum).reduce((sum, p) => sum + p.amount, 0);
      const mExpenses = yearExpenses.filter((e) => e.date.startsWith(monthStr)).reduce((sum, e) => sum + e.amount, 0);
      return {
        name: new Date(taxYear, i).toLocaleString('en-US', { month: 'short' }),
        revenue: mRevenue,
        expenses: mExpenses,
        net: mRevenue - mExpenses,
      };
    });

    // Deductible categories mapping for Schedule C
    const scheduleC: Record<string, number> = {
      advertising: 0,
      carAndTruck: expensesByCategory.find((c) => c.value === 'fuel')?.total || 0,
      commissions: 0,
      contractLabor: 0,
      depreciation: 0,
      insurance: 0,
      interest: 0,
      legal: 0,
      officeExpense: 0,
      pensionPlans: 0,
      rentLease: 0,
      repairs: 0,
      supplies: 0,
      taxes: 0,
      travel: expensesByCategory.find((c) => c.value === 'trips')?.total || 0,
      meals: (expensesByCategory.find((c) => c.value === 'food')?.total || 0) +
             (expensesByCategory.find((c) => c.value === 'meetings')?.total || 0),
      utilities: 0,
      wages: expensesByCategory.find((c) => c.value === 'wages')?.total || 0,
      otherExpenses: expensesByCategory.find((c) => c.value === 'receipts')?.total || 0,
    };
    scheduleC.totalExpenses = Object.values(scheduleC).reduce((a, b) => a + b, 0);

    return {
      grossRevenue,
      totalExpenses,
      netIncome,
      expensesByCategory,
      quarters,
      estimatedQuarterlyTax,
      months,
      scheduleC,
      transactionCount: yearPayments.length,
      expenseCount: yearExpenses.length,
      clientCount: clients.filter((c) => c.tier && c.tier !== 'free').length,
    };
  }, [taxYear, expenses, payments, clients, EXPENSE_CATEGORIES]);

  const formatCurrency = (num: number): string => `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Print tax summary
  const handlePrintTaxSummary = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Summary - ${taxYear}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
          h1 { color: #1e3a5f; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          h3 { color: #4b5563; margin-top: 20px; }
          .header-info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .header-info p { margin: 5px 0; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
          .summary-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-box.highlight { background: #ecfdf5; border-color: #10b981; }
          .summary-box.warning { background: #fef3c7; border-color: #f59e0b; }
          .summary-box h4 { margin: 0 0 5px; font-size: 12px; color: #6b7280; text-transform: uppercase; }
          .summary-box p { margin: 0; font-size: 20px; font-weight: bold; color: #1e3a5f; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          td.amount { text-align: right; font-family: monospace; }
          .schedule-c { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .schedule-c h3 { margin-top: 0; color: #0369a1; }
          .note { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; }
          @media print { body { padding: 20px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <h1>Business Tax Summary - ${taxYear}</h1>

        <div class="header-info">
          <p><strong>Business Name:</strong> Three Seas Digital</p>
          <p><strong>Tax Year:</strong> ${taxYear}</p>
          <p><strong>Business Type:</strong> ${businessType === 'sole_proprietor' ? 'Sole Proprietor' : businessType === 'llc' ? 'LLC' : 'S-Corp'}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <h2>Annual Summary</h2>
        <div class="summary-grid">
          <div class="summary-box">
            <h4>Gross Revenue</h4>
            <p>${formatCurrency(taxData.grossRevenue)}</p>
          </div>
          <div class="summary-box">
            <h4>Total Expenses</h4>
            <p>${formatCurrency(taxData.totalExpenses)}</p>
          </div>
          <div class="summary-box highlight">
            <h4>Net Income</h4>
            <p>${formatCurrency(taxData.netIncome)}</p>
          </div>
        </div>

        <h2>Quarterly Breakdown</h2>
        <table>
          <thead><tr><th>Quarter</th><th class="amount">Revenue</th><th class="amount">Expenses</th><th class="amount">Net Income</th><th class="amount">Est. Tax Due</th></tr></thead>
          <tbody>
            ${taxData.estimatedQuarterlyTax.map((q) => `
              <tr>
                <td>${q.name}</td>
                <td class="amount">${formatCurrency(q.revenue)}</td>
                <td class="amount">${formatCurrency(q.expenses)}</td>
                <td class="amount">${formatCurrency(q.net)}</td>
                <td class="amount">${formatCurrency(q.totalTax)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Expense Categories (Deductions)</h2>
        <table>
          <thead><tr><th>Category</th><th>Count</th><th class="amount">Total</th></tr></thead>
          <tbody>
            ${taxData.expensesByCategory.map((c) => `
              <tr><td>${escapeHtml(c.label)}</td><td>${c.count}</td><td class="amount">${formatCurrency(c.total)}</td></tr>
            `).join('')}
            <tr style="font-weight:bold;border-top:2px solid #1e3a5f">
              <td>TOTAL DEDUCTIONS</td>
              <td>${taxData.expenseCount}</td>
              <td class="amount">${formatCurrency(taxData.totalExpenses)}</td>
            </tr>
          </tbody>
        </table>

        <div class="schedule-c">
          <h3>Schedule C Reference (Profit or Loss from Business)</h3>
          <table>
            <tr><td>Line 1 - Gross receipts or sales</td><td class="amount">${formatCurrency(taxData.grossRevenue)}</td></tr>
            <tr><td>Line 4 - Cost of goods sold</td><td class="amount">$0.00</td></tr>
            <tr><td>Line 5 - Gross profit</td><td class="amount">${formatCurrency(taxData.grossRevenue)}</td></tr>
            <tr><td>Line 9 - Car and truck expenses</td><td class="amount">${formatCurrency(taxData.scheduleC.carAndTruck)}</td></tr>
            <tr><td>Line 24a - Travel</td><td class="amount">${formatCurrency(taxData.scheduleC.travel)}</td></tr>
            <tr><td>Line 24b - Meals (50% deductible)</td><td class="amount">${formatCurrency(taxData.scheduleC.meals)}</td></tr>
            <tr><td>Line 26 - Wages</td><td class="amount">${formatCurrency(taxData.scheduleC.wages)}</td></tr>
            <tr><td>Line 27a - Other expenses</td><td class="amount">${formatCurrency(taxData.scheduleC.otherExpenses)}</td></tr>
            <tr style="font-weight:bold;border-top:2px solid #0369a1">
              <td>Line 28 - Total expenses</td>
              <td class="amount">${formatCurrency(taxData.totalExpenses)}</td>
            </tr>
            <tr style="font-weight:bold;background:#ecfdf5">
              <td>Line 31 - Net profit (or loss)</td>
              <td class="amount">${formatCurrency(taxData.netIncome)}</td>
            </tr>
          </table>
        </div>

        <h2>Estimated Tax Liability</h2>
        <div class="summary-grid">
          <div class="summary-box warning">
            <h4>Self-Employment Tax (15.3%)</h4>
            <p>${formatCurrency(taxData.netIncome * 0.153)}</p>
          </div>
          <div class="summary-box warning">
            <h4>Est. Income Tax (22%)</h4>
            <p>${formatCurrency(taxData.netIncome * 0.22)}</p>
          </div>
          <div class="summary-box warning">
            <h4>Total Est. Tax</h4>
            <p>${formatCurrency(taxData.netIncome * 0.373)}</p>
          </div>
        </div>

        <div class="note">
          <strong>Important Notes:</strong>
          <ul>
            <li>This is an estimate only. Consult a tax professional for accurate tax advice.</li>
            <li>Meals and entertainment are typically 50% deductible.</li>
            <li>Vehicle expenses may be calculated using actual expenses or standard mileage rate.</li>
            <li>Keep all receipts and documentation for at least 7 years.</li>
            <li>Quarterly estimated taxes are due Apr 15, Jun 15, Sep 15, and Jan 15.</li>
          </ul>
        </div>

        <div class="footer">
          <p>Generated by Three Seas Digital CRM | This document is for reference purposes only and does not constitute tax advice.</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="taxes-tab">
      {/* Header */}
      <div className="taxes-header">
        <div className="taxes-header-left">
          <h2><FileText size={24} /> Business Tax Center</h2>
          <p>Auto-generated tax information from your financial records</p>
        </div>
        <div className="taxes-header-actions">
          <select value={taxYear} onChange={(e) => setTaxYear(parseInt(e.target.value))} className="taxes-year-select">
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="taxes-type-select">
            <option value="sole_proprietor">Sole Proprietor</option>
            <option value="llc">LLC</option>
            <option value="scorp">S-Corp</option>
          </select>
          <button className="btn btn-primary" onClick={handlePrintTaxSummary}>
            <Printer size={16} /> Print Tax Summary
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="taxes-summary-grid">
        <div className="taxes-summary-card">
          <div className="taxes-summary-icon revenue"><DollarSign size={24} /></div>
          <div className="taxes-summary-content">
            <span className="taxes-summary-label">Gross Revenue</span>
            <span className="taxes-summary-value">{formatCurrency(taxData.grossRevenue)}</span>
            <span className="taxes-summary-sub">{taxData.transactionCount} transactions</span>
          </div>
        </div>
        <div className="taxes-summary-card">
          <div className="taxes-summary-icon expenses"><Receipt size={24} /></div>
          <div className="taxes-summary-content">
            <span className="taxes-summary-label">Total Deductions</span>
            <span className="taxes-summary-value">{formatCurrency(taxData.totalExpenses)}</span>
            <span className="taxes-summary-sub">{taxData.expenseCount} expenses</span>
          </div>
        </div>
        <div className="taxes-summary-card highlight">
          <div className="taxes-summary-icon net"><TrendingUp size={24} /></div>
          <div className="taxes-summary-content">
            <span className="taxes-summary-label">Net Income</span>
            <span className="taxes-summary-value">{formatCurrency(taxData.netIncome)}</span>
            <span className="taxes-summary-sub">Taxable income</span>
          </div>
        </div>
        <div className="taxes-summary-card warning">
          <div className="taxes-summary-icon tax"><Wallet size={24} /></div>
          <div className="taxes-summary-content">
            <span className="taxes-summary-label">Est. Tax Liability</span>
            <span className="taxes-summary-value">{formatCurrency(taxData.netIncome * 0.373)}</span>
            <span className="taxes-summary-sub">SE + Income tax</span>
          </div>
        </div>
      </div>

      {/* Quarterly Estimates */}
      <div className="taxes-section">
        <h3><CalendarIcon size={18} /> Quarterly Tax Estimates</h3>
        <div className="taxes-quarterly-grid">
          {taxData.estimatedQuarterlyTax.map((q) => (
            <div key={q.name} className="taxes-quarter-card">
              <div className="taxes-quarter-header">
                <span className="taxes-quarter-name">{q.name}</span>
                <span className={`taxes-quarter-net ${q.net >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(q.net)}
                </span>
              </div>
              <div className="taxes-quarter-details">
                <div className="taxes-quarter-row">
                  <span>Revenue</span>
                  <span>{formatCurrency(q.revenue)}</span>
                </div>
                <div className="taxes-quarter-row">
                  <span>Expenses</span>
                  <span>-{formatCurrency(q.expenses)}</span>
                </div>
                <div className="taxes-quarter-row highlight">
                  <span>Est. Tax Due</span>
                  <span>{formatCurrency(q.totalTax)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="taxes-section">
        <h3><Receipt size={18} /> Deductible Expenses by Category</h3>
        {taxData.expensesByCategory.length === 0 ? (
          <div className="taxes-empty">
            <Receipt size={48} />
            <p>No expenses recorded for {taxYear}</p>
          </div>
        ) : (
          <div className="taxes-expense-list">
            {taxData.expensesByCategory.map((cat) => (
              <div key={cat.value} className="taxes-expense-row">
                <div className="taxes-expense-info">
                  <span className="taxes-expense-color" style={{ background: cat.color }} />
                  <span className="taxes-expense-name">{cat.label}</span>
                  <span className="taxes-expense-count">{cat.count} items</span>
                </div>
                <span className="taxes-expense-amount">{formatCurrency(cat.total)}</span>
              </div>
            ))}
            <div className="taxes-expense-row total">
              <div className="taxes-expense-info">
                <span className="taxes-expense-name">Total Deductions</span>
              </div>
              <span className="taxes-expense-amount">{formatCurrency(taxData.totalExpenses)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Schedule C Preview */}
      <div className="taxes-section schedule-c">
        <h3><FileText size={18} /> Schedule C Reference</h3>
        <p className="taxes-section-note">Preview of key Schedule C line items based on your records</p>
        <div className="taxes-schedule-grid">
          <div className="taxes-schedule-row">
            <span className="taxes-schedule-line">Line 1</span>
            <span className="taxes-schedule-desc">Gross receipts or sales</span>
            <span className="taxes-schedule-amount">{formatCurrency(taxData.grossRevenue)}</span>
          </div>
          <div className="taxes-schedule-row">
            <span className="taxes-schedule-line">Line 5</span>
            <span className="taxes-schedule-desc">Gross profit</span>
            <span className="taxes-schedule-amount">{formatCurrency(taxData.grossRevenue)}</span>
          </div>
          <div className="taxes-schedule-row">
            <span className="taxes-schedule-line">Line 9</span>
            <span className="taxes-schedule-desc">Car and truck expenses (Fuel)</span>
            <span className="taxes-schedule-amount">{formatCurrency(taxData.scheduleC.carAndTruck)}</span>
          </div>
          <div className="taxes-schedule-row">
            <span className="taxes-schedule-line">Line 24a</span>
            <span className="taxes-schedule-desc">Travel expenses (Trips)</span>
            <span className="taxes-schedule-amount">{formatCurrency(taxData.scheduleC.travel)}</span>
          </div>
          <div className="taxes-schedule-row">
            <span className="taxes-schedule-line">Line 24b</span>
            <span className="taxes-schedule-desc">Meals & meetings (50% deductible)</span>
            <span className="taxes-schedule-amount">{formatCurrency(taxData.scheduleC.meals)}</span>
          </div>
          <div className="taxes-schedule-row">
            <span className="taxes-schedule-line">Line 26</span>
            <span className="taxes-schedule-desc">Wages paid</span>
            <span className="taxes-schedule-amount">{formatCurrency(taxData.scheduleC.wages)}</span>
          </div>
          <div className="taxes-schedule-row">
            <span className="taxes-schedule-line">Line 27a</span>
            <span className="taxes-schedule-desc">Other expenses</span>
            <span className="taxes-schedule-amount">{formatCurrency(taxData.scheduleC.otherExpenses)}</span>
          </div>
          <div className="taxes-schedule-row total">
            <span className="taxes-schedule-line">Line 28</span>
            <span className="taxes-schedule-desc">Total expenses</span>
            <span className="taxes-schedule-amount">{formatCurrency(taxData.totalExpenses)}</span>
          </div>
          <div className="taxes-schedule-row net-profit">
            <span className="taxes-schedule-line">Line 31</span>
            <span className="taxes-schedule-desc">Net profit (or loss)</span>
            <span className="taxes-schedule-amount">{formatCurrency(taxData.netIncome)}</span>
          </div>
        </div>
      </div>

      {/* Tax Tips */}
      <div className="taxes-tips">
        <h3><AlertCircle size={18} /> Important Tax Reminders</h3>
        <ul>
          <li><strong>Quarterly Payments:</strong> Due April 15, June 15, September 15, January 15</li>
          <li><strong>Meals Deduction:</strong> Business meals are typically 50% deductible</li>
          <li><strong>Vehicle Expenses:</strong> Track mileage or actual expenses for car deductions</li>
          <li><strong>Record Keeping:</strong> Keep all receipts and records for at least 7 years</li>
          <li><strong>Professional Advice:</strong> Consult a CPA for accurate tax preparation</li>
        </ul>
      </div>
    </div>
  );
}
