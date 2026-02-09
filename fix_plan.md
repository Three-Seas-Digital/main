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
- [x] **Self-host all images** — All 21 Unsplash image URLs replaced with self-hosted `/public/images/` paths (~2MB).
- [x] **Extract SITE_INFO to constants.js** — Moved from App.jsx to `src/constants.js` for cleaner imports.
- [x] **Conditionally render empty contact fields** — Footer and Contact page hide phone/address when empty.
- [x] **Fix client password change bug** — `handleChangePassword` compared plaintext vs hash (always failed). Now uses `hashPassword()` for both comparison and storage.
- [x] **Accessibility: aria-labels** — Added aria-labels to 15+ icon-only buttons across 8 components.
- [x] **Clean unused imports/variables** — Removed unused vars across 15+ components. Zero ESLint warnings.

## Priority 4 — Architecture
- [x] **AppContext domain splitting (Phase 1)** — Extracted AuthContext from AppContext. useAppContext() merges both for backward compat.
- [x] **AppContext domain splitting (Phase 2a)** — Extracted FinanceContext. Components can use useFinance() directly.
- [x] **AppContext domain splitting (Phase 2b)** — Extracted SalesContext. Components can use useSales() directly.
- [ ] **Backend API** — Replace localStorage with real database/API layer.

## Priority 5 — Bug Fixes & Code Quality (Feb 2026)
- [x] **Fix AdminLogin.jsx Date.now bug** — `useState(Date.now)` passed function reference instead of calling it. Changed to `useState(Date.now())`. This broke the lockout countdown timer.
- [x] **Collision-resistant ID generation** — Replaced `Date.now().toString()` with `generateId()` (`Date.now()-random7chars`) across all 4 context files (30 occurrences). Prevents duplicate IDs when creating records in rapid succession.
- [x] **Remove console.error from ResearchTab** — Removed 2 console.error statements from search and category loading error handlers. Errors already handled via user-facing state.
- [x] **Fix AdminLogin.jsx ESLint purity error** — `useState(Date.now())` flagged as impure by React compiler plugin. Changed to `useState(() => Date.now())` (lazy initializer).

## Priority 6 — SEO & Deployment Hardening (Feb 2026)
- [x] **robots.txt** — Added with Allow /, Disallow /admin and /register, Sitemap reference.
- [x] **sitemap.xml** — All 9 public routes with priorities and change frequencies.
- [x] **.htaccess hardening** — Added mod_deflate compression, mod_expires browser caching (1yr for hashed assets, no-cache for HTML), security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy), Cache-Control immutable for assets, block .git/.env/.bak/.log files.
- [x] **Open Graph & Twitter Card meta tags** — og:title, og:description, og:image, og:url, og:type, og:site_name, twitter:card/title/description/image, theme-color, canonical URL.
- [x] **.gitattributes** — Line ending normalization (LF for web files, binary for images/fonts).
- [x] **Remove @types/react dev deps** — Removed @types/react and @types/react-dom (unnecessary in JS-only project).
- [x] **Remove unused vite.svg** — Deleted default Vite favicon from public/.
