# Three Seas Digital — Fix Plan

## Phase 1: Pre-Launch Cleanup (Critical) ✅ COMPLETE

- [x] Remove fake "Continue with Google" OAuth button from `src/pages/ClientSignup.jsx` — removed button, handler, divider, and all `authMethod === 'google'` references
- [x] Remove admin login hint text "Default: admin / admin123" from `src/pages/Admin.jsx` — replaced with generic "Enter your credentials to sign in", also changed placeholder from "admin" to "Username"
- [x] Update `SITE_INFO` in `src/App.jsx` — replaced placeholder phone and address with empty strings + clear TODO comments
- [x] Fix About page team section in `src/pages/About.jsx` — replaced 4 stock photo team cards with clean "A Growing Team" section using Users icon
- [x] Add `.htaccess` file to `/public` for cPanel SPA routing — includes HTTPS redirect and SPA fallback
- [x] Add proper `<title>` and meta description per page — added `document.title` via useEffect to all 8 pages, plus meta description in index.html
- [x] Add a favicon — created `public/favicon.svg` with "3S" branding, updated index.html reference
- [x] Persist admin auth to localStorage — added ADMIN_AUTH_KEY, init from localStorage, useEffect sync, logout clears storage

## Phase 2: Security Hardening (High) ✅ COMPLETE

- [x] Remove hardcoded default admin credentials from `AppContext.jsx` `defaultUsers` array — replaced with first-run setup flow (AdminSetup component, setupAdmin function, needsSetup flag)
- [x] Add basic password hashing (client-side salted hash via hashPassword function — NOT production-grade, but prevents plaintext storage). Auto-migrates legacy plaintext passwords on login.
- [x] Add HTTPS redirect in `.htaccess` for production deployment — included in Phase 1 .htaccess
- [x] Add rate limiting UX — login button disabled for 30s after 3 failed attempts, with countdown timer

## Phase 3: Code Quality & Architecture (High)

- [x] Split `Admin.jsx` (494 KB) into separate component files under `src/components/admin/` — COMPLETE (10,400 → 480 lines)
  - [x] Batch 1: Extracted AdminSetup, AdminLogin, DashboardHomeTab, NotificationsDropdown, TimeTracker, and shared utilities (StatusBadge, RoleBadge, FollowUpBadge, TierBadge, formatDisplayDate, exportToICal) → 6 new files, ~720 lines removed from Admin.jsx (10,400 → 9,682)
  - [x] Batch 2: Extracted FollowUpsTab (~482 lines), PipelineTab (~543 lines), ClientRequestsTab (~145 lines) → 3 new files, ~1,172 lines removed from Admin.jsx (9,682 → 8,510)
  - [x] Batch 3: Extracted ClientsTab (~1221 lines), ProjectBoard + KanbanCard + KanbanColumn (~635 lines) → 2 new files, ~1836 lines removed from Admin.jsx (8,510 → 6,674)
  - [x] Batch 4: Extracted UserManagement (~205 lines), ExpensesTab (~688 lines) → 2 new files, ~881 lines removed from Admin.jsx (6,674 → 5,794)
  - [x] Batch 5: Extracted RevenueTab (~317 lines), InvoicesTab (~353 lines), ProfitTab (~294 lines), TaxesTab (~462 lines) → 4 new files, ~1,421 lines removed from Admin.jsx (5,794 → 4,374)
  - [x] Batch 6: Extracted AnalyticsTab (~1126 lines), LeadsTab (~1025 lines), ResearchTab (~914 lines) → 3 new files, ~3,027 lines removed from Admin.jsx (4,374 → 1,347), cleaned 28 unused Lucide imports + entire recharts import
  - [x] Batch 7: Extracted ArchivedTab (~68 lines), TiersTab (~265 lines), ClientsDatabaseTab (~382 lines), KanbanView (~131 lines) → 4 new files, ~859 lines removed from Admin.jsx (1,339 → 480), cleaned 5 unused imports (useCallback, Link, TierBadge, TimeTracker, ProjectBoard) + unused sidebarTabs variable. **Admin.jsx split COMPLETE: 10,400 → 480 lines (95% reduction), 22 component files extracted.**
- [x] Split `index.css` (332 KB, 19,738 lines) into 10 per-feature CSS files under `src/styles/`: base.css (166), navbar.css (85), home.css (298), portfolio.css (414), about.css (204), contact.css (328), footer.css (88), admin.css (11,317), client-portal.css (1,964), demos.css (4,874). Removed duplicate import from App.jsx. Original index.css deleted.
- [x] Fix all lint errors — reduced from 22 errors+warnings to 0. Fixed: unused vars (LeadsTab, PipelineTab, ProjectBoard, ResearchTab), react-refresh exports (adminUtils, 4 contexts), PipelineTab useMemo deps, ProjectBoard setState-in-effect replaced with derived value
- [x] Add React.lazy() code splitting for heavy routes: Admin, ClientSignup, PortfolioLanding — wrapped in Suspense with PageLoader spinner, named exports for portfolio showcases
- [x] Add an ErrorBoundary component in `src/components/ErrorBoundary.jsx` — wraps around main routes in App.jsx, shows reload button on error
- [x] Add loading skeletons/spinners for data-dependent views — PageLoader spinner for lazy routes (Suspense), ResearchTab has RefreshCw spinner for API calls, LeadsTab has search spinner, ClientsTab/PipelineTab have upload spinners. All data from localStorage loads synchronously, no additional skeletons needed.
- [x] Split `AppContext.jsx` into domain-specific contexts — AuthContext (268 lines), FinanceContext (135 lines), SalesContext (390 lines), AppContext (1239 lines) with useAppContext() backward-compat merger

## Phase 4: UX & Polish (Medium)

- [x] Self-host all Unsplash images — downloaded 21 images to `/public/images/` (~2MB total), updated all `src` references in About.jsx, Home.jsx, Contact.jsx, Portfolio.jsx, PortfolioLanding.jsx. Zero remaining Unsplash dependencies.
- [x] Fix the Premium demo's non-functional tab switcher — Already functional: 3 views (public/booking/portal) with state-based conditional rendering, proper CSS styling, cross-tab navigation, and booking flow
- [x] Add proper form validation messages on the Contact page — added booking-hint with amber styling that shows "Please select a date" or "Please select a time slot" when booking summary slot is empty
- [x] Fix mobile responsive issues — comprehensive mobile audit + fixes across all 10 CSS files
  - Added 480px breakpoint to base.css (container padding, section spacing, button sizing)
  - Added 480px + 768px breakpoints to home.css (hero fonts, stats grid, CTA sizing)
  - Fixed minmax() overflow: used min(Xpx, 100%) pattern for services, testimonials, portfolio, about grids
  - Moved misplaced hero font-size rules from footer.css to home.css
  - Added 480px breakpoint to about.css (reduced gaps, card padding)
  - Added 480px breakpoint to contact.css (calendar padding, heading size)
  - Added 480px breakpoint to portfolio.css (intro heading, CTA padding)
  - Added 480px breakpoints to demos.css (starter hero, business topbar hide, premium nav)
  - Fixed notifications dropdown: width: min(360px, calc(100vw - 24px)) instead of fixed 360px
  - Added 480px + 768px breakpoints to admin.css (stats grids, sidebar, pipeline stats)
  - Added 480px + 768px breakpoints to client-portal.css (portal stats, tabs scroll, quick actions, signup card)
  - Added 480px breakpoint to navbar.css (container padding, logo size)
- [x] Remove unused imports across all files — removed 1 unused icon from Admin.jsx (X), 17 unused icons from PortfolioLanding.jsx (FileText, Calendar, BookOpen, MessageSquare, Play, Sun, Moon, Database, Layers, Zap, Target, Filter, Trash2, Download, Upload, AlertCircle, UserCheck)

## Phase 5: Backend & Database ✅ COMPLETE

Schema spec: `.ralph/specs/database-schema.md` (25 tables, maps all 15 localStorage keys)

- [x] Create `database/schema.sql` — 25 CREATE TABLE statements in FK-safe order, IF NOT EXISTS, wrapped with FOREIGN_KEY_CHECKS
- [x] Create `database/seed.sql` — 5 default email templates with UUID() and is_default=TRUE
- [x] Build Node.js/Express API server in `server/` — index.js, config/db.js (mysql2/promise pool), middleware/auth.js (JWT), middleware/rateLimit.js, middleware/upload.js (multer), server/package.json
- [x] Implement auth routes — `server/routes/auth.js` FULL: login (bcrypt+JWT), register, setup (first-run), logout, me, refresh. `server/routes/clientAuth.js` FULL: login, register, logout, me, refresh
- [x] Implement CRUD routes for all entities — 17 route files: clients (with notes/tags/docs/approve/reject/archive/restore), appointments (with follow-up notes/status), invoices (mark-paid/unmark-paid/generate-recurring), projects (tasks/milestones/developers), prospects (notes/docs/convert-to-client), leads (notes), expenses (receipt upload), payments, timeEntries, emailTemplates, notifications, activityLog, businessDb, research, users (approve/reject/password-change)
- [x] Add file upload handling — multer middleware with disk storage, UUID filenames, MIME filtering, 5MB limit, documents/ and receipts/ subdirectories
- [x] Create React API client — `src/api/client.js` with axios, JWT refresh interceptor, 18 service files matching all server routes
- [x] Add data migration script — `database/migrate-localstorage.js` (standalone, no deps): reads JSON export, denormalizes nested clients into 9 tables, handles all 15 keys, outputs FK-safe INSERT SQL. Companion `database/export-localstorage.html` for browser-side export
- [x] Configure CORS, helmet, and security middleware on the Express server — helmet(), cors() with configurable origin, JSON body limit
- [x] Add `.env.example` — DB, JWT, server, CORS, upload config with placeholder values. Added .env and uploads/ to .gitignore
- [x] Wire initSync into App.jsx — SyncInitializer component runs initSync() once after all providers mount, non-blocking with localStorage fallback
- [x] Install server dependencies and test startup — `cd server && npm install`
- [x] Install axios in frontend — `npm install axios`
- [x] Migrate React contexts to use API — fire-and-forget `syncToApi()` calls added to all 4 contexts (88 sync points total: 8 in AuthContext, 6 in FinanceContext, 22 in SalesContext, 53 in AppContext). localStorage remains authoritative source; API sync is best-effort background. Created `src/api/apiSync.js` utility.

## Completed

- [x] Removed fake stats from Home page ("200+ Happy Clients", "350+ Projects", etc.)
- [x] Removed fake testimonials with stock photos from Home page
- [x] Added honest "Our Philosophy" section to Home page
- [x] Removed price ranges from all 4 portfolio demo banners
- [x] Replaced bulky demo-banner with clean demo-back-bar on all demos
- [x] Removed demo-features-bar from bottom of each demo
- [x] Fixed demo pages hidden behind navbar (added padding-top offset)
- [x] Made demo back bar sticky below main nav
- [x] Removed test payment data from AppContext.jsx
- [x] Project PRD created (ThreeSeasDigital_PRD.docx)
- [x] Phase 1 complete: Google OAuth removed, login hint removed, SITE_INFO cleaned, About team fixed, .htaccess added, page titles added, favicon created, admin auth persisted

## Phase 6A: Business Intelligence — Schema + Admin Audit UI ✅ COMPLETE

Spec: `.ralph/specs/business-intelligence-spec.md` (28 new tables, 53 total)

- [x] Create `database/schema-bi.sql` — 28 CREATE TABLE statements in FK-safe order, all groups (audit system, growth tracking, client interaction, financials, interventions, reporting)
- [x] Create `database/seed-bi.sql` — 6 base audit categories with weights/icons/colors, 24 subcriteria (4 per category), 10 recommendation templates
- [x] Add server routes: `server/routes/intakes.js` — CRUD for business_intakes with client scope
- [x] Add server routes: `server/routes/audits.js` — CRUD for business_audits, audit_scores, audit_subcriteria_scores, publish endpoint, weighted score calculation
- [x] Add server routes: `server/routes/auditCategories.js` — CRUD for audit_categories + audit_subcriteria, protects base categories from deletion
- [x] Add server routes: `server/routes/recommendations.js` — CRUD for audit_recommendations, recommendation_threads, recommendation_templates, status workflow
- [x] Build admin component: `src/components/admin/BusinessIntelligence/IntakeForm.jsx` — Structured intake form with grouped sections (Business Overview, Digital Presence, Marketing, Goals, Notes)
- [x] Build admin component: `src/components/admin/BusinessIntelligence/AuditScoring.jsx` — Scoring interface per category + subcriteria with 1-10 sliders, notes, evidence URLs, auto-weighted overall score
- [x] Build admin component: `src/components/admin/BusinessIntelligence/RecommendationsBuilder.jsx` — Template picker + custom creation, priority/impact/cost fields, status workflow, threaded conversations
- [x] Build admin component: `src/components/admin/BusinessIntelligence/AuditQueue.jsx` — Clients pending/due for audit with traffic light indicators (green/amber/red), stats row, search
- [x] Build admin component: `src/components/admin/BusinessIntelligence/HealthOverview.jsx` — Heatmap grid of all client scores with color-coded cells, sorting, filtering
- [x] Restructure admin sidebar — Grouped collapsible navigation: Dashboard, Clients, Business Intelligence, Appointments, Sales, Finance, Projects, Research, Admin
- [x] Add React API service files: `src/api/intakes.js`, `src/api/audits.js`, `src/api/auditCategories.js`, `src/api/recommendations.js`
- [x] Updated `server/index.js` — mounted 4 new route files (intakes, audits, auditCategories, recommendations)

## Phase 6B: Client Dashboard + Portal Sidebar ✅ COMPLETE

- [x] Restructure client portal sidebar — New sidebar layout with grouped navigation: Dashboard, Overview, Business Health (Scorecard, Growth Metrics), Recommendations, Projects, Invoices, Service Requests, Messages, Feedback, Support. Badge counts on active items.
- [x] Build client component: `src/components/portal/Dashboard.jsx` — Health scorecard (SVG gauge), KPI cards (score, projects, invoices, recommendations), activity feed, quick actions
- [x] Build client component: `src/components/portal/Scorecard.jsx` — Category breakdown with expandable subcriteria, score bars (0-10), SVG line chart for score history, color-coded by score range
- [x] Build client component: `src/components/portal/GrowthMetrics.jsx` — Tracked metrics with progress bars, SVG sparklines, status filters, sort options, baseline→current→target display
- [x] Build client component: `src/components/portal/Recommendations.jsx` — Active/Completed/Declined tab filters, accept/decline buttons with decline reason, threaded Q&A per recommendation, status workflow
- [x] Build client component: `src/components/portal/ServiceRequests.jsx` — Submit new request form (title, description, budget, urgency), existing requests list with status badges, admin response display
- [x] Build client component: `src/components/portal/Feedback.jsx` — Star rating (5 stars), comment form, target type/selector, previous feedback list with admin responses
- [x] Add server routes: `server/routes/portal.js` — All portal endpoints: dashboard, audits, score-history, recommendations (CRUD + accept/decline/thread), metrics, financials, interventions, service-requests, feedback, notifications, notification-prefs
- [ ] Notification system — In-app bell with unread count + optional email digest (daily/weekly) [deferred to 6F]
- [ ] PDF export endpoint — Generate scorecard + metrics as downloadable PDF [deferred to 6F]
- [x] Add React API service: `src/api/portal.js` — All portal endpoints (dashboard, audits, recommendations, metrics, financials, interventions, service-requests, feedback, notifications)
- [x] Portal CSS styles appended to `src/styles/client-portal.css` — Sidebar layout, health gauge, KPI cards, score bars, recommendation cards, thread messages, star rating, service request statuses, feedback items, activity feed, empty states, quick actions, responsive mobile layout
- [x] All 6 portal components lazy-loaded via React.lazy() with code splitting
- [x] `server/index.js` updated with portal route mount

## Phase 6C: Client Financials + Analytics ✅ COMPLETE

- [x] Add server routes: `server/routes/clientFinancials.js` (639 lines) — CRUD for client_financials, client_revenue_channels, client_revenue_products, client_ad_spend, with sorting/filtering/pagination
- [x] Add CSV import middleware: `server/middleware/csvImport.js` — multer + csv-parser for bulk financial data import
- [x] Build admin component: `src/components/admin/BusinessIntelligence/ClientFinancials.jsx` (~620 lines) — Combined entry + dashboard: client search, date range filters, CSV export, print report, 6 summary cards with trend arrows, MoM/YoY calculations, ROI calculator, Revenue vs Expenses chart, Growth Trends chart, Expense Breakdown pie, sortable monthly data table with inline edit/delete
- [x] Build admin component: `src/components/admin/BusinessIntelligence/ClientAnalytics.jsx` (~970 lines) — Per-client analytics with 11 chart sections: Business Profile, Audit Score Radar, Score History, Category Breakdown, Recommendations (pie + list), Growth Metrics (progress + sparklines), Financial Overview (revenue/expenses + cumulative area), Interventions Impact, Recommendation Funnel, Intervention ROI Scatter, Revenue Waterfall. Client search/filter, date range, comparison mode, print report.
- [x] Build client component: `src/components/portal/RevenueView.jsx` — Revenue trend line, by channel breakdown
- [x] Build client component: `src/components/portal/ExpenseView.jsx` — Expense by category, marketing vs non-marketing
- [x] Build client component: `src/components/portal/ProfitabilityView.jsx` — Profit margin trend, period comparison
- [x] Build client component: `src/components/portal/FinancialReports.jsx` — Exportable summaries (CSV)
- [x] Global filter bar: `src/components/shared/GlobalFilterBar.jsx` — Date range presets + custom, channel filter, comparison mode, search
- [x] Add React API service: `src/api/clientFinancials.js`

## Phase 6D: Intervention Tracking ✅ COMPLETE

- [x] Add server routes: `server/routes/interventions.js` (784 lines) — CRUD for interventions, intervention_metrics, intervention_snapshots, intervention_alerts. Baseline auto-calculation on launch. Status workflow: planned → in_progress → completed → paused.
- [x] Build admin component: `src/components/admin/BusinessIntelligence/InterventionTracker.jsx` (~658 lines) — Create/manage interventions, before/after metrics (websiteTraffic, conversionRate, revenue, socialFollowers, seoScore, pageSpeed, bounceRate + custom), auto-calculated ROI/ROAS/Cost-effectiveness/Payback Period, snapshot timeline, Before vs After BarChart, tags, linked audit/recommendation refs, filter/search, print report
- [x] Build client component: `src/components/portal/Interventions.jsx` — "What We've Done For You" view with before/after results and ROI display
- [x] ROI calculation engine: `server/utils/roiCalculator.js` — revenue attributable, payback period, monthly ROI
- [x] Before/after screenshot upload — multer config extended for intervention evidence images
- [x] Add React API service: `src/api/interventions.js`
- [ ] Effectiveness alerts — Auto-trigger on: target exceeded, negative trend at 30d, high ROI (>200%), measurement complete [deferred]

## Phase 6E: BI Streamlining + Portal Data Bridge ✅ COMPLETE

- [x] Portal-Admin data bridge fixed — AuditScoring.jsx now writes `threeseas_bi_categories` and `threeseas_bi_audit_scores` on save, enabling Portal Scorecard + Dashboard to read admin-created audit data
- [x] New chart sections in ClientAnalytics.jsx — Section I: Recommendation Funnel (CSS trapezoid), Section J: Intervention ROI Scatter (ScatterChart), Section K: Revenue Waterfall (stacked BarChart), Cumulative Revenue AreaChart
- [x] IntakeForm.jsx enhanced — Pain Points & Goals section, completion progress bar (counts 19 fields)
- [x] AuditQueue.jsx enhanced — Traffic light distribution bar (green/amber/red), days since last audit per row
- [x] localStorage useMemo performance fixes — AuditScoring, HealthOverview, InterventionTracker wrapped in useMemo with proper dependencies
- [x] Additional admin components: `RevenueAuditTab.jsx`, `ExecutionTracker.jsx` — extended BI analytics views

## Phase 6F: Clients Database Detail Panel ✅ COMPLETE

- [x] ClientsDatabaseTab.jsx overhauled (408 → 787 lines) — Expandable detail panel per client row pulling ALL BI localStorage data: Business Intake, Audit History, Projects, Invoices, Growth Targets, Recommendations, Interventions, Financial History, Notes, Documents, Tags
- [x] Quick stats row: Health Score, Total Revenue, Active/Total Projects, Paid Invoices, Interventions, Recommendations
- [x] New "Score" column in main table — latest audit score with color coding (green ≥7, amber ≥4, red <4), sortable
- [x] CSV export enhanced with BI data columns
- [x] ~420 lines of detail panel CSS added to admin.css

## Phase 6G: Database Enhancement ✅ COMPLETE

Comprehensive schema audit found 47 gaps across base + BI tables. All fixed:

- [x] Standardize FK types: all 26 BI table foreign keys changed from INT → VARCHAR(36) to match base table UUIDs
- [x] Fix table name mismatches: created `client_documents` table, `prospect_documents` table, `appointment_notes` VIEW alias
- [x] Fix column mismatches across 12 tables: users (display_name, last_login, refresh_token), appointments (client_name, type, notes), prospects (business_name, contact_name, estimated_value, notes), projects (name, end_date), project_tasks (description, assigned_to, sort_order), project_milestones (description), leads (category), business_database (business_name, email, category, owner, notes, intel), payments (notes), invoices (updated_at)
- [x] Fix ENUM mismatches: users.status (+active), clients.source (+pipeline), invoices.status (+pending), prospects.stage (+new/won/lost), interventions.status (+in_progress/completed/paused), interventions.effectiveness_rating (+pending), audit_recommendations.status (+pending)
- [x] Add 30+ composite indexes across base + BI tables for query performance
- [x] Add 13 CHECK constraints for data integrity (score 0-10, amounts >0, percentages 0-100, month 1-12)
- [x] Create 4 database views: `v_client_health_summary`, `v_client_financial_summary`, `v_intervention_roi_summary`, `v_audit_queue_status`
- [x] Create idempotent migration: `database/migrations/001_enhance_schema.sql` (475 lines) with stored procedures for safe column/index/check additions
- [x] Create rollback: `database/migrations/001_rollback.sql` (214 lines) with destructive operation warnings
- [x] Create consolidated schema: `database/schema-full.sql` (1,270 lines) — 53-table schema for fresh installations
- [x] Update seed-bi.sql: added sort_order to categories/subcriteria, category VARCHAR to recommendation_templates
- [x] Verify route-schema alignment: all 7 BI route files checked (clientFinancials, interventions, audits, auditCategories, auth, users, clients, appointments, prospects, projects, businessDb) — 0 mismatches, 50+ column references validated
- [x] Frontend build verified: compiles successfully

Database files (3,400 lines total):
| File | Lines |
|---|---|
| `database/schema.sql` | 551 |
| `database/schema-bi.sql` | 590 |
| `database/seed-bi.sql` | 165 |
| `database/views.sql` | 135 |
| `database/schema-full.sql` | 1,270 |
| `database/migrations/001_enhance_schema.sql` | 475 |
| `database/migrations/001_rollback.sql` | 214 |

## Phase 6H: Appointment Scheduling & Follow-Up Enhancements ✅ COMPLETE

- [x] Add `getBookedTimesForDate(dateStr, excludeApptId)` to AppContext — reusable conflict checker filtering cancelled appointments
- [x] Build `AppointmentScheduler.jsx` — reusable component with Calendar + 9-slot time grid, booked slots disabled, reschedule mode via `existingApptId`
- [x] PipelineTab appointment section — Schedule/Reschedule/New Appointment/Notes/Cancel buttons in prospect detail panel
- [x] FollowUpsTab reschedule + new appointment — linked appointments stored in `followUp.linkedAppointments[]`, displayed at bottom of card
- [x] `parentFollowUpId` pattern — child appointments tagged to exclude from "Needs Follow-Up" across all 3 views (list, calendar, kanban)
- [x] LeadsTab smart slot picking — `handleSendToFollowUp` searches 7 days for available slot instead of hardcoding 9AM
- [x] Contact.jsx migrated to `getBookedTimesForDate` — cancelled appointments no longer block public booking
- [x] BusinessDatabaseTab.jsx — new comprehensive component pulling from 14 data sources, moved to own sidebar category
- [x] `TIME_SLOTS` exported from AppointmentScheduler, imported in LeadsTab (single source of truth)
- [x] `APPT_NOTE_PREFIX` constant in PipelineTab replaces inline `[Appt]` strings
- [x] Extracted `handleScheduleNewAppt` in PipelineTab — eliminates duplicated onSchedule handler
- [x] `fuApptNotes` per-ID map in FollowUpsTab — fixes shared scalar bleeding between note panels
- [x] Note deduplication extracted from IIFEs in FollowUpsTab — computed once per card instead of twice
- [x] `addLead` enrichment passthrough in SalesContext — business intel preserved when promoting from database to lead
- [x] BusinessDatabaseTab Notes icon fixed (Mail → MessageSquare)
- [x] PipelineTab panel state reset on prospect switch — prevents scheduler/notes/cancel bleeding between selections

## Phase 6H: Known Issues (Backend — for API mode activation)

These are frontend-functional but will break when backend API mode is enabled:

### Critical (schema gaps)
- [ ] Add `parent_follow_up_id VARCHAR(36)` column to `appointments` table in schema — frontend sets `parentFollowUpId` on child appointments but DB has no column
- [ ] Add `follow_up_data JSON` column to `appointments` table OR create dedicated `follow_ups` table — the rich `followUp` object (status, notes[], linkedAppointments[], priority, createdAt) is not storable in the current flat columns
- [ ] Fix POST `/api/appointments` route — does not insert client-provided `id` (VARCHAR PK), silently drops it; also `name` vs `clientName` mapping causes NOT NULL violation
- [ ] Fix PUT `/api/appointments` route — only updates 8 of 15+ fields; silently drops `assigned_to`, `service`, `message`, `follow_up_*`, `converted_to_client`, `sent_to_pipeline`

### High
- [ ] Add `GET /api/appointments/booked-times?date=&exclude=` endpoint — `getBookedTimesForDate` is client-side only, will return stale data in multi-user API mode
- [ ] Fix `result.insertId` for VARCHAR PKs — returns 0 in appointments + businessDb routes; should return client-provided ID
- [ ] Add `enrichment JSON` column to `leads` table in schema — `addLead` now passes enrichment but DB has no column
- [ ] 6 BI localStorage keys have no API routes: `execution_plans`, `kpi_snapshots`, `growth_targets`, `growth_snapshots`, `service_requests`, `feedback`

### Medium
- [ ] `deleteFollowUpNote` in AppContext has no `syncToApi` call — deleted notes reappear on next API load
- [ ] Rate limiter mismatch: server 5 attempts/60s vs frontend 3 attempts/30s — align to 3/30s
- [ ] No past-date validation in `addAppointment` — can schedule appointments in the past
- [ ] No server-side double-booking prevention — conflict check is client-side only
- [ ] Appointments list endpoint needs `?excludeChildren=true` filter for server-side pagination (once `parent_follow_up_id` exists)

### Low
- [ ] `deleteAppointment` needs cascade cleanup — remove stale IDs from parent's `linkedAppointments[]`, clear orphaned `parentFollowUpId` refs
- [ ] Pipeline prospect `appointmentId` overwritten on new appointment — should maintain array like follow-ups do, or keep original reference
- [ ] BusinessDatabaseTab name-based matching is brittle — no persistent entity ID across Lead→Prospect→Client stages (mitigated by `sourceProspectId` for Pipeline→Client)
- [ ] Response format divergence — appointment/prospect/lead/businessDb routes return bare objects vs BI/portal routes use `{ success, data }` wrapper

## Phase 7: Automated Data Feeds

- [ ] Google PageSpeed Insights API — No auth needed, build first as proof of concept. `server/services/pagespeed.js`
- [ ] Google Analytics 4 integration — OAuth 2.0 flow, `server/services/googleAnalytics.js`, sessions/users/bounce/conversions/traffic sources
- [ ] Google Search Console integration — OAuth 2.0, `server/services/searchConsole.js`, impressions/clicks/avg position/top queries
- [ ] Facebook/Instagram Graph API — OAuth page token, `server/services/socialMeta.js`, followers/engagement/reach
- [ ] Google Business Profile API — OAuth 2.0, `server/services/googleBusiness.js`, reviews/rating/views/searches
- [ ] Google Ads / Meta Ads spend sync — Auto-pull ad spend + ROAS into client_ad_spend table
- [ ] Cron scheduler — `server/cron/metricSync.js`: every 15min check due syncs, pull data, store snapshots
- [ ] OAuth token refresh cron — `server/cron/tokenRefresh.js`: daily refresh of expiring tokens
- [ ] Auto-populate intervention snapshots — At 7d/14d/30d/60d/90d checkpoints
- [ ] Data connection management UI — `src/components/admin/BusinessIntelligence/DataConnections.jsx`: status dashboard, connect/disconnect, force sync

## Phase 8: Reporting & Polish

- [ ] Scheduled report generation — `server/services/reportGenerator.js`: PDF/CSV/XLSX export on cron schedule
- [ ] Saved filter presets — CRUD for saved_filters, UI for save/load/delete on all dashboard views
- [ ] Cross-client analytics dashboard — `src/components/admin/Analytics/CrossClientDashboard.jsx`: avg health score, improving vs declining, weak categories, revenue from recommendations
- [ ] Client engagement tracking — Track portal logins, page views, last active date. Alert admin if client inactive 30+ days
- [ ] Case study auto-generator — Pull high-ROI interventions, format as shareable case study with metrics + screenshots
- [ ] Portal notification system — In-app bell with unread count + optional email digest (daily/weekly)
- [ ] PDF export endpoint — Generate scorecard + metrics as downloadable PDF

## Notes

- **Phases 1-6H COMPLETE.** All backend infrastructure, admin BI, client portal, financials, interventions, database enhancement, appointment scheduling done. Phase 6H Known Issues tracks backend gaps that must be fixed before activating API mode.
- **Phase 6 is the Business Intelligence layer.** Read `.ralph/specs/business-intelligence-spec.md` before starting any Phase 6 task.
- **Database schema files:** `database/schema-full.sql` (53 tables, fresh install), `database/migrations/001_enhance_schema.sql` (upgrade existing). Run order: schema.sql → seed.sql → schema-bi.sql → seed-bi.sql → views.sql (or just schema-full.sql for fresh).
- **Always run `npm run build`** after frontend changes to verify no build errors
- **Do NOT break existing localStorage functionality** — the frontend must continue working without the backend until migration is complete. Build the API layer alongside, not as a replacement.
- **Server directory is `server/`** at project root, separate from `src/` (React frontend)
- **24 server route files**, **28 API service files**, **10 admin BI components**, **11 portal components**, **1 shared component**
- **Client portal must show ONLY client-facing data** — never expose internal_notes, admin notes, or raw API tokens to portal endpoints
- **Chart library: Recharts** (already installed). Use D3 only for treemap/heatmap/waterfall if Recharts can't handle them.
