# Three Seas Digital — Deployment & Installation Guide

## Prerequisites

- Node.js 18+
- npm
- GitHub account
- Cloudflare account (free tier works)

---

## Local Development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

---

## Cloudflare R2 Storage Setup

Template ZIP files and images are stored in Cloudflare R2. Follow these steps to set up cloud storage.

### 1. Install Wrangler CLI

```bash
npm i -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

This opens your browser for authentication. Click "Allow".

### 3. Get Your Account ID

```bash
wrangler whoami
```

Copy the Account ID and paste it into `cloudflare-worker/wrangler.toml` on the `account_id` line.

### 4. Create the R2 Bucket

```bash
cd cloudflare-worker
wrangler r2 bucket create template-storage
```

### 5. Deploy the Worker

```bash
npx wrangler deploy
```

This gives you a URL like `https://threeseas-template-storage.<your-subdomain>.workers.dev`.

### 6. Set the API Key Secret

```bash
wrangler secret put R2_API_KEY
```

When prompted, enter a strong random password. **Remember this value** — you'll need it for the admin panel.

### 7. Configure in Admin Panel

1. Start the app (`npm run dev`)
2. Go to `/admin` → **Templates Manager** tab
3. Click the **Cloud Storage** bar (says "Local Only")
4. Enter your **Worker URL** (from step 5)
5. Enter your **API Key** (the password from step 6)
6. Toggle **Enable R2 Cloud Storage** on
7. Click **Test Connection** — should say "Connected"
8. Click **Save Settings**

---

## Production Deployment

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Connect Cloudflare Pages to GitHub

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Select your GitHub repository
4. Set build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Click **Deploy**

Every future push to `main` will auto-deploy.

### 3. Custom Domain (Optional)

1. In Cloudflare Pages → your project → **Custom domains**
2. Add your domain
3. If your domain's DNS is already on Cloudflare, it connects automatically

### 4. Lock Down the Worker

1. Go to **Workers** → `threeseas-template-storage` → **Settings** → **Variables**
2. Add variable: `ALLOWED_ORIGIN` = `https://your-domain.com` (or your `.pages.dev` URL)
3. This restricts R2 access to only your site

---

## Architecture Overview

```
GitHub repo → Cloudflare Pages (auto-deploy on push)
                  ↓
            Static site (React + Vite)
                  ↓
         Cloudflare Worker (API proxy)
                  ↓
            Cloudflare R2 (template ZIP + image storage)
```

- **Frontend**: React + Vite, served as static files from Cloudflare Pages
- **Storage**: Cloudflare R2 for template ZIPs and images, with IndexedDB as local cache
- **Auth**: Worker validates requests with `X-API-Key` header
- **Data**: All app data (clients, invoices, etc.) stored in browser localStorage
- **No backend server required**

---

## Environment Notes

- R2 settings (Worker URL, API key) are stored in the browser's localStorage
- Template ZIPs and images use a dual-layer storage: R2 (cloud) + IndexedDB (local cache)
- Without R2 configured, everything falls back to IndexedDB-only (works offline)
- The Worker enforces a 50MB max upload size per file
