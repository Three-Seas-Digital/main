import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, BarChart3, Calendar, Inbox, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { safeGetItem } from '../../constants';
import {
  LineChart, Line, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts';

const DATE_RANGES = ['3M', '6M', '1Y', 'All'];

const monthLabel = (m) => {
  const [y, mo] = m.split('-');
  return new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const getMonthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 7);
};

const fmt = (v) => '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 0 });
const pct = (v) => Number(v || 0).toFixed(1) + '%';

function KpiCard({ icon, label, value, color, trend }) {
  return (
    <div className="portal-profit-kpi" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="portal-profit-kpi-icon" style={{ color }}>
        {icon}
      </div>
      <div>
        <div className="portal-profit-kpi-label">{label}</div>
        <div className="portal-profit-kpi-value">
          {value}
          {trend != null && trend !== 0 && (
            <span
              className="portal-profit-kpi-trend"
              style={{ color: trend >= 0 ? '#22c55e' : '#ef4444' }}
            >
              {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfitabilityView() {
  const { currentClient } = useAppContext();
  const clientId = currentClient?.id;

  const [dateRange, setDateRange] = useState('All');

  // Get financial data from localStorage
  const allFinancials = useMemo(() => safeGetItem('threeseas_bi_client_financials', {}), []);
  const clientData = allFinancials[clientId];
  const rawEntries = useMemo(
    () => (clientData?.entries || []).slice().sort((a, b) => a.month.localeCompare(b.month)),
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

  // Calculate stats
  const stats = useMemo(() => {
    const revenue = entries.reduce((sum, e) => sum + (e.revenue || 0), 0);
    const expenses = entries.reduce((sum, e) => sum + (e.expenses || 0), 0);
    const profit = revenue - expenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // MoM change (compare last 2 months)
    let momChange = null;
    if (entries.length >= 2) {
      const sorted = [...entries].sort((a, b) => a.month.localeCompare(b.month));
      const last = sorted[sorted.length - 1];
      const prev = sorted[sorted.length - 2];
      const lastProfit = (last.revenue || 0) - (last.expenses || 0);
      const prevProfit = (prev.revenue || 0) - (prev.expenses || 0);
      if (prevProfit !== 0) {
        momChange = ((lastProfit - prevProfit) / Math.abs(prevProfit)) * 100;
      }
    }

    // Best quarter (aggregate by quarter)
    const quarters = {};
    entries.forEach(e => {
      const [year, month] = e.month.split('-');
      const q = Math.ceil(parseInt(month) / 3);
      const key = `${year}-Q${q}`;
      if (!quarters[key]) quarters[key] = { revenue: 0, expenses: 0 };
      quarters[key].revenue += e.revenue || 0;
      quarters[key].expenses += e.expenses || 0;
    });

    const bestQuarter = Object.entries(quarters)
      .map(([key, data]) => ({ key, profit: data.revenue - data.expenses }))
      .sort((a, b) => b.profit - a.profit)[0];

    return {
      revenue,
      expenses,
      profit,
      margin,
      momChange,
      bestQuarter: bestQuarter ? `${bestQuarter.key}: ${fmt(bestQuarter.profit)}` : 'N/A',
    };
  }, [entries]);

  // Chart data
  const trendData = useMemo(
    () => entries.map(e => ({
      month: monthLabel(e.month),
      revenue: e.revenue || 0,
      expenses: e.expenses || 0,
      profit: (e.revenue || 0) - (e.expenses || 0),
      margin: e.revenue > 0 ? (((e.revenue || 0) - (e.expenses || 0)) / e.revenue) * 100 : 0,
    })),
    [entries]
  );

  // Waterfall chart (using stacked bars to simulate)
  const waterfallData = useMemo(() => {
    if (entries.length === 0) return [];
    return entries.map(e => {
      const revenue = e.revenue || 0;
      const expenses = e.expenses || 0;
      const profit = revenue - expenses;
      return {
        month: monthLabel(e.month),
        revenue,
        expenses: -expenses, // Negative for visual effect
        profit,
      };
    });
  }, [entries]);

  if (!clientId) {
    return (
      <div className="portal-empty-state">
        <DollarSign size={48} />
        <h3>Not Logged In</h3>
        <p>Please log in to view your profitability analytics.</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="portal-profit">
        <div className="portal-profit-header">
          <h2>Profitability Analytics</h2>
          <p className="portal-profit-subtitle">Track your profit margins and performance.</p>
        </div>
        <div className="portal-empty-state">
          <Inbox size={48} />
          <h3>No Profitability Data</h3>
          <p>Your financial data has not been recorded yet. Check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-profit">
      <div className="portal-profit-header">
        <h2>Profitability Analytics</h2>
        <p className="portal-profit-subtitle">
          Showing profitability for {dateRange === 'All' ? 'all time' : `the last ${dateRange}`}
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="portal-profit-controls">
        <div className="portal-profit-filters">
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
      <div className="portal-profit-kpis">
        <KpiCard
          icon={<DollarSign size={20} />}
          label="Net Profit"
          value={fmt(stats.profit)}
          color={stats.profit >= 0 ? '#22c55e' : '#ef4444'}
          trend={stats.momChange}
        />
        <KpiCard
          icon={<TrendingUp size={20} />}
          label="Profit Margin"
          value={pct(stats.margin)}
          color="#3b82f6"
        />
        <KpiCard
          icon={<BarChart3 size={20} />}
          label="Best Quarter"
          value={stats.bestQuarter}
          color="#8b5cf6"
        />
      </div>

      {/* Profit Margin Trend */}
      <div className="portal-profit-chart-section">
        <h3 className="portal-section-title">Profit Margin Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              stroke="#9ca3af"
            />
            <YAxis
              yAxisId="left"
              tickFormatter={v => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              stroke="#9ca3af"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={v => v.toFixed(0) + '%'}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              stroke="#9ca3af"
            />
            <Tooltip
              formatter={(v, name) => {
                if (name === 'Profit Margin') return [pct(v), name];
                return [fmt(v), name];
              }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <ReferenceLine yAxisId="left" y={0} stroke="#9ca3af" strokeDasharray="3 3" />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="profit"
              name="Net Profit"
              stroke={stats.profit >= 0 ? '#22c55e' : '#ef4444'}
              strokeWidth={3}
              dot={{ r: 4, fill: stats.profit >= 0 ? '#22c55e' : '#ef4444', strokeWidth: 2, stroke: '#fff' }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="margin"
              name="Profit Margin"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3, fill: '#3b82f6' }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Waterfall Chart (Revenue → Expenses → Profit) */}
      <div className="portal-profit-chart-section">
        <h3 className="portal-section-title">Revenue Waterfall</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={waterfallData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              stroke="#9ca3af"
            />
            <YAxis
              tickFormatter={v => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              stroke="#9ca3af"
            />
            <Tooltip
              formatter={(v, name) => {
                const val = Math.abs(v);
                return [fmt(val), name === 'expenses' ? 'Expenses' : name];
              }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <ReferenceLine y={0} stroke="#9ca3af" />
            <Bar dataKey="revenue" stackId="a" fill="#22c55e" name="Revenue" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" stackId="a" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Period Comparison */}
      {entries.length >= 2 && (
        <div className="portal-profit-comparison">
          <h3 className="portal-section-title">Period Comparison</h3>
          <div className="portal-profit-comparison-grid">
            <div className="portal-profit-comparison-card">
              <span className="portal-profit-comparison-label">Revenue</span>
              <strong className="portal-profit-comparison-value">{fmt(stats.revenue)}</strong>
            </div>
            <div className="portal-profit-comparison-card">
              <span className="portal-profit-comparison-label">Expenses</span>
              <strong className="portal-profit-comparison-value">{fmt(stats.expenses)}</strong>
            </div>
            <div className="portal-profit-comparison-card">
              <span className="portal-profit-comparison-label">Net Profit</span>
              <strong
                className="portal-profit-comparison-value"
                style={{ color: stats.profit >= 0 ? '#22c55e' : '#ef4444' }}
              >
                {fmt(stats.profit)}
              </strong>
            </div>
            <div className="portal-profit-comparison-card">
              <span className="portal-profit-comparison-label">Profit Margin</span>
              <strong className="portal-profit-comparison-value">{pct(stats.margin)}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
