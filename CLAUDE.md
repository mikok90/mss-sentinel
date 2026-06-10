# MSS Sentinel v2 — Claude Memory

## Project Overview
**MSS Sentinel v2 "Discipline Engine"** — Contrarian market sentiment monitor that scores market fear/greed. Never sells index funds. Deploy signals require SPX drawdown confirmation. Once-per-cycle alerts.

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

## v2 Core Principles
1. **Never sell index funds.** Greed zones → REVIEW (check satellites only)
2. **DCA continues** every month regardless of zone
3. **SPX drawdown gate** — deploy zones require SPX confirmation before buying
4. **Target allocation**: ΔΕΙΚΤΗΣ 70% | ΚΟΛΟΣΣΟΣ 20% | RISKY 10%
5. **No position >10%** of total portfolio

## Zone Ranges (v2)
| Range  | Zone        | Action              | SPX Drawdown |
|--------|-------------|---------------------|--------------|
| 95–100 | TOTAL PANIC | Ανάπτυξε 80%       | ≥15%         |
| 85–94  | HIGH FEAR   | Ανάπτυξε 50%       | ≥8%          |
| 65–84  | FEAR        | Ανάπτυξε 25%       | ≥3%          |
| 40–64  | NEUTRAL     | Κράτα              | —            |
| 20–39  | GREED       | Έλεγξε δορυφόρους  | —            |
| 0–19   | HIGH GREED  | Έλεγξε δορυφόρους  | —            |

## ActionType: DEPLOY | REVIEW | HOLD
- `TRIM` removed in v2 — greed zones use `REVIEW` with `actionPercent: null`
- `actionType` in API: `'buy' | 'review' | null` (was `'buy' | 'sell' | null`)

## SPX Drawdown Gate
- `getDrawdownOverride(zone, drawdownPct)` in `mss.calculator.ts`
- Deploy zones blocked if SPX drawdown < threshold
- Thresholds: HIGH_FEAR ≥3%, TOTAL_PANIC ≥8%, EXTREME_PANIC ≥15%
- SPX data fetched from Yahoo Finance (non-fatal — null if unavailable)

## Cycle State
- `cycle_state` table (single-row, id=1): `alertedTiers`, `cycleHighWatermark`
- Each deploy tier alerts Telegram **once per cycle**
- Cycle resets when SPX is within 0.5% of 52-week high

## Key Frontend Files
- `frontend/src/app/page.tsx` — Main dashboard layout
- `frontend/src/app/katanomi/page.tsx` — Allocation Tracker page
- `frontend/src/components/MssGauge.tsx` — Semicircle gauge
- `frontend/src/components/ZoneDisplay.tsx` — Zone badge + action signal
- `frontend/src/components/MssHistory.tsx` — 30-day history area chart (Recharts)
- `frontend/src/components/StrategyPanel.tsx` — Collapsible discipline principles
- `frontend/src/types/mss.ts` — Shared TypeScript types

## Key Backend Files
- `backend/src/mss/mss.calculator.ts` — Pure functions, zone logic, drawdown override
- `backend/src/mss/mss.service.ts` — Readings, stability, cycle state, SPX integration
- `backend/src/mss/cycle-state.entity.ts` — Cycle tracking entity
- `backend/src/data-sources/spx.service.ts` — S&P 500 data from Yahoo Finance
- `backend/src/positions/` — Positions CRUD module (entity, service, controller, module)
- `backend/src/mss/monthly-cron.service.ts` — Monthly discipline reminder (1st of month 08:00 UTC)

## Layout Structure
- **Left column**: Gauge (MSS score) → VIX & F&G index cards → Timestamps → Formula breakdown
- **Right column**: Zone + Action signal → Strategy Panel → 30-day history chart → Decision matrix table

## Positions CRUD
- `GET /api/positions` — list all
- `POST /api/positions` — create `{ name, value, category }`
- `PATCH /api/positions/:id` — update
- `DELETE /api/positions/:id` — remove
- Categories: ΔΕΙΚΤΗΣ, ΚΟΛΟΣΣΟΣ, RISKY

## History Chart Reference Lines (`MssHistory.tsx`)
Reference lines at: 95 (T.PANIC), 85 (H.FEAR), 65 (FEAR), 40 (NEUTRAL), 20 (GREED), 19 (H.GREED)

## Workflow
1. Edit files
2. `cd backend && npm run build` — verify no errors
3. `cd frontend && npm run build` — verify no errors
4. `git add ... && git commit && git push origin master`
5. Render auto-deploys on push

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
- BUG 5: Secrets removed from `render.yaml` (`sync: false`) — tokens rotated 2026-06-10
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
- `SPX_DRAWDOWN_HIGH_FEAR_PCT=3` — min SPX drawdown for FEAR deploy
- `SPX_DRAWDOWN_TOTAL_PANIC_PCT=8` — min SPX drawdown for HIGH FEAR deploy
- `SPX_DRAWDOWN_EXTREME_PANIC_PCT=15` — min SPX drawdown for TOTAL PANIC deploy
- Zone/action thresholds configurable via env vars
- **Secrets must be set in Render dashboard, NOT in `render.yaml`**
