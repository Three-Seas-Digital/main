# Three Seas Digital — Complete Business Intelligence & CRM Reference

> **Full-stack agency management platform: React 18 + Express.js + MySQL 8.0+**
>
> Last updated: 2026-03-01

---

## Table of Contents

1. [CRM System](#1-crm-system)
2. [Business Analysis](#2-business-analysis)
3. [Metrics & KPIs](#3-metrics--kpis)
4. [Business Intelligence](#4-business-intelligence)
5. [Competition & Competitive Landscape](#5-competition--competitive-landscape)
6. [Market Research & Consumer Research](#6-market-research--consumer-research)
7. [Marketing & Ad Spend](#7-marketing--ad-spend)
8. [Forecasting & Financial Modeling](#8-forecasting--financial-modeling)
9. [Risk Assessment](#9-risk-assessment)
10. [Customer Journey Mapping](#10-customer-journey-mapping)
11. [Market Strategy & Pricing Strategy](#11-market-strategy--pricing-strategy)
12. [SWOT, Porter's Five Forces & Strategic Frameworks](#12-swot-porters-five-forces--strategic-frameworks)
13. [Industry Trends](#13-industry-trends)
14. [Market Sizing & TAM Analysis](#14-market-sizing--tam-analysis)
15. [Formula Reference](#15-formula-reference)
16. [Database Tables Reference](#16-database-tables-reference)
17. [API Route Inventory](#17-api-route-inventory)

---

## 1. CRM System

### 1.1 Client Management

**Component:** `src/components/admin/ClientsTab.jsx`
**Context:** `src/context/AppContext.jsx`
**API:** `server/routes/clients.js`
**Tables:** `clients`, `client_notes`, `client_tags`, `client_documents`

#### Client Data Model

| Field | Type | Description |
|-------|------|-------------|
| id | VARCHAR(36) | UUID primary key |
| name | VARCHAR(255) | Client name |
| email | VARCHAR(255) | Unique email |
| phone | VARCHAR(50) | Contact phone |
| business_name | VARCHAR(255) | Business entity name |
| business_address | TEXT | Physical address |
| service | VARCHAR(255) | Service subscribed to |
| tier | ENUM | `free` / `basic` / `premium` / `enterprise` |
| status | ENUM | `active` / `pending` / `archived` / `rejected` |
| source | ENUM | `manual` / `appointment` / `signup` / `prospect` / `pipeline` |
| source_prospect_id | VARCHAR(36) | FK if converted from pipeline |
| source_appointment_id | VARCHAR(36) | FK if converted from appointment |
| date_of_birth | DATE | Optional DOB |
| approved_at | TIMESTAMP | When approved |
| approved_by | VARCHAR(255) | Who approved |
| archived_at | TIMESTAMP | When archived |

#### Client Lifecycle

```
                   ┌─────────────┐
                   │   SIGNUP /   │
                   │   MANUAL     │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
        ┌─────────│   PENDING    │─────────┐
        │         └─────────────┘         │
        ▼                                 ▼
 ┌─────────────┐                   ┌─────────────┐
 │  APPROVED   │                   │  REJECTED   │
 │  (ACTIVE)   │                   └─────────────┘
 └──────┬──────┘
        │
        ▼
 ┌─────────────┐       ┌─────────────┐
 │  ARCHIVED   │──────→│  RESTORED   │──→ ACTIVE
 └─────────────┘       └─────────────┘
```

#### Client Operations

| Operation | API Route | Access |
|-----------|-----------|--------|
| List all | `GET /api/clients` | owner, admin, manager, sales, accountant, it |
| Get one | `GET /api/clients/:id` | Includes notes, tags, documents |
| Create | `POST /api/clients` | owner, admin, manager |
| Update | `PUT /api/clients/:id` | owner, admin, manager |
| Delete | `DELETE /api/clients/:id` | owner, admin (hard delete) |
| Approve | `PUT /api/clients/:id/approve` | owner, admin, manager |
| Reject | `PUT /api/clients/:id/reject` | owner, admin, manager |
| Archive | `PUT /api/clients/:id/archive` | Sets `archived_at`, `archived_by` |
| Restore | `PUT /api/clients/:id/restore` | Clears archive, sets `restored_at` |
| Add note | `POST /api/clients/:id/notes` | Any authenticated |
| Add tag | `POST /api/clients/:id/tags` | INSERT IGNORE deduplication |
| Upload doc | `POST /api/clients/:id/documents` | Multer single file |

#### Client-Related Sub-Tables

| Table | Relationship | Key Fields |
|-------|-------------|------------|
| `client_notes` | 1:many | text, author, created_at |
| `client_tags` | 1:many | tag (UNIQUE per client) |
| `client_documents` | 1:many | name, type, file_path, file_size, mime_type |
| `invoices` | 1:many | amount, status, due_date, recurring, frequency |
| `payments` | 1:many | amount, method, status |
| `projects` | 1:many | title, status, progress (0-100) |

---

### 1.2 Sales Pipeline (Prospects)

**Component:** `src/components/admin/PipelineTab.jsx` (Kanban view)
**Context:** `src/context/SalesContext.jsx`
**API:** `server/routes/prospects.js`
**Tables:** `prospects`, `prospect_notes`, `prospect_documents`

#### Pipeline Stages

```
  ┌──────────┐   ┌──────────┐   ┌───────────┐   ┌─────────────┐   ┌──────────┐
  │ INQUIRY  │──→│  BOOKED  │──→│ CONFIRMED │──→│ NEGOTIATING │──→│  CLOSED  │
  │  (gray)  │   │  (blue)  │   │  (green)  │   │   (amber)   │   │  (teal)  │
  └──────────┘   └──────────┘   └───────────┘   └─────────────┘   └──────────┘
                                                                       │
                                                            ┌──────────┴──────────┐
                                                            ▼                     ▼
                                                       ┌─────────┐          ┌──────────┐
                                                       │   WON   │          │   LOST   │
                                                       └────┬────┘          └──────────┘
                                                            │            Loss Reasons:
                                                            ▼            budget, timing,
                                                    Convert to Client    competitor,
                                                                         no-response,
                                                                         scope, other
```

#### Prospect Data Model

| Field | Type | Description |
|-------|------|-------------|
| name | VARCHAR(255) | Contact/business name |
| email | VARCHAR(255) | Contact email |
| phone | VARCHAR(50) | Phone number |
| service | VARCHAR(255) | Service of interest |
| stage | ENUM | inquiry/new/booked/confirmed/negotiating/closed/won/lost |
| deal_value | DECIMAL(10,2) | Estimated deal value |
| probability | INT | Win probability 0-100% |
| expected_close_date | DATE | Target close date |
| outcome | ENUM | won / lost (nullable) |
| loss_reason | ENUM | budget/timing/competitor/no-response/scope/other |
| notes | TEXT | Free text notes |
| revisit_date | DATE | For lost deals - when to revisit |

#### Conversion to Client

`POST /api/prospects/:id/convert-to-client`

- Creates new client with `source = 'pipeline'`
- Transfers all prospect notes (prefixed with `[Pipeline]`)
- Transfers all prospect documents
- Sets prospect `stage = 'won'`, `outcome = 'won'`
- Links via `source_prospect_id` on the client

#### Proposal Builder

Available services for proposals:
- web-design, seo, content, social, branding, analytics, ppc, email-marketing, maintenance, consulting

Proposal fields: `services[]`, `customPrice`, `discount`, `discountType` (percent/fixed), `timeline`, `paymentTerms` (default: net15)

---

### 1.3 Lead Management

**Component:** `src/components/admin/LeadsTab.jsx`
**API:** `server/routes/leads.js`
**Tables:** `leads`, `lead_notes`

#### Lead Sources

| Source | Description |
|--------|-------------|
| Manual | Hand-entered leads |
| OSM Search | Auto-discovered via OpenStreetMap Overpass API |
| Import | Bulk imported |

#### Lead Status Flow

```
  NEW ──→ CONTACTED ──→ FOLLOW-UP ──→ INTERESTED ──→ CONVERTED
 (blue)    (amber)      (purple)       (green)        (cyan)
                                           │
                                           ▼
                                    NOT INTERESTED
                                        (red)
```

#### OSM Business Discovery

The LeadsTab searches for businesses near a location using Overpass API:
- Categories: retail, restaurant, office, services, medical, other
- Configurable radius (default: 5km)
- Auto-saves discovered businesses to `business_database`
- Can promote leads directly to Pipeline or create Appointments

---

### 1.4 Appointments & Follow-Ups

**Component:** `src/components/admin/AppointmentScheduler.jsx`
**API:** `server/routes/appointments.js`
**Tables:** `appointments`, `follow_up_notes` (view alias: `appointment_notes`)

#### Appointment Fields

| Field | Type | Description |
|-------|------|-------------|
| name | VARCHAR(255) | Contact name |
| email | VARCHAR(255) | Email |
| date / time | DATE + VARCHAR(20) | Scheduled date/time |
| type | VARCHAR(100) | Default: consultation |
| status | ENUM | pending/confirmed/cancelled/completed |
| assigned_to | VARCHAR(36) | FK to users |
| follow_up_priority | ENUM | low/medium/high |
| follow_up_date | DATE | Next follow-up date |
| converted_to_client | VARCHAR(36) | Client ID if converted |

#### Dashboard Visibility

DashboardHomeTab (`DashboardHomeTab.jsx`) surfaces:
- Today's appointments (pending + confirmed)
- Follow-ups due today
- Overdue follow-ups
- Pending client registrations
- This week vs last week revenue comparison

---

### 1.5 Project Management

**Component:** `src/components/admin/ProjectBoard.jsx` (Kanban)
**API:** `server/routes/projects.js`
**Tables:** `projects`, `project_developers`, `project_tasks`, `project_milestones`, `time_entries`

#### Project Status Flow

```
  PLANNING ──→ IN-PROGRESS ──→ REVIEW ──→ COMPLETED ──→ ARCHIVED
```

#### Project Structure

```
Project
 ├── Developers (users assigned via junction table)
 ├── Tasks
 │    ├── title, description
 │    ├── status: todo / in-progress / review / done
 │    ├── priority: low / normal / high / urgent
 │    ├── assignee, due_date
 │    └── sort_order
 ├── Milestones
 │    ├── title, description
 │    ├── due_date
 │    └── completed (boolean)
 └── Time Entries
      ├── hours (DECIMAL), date
      ├── billable (boolean), billed (boolean)
      ├── user_id, user_name
      └── description
```

---

## 2. Business Analysis

### 2.1 Client Analytics Dashboard

**Component:** `src/components/admin/BusinessIntelligence/ClientAnalytics.jsx` (66.9KB)

Consolidated BI view for any client. Supports **compare mode** for side-by-side analysis of two clients.

#### Sections

| Section | Content |
|---------|---------|
| Audit Overview | RadarChart of 5 category scores, overall score gauge |
| Score History | Trend chart across audit versions |
| Category Breakdown | Bar charts per category |
| Recommendations | Status distribution (proposed/accepted/in_progress/completed/declined) |
| Interventions | ROI visualization, effectiveness ratings |
| Financials | Revenue, expenses, profit trends |
| Growth Targets | Progress toward KPI targets |

#### Quick Filters
- All, Has Audit, Needs Audit, Has Financials

#### Date Presets
- All Time, Last 3 Months, Last 6 Months, Last Year, Custom Range

#### Category Mapping (for RadarChart)

| Display Name | Subcriteria IDs |
|-------------|-----------------|
| SEO | sc-meta, sc-headings, sc-sitemap, sc-speed |
| Design/UX | sc-layout, sc-mobile, sc-navigation, sc-branding |
| Content | sc-quality, sc-ctas, sc-media, sc-blog |
| Technical | sc-ssl, sc-hosting, sc-performance, sc-analytics |
| Social | sc-social, sc-reviews, sc-directories, sc-email |

---

### 2.2 Analytics Dashboard (Agency-Level)

**Component:** `src/components/admin/AnalyticsTab.jsx` (60.8KB)

#### Global Filter Bar
- Year, month, date range (start/end), service, tier, payment method

#### KPIs Calculated

| KPI | Formula |
|-----|---------|
| Revenue Growth | `((currentPeriod - priorPeriod) / priorPeriod) * 100` |
| Appointment Conversion Rate | `convertedAppointments / totalAppointments * 100` |
| Average Client Value | `totalRevenue / clientCount` |
| Monthly Revenue | Area chart by month |
| Cumulative Client Growth | Line chart |
| Revenue by Service | PieChart |
| Tier Distribution | BarChart |

#### Conversion Funnel

```
  Booked Appointments ──→ Confirmed ──→ Converted to Client
       (100%)               (X%)            (Y%)
```

---

### 2.3 Execution Tracker (90-Day Strategic Plans)

**Component:** `src/components/admin/BusinessIntelligence/ExecutionTracker.jsx`
**Storage:** `threeseas_execution_plans` (localStorage)

#### 3-Wave Execution Framework

| Wave | Days | Effort | Theme | Default Tasks |
|------|------|--------|-------|---------------|
| Wave 1 | 0-30 | 50% | Quick Wins | Complete audit + maturity scoring, Finalize KPI dictionary, Launch top 3 quick wins, Start weekly revenue review |
| Wave 2 | 31-60 | 35% | Core Improvements | Run controlled experiments, Implement pricing/funnel fixes, Launch retention interventions, Track leading indicators |
| Wave 3 | 61-90 | 15% | Strategic Bets | Scale winners stop low-ROI actions, Re-forecast impact, Lock next-quarter strategy plan |

#### 5 Decision Rules (Governance Guardrails)

1. No strategy without baseline + target KPI
2. No strategy without owner + due date
3. Prefer actions that improve both revenue and margin
4. Stop initiatives missing leading indicators for 2 cycles
5. Protect cash: deprioritize long-payback bets unless strategic

#### Plan Item Fields

| Field | Description |
|-------|-------------|
| title | Action item name |
| status | pending / in_progress / completed / blocked |
| owner | Assigned person |
| baselineKPI | Starting metric value |
| targetKPI | Goal metric value |
| actualKPI | Current achieved value |
| linkedAuditSection | Connected audit category |
| linkedRecommendation | Connected recommendation |
| notes | Free text |

#### Review Log
- Timestamped notes for periodic plan reviews
- Tracks who reviewed and what was discussed

---

## 3. Metrics & KPIs

### 3.1 KPI Dashboard

**Component:** `src/components/admin/BusinessIntelligence/KPIDashboard.jsx`
**Registry:** `src/components/admin/BusinessIntelligence/kpiRegistry.js` (59.5KB)
**Calculations:** `src/components/admin/BusinessIntelligence/auditMetrics.js`

#### KPI Tier System

| Tier | Color | Chart | Purpose |
|------|-------|-------|---------|
| North Star | Purple | Area | Business outcome metrics that define success |
| Driver | Blue | Bar | Operational levers you control |
| Guardrail | Amber | Line | Risk & protection thresholds |
| Universal | Gray | Line | Cross-industry fundamentals |
| Custom | Green | Line | User-defined metrics |

#### KPI Status Logic

| Status | Condition | Color |
|--------|-----------|-------|
| On Track | ratio >= 1.0 (current/target) | Green |
| Warning | ratio >= 0.9 | Amber |
| Behind | ratio < 0.9 | Red |

*Note: For "lower is better" units (like `days`), the ratio is inverted.*

#### Delta Calculation

```
delta = ((currentValue - baselineValue) / |baselineValue|) * 100
```

#### KPI Snapshot System

- Point-in-time captures with labels (e.g., "Day 30", "End of Month")
- Historical snapshot viewing and editing
- Compare current vs any previous snapshot
- Storage: `threeseas_bi_kpi_snapshots`

#### Auto-Computed KPIs (from CRM data)

These KPIs pull values directly from AppContext/SalesContext/FinanceContext:

| KPI ID | Function | Source |
|--------|----------|--------|
| `total_revenue` | `calcTotalRevenue()` | payments |
| `revenue_growth` | `calcRevenueGrowthRate()` | payments (MoM) |
| `aov` | `calcAOV()` | payments |
| `arpu` | `calcARPU()` | payments + clients |
| `revenue_concentration` | `calcRevenueConcentration()` | payments (top 3) |
| `win_rate` | `calcWinRate()` | prospects |
| `avg_deal_size` | `calcAvgDealSize()` | prospects (won) |
| `sales_cycle` | `calcSalesCycleLength()` | prospects (days) |
| `lead_conversion` | `calcLeadConversionRate()` | leads + prospects + clients |
| `pipeline_coverage` | `calcPipelineCoverage()` | prospects vs target |
| `gross_margin` | `calcGrossMargin()` | payments + expenses |
| `dso` | `calcDSO()` | clients.invoices |
| `rev_per_fte` | `calcRevenuePerFTE()` | payments + users |
| `gp_per_fte` | `calcGrossProfitPerFTE()` | payments + expenses + users |
| `project_completion` | `calcProjectCompletionRate()` | clients.projects |
| `data_completeness` | `calcDataCompleteness()` | clients + intakes |

---

### 3.2 Universal KPI Stack (18 KPIs Across 6 Categories)

Works in **any** industry:

#### Growth
| KPI | Unit | Description |
|-----|------|-------------|
| Revenue Growth % | % | Period-over-period revenue change |
| New Customer Growth % | % | Rate of new customer acquisition |
| Market Share % | % | Share of total addressable market revenue |

#### Acquisition
| KPI | Unit | Description |
|-----|------|-------------|
| Leads / Inquiries | # | Total new leads received |
| Lead-to-Customer Conversion % | % | Leads that became paying clients |
| Customer Acquisition Cost | $ | (Sales + marketing spend) / new customers |

#### Monetization
| KPI | Unit | Description |
|-----|------|-------------|
| Average Order Value | $ | Revenue / number of orders |
| Gross Margin % | % | (Revenue - Expenses) / Revenue |
| Contribution Margin % | % | Revenue minus variable costs / revenue |

#### Retention
| KPI | Unit | Description |
|-----|------|-------------|
| Repeat Purchase Rate % | % | Customers making 2+ purchases |
| Customer Retention Rate % | % | Customers retained over period |
| Churn Rate % | % | Customers lost over period (lower is better) |

#### Cash & Efficiency
| KPI | Unit | Description |
|-----|------|-------------|
| Cash Conversion Cycle | days | Days from cash out to cash in |
| Days Sales Outstanding | days | Avg days to collect after invoicing |
| Operating Expense Ratio | % | OpEx as % of revenue |

#### Experience
| KPI | Unit | Description |
|-----|------|-------------|
| Net Promoter Score | # | Likelihood to recommend (-100 to +100) |
| Customer Satisfaction % | % | Positive satisfaction ratings |
| Complaint / Return Rate | % | Complaints/returns per transaction |

---

### 3.3 Industry-Specific KPI Packs (40 Industries x 10 KPIs)

Each industry pack contains exactly **10 KPIs**: 3 North Star + 5 Driver + 2 Guardrail.

#### Supported Industries

| # | Industry | Example North Star KPI |
|---|----------|----------------------|
| 1 | Retail (Brick & Mortar) | Same-Store Sales Growth % |
| 2 | E-commerce / DTC | Net Revenue, Repeat Purchase Rate |
| 3 | FMCG / CPG Manufacturing | Net Sales, Distribution Reach |
| 4 | Manufacturing (General) | Throughput, On-Time Delivery |
| 5 | Construction / Engineering | Project Gross Margin, Backlog Value |
| 6 | Real Estate | Occupancy Rate, NOI |
| 7 | Hospitality (Hotels/Resorts) | RevPAR, GOP Margin |
| 8 | Restaurant / Food Service | Same-Store Sales, Prime Cost % |
| 9 | Healthcare | Patient Outcomes, Net Revenue/Encounter |
| 10 | Pharma / Biotech | Pipeline Value, Time-to-Milestone |
| 11 | Insurance | Combined Ratio, GWP Growth |
| 12 | Banking / Lending | Net Interest Margin, Risk-Adjusted Return |
| 13 | Fintech / Payments | Total Payment Volume, Active Users (MAU) |
| 14 | SaaS (B2B/B2C) | MRR/ARR Growth, Net Revenue Retention |
| 15 | IT Services / Consulting | Gross Margin, Utilization % |
| 16 | Telecommunications | ARPU, Subscriber Growth |
| 17 | Media / Publishing | Audience Revenue, Ad Revenue |
| 18 | Marketing / Advertising Agency | Client Retention, Retainer Revenue |
| 19 | Logistics / Trucking / 3PL | Revenue per Truck, On-Time Delivery |
| 20 | Warehousing / Fulfillment | Cost per Order, Perfect Order Rate |
| 21 | Transportation (Air/Sea/Rail) | Yield/Capacity, Load Factor |
| 22 | Energy & Utilities | EBITDA Margin, System Reliability |
| 23 | Oil & Gas / Mining | Production Volume, Cash Cost/Unit |
| 24 | Agriculture / Agribusiness | Yield per Hectare, Farm Gate Margin |
| 25 | Education | Enrollment Growth, Retention/Completion |
| 26 | Government / Public Sector | Service Delivery Time, Citizen Satisfaction |
| 27 | Nonprofit / NGO | Program Impact, Beneficiary Reach |
| 28 | Automotive (Dealer/Service) | Gross Profit/Unit, Service Dept Revenue |
| 29 | Travel / Tourism | Gross Booking Value, Repeat Traveler |
| 30 | Beauty / Wellness / Fitness | Active Members, Revenue per Member |
| 31 | Legal Services | Revenue per Lawyer, Matter Profitability |
| 32 | Accounting / Tax / Audit | Revenue Growth, Client Retention |
| 33 | HR / Staffing / Recruiting | Placements/Period, Fill Rate |
| 34 | Security Services | Contract Renewal, Incident Reduction |
| 35 | Electronics / Semiconductors | Revenue Growth, Yield % |
| 36 | Aerospace & Defense | Program Margin, Contract Win Rate |
| 37 | Wholesale / Distribution | Net Sales, Inventory Turnover |
| 38 | Import / Export / Trade | Gross Margin/Shipment, On-Time Clearance |
| 39 | Event Management | Event Profit Margin, Attendee Satisfaction |
| 40 | Social Commerce / Creator | GMV, Repeat Buyer % |

---

### 3.4 Agency-Level Financial Metrics

#### Revenue Metrics (RevenueTab)

| Metric | Formula | Visualization |
|--------|---------|---------------|
| Total Revenue | Sum of completed payments for year | Summary card |
| Transaction Count | Count of completed payments | Summary card |
| Average Monthly Revenue | `totalRevenue / 12` | Summary card |
| YTD Revenue | Sum through current month | Summary card |
| Revenue by Service | Group by service type | PieChart |
| Revenue by Tier | Group by subscription tier | BarChart |
| Revenue by Payment Method | Group by method | BarChart |
| Monthly Revenue Trend | Monthly totals | AreaChart |
| Quarterly Revenue | 3-month aggregates | BarChart |

#### Profit & Loss Metrics (ProfitTab)

| Metric | Formula | Color |
|--------|---------|-------|
| Gross Revenue | Sum of completed payments | Blue |
| Total Expenses | Sum of all expenses | Red |
| Gross Profit | `revenue - expenses` | Green (positive) / Red (negative) |
| Profit Margin | `(grossProfit / totalRevenue) * 100` | Percentage |

Monthly P&L chart shows dual bars (revenue vs expenses) with profit line overlay.

#### Expense Categories

| Category | Schedule C Line | Description |
|----------|----------------|-------------|
| Wages | Line 26 | Employee wages |
| Fuel | Line 9 (Car/Truck) | Vehicle expenses |
| Food | Line 24b (50%) | Meals at 50% deduction |
| Meetings | Line 24b (50%) | Business meal meetings at 50% |
| Trips | Line 24a (Travel) | Business travel |
| Receipts | Line 27a (Other) | Miscellaneous expenses |

#### Tax Estimation (TaxesTab)

| Tax | Rate | Description |
|-----|------|-------------|
| Self-Employment Tax | 15.3% | Social Security + Medicare |
| Estimated Income Tax | 22% | Federal income tax bracket |
| **Total Estimated Rate** | **37.3%** | Combined |

Quarterly estimated tax payments:
- Q1: April 15
- Q2: June 15
- Q3: September 15
- Q4: January 15 (next year)

---

## 4. Business Intelligence

### 4.1 Audit Scoring System

**Component:** `src/components/admin/BusinessIntelligence/AuditScoring.jsx`
**API:** `server/routes/audits.js`
**Tables:** `business_audits`, `audit_scores`, `audit_subcriteria_scores`, `audit_categories`, `audit_subcriteria`

#### 5 Default Audit Categories (Equal Weight: 20% each)

| Category | Subcriteria (4 each) |
|----------|---------------------|
| **SEO** | Meta Tags, Heading Structure, Sitemap, Page Speed |
| **Design/UX** | Layout, Mobile Experience, Navigation, Branding |
| **Content** | Quality, Calls to Action, Media, Blog/Updates |
| **Technical** | SSL/Security, Hosting, Performance, Analytics |
| **Social/Marketing** | Social Profiles, Reviews, Directory Listings, Email Marketing |

#### Scoring Mechanics

```
Each subcriteria:     1-10 scale (range slider)
Category score:       Average of subcriteria scores with values > 0
Overall score:        Weighted sum of category scores / total weight

Score = Σ(category_score × weight) / Σ(weight)
```

#### Score Color Thresholds

| Score Range | Color | Label |
|-------------|-------|-------|
| 0.0 - 3.0 | Red | Needs Work |
| 3.1 - 6.0 | Amber | Fair |
| 6.1 - 8.0 | Green | Good |
| 8.1 - 10.0 | Dark Green | Excellent |

#### Audit Workflow

```
  DRAFT ──→ IN_PROGRESS ──→ PUBLISHED
                               │
                     Portal Scorecard
                     sees this data
```

#### Versioning

Each client can have multiple audit versions. Version number auto-increments. UNIQUE constraint on `(client_id, version)`.

---

### 4.2 Health Overview (Heat Map)

**Component:** `src/components/admin/BusinessIntelligence/HealthOverview.jsx`

Grid heatmap where:
- **Rows** = clients
- **Columns** = SEO / Design/UX / Content / Technical / Social / Overall
- **Cell color intensity** = proportional to score value

#### Aggregate Stats

| Stat | Description |
|------|-------------|
| Average Score | Mean of all client overall scores |
| Strongest Category | Highest avg score across all clients |
| Weakest Category | Lowest avg score across all clients |

---

### 4.3 Audit Queue

**Component:** `src/components/admin/BusinessIntelligence/AuditQueue.jsx`
**View:** `v_audit_queue_status`

#### Traffic Light System

| Light | Condition | Label |
|-------|-----------|-------|
| Green | Audited <= 90 days ago | Recent |
| Amber | Audited <= 180 days ago | Due Soon |
| Red | Audited > 180 days ago OR never audited | Needs Audit |

#### Queue Stats

- Total active clients
- Count per traffic light status
- Average score across all audited clients
- Distribution bar chart (green/amber/red segments)

---

### 4.4 Recommendations Builder

**Component:** `src/components/admin/BusinessIntelligence/RecommendationsBuilder.jsx`
**API:** `server/routes/recommendations.js`
**Tables:** `audit_recommendations`, `recommendation_templates`, `recommendation_threads`

#### Default Recommendation Templates

| Template | Priority | Impact |
|----------|----------|--------|
| SSL Certificate Installation | Critical | High |
| Mobile Responsive Redesign | High | High |
| SEO Optimization Package | High | High |
| Google Business Profile Setup | Medium | Medium |
| Content Strategy Development | Medium | Medium |

#### Recommendation Status Flow

```
  PROPOSED ──→ ACCEPTED ──→ IN_PROGRESS ──→ COMPLETED
      │
      └──→ DECLINED (with decline_reason)
```

#### IFSR Priority Scoring

```
IFSR Score = (0.40 × Impact) + (0.25 × Feasibility) + (0.20 × Speed) + (0.15 × Risk)

Each factor: 1-5 scale

Decision Matrix:
  >= 4.0  →  "Do Now"
  >= 3.0  →  "Plan Next"
  >= 2.0  →  "Later"
  <  2.0  →  "Deprioritize"
```

#### Recommendation-Client Interaction

Clients can:
- Accept recommendations (via portal)
- Decline with reason
- Send messages in recommendation threads
- Track recommendation through to completion

---

### 4.5 Business Intake Form

**Component:** `src/components/admin/BusinessIntelligence/IntakeForm.jsx`
**API:** `server/routes/intakes.js`
**Table:** `business_intakes`

#### Fields Collected (19 tracked for completion %)

| Section | Fields |
|---------|--------|
| Business Profile | industry (40 options), sub_industry, years_in_operation, employee_count_range, annual_revenue_range, target_market, business_model |
| Digital Presence | current_website_url, hosting_provider, tech_stack, domain_age_years, has_ssl, is_mobile_responsive, last_website_update |
| Marketing Profile | social_platforms[], email_marketing_tool, paid_advertising, content_marketing, seo_efforts |
| Goals & Budget | pain_points, goals, budget_range, timeline_expectations, notes |

#### Option Ranges

| Field | Options |
|-------|---------|
| Employees | 1-5, 6-10, 11-25, 26-50, 51-100, 100+ |
| Annual Revenue | Under $50k, $50k-$100k, $100k-$250k, $250k-$500k, $500k-$1M, $1M+ |
| Budget | Under $1k, $1k-$2.5k, $2.5k-$5k, $5k-$10k, $10k-$25k, $25k+ |
| Timeline | ASAP, 1-3 months, 3-6 months, 6-12 months, No rush |

#### On Save Trigger

Saving an intake form automatically calls `generateKpisForClient(clientId, industry)` which:
1. Looks up the industry KPI pack (10 KPIs)
2. Adds universal KPIs (18 KPIs)
3. Skips any KPIs the client already has
4. Writes new growth targets to `threeseas_bi_growth_targets`
5. Targets become visible in portal GrowthMetrics

---

### 4.6 Client Portal (Client-Facing BI)

#### Portal Components

| Component | What Client Sees |
|-----------|-----------------|
| **Dashboard** | Latest audit score, active recommendations count, open invoices, activity feed |
| **Scorecard** | Overall score gauge (SVG), category breakdown with progress bars, score history line chart |
| **GrowthMetrics** | Growth targets with progress bars, sparkline charts, status filters |
| **Recommendations** | Recommendation list with accept/decline actions, thread messaging |
| **Interventions** | Active interventions, before/after metrics, ROI visualization |
| **FinancialReports** | Monthly financial periods, revenue/expenses/profit |
| **RevenueView** | Revenue by channel breakdown |
| **ProfitabilityView** | Profit margins, COGS, expense breakdown |
| **ServiceRequests** | Submit and track service requests |
| **Documents** | Client documents + onboarding documents |
| **Onboarding** | 5-step document workflow |
| **Feedback** | Submit ratings (1-5 stars) on projects/milestones/recommendations |

#### Notification Preferences (per client)

| Preference | Default |
|-----------|---------|
| notify_new_scores | TRUE |
| notify_new_recommendations | TRUE |
| notify_metric_milestones | TRUE |
| notify_invoices | TRUE |
| notify_documents | TRUE |
| notify_project_updates | TRUE |
| notify_admin_messages | TRUE |
| email_digest | weekly (none/daily/weekly) |

---

## 5. Competition & Competitive Landscape

### 5.1 Business Database (Competitive Intelligence Repository)

**Component:** `src/components/admin/BusinessDatabaseTab.jsx`
**API:** `server/routes/businessDb.js`
**Table:** `business_database`

#### What It Does

Central repository of **every business discovered** via OSM lead searches plus manual entries. Functions as the primary competitive intelligence tool.

#### Data Model

| Field | Type | Description |
|-------|------|-------------|
| businessName | VARCHAR(255) | Business entity name |
| address | TEXT | Physical location |
| phone | VARCHAR(50) | Contact number |
| website | VARCHAR(500) | Web presence |
| category | VARCHAR(100) | Business type classification |
| coordinates | JSON | `{lat, lon}` for mapping |
| enrichment | JSON | Industry, tech stack, social presence data |
| intel | JSON | Manually gathered competitive intelligence |
| source | VARCHAR(50) | How discovered (manual/osm_search/import) |

#### Cross-Reference Capability

The Business Database automatically cross-references entries against:

| Entity | Match By |
|--------|----------|
| Clients | name, email |
| Prospects | name, email |
| Leads | businessName |
| Appointments | name |

When a match is found, it surfaces:
- Client BI data (intake forms, audits, recommendations, growth targets)
- Score badge: good (>=7, green), fair (>=4, amber), poor (<4, red)

#### Competitive Analysis Features

- **Market density mapping**: See how many businesses exist in a category within a radius
- **OSM enrichment**: Auto-populated business type, coordinates, contact info
- **Intel JSON blob**: Free-form competitive notes per business
- **Deduplication**: Composite key `${name.toLowerCase()}_${address.toLowerCase()}`

### 5.2 Current Limitations & Expansion Opportunities

The platform does **not currently have** dedicated modules for:
- Side-by-side competitor comparison matrices
- Competitor SWOT analysis
- Market share estimation per competitor
- Competitive pricing benchmarking

**These are tracked via:**
- Business Database enrichment/intel JSON fields
- Intake form `competitors` JSON field
- Market research POI counts by category (proxy for competitive density)

---

## 6. Market Research & Consumer Research

### 6.1 Research Tab

**Component:** `src/components/admin/ResearchTab.jsx` (53.8KB)
**API:** `server/routes/research.js`
**Table:** `market_research`

#### Data Sources

| Source | API | Data Type |
|--------|-----|-----------|
| OpenStreetMap Nominatim | Geocoding API | Location coordinates, address parsing |
| US Census Bureau | ACS5 2021 API | Demographics, income, housing, education |
| OpenStreetMap Overpass | POI API | Business/amenity discovery |

#### US Census ACS5 Demographics Fetched

| Category | Census Variable | Metric |
|----------|----------------|--------|
| **Population** | B01003_001E | Total population |
| **Age** | B01002_001E | Median age |
| **Age Groups** | B01001_* | Under 18, 18-24, 25-34, 35-64, 65+ |
| **Income** | B19013_001E | Median household income |
| **Housing** | B25077_001E | Median home value |
| **Housing** | B25003_001E-002E | Total units, owner-occupied |
| **Race** | B02001_002E-008E | White, Black, Native, Asian, Pacific, Other, Multiracial |
| **Ethnicity** | B03003_003E | Hispanic/Latino population |
| **Education** | B15003_022E-025E | Bachelor's, Master's, Professional, Doctorate |

#### POI Discovery Categories

| Category | Overpass Tags | Example Discoveries |
|----------|--------------|-------------------|
| Schools | amenity=school, university, kindergarten, library | Schools, colleges, daycares |
| Businesses | shop, office, restaurant, gym, auto, medical | Retail, offices, restaurants |
| Healthcare | hospital, clinic, pharmacy, dentist, veterinary | Medical facilities |
| Dining | amenity=restaurant, fast_food, cafe | Restaurants, cafes |
| Services | Various amenity/shop tags | Service businesses |
| Recreation | leisure, tourism | Parks, attractions |
| Government | amenity=townhall, fire_station, police | Govt buildings |

#### Research Outputs

- **Demographic profile**: Population, income, age, education, race/ethnicity with PieCharts and BarCharts
- **Business density**: Count by category in configurable radius
- **Individual POI listings**: Name, address, phone, website per discovered business
- **Saved research**: Indexed by location string, persisted to database

---

## 7. Marketing & Ad Spend

### 7.1 Ad Spend Tracking

**Table:** `client_ad_spend`
**API:** `server/routes/clientFinancials.js`

#### Supported Platforms

| Platform | Enum Value |
|----------|------------|
| Google Ads | google_ads |
| Meta (Facebook/Instagram) Ads | meta_ads |
| TikTok Ads | tiktok_ads |
| LinkedIn Ads | linkedin_ads |
| Twitter/X Ads | twitter_ads |
| Bing Ads | bing_ads |
| Other | other |

#### Metrics Tracked Per Platform Per Month

| Metric | Type | Description |
|--------|------|-------------|
| spend | DECIMAL(15,2) | Total ad spend |
| impressions | BIGINT | Number of impressions |
| clicks | INT | Total clicks |
| conversions | INT | Conversion actions |
| conversion_value | DECIMAL(15,2) | Revenue from conversions |
| CTR | DECIMAL(8,4) | Click-through rate |
| CPC | DECIMAL(8,2) | Cost per click |
| CPA | DECIMAL(10,2) | Cost per acquisition |
| ROAS | DECIMAL(8,2) | Return on ad spend |

#### Aggregate Calculations

```sql
Overall ROAS = SUM(conversion_value) / NULLIF(SUM(spend), 0)
```

---

### 7.2 Intervention Tracker (Marketing Impact Measurement)

**Component:** `src/components/admin/BusinessIntelligence/InterventionTracker.jsx`
**API:** `server/routes/interventions.js`
**Tables:** `interventions`, `intervention_metrics`, `intervention_snapshots`, `intervention_alerts`
**Calculator:** `server/utils/roiCalculator.js`

#### 12 Intervention Types

| Type | Description |
|------|-------------|
| website | Website redesign/updates |
| seo | Search engine optimization |
| social | Social media campaigns |
| advertising | Paid advertising campaigns |
| email | Email marketing |
| chatbot | Chatbot implementation |
| branding | Brand identity work |
| content | Content creation/strategy |
| technical | Technical improvements |
| performance | Performance optimization |
| analytics | Analytics setup/improvement |
| other | Miscellaneous |

#### 8-Status Lifecycle

```
  PLANNED ──→ IN_PROGRESS ──→ COMPLETED
                 │                │
                 ├──→ PAUSED      ├──→ LAUNCHED ──→ MEASURING ──→ MEASURED
                 │                │
                 └──→ ARCHIVED    └──→ ARCHIVED
```

#### Standard Before/After Metrics

| Metric | Unit | Note |
|--------|------|------|
| Website Traffic | /month | Higher is better |
| Conversion Rate | % | Higher is better |
| Revenue | $ | Higher is better |
| Social Followers | count | Higher is better |
| SEO Score | /100 | Higher is better |
| Page Speed | /100 | Higher is better |
| Bounce Rate | % | **Lower is better** (inverted) |

Plus unlimited custom metric pairs.

#### ROI Calculations

```
ROI = ((revenueChange - cost) / cost) * 100

ROAS = revenue / adSpend

Payback Period (months) = cost / monthlyRevenue

Payback Period (days) = (cost / monthlyRevenue) * 30.44
```

#### Effectiveness Rating

| Average Improvement | Rating | DB Enum |
|--------------------|--------|---------|
| >= 50% | Excellent | exceptional |
| >= 20% | Good | strong |
| >= 5% | Fair | moderate |
| < 5% | Poor | weak |

#### Checkpoint Snapshots

Capture all metric values at: 7d, 14d, 30d, 60d, 90d, 180d, or custom intervals.

#### Intervention Alerts

| Alert Type | Description |
|-----------|-------------|
| target_exceeded | A metric surpassed its target |
| negative_trend | Metrics declining |
| high_roi | Exceptional ROI detected |
| measurement_complete | Measurement window ended |
| all_positive | All metrics improved |
| engagement_drop | Engagement metrics declining |

---

### 7.3 Email Templates

**Table:** `email_templates`
**Categories:** invoice, appointment, follow-up, project, general

---

## 8. Forecasting & Financial Modeling

### 8.1 Client Financial Modeling

**Component:** `src/components/admin/BusinessIntelligence/ClientFinancials.jsx`
**API:** `server/routes/clientFinancials.js`
**Tables:** `client_financials`, `client_revenue_channels`, `client_revenue_products`

#### Monthly Financial Data Per Client

| Field | Type | Description |
|-------|------|-------------|
| gross_revenue | DECIMAL(15,2) | Total gross revenue |
| net_revenue | DECIMAL(15,2) | Revenue after deductions |
| online_revenue | DECIMAL(15,2) | Online channel revenue |
| offline_revenue | DECIMAL(15,2) | Offline/in-store revenue |
| new_customer_revenue | DECIMAL(15,2) | Revenue from new customers |
| returning_customer_revenue | DECIMAL(15,2) | Revenue from repeat customers |
| transaction_count | INT | Number of transactions |
| average_order_value | DECIMAL(10,2) | AOV |
| cost_of_goods_sold | DECIMAL(15,2) | COGS |
| total_marketing_spend | DECIMAL(15,2) | All marketing costs |
| our_fees | DECIMAL(15,2) | Three Seas Digital fees |
| total_expenses | DECIMAL(15,2) | All expenses |
| gross_profit | DECIMAL(15,2) | Revenue - COGS |
| net_profit | DECIMAL(15,2) | Revenue - All Expenses |
| profit_margin | DECIMAL(8,4) | Net Profit / Revenue |
| new_customers | INT | New customer count |
| total_customers | INT | Active customer count |
| customer_acquisition_cost | DECIMAL(10,2) | CAC |

#### Derived Summary Metrics (API-computed)

```sql
-- Financial Summary Endpoint aggregations:
SUM(gross_revenue) as total_gross_revenue
SUM(total_expenses) as total_expenses
SUM(net_profit) as total_net_profit
AVG(gross_revenue) as avg_monthly_revenue
AVG(total_expenses) as avg_monthly_expenses
AVG(net_profit) as avg_monthly_profit
AVG(profit_margin) as avg_profit_margin
SUM(transaction_count) as total_transactions
AVG(average_order_value) as avg_aov
SUM(new_customers) as total_new_customers
AVG(customer_acquisition_cost) as avg_cac

-- Derived calculations:
revenue_per_customer = SUM(gross_revenue) / NULLIF(SUM(total_customers), 0)
avg_conversion_rate = SUM(transaction_count) / NULLIF(SUM(total_customers), 0)
cost_per_lead = SUM(total_marketing_spend) / NULLIF(SUM(new_customers), 0)
```

#### ROI Calculator Section (within ClientFinancials)

| Metric | Formula |
|--------|---------|
| ROI | `((revenue - adSpend) / adSpend) * 100` |
| ROAS | `revenue / adSpend` |
| Cost Per Customer | `adSpend / customers` |
| Cost Per Lead | `adSpend / leads` |

#### MoM Change Calculation

```
MoM Change = ((currentMonth - previousMonth) / previousMonth) * 100
```

#### Revenue Channel Breakdown

Per financial period, track revenue by channel:
- channel_name, revenue, transaction_count, conversion_rate, cost, roi

#### Revenue Product Breakdown

Per financial period, track revenue by product/service:
- product_name, revenue, units_sold, average_price, margin_percent

---

### 8.2 Revenue Forecasting

#### Current Projection Methods

| Method | Formula | Source |
|--------|---------|--------|
| Average Monthly Revenue | `totalAnnualRevenue / 12` | RevenueTab |
| YTD Annualized | `YTD_Revenue / monthsElapsed * 12` | Implied comparison |
| Pipeline Coverage | `activePipelineValue / revenueTarget * 100` | auditMetrics.js |

#### Intervention Revenue Impact Projection

When an intervention is created with cost and revenue impact:

```javascript
// Annual revenue projection from intervention
annual_revenue_impact = revenue_impact_monthly * 12

// ROI projection
overall_roi = ((annual_revenue_impact - cost_to_client) / cost_to_client) * 100

// Payback period projection
payback_period_days = (cost_to_client / revenue_impact_monthly) * 30.44
```

The interventions summary endpoint aggregates `total_monthly_revenue_impact` across all active interventions, giving a projected total monthly revenue lift.

---

### 8.3 Growth Target Tracking

**Component:** `src/components/portal/GrowthMetrics.jsx`
**Tables:** `growth_targets`, `growth_snapshots`

#### Progress Calculation

```
Progress = ((current_value - baseline_value) / (target_value - baseline_value)) * 100
```

#### Target Statuses

| Status | Color | Meaning |
|--------|-------|---------|
| active | Blue | Currently being tracked |
| achieved | Green | Target met, `achieved_at` set |
| missed | Red | Past target_date without achievement |
| paused | Gray | Temporarily suspended |

#### Measurement Frequencies

daily, weekly, biweekly, monthly

#### Data Sources (9)

google_analytics, search_console, pagespeed, facebook, instagram, google_business, financial, manual, other

---

### 8.4 Scheduled Reports

**Table:** `scheduled_reports`

| Field | Options |
|-------|---------|
| report_type | scorecard, financial_summary, growth_report, intervention_report, full_dashboard |
| frequency | weekly, biweekly, monthly, quarterly |
| format | pdf, csv, xlsx |
| recipients | JSON array of email addresses |

---

## 9. Risk Assessment

### 9.1 Built-In Risk Indicators

The platform tracks risk through several mechanisms:

#### Financial Risk Signals

| Signal | Source | Threshold |
|--------|--------|-----------|
| Overdue invoices | `invoices.status = 'overdue'` | Dashboard alert |
| Negative profit margin | ProfitTab calculation | Red indicator |
| Revenue concentration | `calcRevenueConcentration()` | Top 3 clients > X% |
| Cash conversion cycle | Universal KPI | Days metric |
| DSO (Days Sales Outstanding) | `calcDSO()` | Higher = worse |

#### Client Health Risk

| Signal | Source | Threshold |
|--------|--------|-----------|
| Audit score < 4.0 | AuditScoring | Red traffic light |
| No audit > 180 days | AuditQueue | Red flag |
| Declined recommendations | RecommendationsBuilder | Status tracking |
| Negative intervention trends | InterventionTracker alerts | `negative_trend` alert |

#### Pipeline Risk

| Signal | Source | Threshold |
|--------|--------|-----------|
| Pipeline coverage < 100% | `calcPipelineCoverage()` | Below target |
| Low win rate | `calcWinRate()` | Below industry benchmark |
| Long sales cycle | `calcSalesCycleLength()` | Increasing trend |
| High loss rate | prospects.outcome='lost' | Count tracking |
| Loss reasons concentrated | prospects.loss_reason | Pattern detection |

#### Guardrail KPIs (Risk Thresholds Per Industry)

Every industry KPI pack includes **2 Guardrail KPIs** specifically designed as risk indicators:

| Industry | Guardrail KPI 1 | Guardrail KPI 2 |
|----------|----------------|----------------|
| Retail | Shrinkage % | Return Rate % |
| E-commerce | Refund/Chargeback Rate | Fulfillment Cost/Order |
| SaaS | Gross Margin % | Support SLA Resolution |
| Healthcare | Readmission Rate | Adverse Event Rate |
| Restaurant | Waste % | Order Error Rate |
| Construction | Safety Incident Rate | Change Order % |
| Banking | NPL Ratio | Delinquency (30/60/90) |
| Insurance | Fraud Detection Rate | Regulatory Complaints |

### 9.2 Decision Rules as Risk Governance

The ExecutionTracker's 5 decision rules serve as risk guardrails:

```
Rule 4: "Stop initiatives missing leading indicators for 2 cycles"
         → Automatic risk circuit-breaker for underperforming initiatives

Rule 5: "Protect cash: deprioritize long-payback bets unless strategic"
         → Cash flow risk protection
```

---

## 10. Customer Journey Mapping

### 10.1 Full Customer Journey (Platform-Tracked)

```
 DISCOVERY                EVALUATION               CONVERSION
 ─────────               ──────────               ──────────

 ┌──────────┐   ┌────────────┐   ┌──────────────┐   ┌─────────────┐
 │ OSM Lead │──→│ Lead Entry │──→│ Appointment  │──→│ Follow-Up   │
 │ Discovery│   │ (LeadsTab) │   │ (Scheduler)  │   │ (Notes)     │
 └──────────┘   └────────────┘   └──────────────┘   └──────┬──────┘
      │                                                     │
      │              ┌──────────────────────────────────────┘
      │              ▼
      │        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
      └───────→│  Prospect    │──→│ Proposal     │──→│  Pipeline    │
               │  (Pipeline)  │   │ (Builder)    │   │ (Kanban)     │
               └──────────────┘   └──────────────┘   └──────┬───────┘
                                                            │
 ONBOARDING                                                 │
 ──────────                                                 │
                                                            ▼
 ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐
 │ Convert to   │──→│  Onboarding  │──→│  Active Client           │
 │ Client       │   │  (5 steps)   │   │  (Projects, Invoices)    │
 └──────────────┘   └──────────────┘   └────────────┬─────────────┘
                                                     │
 GROWTH & RETENTION                                  │
 ─────────────────                                   │
                                                     ▼
 ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐
 │ Business     │──→│ Audit &      │──→│ Recommendations          │
 │ Intake       │   │ Scoring      │   │ (Accept/Decline)         │
 └──────────────┘   └──────────────┘   └────────────┬─────────────┘
                                                     │
                                                     ▼
 ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐
 │ Growth       │──→│ Intervention │──→│ ROI Measurement          │
 │ Targets      │   │ Execution    │   │ (Before/After)           │
 └──────────────┘   └──────────────┘   └────────────┬─────────────┘
                                                     │
 CLIENT PORTAL (Self-Service)                        │
 ────────────────────────────                        ▼
                                         ┌──────────────────────┐
 ┌──────────────┐   ┌──────────┐         │ Feedback & Ratings   │
 │ Scorecard    │   │ Service  │         │ (1-5 stars)          │
 │ (View Audit) │   │ Requests │         └──────────────────────┘
 └──────────────┘   └──────────┘
 ┌──────────────┐   ┌──────────┐
 │ Growth       │   │ Financial│
 │ Metrics      │   │ Reports  │
 └──────────────┘   └──────────┘
```

### 10.2 Touchpoints & Data Captured At Each Stage

| Stage | Component | Data Captured |
|-------|-----------|---------------|
| Discovery | LeadsTab (OSM) | Business name, address, phone, category, coordinates |
| Lead Entry | LeadsTab | Status, notes, source |
| Appointment | AppointmentScheduler | Date, time, service interest, follow-up priority |
| Follow-Up | FollowUpsTab | Notes, status, priority |
| Prospect | PipelineTab | Deal value, probability, stage, expected close |
| Proposal | PipelineTab | Services, pricing, discount, timeline, payment terms |
| Conversion | Convert-to-Client | Source tracking, note/doc transfer |
| Onboarding | OnboardingTab | 5-step document workflow (proposal → contract → agreement → invoice → welcome packet) |
| Active Client | ClientsTab | Tier, tags, notes, documents, invoices, projects |
| Business Intake | IntakeForm | Industry, tech stack, competitors, goals, budget |
| Audit | AuditScoring | 20 subcriteria scores, overall score, version history |
| Recommendations | RecommendationsBuilder | Priority, IFSR scores, status, client response |
| Growth Targets | KPIDashboard | Baseline, target, current values, snapshots |
| Interventions | InterventionTracker | Type, before/after metrics, ROI, effectiveness |
| Feedback | Portal Feedback | Rating (1-5), comments, admin response |

### 10.3 Conversion Funnel Metrics

```
  Leads Discovered ──→ Leads Contacted ──→ Appointments Booked
       (100%)              (X%)                  (Y%)
                                                  │
                                                  ▼
                     Prospects Created ──→ Proposals Sent ──→ Won
                          (Z%)                (W%)           (V%)
```

Tracked by: `calcLeadConversionRate()`, `calcWinRate()`, `calcSalesCycleLength()`

---

## 11. Market Strategy & Pricing Strategy

### 11.1 Service Tier Pricing Model

The platform supports a tiered pricing structure:

#### Client Subscription Tiers

| Tier | Level | Typical Use |
|------|-------|-------------|
| Free | Entry | Basic CRM access |
| Basic | Standard | Standard service package |
| Premium | Advanced | Full-featured service |
| Enterprise | Custom | Custom pricing, consultation required |

#### Template Subscription Tiers (Website Templates)

| Tier | Price | Description |
|------|-------|-------------|
| Starter | $499 | Single-page, mobile-first |
| Business | $999-$1,499 | Multi-page, CMS features |
| Premium | $1,999-$2,499 | Advanced features, dashboards |
| Enterprise | Custom | Consultation required |

### 11.2 Revenue Analysis Tools for Pricing Strategy

| Tool | What It Reveals | Strategic Use |
|------|----------------|---------------|
| Revenue by Tier (RevenueTab) | Distribution across pricing tiers | Identify which tier generates most revenue |
| Revenue by Service (RevenueTab) | Revenue per service type | Identify most/least profitable services |
| AOV (auditMetrics.js) | Average order value | Benchmark pricing against actual spending |
| ARPU (auditMetrics.js) | Revenue per active client | Track per-client value over time |
| Revenue Concentration (auditMetrics.js) | % from top 3 clients | Assess pricing dependency risk |
| Existing Customer Mix (auditMetrics.js) | Revenue split new vs returning | Measure retention pricing effectiveness |
| Gross Margin (auditMetrics.js) | Revenue minus costs | Validate pricing covers costs |

### 11.3 Proposal Pricing Features

| Feature | Description |
|---------|-------------|
| Custom Price | Override standard pricing |
| Discount | Percentage or fixed amount |
| Discount Type | `percent` or `fixed` |
| Payment Terms | Default net15, configurable |
| Timeline | Project duration estimate |
| Service Bundling | Multiple services per proposal |

---

## 12. SWOT, Porter's Five Forces & Strategic Frameworks

### 12.1 Current Framework Support

The platform does **not** have dedicated SWOT or Porter's Five Forces UI modules. However, the building blocks exist across the system:

#### SWOT Data Sources (Available in Platform)

| SWOT Quadrant | Platform Data Sources |
|---------------|---------------------|
| **Strengths** | Audit scores >= 7 (per category), high win rate, strong ROI interventions, high client retention, positive feedback ratings |
| **Weaknesses** | Audit scores < 4 (per category), long sales cycle, high DSO, low project completion rate, concentrated revenue |
| **Opportunities** | Market research demographics (high income areas), low competitor density (POI counts), unserved industries (intake data), growth targets with high potential |
| **Threats** | High churn rate, competitor loss reasons, negative intervention trends, guardrail KPI breaches, declining revenue growth |

#### Porter's Five Forces Data Sources

| Force | Available Data |
|-------|---------------|
| **Competitive Rivalry** | Business database POI counts, competitor density per area, market research location data |
| **Threat of New Entrants** | Market research business counts over time, industry growth trends from KPI snapshots |
| **Threat of Substitutes** | Loss reasons (competitor), service category trends |
| **Buyer Power** | Revenue concentration (top N clients), churn rate, win rate, discount usage |
| **Supplier Power** | Operating expense ratio, cost_of_goods_sold trends, vendor expense tracking |

### 12.2 IFSR Framework (Built-In)

The platform uses the **IFSR (Impact-Feasibility-Speed-Risk)** framework for prioritizing recommendations:

```
IFSR Score = (0.40 × Impact) + (0.25 × Feasibility) + (0.20 × Speed) + (0.15 × Risk)

  Impact:       How much will this move the needle? (1-5)
  Feasibility:  How achievable is this? (1-5)
  Speed:        How quickly can we see results? (1-5)
  Risk:         How low-risk is this? (1-5, inverted: 5 = low risk)

Decision:
  >= 4.0  →  "Do Now"      (high impact, feasible, fast, low risk)
  >= 3.0  →  "Plan Next"   (good overall, schedule for next wave)
  >= 2.0  →  "Later"       (lower priority, revisit in future)
  <  2.0  →  "Deprioritize" (not worth pursuing now)
```

### 12.3 Audit Maturity Model

The 5-category audit system effectively creates a **digital maturity assessment**:

```
Category Maturity Levels:
  1-3: Needs Work (foundational gaps)
  4-6: Fair (basic presence, room for improvement)
  7-8: Good (solid execution, minor optimizations)
  9-10: Excellent (industry-leading, competitive advantage)

Overall Maturity = Weighted average across all categories
```

---

## 13. Industry Trends

### 13.1 Trend Tracking Via Growth Snapshots

The `growth_snapshots` table captures point-in-time metric values, enabling trend analysis:

| Field | Purpose |
|-------|---------|
| value | Current metric value |
| previous_value | Prior snapshot value |
| change_percent | Period-over-period change |
| progress_percent | Progress toward target (0-100%) |
| recorded_at | Timestamp for time-series |

#### Trend Detection

- **Positive trend**: 3+ consecutive snapshots with positive `change_percent`
- **Negative trend**: 3+ consecutive snapshots with negative `change_percent` (triggers `negative_trend` alert)
- **Stagnation**: Change_percent near zero for 2+ cycles (triggers ExecutionTracker Rule 4)

### 13.2 Industry Context Via Intake Forms

The `business_intakes` table captures current industry positioning:

| Field | Trend Insight |
|-------|--------------|
| competitors | JSON array of named competitors |
| current_website_url | Current digital presence baseline |
| tech_stack | Technology adoption level |
| social_platforms | Social channel adoption |
| seo_efforts | SEO maturity level |
| paid_advertising | Ad platform usage patterns |
| content_marketing | Content strategy maturity |
| email_marketing_tool | Email tool adoption |

### 13.3 Industry Benchmarking

Each industry KPI pack provides implicit benchmarks through the **baseline/target structure**:
- **Baseline**: Where the client starts (industry entry point)
- **Target**: Where top performers in that industry operate
- **Current**: Client's actual performance

This enables positioning any client relative to industry standards across 10 industry-specific + 18 universal KPIs.

---

## 14. Market Sizing & TAM Analysis

### 14.1 Market Research Data for TAM Estimation

The ResearchTab provides the raw data needed for market sizing:

#### Population & Income Data (Census ACS5)

| Metric | TAM Use |
|--------|---------|
| Total population | Market size upper bound |
| Median household income | Spending capacity filter |
| Age distribution | Target demographic sizing |
| Education levels | Professional service demand proxy |
| Housing (owner vs renter) | Real estate/home services TAM |
| Race/ethnicity breakdown | Cultural market segmentation |

#### Business Density Data (Overpass POI)

| Category | TAM Use |
|----------|---------|
| Total businesses in radius | Addressable business market |
| Category breakdown | Industry-specific TAM |
| Business type counts | Service demand estimation |
| Schools/education count | Education market proxy |
| Healthcare facilities | Healthcare market proxy |
| Dining establishments | Food service market density |

### 14.2 TAM Calculation Framework

While the platform doesn't have a dedicated TAM calculator, the data supports:

```
TAM Estimation (Top-Down):
  ┌──────────────────────────────────────────────────┐
  │ Total Market = Population × Service Penetration  │
  │                × Average Price Point              │
  └──────────────────────────────────────────────────┘

  Population:     Census ACS5 total population
  Penetration:    Based on business density / population ratio
  Price Point:    From platform's subscription tier pricing

SAM Estimation:
  ┌──────────────────────────────────────────────────┐
  │ SAM = Businesses in Target Category              │
  │       × Average Revenue per Client               │
  └──────────────────────────────────────────────────┘

  Target Businesses:  Overpass POI count by category
  Revenue/Client:     calcARPU() from platform data

SOM Estimation:
  ┌──────────────────────────────────────────────────┐
  │ SOM = Current Clients                            │
  │       × Win Rate × Pipeline Value                │
  └──────────────────────────────────────────────────┘

  Win Rate:       calcWinRate() from prospect data
  Pipeline Value: Sum of active prospect deal values
```

### 14.3 Market Sizing Data Sources Summary

| Data Point | Source | API |
|-----------|--------|-----|
| Population | US Census Bureau | ACS5 2021 |
| Income levels | US Census Bureau | ACS5 2021 |
| Business count | OpenStreetMap | Overpass |
| Business categories | OpenStreetMap | Overpass |
| Geographic coordinates | OpenStreetMap | Nominatim |
| Client revenue data | Internal CRM | AppContext |
| Service pricing | Internal CRM | SUBSCRIPTION_TIERS |

---

## 15. Formula Reference

### Revenue & Growth Formulas

```
Revenue Growth Rate    = ((currentPeriod - priorPeriod) / priorPeriod) * 100
Average Order Value    = totalRevenue / completedPaymentCount
ARPU                   = totalRevenue / activeClientCount
Revenue Concentration  = topNClientRevenue / totalRevenue * 100
Existing Customer Mix  = revenueFromClients>6months / totalRevenue * 100
Total Revenue          = SUM(completedPayments.amount) for year
YTD Revenue            = SUM(Jan through currentMonth)
Average Monthly        = totalAnnualRevenue / 12
```

### Sales & Pipeline Formulas

```
Win Rate               = wonProspects / (wonProspects + lostProspects) * 100
Average Deal Size      = SUM(wonDeals.value) / wonDeals.count
Sales Cycle Length      = AVG(closedAt - createdAt) for won prospects (days)
Lead Conversion Rate   = convertedClients / (leads + activeProspects + converted) * 100
Pipeline Coverage      = activePipelineValue / revenueTarget * 100
```

### Profit & Margin Formulas

```
Gross Profit           = revenue - expenses
Profit Margin          = (grossProfit / totalRevenue) * 100
Gross Margin           = (revenue - expenses) / revenue * 100
Revenue per FTE        = totalRevenue / approvedUsers
Gross Profit per FTE   = (revenue - expenses) / approvedUsers
DSO                    = AVG(paidAt - createdAt) for paid invoices (days)
```

### Tax Formulas

```
Self-Employment Tax    = netIncome * 0.153
Estimated Income Tax   = netIncome * 0.22
Total Estimated Tax    = netIncome * 0.373
Quarterly Tax Payment  = quarterlyNetIncome * 0.373
Meals Deduction        = (food + meetings) * 0.50
```

### ROI & Investment Formulas

```
ROI                    = ((revenueChange - cost) / cost) * 100
ROAS                   = revenue / adSpend
Payback Period (months)= cost / monthlyRevenue
Payback Period (days)  = (cost / monthlyRevenue) * 30.44
Cost per Customer      = adSpend / customers
Cost per Lead          = adSpend / leads
```

### Audit & Scoring Formulas

```
Category Score         = AVG(subcriteria scores where value > 0)
Overall Score          = SUM(categoryScore * weight) / SUM(weight)
IFSR Score             = (0.40 * I) + (0.25 * F) + (0.20 * S) + (0.15 * R)
Growth Progress        = (current - baseline) / (target - baseline) * 100
KPI Delta              = (current - baseline) / |baseline| * 100
```

### Effectiveness Rating

```
Average Improvement    = AVG(((after - before) / |before|) * 100) for all metric pairs
  >= 50%  → Excellent (exceptional)
  >= 20%  → Good (strong)
  >= 5%   → Fair (moderate)
  <  5%   → Poor (weak)
```

---

## 16. Database Tables Reference

### Core CRM (25 Tables)

| # | Table | Purpose | Key FKs |
|---|-------|---------|---------|
| 1 | users | Admin users with roles | - |
| 2 | clients | Client records | - |
| 3 | client_notes | Notes per client | clients |
| 4 | client_tags | Tags per client | clients |
| 5 | documents | Polymorphic docs | - |
| 6 | client_documents | Client docs | clients |
| 7 | prospect_documents | Prospect docs | prospects |
| 8 | invoices | Billing (recurring support) | clients |
| 9 | payments | Payment records | clients, invoices |
| 10 | projects | Project management | clients |
| 11 | project_developers | User-project junction | projects, users |
| 12 | project_tasks | Task cards | projects |
| 13 | project_milestones | Milestone tracking | projects |
| 14 | appointments | Scheduled meetings | users |
| 15 | follow_up_notes | Appointment notes | appointments |
| 16 | prospects | Sales pipeline | - |
| 17 | prospect_notes | Prospect notes | prospects |
| 18 | leads | Top-of-funnel | - |
| 19 | lead_notes | Lead notes | leads |
| 20 | expenses | Operating expenses | - |
| 21 | time_entries | Billable hours | clients, projects |
| 22 | email_templates | Email templates | - |
| 23 | notifications | System alerts | users |
| 24 | activity_log | Audit trail | users |
| 25 | business_database | Business intel repo | - |
| 26 | market_research | Location research | - |
| 27 | sessions | Auth sessions | users, clients |

### Business Intelligence (26 Tables)

| # | Group | Table | Purpose |
|---|-------|-------|---------|
| 1 | Audit | audit_categories | Scoring categories |
| 2 | Audit | audit_subcriteria | Detailed criteria |
| 3 | Audit | recommendation_templates | Rec templates |
| 4 | Audit | business_intakes | Client intake data |
| 5 | Audit | business_audits | Audit records |
| 6 | Audit | audit_scores | Category scores |
| 7 | Audit | audit_subcriteria_scores | Detailed scores |
| 8 | Audit | audit_recommendations | Recommendations |
| 9 | Audit | recommendation_threads | Discussion threads |
| 10 | Growth | growth_targets | KPI targets |
| 11 | Growth | growth_snapshots | Point-in-time values |
| 12 | Growth | data_source_connections | API connections |
| 13 | Growth | data_sync_log | Sync history |
| 14 | Interaction | service_requests | Client requests |
| 15 | Interaction | client_feedback | Ratings/comments |
| 16 | Interaction | client_notification_prefs | Notification settings |
| 17 | Financial | client_financials | Monthly financials |
| 18 | Financial | client_revenue_channels | Revenue by channel |
| 19 | Financial | client_revenue_products | Revenue by product |
| 20 | Financial | client_ad_spend | Ad spend tracking |
| 21 | Intervention | interventions | Marketing interventions |
| 22 | Intervention | intervention_metrics | Before/after metrics |
| 23 | Intervention | intervention_snapshots | Checkpoint data |
| 24 | Intervention | intervention_alerts | Alert notifications |
| 25 | Reporting | saved_filters | Saved filter configs |
| 26 | Reporting | scheduled_reports | Automated reports |

### Views (4)

| View | Purpose |
|------|---------|
| v_client_health_summary | Client health: latest audit + recs + interventions |
| v_client_financial_summary | Lifetime financial aggregation per client |
| v_intervention_roi_summary | Intervention counts, ROI, effectiveness |
| v_audit_queue_status | Audit freshness traffic lights |

---

## 17. API Route Inventory

### Core CRM Routes

```
POST   /api/auth/login              Admin JWT login
POST   /api/auth/logout             Admin logout
GET    /api/auth/me                 Current user info
POST   /api/clientAuth/login        Client portal login
GET    /api/clientAuth/me           Current client info

GET    /api/users                   List users
POST   /api/users                   Create user
PUT    /api/users/:id               Update user
DELETE /api/users/:id               Delete user

GET    /api/clients                 List clients
POST   /api/clients                 Create client
PUT    /api/clients/:id             Update client
DELETE /api/clients/:id             Delete client
PUT    /api/clients/:id/approve     Approve pending
PUT    /api/clients/:id/reject      Reject pending
PUT    /api/clients/:id/archive     Soft delete
PUT    /api/clients/:id/restore     Restore
POST   /api/clients/:id/notes       Add note
POST   /api/clients/:id/tags        Add tag
POST   /api/clients/:id/documents   Upload document

GET    /api/appointments            List appointments
POST   /api/appointments            Create
PUT    /api/appointments/:id        Update
DELETE /api/appointments/:id        Delete
PUT    /api/appointments/:id/status Status change

GET    /api/prospects               List prospects
POST   /api/prospects               Create
PUT    /api/prospects/:id           Update
DELETE /api/prospects/:id           Delete
POST   /api/prospects/:id/convert-to-client  Pipeline conversion

GET    /api/leads                   List leads
POST   /api/leads                   Create
PUT    /api/leads/:id               Update
DELETE /api/leads/:id               Delete

GET    /api/invoices                List invoices
POST   /api/invoices                Create
PUT    /api/invoices/:id            Update + mark paid

GET    /api/payments                List payments
POST   /api/payments                Create

GET    /api/projects                List projects
POST   /api/projects                Create
PUT    /api/projects/:id            Update

GET    /api/expenses                List expenses
POST   /api/expenses                Create
PUT    /api/expenses/:id            Update
DELETE /api/expenses/:id            Delete

GET    /api/timeEntries             List time entries
POST   /api/timeEntries             Create

GET    /api/emailTemplates          List templates
POST   /api/emailTemplates          Create
PUT    /api/emailTemplates/:id      Update
DELETE /api/emailTemplates/:id      Delete

GET    /api/businessDb              List business database
POST   /api/businessDb              Create
PUT    /api/businessDb/:id          Update
DELETE /api/businessDb/:id          Delete

GET    /api/research                List research
POST   /api/research                Save/upsert by location
PUT    /api/research/:id            Update
DELETE /api/research/:id            Delete
```

### Business Intelligence Routes

```
GET    /api/audits/client/:clientId       All audits for client
POST   /api/audits/client/:clientId       Create new audit version
GET    /api/audits/:id                    Full audit detail
PUT    /api/audits/:id                    Update audit
POST   /api/audits/:id/publish            Publish audit
POST   /api/audits/:id/scores             Bulk upsert category scores
POST   /api/audits/:id/subcriteria-scores Bulk upsert subcriteria

GET    /api/auditCategories               List categories
POST   /api/auditCategories               Create
PUT    /api/auditCategories/:id           Update
DELETE /api/auditCategories/:id           Delete

GET    /api/intakes/:clientId             Get intake for client
POST   /api/intakes/:clientId             Create/update intake

GET    /api/recommendations/client/:id    Recommendations for client
POST   /api/recommendations               Create
PUT    /api/recommendations/:id           Update
POST   /api/recommendations/:id/thread    Add thread message

GET    /api/clients/:id/financials              List financials
POST   /api/clients/:id/financials              Create
PUT    /api/clients/:id/financials/:fid         Update
DELETE /api/clients/:id/financials/:fid         Delete
GET    /api/clients/:id/financials/summary      Aggregated summary
GET    /api/clients/:id/financials/channels     Revenue channels
GET    /api/clients/:id/financials/products     Revenue products
GET    /api/clients/:id/financials/ad-spend     Ad spend records
POST   /api/clients/:id/financials/ad-spend     Create ad spend
POST   /api/clients/:id/financials/import       Bulk CSV import

GET    /api/clients/:id/interventions/summary   Intervention stats
GET    /api/clients/:id/interventions           List interventions
POST   /api/clients/:id/interventions           Create
PUT    /api/clients/:id/interventions/:iid      Update
DELETE /api/clients/:id/interventions/:iid      Delete
POST   /api/clients/:id/interventions/:iid/metrics    Add metric
PUT    /api/clients/:id/interventions/:iid/metrics/:m Update metric
POST   /api/clients/:id/interventions/:iid/snapshots  Checkpoint
GET    /api/clients/:id/interventions/:iid/snapshots  List snapshots
POST   /api/clients/:id/interventions/:iid/screenshots Upload
```

### Portal Routes (Client-Facing)

```
GET    /api/portal/dashboard              Dashboard overview
GET    /api/portal/audits                 Published audits
GET    /api/portal/score-history          Score history
GET    /api/portal/metrics                Growth targets + latest snapshot
GET    /api/portal/recommendations        Active recommendations
POST   /api/portal/recommendations/:id/accept   Accept recommendation
POST   /api/portal/recommendations/:id/decline  Decline recommendation
POST   /api/portal/recommendations/:id/thread   Add message
GET    /api/portal/recommendations/:id/threads  Thread messages
```

---

*Generated from the Three Seas Digital codebase: `src/`, `server/`, `database/`*
*Covers all components, formulas, APIs, and database structures as of 2026-03-01*
