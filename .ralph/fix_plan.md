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
