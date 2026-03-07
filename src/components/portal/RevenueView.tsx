import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Calendar, Inbox, BarChart3 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { safeGetItem } from '../../constants';
import {
  LineChart, Line, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
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

function KpiCard({ icon, label, value, color }) {
  return (
    <div className="portal-revenue-kpi" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="portal-revenue-kpi-icon" style={{ color }}>
        {icon}
      </div>
      <div>
        <div className="portal-revenue-kpi-label">{label}</div>
        <div className="portal-revenue-kpi-value">{value}</div>
      </div>
    </div>
  );
}

export default function RevenueView() {
  const { currentClient } = useAppContext();
  const clientId = currentClient?.id;

  const [dateRange, setDateRange] = useState('All');
  const [chartType, setChartType] = useState('monthly'); // monthly | quarterly

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
    const total = entries.reduce((sum, e) => sum + (e.revenue || 0), 0);
    const months = entries.map(e => e.month).sort();
    const bestMonth = entries.length > 0
      ? entries.reduce((max, e) => (e.revenue > max.revenue ? e : max), entries[0])
      : null;

    // MoM Growth (comparing last two months)
    let momGrowth = null;
    if (entries.length >= 2) {
      const sorted = [...entries].sort((a, b) => a.month.localeCompare(b.month));
      const last = sorted[sorted.length - 1];
      const prev = sorted[sorted.length - 2];
      if (prev.revenue > 0) {
        momGrowth = ((last.revenue - prev.revenue) / prev.revenue) * 100;
      }
    }

    const avgMonthly = entries.length > 0 ? total / entries.length : 0;

    return {
      total,
      avgMonthly,
      bestMonth,
      momGrowth,
      monthCount: entries.length,
    };
  }, [entries]);

  // Chart data - monthly or quarterly
  const chartData = useMemo(() => {
    if (chartType === 'monthly') {
      return entries.map(e => ({
        month: monthLabel(e.month),
        revenue: e.revenue || 0,
      }));
    }

    // Quarterly aggregation
    const quarters = {};
    entries.forEach(e => {
      const [year, month] = e.month.split('-');
      const q = Math.ceil(parseInt(month) / 3);
      const key = `${year}-Q${q}`;
      if (!quarters[key]) quarters[key] = 0;
      quarters[key] += e.revenue || 0;
    });

    return Object.entries(quarters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, revenue]) => ({ month: key, revenue }));
  }, [entries, chartType]);

  // Revenue breakdown by service (if we have channel or service data)
  // For now, we'll just show total revenue trend

  if (!clientId) {
    return (
      <div className="portal-empty-state">
        <DollarSign size={48} />
        <h3>Not Logged In</h3>
        <p>Please log in to view your revenue analytics.</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="portal-revenue">
        <div className="portal-revenue-header">
          <h2>Revenue Analytics</h2>
          <p className="portal-revenue-subtitle">Track your revenue trends and performance.</p>
        </div>
        <div className="portal-empty-state">
          <Inbox size={48} />
          <h3>No Revenue Data</h3>
          <p>Your revenue data has not been recorded yet. Check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-revenue">
      <div className="portal-revenue-header">
        <h2>Revenue Analytics</h2>
        <p className="portal-revenue-subtitle">
          Showing revenue trends for {dateRange === 'All' ? 'all time' : `the last ${dateRange}`}
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="portal-revenue-controls">
        <div className="portal-revenue-filters">
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
        <div className="portal-revenue-chart-toggle">
          <button
            className={`portal-toggle-btn ${chartType === 'monthly' ? 'active' : ''}`}
            onClick={() => setChartType('monthly')}
          >
            Monthly
          </button>
          <button
            className={`portal-toggle-btn ${chartType === 'quarterly' ? 'active' : ''}`}
            onClick={() => setChartType('quarterly')}
          >
            Quarterly
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="portal-revenue-kpis">
        <KpiCard
          icon={<DollarSign size={20} />}
          label="Total Revenue"
          value={fmt(stats.total)}
          color="#22c55e"
        />
        <KpiCard
          icon={<TrendingUp size={20} />}
          label="MoM Growth"
          value={stats.momGrowth != null ? `${stats.momGrowth >= 0 ? '+' : ''}${stats.momGrowth.toFixed(1)}%` : 'N/A'}
          color={stats.momGrowth >= 0 ? '#3b82f6' : '#ef4444'}
        />
        <KpiCard
          icon={<BarChart3 size={20} />}
          label="Best Month"
          value={stats.bestMonth ? `${fmt(stats.bestMonth.revenue)} (${monthLabel(stats.bestMonth.month)})` : 'N/A'}
          color="#8b5cf6"
        />
        <KpiCard
          icon={<Calendar size={20} />}
          label="Avg Monthly"
          value={fmt(stats.avgMonthly)}
          color="#14b8a6"
        />
      </div>

      {/* Revenue Trend Chart */}
      <div className="portal-revenue-chart-section">
        <h3 className="portal-section-title">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
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
              formatter={(v) => [fmt(v), 'Revenue']}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#22c55e"
              strokeWidth={3}
              dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Month Bar Chart */}
      {chartType === 'monthly' && (
        <div className="portal-revenue-chart-section">
          <h3 className="portal-section-title">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
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
                formatter={(v) => [fmt(v), 'Revenue']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <Bar
                dataKey="revenue"
                fill="#22c55e"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
