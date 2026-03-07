import React, { useMemo, useState } from 'react';
import { AlertTriangle, Shield, DollarSign, Users, TrendingDown, Activity, Search, ChevronDown } from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from 'recharts';
import { useAppContext } from '../../../context/AppContext';
import {
  calcRevenueConcentration,
  calcDSO,
  calcWinRate,
  calcPipelineCoverage,
  calcExistingCustomerMix,
} from './auditMetrics';

// ────────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────────

function clamp(v: number, min: number = 0, max: number = 100) {
  return Math.min(max, Math.max(min, v));
}

function getSeverity(score: number) {
  if (score <= 25) return { label: 'Low', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' };
  if (score <= 50) return { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' };
  if (score <= 75) return { label: 'High', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' };
  return { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' };
}

function scoreColor(score: number) {
  if (score <= 25) return '#22c55e';
  if (score <= 50) return '#f59e0b';
  if (score <= 75) return '#f97316';
  return '#ef4444';
}

// Net profit margin — inline since not exported from auditMetrics
function calcNetProfitMargin(payments: any[], expenses: any[]) {
  const revenue = payments
    .filter(p => p.status === 'completed')
    .reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  if (revenue === 0) return 0;
  return ((revenue - totalExpenses) / revenue) * 100;
}

// Days since a date string
function daysSince(dateStr: string | null | undefined) {
  if (!dateStr) return Infinity;
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
}

// ────────────────────────────────────────────────────────────────────────────────
// Risk computation per category
// ────────────────────────────────────────────────────────────────────────────────

function computeRiskCategories(clients: any[], payments: any[], prospects: any[], expenses: any[]) {
  // Filtered payments for a subset of clients (or all)
  const completedPayments = payments.filter(p => p.status === 'completed');
  const totalRevenue = completedPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const monthlyRevenue = totalRevenue / Math.max(1, 12); // rough avg

  // ── 1. Revenue Risk ──────────────────────────────────────────────────────────
  const revConcentration = calcRevenueConcentration(payments, 3);
  const existingMix = calcExistingCustomerMix(payments, clients);
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const recentPayments = completedPayments.filter(p => new Date(p.createdAt).getTime() > thirtyDaysAgo);

  let revenueScore = 0;
  const revenueSignals = [];

  if (revConcentration > 60) {
    revenueScore += 40;
    revenueSignals.push({
      text: `Top 3 clients account for ${revConcentration.toFixed(0)}% of revenue (above 60% threshold)`,
      action: 'Diversify revenue by actively pursuing new market segments',
      severity: 'critical',
    });
  } else if (revConcentration > 40) {
    revenueScore += 25;
    revenueSignals.push({
      text: `Revenue concentration at ${revConcentration.toFixed(0)}% — approaching risky levels`,
      action: 'Set a goal to reduce top-3 client share below 40%',
      severity: 'high',
    });
  }

  if (existingMix < 40) {
    revenueScore += 20;
    revenueSignals.push({
      text: `Only ${existingMix.toFixed(0)}% of revenue from established clients — heavy reliance on new business`,
      action: 'Build recurring revenue through retainer or subscription models',
      severity: 'medium',
    });
  }

  if (recentPayments.length === 0 && completedPayments.length > 0) {
    revenueScore += 20;
    revenueSignals.push({
      text: 'No completed payments in the last 30 days',
      action: 'Review outstanding invoices and follow up with active clients',
      severity: 'high',
    });
  }

  if (revenueSignals.length === 0) {
    revenueSignals.push({ text: 'Revenue concentration and customer mix look healthy', action: null, severity: 'ok' });
  }

  // ── 2. Cash Flow Risk ────────────────────────────────────────────────────────
  const dso = calcDSO(clients);
  const allInvoices = clients.flatMap(c => c.invoices || []);
  const overdueCount = allInvoices.filter(inv => {
    if (inv.status === 'paid') return false;
    if (!inv.dueDate) return false;
    return new Date(inv.dueDate) < new Date();
  }).length;
  const netMargin = calcNetProfitMargin(payments, expenses);

  let cashFlowScore = 0;
  const cashFlowSignals = [];

  if (dso > 45) {
    cashFlowScore += 40;
    cashFlowSignals.push({
      text: `Average collection time is ${dso} days (above 45-day threshold)`,
      action: 'Implement automated payment reminders and consider early-pay discounts',
      severity: 'critical',
    });
  } else if (dso > 30) {
    cashFlowScore += 25;
    cashFlowSignals.push({
      text: `DSO at ${dso} days — invoices are taking longer than ideal to collect`,
      action: 'Send reminders at 14 and 21 days post-invoice',
      severity: 'medium',
    });
  }

  if (overdueCount > 0) {
    const overduePoints = clamp(overdueCount * 10, 0, 40);
    cashFlowScore += overduePoints;
    cashFlowSignals.push({
      text: `${overdueCount} overdue invoice${overdueCount !== 1 ? 's' : ''} outstanding`,
      action: 'Contact clients with overdue invoices immediately — escalate if > 60 days',
      severity: overdueCount >= 3 ? 'critical' : 'high',
    });
  }

  if (netMargin < 10 && totalRevenue > 0) {
    cashFlowScore += 20;
    cashFlowSignals.push({
      text: `Net profit margin is ${netMargin.toFixed(1)}% — below the 10% healthy threshold`,
      action: 'Audit expenses for reduction opportunities and review service pricing',
      severity: 'high',
    });
  }

  if (cashFlowSignals.length === 0) {
    cashFlowSignals.push({ text: 'DSO and invoice collection are within healthy ranges', action: null, severity: 'ok' });
  }

  // ── 3. Pipeline Risk ─────────────────────────────────────────────────────────
  const winRate = calcWinRate(prospects);
  const pipelineTarget = monthlyRevenue * 3;
  const pipelineCoverage = calcPipelineCoverage(prospects, pipelineTarget > 0 ? pipelineTarget : 1);
  const openPipelineValue = prospects
    .filter(p => !p.closedAt)
    .reduce((s, p) => s + (p.dealValue || 0), 0);

  let pipelineScore = 0;
  const pipelineSignals = [];

  if (winRate < 30) {
    pipelineScore += 40;
    pipelineSignals.push({
      text: `Win rate is ${winRate.toFixed(0)}% — below the 30% benchmark`,
      action: 'Review lost deals for patterns; improve qualification and proposal quality',
      severity: 'critical',
    });
  } else if (winRate < 50) {
    pipelineScore += 20;
    pipelineSignals.push({
      text: `Win rate of ${winRate.toFixed(0)}% has room for improvement`,
      action: 'Analyse objections from lost deals and refine sales messaging',
      severity: 'medium',
    });
  }

  if (pipelineCoverage !== null) {
    if (pipelineCoverage < 50) {
      pipelineScore += 50;
      pipelineSignals.push({
        text: `Pipeline coverage at ${pipelineCoverage.toFixed(0)}% — critically underfilled`,
        action: 'Immediately increase prospecting activity and expand outreach channels',
        severity: 'critical',
      });
    } else if (pipelineCoverage < 100) {
      pipelineScore += 30;
      pipelineSignals.push({
        text: `Pipeline coverage at ${pipelineCoverage.toFixed(0)}% of the 3× monthly target`,
        action: 'Accelerate lead generation to build a healthy pipeline buffer',
        severity: 'high',
      });
    }
  }

  if (openPipelineValue < monthlyRevenue * 3 && prospects.length > 0) {
    pipelineScore += 10;
    if (!pipelineSignals.some(s => s.text.includes('pipeline coverage'))) {
      pipelineSignals.push({
        text: 'Open pipeline value is below 3× monthly revenue',
        action: 'Aim to maintain at least 3× monthly revenue in active opportunities',
        severity: 'medium',
      });
    }
  }

  if (prospects.length === 0) {
    pipelineScore += 30;
    pipelineSignals.push({
      text: 'No prospects in the pipeline',
      action: 'Begin prospecting immediately to build sales momentum',
      severity: 'critical',
    });
  }

  if (pipelineSignals.length === 0) {
    pipelineSignals.push({ text: 'Pipeline coverage and win rate are within healthy ranges', action: null, severity: 'ok' });
  }

  // ── 4. Operational Risk ──────────────────────────────────────────────────────
  const auditsData = (() => {
    try {
      const raw = localStorage.getItem('threeseas_bi_audits');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  })();

  const interventionsData = (() => {
    try {
      const raw = localStorage.getItem('threeseas_bi_interventions');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  })();

  let operationalScore = 0;
  const operationalSignals = [];

  // Check audit category scores
  const allAudits: any[] = Object.values(auditsData).flat();
  const lowScoringCategories: string[] = [];
  allAudits.forEach(audit => {
    if (!audit || !audit.categories) return;
    Object.entries(audit.categories).forEach(([cat, data]: [string, any]) => {
      const score = data?.score ?? data ?? 0;
      if (score < 4) lowScoringCategories.push(cat);
    });
  });
  const uniqueLowCats = [...new Set(lowScoringCategories)];
  if (uniqueLowCats.length > 0) {
    const pts = clamp(uniqueLowCats.length * 20, 0, 60);
    operationalScore += pts;
    operationalSignals.push({
      text: `${uniqueLowCats.length} audit categor${uniqueLowCats.length !== 1 ? 'ies' : 'y'} scoring below 4/10`,
      action: 'Prioritise improving the lowest-scoring audit areas with targeted interventions',
      severity: uniqueLowCats.length >= 3 ? 'critical' : 'high',
    });
  }

  // Check overdue in-progress interventions (> 90 days)
  const allInterventions: any[] = Object.values(interventionsData).flat();
  const overdueInterventions = allInterventions.filter(iv =>
    iv?.status === 'in_progress' && daysSince(iv.startDate) > 90
  );
  if (overdueInterventions.length > 0) {
    operationalScore += 20;
    operationalSignals.push({
      text: `${overdueInterventions.length} in-progress intervention${overdueInterventions.length !== 1 ? 's' : ''} overdue (> 90 days)`,
      action: 'Review stalled interventions — complete, pause, or reassign them',
      severity: 'high',
    });
  }

  // Data completeness: clients with no intake
  const intakesData = (() => {
    try {
      const raw = localStorage.getItem('threeseas_bi_intakes');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  })();

  const activeClientsCount = clients.filter(c => c.status === 'active' || c.status === 'vip').length;
  const clientsWithIntake = clients.filter(c => intakesData[c.id]).length;
  if (activeClientsCount > 0 && clientsWithIntake / activeClientsCount < 0.7) {
    operationalScore += 10;
    operationalSignals.push({
      text: `Only ${Math.round((clientsWithIntake / activeClientsCount) * 100)}% of active clients have intake forms`,
      action: 'Complete intake questionnaires for all active clients to improve data quality',
      severity: 'medium',
    });
  }

  if (operationalSignals.length === 0) {
    operationalSignals.push({ text: 'No major operational issues detected', action: null, severity: 'ok' });
  }

  // ── 5. Client Health Risk ────────────────────────────────────────────────────
  const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;
  const clientsNoRecentPayment = clients
    .filter(c => c.status === 'active' || c.status === 'vip')
    .filter(c => {
      const clientPayments = completedPayments.filter(p => p.clientId === c.id);
      if (clientPayments.length === 0) return false;
      const latest = clientPayments.reduce((a, p) => {
        const d = new Date(p.createdAt).getTime();
        return d > a ? d : a;
      }, 0);
      return latest < sixtyDaysAgo;
    });

  const byClientRevenue: Record<string, number> = {};
  completedPayments.forEach(p => {
    byClientRevenue[p.clientId] = (byClientRevenue[p.clientId] || 0) + (p.amount || 0);
  });
  const sortedClientRevenues = Object.values(byClientRevenue).sort((a, b) => b - a);
  const topClientPct = totalRevenue > 0 && sortedClientRevenues.length > 0
    ? (sortedClientRevenues[0] / totalRevenue) * 100
    : 0;

  // Overall average audit score across all clients
  const allScores: number[] = [];
  (Object.values(auditsData).flat() as any[]).forEach(audit => {
    if (audit?.overallScore != null) allScores.push(audit.overallScore);
  });
  const avgAuditScore = allScores.length > 0
    ? allScores.reduce((s, v) => s + v, 0) / allScores.length
    : null;

  let clientHealthScore = 0;
  const clientHealthSignals = [];

  if (clientsNoRecentPayment.length > 0) {
    const pts = clamp(clientsNoRecentPayment.length * 15, 0, 45);
    clientHealthScore += pts;
    clientHealthSignals.push({
      text: `${clientsNoRecentPayment.length} active client${clientsNoRecentPayment.length !== 1 ? 's have' : ' has'} not paid in over 60 days`,
      action: 'Schedule check-in calls with at-risk clients to assess engagement level',
      severity: clientsNoRecentPayment.length >= 3 ? 'critical' : 'high',
    });
  }

  if (topClientPct > 40) {
    clientHealthScore += 20;
    clientHealthSignals.push({
      text: `Single top client represents ${topClientPct.toFixed(0)}% of total revenue`,
      action: 'Treat this client relationship as critical — ensure strong service delivery and relationship management',
      severity: 'high',
    });
  }

  if (avgAuditScore !== null && avgAuditScore < 5) {
    clientHealthScore += 25;
    clientHealthSignals.push({
      text: `Average client audit score is ${avgAuditScore.toFixed(1)}/10 — clients are below healthy threshold`,
      action: 'Schedule strategy reviews with lowest-scored clients and create action plans',
      severity: 'high',
    });
  }

  if (clientHealthSignals.length === 0) {
    clientHealthSignals.push({ text: 'Client health indicators are within acceptable range', action: null, severity: 'ok' });
  }

  return [
    {
      id: 'revenue',
      label: 'Revenue Risk',
      icon: DollarSign,
      color: '#f59e0b',
      score: clamp(revenueScore),
      signals: revenueSignals,
    },
    {
      id: 'cashflow',
      label: 'Cash Flow Risk',
      icon: TrendingDown,
      color: '#ef4444',
      score: clamp(cashFlowScore),
      signals: cashFlowSignals,
    },
    {
      id: 'pipeline',
      label: 'Pipeline Risk',
      icon: Activity,
      color: '#6366f1',
      score: clamp(pipelineScore),
      signals: pipelineSignals,
    },
    {
      id: 'operational',
      label: 'Operational Risk',
      icon: Shield,
      color: '#3b82f6',
      score: clamp(operationalScore),
      signals: operationalSignals,
    },
    {
      id: 'clientHealth',
      label: 'Client Health Risk',
      icon: Users,
      color: '#8b5cf6',
      score: clamp(clientHealthScore),
      signals: clientHealthSignals,
    },
  ];
}

// ────────────────────────────────────────────────────────────────────────────────
// Circular gauge SVG
// ────────────────────────────────────────────────────────────────────────────────

function CircularGauge({ score, size = 140 }: { score: number; size?: number }) {
  const r = (size / 2) - 12;
  const circumference = 2 * Math.PI * r;
  const progress = (score / 100) * circumference;
  const color = scoreColor(score);
  const sev = getSeverity(score);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={10}
        />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 2,
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>/100</div>
        <div style={{
          fontSize: '0.72rem', fontWeight: 700, color,
          background: sev.bg, border: `1px solid ${sev.border}`,
          borderRadius: 10, padding: '1px 8px', marginTop: 2,
        }}>{sev.label}</div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Signal item
// ────────────────────────────────────────────────────────────────────────────────

const SEVERITY_STYLE = {
  ok: { color: '#22c55e', dot: '#22c55e' },
  medium: { color: '#f59e0b', dot: '#f59e0b' },
  high: { color: '#f97316', dot: '#f97316' },
  critical: { color: '#ef4444', dot: '#ef4444' },
};

function SignalItem({ signal }: { signal: any }) {
  const style = SEVERITY_STYLE[signal.severity] || SEVERITY_STYLE.medium;
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: style.dot, flexShrink: 0, marginTop: 5 }} />
      <div>
        <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4 }}>{signal.text}</div>
        {signal.action && (
          <div style={{ fontSize: '0.71rem', color: '#64748b', marginTop: 2, fontStyle: 'italic' }}>
            Recommendation: {signal.action}
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────────

interface RiskAssessmentProps {
  biClientId: string;
  onBiClientChange: (id: string) => void;
}

export default function RiskAssessment({ biClientId, onBiClientChange }: RiskAssessmentProps) {
  const { clients, payments, prospects, expenses } = useAppContext();

  const [selectedClientId, setSelectedClientId] = useState<string>(biClientId || '');
  const [clientSearch, setClientSearch] = useState<string>(() => {
    if (!biClientId) return '';
    const c = clients.find(cl => cl.id === biClientId);
    return c ? c.name + (c.businessName ? ' (' + c.businessName + ')' : '') : '';
  });
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  const activeClients = clients.filter(c => c.status !== 'archived' && c.status !== 'rejected');

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return activeClients;
    const q = clientSearch.toLowerCase();
    return activeClients.filter(c =>
      c.name?.toLowerCase().includes(q) || c.businessName?.toLowerCase().includes(q)
    );
  }, [activeClients, clientSearch]);

  // When a client is selected, scope payments to that client; otherwise use all
  const scopedPayments = useMemo(() => {
    if (!selectedClientId) return payments;
    return payments.filter(p => p.clientId === selectedClientId);
  }, [payments, selectedClientId]);

  const scopedClients = useMemo(() => {
    if (!selectedClientId) return clients;
    return clients.filter(c => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  // Pure computation — no persistence
  const riskCategories = useMemo(
    () => computeRiskCategories(scopedClients, scopedPayments, prospects, expenses),
    [scopedClients, scopedPayments, prospects, expenses]
  );

  const overallScore = useMemo(() => {
    const avg = riskCategories.reduce((s, c) => s + c.score, 0) / riskCategories.length;
    return Math.round(avg);
  }, [riskCategories]);

  const overallSev = getSeverity(overallScore);

  const radarData = riskCategories.map(c => ({ subject: c.label.replace(' Risk', ''), score: c.score }));

  const selectClient = (c: any) => {
    setSelectedClientId(c.id);
    setClientSearch(c.name + (c.businessName ? ' (' + c.businessName + ')' : ''));
    setDropdownOpen(false);
    onBiClientChange?.(c.id);
  };

  const clearClient = () => {
    setSelectedClientId('');
    setClientSearch('');
    setDropdownOpen(false);
    onBiClientChange?.('');
  };

  return (
    <div style={{ color: '#e2e8f0' }}>
      {/* Header */}
      <div className="bi-header" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>
          <AlertTriangle size={20} color="#f59e0b" /> Risk Assessment
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: '0.72rem', color: '#64748b', padding: '3px 10px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20,
          }}>
            Live — recalculates from CRM data
          </span>
        </div>
      </div>

      {/* Client Selector */}
      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <label style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6, display: 'block' }}>
          Scope — Client (optional — leave blank to analyse all clients)
        </label>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
          <input
            type="text"
            value={clientSearch}
            placeholder="All clients (aggregate view)"
            style={{ paddingLeft: 32, width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', padding: '0.5rem 0.75rem 0.5rem 32px' }}
            onChange={e => { setClientSearch(e.target.value); setDropdownOpen(true); if (!e.target.value) clearClient(); }}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
          />
          <ChevronDown size={15} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
        </div>
        {dropdownOpen && filteredClients.length > 0 && (
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', position: 'absolute', zIndex: 50, width: '100%', maxHeight: 200, overflowY: 'auto', marginTop: 2 }}>
            <div
              style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', color: !selectedClientId ? '#818cf8' : '#94a3b8', background: !selectedClientId ? 'rgba(99,102,241,0.1)' : 'transparent', fontSize: '0.82rem', fontStyle: 'italic' }}
              onMouseDown={clearClient}
            >
              All clients (aggregate)
            </div>
            {filteredClients.map(c => (
              <div
                key={c.id}
                style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', color: c.id === selectedClientId ? '#818cf8' : '#e2e8f0', background: c.id === selectedClientId ? 'rgba(99,102,241,0.15)' : 'transparent', fontSize: '0.85rem' }}
                onMouseDown={() => selectClient(c)}
              >
                {c.name}{c.businessName ? ` (${c.businessName})` : ''}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overall Score + Radar */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        {/* Overall Score Gauge */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${overallSev.border}`,
          borderRadius: 16,
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
            Overall Risk Score
          </div>
          <CircularGauge score={overallScore} size={130} />
          <div style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'center', lineHeight: 1.5 }}>
            {overallSev.label === 'Low' && 'Business risk profile is healthy'}
            {overallSev.label === 'Medium' && 'Some risks need monitoring'}
            {overallSev.label === 'High' && 'Several areas need attention'}
            {overallSev.label === 'Critical' && 'Immediate action required'}
          </div>
        </div>

        {/* Radar Chart */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>
            Risk Profile — All Categories
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tickCount={5}
                tick={{ fill: '#475569', fontSize: 9 }}
                axisLine={false}
              />
              <Radar
                name="Risk Score"
                dataKey="score"
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.18}
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 3 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5 Risk Category Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {riskCategories.map(cat => {
          const sev = getSeverity(cat.score);
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid rgba(255,255,255,0.08)`,
                borderTop: `3px solid ${cat.color}`,
                borderRadius: 12,
                padding: '1rem 1.1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {/* Card header: category + score */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Icon size={16} color={cat.color} />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f1f5f9' }}>{cat.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: '1.1rem', fontWeight: 800, color: scoreColor(cat.score), lineHeight: 1,
                  }}>{cat.score}</span>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700,
                    background: sev.bg,
                    color: sev.color,
                    border: `1px solid ${sev.border}`,
                    borderRadius: 10,
                    padding: '1px 7px',
                  }}>{sev.label}</span>
                </div>
              </div>

              {/* Score bar */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                <div style={{
                  width: `${cat.score}%`, height: '100%',
                  background: scoreColor(cat.score),
                  borderRadius: 4,
                  transition: 'width 0.4s ease',
                }} />
              </div>

              {/* Signals */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {cat.signals.map((signal, i) => <SignalItem key={i} signal={signal} />)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Responsive override */}
      <style>{`
        @media (max-width: 768px) {
          .bi-risk-grid-top {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
