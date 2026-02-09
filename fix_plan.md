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

## Priority 2 — Reliability
- [x] **Error boundary** — ErrorBoundary component wrapping routes with friendly fallback UI.
- [x] **Loading states** — PageLoader spinner component for Suspense fallback.

## Priority 3 — Production Readiness
- [ ] **SITE_INFO placeholders** — Fill in real phone number and address (needs client input).
- [ ] **About page content** — Replace stock photo URLs with local assets or real team photos (needs client input).
- [ ] **External image fallbacks** — Unsplash CDN images could fail; consider local copies or fallback handling.

## Priority 4 — Architecture (Future)
- [ ] **AppContext domain splitting** — Split 85+ exports into domain contexts (auth, clients, finance, etc.)
- [ ] **Backend API** — Replace localStorage with real database/API layer.
