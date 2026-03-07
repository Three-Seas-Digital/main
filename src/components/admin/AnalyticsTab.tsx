import { useState, useMemo, useCallback } from 'react';
import {
  TrendingUp, DollarSign, CreditCard,
  Calendar as CalendarIcon, Eye, X, Filter,
  Printer, Receipt, BarChart3, Users,
  Shield, UserPlus, Briefcase, AlertCircle,
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart,
} from 'recharts';
import { useAppContext } from '../../context/AppContext';
import { escapeHtml } from '../../constants';

const CHART_COLORS = ['#0f4c75', '#00b4d8', '#3282b8', '#40c057', '#f59e0b', '#8b5cf6', '#f03e3e', '#fab005'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function AnalyticsTab() {
  const { clients, payments, appointments, expenses, SUBSCRIPTION_TIERS } = useAppContext();

  // Filter state
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // Revenue-specific filters
  const [filterService, setFilterService] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');

  // Chart visibility toggles
  const [chartVis, setChartVis] = useState({
    revenue: true,
    breakdown: true,
    profitLoss: true,
    invoices: true,
    clients: true,
  });
  const toggleChart = (key: string) => setChartVis((prev) => ({ ...prev, [key as string]: !prev[key as string] }));
  const allChartsVisible = Object.values(chartVis).every(Boolean);
  const toggleAll = () => {
    const next = !allChartsVisible;
    setChartVis({ revenue: next, breakdown: next, profitLoss: next, invoices: next, clients: next });
  };

  const clearFilters = () => {
    setFilterYear('all');
    setFilterMonth('all');
    setStartDate('');
    setEndDate('');
    setFilterService('all');
    setFilterTier('all');
    setFilterMethod('all');
  };

  const hasActiveFilters = filterYear !== 'all' || filterMonth !== 'all' || startDate || endDate;
  const hasRevenueFilters = filterService !== 'all' || filterTier !== 'all' || filterMethod !== 'all';

  // Distinct years from all data sources
  const availableYears = useMemo(() => {
    const years = new Set();
    payments.forEach((p: any) => years.add(new Date(p.createdAt).getFullYear()));
    clients.forEach((c: any) => years.add(new Date(c.createdAt).getFullYear()));
    appointments.forEach((a: any) => {
      if (a.date) {
        const [y] = a.date.split('-');
        years.add(parseInt(y));
      } else if (a.createdAt) {
        years.add(new Date(a.createdAt).getFullYear());
      }
    });
    return [...years].sort((a: any, b: any) => (b as number) - (a as number));
  }, [payments, clients, appointments]);

  // Filter helper
  const filterByDate = useCallback((items: any[], dateAccessor: string = 'createdAt') => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return items.filter((item: any) => {
        const val = dateAccessor === 'date' && item.date ? item.date : item.createdAt;
        const d = new Date(val);
        return d >= start && d <= end;
      });
    }
    if (filterYear !== 'all') {
      const yr = parseInt(filterYear);
      return items.filter((item: any) => {
        const val = dateAccessor === 'date' && item.date ? item.date : item.createdAt;
        const d = new Date(val);
        if (d.getFullYear() !== yr) return false;
        if (filterMonth !== 'all') {
          return d.getMonth() === parseInt(filterMonth);
        }
        return true;
      });
    }
    return items;
  }, [filterYear, filterMonth, startDate, endDate]);

  // Filtered data (date filters)
  const dateFilteredPayments = useMemo(() => filterByDate(payments), [payments, filterByDate]);
  const filteredClients = useMemo(() => filterByDate(clients), [clients, filterByDate]);
  const filteredAppointments = useMemo(() => filterByDate(appointments, 'date'), [appointments, filterByDate]);

  // Revenue-filtered payments (date + service/tier/method)
  const filteredPayments = useMemo(() => {
    let result = dateFilteredPayments;
    if (filterService !== 'all') result = result.filter((p: any) => p.service === filterService);
    if (filterTier !== 'all') result = result.filter((p: any) => p.serviceTier === filterTier);
    if (filterMethod !== 'all') result = result.filter((p: any) => p.method === filterMethod);
    return result;
  }, [dateFilteredPayments, filterService, filterTier, filterMethod]);

  // Available revenue filter options (derived from date-filtered payments)
  const availableServices = useMemo(() => [...new Set(dateFilteredPayments.map((p: any) => p.service).filter(Boolean))].sort(), [dateFilteredPayments]);
  const availableMethods = useMemo(() => [...new Set(dateFilteredPayments.map((p: any) => p.method).filter(Boolean))].sort(), [dateFilteredPayments]);

  // Period label for display
  const periodLabel = useMemo(() => {
    if (startDate && endDate) return `${startDate} to ${endDate}`;
    if (filterYear !== 'all' && filterMonth !== 'all') return `${MONTH_NAMES[parseInt(filterMonth)]} ${filterYear}`;
    if (filterYear !== 'all') return `${filterYear}`;
    return 'All Time';
  }, [filterYear, filterMonth, startDate, endDate]);

  const monthlyRevenue = useMemo(() => {
    const map: Record<string, any> = {};
    filteredPayments.forEach((p: any) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key as string] = (map[key as string] || 0) + p.amount;
    });
    return Object.entries(map)
      .sort(([a]: any, [b]: any) => a.localeCompare(b))
      .map(([month, revenue]: any) => {
        const [y, m] = month.split('-');
        return { month, label: new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), revenue };
      });
  }, [filteredPayments]);

  const kpis = useMemo(() => {
    // Revenue growth logic adapts to filter context
    let curRev, prevRev, growthLabel;

    if (filterMonth !== 'all' && filterYear !== 'all') {
      // Specific month selected: compare to previous month
      const yr = parseInt(filterYear);
      const mo = parseInt(filterMonth);
      curRev = filteredPayments.reduce((s: any, p: any) => s + p.amount, 0);
      const prevMo = mo === 0 ? 11 : mo - 1;
      const prevYr = mo === 0 ? yr - 1 : yr;
      prevRev = payments.filter((p: any) => {
        const d = new Date(p.createdAt);
        return d.getFullYear() === prevYr && d.getMonth() === prevMo;
      }).reduce((s: any, p: any) => s + p.amount, 0);
      growthLabel = `vs ${MONTH_NAMES[prevMo].slice(0, 3)}`;
    } else if (startDate && endDate) {
      // Date range: show total for range, no growth comparison
      curRev = filteredPayments.reduce((s: any, p: any) => s + p.amount, 0);
      prevRev = 0;
      growthLabel = 'filtered period';
    } else {
      // All time or year: compare current month vs previous month (as today)
      const now = new Date();
      const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

      curRev = filteredPayments.filter((p: any) => {
        const d = new Date(p.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === curMonth;
      }).reduce((s: any, p: any) => s + p.amount, 0);

      prevRev = filteredPayments.filter((p: any) => {
        const d = new Date(p.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === prevMonth;
      }).reduce((s: any, p: any) => s + p.amount, 0);
      growthLabel = 'vs last month';
    }

    const growth = prevRev > 0 ? ((curRev - prevRev) / prevRev * 100) : (curRev > 0 ? 100 : 0);

    const totalAppts = filteredAppointments.length;
    const converted = filteredAppointments.filter((a: any) => a.convertedToClient).length;
    const conversionRate = totalAppts > 0 ? (converted / totalAppts * 100) : 0;

    const totalRevenue = filteredPayments.reduce((s: any, p: any) => s + p.amount, 0);
    const avgValue = filteredClients.length > 0 ? totalRevenue / filteredClients.length : 0;

    // When showing a specific month, use filtered total as "monthly revenue"
    const displayRevenue = (filterMonth !== 'all' || (startDate && endDate))
      ? filteredPayments.reduce((s: any, p: any) => s + p.amount, 0)
      : curRev;

    return { curRev: displayRevenue, growth, growthLabel, conversionRate, avgValue };
  }, [filteredPayments, filteredAppointments, filteredClients, payments, filterYear, filterMonth, startDate, endDate]);

  const clientGrowth = useMemo(() => {
    const sorted = [...filteredClients].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const map = {};
    let cumulative = 0;
    sorted.forEach((c) => {
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      cumulative++;
      map[key as string] = cumulative;
    });
    return Object.entries(map).map(([month, total]) => {
      const [y, m] = month.split('-');
      return { month, label: new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), total };
    });
  }, [filteredClients]);

  const revenueByService = useMemo(() => {
    const map = {};
    filteredPayments.forEach((p) => {
      const svc = p.service || 'Other';
      map[svc] = (map[svc] || 0) + p.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.replace('-', ' '), value }));
  }, [filteredPayments]);

  const tierDistribution = useMemo(() => {
    const map = {};
    Object.keys(SUBSCRIPTION_TIERS).forEach((k) => { map[k] = 0; });
    filteredClients.forEach((c) => { const t = c.tier || 'free'; map[t] = (map[t] || 0) + 1; });
    return Object.entries(map).map(([tier, count]) => ({
      tier: SUBSCRIPTION_TIERS[tier]?.label || tier,
      count,
      color: SUBSCRIPTION_TIERS[tier]?.color || '#9ca3af',
    }));
  }, [filteredClients, SUBSCRIPTION_TIERS]);

  const conversionFunnel = useMemo(() => {
    const booked = filteredAppointments.length;
    const confirmed = filteredAppointments.filter((a) => a.status === 'confirmed').length;
    const converted = filteredAppointments.filter((a) => a.convertedToClient).length;
    return [
      { stage: 'Booked', count: booked },
      { stage: 'Confirmed', count: confirmed },
      { stage: 'Converted', count: converted },
    ];
  }, [filteredAppointments]);

  const clientSources = useMemo(() => {
    const map = { appointment: 0, manual: 0, 'self-registration': 0 };
    filteredClients.forEach((c) => {
      const src = c.source || 'manual';
      map[src] = (map[src] || 0) + 1;
    });
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.replace('-', ' '), value }));
  }, [filteredClients]);

  // Yearly revenue comparison (uses ALL payments, not filtered, so you can compare years)
  const yearlyRevenue = useMemo(() => {
    const map = {};
    payments.forEach((p: any) => {
      const yr = new Date(p.createdAt).getFullYear();
      map[yr] = (map[yr] || 0) + p.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, revenue]) => ({ year, revenue }));
  }, [payments]);

  // Cumulative revenue over time
  const cumulativeRevenue = useMemo(() => {
    const sorted = [...filteredPayments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const map = {};
    let running = 0;
    sorted.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      running += p.amount;
      map[key as string] = running;
    });
    return Object.entries(map).map(([month, total]) => {
      const [y, m] = month.split('-');
      return { month, label: new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), total };
    });
  }, [filteredPayments]);

  // Revenue by tier
  const revenueByTier = useMemo(() => {
    const map = {};
    filteredPayments.forEach((p) => {
      const tier = p.serviceTier || 'free';
      map[tier] = (map[tier] || 0) + p.amount;
    });
    return Object.entries(map).map(([tier, value]) => ({
      name: SUBSCRIPTION_TIERS[tier]?.label || tier,
      value,
      color: SUBSCRIPTION_TIERS[tier]?.color || '#9ca3af',
    }));
  }, [filteredPayments, SUBSCRIPTION_TIERS]);

  // Revenue by payment method
  const revenueByMethod = useMemo(() => {
    const map = {};
    filteredPayments.forEach((p) => {
      const method = (p.method || 'unknown').replace('-', ' ');
      map[method] = (map[method] || 0) + p.amount;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([method, revenue]) => ({ method, revenue }));
  }, [filteredPayments]);

  // Monthly revenue as bar chart data (payment count + revenue)
  const monthlyRevenueDetailed = useMemo(() => {
    const map = {};
    filteredPayments.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key as string]) map[key as string] = { count: 0, revenue: 0 };
      map[key as string].count++;
      map[key as string].revenue += p.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]: [string, any]) => {
        const [y, m] = month.split('-');
        return {
          month,
          label: new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          revenue: data.revenue,
          count: data.count,
          avg: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
        };
      });
  }, [filteredPayments]);

  // Average payment value over time
  const avgPaymentOverTime = useMemo(() => {
    const map = {};
    filteredPayments.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key as string]) map[key as string] = { total: 0, count: 0 };
      map[key as string].total += p.amount;
      map[key as string].count++;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]: [string, any]) => {
        const [y, m] = month.split('-');
        return {
          month,
          label: new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          avg: Math.round(data.total / data.count),
        };
      });
  }, [filteredPayments]);

  // Profit & Loss — uses real expenses when available, falls back to estimated costs
  const COST_RATIO = 0.6;
  const hasRealExpenses = expenses.length > 0;
  const profitOverTime = useMemo(() => {
    const revenueMap = {};
    filteredPayments.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!revenueMap[key as string]) revenueMap[key as string] = 0;
      revenueMap[key as string] += p.amount;
    });
    const expenseMap = {};
    if (hasRealExpenses) {
      expenses.forEach((e: any) => {
        const key = e.date.substring(0, 7); // "YYYY-MM"
        if (!expenseMap[key as string]) expenseMap[key as string] = 0;
        expenseMap[key as string] += e.amount;
      });
    }
    const allMonths = new Set([...Object.keys(revenueMap), ...Object.keys(expenseMap)]);
    return [...allMonths]
      .sort((a, b) => a.localeCompare(b))
      .map((month) => {
        const [y, m] = month.split('-');
        const revenue = revenueMap[month] || 0;
        const costs = hasRealExpenses ? (expenseMap[month] || 0) : Math.round(revenue * COST_RATIO);
        return {
          month,
          label: new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          revenue,
          costs,
          profit: revenue - costs,
        };
      });
  }, [filteredPayments, expenses, hasRealExpenses]);

  // Liabilities — unpaid invoices from clients (accounts receivable / outstanding)
  const liabilitiesData = useMemo(() => {
    const allInvoices = [];
    filteredClients.forEach((c) => {
      (c.invoices || []).forEach((inv: any) => {
        allInvoices.push({ ...inv, clientName: c.name, clientId: c.id });
      });
    });
    const unpaid = allInvoices.filter((inv) => inv.status === 'unpaid');
    const paid = allInvoices.filter((inv) => inv.status === 'paid');
    const overdue = unpaid.filter((inv) => inv.dueDate && new Date(inv.dueDate) < new Date());
    const totalOutstanding = unpaid.reduce((s, inv) => s + inv.amount, 0);
    const totalOverdue = overdue.reduce((s, inv) => s + inv.amount, 0);
    const totalPaid = paid.reduce((s, inv) => s + inv.amount, 0);
    const totalBilled = allInvoices.reduce((s, inv) => s + inv.amount, 0);

    // Outstanding by month
    const monthMap = {};
    unpaid.forEach((inv: any) => {
      const d = new Date(inv.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key as string]) monthMap[key as string] = { outstanding: 0, overdue: 0 };
      monthMap[key as string].outstanding += inv.amount;
      if (inv.dueDate && new Date(inv.dueDate) < new Date()) {
        monthMap[key as string].overdue += inv.amount;
      }
    });
    const outstandingByMonth = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]: [string, any]) => {
        const [y, m] = month.split('-');
        return { month, label: new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), ...(data as any) };
      });

    // Paid vs Unpaid breakdown for pie
    const statusBreakdown = [
      { name: 'Paid', value: totalPaid, color: '#40c057' },
      { name: 'Outstanding', value: totalOutstanding - totalOverdue, color: '#f59e0b' },
      { name: 'Overdue', value: totalOverdue, color: '#f03e3e' },
    ].filter((d) => d.value > 0);

    return {
      totalBilled, totalPaid, totalOutstanding, totalOverdue,
      unpaidCount: unpaid.length, overdueCount: overdue.length, paidCount: paid.length,
      outstandingByMonth, statusBreakdown,
      collectionRate: totalBilled > 0 ? (totalPaid / totalBilled * 100) : 0,
    };
  }, [filteredClients]);

  // Tax report generator
  const generateTaxReport = useCallback(() => {
    const fp = filteredPayments;
    const fc = filteredClients;
    const totalRevenue = fp.reduce((s: any, p: any) => s + p.amount, 0);
    const avgPayment = fp.length > 0 ? totalRevenue / fp.length : 0;

    // Revenue by month
    const revByMonth = {};
    fp.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!revByMonth[key as string]) revByMonth[key as string] = { count: 0, revenue: 0 };
      revByMonth[key as string].count++;
      revByMonth[key as string].revenue += p.amount;
    });
    const monthlyRows = Object.entries(revByMonth).sort(([a], [b]) => a.localeCompare(b));
    let runningTotal = 0;
    const monthlyTableRows = monthlyRows.map(([month, data]: [string, any]) => {
      runningTotal += data.revenue;
      const [y, m] = month.split('-');
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return `<tr><td>${label}</td><td style="text-align:center">${data.count}</td><td style="text-align:right;font-family:monospace">$${data.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td><td style="text-align:right;font-family:monospace">$${runningTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>`;
    }).join('');

    // Revenue by service
    const revByService = {};
    fp.forEach((p) => {
      const svc = p.service || 'Other';
      if (!revByService[svc]) revByService[svc] = { count: 0, revenue: 0 };
      revByService[svc].count++;
      revByService[svc].revenue += p.amount;
    });
    const serviceRows = Object.entries(revByService)
      .sort(([, a]: [string, any], [, b]: [string, any]) => b.revenue - a.revenue)
      .map(([svc, data]: [string, any]) => {
        const pct = totalRevenue > 0 ? ((data.revenue / totalRevenue) * 100).toFixed(1) : '0.0';
        return `<tr><td>${escapeHtml(svc.replace('-', ' '))}</td><td style="text-align:center">${data.count}</td><td style="text-align:right;font-family:monospace">$${data.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td><td style="text-align:right">${pct}%</td></tr>`;
      }).join('');

    // Payment details
    const paymentDetailRows = [...fp]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((p) => {
        const date = new Date(p.createdAt).toLocaleDateString('en-US');
        const clientName = escapeHtml(fc.find((c) => c.id === p.clientId)?.name || p.clientName || 'Unknown');
        return `<tr><td>${date}</td><td>${clientName}</td><td>${escapeHtml((p.service || 'N/A').replace('-', ' '))}</td><td>${escapeHtml(p.serviceTier || 'N/A')}</td><td style="text-align:right;font-family:monospace">$${p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td><td>${escapeHtml((p.method || 'N/A').replace('-', ' '))}</td></tr>`;
      }).join('');

    // Client summary
    const tierCounts = {};
    fc.forEach((c) => {
      const t = c.tier || 'free';
      tierCounts[t] = (tierCounts[t] || 0) + 1;
    });
    const tierRows = Object.entries(tierCounts).map(([tier, count]) => {
      const label = SUBSCRIPTION_TIERS[tier]?.label || tier;
      return `<tr><td>${escapeHtml(label)}</td><td style="text-align:center">${count}</td></tr>`;
    }).join('');

    const sourceCounts = {};
    fc.forEach((c) => {
      const src = c.source || 'manual';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });
    const sourceRows = Object.entries(sourceCounts).map(([src, count]) => {
      return `<tr><td>${escapeHtml(src.replace('-', ' '))}</td><td style="text-align:center">${count}</td></tr>`;
    }).join('');

    const noDataMsg = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#666">No data for this period</td></tr>';

    const html = `<!DOCTYPE html>
<html><head><title>Three Seas Digital — Tax Report</title></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;max-width:900px;margin:0 auto;padding:40px 24px;color:#1a1a2e;line-height:1.6">
<div style="border-bottom:3px solid #0f4c75;padding-bottom:16px;margin-bottom:32px">
  <h1 style="margin:0 0 4px;font-size:1.6rem;color:#0f4c75">Three Seas Digital — Tax Report</h1>
  <p style="margin:0;color:#585b70;font-size:0.95rem">Period: <strong>${periodLabel}</strong></p>
  <p style="margin:0;color:#585b70;font-size:0.85rem">Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US')}</p>
</div>

<h2 style="font-size:1.15rem;color:#0f4c75;border-bottom:1px solid #e2e5f1;padding-bottom:8px;margin:24px 0 12px">Revenue Summary</h2>
<table style="width:100%;border-collapse:collapse;margin-bottom:24px">
  <tr><td style="padding:8px 12px;border:1px solid #e2e5f1;background:#f8f9fa;font-weight:600">Total Revenue</td><td style="padding:8px 12px;border:1px solid #e2e5f1;text-align:right;font-family:monospace;font-size:1.1rem;font-weight:700">$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
  <tr><td style="padding:8px 12px;border:1px solid #e2e5f1;background:#f8f9fa;font-weight:600">Payment Count</td><td style="padding:8px 12px;border:1px solid #e2e5f1;text-align:right">${fp.length}</td></tr>
  <tr><td style="padding:8px 12px;border:1px solid #e2e5f1;background:#f8f9fa;font-weight:600">Average Payment</td><td style="padding:8px 12px;border:1px solid #e2e5f1;text-align:right;font-family:monospace">$${avgPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
</table>

<h2 style="font-size:1.15rem;color:#0f4c75;border-bottom:1px solid #e2e5f1;padding-bottom:8px;margin:24px 0 12px">Revenue by Month</h2>
<table style="width:100%;border-collapse:collapse;margin-bottom:24px">
  <thead><tr style="background:#0f4c75;color:#fff"><th style="padding:10px 12px;text-align:left">Month</th><th style="padding:10px 12px;text-align:center"># Payments</th><th style="padding:10px 12px;text-align:right">Revenue</th><th style="padding:10px 12px;text-align:right">Running Total</th></tr></thead>
  <tbody>${monthlyTableRows || noDataMsg}</tbody>
</table>

<h2 style="font-size:1.15rem;color:#0f4c75;border-bottom:1px solid #e2e5f1;padding-bottom:8px;margin:24px 0 12px">Revenue by Service</h2>
<table style="width:100%;border-collapse:collapse;margin-bottom:24px">
  <thead><tr style="background:#0f4c75;color:#fff"><th style="padding:10px 12px;text-align:left">Service</th><th style="padding:10px 12px;text-align:center"># Payments</th><th style="padding:10px 12px;text-align:right">Revenue</th><th style="padding:10px 12px;text-align:right">% of Total</th></tr></thead>
  <tbody>${serviceRows || noDataMsg}</tbody>
</table>

<h2 style="font-size:1.15rem;color:#0f4c75;border-bottom:1px solid #e2e5f1;padding-bottom:8px;margin:24px 0 12px">Payment Details</h2>
<table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:0.88rem">
  <thead><tr style="background:#0f4c75;color:#fff"><th style="padding:10px 12px;text-align:left">Date</th><th style="padding:10px 12px;text-align:left">Client</th><th style="padding:10px 12px;text-align:left">Service</th><th style="padding:10px 12px;text-align:left">Tier</th><th style="padding:10px 12px;text-align:right">Amount</th><th style="padding:10px 12px;text-align:left">Method</th></tr></thead>
  <tbody>${paymentDetailRows || noDataMsg}</tbody>
</table>

<h2 style="font-size:1.15rem;color:#0f4c75;border-bottom:1px solid #e2e5f1;padding-bottom:8px;margin:24px 0 12px">Client Summary</h2>
<p style="margin:0 0 8px"><strong>New clients in period:</strong> ${fc.length}</p>
<div style="display:flex;gap:32px;margin-bottom:24px">
  <div>
    <h3 style="font-size:0.95rem;margin:0 0 8px;color:#585b70">By Tier</h3>
    <table style="border-collapse:collapse">
      <thead><tr style="background:#0f4c75;color:#fff"><th style="padding:8px 12px;text-align:left">Tier</th><th style="padding:8px 12px;text-align:center">Count</th></tr></thead>
      <tbody>${tierRows || '<tr><td colspan="2" style="padding:8px 12px;color:#666">No clients</td></tr>'}</tbody>
    </table>
  </div>
  <div>
    <h3 style="font-size:0.95rem;margin:0 0 8px;color:#585b70">By Source</h3>
    <table style="border-collapse:collapse">
      <thead><tr style="background:#0f4c75;color:#fff"><th style="padding:8px 12px;text-align:left">Source</th><th style="padding:8px 12px;text-align:center">Count</th></tr></thead>
      <tbody>${sourceRows || '<tr><td colspan="2" style="padding:8px 12px;color:#666">No clients</td></tr>'}</tbody>
    </table>
  </div>
</div>

<div style="margin-top:40px;padding:16px;background:#f8f9fa;border:1px solid #e2e5f1;border-radius:6px;font-size:0.85rem;color:#585b70">
  <strong>Note:</strong> This report was generated from local data for reference purposes. Please consult with a tax professional for official filings.
</div>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 500);
    }
  }, [filteredPayments, filteredClients, periodLabel, SUBSCRIPTION_TIERS]);

  const hasData = payments.length > 0 || clients.length > 0 || appointments.length > 0;

  if (!hasData) {
    return (
      <div className="analytics-tab">
        <div className="empty-state">
          <TrendingUp size={48} />
          <p>No data yet. Analytics will appear once you have clients, appointments, or payments.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (v: number): string => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="analytics-tab">
      {/* Filter Bar */}
      <div className="analytics-filters">
        <div className="analytics-filter-group">
          <label>Year</label>
          <select
            value={filterYear}
            onChange={(e) => { setFilterYear(e.target.value); if (e.target.value === 'all') setFilterMonth('all'); }}
            className="filter-select"
          >
            <option value="all">All Years</option>
            {availableYears.map((y: any) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="analytics-filter-group">
          <label>Month</label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="filter-select"
            disabled={filterYear === 'all'}
          >
            <option value="all">All Months</option>
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>
        </div>
        <div className="analytics-filter-group">
          <label>Date Range</label>
          <div className="analytics-date-range">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start"
            />
            <span className="date-range-separator">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End"
            />
          </div>
        </div>
        <div className="analytics-filter-divider" />
        <div className="analytics-filter-group">
          <label>Service</label>
          <select value={filterService} onChange={(e) => setFilterService(e.target.value)} className="filter-select">
            <option value="all">All Services</option>
            {availableServices.map((s: any) => (
              <option key={s} value={s}>{s.replace('-', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="analytics-filter-group">
          <label>Tier</label>
          <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="filter-select">
            <option value="all">All Tiers</option>
            {Object.entries(SUBSCRIPTION_TIERS).map(([key, t]: [string, any]) => (
              <option key={key} value={key}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="analytics-filter-group">
          <label>Method</label>
          <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} className="filter-select">
            <option value="all">All Methods</option>
            {availableMethods.map((m: any) => (
              <option key={m} value={m}>{m.replace('-', ' ')}</option>
            ))}
          </select>
        </div>
        {(hasActiveFilters || hasRevenueFilters) && (
          <div className="analytics-filter-group" style={{ alignSelf: 'flex-end' }}>
            <button className="btn-clear-filters" onClick={clearFilters}>
              <X size={14} /> Clear Filters
            </button>
          </div>
        )}
        <div className="analytics-filter-group" style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
          <button className="btn-tax-report" onClick={generateTaxReport}>
            <Printer size={15} /> Generate Tax Report
          </button>
        </div>
      </div>

      {(hasActiveFilters || hasRevenueFilters) && (
        <div className="analytics-period-label">
          <Filter size={14} /> Showing data for: <strong>{periodLabel}</strong>
          {filterService !== 'all' && <span className="filter-chip">{filterService.replace('-', ' ')}</span>}
          {filterTier !== 'all' && <span className="filter-chip">{SUBSCRIPTION_TIERS[filterTier]?.label || filterTier}</span>}
          {filterMethod !== 'all' && <span className="filter-chip">{filterMethod.replace('-', ' ')}</span>}
        </div>
      )}

      {/* Chart Visibility Toggles */}
      <div className="chart-visibility-toggles">
        <span className="chart-vis-label"><Eye size={14} /> Charts:</span>
        <button className={`chart-vis-btn ${allChartsVisible ? 'active' : ''}`} onClick={toggleAll}>All</button>
        <button className={`chart-vis-btn ${chartVis.revenue ? 'active' : ''}`} onClick={() => toggleChart('revenue')}>
          <DollarSign size={13} /> Revenue
        </button>
        <button className={`chart-vis-btn ${chartVis.breakdown ? 'active' : ''}`} onClick={() => toggleChart('breakdown')}>
          <BarChart3 size={13} /> Breakdown
        </button>
        <button className={`chart-vis-btn ${chartVis.profitLoss ? 'active' : ''}`} onClick={() => toggleChart('profitLoss')}>
          <TrendingUp size={13} /> Profit &amp; Loss
        </button>
        <button className={`chart-vis-btn ${chartVis.invoices ? 'active' : ''}`} onClick={() => toggleChart('invoices')}>
          <Receipt size={13} /> Invoices
        </button>
        <button className={`chart-vis-btn ${chartVis.clients ? 'active' : ''}`} onClick={() => toggleChart('clients')}>
          <Users size={13} /> Clients
        </button>
      </div>

      {/* KPI Row */}
      <div className="analytics-kpi-row">
        <div className="analytics-kpi-card">
          <span className="kpi-label">{filterMonth !== 'all' || (startDate && endDate) ? 'Period Revenue' : 'Monthly Revenue'}</span>
          <span className="kpi-value">{formatCurrency(kpis.curRev)}</span>
        </div>
        <div className="analytics-kpi-card">
          <span className="kpi-label">Revenue Growth</span>
          <span className="kpi-value">
            {kpis.growth >= 0 ? '+' : ''}{kpis.growth.toFixed(1)}%
          </span>
          <span className={`kpi-delta ${kpis.growth >= 0 ? 'positive' : 'negative'}`}>
            {kpis.growthLabel}
          </span>
        </div>
        <div className="analytics-kpi-card">
          <span className="kpi-label">Conversion Rate</span>
          <span className="kpi-value">{kpis.conversionRate.toFixed(1)}%</span>
          <span className="kpi-delta neutral">appointments → clients</span>
        </div>
        <div className="analytics-kpi-card">
          <span className="kpi-label">Avg Client Value</span>
          <span className="kpi-value">{formatCurrency(kpis.avgValue)}</span>
        </div>
      </div>

      {/* Profit & Liabilities KPI Row */}
      <div className="analytics-kpi-row">
        <div className="analytics-kpi-card">
          <span className="kpi-label">Total Revenue</span>
          <span className="kpi-value">{formatCurrency(filteredPayments.reduce((s: any, p: any) => s + p.amount, 0))}</span>
          <span className="kpi-delta neutral">{filteredPayments.length} payments</span>
        </div>
        <div className="analytics-kpi-card">
          <span className="kpi-label">{hasRealExpenses ? 'Actual Profit' : 'Est. Profit (40%)'}</span>
          <span className="kpi-value" style={{ color: 'var(--success)' }}>
            {formatCurrency(
              hasRealExpenses
                ? filteredPayments.reduce((s: any, p: any) => s + p.amount, 0) - expenses.reduce((s: any, e: any) => s + e.amount, 0)
                : filteredPayments.reduce((s: any, p: any) => s + p.amount, 0) * (1 - COST_RATIO)
            )}
          </span>
          <span className="kpi-delta positive">{hasRealExpenses ? 'based on actual costs' : 'after est. operating costs'}</span>
        </div>
        <div className="analytics-kpi-card">
          <span className="kpi-label">Outstanding</span>
          <span className="kpi-value" style={{ color: 'var(--warning)' }}>
            {formatCurrency(liabilitiesData.totalOutstanding)}
          </span>
          <span className="kpi-delta neutral">{liabilitiesData.unpaidCount} unpaid invoice{liabilitiesData.unpaidCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="analytics-kpi-card">
          <span className="kpi-label">Overdue</span>
          <span className="kpi-value" style={{ color: 'var(--danger)' }}>
            {formatCurrency(liabilitiesData.totalOverdue)}
          </span>
          <span className="kpi-delta negative">{liabilitiesData.overdueCount} overdue invoice{liabilitiesData.overdueCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Revenue Over Time — full width area */}
      {chartVis.revenue && monthlyRevenue.length > 0 ? (
        <div className="analytics-chart-card full">
          <h3><DollarSign size={16} /> Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f4c75" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0f4c75" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#0f4c75" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : chartVis.revenue && hasActiveFilters && (
        <div className="analytics-chart-card full">
          <h3><DollarSign size={16} /> Revenue Over Time</h3>
          <div className="empty-state-sm"><p>No revenue data for this period</p></div>
        </div>
      )}

      {/* Monthly Revenue Bars + Payment Count — full width composed */}
      {chartVis.revenue && monthlyRevenueDetailed.length > 1 && (
        <div className="analytics-chart-card full">
          <h3><BarChart3 size={16} /> Monthly Revenue &amp; Payments</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={monthlyRevenueDetailed}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="rev" tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="count" orientation="right" allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v, name) => name === 'revenue' ? formatCurrency(v) : v} />
              <Legend />
              <Bar yAxisId="rev" dataKey="revenue" name="Revenue" fill="#0f4c75" radius={[4, 4, 0, 0]} barSize={32} />
              <Line yAxisId="count" type="monotone" dataKey="count" name="Payments" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Revenue charts row */}
      {(chartVis.revenue || chartVis.breakdown) && <div className="analytics-charts-row">
        {/* Yearly Revenue Comparison */}
        {chartVis.revenue && yearlyRevenue.length > 0 && (
          <div className="analytics-chart-card">
            <h3><CalendarIcon size={16} /> Yearly Revenue</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={yearlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                  {yearlyRevenue.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue by Tier */}
        {chartVis.breakdown && revenueByTier.length > 0 && (
          <div className="analytics-chart-card">
            <h3><Shield size={16} /> Revenue by Tier</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={revenueByTier} cx="50%" cy="50%" innerRadius={45} outerRadius={85} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {revenueByTier.map((entry, i) => (
                    <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue by Payment Method */}
        {chartVis.breakdown && revenueByMethod.length > 0 && (
          <div className="analytics-chart-card">
            <h3><CreditCard size={16} /> Revenue by Payment Method</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueByMethod} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
                <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="method" tick={{ fontSize: 12 }} width={100} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                  {revenueByMethod.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Average Payment Over Time */}
        {chartVis.revenue && avgPaymentOverTime.length > 1 && (
          <div className="analytics-chart-card">
            <h3><TrendingUp size={16} /> Avg Payment Value</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={avgPaymentOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Line type="monotone" dataKey="avg" name="Avg Payment" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4, fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>}

      {/* Cumulative Revenue — full width */}
      {chartVis.revenue && cumulativeRevenue.length > 1 && (
        <div className="analytics-chart-card full">
          <h3><TrendingUp size={16} /> Cumulative Revenue</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={cumulativeRevenue}>
              <defs>
                <linearGradient id="cumRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#40c057" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#40c057" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Area type="monotone" dataKey="total" name="Cumulative Revenue" stroke="#40c057" fill="url(#cumRevGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Profit & Loss — full width */}
      {chartVis.profitLoss && profitOverTime.length > 1 && (
        <div className="analytics-chart-card full">
          <h3><DollarSign size={16} /> Profit &amp; Loss</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={profitOverTime}>
              <defs>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#40c057" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#40c057" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#0f4c75" radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="costs" name={hasRealExpenses ? "Actual Costs" : "Est. Costs"} fill="#f03e3e" radius={[4, 4, 0, 0]} barSize={28} opacity={0.7} />
              <Area type="monotone" dataKey="profit" name="Profit" stroke="#40c057" fill="url(#profitGrad)" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Liabilities / Invoices charts row */}
      {(chartVis.invoices || chartVis.profitLoss) && <div className="analytics-charts-row">
        {/* Invoice Status Breakdown */}
        {chartVis.invoices && liabilitiesData.statusBreakdown.length > 0 && (
          <div className="analytics-chart-card">
            <h3><Receipt size={16} /> Invoice Status</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={liabilitiesData.statusBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={85} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {liabilitiesData.statusBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Outstanding by Month */}
        {chartVis.invoices && liabilitiesData.outstandingByMonth.length > 0 && (
          <div className="analytics-chart-card">
            <h3><AlertCircle size={16} /> Outstanding by Month</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={liabilitiesData.outstandingByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="outstanding" name="Outstanding" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overdue" name="Overdue" fill="#f03e3e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Collection Rate */}
        {chartVis.invoices && liabilitiesData.totalBilled > 0 && (
          <div className="analytics-chart-card">
            <h3><CreditCard size={16} /> Collections Overview</h3>
            <div className="collections-overview">
              <div className="collection-stat">
                <span className="collection-stat-label">Total Billed</span>
                <span className="collection-stat-value">{formatCurrency(liabilitiesData.totalBilled)}</span>
              </div>
              <div className="collection-stat">
                <span className="collection-stat-label">Collected</span>
                <span className="collection-stat-value" style={{ color: 'var(--success)' }}>{formatCurrency(liabilitiesData.totalPaid)}</span>
              </div>
              <div className="collection-stat">
                <span className="collection-stat-label">Outstanding</span>
                <span className="collection-stat-value" style={{ color: 'var(--warning)' }}>{formatCurrency(liabilitiesData.totalOutstanding)}</span>
              </div>
              <div className="collection-stat">
                <span className="collection-stat-label">Overdue</span>
                <span className="collection-stat-value" style={{ color: 'var(--danger)' }}>{formatCurrency(liabilitiesData.totalOverdue)}</span>
              </div>
              <div className="collection-rate-bar">
                <div className="collection-rate-label">
                  <span>Collection Rate</span>
                  <strong>{liabilitiesData.collectionRate.toFixed(1)}%</strong>
                </div>
                <div className="collection-rate-track">
                  <div className="collection-rate-fill" style={{ width: `${Math.min(liabilitiesData.collectionRate, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profit Margin by Month */}
        {chartVis.profitLoss && profitOverTime.length > 1 && (
          <div className="analytics-chart-card">
            <h3><TrendingUp size={16} /> Profit Margin</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={profitOverTime.map((d) => ({ ...d, margin: d.revenue > 0 ? Math.round((d.profit / d.revenue) * 100) : 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Line type="monotone" dataKey="margin" name="Profit Margin" stroke="#40c057" strokeWidth={2} dot={{ r: 4, fill: '#40c057' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>}

      {/* Client & Operations charts row */}
      {(chartVis.clients || chartVis.breakdown) && <div className="analytics-charts-row">
        {/* Client Growth */}
        {chartVis.clients && clientGrowth.length > 0 && (
          <div className="analytics-chart-card">
            <h3><Users size={16} /> Client Growth</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={clientGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#00b4d8" strokeWidth={2} dot={{ r: 4, fill: '#00b4d8' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue by Service */}
        {chartVis.breakdown && revenueByService.length > 0 && (
          <div className="analytics-chart-card">
            <h3><Briefcase size={16} /> Revenue by Service</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={revenueByService} cx="50%" cy="50%" outerRadius={85} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {revenueByService.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Client Tiers */}
        {chartVis.clients && <div className="analytics-chart-card">
          <h3><Shield size={16} /> Client Tiers</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tierDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="tier" tick={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {tierDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>}

        {/* Conversion Funnel */}
        {chartVis.clients && <div className="analytics-chart-card">
          <h3><TrendingUp size={16} /> Conversion Funnel</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={conversionFunnel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5f1" />
              <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {conversionFunnel.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>}

        {/* Client Sources */}
        {chartVis.clients && clientSources.length > 0 && (
          <div className="analytics-chart-card">
            <h3><UserPlus size={16} /> Client Sources</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={clientSources} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {clientSources.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>}
    </div>
  );
}
