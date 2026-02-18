# Ralph Agent Configuration — Three Seas Digital

## Build Instructions

```bash
# Install dependencies
npm install

# Build for production (validates no errors)
npm run build
```

## Test Instructions

```bash
# Lint check
npm run lint
```

## Run Instructions

```bash
# Start dev server
npm run dev
# App runs at http://localhost:5173
```

## Tech Stack
- React 19.2 + React Router 7.13
- Vite 5.4 (build tool)
- Recharts 3.7 (charts in Admin dashboard)
- Lucide React 0.563 (icons)
- No test framework installed yet

## Project Structure
```
src/
├── App.jsx              # Routes, SITE_INFO constants, layout
├── main.jsx             # Entry point
├── styles/              # Split CSS files (10 files)
├── api/                 # React API service files (18+ files)
│   ├── client.js        # Axios instance with JWT interceptor
│   ├── apiSync.js       # Sync utility
│   └── ...              # One service per domain
├── components/
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── Calendar.jsx
│   ├── ErrorBoundary.jsx
│   ├── admin/           # 22 extracted admin components
│   │   ├── BusinessIntelligence/   # Phase 6A: audit, scoring, recommendations
│   │   └── Analytics/             # Phase 6C/6D: financials, interventions
│   └── portal/          # Phase 6B: client portal components
│       └── Financials/            # Phase 6C: client financial views
├── context/
│   ├── AppContext.jsx
│   ├── AuthContext.jsx
│   ├── FinanceContext.jsx
│   └── SalesContext.jsx
└── pages/
    ├── Home.jsx
    ├── About.jsx
    ├── Portfolio.jsx
    ├── PortfolioLanding.jsx
    ├── Contact.jsx
    ├── ClientSignup.jsx     # Client portal entry
    ├── Admin.jsx            # CRM shell (~480 lines after split)
    ├── Register.jsx
    └── NotFound.jsx
```

## Backend Server (Phase 5)

```bash
# Navigate to server directory
cd server

# Install server dependencies
npm install

# Start server in dev mode
npm run dev
# Server runs at http://localhost:3001

# Database setup (run once on cPanel MySQL)
mysql -u root -p threeseas < database/schema.sql
mysql -u root -p threeseas < database/seed.sql
```

## Server Structure
```
server/
├── index.js              # Express entry point
├── config/
│   └── db.js             # MySQL connection pool
├── middleware/
│   ├── auth.js           # JWT verification
│   ├── rateLimit.js      # Rate limiting
│   └── upload.js         # Multer file upload
├── routes/               # One file per domain
│   ├── auth.js           # Phase 5
│   ├── clients.js        # Phase 5
│   ├── appointments.js   # Phase 5
│   ├── ... (17 Phase 5 routes)
│   ├── intakes.js        # Phase 6A: business_intakes CRUD
│   ├── audits.js         # Phase 6A: audits, scores, subcriteria_scores
│   ├── auditCategories.js# Phase 6A: categories + subcriteria
│   ├── recommendations.js# Phase 6A: recommendations, threads, templates
│   ├── portal.js         # Phase 6B: all client portal endpoints
│   ├── clientFinancials.js# Phase 6C: financials, channels, products, ad_spend
│   └── interventions.js  # Phase 6D: interventions, metrics, snapshots, alerts
├── services/             # Phase 6E: automated data feeds
│   ├── pagespeed.js      # Google PageSpeed API (no auth)
│   ├── googleAnalytics.js# GA4 OAuth + data pull
│   ├── searchConsole.js  # GSC OAuth + data pull
│   ├── socialMeta.js     # Facebook/Instagram Graph API
│   ├── googleBusiness.js # GBP OAuth + data pull
│   └── reportGenerator.js# Phase 6F: scheduled PDF/CSV/XLSX
├── utils/
│   └── roiCalculator.js  # Phase 6D: ROI + payback calculation
├── cron/                 # Phase 6E: scheduled jobs
│   ├── metricSync.js     # Every 15min: pull API data
│   └── tokenRefresh.js   # Daily: refresh OAuth tokens
└── uploads/              # File storage
    ├── documents/
    ├── receipts/
    └── evidence/         # Phase 6D: intervention screenshots

database/
├── schema.sql            # Phase 5: 25 CREATE TABLE statements
├── seed.sql              # Phase 5: default email templates
├── schema-bi.sql         # Phase 6: 28 new tables (BI system)
├── seed-bi.sql           # Phase 6: categories, subcriteria, templates
└── migrate-localstorage.js  # Export tool
```

## Notes
- `npm run build` is the primary frontend validation — run after every frontend change
- Dev server auto-reloads on save
- Recharts is used in Admin dashboard + Phase 6 charts (already installed)
- **Do NOT break localStorage** — frontend must work without backend until migration is complete
- **Phase 6 specs:** `.ralph/specs/business-intelligence-spec.md` (28 new tables, sidebar nav, financials, interventions, data feeds)
- **Client portal security:** NEVER expose internal_notes, admin notes, or raw API tokens to portal endpoints
- **New DB files:** `database/schema-bi.sql` (tables) and `database/seed-bi.sql` (categories, subcriteria, templates)
- **Run both schema files:** `schema.sql` first (Phase 5 base), then `schema-bi.sql` (Phase 6 BI) due to FK dependencies
