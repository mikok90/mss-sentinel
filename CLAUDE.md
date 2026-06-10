# MSS Sentinel — Claude Memory

## Project Overview
**MSS Sentinel** — Contrarian market sentiment monitor that scores market fear/greed and signals buy/trim actions.

- **Repo**: https://github.com/mikok90/mss-sentinel.git (`origin/master`)
- **Deploy**: Render (auto-deploys on push to `master`)
  - Backend: `mss-sentinel-backend` (Node/NestJS, free plan)
  - DB: `mss-sentinel-db` (PostgreSQL, free plan)
  - Frontend: Next.js (deployed separately or via Render static)

## Stack
- **Frontend**: Next.js 15, React, Recharts — `frontend/`
- **Backend**: NestJS, TypeORM, SQLite (local) / PostgreSQL (prod) — `backend/`
- **Deploy config**: `render.yaml` at root

## MSS Formula
```
V   = (VIX − 12) / (40 − 12) × 100
FG  = 100 − Fear&Greed
MSS = 0.70 × V + 0.30 × FG
```
- VIX weight: 70%, F&G weight: 30%
- Updates every 30 minutes via cron

## Zone Ranges
| Range  | Zone        | Action                     |
|--------|-------------|----------------------------|
| 95–100 | TOTAL PANIC | Deploy 80% of cash         |
| 85–94  | HIGH FEAR   | Deploy 50% of cash         |
| 65–84  | FEAR        | Deploy 25% of cash         |
| 40–64  | NEUTRAL     | HOLD — do nothing          |
| 20–39  | GREED       | Trim 15% of portfolio      |
| 0–19   | HIGH GREED  | Trim 25% of portfolio      |

## Key Frontend Files
- `frontend/src/app/page.tsx` — Main dashboard layout
- `frontend/src/components/MssGauge.tsx` — Semicircle gauge
- `frontend/src/components/ZoneDisplay.tsx` — Zone badge + action signal
- `frontend/src/components/MssHistory.tsx` — 30-day history area chart (Recharts)
- `frontend/src/types/mss.ts` — Shared TypeScript types

## Layout Structure
- **Left column**: Gauge (MSS score) → VIX & F&G index cards → Timestamps → Formula breakdown
- **Right column**: Zone + Action signal → 30-day history chart → Decision matrix table

## History Chart Reference Lines (`MssHistory.tsx`)
Reference lines at: 95 (T.PANIC), 85 (H.FEAR), 65 (FEAR), 40 (NEUTRAL), 20 (GREED), 19 (H.GREED)

## Workflow
1. Edit frontend files
2. `cd frontend && npm run build` — verify no errors
3. `git add ... && git commit && git push origin master`
4. Render auto-deploys on push

## Android Widget
- `/widget` route (`frontend/src/app/widget/route.ts`) — ultra-compact HTML for KWGT widget
- Guide: `kwgt-guide.md`

## Stability Rule
- Zone change requires 2 consecutive readings in the new zone before confirming
- State (`displayedZone`, `previousRawZone`) rehydrated from DB on startup (survives restarts)
- `getCurrent()` returns the last **confirmed** zone when latest is unconfirmed
- `pendingZone` field shows the unconfirmed zone label (or null)

## Keep-Alive (Render Free Tier)
- `backend/src/keep-alive.service.ts` — self-pings `/api/mss/health` every 10 min
- Prevents Render free tier from spinning down after 15 min inactivity
- Requires `RENDER_EXTERNAL_URL` env var (set in `render.yaml`)

## Bug Fixes Applied (2026-06-10)
- BUG 1: `getLastValidReading()` now applies age filter (`MoreThan(since)`)
- BUG 2: Stability state rehydrated from DB on startup
- BUG 3: `getCurrent()` returns confirmed zone + `pendingZone` field
- BUG 4: KWGT widget colors match backend zone enum
- BUG 5: Secrets removed from `render.yaml` (`sync: false`) — set in Render dashboard only
- BUG 6: `nextUpdate` uses `CRON_INTERVAL_MINUTES` env var
- BUG 8: History days clamped to max 365
- BUG 10: Health endpoint queries latest reading directly (not age-filtered)
- BUG 11: Frontend fetches have 15s timeout (`AbortSignal.timeout`)

## Environment Variables (Render)
- `FRED_API_KEY` — VIX data (set in Render dashboard, NOT in render.yaml)
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` — alert notifications (dashboard only)
- `TELEGRAM_ENABLED=true`
- `RENDER_EXTERNAL_URL` — backend public URL (for keep-alive self-ping)
- `CRON_INTERVAL_MINUTES` — cron frequency (default 30)
- `MAX_DATA_AGE_HOURS` — cache staleness limit (default 24)
- Zone/action thresholds configurable via env vars
- **Secrets must be set in Render dashboard, NOT in `render.yaml`**
