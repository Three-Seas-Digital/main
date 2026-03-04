# Revenue Growth Audit & Strategy Playbook

> **How to use this doc**
> - Run the audit first (Sections 1–13).
> - Score each area (1–5 maturity).
> - Build a strategy backlog.
> - Prioritize using the Impact–Feasibility–Speed–Risk model.
> - Execute in 30/60/90-day waves.

---

## Hoverable Metric Legend (copy pattern)

Use this pattern for hover text:

```html
<span title="Brief explanation here">Metric Name</span>
```

Example:

| Metric |
|---|
| <span title="Revenue generated per active customer in a given period">ARPU</span> |

---

## 1) Core Revenue Audit

| Metric | Why it matters | Formula / Check |
|---|---|---|
| <span title="Total money earned from sales in a defined period">Total Revenue</span> | Primary top-line KPI | Sum of recognized sales |
| <span title="Percent increase or decrease in revenue across periods">Revenue Growth Rate</span> | Shows momentum | (Current - Prior) / Prior |
| <span title="Revenue split by product, segment, region, channel, or rep">Revenue by Segment</span> | Finds hidden winners/losers | Group revenue by key dimension |
| <span title="Average spend per order or transaction">Average Order Value (AOV)</span> | Indicates basket/deal expansion | Revenue / Number of orders |
| <span title="Revenue generated per active customer">ARPU</span> | Monetization efficiency | Revenue / Active customers |
| <span title="Share of revenue from existing customers">Existing Customer Revenue Mix</span> | Health of retention engine | Existing-customer revenue / Total revenue |
| <span title="Share of total revenue from top customers">Revenue Concentration</span> | Dependency risk indicator | Top N customer revenue / Total revenue |

---

## 2) Funnel & Conversion Audit

### B2C / eCommerce

| Metric | Why it matters | Formula / Check |
|---|---|---|
| <span title="Percent of leads/visitors who become paying customers">Lead-to-Customer Conversion</span> | Core funnel efficiency | Customers / Leads |
| <span title="Percent of carts that do not become orders">Cart Abandonment Rate</span> | Reveals checkout friction | Abandoned carts / Created carts |
| <span title="Percent of initiated checkouts that finish">Checkout Completion Rate</span> | Purchase path effectiveness | Completed checkouts / Initiated checkouts |
| <span title="Percent of orders/items returned or refunded">Return/Refund Rate</span> | Revenue quality + CX signal | Returns or refunds / Orders |
| <span title="Percent of orders with add-ons or bundles">Attach Rate</span> | Upsell/cross-sell strength | Orders with add-on / Total orders |

### B2B Sales Funnel

| Metric | Why it matters | Formula / Check |
|---|---|---|
| <span title="Percent of MQLs that become SQLs">MQL→SQL Conversion</span> | Lead quality and handoff quality | SQL / MQL |
| <span title="Percent of SQLs that become opportunities">SQL→Opportunity Conversion</span> | Pipeline creation efficiency | Opportunities / SQL |
| <span title="Percent of opportunities closed-won">Opportunity Win Rate</span> | Sales effectiveness | Won opportunities / Total opportunities |
| <span title="Average revenue per closed-won deal">Average Deal Size</span> | Revenue leverage per win | Closed-won revenue / # won deals |
| <span title="Average number of days from opportunity creation to close">Sales Cycle Length</span> | Velocity and forecast reliability | Avg(Close date - Created date) |
| <span title="Qualified pipeline relative to quota/target">Pipeline Coverage</span> | Likelihood of hitting target | Qualified pipeline / Quota |

---

## 3) Pricing & Margin Audit

| Metric | Why it matters | Formula / Check |
|---|---|---|
| <span title="Percent of revenue left after direct costs">Gross Margin %</span> | Profitability quality | (Revenue - COGS) / Revenue |
| <span title="Margin left after variable costs">Contribution Margin</span> | Unit economics clarity | (Revenue - Variable costs) / Revenue |
| <span title="Average reduction from list price">Discount Rate</span> | Detects pricing leakage | (List price - Net price) / List price |
| <span title="Actual achieved price versus target/list">Price Realization</span> | Pricing power measure | Net price / List price |
| <span title="Demand sensitivity to price changes">Price Elasticity</span> | Informs safe price moves | %ΔQuantity / %ΔPrice |
| <span title="Margin differences across products/channels/customers">Margin Mix</span> | Shows where profit is made | Segment-level margin analysis |

---

## 4) Customer Economics Audit

| Metric | Why it matters | Formula / Check |
|---|---|---|
| <span title="Average cost to acquire one new customer">CAC</span> | Growth efficiency | Sales + marketing spend / New customers |
| <span title="Total expected gross profit from a customer over lifetime">LTV</span> | Long-term value creation | ARPU × Gross margin × Avg lifetime |
| <span title="Ratio of lifetime value to acquisition cost">LTV:CAC</span> | Sustainability check | LTV / CAC |
| <span title="Months needed to recover CAC from gross profit">CAC Payback</span> | Cash efficiency | CAC / Monthly gross profit per customer |
| <span title="Percent of customers retained over a period">Retention Rate</span> | Compounding engine | Retained customers / Starting customers |
| <span title="Percent of customers/revenue lost over a period">Churn Rate</span> | Revenue leakage signal | Lost customers or rev / Starting base |
| <span title="Percent of customers who purchase again">Repeat Purchase Rate</span> | Loyalty and habit indicator | Repeat customers / Total customers |
| <span title="Recurring revenue retained from existing customers including expansion and churn">NRR</span> | Best recurring growth KPI | (Start rev + Expansion - Churn - Contraction) / Start rev |

---

## 5) Marketing & Channel Audit

| Metric | Why it matters | Formula / Check |
|---|---|---|
| <span title="Revenue attributed to ads per dollar of ad spend">ROAS</span> | Paid media performance | Attributed revenue / Ad spend |
| <span title="Overall revenue generated per dollar of marketing spend">MER</span> | Blended marketing efficiency | Total revenue / Marketing spend |
| <span title="Average cost to generate one lead">CPL</span> | Early-funnel efficiency | Campaign spend / Leads |
| <span title="Average cost to acquire one customer">CPA</span> | Channel acquisition quality | Campaign spend / New customers |
| <span title="Percent of traffic/leads from a channel that convert">Channel Conversion</span> | Channel quality and intent | Sales / Channel traffic or leads |
| <span title="Revenue and contribution margin by channel">Channel Profitability</span> | Avoids unprofitable growth | Revenue and CM by channel |

---

## 6) Operations & Fulfillment Audit

| Metric | Why it matters | Formula / Check |
|---|---|---|
| <span title="Percent of demand not fulfilled due to stock/capacity limits">Stockout Rate</span> | Direct lost-sales indicator | Stockout events / Demand events |
| <span title="Percent of orders delivered by promised date">On-Time Delivery %</span> | Retention and trust driver | On-time orders / Total orders |
| <span title="Average time from order placement to delivery">Order Cycle Time</span> | Throughput + customer experience | Delivery date - Order date |
| <span title="Percent of orders completed correctly first pass">First-Time-Right %</span> | Quality and cost control | Correct first-pass orders / Total orders |
| <span title="Percent of orders needing correction, return, or remake">Rework/Return Rate</span> | Hidden cost and churn risk | Rework or returned orders / Total orders |

---

## 7) Cash Flow & Working Capital Audit

| Metric | Why it matters | Formula / Check |
|---|---|---|
| <span title="Average days to collect receivables">DSO</span> | Collection performance | (Accounts receivable / Credit sales) × Days |
| <span title="Average days to pay suppliers">DPO</span> | Payables strategy | (Accounts payable / COGS) × Days |
| <span title="Average days inventory is held before sale">DIO</span> | Inventory efficiency | (Inventory / COGS) × Days |
| <span title="Days required to convert cash outflows into inflows">Cash Conversion Cycle</span> | Liquidity reality | DSO + DIO - DPO |
| <span title="Cash generated after capital expenditures">Free Cash Flow</span> | Survival and reinvestment ability | Operating cash flow - Capex |

---

## 8) Contract & Revenue Leakage Audit

| Metric | Why it matters | Formula / Check |
|---|---|---|
| <span title="Delivered work/value not yet invoiced">Unbilled Revenue</span> | Immediate leakage opportunity | Delivered value - Invoiced value |
| <span title="Percent of billable work actually billed">Billing Realization</span> | Revenue discipline | Billed amount / Billable amount |
| <span title="Revenue lost to credits, penalties, concessions">Credit/Penalty Leakage</span> | Margin protection | Credits + penalties / Gross billings |
| <span title="Percent of planned renewal price uplift actually captured">Renewal Uplift Capture</span> | Recurring growth quality | Actual uplift / Planned uplift |

---

## 9) Data & BI Audit

| Metric | Why it matters | Formula / Check |
|---|---|---|
| <span title="Percent of required fields/events that are populated">Data Completeness</span> | Reporting reliability | Completed required fields / Total required fields |
| <span title="Percent of records matching source truth without errors">Data Accuracy</span> | Trust in decisions | Correct records / Audited sample |
| <span title="Time delay from business event to dashboard availability">Report Latency</span> | Decision speed | Dashboard refresh lag |
| <span title="Percent of core KPIs with approved single definitions">KPI Standardization</span> | Cross-team alignment | Standardized KPIs / Core KPIs |

---

## 10) People & Incentives Audit

| Metric | Why it matters | Formula / Check |
|---|---|---|
| <span title="Revenue generated per full-time employee">Revenue per FTE</span> | Productivity benchmark | Revenue / FTE |
| <span title="Gross profit generated per full-time employee">Gross Profit per FTE</span> | Profit productivity | Gross profit / FTE |
| <span title="Percent of quota achieved by seller/team">Quota Attainment</span> | Sales execution health | Actual / Target |
| <span title="Time for new hires to reach expected output">Ramp Time</span> | Hiring + enablement quality | Avg months to target productivity |

---

## 11) Audit Scoring (1–5 Maturity)

- **1 = Ad hoc:** No consistent measurement  
- **2 = Basic:** Partial tracking, inconsistent definitions  
- **3 = Managed:** Regular tracking, periodic actions  
- **4 = Optimized:** Clear ownership, experiments, continuous improvement  
- **5 = Leading:** Predictive, automated, tightly governed

| Audit Domain | Score (1–5) | Key Gaps | Est. Revenue Impact | Owner | Due Date |
|---|---:|---|---:|---|---|
| Pricing & Discount | 2 | No approval matrix, heavy exceptions | High | Sales Ops | 30 days |
| Retention/Cohorts | 3 | Churn reasons not standardized | High | CS Lead | 45 days |

---

## 12) Strategy Selection Framework (How to pick what to do)

### 12.1 Build a Strategy Backlog

Convert each major gap into a strategy card.

| Field | Description |
|---|---|
| Strategy Name | Action-oriented title |
| Problem Statement | KPI underperforming and where |
| Hypothesis | Why this action should improve KPI |
| KPI Target | Baseline → target + date |
| Scope | Segment/channel/product included |
| Dependencies | Teams, systems, data required |
| Risks | What can fail / downside |
| Cost | Budget + team capacity |
| Expected Impact | Revenue, margin, and/or cash effect |

### 12.2 Prioritize with IFSR

Score each candidate 1–5:

- **I = Impact** (upside potential)
- **F = Feasibility** (ease of execution)
- **S = Speed** (time to measurable effect)
- **R = Risk** (higher score = safer/lower risk)

```text
Priority Score = (0.40 × I) + (0.25 × F) + (0.20 × S) + (0.15 × R)
```

| Strategy | I | F | S | R | Weighted Score | Decision |
|---|---:|---:|---:|---:|---:|---|
| Pricing guardrails | 5 | 4 | 4 | 4 | 4.45 | Do now |
| Onboarding retention fix | 4 | 4 | 3 | 4 | 3.85 | Do now |
| New paid channel launch | 4 | 2 | 2 | 2 | 2.90 | Later |

### 12.3 Portfolio mix (recommended)

- **Quick Wins (0–30 days):** 50% effort  
- **Core Improvements (31–90 days):** 35% effort  
- **Strategic Bets (90+ days):** 15% effort

### 12.4 Decision Rules

1. No strategy without baseline + target KPI  
2. No strategy without owner + due date  
3. Prefer actions that improve both revenue and margin  
4. Stop initiatives missing leading indicators for 2 cycles  
5. Protect cash: deprioritize long-payback bets unless strategic

---

## 13) 30/60/90-Day Execution Cadence

### Days 0–30
- Complete audit + maturity scoring
- Finalize KPI dictionary
- Launch top 3 quick wins
- Start weekly revenue review

### Days 31–60
- Run controlled experiments
- Implement pricing/funnel fixes
- Launch retention interventions
- Track leading indicators

### Days 61–90
- Scale winners, stop low-ROI actions
- Re-forecast impact
- Lock next-quarter strategy plan
