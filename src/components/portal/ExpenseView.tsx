import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingDown, PieChart as PieChartIcon, Calendar, Inbox } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { safeGetItem } from '../../constants';
import {
  LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const DATE_RANGES = ['3M', '6M', '1Y', 'All'];

const monthLabel = (m: string) => {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const getMonthsAgo = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 7);
};

const fmt = (v: any) => '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 0 });
const pct = (v: any) => Number(v || 0).toFixed(1) + '%';

const PIE_COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#14b8a6', '#6b7280'];

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="portal-expense-kpi" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="portal-expense-kpi-icon" style={{ color }}>
        {icon}
      </div>
      <div>
        <div className="portal-expense-kpi-label">{label}</div>
        <div className="portal-expense-kpi-value">{value}</div>
      </div>
    </div>
  );
}

export default function ExpenseView() {
  const { currentClient } = useAppContext();
  const clientId = currentClient?.id;

  const [dateRange, setDateRange] = useState('All');

  // Get financial data from localStorage
  const allFinancials = useMemo(() => safeGetItem('threeseas_bi_client_financials', {}), []);
  const clientData = allFinancials[clientId];
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
    return rawEntries.filter((e: any) => (!start || e.month >= start) && e.month <= now);
  }, [rawEntries, dateRange]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalExpenses = entries.reduce((sum: number, e: any) => sum + (e.expenses || 0), 0);
    const totalAdSpend = entries.reduce((sum: number, e: any) => sum + (e.adSpend || 0), 0);
    const totalOther = totalExpenses - totalAdSpend;

    const marketingPct = totalExpenses > 0 ? (totalAdSpend / totalExpenses) * 100 : 0;

    // Find largest category (for now, we only have Ad Spend vs Other)
    const largestCategory = totalAdSpend > totalOther ? 'Ad Spend' : 'Other Expenses';

    return {
      totalExpenses,
      totalAdSpend,
      totalOther: Math.max(totalOther, 0),
      marketingPct,
      largestCategory,
    };
  }, [entries]);

  // Chart data
  const trendData = useMemo(
    () => entries.map((e: any) => ({
      month: monthLabel(e.month),
      expenses: e.expenses || 0,
      adSpend: e.adSpend || 0,
    })),
    [entries]
  );

  const pieData = useMemo(() => {
    const data = [];
    if (stats.totalAdSpend > 0) {
      data.push({ name: 'Ad Spend', value: stats.totalAdSpend });
    }
    if (stats.totalOther > 0) {
      data.push({ name: 'Other Expenses', value: stats.totalOther });
    }
    return data;
  }, [stats]);

  if (!clientId) {
    return (
      <div className="portal-empty-state">
        <DollarSign size={48} />
        <h3>Not Logged In</h3>
        <p>Please log in to view your expense analytics.</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="portal-expense">
        <div className="portal-expense-header">
          <h2>Expense Analytics</h2>
          <p className="portal-expense-subtitle">Track your expenses and spending patterns.</p>
        </div>
        <div className="portal-empty-state">
          <Inbox size={48} />
          <h3>No Expense Data</h3>
          <p>Your expense data has not been recorded yet. Check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-expense">
      <div className="portal-expense-header">
        <h2>Expense Analytics</h2>
        <p className="portal-expense-subtitle">
          Showing expenses for {dateRange === 'All' ? 'all time' : `the last ${dateRange}`}
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="portal-expense-controls">
        <div className="portal-expense-filters">
          <Calendar size={16} />
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

      {/* KPI Cards */}
      <div className="portal-expense-kpis">
        <KpiCard
          icon={<DollarSign size={20} />}
          label="Total Expenses"
          value={fmt(stats.totalExpenses)}
          color="#ef4444"
        />
        <KpiCard
          icon={<TrendingDown size={20} />}
          label="Marketing %"
          value={pct(stats.marketingPct)}
          color="#f59e0b"
        />
        <KpiCard
          icon={<PieChartIcon size={20} />}
          label="Largest Category"
          value={stats.largestCategory}
          color="#8b5cf6"
        />
      </div>

      {/* Expense Breakdown Pie Chart */}
      {pieData.length > 0 && (
        <div className="portal-expense-chart-section">
          <h3 className="portal-section-title">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
              >
                {pieData.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: any) => [fmt(v), '']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly Expense Trend */}
      <div className="portal-expense-chart-section">
        <h3 className="portal-section-title">Expense Trend</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              stroke="#9ca3af"
            />
            <YAxis
              tickFormatter={(v: any) => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              stroke="#9ca3af"
            />
            <Tooltip
              formatter={(v: any, name: any) => [fmt(v), name === 'expenses' ? 'Total Expenses' : 'Ad Spend']}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="expenses"
              name="Total Expenses"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
            />
            <Line
              type="monotone"
              dataKey="adSpend"
              name="Ad Spend"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 3, fill: '#f59e0b' }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Marketing vs Non-Marketing Split */}
      <div className="portal-expense-split">
        <h3 className="portal-section-title">Marketing vs Non-Marketing</h3>
        <div className="portal-expense-split-bars">
          <div className="portal-expense-split-item">
            <div className="portal-expense-split-label">
              <span>Marketing (Ad Spend)</span>
              <strong>{fmt(stats.totalAdSpend)}</strong>
            </div>
            <div className="portal-expense-split-bar">
              <div
                className="portal-expense-split-fill"
                style={{
                  width: `${stats.marketingPct}%`,
                  background: '#f59e0b',
                }}
              />
            </div>
          </div>
          <div className="portal-expense-split-item">
            <div className="portal-expense-split-label">
              <span>Non-Marketing</span>
              <strong>{fmt(stats.totalOther)}</strong>
            </div>
            <div className="portal-expense-split-bar">
              <div
                className="portal-expense-split-fill"
                style={{
                  width: `${100 - stats.marketingPct}%`,
                  background: '#6b7280',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
