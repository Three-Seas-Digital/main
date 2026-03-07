/**
 * KPI Registry — Industry-specific KPI packs from KPI_Library_All_Industries.md
 * Each client's industry (from intake form) determines which KPIs are tracked.
 * Organized by tier: North Star (3 outcomes), Driver (5 levers), Guardrail (2 risk).
 */

import { safeGetItem, safeSetItem, generateId } from '../../../constants';

export interface KpiDefinition {
  id: string;
  label: string;
  unit: string;
  tier: string;
  desc: string;
  category?: string;
}

export interface TierMeta {
  label: string;
  desc: string;
  color: string;
  chartType: string;
}

// --- Tier constructors (compact) ---
const ns = (id: string, label: string, unit: string, desc: string): KpiDefinition => ({ id, label, unit, tier: 'north_star', desc });
const dr = (id: string, label: string, unit: string, desc: string): KpiDefinition => ({ id, label, unit, tier: 'driver', desc });
const gr = (id: string, label: string, unit: string, desc: string): KpiDefinition => ({ id, label, unit, tier: 'guardrail', desc });

// --- Tier metadata ---
export const TIER_META: Record<string, TierMeta> = {
  north_star: { label: 'North Star', desc: 'Outcome metrics that define success', color: '#8b5cf6', chartType: 'area' },
  driver:     { label: 'Driver',     desc: 'Operational levers you control',      color: '#3b82f6', chartType: 'bar' },
  guardrail:  { label: 'Guardrail',  desc: 'Risk & protection thresholds',        color: '#f59e0b', chartType: 'line' },
  universal:  { label: 'Universal',  desc: 'Cross-industry fundamentals',         color: '#6b7280', chartType: 'line' },
  custom:     { label: 'Custom',     desc: 'Your own metrics',                    color: '#10b981', chartType: 'line' },
};

// --- Industry options for intake form dropdown (40 industries + Other) ---
export const INDUSTRY_OPTIONS: string[] = [
  'Retail (Brick & Mortar)',
  'E-commerce / DTC',
  'Restaurant / Food Service',
  'Hospitality (Hotels/Resorts)',
  'Healthcare',
  'Pharma / Biotech',
  'Legal Services',
  'Accounting / Tax / Audit',
  'Real Estate',
  'Construction / Engineering',
  'Manufacturing (General)',
  'FMCG / CPG Manufacturing',
  'Automotive (Dealer/Service)',
  'Beauty / Wellness / Fitness',
  'Education',
  'SaaS (B2B/B2C)',
  'IT Services / Consulting',
  'Telecommunications',
  'Media / Publishing',
  'Marketing / Advertising Agency',
  'Banking / Lending',
  'Insurance',
  'Fintech / Payments',
  'Logistics / Trucking / 3PL',
  'Warehousing / Fulfillment',
  'Transportation (Air/Sea/Rail)',
  'Energy & Utilities',
  'Oil & Gas / Mining',
  'Agriculture / Agribusiness',
  'Government / Public Sector',
  'Nonprofit / NGO',
  'Travel / Tourism',
  'HR / Staffing / Recruiting',
  'Security Services',
  'Aerospace & Defense',
  'Electronics / Semiconductors',
  'Wholesale / Distribution',
  'Import / Export / Trade',
  'Event Management',
  'Social Commerce / Creator',
  'Other',
];

// --- Backward-compat alias: old intake values → new pack keys ---
export const INDUSTRY_ALIAS: Record<string, string> = {
  'Restaurant/Food':  'Restaurant / Food Service',
  'Retail':           'Retail (Brick & Mortar)',
  'Healthcare':       'Healthcare',
  'Legal':            'Legal Services',
  'Real Estate':      'Real Estate',
  'Construction':     'Construction / Engineering',
  'Automotive':       'Automotive (Dealer/Service)',
  'Beauty/Spa':       'Beauty / Wellness / Fitness',
  'Fitness':          'Beauty / Wellness / Fitness',
  'Education':        'Education',
  'Technology':       'IT Services / Consulting',
  'Finance':          'Banking / Lending',
  'Non-Profit':       'Nonprofit / NGO',
  'Other':            'Other',
};

// --- KPI IDs that auto-compute from CRM data (auditMetrics.js functions) ---
export const AUTO_COMPUTE_IDS = new Set([
  'total_revenue', 'revenue_growth', 'aov', 'arpu', 'revenue_concentration',
  'win_rate', 'avg_deal_size', 'sales_cycle', 'lead_conversion', 'pipeline_coverage',
  'gross_margin', 'dso', 'rev_per_fte', 'gp_per_fte',
  'project_completion', 'data_completeness', 'existing_customer_mix',
]);

// --- Universal KPI Stack (works in any industry, 18 KPIs across 6 sub-categories) ---
export const UNIVERSAL_KPIS: KpiDefinition[] = [
  // Growth
  { id: 'revenue_growth',      label: 'Revenue Growth %',              unit: '%', tier: 'universal', category: 'Growth',           desc: 'Period-over-period revenue change. Auto-computed from payments.' },
  { id: 'new_customer_growth', label: 'New Customer Growth %',         unit: '%', tier: 'universal', category: 'Growth',           desc: 'Rate of new customer acquisition over time.' },
  { id: 'market_share',        label: 'Market Share %',                unit: '%', tier: 'universal', category: 'Growth',           desc: 'Your share of total addressable market revenue.' },
  // Acquisition
  { id: 'leads_inquiries',     label: 'Leads / Inquiries',            unit: '#', tier: 'universal', category: 'Acquisition',      desc: 'Total new leads or inquiries received this period.' },
  { id: 'lead_conversion',     label: 'Lead-to-Customer Conversion %',unit: '%', tier: 'universal', category: 'Acquisition',      desc: 'Leads that became paying clients. Auto-computed from pipeline.' },
  { id: 'cac',                 label: 'Customer Acquisition Cost',     unit: '$', tier: 'universal', category: 'Acquisition',      desc: 'Sales + marketing spend divided by new customers acquired.' },
  // Monetization
  { id: 'aov',                 label: 'Average Order Value',           unit: '$', tier: 'universal', category: 'Monetization',     desc: 'Average spend per completed transaction. Auto-computed.' },
  { id: 'gross_margin',        label: 'Gross Margin %',               unit: '%', tier: 'universal', category: 'Monetization',     desc: '(Revenue - Expenses) / Revenue. Auto-computed from financials.' },
  { id: 'contribution_margin', label: 'Contribution Margin %',        unit: '%', tier: 'universal', category: 'Monetization',     desc: 'Revenue minus variable costs, divided by revenue.' },
  // Retention
  { id: 'repeat_purchase_rate',label: 'Repeat Purchase Rate %',       unit: '%', tier: 'universal', category: 'Retention',        desc: 'Percentage of customers who make 2+ purchases.' },
  { id: 'customer_retention',  label: 'Customer Retention Rate %',    unit: '%', tier: 'universal', category: 'Retention',        desc: 'Customers retained over a period vs starting count.' },
  { id: 'churn_rate',          label: 'Churn Rate %',                 unit: '%', tier: 'universal', category: 'Retention',        desc: 'Customers lost over a period. Lower is better.' },
  // Cash & Efficiency
  { id: 'cash_conversion_cycle', label: 'Cash Conversion Cycle',     unit: 'days', tier: 'universal', category: 'Cash & Efficiency', desc: 'Days from cash out (inventory) to cash in (receivables).' },
  { id: 'dso',                 label: 'Days Sales Outstanding',       unit: 'days', tier: 'universal', category: 'Cash & Efficiency', desc: 'Avg days to collect after invoicing. Auto-computed. Lower is better.' },
  { id: 'operating_expense_ratio', label: 'Operating Expense Ratio',  unit: '%', tier: 'universal', category: 'Cash & Efficiency', desc: 'Operating expenses as percentage of revenue.' },
  // Experience
  { id: 'nps',                 label: 'Net Promoter Score',           unit: '#', tier: 'universal', category: 'Experience',        desc: 'Customer likelihood to recommend (-100 to +100).' },
  { id: 'csat',                label: 'Customer Satisfaction %',      unit: '%', tier: 'universal', category: 'Experience',        desc: 'Percentage of customers rating satisfaction as positive.' },
  { id: 'complaint_rate',      label: 'Complaint / Return Rate',      unit: '%', tier: 'universal', category: 'Experience',        desc: 'Rate of complaints or returns per transaction. Lower is better.' },
];

// --- Custom KPI slots ---
export const CUSTOM_KPIS: KpiDefinition[] = [
  { id: 'custom_1', label: 'Custom KPI 1', unit: '#', tier: 'custom', desc: 'User-defined metric. Set your own label, unit, and values.' },
  { id: 'custom_2', label: 'Custom KPI 2', unit: '#', tier: 'custom', desc: 'User-defined metric. Set your own label, unit, and values.' },
  { id: 'custom_3', label: 'Custom KPI 3', unit: '#', tier: 'custom', desc: 'User-defined metric. Set your own label, unit, and values.' },
];

// ============================================================================
// INDUSTRY KPI PACKS — 40 industries, 10 KPIs each (3 NS + 5 DR + 2 GR)
// ============================================================================

export const INDUSTRY_KPI_PACKS: Record<string, KpiDefinition[]> = {

  // 1) Retail (Brick-and-Mortar)
  'Retail (Brick & Mortar)': [
    ns('same_store_sales_growth', 'Same-Store Sales Growth %', '%', 'YoY revenue comparison for existing locations.'),
    ns('sales_per_sqft', 'Sales per Square Foot', '$', 'Revenue divided by retail floor area.'),
    ns('gross_margin', 'Gross Margin %', '%', '(Revenue - COGS) / Revenue.'),
    dr('foot_traffic', 'Foot Traffic', '#', 'Number of visitors entering the store.'),
    dr('conversion_rate_store', 'Conversion Rate (Store)', '%', 'Transactions / Visitors.'),
    dr('avg_basket_size', 'Avg Basket Size', '#', 'Average number of items per transaction.'),
    dr('avg_transaction_value', 'Avg Transaction Value', '$', 'Average dollar amount per transaction.'),
    dr('stockout_rate', 'Stockout Rate %', '%', 'Items out of stock vs total SKUs. Lower is better.'),
    gr('shrinkage_rate', 'Shrinkage %', '%', 'Inventory loss from theft, damage, errors.'),
    gr('return_rate', 'Return Rate %', '%', 'Products returned as % of sales. Lower is better.'),
  ],

  // 2) E-commerce / DTC
  'E-commerce / DTC': [
    ns('net_revenue', 'Net Revenue', '$', 'Total revenue after returns and discounts.'),
    ns('new_customers', 'New Customers', '#', 'First-time buyers acquired this period.'),
    ns('repeat_purchase_rate', 'Repeat Purchase Rate %', '%', 'Customers making 2+ purchases.'),
    dr('website_sessions', 'Website Sessions', '#', 'Total website visits this period.'),
    dr('add_to_cart_rate', 'Add-to-Cart Rate %', '%', 'Sessions with items added to cart.'),
    dr('checkout_completion_rate', 'Checkout Completion Rate %', '%', 'Carts that complete purchase.'),
    dr('aov', 'Average Order Value', '$', 'Revenue / number of orders.'),
    dr('cac_roas', 'CAC / ROAS', '$', 'Cost to acquire a customer or return on ad spend.'),
    gr('refund_chargeback_rate', 'Refund/Chargeback Rate %', '%', 'Refunds + chargebacks as % of orders.'),
    gr('fulfillment_cost_per_order', 'Fulfillment Cost per Order', '$', 'Shipping + handling cost per order. Lower is better.'),
  ],

  // 3) FMCG / CPG Manufacturing
  'FMCG / CPG Manufacturing': [
    ns('net_sales', 'Net Sales', '$', 'Gross sales minus returns, allowances, discounts.'),
    ns('gross_margin', 'Gross Margin %', '%', '(Net Sales - COGS) / Net Sales.'),
    ns('distribution_reach', 'Distribution Reach %', '%', 'Percentage of target outlets carrying your SKU.'),
    dr('on_shelf_availability', 'On-Shelf Availability %', '%', 'Products available when customer wants to buy.'),
    dr('sell_through_rate', 'Sell-Through Rate %', '%', 'Units sold / units received by retailer.'),
    dr('trade_promo_roi', 'Trade Promotion ROI', '%', 'Incremental revenue from promotions / promo cost.'),
    dr('forecast_accuracy', 'Forecast Accuracy %', '%', 'Actual vs predicted demand accuracy.'),
    dr('oee', 'OEE (Overall Equipment Effectiveness)', '%', 'Availability × Performance × Quality.'),
    gr('expiry_waste_rate', 'Expiry/Waste %', '%', 'Product lost to expiry or waste. Lower is better.'),
    gr('customer_fill_rate', 'Customer Fill Rate %', '%', 'Orders fulfilled completely and on time.'),
  ],

  // 4) Manufacturing (General)
  'Manufacturing (General)': [
    ns('throughput', 'Throughput', '#', 'Units produced per hour or per day.'),
    ns('on_time_delivery', 'On-Time Delivery %', '%', 'Orders delivered by promised date.'),
    ns('cost_per_unit', 'Cost per Unit', '$', 'Total production cost / units produced.'),
    dr('oee_mfg', 'OEE %', '%', 'Availability × Performance × Quality.'),
    dr('first_pass_yield', 'First Pass Yield %', '%', 'Units passing QC on first attempt.'),
    dr('changeover_time', 'Changeover Time', '#', 'Minutes to switch between product runs. Lower is better.'),
    dr('capacity_utilization', 'Capacity Utilization %', '%', 'Actual output / maximum possible output.'),
    dr('schedule_adherence', 'Schedule Adherence %', '%', 'Actual production vs planned schedule.'),
    gr('defect_rate', 'Defect Rate (PPM)', '#', 'Defective parts per million produced. Lower is better.'),
    gr('safety_incident_rate', 'Safety Incident Rate', '#', 'TRIR/LTIR incidents per 200,000 hours. Lower is better.'),
  ],

  // 5) Construction / Engineering
  'Construction / Engineering': [
    ns('project_gross_margin', 'Project Gross Margin %', '%', 'Project profit / project revenue.'),
    ns('on_time_project_delivery', 'On-Time Project Delivery %', '%', 'Projects completed by target date.'),
    ns('backlog_value', 'Backlog Value', '$', 'Total value of contracted but incomplete work.'),
    dr('cost_variance', 'Cost Variance', '$', 'Earned Value - Actual Cost. Positive = under budget.'),
    dr('schedule_variance', 'Schedule Variance', '$', 'Earned Value - Planned Value. Positive = ahead.'),
    dr('labor_productivity', 'Labor Productivity', '#', 'Output per labor-hour worked.'),
    dr('bid_win_rate', 'Bid-Win Rate %', '%', 'Bids won / total bids submitted.'),
    dr('rework_hours_pct', 'Rework Hours %', '%', 'Hours spent on rework vs total hours. Lower is better.'),
    gr('safety_incident_rate_constr', 'Safety Incident Rate', '#', 'Incidents per 200,000 hours. Lower is better.'),
    gr('change_order_pct', 'Change Order % of Contract', '%', 'Change orders as % of original contract value.'),
  ],

  // 6) Real Estate
  'Real Estate': [
    ns('occupancy_rate', 'Occupancy Rate %', '%', 'Occupied units / total available units.'),
    ns('noi', 'Net Operating Income', '$', 'Revenue minus operating expenses (before debt).'),
    ns('rev_per_available_unit', 'Revenue per Available Unit', '$', 'Total revenue / total units (occupied or not).'),
    dr('leasing_velocity', 'Leasing Velocity', 'days', 'Average days from listing to signed lease. Lower is better.'),
    dr('lead_to_lease_conversion', 'Lead-to-Lease Conversion %', '%', 'Inquiries that become signed leases.'),
    dr('renewal_rate', 'Renewal Rate %', '%', 'Tenants renewing their lease.'),
    dr('avg_rent_growth', 'Average Rent Growth %', '%', 'YoY increase in average rent per unit.'),
    dr('maintenance_response_time', 'Maintenance Response Time', 'days', 'Avg days to resolve maintenance requests. Lower is better.'),
    gr('delinquency_rate', 'Delinquency Rate %', '%', 'Tenants past due on rent. Lower is better.'),
    gr('turnover_cost_per_unit', 'Turnover Cost per Unit', '$', 'Cost to prepare a unit between tenants. Lower is better.'),
  ],

  // 7) Hospitality (Hotels/Resorts)
  'Hospitality (Hotels/Resorts)': [
    ns('revpar', 'RevPAR', '$', 'Revenue Per Available Room = ADR × Occupancy.'),
    ns('gop_margin', 'GOP Margin %', '%', 'Gross Operating Profit / Total Revenue.'),
    ns('occupancy_pct_hotel', 'Occupancy %', '%', 'Rooms sold / rooms available.'),
    dr('adr', 'Average Daily Rate', '$', 'Room revenue / rooms sold.'),
    dr('direct_booking_share', 'Direct Booking Share %', '%', 'Bookings via own site vs OTAs.'),
    dr('ancillary_rev_per_guest', 'Ancillary Revenue per Guest', '$', 'Non-room revenue (F&B, spa, etc.) per guest.'),
    dr('booking_lead_time', 'Booking Lead Time', 'days', 'Days between booking and check-in.'),
    dr('upsell_conversion', 'Upsell Conversion %', '%', 'Guests accepting room/service upgrades.'),
    gr('cancellation_rate_hotel', 'Cancellation Rate %', '%', 'Bookings cancelled before arrival. Lower is better.'),
    gr('guest_complaint_rate', 'Guest Complaint Rate', '%', 'Complaints per 100 guests. Lower is better.'),
  ],

  // 8) Restaurants / Food Service
  'Restaurant / Food Service': [
    ns('same_store_sales_growth_rest', 'Same-Store Sales Growth %', '%', 'YoY revenue comparison for existing locations.'),
    ns('prime_cost_pct', 'Prime Cost %', '%', '(COGS + Labor) / Revenue. Lower is better.'),
    ns('ebitda_margin', 'EBITDA Margin %', '%', 'Earnings before interest, tax, depreciation / revenue.'),
    dr('table_turnover_rate', 'Table Turnover Rate', '#', 'Times each table is used per service period.'),
    dr('avg_check_size', 'Average Check Size', '$', 'Average spend per guest/table.'),
    dr('labor_cost_pct', 'Labor Cost %', '%', 'Total labor / revenue. Lower is better.'),
    dr('food_cost_pct', 'Food Cost %', '%', 'Ingredient cost / food revenue. Lower is better.'),
    dr('online_rating', 'Online Rating / Review Score', '#', 'Average rating on Google/Yelp (1-5 scale).'),
    gr('waste_pct', 'Waste %', '%', 'Food waste as % of purchases. Lower is better.'),
    gr('order_error_rate', 'Order Error Rate %', '%', 'Incorrect orders / total orders. Lower is better.'),
  ],

  // 9) Healthcare
  'Healthcare': [
    ns('patient_outcomes', 'Patient Outcomes KPI', '#', 'Condition-specific outcome score.'),
    ns('net_rev_per_encounter', 'Net Revenue per Encounter', '$', 'Average collected revenue per patient visit.'),
    ns('patient_retention', 'Patient Retention %', '%', 'Patients returning for follow-up care.'),
    dr('no_show_rate', 'No-Show Rate %', '%', 'Scheduled patients who don\'t appear. Lower is better.'),
    dr('wait_time', 'Wait Time', '#', 'Average patient wait in minutes. Lower is better.'),
    dr('length_of_stay', 'Length of Stay', 'days', 'Average inpatient days. Context-dependent.'),
    dr('bed_utilization', 'Bed/Room Utilization %', '%', 'Occupied beds / total available beds.'),
    dr('claims_acceptance_rate', 'Claims Acceptance Rate %', '%', 'Insurance claims accepted on first submission.'),
    gr('readmission_rate', 'Readmission Rate %', '%', 'Patients readmitted within 30 days. Lower is better.'),
    gr('adverse_event_rate', 'Adverse Event Rate', '#', 'Adverse events per 1,000 patient days. Lower is better.'),
  ],

  // 10) Pharma / Biotech
  'Pharma / Biotech': [
    ns('pipeline_value_pharma', 'Pipeline Value', '$', 'Total estimated value of drugs in development.'),
    ns('time_to_milestone', 'Time-to-Milestone', 'days', 'Days to reach next clinical/regulatory milestone.'),
    ns('commercial_revenue', 'Commercial Revenue', '$', 'Post-launch product revenue.'),
    dr('enrollment_rate', 'Enrollment Rate (Trials)', '%', 'Patient enrollment vs target for clinical trials.'),
    dr('protocol_deviation_rate', 'Protocol Deviation Rate', '%', 'Deviations from trial protocol. Lower is better.'),
    dr('batch_yield', 'Manufacturing Batch Yield %', '%', 'Usable output / total batch produced.'),
    dr('on_time_submission', 'On-Time Submission %', '%', 'Regulatory filings submitted by deadline.'),
    dr('kol_engagement', 'KOL Engagement Score', '#', 'Key Opinion Leader engagement index.'),
    gr('compliance_findings_pharma', 'Compliance Findings', '#', 'Regulatory compliance issues found. Lower is better.'),
    gr('pharmacovigilance_response', 'Pharmacovigilance Response Time', 'days', 'Time to respond to safety signals. Lower is better.'),
  ],

  // 11) Insurance
  'Insurance': [
    ns('combined_ratio', 'Combined Ratio', '%', 'Loss Ratio + Expense Ratio. Below 100% = profitable.'),
    ns('gwp_growth', 'GWP Growth %', '%', 'Gross Written Premium growth year-over-year.'),
    ns('policy_retention', 'Policy Retention %', '%', 'Policies renewed at expiry.'),
    dr('quote_to_bind_rate', 'Quote-to-Bind Rate %', '%', 'Quotes that become bound policies.'),
    dr('loss_ratio', 'Loss Ratio %', '%', 'Claims paid / premiums earned. Lower is better.'),
    dr('expense_ratio_ins', 'Expense Ratio %', '%', 'Operating expenses / premiums earned.'),
    dr('avg_premium_per_policy', 'Avg Premium per Policy', '$', 'Average annual premium collected per policy.'),
    dr('claims_cycle_time', 'Claims Cycle Time', 'days', 'Average days to settle a claim. Lower is better.'),
    gr('fraud_detection_rate', 'Fraud Detection Hit Rate', '%', 'Flagged claims confirmed as fraudulent.'),
    gr('regulatory_complaint_ratio', 'Regulatory Complaint Ratio', '%', 'Complaints per 1,000 policies. Lower is better.'),
  ],

  // 12) Banking / Lending
  'Banking / Lending': [
    ns('net_interest_margin', 'Net Interest Margin (NIM)', '%', 'Interest earned minus interest paid / earning assets.'),
    ns('risk_adjusted_return', 'Risk-Adjusted Return (RAROC)', '%', 'Return adjusted for risk capital.'),
    ns('deposit_growth', 'Deposit Growth %', '%', 'Growth in total deposits year-over-year.'),
    dr('loan_approval_rate', 'Loan Approval Rate', '%', 'Applications approved / total applications.'),
    dr('cost_of_funds', 'Cost of Funds', '%', 'Interest paid on deposits and borrowings.'),
    dr('cross_sell_ratio', 'Cross-Sell Ratio', '#', 'Products per customer. Higher is better.'),
    dr('digital_adoption', 'Digital Adoption %', '%', 'Customers using digital banking channels.'),
    dr('branch_productivity', 'Branch/Channel Productivity', '$', 'Revenue generated per branch or channel.'),
    gr('npl_ratio', 'NPL Ratio %', '%', 'Non-performing loans / total loans. Lower is better.'),
    gr('delinquency_dpd', 'Delinquency (30/60/90+ DPD)', '%', 'Loans past due by days. Lower is better.'),
  ],

  // 13) Fintech / Payments
  'Fintech / Payments': [
    ns('total_payment_volume', 'Total Payment Volume (TPV)', '$', 'Total value processed through the platform.'),
    ns('net_revenue_fintech', 'Net Revenue', '$', 'Revenue after processing costs and refunds.'),
    ns('active_users_mau', 'Active Users (MAU)', '#', 'Monthly active users on the platform.'),
    dr('activation_rate', 'Activation Rate %', '%', 'Signed-up users who complete first transaction.'),
    dr('transaction_success_rate', 'Transaction Success Rate %', '%', 'Successful transactions / total attempted.'),
    dr('take_rate', 'Take Rate %', '%', 'Platform revenue / total payment volume.'),
    dr('merchant_churn', 'Merchant Churn %', '%', 'Merchants leaving the platform. Lower is better.'),
    dr('cac_payback', 'CAC Payback', '#', 'Months to recoup customer acquisition cost. Lower is better.'),
    gr('fraud_loss_rate', 'Fraud Loss Rate %', '%', 'Losses from fraud / total volume. Lower is better.'),
    gr('chargeback_rate', 'Chargeback Rate %', '%', 'Chargebacks / total transactions. Lower is better.'),
  ],

  // 14) SaaS (B2B/B2C)
  'SaaS (B2B/B2C)': [
    ns('mrr_arr_growth', 'MRR/ARR Growth %', '%', 'Monthly/Annual Recurring Revenue growth rate.'),
    ns('nrr', 'Net Revenue Retention (NRR) %', '%', 'Retained + expanded revenue from existing customers.'),
    ns('logo_churn', 'Logo Churn %', '%', 'Customer accounts lost this period. Lower is better.'),
    dr('trial_to_paid', 'Trial-to-Paid Conversion %', '%', 'Trial users that become paying customers.'),
    dr('activation_rate_saas', 'Activation Rate %', '%', 'New users reaching "aha moment" milestone.'),
    dr('arpu', 'ARPU', '$', 'Average Revenue Per User/Account.'),
    dr('expansion_revenue', 'Expansion Revenue %', '%', 'Revenue growth from upsells/cross-sells.'),
    dr('cac_payback_saas', 'CAC Payback', '#', 'Months to recoup customer acquisition cost. Lower is better.'),
    gr('gross_margin', 'Gross Margin %', '%', '(Revenue - COGS) / Revenue.'),
    gr('support_sla_resolution', 'Support SLA / Time to Resolution', 'days', 'Average days to resolve support tickets. Lower is better.'),
  ],

  // 15) IT Services / Consulting
  'IT Services / Consulting': [
    ns('gross_margin', 'Gross Margin %', '%', '(Revenue - Direct Costs) / Revenue.'),
    ns('utilization_pct', 'Utilization %', '%', 'Billable hours / total available hours.'),
    ns('recurring_revenue_share', 'Recurring Revenue Share %', '%', 'Recurring contracts as % of total revenue.'),
    dr('billable_hours_pct', 'Billable Hours %', '%', 'Hours billed to clients / total worked hours.'),
    dr('realization_rate', 'Realization Rate %', '%', 'Revenue collected / standard billing value.'),
    dr('win_rate', 'Win Rate %', '%', 'Proposals won / proposals submitted.'),
    dr('avg_deal_size', 'Average Deal Size', '$', 'Average contract value of won deals.'),
    dr('project_on_time_delivery', 'Project On-Time Delivery %', '%', 'Projects delivered by deadline.'),
    gr('client_concentration', 'Client Concentration %', '%', 'Revenue from top 3 clients. Lower is better.'),
    gr('sla_breach_rate', 'SLA Breach Rate', '%', 'SLA violations / total SLA commitments. Lower is better.'),
  ],

  // 16) Telecommunications
  'Telecommunications': [
    ns('arpu_telecom', 'ARPU', '$', 'Average Revenue Per User per month.'),
    ns('subscriber_growth', 'Subscriber Growth', '#', 'Net new subscribers this period.'),
    ns('churn_rate_telecom', 'Churn %', '%', 'Subscribers lost / total subscribers. Lower is better.'),
    dr('network_availability', 'Network Availability %', '%', 'Uptime / total time. Target: 99.9%+.'),
    dr('first_call_resolution', 'First Call Resolution %', '%', 'Issues resolved on first contact.'),
    dr('activation_time_telecom', 'Activation Time', '#', 'Minutes/hours to activate new service. Lower is better.'),
    dr('data_usage_per_sub', 'Data Usage per Subscriber', '#', 'Average GB consumed per subscriber per month.'),
    dr('upsell_cross_sell_telecom', 'Upsell/Cross-sell Conversion %', '%', 'Existing customers buying additional services.'),
    gr('complaint_ratio_telecom', 'Complaint Ratio', '%', 'Complaints per 1,000 subscribers. Lower is better.'),
    gr('outage_duration', 'Outage Duration', '#', 'Total unplanned downtime hours this period. Lower is better.'),
  ],

  // 17) Media / Publishing
  'Media / Publishing': [
    ns('audience_revenue', 'Audience Revenue', '$', 'Revenue from subscriptions and direct audience payments.'),
    ns('ad_revenue', 'Ad Revenue', '$', 'Revenue from advertising placements.'),
    ns('subscriber_retention_media', 'Subscriber Retention %', '%', 'Subscribers retained period-over-period.'),
    dr('dau_mau_ratio', 'DAU/MAU Ratio', '%', 'Daily active / monthly active users. Measures stickiness.'),
    dr('time_on_content', 'Time on Content', '#', 'Average minutes per session on content.'),
    dr('completion_rate_content', 'Article/Video Completion Rate %', '%', 'Users finishing content they start.'),
    dr('ad_fill_rate', 'Ad Fill Rate %', '%', 'Ad slots filled / total available ad inventory.'),
    dr('cpm_ecpm', 'CPM / eCPM', '$', 'Revenue per 1,000 ad impressions.'),
    gr('bounce_rate', 'Bounce Rate %', '%', 'Single-page visits / total visits. Lower is better.'),
    gr('content_correction_rate', 'Content Quality / Correction Rate', '%', 'Articles needing corrections. Lower is better.'),
  ],

  // 18) Marketing / Advertising Agency
  'Marketing / Advertising Agency': [
    ns('client_retention_agency', 'Client Retention %', '%', 'Clients retained year-over-year.'),
    ns('gross_margin_agency', 'Gross Margin %', '%', '(Revenue - Direct Project Costs) / Revenue.'),
    ns('monthly_retainer_revenue', 'Monthly Recurring Retainer Revenue', '$', 'Predictable monthly retainer income.'),
    dr('campaign_roi_roas', 'Campaign ROI / ROAS', '%', 'Client campaign return on investment.'),
    dr('on_time_deliverables', 'On-Time Deliverables %', '%', 'Deliverables completed by deadline.'),
    dr('proposal_win_rate', 'Proposal Win Rate %', '%', 'Proposals accepted / proposals sent.'),
    dr('utilization_pct_agency', 'Utilization %', '%', 'Billable hours / total available hours.'),
    dr('client_health_score', 'Client Health Score', '#', 'Composite score of client satisfaction (1-10).'),
    gr('scope_creep_pct', 'Scope Creep %', '%', 'Work exceeding original scope. Lower is better.'),
    gr('team_burnout_overtime', 'Team Burnout / Overtime %', '%', 'Hours over standard workweek. Lower is better.'),
  ],

  // 19) Logistics / Trucking / 3PL
  'Logistics / Trucking / 3PL': [
    ns('revenue_per_truck', 'Revenue per Truck/Route', '$', 'Revenue generated per truck or delivery route.'),
    ns('gross_margin_per_load', 'Gross Margin per Load %', '%', 'Profit margin on each load delivered.'),
    ns('on_time_delivery_logistics', 'On-Time Delivery %', '%', 'Deliveries completed by promised time.'),
    dr('load_fill_rate', 'Load Fill Rate %', '%', 'Truck capacity utilized per trip.'),
    dr('empty_mile_pct', 'Empty Mile %', '%', 'Miles driven without cargo. Lower is better.'),
    dr('cost_per_mile', 'Cost per Mile', '$', 'Total operating cost / miles driven. Lower is better.'),
    dr('quote_to_win', 'Quote-to-Win %', '%', 'Quotes accepted / total quotes given.'),
    dr('warehouse_throughput_log', 'Warehouse Throughput', '#', 'Units processed through warehouse per day.'),
    gr('claims_damage_rate', 'Claims/Damage Rate %', '%', 'Shipments with claims / total shipments. Lower is better.'),
    gr('fuel_cost_variance', 'Fuel Cost Variance %', '%', 'Actual vs budgeted fuel cost. Lower is better.'),
  ],

  // 20) Warehousing / Fulfillment
  'Warehousing / Fulfillment': [
    ns('cost_per_order', 'Cost per Order', '$', 'Total warehouse cost / orders shipped. Lower is better.'),
    ns('perfect_order_rate', 'Perfect Order Rate %', '%', 'Orders shipped complete, on-time, undamaged.'),
    ns('throughput_orders', 'Throughput (Orders/Day)', '#', 'Total orders processed per day.'),
    dr('pick_accuracy', 'Pick Accuracy %', '%', 'Correct items picked / total items picked.'),
    dr('dock_to_stock_time', 'Dock-to-Stock Time', '#', 'Hours from receiving to shelf-ready. Lower is better.'),
    dr('order_cycle_time', 'Order Cycle Time', '#', 'Hours from order receipt to shipment. Lower is better.'),
    dr('labor_productivity_wh', 'Labor Productivity (Lines/Hour)', '#', 'Order lines processed per labor hour.'),
    dr('capacity_utilization_wh', 'Capacity Utilization %', '%', 'Warehouse space used / total space available.'),
    gr('inventory_accuracy', 'Inventory Accuracy %', '%', 'Physical count matching system records.'),
    gr('safety_incident_rate_wh', 'Safety Incident Rate', '#', 'Incidents per 200,000 hours. Lower is better.'),
  ],

  // 21) Transportation (Air/Sea/Rail)
  'Transportation (Air/Sea/Rail)': [
    ns('yield_per_capacity', 'Yield (Revenue per Unit Capacity)', '$', 'Revenue / available capacity units.'),
    ns('on_time_performance', 'On-Time Performance %', '%', 'Departures/arrivals within scheduled window.'),
    ns('load_factor', 'Load Factor %', '%', 'Capacity sold / total capacity available.'),
    dr('turnaround_time', 'Turnaround Time', '#', 'Hours to prepare vehicle for next service. Lower is better.'),
    dr('booking_conversion_transport', 'Booking Conversion %', '%', 'Searches/quotes that become bookings.'),
    dr('ancillary_revenue_pct', 'Ancillary Revenue %', '%', 'Non-core revenue as % of total (upgrades, fees).'),
    dr('asset_utilization', 'Asset Utilization %', '%', 'Time assets are revenue-generating vs idle.'),
    dr('maintenance_compliance', 'Maintenance Compliance %', '%', 'Scheduled maintenance completed on time.'),
    gr('incident_rate_transport', 'Incident Rate', '#', 'Safety incidents per 100,000 operations. Lower is better.'),
    gr('cancellation_delay_ratio', 'Cancellation/Delay Ratio', '%', 'Cancelled + delayed vs total services. Lower is better.'),
  ],

  // 22) Energy & Utilities
  'Energy & Utilities': [
    ns('ebitda_margin_energy', 'EBITDA Margin %', '%', 'EBITDA / Total Revenue.'),
    ns('system_reliability', 'System Reliability (SAIDI/SAIFI)', '#', 'Outage duration/frequency index. Lower is better.'),
    ns('collection_rate_energy', 'Customer Collection Rate', '%', 'Billed amount collected from customers.'),
    dr('plant_availability', 'Plant Availability %', '%', 'Time plant is operational / total time.'),
    dr('transmission_loss', 'Transmission/Distribution Loss %', '%', 'Energy lost during delivery. Lower is better.'),
    dr('demand_forecast_accuracy', 'Demand Forecast Accuracy %', '%', 'Predicted vs actual energy demand.'),
    dr('collection_efficiency', 'Collection Efficiency %', '%', 'Revenue collected / revenue billed.'),
    dr('preventive_maintenance_completion', 'Preventive Maintenance Completion %', '%', 'Scheduled PM tasks completed on time.'),
    gr('safety_trir', 'Safety (TRIR/LTIR)', '#', 'Total recordable incident rate. Lower is better.'),
    gr('environmental_compliance', 'Environmental Compliance Events', '#', 'Environmental violations this period. Lower is better.'),
  ],

  // 23) Oil & Gas / Mining
  'Oil & Gas / Mining': [
    ns('production_volume', 'Production Volume', '#', 'Barrels/tons/units produced this period.'),
    ns('cash_cost_per_unit', 'Cash Cost per Unit', '$', 'All-in cash cost to produce one unit. Lower is better.'),
    ns('reserve_replacement_ratio', 'Reserve Replacement Ratio', '#', 'New reserves added / reserves depleted. >1 is sustainable.'),
    dr('recovery_rate_og', 'Recovery Rate %', '%', 'Resource extracted / total resource in place.'),
    dr('equipment_availability', 'Equipment Availability %', '%', 'Equipment uptime / total scheduled time.'),
    dr('downtime_hours', 'Downtime Hours', '#', 'Unplanned equipment downtime. Lower is better.'),
    dr('grade_quality_recovery', 'Grade/Quality Recovery', '%', 'Quality of extracted resource vs deposit grade.'),
    dr('extraction_cycle_time', 'Drilling/Extraction Cycle Time', 'days', 'Days per well/extraction cycle. Lower is better.'),
    gr('safety_incident_freq_og', 'Safety Incident Frequency', '#', 'Incidents per million hours worked. Lower is better.'),
    gr('environmental_spills', 'Environmental Spills/Violations', '#', 'Spill events or violations. Lower is better.'),
  ],

  // 24) Agriculture / Agribusiness
  'Agriculture / Agribusiness': [
    ns('yield_per_hectare', 'Yield per Hectare', '#', 'Crop output per unit of land.'),
    ns('farm_gate_margin', 'Farm Gate Margin %', '%', '(Sale price - production cost) / sale price.'),
    ns('post_harvest_output', 'Post-Harvest Sellable Output %', '%', 'Usable product after harvest processing.'),
    dr('input_cost_per_hectare', 'Input Cost per Hectare', '$', 'Seeds, fertilizer, chemicals per hectare. Lower is better.'),
    dr('irrigation_efficiency', 'Irrigation Efficiency', '%', 'Water effectively used / total water applied.'),
    dr('harvest_loss', 'Harvest Loss %', '%', 'Product lost during harvest. Lower is better.'),
    dr('forecast_accuracy_ag', 'Forecast Accuracy %', '%', 'Predicted vs actual yield.'),
    dr('contract_fulfillment', 'Contract Fulfillment %', '%', 'Contracts delivered in full and on specification.'),
    gr('disease_pest_incidence', 'Disease/Pest Incidence', '#', 'Outbreaks or infestations this season. Lower is better.'),
    gr('rejection_rate_buyer', 'Rejection Rate at Buyer', '%', 'Product rejected by buyer for quality. Lower is better.'),
  ],

  // 25) Education
  'Education': [
    ns('enrollment_growth', 'Enrollment Growth %', '%', 'Year-over-year student enrollment increase.'),
    ns('retention_completion_rate', 'Retention/Completion Rate %', '%', 'Students completing their program.'),
    ns('learning_outcome_improvement', 'Learning Outcome Improvement', '#', 'Score improvement from pre- to post-assessment.'),
    dr('attendance_engagement', 'Attendance / Engagement Rate %', '%', 'Students actively attending/participating.'),
    dr('instructor_utilization', 'Instructor Utilization %', '%', 'Teaching hours / available hours.'),
    dr('course_completion', 'Course Completion %', '%', 'Students finishing enrolled courses.'),
    dr('admissions_conversion', 'Admissions Conversion %', '%', 'Applicants who enroll / total applicants.'),
    dr('student_support_response', 'Student Support Response Time', 'days', 'Days to respond to student inquiries. Lower is better.'),
    gr('dropout_rate', 'Dropout Rate %', '%', 'Students leaving before completion. Lower is better.'),
    gr('student_complaint_rate', 'Student Complaint Rate', '%', 'Complaints per 100 students. Lower is better.'),
  ],

  // 26) Government / Public Sector
  'Government / Public Sector': [
    ns('service_delivery_time', 'Service Delivery Time', 'days', 'Average days to deliver a service request. Lower is better.'),
    ns('cost_per_service', 'Cost per Service Delivered', '$', 'Total cost / services completed. Lower is better.'),
    ns('citizen_satisfaction', 'Citizen Satisfaction %', '%', 'Citizen survey satisfaction rating.'),
    dr('case_resolution_time', 'Case Resolution Time', 'days', 'Average days to resolve a case. Lower is better.'),
    dr('digital_adoption_gov', 'Digital Adoption %', '%', 'Services accessed via digital channels.'),
    dr('backlog_volume', 'Backlog Volume', '#', 'Unresolved cases or requests in queue. Lower is better.'),
    dr('staff_productivity', 'Staff Productivity', '#', 'Cases resolved per staff member per period.'),
    dr('budget_utilization', 'Budget Utilization %', '%', 'Budget spent / budget allocated.'),
    gr('compliance_audit_findings', 'Compliance/Audit Findings', '#', 'Issues found in audits. Lower is better.'),
    gr('error_rework_rate', 'Error/Rework Rate', '%', 'Cases requiring rework. Lower is better.'),
  ],

  // 27) Nonprofit / NGO
  'Nonprofit / NGO': [
    ns('program_impact', 'Program Impact KPI', '#', 'Mission-specific outcome measure.'),
    ns('beneficiary_reach', 'Beneficiary Reach', '#', 'Number of people served this period.'),
    ns('funding_sustainability', 'Funding Sustainability', '#', 'Months of operating runway available.'),
    dr('donor_retention', 'Donor Retention %', '%', 'Donors who give again the following year.'),
    dr('cost_per_beneficiary', 'Cost per Beneficiary', '$', 'Program cost / beneficiaries served. Lower is better.'),
    dr('program_completion_ngo', 'Program Completion %', '%', 'Programs reaching planned milestones.'),
    dr('grant_win_rate', 'Grant Win Rate %', '%', 'Grants awarded / applications submitted.'),
    dr('volunteer_retention', 'Volunteer Retention %', '%', 'Volunteers returning for additional service.'),
    gr('admin_cost_ratio', 'Admin Cost Ratio %', '%', 'Admin overhead / total spending. Lower is better.'),
    gr('compliance_audit_ngo', 'Compliance/Audit Issues', '#', 'Regulatory findings. Lower is better.'),
  ],

  // 28) Automotive (Dealer/Service)
  'Automotive (Dealer/Service)': [
    ns('gross_profit_per_unit', 'Gross Profit per Unit (GPU)', '$', 'Gross profit on each vehicle sold.'),
    ns('service_dept_revenue', 'Service Department Revenue', '$', 'Total service & parts revenue.'),
    ns('customer_retention_auto', 'Customer Retention %', '%', 'Customers returning for service/purchase.'),
    dr('lead_response_time', 'Lead Response Time', '#', 'Minutes to respond to new inquiry. Lower is better.'),
    dr('test_drive_conversion', 'Test Drive-to-Sale Conversion %', '%', 'Test drives that result in a sale.'),
    dr('finance_penetration', 'Finance Penetration %', '%', 'Buyers using dealership financing.'),
    dr('service_bay_utilization', 'Service Bay Utilization %', '%', 'Bay time used / total available bay time.'),
    dr('parts_gross_margin', 'Parts Gross Margin %', '%', 'Parts profit / parts revenue.'),
    gr('comeback_rate', 'Comeback Rate %', '%', 'Vehicles returning for repeat repair. Lower is better.'),
    gr('csi_score', 'CSI (Customer Satisfaction Index)', '#', 'Manufacturer customer satisfaction score.'),
  ],

  // 29) Travel / Tourism
  'Travel / Tourism': [
    ns('gross_booking_value', 'Gross Booking Value (GBV)', '$', 'Total value of all bookings before commissions.'),
    ns('net_margin_travel', 'Net Margin %', '%', 'Net profit / total revenue.'),
    ns('repeat_traveler', 'Repeat Traveler %', '%', 'Travelers who book again within 12 months.'),
    dr('inquiry_to_booking', 'Inquiry-to-Booking Conversion %', '%', 'Inquiries that become confirmed bookings.'),
    dr('avg_trip_value', 'Average Trip Value', '$', 'Average revenue per trip booked.'),
    dr('upsell_attach_rate', 'Upsell Attach Rate %', '%', 'Bookings with insurance/add-ons attached.'),
    dr('partner_fulfillment_score', 'Partner Fulfillment Score', '#', 'Rating of supplier delivery quality (1-10).'),
    dr('cancellation_rate_travel', 'Cancellation Rate %', '%', 'Bookings cancelled before travel. Lower is better.'),
    gr('refund_turnaround_time', 'Refund Turnaround Time', 'days', 'Days to process refund. Lower is better.'),
    gr('incident_complaint_rate', 'Incident/Complaint Rate', '%', 'Complaints per 100 bookings. Lower is better.'),
  ],

  // 30) Beauty / Wellness / Fitness
  'Beauty / Wellness / Fitness': [
    ns('active_members_clients', 'Active Members/Clients', '#', 'Currently active paying members or clients.'),
    ns('revenue_per_member', 'Revenue per Member', '$', 'Total revenue / active members.'),
    ns('retention_pct_beauty', 'Retention %', '%', 'Members retained month-over-month.'),
    dr('lead_to_visit_conversion', 'Lead-to-Visit Conversion %', '%', 'Leads that attend first appointment/class.'),
    dr('visit_frequency', 'Visit Frequency', '#', 'Average visits per member per month.'),
    dr('addon_attach_rate', 'Add-on Attach Rate %', '%', 'Visits with upsell (product/service add-on).'),
    dr('class_utilization', 'Class/Appointment Utilization %', '%', 'Slots filled / total available slots.'),
    dr('referral_rate', 'Referral Rate %', '%', 'New clients from existing member referrals.'),
    gr('no_show_rate_beauty', 'No-Show Rate %', '%', 'Booked appointments not attended. Lower is better.'),
    gr('churn_rate_beauty', 'Churn %', '%', 'Members cancelling per period. Lower is better.'),
  ],

  // 31) Legal Services
  'Legal Services': [
    ns('revenue_per_lawyer', 'Revenue per Lawyer', '$', 'Total firm revenue / number of lawyers.'),
    ns('matter_profitability', 'Matter Profitability %', '%', 'Profit margin per legal matter.'),
    ns('client_retention_legal', 'Client Retention %', '%', 'Clients returning for additional matters.'),
    dr('billable_utilization_legal', 'Billable Utilization %', '%', 'Billable hours / available hours.'),
    dr('realization_rate_legal', 'Realization Rate %', '%', 'Revenue collected / value of work billed.'),
    dr('collection_rate_legal', 'Collection Rate %', '%', 'Billed amounts actually collected.'),
    dr('matter_cycle_time', 'Matter Cycle Time', 'days', 'Average days to close a matter. Lower is better.'),
    dr('win_success_rate', 'Win/Success Rate', '%', 'Favorable outcomes / total matters resolved.'),
    gr('write_off_pct', 'Write-off %', '%', 'Billed time written off as uncollectable. Lower is better.'),
    gr('compliance_conflict', 'Compliance/Conflict Incidents', '#', 'Ethics or conflict violations. Lower is better.'),
  ],

  // 32) Accounting / Tax / Audit
  'Accounting / Tax / Audit': [
    ns('revenue_growth', 'Revenue Growth %', '%', 'Year-over-year firm revenue growth.'),
    ns('gross_margin', 'Gross Margin %', '%', '(Revenue - Direct Costs) / Revenue.'),
    ns('client_retention_acct', 'Client Retention %', '%', 'Clients continuing service year-over-year.'),
    dr('utilization_pct_acct', 'Utilization %', '%', 'Billable hours / total available hours.'),
    dr('effective_billing_rate', 'Effective Billing Rate', '$', 'Actual revenue per hour collected.'),
    dr('on_time_filing', 'On-Time Filing %', '%', 'Tax returns/filings submitted by deadline.'),
    dr('cross_sell_rate_acct', 'Cross-sell Rate', '%', 'Clients buying additional services.'),
    dr('dso', 'DSO', 'days', 'Days to collect after invoicing. Lower is better.'),
    gr('rework_error_rate_acct', 'Rework/Error Rate', '%', 'Returns needing amendment. Lower is better.'),
    gr('partner_client_concentration', 'Partner/Client Concentration', '%', 'Revenue from top partner\'s clients. Lower is better.'),
  ],

  // 33) HR / Staffing / Recruiting
  'HR / Staffing / Recruiting': [
    ns('placements_per_period', 'Placements per Period', '#', 'Candidates successfully placed this period.'),
    ns('gross_margin_per_placement', 'Gross Margin per Placement', '$', 'Revenue minus direct cost per placement.'),
    ns('fill_rate', 'Fill Rate %', '%', 'Positions filled / positions opened.'),
    dr('time_to_fill', 'Time-to-Fill', 'days', 'Days from job open to candidate start. Lower is better.'),
    dr('submission_to_interview', 'Submission-to-Interview Ratio', '%', 'Submitted candidates who get interviews.'),
    dr('interview_to_offer', 'Interview-to-Offer Ratio', '%', 'Interviews resulting in offers.'),
    dr('offer_acceptance_rate', 'Offer Acceptance Rate', '%', 'Offers accepted / offers extended.'),
    dr('recruiter_productivity', 'Recruiter Productivity', '#', 'Placements per recruiter per period.'),
    gr('early_attrition', 'Early Attrition %', '%', 'Placed candidates leaving within 90 days. Lower is better.'),
    gr('compliance_issues_hr', 'Compliance Issues', '#', 'Labor law or contract compliance issues. Lower is better.'),
  ],

  // 34) Security Services
  'Security Services': [
    ns('contract_renewal', 'Contract Renewal %', '%', 'Contracts renewed at expiry.'),
    ns('gross_margin_security', 'Gross Margin %', '%', '(Revenue - Direct Costs) / Revenue.'),
    ns('incident_reduction', 'Incident Reduction KPI', '%', 'Reduction in security incidents vs baseline.'),
    dr('sla_compliance', 'SLA Compliance %', '%', 'Service level agreements met on time.'),
    dr('mttr', 'Mean Time to Respond (MTTR)', '#', 'Minutes to respond to incidents. Lower is better.'),
    dr('coverage_utilization', 'Coverage Utilization %', '%', 'Guard/agent hours deployed vs available.'),
    dr('false_positive_rate', 'False Positive Rate %', '%', 'False alarms / total alerts. Lower is better.'),
    dr('training_completion', 'Training Completion %', '%', 'Staff completing required training on time.'),
    gr('breach_incident_severity', 'Breach/Incident Severity', '#', 'Severity-weighted incident score. Lower is better.'),
    gr('overtime_pct', 'Overtime %', '%', 'Overtime hours / regular hours. Lower is better.'),
  ],

  // 35) Electronics / Semiconductors
  'Electronics / Semiconductors': [
    ns('revenue_growth_semi', 'Revenue Growth %', '%', 'Year-over-year revenue increase.'),
    ns('gross_margin_semi', 'Gross Margin %', '%', '(Revenue - COGS) / Revenue.'),
    ns('on_time_delivery_semi', 'On-Time Delivery %', '%', 'Orders shipped by committed date.'),
    dr('yield_pct_semi', 'Yield %', '%', 'Good units / total units produced.'),
    dr('cycle_time_semi', 'Cycle Time', 'days', 'Days from wafer start to finished product. Lower is better.'),
    dr('capacity_utilization_semi', 'Capacity Utilization %', '%', 'Fab utilization vs max capacity.'),
    dr('defect_density', 'Defect Density', '#', 'Defects per cm² or per million. Lower is better.'),
    dr('forecast_accuracy_semi', 'Forecast Accuracy %', '%', 'Actual demand vs forecast.'),
    gr('rma_field_failure_rate', 'RMA/Field Failure Rate', '%', 'Returns for defects / units shipped. Lower is better.'),
    gr('inventory_obsolescence', 'Inventory Obsolescence %', '%', 'Obsolete inventory value / total inventory. Lower is better.'),
  ],

  // 36) Aerospace & Defense
  'Aerospace & Defense': [
    ns('program_margin', 'Program Margin %', '%', 'Program profit / program revenue.'),
    ns('on_time_milestone', 'On-Time Milestone Delivery %', '%', 'Program milestones met by scheduled date.'),
    ns('contract_win_rate', 'Contract Win Rate %', '%', 'Contracts won / proposals submitted.'),
    dr('earned_value_cpi_spi', 'Earned Value (CPI/SPI)', '#', 'Cost/Schedule Performance Index. Target: ≥1.0.'),
    dr('engineering_change_rate', 'Engineering Change Rate', '#', 'Design changes per program. Lower is better.'),
    dr('supplier_on_time', 'Supplier On-Time %', '%', 'Supplier deliveries on schedule.'),
    dr('test_pass_rate', 'Test Pass Rate', '%', 'Tests passed on first attempt.'),
    dr('manufacturing_throughput_aero', 'Manufacturing Throughput', '#', 'Units/assemblies completed per period.'),
    gr('nonconformance_rate', 'Nonconformance Rate', '%', 'Quality nonconformances / total inspections. Lower is better.'),
    gr('compliance_findings_aero', 'Compliance Findings', '#', 'Regulatory/audit findings. Lower is better.'),
  ],

  // 37) Wholesale / Distribution
  'Wholesale / Distribution': [
    ns('net_sales_wholesale', 'Net Sales', '$', 'Gross sales minus returns and allowances.'),
    ns('gross_margin_wholesale', 'Gross Margin %', '%', '(Sales - COGS) / Sales.'),
    ns('inventory_turnover', 'Inventory Turnover', '#', 'COGS / average inventory. Higher is better.'),
    dr('fill_rate_wholesale', 'Fill Rate %', '%', 'Line items shipped complete on first shipment.'),
    dr('order_cycle_time_wh', 'Order Cycle Time', 'days', 'Days from order to delivery. Lower is better.'),
    dr('avg_order_size', 'Average Order Size', '$', 'Average dollar value per order.'),
    dr('sales_per_rep', 'Sales per Rep', '$', 'Revenue generated per sales representative.'),
    dr('backorder_rate', 'Backorder Rate', '%', 'Orders backordered / total orders. Lower is better.'),
    gr('dead_stock_pct', 'Dead Stock %', '%', 'Inventory with zero movement for 12+ months. Lower is better.'),
    gr('dso_wholesale', 'DSO', 'days', 'Days to collect receivables. Lower is better.'),
  ],

  // 38) Import / Export / Trade
  'Import / Export / Trade': [
    ns('gross_margin_per_shipment', 'Gross Margin per Shipment', '$', 'Profit per shipment after direct costs.'),
    ns('on_time_clearance', 'On-Time Clearance %', '%', 'Shipments cleared customs on schedule.'),
    ns('revenue_growth_trade', 'Revenue Growth %', '%', 'Year-over-year trade revenue growth.'),
    dr('documentation_accuracy', 'Documentation Accuracy %', '%', 'Shipment docs correct on first submission.'),
    dr('customs_delay_rate', 'Customs Delay Rate', '%', 'Shipments delayed at customs. Lower is better.'),
    dr('freight_cost_per_unit', 'Freight Cost per Unit', '$', 'Shipping cost per unit transported. Lower is better.'),
    dr('supplier_otif', 'Supplier OTIF %', '%', 'Supplier deliveries On Time In Full.'),
    dr('quote_to_booking', 'Quote-to-Booking %', '%', 'Quotes accepted by clients.'),
    gr('compliance_penalties', 'Compliance Penalties', '$', 'Fines or penalties incurred. Lower is better.'),
    gr('claims_damage_rate_trade', 'Claims/Damage Rate %', '%', 'Damaged shipments / total shipments. Lower is better.'),
  ],

  // 39) Event Management
  'Event Management': [
    ns('event_profit_margin', 'Event Profit Margin %', '%', 'Net profit / total event revenue.'),
    ns('client_retention_events', 'Client Retention %', '%', 'Clients rebooking for future events.'),
    ns('attendee_satisfaction', 'Attendee Satisfaction %', '%', 'Post-event satisfaction survey score.'),
    dr('seat_fill_rate', 'Ticket/Seat Fill Rate %', '%', 'Seats sold / total capacity.'),
    dr('sponsor_revenue', 'Sponsor Revenue', '$', 'Revenue from event sponsors.'),
    dr('cost_per_attendee', 'Cost per Attendee', '$', 'Total event cost / attendees. Lower is better.'),
    dr('on_time_milestones_events', 'On-Time Execution Milestones %', '%', 'Planning milestones hit on schedule.'),
    dr('proposal_to_signed', 'Proposal-to-Signed Conversion %', '%', 'Event proposals that become contracts.'),
    gr('cancellation_rate_events', 'Cancellation Rate %', '%', 'Events cancelled / total booked. Lower is better.'),
    gr('incident_rate_events', 'Incident Rate', '#', 'Safety/operational incidents per event. Lower is better.'),
  ],

  // 40) Social Commerce / Creator
  'Social Commerce / Creator': [
    ns('gmv', 'GMV (Gross Merchandise Value)', '$', 'Total value of goods sold through social channels.'),
    ns('net_profit_margin_social', 'Net Profit Margin %', '%', 'Net profit / total revenue.'),
    ns('repeat_buyer', 'Repeat Buyer %', '%', 'Buyers purchasing again within 90 days.'),
    dr('content_to_checkout', 'Content-to-Checkout Conversion %', '%', 'Content views that lead to purchase.'),
    dr('live_session_conversion', 'Live Session Conversion %', '%', 'Live stream viewers who purchase.'),
    dr('cac_social', 'CAC', '$', 'Customer acquisition cost from social channels.'),
    dr('aov_social', 'AOV', '$', 'Average order value from social sales.'),
    dr('repeat_purchase_cycle', 'Repeat Purchase Cycle', 'days', 'Average days between repeat purchases. Lower is better.'),
    gr('return_rate_social', 'Return Rate %', '%', 'Products returned / products sold. Lower is better.'),
    gr('platform_policy_violations', 'Platform Policy Violations', '#', 'Content or selling policy strikes. Lower is better.'),
  ],
};

// ============================================================================
// KPI Generation
// ============================================================================

/**
 * Generate growth targets for a client based on their industry.
 * Creates targets from industry pack (10 KPIs) + universal (18 KPIs).
 * Skips any KPIs the client already has (matched by kpiId).
 * Returns the array of newly created targets (for UI feedback).
 */
export function generateKpisForClient(clientId: string, industry: string): Record<string, any>[] {
  const industryPack = getIndustryPack(industry) || [];
  const allKpis = [
    ...industryPack.map(k => ({ ...k, source: 'industry' })),
    ...UNIVERSAL_KPIS.map(k => ({ ...k, source: 'universal' })),
  ];

  const existing = safeGetItem('threeseas_bi_growth_targets', []);
  const clientExisting = existing.filter(t => t.clientId === clientId);
  const existingKpiIds = new Set(clientExisting.map(t => t.kpiId).filter(Boolean));

  const now = new Date().toISOString();
  const newTargets = allKpis
    .filter(kpi => !existingKpiIds.has(kpi.id))
    .map(kpi => ({
      id: generateId(),
      clientId,
      kpiId: kpi.id,
      name: kpi.label,
      unit: kpi.unit,
      tier: kpi.tier,
      source: kpi.source,
      baseline: 0,
      current: 0,
      target: 0,
      status: 'active',
      createdAt: now,
    }));

  if (newTargets.length > 0) {
    safeSetItem('threeseas_bi_growth_targets', JSON.stringify([...existing, ...newTargets]));
  }
  return newTargets;
}

// ============================================================================
// Lookup Helpers
// ============================================================================

/** Resolve industry name through alias map */
export function resolveIndustry(industry: string | null | undefined): string | null {
  if (!industry) return null;
  return INDUSTRY_ALIAS[industry] || industry;
}

/** Get industry KPI pack (10 KPIs) or null for unknown/Other */
export function getIndustryPack(industry: string | null | undefined): KpiDefinition[] | null {
  const resolved = resolveIndustry(industry);
  if (!resolved || resolved === 'Other') return null;
  return INDUSTRY_KPI_PACKS[resolved] || null;
}

/** Get the full KPI list for a client's industry: industry pack + universal + custom */
export function getAllKpisForClient(industry: string | null | undefined): KpiDefinition[] {
  const pack = getIndustryPack(industry);
  const industryKpis = pack || [];
  return [...industryKpis, ...UNIVERSAL_KPIS, ...CUSTOM_KPIS];
}

/** Get just the industry-specific KPIs grouped by tier */
export function getIndustryKpisByTier(industry: string | null | undefined): { north_star: KpiDefinition[]; driver: KpiDefinition[]; guardrail: KpiDefinition[] } {
  const pack = getIndustryPack(industry);
  if (!pack) return { north_star: [], driver: [], guardrail: [] };
  return {
    north_star: pack.filter(k => k.tier === 'north_star'),
    driver: pack.filter(k => k.tier === 'driver'),
    guardrail: pack.filter(k => k.tier === 'guardrail'),
  };
}

/** Get universal KPIs grouped by sub-category */
export function getUniversalByCategory(): Record<string, KpiDefinition[]> {
  const groups: Record<string, KpiDefinition[]> = {};
  UNIVERSAL_KPIS.forEach(k => {
    const cat = k.category || 'Other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(k);
  });
  return groups;
}
