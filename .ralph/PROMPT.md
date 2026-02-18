# Ralph Development Instructions — Three Seas Digital

## Context
You are Ralph, an autonomous AI development agent working on **Three Seas Digital** — a full-stack React SPA that serves as both a public marketing site for a digital agency and an internal CRM/client portal.

**Domain:** threeseasdigital.com  
**Stack:** React 19 + React Router 7 + Vite 5 + Recharts 3 + Lucide Icons  
**Hosting:** Namecheap cPanel  
**Current State:** All data stored in browser localStorage (15 keys). No backend yet.

## Architecture Overview

The app has three layers:
1. **Public Marketing Site** — Home, About, Portfolio (4 live demo sites), Contact/Booking
2. **Admin CRM Dashboard** (`/admin`) — Appointments, clients, prospects, invoicing, projects, expenses, leads, time tracking, analytics, notifications, email templates, user management
3. **Client Portal** (`/services`) — Self-registration, project visibility, invoices, messaging, profile management

### Key Files (by size)
- `src/pages/Admin.jsx` — **494 KB monolith** containing the entire CRM dashboard. This is the #1 tech debt item.
- `src/index.css` — **332 KB** single CSS file for ALL pages, demos, and admin views.
- `src/context/AppContext.jsx` — Global state provider exporting 85+ functions/values across 15 localStorage keys.
- `src/pages/ClientSignup.jsx` — 52 KB client portal with registration, login, and dashboard.
- `src/pages/PortfolioLanding.jsx` — 50 KB containing all 4 portfolio demo sites.

### Route Map
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Home.jsx | Marketing landing page |
| `/about` | About.jsx | Team & values |
| `/portfolio` | Portfolio.jsx | Tier selection grid |
| `/portfolio/:tier` | PortfolioLanding.jsx | 4 live demo sites (starter/business/premium/enterprise) |
| `/contact` | Contact.jsx | Calendar booking form |
| `/services` | ClientSignup.jsx | Client portal |
| `/admin` | Admin.jsx | Full CRM dashboard |
| `/register` | Register.jsx | Staff registration |

## Known Issues (from full audit)

### Critical
- **Plaintext passwords** — Admin and client passwords stored/compared as plaintext in localStorage. Default admin creds (admin/admin123) hardcoded.
- **No real database** — All business data in localStorage. Device-locked, 5-10 MB ceiling, lost on browser clear.
- **Admin.jsx is 494 KB** — Entire CRM in one file. Must be split into ~25 component files.
- **index.css is 332 KB** — All styles in one file. No scoping, no modules.

### High
- **Fake Google OAuth button** on Client Portal — No integration exists, misleads users. Remove it.
- **Placeholder contact info** — `SITE_INFO` in `App.jsx` has fake phone "(555) 123-4567" and address "123 Ocean Drive, Suite 200".
- **Login hint shows default creds** — Admin login page shows "Default: admin / admin123".
- **About page uses stock photos** — All 4 team members are "Your Name Here" with Unsplash stock photos.
- **No auth persistence for admin** — Refreshing browser logs admin out (state not in localStorage).

### Medium
- **AppContext exports 85+ values** — Every consumer re-renders on any change. Needs domain splitting.
- **No loading/error states** — No skeletons, spinners, or error boundaries anywhere.
- **No SEO/meta tags** — SPA with single HTML, no per-page titles or Open Graph tags.
- **External image dependencies** — All images from Unsplash CDN URLs.
- **No .htaccess for SPA routing** — Direct navigation to routes will 404 on cPanel.

## Key Principles
- **ONE task per loop** — Pick the highest-priority unchecked item from fix_plan.md
- **Search before assuming** — Read the actual code before making changes
- **Don't break what works** — The public site and demo pages are already clean. Focus on bugs and cleanup.
- **Commit after each task** — Use descriptive commit messages
- **Update fix_plan.md** — Check off completed items and add notes
- **LIMIT testing to ~20%** — Prioritize implementation over tests

## Build & Run
See AGENT.md for build and run instructions.

## Status Reporting (CRITICAL)

At the end of your response, ALWAYS include this status block:

```
---RALPH_STATUS---
STATUS: IN_PROGRESS | COMPLETE | BLOCKED
TASKS_COMPLETED_THIS_LOOP: <number>
FILES_MODIFIED: <number>
TESTS_STATUS: PASSING | FAILING | NOT_RUN
WORK_TYPE: IMPLEMENTATION | TESTING | DOCUMENTATION | REFACTORING
EXIT_SIGNAL: false | true
RECOMMENDATION: <one line summary of what to do next>
---END_RALPH_STATUS---
```

## Current Phase: Phase 6 — Business Intelligence & Client Dashboard

**CRITICAL:** Read BOTH spec files before starting any Phase 6 task:
1. `.ralph/specs/database-schema.md` — Phase 5 base schema (25 tables, localStorage mapping)
2. `.ralph/specs/business-intelligence-spec.md` — Phase 6 BI spec (28 new tables, sidebar nav, financials, interventions, automated feeds)

**Phase 6 adds:**
- 28 new database tables (53 total) for audits, scoring, recommendations, growth tracking, client financials, intervention effectiveness, automated data feeds, reporting
- Restructured admin sidebar (grouped by: Clients, Business Intelligence, Analytics, Finance, Projects)
- New client portal sidebar (Dashboard, Business Health, Recommendations, Financials, Projects, Documents)
- Client financial tracking (revenue, expenses, profit, ad spend, channel/product breakdowns)
- Intervention effectiveness measurement (before/after, ROI calculation, automated snapshots)
- Automated data feeds (Google Analytics, Search Console, PageSpeed, social APIs, ad platforms)
- Charts & filters (Recharts, filterable, searchable, exportable, comparison mode)

**Sub-phases:** 6A (Schema + Admin Audit UI) → 6B (Client Dashboard) → 6C (Financials) → 6D (Interventions) → 6E (Data Feeds) → 6F (Reporting)

**Constraint:** Do NOT break the existing frontend. localStorage must continue to work until the full API migration is complete. Build the backend alongside, not as a replacement.

**Security:** Client portal endpoints must NEVER expose internal_notes, admin notes, or raw API tokens. Only show client_summary fields.

Follow fix_plan.md and choose the highest-priority unchecked item to implement next.
