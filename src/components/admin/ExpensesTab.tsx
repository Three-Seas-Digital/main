import React, { useState, useMemo } from 'react';
import {
  Plus, Receipt, FileText, X, Printer, Eye, Trash2,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { escapeHtml } from '../../constants';

export default function ExpensesTab() {
  const { expenses, addExpense, deleteExpense, EXPENSE_CATEGORIES } = useAppContext();

  const [form, setForm] = useState<Record<string, string>>({ category: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: '', description: '' });
  const [receipt, setReceipt] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState<string>('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [receiptModal, setReceiptModal] = useState<any>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printSettings, setPrintSettings] = useState<Record<string, any>>({
    reportType: 'month', // 'month', 'dateRange', 'year', 'all'
    selectedMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    startDate: '',
    endDate: '',
    selectedYear: new Date().getFullYear(),
    category: 'all',
    groupBy: 'none', // 'none', 'category', 'day', 'week'
  });

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 800;
          let w = img.width, h = img.height;
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
            else { w = Math.round(w * MAX / h); h = MAX; }
          }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = e.target!.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    setReceiptName(file.name);
    const compressed = await compressImage(file);
    setReceipt(compressed);
    if (file.type.startsWith('image/')) {
      setReceiptPreview(compressed);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.category || !form.amount || !form.date) {
      setFormError('Category, amount, and date are required');
      return;
    }
    const result = addExpense({ ...form, receipt, receiptName });
    if (result.success) {
      setForm({ category: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: '', description: '' });
      setReceipt(null);
      setReceiptName('');
      setReceiptPreview(null);
    } else {
      setFormError(result.error);
    }
  };

  const handleDelete = (id: string) => {
    deleteExpense(id);
    setDeleteConfirm(null);
  };

  // Summary
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonth = `${now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()}-${String(now.getMonth() === 0 ? 12 : now.getMonth()).padStart(2, '0')}`;

  const monthExpenses = expenses.filter((e: any) => e.date.startsWith(currentMonth));
  const prevMonthExpenses = expenses.filter((e: any) => e.date.startsWith(prevMonth));
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const prevMonthTotal = prevMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const monthChange = prevMonthTotal > 0 ? ((monthTotal - prevMonthTotal) / prevMonthTotal * 100).toFixed(1) : null;

  const categoryBreakdown = EXPENSE_CATEGORIES.map((cat) => {
    const total = monthExpenses.filter((e: any) => e.category === cat.value).reduce((s, e) => s + e.amount, 0);
    return { ...cat, total };
  }).filter((c: any) => c.total > 0);
  const maxCatTotal = Math.max(...categoryBreakdown.map((c: any) => c.total), 1);

  // Filtered & sorted list
  const filtered = expenses
    .filter((e: any) => filterCat === 'all' || e.category === filterCat)
    .sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

  const getCatLabel = (val: string) => EXPENSE_CATEGORIES.find((c: any) => c.value === val)?.label || val;
  const getCatColor = (val: string) => EXPENSE_CATEGORIES.find((c: any) => c.value === val)?.color || '#6b7280';

  // Get available months and years for dropdowns
  const availableMonths = useMemo(() => {
    const months = new Set();
    expenses.forEach((e: any) => {
      const [year, month] = e.date.split('-');
      months.add(`${year}-${month}`);
    });
    return Array.from(months).sort().reverse();
  }, [expenses]);

  const availableYears = useMemo(() => {
    const years = new Set();
    expenses.forEach((e: any) => years.add(parseInt(e.date.split('-')[0])));
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a: any, b: any) => b - a);
  }, [expenses]);

  // Get filtered expenses for print based on settings
  const getFilteredExpensesForPrint = () => {
    let result = [...expenses];

    // Filter by date range/type
    if (printSettings.reportType === 'month') {
      result = result.filter((e: any) => e.date.startsWith(printSettings.selectedMonth));
    } else if (printSettings.reportType === 'year') {
      result = result.filter((e: any) => e.date.startsWith(printSettings.selectedYear.toString()));
    } else if (printSettings.reportType === 'dateRange' && printSettings.startDate && printSettings.endDate) {
      result = result.filter((e: any) => e.date >= printSettings.startDate && e.date <= printSettings.endDate);
    }

    // Filter by category
    if (printSettings.category !== 'all') {
      result = result.filter((e: any) => e.category === printSettings.category);
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  };

  // Get period label for report
  const getPeriodLabel = () => {
    if (printSettings.reportType === 'month') {
      const [year, month] = printSettings.selectedMonth.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (printSettings.reportType === 'year') {
      return `Year ${printSettings.selectedYear}`;
    } else if (printSettings.reportType === 'dateRange' && printSettings.startDate && printSettings.endDate) {
      const start = new Date(printSettings.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const end = new Date(printSettings.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${start} - ${end}`;
    }
    return 'All Time';
  };

  // Group expenses for report
  const groupExpenses = (expenseList: any[]) => {
    if (printSettings.groupBy === 'none') return null;

    const groups = {};
    expenseList.forEach((e: any) => {
      let key;
      if (printSettings.groupBy === 'category') {
        key = getCatLabel(e.category);
      } else if (printSettings.groupBy === 'day') {
        key = e.date;
      } else if (printSettings.groupBy === 'week') {
        const d = new Date(e.date + 'T00:00:00');
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().split('T')[0];
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return groups;
  };

  // Print expenses report
  const handlePrintExpenses = () => {
    const reportExpenses = getFilteredExpensesForPrint();
    const reportTotal = reportExpenses.reduce((s, e) => s + e.amount, 0);
    const catTotals = EXPENSE_CATEGORIES.map((cat) => ({
      ...cat,
      total: reportExpenses.filter((e: any) => e.category === cat.value).reduce((s, e) => s + e.amount, 0),
      count: reportExpenses.filter((e: any) => e.category === cat.value).length,
    })).filter((c: any) => c.total > 0);

    const groups = groupExpenses(reportExpenses);
    const periodLabel = getPeriodLabel();
    const categoryLabel = printSettings.category === 'all' ? 'All Categories' : getCatLabel(printSettings.category);

    let groupedHtml = '';
    if (groups) {
      const sortedKeys = Object.keys(groups).sort();
      groupedHtml = sortedKeys.map((key) => {
        const items = groups[key];
        const groupTotal = items.reduce((s, e) => s + e.amount, 0);
        let groupLabel = key;
        if (printSettings.groupBy === 'day') {
          groupLabel = new Date(key + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        } else if (printSettings.groupBy === 'week') {
          const weekEnd = new Date(key + 'T00:00:00');
          weekEnd.setDate(weekEnd.getDate() + 6);
          groupLabel = `Week of ${new Date(key + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
        return `
          <div class="group-section">
            <h3 class="group-header">${escapeHtml(groupLabel)} <span class="group-total">$${groupTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></h3>
            <table class="expense-table">
              <thead><tr><th>Date</th><th>Category</th><th>Vendor</th><th>Description</th><th class="amount">Amount</th></tr></thead>
              <tbody>
                ${items.map((e: any) => `
                  <tr>
                    <td>${new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                    <td>${escapeHtml(getCatLabel(e.category))}</td>
                    <td>${escapeHtml(e.vendor) || '-'}</td>
                    <td>${escapeHtml(e.description) || '-'}</td>
                    <td class="amount">$${e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }).join('');
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expense Report - ${periodLabel}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 900px; margin: 0 auto; }
          h1 { color: #1e3a5f; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 5px; }
          h2 { color: #374151; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
          .report-meta { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
          .report-meta span { display: inline-block; margin-right: 20px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 25px 0; }
          .summary-card { background: #f3f4f6; padding: 18px; border-radius: 8px; text-align: center; }
          .summary-card h3 { margin: 0 0 8px; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .summary-card p { margin: 0; font-size: 22px; font-weight: bold; color: #1e3a5f; }
          .category-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .category-table th, .category-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          .category-table th { background: #f9fafb; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          .category-table tr:last-child { background: #f0f9ff; }
          .category-table tr:last-child td { font-weight: bold; border-top: 2px solid #1e3a5f; }
          .expense-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
          .expense-table th, .expense-table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          .expense-table th { background: #f9fafb; font-weight: 600; }
          .expense-table .amount { text-align: right; font-family: monospace; }
          .group-section { margin-bottom: 25px; page-break-inside: avoid; }
          .group-header { display: flex; justify-content: space-between; align-items: center; background: #f0f9ff; padding: 10px 15px; border-radius: 6px; margin: 0 0 10px; font-size: 14px; }
          .group-total { color: #1e3a5f; font-weight: bold; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center; }
          @media print {
            body { padding: 20px; }
            .group-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>Expense Report</h1>
        <div class="report-meta">
          <span><strong>Period:</strong> ${periodLabel}</span>
          <span><strong>Category:</strong> ${escapeHtml(categoryLabel)}</span>
          <span><strong>Generated:</strong> ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>

        <div class="summary">
          <div class="summary-card">
            <h3>Total Expenses</h3>
            <p>$${reportTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div class="summary-card">
            <h3>Transactions</h3>
            <p>${reportExpenses.length}</p>
          </div>
          <div class="summary-card">
            <h3>Categories</h3>
            <p>${catTotals.length}</p>
          </div>
          <div class="summary-card">
            <h3>Avg per Transaction</h3>
            <p>$${reportExpenses.length > 0 ? (reportTotal / reportExpenses.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</p>
          </div>
        </div>

        <h2>Summary by Category</h2>
        <table class="category-table">
          <thead><tr><th>Category</th><th>Count</th><th style="text-align:right">Amount</th><th style="text-align:right">% of Total</th></tr></thead>
          <tbody>
            ${catTotals.map((c: any) => `
              <tr>
                <td>${escapeHtml(c.label)}</td>
                <td>${c.count}</td>
                <td style="text-align:right">$${c.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style="text-align:right">${reportTotal > 0 ? ((c.total / reportTotal) * 100).toFixed(1) : 0}%</td>
              </tr>
            `).join('')}
            <tr>
              <td>TOTAL</td>
              <td>${reportExpenses.length}</td>
              <td style="text-align:right">$${reportTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td style="text-align:right">100%</td>
            </tr>
          </tbody>
        </table>

        <h2>Expense Details${printSettings.groupBy !== 'none' ? ` (Grouped by ${printSettings.groupBy === 'category' ? 'Category' : printSettings.groupBy === 'day' ? 'Day' : 'Week'})` : ''}</h2>
        ${groups ? groupedHtml : `
          <table class="expense-table">
            <thead><tr><th>Date</th><th>Category</th><th>Vendor</th><th>Description</th><th class="amount">Amount</th></tr></thead>
            <tbody>
              ${reportExpenses.map((e: any) => `
                <tr>
                  <td>${new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>${escapeHtml(getCatLabel(e.category))}</td>
                  <td>${escapeHtml(e.vendor) || '-'}</td>
                  <td>${escapeHtml(e.description) || '-'}</td>
                  <td class="amount">$${e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}

        <div class="footer">
          <p>Three Seas Digital CRM — Expense Report — Keep this document for your tax records</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    setShowPrintModal(false);
  };

  return (
    <div className="expenses-tab">
      {/* Summary */}
      <div className="expense-summary">
        <div className="expense-summary-card">
          <span className="expense-summary-label">This Month</span>
          <span className="expense-summary-value">${monthTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          {monthChange !== null && (
            <span className={`expense-summary-change ${parseFloat(monthChange) > 0 ? 'up' : 'down'}`}>
              {parseFloat(monthChange) > 0 ? '+' : ''}{monthChange}% vs last month
            </span>
          )}
        </div>
        <div className="expense-summary-card">
          <span className="expense-summary-label">Total Expenses</span>
          <span className="expense-summary-value">${expenses.reduce((s, e) => s + e.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="expense-summary-change neutral">{expenses.length} recorded</span>
        </div>
        {categoryBreakdown.length > 0 && (
          <div className="expense-summary-card wide">
            <span className="expense-summary-label">This Month by Category</span>
            <div className="expense-category-bars">
              {categoryBreakdown.map((cat) => (
                <div key={cat.value} className="expense-category-bar">
                  <div className="expense-cat-bar-label">
                    <span style={{ color: cat.color }}>{cat.label}</span>
                    <span>${cat.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="expense-cat-bar-track">
                    <div className="expense-cat-bar-fill" style={{ width: `${(cat.total / maxCatTotal) * 100}%`, background: cat.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expense Form */}
      <div className="expense-form-wrapper">
        <h3><Plus size={16} /> Record Expense</h3>
        {formError && <div className="login-error">{formError}</div>}
        <form className="expense-form" onSubmit={handleSubmit}>
          <div className="expense-form-group">
            <label>Category *</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
              <option value="">Select category...</option>
              {EXPENSE_CATEGORIES.map((c: any) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="expense-form-group">
            <label>Amount *</label>
            <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
          </div>
          <div className="expense-form-group">
            <label>Date *</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div className="expense-form-group">
            <label>Vendor</label>
            <input type="text" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="Vendor name" />
          </div>
          <div className="expense-form-group full-width">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Expense details..." rows={2} />
          </div>
          <div className="expense-form-group full-width">
            <label>Receipt</label>
            <div
              className={`receipt-upload-area ${isDragging ? 'dragover' : ''} ${receiptPreview ? 'has-file' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('receipt-file-input').click()}
            >
              <input id="receipt-file-input" type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
              {receiptPreview ? (
                <div className="receipt-preview">
                  <img src={receiptPreview} alt="Receipt preview" />
                  <button type="button" className="receipt-remove-btn" onClick={(e) => { e.stopPropagation(); setReceipt(null); setReceiptName(''); setReceiptPreview(null); }}><X size={14} /></button>
                  <span className="receipt-filename">{receiptName}</span>
                </div>
              ) : receiptName ? (
                <div className="receipt-preview">
                  <FileText size={32} />
                  <button type="button" className="receipt-remove-btn" onClick={(e) => { e.stopPropagation(); setReceipt(null); setReceiptName(''); setReceiptPreview(null); }}><X size={14} /></button>
                  <span className="receipt-filename">{receiptName}</span>
                </div>
              ) : (
                <div className="receipt-upload-placeholder">
                  <Receipt size={24} />
                  <span>Drop receipt here or click to upload</span>
                  <span className="receipt-upload-hint">Images or PDF</span>
                </div>
              )}
            </div>
          </div>
          <div className="expense-form-actions">
            <button type="submit" className="btn btn-primary"><Plus size={14} /> Add Expense</button>
          </div>
        </form>
      </div>

      {/* Expense List */}
      <div className="expense-list-section">
        <div className="expense-list-header">
          <h3><Receipt size={16} /> Expense Records ({filtered.length})</h3>
          <div className="expense-list-filters">
            <button className="btn btn-outline btn-sm" onClick={() => setShowPrintModal(true)} title="Print expense report">
              <Printer size={14} /> Print Report
            </button>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map((c: any) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state"><Receipt size={48} /><p>No expenses recorded yet</p></div>
        ) : (
          <div className="expense-list">
            {filtered.map((exp) => (
              <div key={exp.id} className="expense-card">
                <div className="expense-card-top">
                  <span className="expense-category-badge" style={{ background: getCatColor(exp.category) }}>{getCatLabel(exp.category)}</span>
                  <span className="expense-amount">${exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {exp.vendor && <div className="expense-vendor">{exp.vendor}</div>}
                {exp.description && <div className="expense-description">{exp.description}</div>}
                <div className="expense-card-bottom">
                  <span className="expense-date">{new Date(exp.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <div className="expense-card-actions">
                    {exp.receipt && (
                      <button className="receipt-indicator" title="View receipt" onClick={() => setReceiptModal(exp)}>
                        <Eye size={14} /> Receipt
                      </button>
                    )}
                    {deleteConfirm === exp.id ? (
                      <>
                        <button className="btn btn-sm btn-delete" onClick={() => handleDelete(exp.id)}>Confirm</button>
                        <button className="btn btn-sm btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-delete" onClick={() => setDeleteConfirm(exp.id)}><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {receiptModal && (
        <div className="receipt-modal" onClick={() => setReceiptModal(null)}>
          <div className="receipt-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="receipt-modal-close" onClick={() => setReceiptModal(null)} aria-label="Close"><X size={20} /></button>
            <h3>Receipt — {getCatLabel(receiptModal.category)}</h3>
            {receiptModal.vendor && <p>{receiptModal.vendor} — ${receiptModal.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>}
            {receiptModal.receipt && receiptModal.receipt.startsWith('data:image') ? (
              <img src={receiptModal.receipt} alt="Receipt" className="receipt-modal-image" />
            ) : receiptModal.receipt ? (
              <div className="receipt-modal-pdf">
                <FileText size={48} />
                <p>{receiptModal.receiptName || 'PDF Receipt'}</p>
                <a href={receiptModal.receipt} download={receiptModal.receiptName || 'receipt.pdf'} className="btn btn-primary btn-sm">Download PDF</a>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Print Report Modal */}
      {showPrintModal && (
        <div className="print-modal-overlay" onClick={() => setShowPrintModal(false)}>
          <div className="print-modal" onClick={(e) => e.stopPropagation()}>
            <div className="print-modal-header">
              <h3><Printer size={20} /> Print Expense Report</h3>
              <button className="print-modal-close" onClick={() => setShowPrintModal(false)} aria-label="Close"><X size={20} /></button>
            </div>

            <div className="print-modal-body">
              {/* Report Type */}
              <div className="print-option-group">
                <label className="print-option-label">Report Period</label>
                <div className="print-option-buttons">
                  {[
                    { value: 'month', label: 'Month' },
                    { value: 'year', label: 'Year' },
                    { value: 'dateRange', label: 'Date Range' },
                    { value: 'all', label: 'All Time' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      className={`print-option-btn ${printSettings.reportType === opt.value ? 'active' : ''}`}
                      onClick={() => setPrintSettings({ ...printSettings, reportType: opt.value })}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Month Selector */}
              {printSettings.reportType === 'month' && (
                <div className="print-option-group">
                  <label className="print-option-label">Select Month</label>
                  <select
                    value={printSettings.selectedMonth}
                    onChange={(e) => setPrintSettings({ ...printSettings, selectedMonth: e.target.value })}
                    className="print-select"
                  >
                    {availableMonths.map((m: any) => {
                      const [year, month] = m.split('-');
                      const label = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      return <option key={m} value={m}>{label}</option>;
                    })}
                  </select>
                </div>
              )}

              {/* Year Selector */}
              {printSettings.reportType === 'year' && (
                <div className="print-option-group">
                  <label className="print-option-label">Select Year</label>
                  <select
                    value={printSettings.selectedYear}
                    onChange={(e) => setPrintSettings({ ...printSettings, selectedYear: parseInt(e.target.value) })}
                    className="print-select"
                  >
                    {availableYears.map((y: any) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}

              {/* Date Range */}
              {printSettings.reportType === 'dateRange' && (
                <div className="print-option-group">
                  <label className="print-option-label">Date Range</label>
                  <div className="print-date-range">
                    <input
                      type="date"
                      value={printSettings.startDate}
                      onChange={(e) => setPrintSettings({ ...printSettings, startDate: e.target.value })}
                      className="print-date-input"
                    />
                    <span>to</span>
                    <input
                      type="date"
                      value={printSettings.endDate}
                      onChange={(e) => setPrintSettings({ ...printSettings, endDate: e.target.value })}
                      className="print-date-input"
                    />
                  </div>
                </div>
              )}

              {/* Category Filter */}
              <div className="print-option-group">
                <label className="print-option-label">Category</label>
                <select
                  value={printSettings.category}
                  onChange={(e) => setPrintSettings({ ...printSettings, category: e.target.value })}
                  className="print-select"
                >
                  <option value="all">All Categories</option>
                  {EXPENSE_CATEGORIES.map((c: any) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Group By */}
              <div className="print-option-group">
                <label className="print-option-label">Group By</label>
                <div className="print-option-buttons">
                  {[
                    { value: 'none', label: 'None' },
                    { value: 'day', label: 'Day' },
                    { value: 'week', label: 'Week' },
                    { value: 'category', label: 'Category' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      className={`print-option-btn ${printSettings.groupBy === opt.value ? 'active' : ''}`}
                      onClick={() => setPrintSettings({ ...printSettings, groupBy: opt.value })}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview count */}
              <div className="print-preview-info">
                <Receipt size={16} />
                <span>{getFilteredExpensesForPrint().length} expenses will be included in this report</span>
              </div>
            </div>

            <div className="print-modal-footer">
              <button className="btn btn-outline" onClick={() => setShowPrintModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePrintExpenses} disabled={getFilteredExpensesForPrint().length === 0}>
                <Printer size={16} /> Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
