# Security Status & Handoff — Railway Incident (started 2026-10-21)

> Working doc for the Oct 2026 Railway breach response + hardening. Contains **NO secret values**.
> Companion memory: `security-incident-2026-10.md`, `infrastructure-map.md`.

---

## ⏭️ NEXT SESSION — PICK UP HERE

1. **🔴 BLOCKED: Railway redeploy.** Builds were "Paused temporarily" (incident). The moment they resume → **Redeploy the `main` service**. That activates ALL staged changes at once:
   - new DB password (`SUPABASE_DB_URL`), new JWT secrets (→ everyone logged out, expected), Gemini removal, and the CORS fix (makes the frontend↔API console error disappear).
   - Then: re-test CORS + confirm app ↔ Neon health.
2. **Railway account 2FA** (+ review sessions/access tokens).
3. **Origin-lock the API to Cloudflare** — keystone. The API at `main-production-350f.up.railway.app` is directly exposed and bypasses all Cloudflare protection. Front it with `api.threeseasdigital.com` (also cleans up CORS).
4. Then: git-history secret scan → CSP review → `npm audit` → DMARC `p=none`→`quarantine`.

**Do NOT revert the Neon password to "fix" the current downtime — that re-exposes the leak. The downtime is expected until the redeploy.**

---

## 📋 Credential rotation — ✅ COMPLETE (staged, awaiting redeploy)

| Secret | Status | Action taken |
|--------|--------|--------------|
| `GEMINI_API_KEY` | ✅ | Revoked at Google AI Studio + **removed from Railway** → AI features now disabled |
| `GOOGLE_CLIENT_SECRET` | ✅ | Regenerated in Google Cloud Console → Railway |
| `JWT_SECRET` | ✅ | Fresh random value → Railway |
| `JWT_REFRESH_SECRET` | ✅ | Fresh random value → Railway |
| `SUPABASE_DB_URL` (Neon) | ✅ | Neon role password reset; new string → Railway. Post-reset audit CLEAN |
| `STRIPE_SECRET_KEY` | ✅ | Rolled in Stripe → Railway |
| `SMTP_PASS` | ✅ | `welcome@` mailbox password changed in cPanel → Railway |

**Not configured (nothing to do):** `ANTHROPIC_API_KEY`, `XAI_API_KEY`, `AI_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET`, `PAYPAL_*`, `EMAIL_API_KEY`. Cloudflare R2 keys live in the Worker, not Railway → unaffected.

## ☁️ Cloudflare hardening — ✅ DONE (verified externally)
- HSTS: `max-age=15552000` (6mo), subdomains/preload OFF ✅
- Min TLS 1.2 (TLS 1.0 rejected) ✅ · TLS 1.3 on · Always-Use-HTTPS 301 ✅
- `X-Content-Type-Options: nosniff` ✅
- Bot Fight Mode + Browser Integrity Check ✅
- **Leaked-Credential-Check** rate rule → Block, Active ✅
- SSL mode Full (Strict) ✅
- Plan = **Free** → only 1 rate-limit rule (used), no full managed WAF. Pro (~$20/mo) unlocks more.

## 🛡️ App-code security — reviewed
- Login rate limiting **already present** on `/api/auth/login` + `/api/client-auth/login` (`loginRateLimit(5,60000)`, `server/middleware/rateLimit.js`). Good. Caveats: in-memory/per-process; no `trust proxy` (keys on proxy IP → effectively per-username).
- JWT handling solid (`server/middleware/auth.js`): no prod secret fallback, hard-exits if unset.
- `.env` files correctly gitignored (none tracked).

## ⏳ Pending hardening (ranked) — see "PICK UP HERE" above
1. Railway redeploy (blocked) · 2. Railway 2FA · 3. API origin-lock to Cloudflare · 4. git-history secret scan · 5. CSP enforce/cleanup · 6. `npm audit` · 7. DMARC p=none→quarantine.
**Deferred:** Neon IP allowlist (needs Neon Scale + Railway Pro; currently Launch/Hobby — low value for 2 paid upgrades).

## 🐞 Open (non-security) issues
- **Outlook can't SEND from `admin@`** (webmail works fine → server OK). Fix path: SMTP **587/STARTTLS**, confirm "outgoing requires auth" ON, or it's a "new Outlook" third-party quirk (use webmail/classic Outlook). Email infra verified healthy: SPF/DKIM/DMARC set, server IP not blacklisted.
- **Report-only CSP `connect-src 'none'`** in browser console — report-only = harmless; likely a browser extension or Cloudflare. The real CSP (meta tag in `index.html`) is correct.

## Post-incident review (do once app is back)
- [ ] Stripe — unexpected API calls / charges
- [ ] Neon monitoring — connection spikes around the incident window
- [ ] Google Cloud — OAuth grants
- [ ] cPanel → Track Delivery — any unauthorized outbound from `welcome@`/`admin@`
- [ ] Confirm app healthy after redeploy
