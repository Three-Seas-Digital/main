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

- [~] Split `Admin.jsx` (494 KB) into separate component files under `src/components/admin/` — IN PROGRESS
  - [x] Batch 1: Extracted AdminSetup, AdminLogin, DashboardHomeTab, NotificationsDropdown, TimeTracker, and shared utilities (StatusBadge, RoleBadge, FollowUpBadge, TierBadge, formatDisplayDate, exportToICal) → 6 new files, ~720 lines removed from Admin.jsx (10,400 → 9,682)
  - [x] Batch 2: Extracted FollowUpsTab (~482 lines), PipelineTab (~543 lines), ClientRequestsTab (~145 lines) → 3 new files, ~1,172 lines removed from Admin.jsx (9,682 → 8,510)
  - [x] Batch 3: Extracted ClientsTab (~1221 lines), ProjectBoard + KanbanCard + KanbanColumn (~635 lines) → 2 new files, ~1836 lines removed from Admin.jsx (8,510 → 6,674)
  - [x] Batch 4: Extracted UserManagement (~205 lines), ExpensesTab (~688 lines) → 2 new files, ~881 lines removed from Admin.jsx (6,674 → 5,794)
  - [ ] Batch 5: Extract RevenueTab, InvoicesTab, ProfitTab, TaxesTab
  - [ ] Batch 6: Extract AnalyticsTab, LeadsTab, ResearchTab
  - [ ] Batch 7: Extract ArchivedTab, TiersTab, ClientsDatabaseTab, KanbanView
- [ ] Split `index.css` (332 KB) into per-feature CSS files — at minimum: `base.css`, `home.css`, `portfolio.css`, `demos.css`, `admin.css`, `client-portal.css`
- [ ] Split `AppContext.jsx` into domain-specific contexts: `AuthContext`, `ClientContext`, `AppointmentContext`, `FinanceContext` (invoices/payments/expenses), `ProspectContext`, `LeadContext`
- [ ] Add React.lazy() code splitting for heavy routes: Admin, ClientSignup, PortfolioLanding
- [ ] Add an ErrorBoundary component wrapping major sections
- [ ] Add loading skeletons/spinners for data-dependent views

## Phase 4: UX & Polish (Medium)

- [ ] Self-host all Unsplash images — download to `/public/images/` and update all `src` references
- [ ] Fix the Premium demo's non-functional tab switcher (Public Site / Book Appointment / Client Portal) — either make it work or remove the tabs
- [ ] Add proper form validation messages on the Contact page when date/time not selected
- [ ] Fix mobile responsive issues — test all demos on small screens
- [ ] Remove unused imports across all files (e.g., check for unused Lucide icons)

## Phase 5: Backend Preparation (Future — Do NOT start yet)

- [ ] Design MySQL schema from the 15 localStorage keys
- [ ] Build Node.js/Express API layer with bcrypt auth and JWT sessions
- [ ] Migrate AppContext functions to API calls
- [ ] Add proper file storage for document uploads (replace base64 in localStorage)

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

## Notes

- **Do NOT touch Phase 5** until Phases 1-3 are complete
- **Admin.jsx split is the biggest task** — do it incrementally (extract one tab per loop)
- **Always run `npm run build`** after changes to verify no build errors
- **The public-facing pages (Home, Portfolio, demos) are already cleaned up** — focus energy on admin/portal/architecture
