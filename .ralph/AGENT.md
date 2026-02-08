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
├── index.css            # ALL styles (332 KB — needs splitting)
├── components/
│   ├── Navbar.jsx       # Main site navigation
│   ├── Footer.jsx       # Site footer (uses SITE_INFO)
│   └── Calendar.jsx     # Shared date picker
├── context/
│   └── AppContext.jsx   # Global state (85+ exports, 15 localStorage keys)
└── pages/
    ├── Home.jsx         # Marketing landing page
    ├── About.jsx        # Team & values
    ├── Portfolio.jsx    # Tier selection grid
    ├── PortfolioLanding.jsx  # 4 demo sites (50 KB)
    ├── Contact.jsx      # Booking form with calendar
    ├── ClientSignup.jsx # Client portal (52 KB)
    ├── Admin.jsx        # CRM dashboard (494 KB — needs splitting)
    ├── Register.jsx     # Staff registration
    └── NotFound.jsx     # 404 page
```

## Notes
- `npm run build` is the primary validation — run after every change
- Dev server auto-reloads on save
- No unit test framework is set up — `npm test` will fail
- Recharts is only used in Admin.jsx
