/**
 * Pure utility functions that compute strategy metrics from existing CRM data.
 * Used by KPIDashboard and other BI components.
 * All functions accept raw data arrays and return numbers or objects.
 */

/** Revenue growth rate (%) between two periods. Periods are 'YYYY-MM' strings. */
export function calcRevenueGrowthRate(payments, currentMonth, priorMonth) {
  const current = payments
    .filter(p => p.status === 'completed' && p.createdAt?.startsWith(currentMonth))
    .reduce((s, p) => s + (p.amount || 0), 0);
  const prior = payments
    .filter(p => p.status === 'completed' && p.createdAt?.startsWith(priorMonth))
    .reduce((s, p) => s + (p.amount || 0), 0);
  if (prior === 0) return current > 0 ? 100 : 0;
  return ((current - prior) / prior) * 100;
}

/** Average order value = total revenue / payment count */
export function calcAOV(payments) {
  const completed = payments.filter(p => p.status === 'completed');
  if (completed.length === 0) return 0;
  const total = completed.reduce((s, p) => s + (p.amount || 0), 0);
  return total / completed.length;
}

/** Average revenue per active client */
export function calcARPU(payments, clients) {
  const activeClients = clients.filter(c => c.status === 'active' || c.status === 'vip');
  if (activeClients.length === 0) return 0;
  const total = payments
    .filter(p => p.status === 'completed')
    .reduce((s, p) => s + (p.amount || 0), 0);
  return total / activeClients.length;
}

/** Revenue concentration: % of total revenue from top N clients */
export function calcRevenueConcentration(payments, topN = 3) {
  const completed = payments.filter(p => p.status === 'completed');
  const total = completed.reduce((s, p) => s + (p.amount || 0), 0);
  if (total === 0) return 0;

  const byClient = {};
  completed.forEach(p => {
    byClient[p.clientId] = (byClient[p.clientId] || 0) + (p.amount || 0);
  });
  const sorted = Object.values(byClient).sort((a, b) => b - a);
  const topRevenue = sorted.slice(0, topN).reduce((s, v) => s + v, 0);
  return (topRevenue / total) * 100;
}

/** Existing customer revenue mix: % from clients older than 6 months */
export function calcExistingCustomerMix(payments, clients) {
  const completed = payments.filter(p => p.status === 'completed');
  const total = completed.reduce((s, p) => s + (p.amount || 0), 0);
  if (total === 0) return 0;

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const existingClientIds = new Set(
    clients.filter(c => c.createdAt && new Date(c.createdAt) < sixMonthsAgo).map(c => c.id)
  );
  const existingRevenue = completed
    .filter(p => existingClientIds.has(p.clientId))
    .reduce((s, p) => s + (p.amount || 0), 0);
  return (existingRevenue / total) * 100;
}

/** Win rate: won prospects / (won + lost) */
export function calcWinRate(prospects) {
  const won = prospects.filter(p => p.outcome === 'won').length;
  const lost = prospects.filter(p => p.outcome === 'lost').length;
  if (won + lost === 0) return 0;
  return (won / (won + lost)) * 100;
}

/** Average deal size of won prospects */
export function calcAvgDealSize(prospects) {
  const won = prospects.filter(p => p.outcome === 'won' && p.dealValue > 0);
  if (won.length === 0) return 0;
  return won.reduce((s, p) => s + p.dealValue, 0) / won.length;
}

/** Average sales cycle length in days (created → closed for won prospects) */
export function calcSalesCycleLength(prospects) {
  const won = prospects.filter(p => p.outcome === 'won' && p.createdAt && p.closedAt);
  if (won.length === 0) return 0;
  const totalDays = won.reduce((s, p) => {
    const days = (new Date(p.closedAt) - new Date(p.createdAt)) / (1000 * 60 * 60 * 24);
    return s + Math.max(0, days);
  }, 0);
  return Math.round(totalDays / won.length);
}

/** Lead-to-customer conversion rate.
 *  Numerator = clients that came through the pipeline (have sourceProspectId).
 *  Denominator = total funnel entries: current leads + active prospects + converted clients.
 */
export function calcLeadConversionRate(leads, clients, prospects = []) {
  const converted = clients.filter(c => c.sourceProspectId).length;
  const activeProspects = prospects.filter(p => !p.closedAt).length;
  const totalFunnel = leads.length + activeProspects + converted;
  if (totalFunnel === 0) return 0;
  return (converted / totalFunnel) * 100;
}

/** Gross margin % = (revenue - expenses) / revenue */
export function calcGrossMargin(payments, expenses) {
  const revenue = payments
    .filter(p => p.status === 'completed')
    .reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  if (revenue === 0) return 0;
  return ((revenue - totalExpenses) / revenue) * 100;
}

/** Days Sales Outstanding: avg days from invoice creation to payment */
export function calcDSO(clients) {
  const paidInvoices = [];
  clients.forEach(c => {
    (c.invoices || []).forEach(inv => {
      if (inv.status === 'paid' && inv.createdAt && inv.paidAt) {
        const days = (new Date(inv.paidAt) - new Date(inv.createdAt)) / (1000 * 60 * 60 * 24);
        if (days >= 0) paidInvoices.push(days);
      }
    });
  });
  if (paidInvoices.length === 0) return 0;
  return Math.round(paidInvoices.reduce((s, d) => s + d, 0) / paidInvoices.length);
}

/** Revenue per FTE (approved users) */
export function calcRevenuePerFTE(payments, users) {
  const approved = users.filter(u => u.status === 'approved').length;
  if (approved === 0) return 0;
  const revenue = payments
    .filter(p => p.status === 'completed')
    .reduce((s, p) => s + (p.amount || 0), 0);
  return Math.round(revenue / approved);
}

/** Project completion rate: completed / total projects across all clients */
export function calcProjectCompletionRate(clients) {
  let total = 0;
  let completed = 0;
  clients.forEach(c => {
    (c.projects || []).forEach(p => {
      total++;
      if (p.status === 'completed' || p.status === 'archived') completed++;
    });
  });
  if (total === 0) return 0;
  return (completed / total) * 100;
}

/** Data completeness: % of clients with intake forms filled */
export function calcDataCompleteness(clients, intakes) {
  const nonPending = clients.filter(c => c.status !== 'pending');
  if (nonPending.length === 0) return 0;
  const withIntake = nonPending.filter(c => intakes[c.id]).length;
  return (withIntake / nonPending.length) * 100;
}

/** Pipeline coverage: total pipeline value / target (manual target input) */
export function calcPipelineCoverage(prospects, target) {
  if (!target || target <= 0) return null;
  const pipelineValue = prospects
    .filter(p => !p.closedAt)
    .reduce((s, p) => s + (p.dealValue || 0), 0);
  return (pipelineValue / target) * 100;
}

/** IFSR weighted priority score */
export function calcIFSR(impact, feasibility, speed, risk) {
  const i = Number(impact) || 0;
  const f = Number(feasibility) || 0;
  const s = Number(speed) || 0;
  const r = Number(risk) || 0;
  if (i === 0 && f === 0 && s === 0 && r === 0) return 0;
  return (0.40 * i) + (0.25 * f) + (0.20 * s) + (0.15 * r);
}

/** IFSR decision label based on score */
export function getIFSRDecision(score) {
  if (score >= 4.0) return 'Do Now';
  if (score >= 3.0) return 'Plan Next';
  if (score >= 2.0) return 'Later';
  return 'Deprioritize';
}

/** Total revenue for a given year */
export function calcTotalRevenue(payments, year) {
  return payments
    .filter(p => p.status === 'completed' && p.createdAt?.startsWith(String(year)))
    .reduce((s, p) => s + (p.amount || 0), 0);
}

/** Gross profit per FTE = (revenue - expenses) / approved users */
export function calcGrossProfitPerFTE(payments, expenses, users) {
  const approved = users.filter(u => u.status === 'approved').length;
  if (approved === 0) return 0;
  const revenue = payments
    .filter(p => p.status === 'completed')
    .reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  return Math.round((revenue - totalExpenses) / approved);
}

/** Format currency without cents */
export function fmtCurrency(num) {
  return `$${Number(num || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Format percentage */
export function fmtPct(num, decimals = 1) {
  return `${Number(num || 0).toFixed(decimals)}%`;
}
