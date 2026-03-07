# Three Seas Digital — Project Guide

## What This Is

Full-stack CRM + digital agency website for Three Seas Digital. Public-facing marketing site with WebGL effects + admin CRM dashboard + client portal + template marketplace.

## Tech Stack

- **Frontend:** React 19 + Vite 6, TypeScript (strict off, zero errors), React Router v7
- **Backend:** Node.js + Express (ESM — `"type": "module"` in package.json)
- **Database:** MySQL primary (mysql2/promise), Supabase/PostgreSQL dual-mode support via `server/config/db.js`
- **Auth:** JWT (access + refresh tokens), bcrypt password hashing
- **Animations:** GSAP + ScrollTrigger (pinned scroll sections on Home page)
- **3D/WebGL:** Three.js + @react-three/fiber (template carousel), raw WebGL shaders (DeepSeaCreatures, SonarPulse, etc.)
- **Charts:** Recharts
- **Icons:** lucide-react
- **PDF:** jspdf
- **ZIP:** jszip
- **AI:** Dual-mode via `AI_PROVIDER` env var — Google Gemini API (cloud) or Ollama (local dev)
- **Storage:** Cloudflare R2 via Worker proxy + IndexedDB local cache (template ZIPs and images)

## Running

```bash
# Frontend (dev)
npm run dev          # Vite dev server on :5173

# Backend
cd server && node index.js   # Express API on :3001

# Build
npm run build        # Vite production build → dist/
```

## Project Structure

```
src/
├── api/              # API client modules (one per resource, e.g. clients.js, invoices.js)
│   ├── useApi.js     # Dual-mode: tries API first, falls back to localStorage
│   ├── sync.js       # Background sync initializer
│   └── apiSync.js    # Sync orchestration
├── components/
│   ├── admin/        # Admin CRM tabs (ClientsTab, InvoicesTab, PipelineTab, etc.)
│   │   └── BusinessIntelligence/  # BI suite (AuditScoring, ClientAnalytics, AIAdvisor, etc.)
│   ├── portal/       # Client portal views (Dashboard, Scorecard, Recommendations, etc.)
│   ├── templates/    # Template preview components (TemplateLanding, NovaDashboard, etc.)
│   ├── TemplateTube/ # 3D carousel (TubeCanvas, TubeScene, TubeCard, TubeUI)
│   ├── shared/       # Shared components (GlobalFilterBar)
│   ├── Navbar.jsx, Footer.jsx, ErrorBoundary.jsx
│   └── [WebGL components] DeepSeaCreatures, SonarPulse, LighthouseBeam, MorphBlob, etc.
├── context/          # React contexts
│   ├── AppContext.jsx     # Global app state, template overrides
│   ├── AuthContext.jsx    # JWT auth state, admin/client login
│   ├── FinanceContext.jsx # Finance data (revenue, expenses, invoices)
│   └── SalesContext.jsx   # Sales pipeline state (leads, prospects, clients)
├── data/
│   └── templates.js  # Built-in template definitions
├── hooks/
│   └── useMouseParallax.js
├── pages/            # Route-level components
│   ├── Home.jsx      # GSAP pinned scroll editorial sections + WebGL
│   ├── About.jsx, Contact.jsx, Portfolio.jsx, Pricing.jsx
│   ├── Templates.jsx # Template marketplace with 3D tube carousel
│   ├── Checkout.jsx  # Template purchase flow
│   ├── Admin.jsx     # Full admin CRM dashboard
│   ├── Account.jsx   # Client account/portal
│   └── Register.jsx, ClientSignup.jsx, TemplatesSignIn.jsx
├── styles/           # CSS files (one per page/section, no CSS modules)
│   └── base.css      # Design tokens, CSS custom properties, resets
├── utils/
│   └── templateStorage.js  # R2 + IndexedDB template file management
└── App.jsx           # Router, providers (Auth > Finance > Sales > App > Sync)

server/
├── index.js          # Express app setup, route mounting, middleware
├── config/
│   └── db.js         # Dual-mode DB pool (MySQL or Supabase/PostgreSQL)
├── middleware/
│   ├── auth.js       # authenticateToken, requireRole
│   ├── upload.js     # multer file upload
│   ├── csvImport.js  # CSV import middleware
│   └── rateLimit.js  # Rate limiting
├── routes/           # 28 route files, one per resource
│   ├── auth.js, clientAuth.js, users.js
│   ├── clients.js, prospects.js, leads.js
│   ├── invoices.js, payments.js, expenses.js
│   ├── projects.js, appointments.js, timeEntries.js
│   ├── audits.js, auditCategories.js, recommendations.js
│   ├── portal.js, clientFinancials.js, interventions.js
│   ├── growthTargets.js, executionPlans.js
│   ├── ai.js, aiRecommendations.js
│   └── notifications.js, activityLog.js, emailTemplates.js, businessDb.js, research.js, intakes.js
└── utils/
    ├── generateId.js # ID generator: `${Date.now()}-${randomBytes(4).toString('hex').slice(0,7)}`
    ├── ai.js         # Dual-mode AI abstraction (Gemini or Ollama based on AI_PROVIDER env var)
    ├── gemini.js     # Google Gemini AI client (legacy, use ai.js instead)
    └── roiCalculator.js

database/
├── schema.sql        # Core MySQL schema (~25 tables)
├── schema-bi.sql     # BI tables (~30 tables)
├── views.sql         # SQL views
├── seed.sql, seed-bi.sql
├── migrations/       # Incremental MySQL migrations
└── supabase/         # PostgreSQL equivalents for Supabase deployment
    ├── schema.sql
    └── seed.sql

cloudflare-worker/
├── worker.js         # R2 storage proxy (template ZIPs + images)
└── wrangler.toml
```

## Key Patterns

### Database

- **Primary keys:** VARCHAR(36), generated in JS with `generateId()` before INSERT (NOT auto-increment)
- **All INSERT statements** must generate the ID before the query and include it in the INSERT column list
- **pool.query()** returns `[rows, fields]` tuple (mysql2 convention, also wrapped for pg)
- **Dual-mode:** `DB_PROVIDER` env var switches between 'mysql' and 'supabase' — db.js handles placeholder conversion (`?` → `$1`) and SQL syntax differences automatically

### Auth

- Two auth systems: admin (`/api/auth`) and client (`/api/client-auth`)
- JWT access token (15min) + refresh token (7d)
- Roles: owner, admin, manager, sales, developer, viewer
- Protected routes use `authenticateToken` + optional `requireRole(...roles)`
- Token payload: `{ userId, username, role }`

### Frontend State

- **Dual-mode data:** `useApi.js` tries backend API first, falls back to localStorage seamlessly
- **Context hierarchy:** AuthProvider > FinanceProvider > SalesProvider > AppProvider > SyncInitializer
- **Lazy loading:** All page components are lazy-loaded via `React.lazy()` + Suspense
- **No CSS modules:** Plain CSS files with BEM-like naming conventions (e.g., `.checkout-success-preview`)
- **TypeScript:** All frontend files are `.ts`/`.tsx` with zero `tsc` errors. tsconfig uses `strict: false` with selective strict flags. Contexts use `createContext<any>(null)`. Use `npm run typecheck` to verify.

### Design System

- **Theme:** Dark (default) + Light mode via `:root.light-theme` class
- **Color tokens** in `base.css`: `--abyss`, `--deep-ocean`, `--mid-ocean`, `--emerald`, `--platinum`, etc.
- **Glass panels:** `backdrop-filter: blur()` + semi-transparent backgrounds
- **Typography:** System font stack + monospace for code/labels

### Home Page Animation

- GSAP ScrollTrigger pinned sections with `usePinnedSection()` hook
- Multiple animation styles: converge, slide-up, fade-scale, reveal-up, diagonal
- Mouse parallax via `useMouseParallax()` hook
- WebGL shader backgrounds (DeepSeaCreatures jellyfish, circuit board, blob) with `u_lightMode` uniform for theme awareness

### Template System

- Templates stored in `src/data/templates.js` (built-in) + admin-created via TemplatesManagerTab
- ZIP packages stored in Cloudflare R2 (via worker proxy) with IndexedDB cache
- Preview images: uploaded manually or auto-generated from ZIP's index.html via html2canvas
- 3D carousel display using Three.js (`TemplateTube/`)
- Protected preview via iframe with watermark injection

## API Routes Summary

All routes are prefixed with `/api/`. Key mount points from `server/index.js`:

| Prefix | Route File | Purpose |
|--------|-----------|---------|
| `/api/auth` | auth.js | Admin login, register, refresh, setup |
| `/api/client-auth` | clientAuth.js | Client login, register, refresh |
| `/api/clients` | clients.js | Client CRUD + notes, documents, tags |
| `/api/prospects` | prospects.js | Sales pipeline prospects |
| `/api/leads` | leads.js | Inbound leads |
| `/api/invoices` | invoices.js | Invoices + recurring + mark-paid |
| `/api/payments` | payments.js | Payment records |
| `/api/projects` | projects.js | Projects + tasks + milestones |
| `/api/appointments` | appointments.js | Scheduling + follow-up notes |
| `/api/audits` | audits.js | Business audits + scoring |
| `/api/portal` | portal.js | Client portal dashboard data |
| `/api/ai` | ai.js | Gemini AI endpoints |

## AI Provider Configuration

Three Seas Digital uses a **multi-provider AI abstraction** (like the existing `DB_PROVIDER` pattern for databases) to switch between different AI providers via the `AI_PROVIDER` env var:

### Provider Options

| Provider | Use Case | Quality | Speed | Cost | Setup |
|----------|----------|---------|-------|------|-------|
| **claude** | Complex analysis, SWOT, recommendations (best) | Excellent | Medium | Medium | API key |
| **gemini** | General tasks, default production | Excellent | Fast | Medium | API key |
| **ollama** | Local testing, offline dev | Good | Medium | Free | Local install |

### Production: Claude (Recommended for Complex Tasks)

Claude Opus excels at nuanced analysis and structured reasoning for client recommendations.

```bash
export AI_PROVIDER=claude
export ANTHROPIC_API_KEY=your-anthropic-api-key
export CLAUDE_MODEL=claude-opus-4-6  # or -sonnet-4-6, -haiku-4-5
cd server && node index.js
```

**Model choices:**
- `claude-opus-4-6` — Best for complex business analysis (slowest, most capable)
- `claude-sonnet-4-6` — Balanced speed/quality (recommended)
- `claude-haiku-4-5` — Fast, cheap (good for high-volume simple tasks)

### Production: Google Gemini

```bash
export AI_PROVIDER=gemini
export GEMINI_API_KEY=your-gemini-api-key
cd server && node index.js
```

### Development: Ollama (Local)

1. **Install Ollama:** https://ollama.ai
2. **Run locally:**
   ```bash
   ollama pull mistral        # Download model (first time only)
   ollama serve               # Start Ollama server on :11434
   ```
3. **Configure environment:**
   ```bash
   export AI_PROVIDER=ollama
   export OLLAMA_BASE_URL=http://localhost:11434
   export OLLAMA_MODEL=mistral
   cd server && node index.js
   ```

Or use the pre-configured `.env.ollama` file:
```bash
cp .env.ollama .env && npm run dev
```

### How It Works

- Routes (`server/routes/ai.ts`, `server/routes/aiRecommendations.ts`) import 3 functions from `server/utils/ai.js`:
  - `generateContent(prompt, systemInstruction, model)` — text generation
  - `generateChat(messages, systemInstruction, model)` — multi-turn conversation
  - `generateJSON(prompt, systemInstruction, model)` — structured JSON output

- `server/utils/ai.js` checks `process.env.AI_PROVIDER` and routes to:
  - `'claude'` → Anthropic SDK
  - `'gemini'` → Google Gemini SDK
  - `'ollama'` → HTTP POST requests to local API

- **No route changes needed** — all routes use the same function signatures regardless of provider

### Benefits

- **Production quality:** Claude Opus for complex analysis, Gemini for general tasks
- **Dev iteration:** Ollama runs locally, offline, with no API quota burn
- **Testing:** Instantly switch providers without code changes
- **Cost control:** Use Haiku for low-complexity tasks, save Opus for complex analysis

## Common Commands

```bash
npx vite build                    # Verify frontend builds cleanly
node --check server/routes/X.js   # Syntax-check a route file
npm run dev                       # Start Vite dev server
cd server && node index.js        # Start API server
```

## Things to Watch For

- **Never use `insertId`** from query results — VARCHAR PKs mean insertId is always 0. Always `generateId()` before INSERT.
- **Scroll restoration:** SPA pages need `window.scrollTo(0, 0)` in their mount useEffect.
- **GSAP cleanup:** Always `ctx.revert()` in useEffect cleanup to prevent memory leaks.
- **Light theme:** WebGL shaders use `u_lightMode` uniform (0.0 or 1.0). CSS uses `:root.light-theme` selector.
- **Template storage:** Uses R2 → IndexedDB cascade. Functions: `getTemplateZip()`, `getTemplateImage()`, `storeTemplateImage()`.
- **The existing `CLAUDE_CODE_INSTRUCTIONS.md` is outdated** — it describes a Supabase-only / TypeScript / Stripe architecture that was never implemented. THIS file (`CLAUDE.md`) is the authoritative reference.
