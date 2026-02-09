# Three Seas Digital — Fix Plan

## Completed (Prior Sessions)
- [x] Phase 1: Pre-launch cleanup (placeholder creds hint, fake OAuth, SITE_INFO)
- [x] Phase 2: Security hardening (password hashing, rate limiting, admin setup flow)
- [x] Phase 3: Admin.jsx monolith split into 24 component files (480 → 481 lines)
- [x] Phase 3.5: index.css split into 10 per-feature CSS files
- [x] .htaccess for SPA routing
- [x] Per-page SEO/meta titles
- [x] Admin auth persistence in localStorage

## Priority 1 — Performance
- [x] **Code splitting with React.lazy** — Lazy-load Admin, ClientSignup, PortfolioLanding, Contact, About, Register, Portfolio. Initial bundle 1134→314 KB. Admin (336 KB) + Charts (396 KB) load on demand.
- [x] **Vite manual chunks** — Split vendor (react/router 47 KB), charts (recharts 396 KB), icons (lucide 42 KB) into cacheable chunks.
- [x] **Production build optimization** — esbuild drops console/debugger in production builds (dev retains them). Mode-conditional config via defineConfig function.
- [x] **useMemo for admin components** — Added useMemo to 5 admin components: ClientsTab (5 memoized values: filtered, archivedClients, client, clientAppointments, staffMembers), FollowUpsTab (5: confirmedAppts, needsFollowUp, withFollowUp, filteredFollowUps, staffMembers), UserManagement (3: pendingUsers, approvedUsers, rejectedUsers), KanbanView (2: staffMembers, unassigned), ClientRequestsTab (1: pendingClients). Prevents unnecessary recomputation on every render.

## Priority 2 — Reliability
- [x] **Error boundary** — ErrorBoundary component wrapping routes with friendly fallback UI.
- [x] **Loading states** — PageLoader spinner component for Suspense fallback.

## Priority 3 — Production Readiness
- [ ] **SITE_INFO placeholders** — Fill in real phone number and address (needs client input).
- [ ] **About page content** — Replace stock photo URLs with local assets or real team photos (needs client input).
- [x] **External image fallbacks** — FallbackImg component wraps all 21 Unsplash images across 5 pages. Shows gradient placeholder with alt text on CDN failure.

## Priority 4 — Architecture
- [x] **AppContext domain splitting (Phase 1)** — Extracted AuthContext (users, auth, permissions, RBAC) from AppContext. useAppContext() merges both for backward compat. Components can use useAuth() directly for auth-only needs.
- [x] **AppContext domain splitting (Phase 2a)** — Extracted FinanceContext (payments, expenses, EXPENSE_CATEGORIES, SUBSCRIPTION_TIERS, RECURRING_FREQUENCIES, recordPayment). AppContext delegates to FinanceContext for payment/expense mutations. useAppContext() merges all three contexts. Components can use useFinance() directly.
- [x] **AppContext domain splitting (Phase 2b)** — Extracted SalesContext (leads, prospects, businessDatabase, marketResearch, PROSPECT_STAGES, LOSS_REASONS). convertProspectToClient stays in AppContext as cross-context bridge. useAppContext() merges all four contexts. Components can use useSales() directly.
- [ ] **Backend API** — Replace localStorage with real database/API layer.
