# MSS Sentinel — Market Sentiment Score

> "Be greedy when others are fearful, be fearful when others are greedy."
> A contrarian market sentiment monitor using VIX + CNN Fear & Greed.

## Architecture

```
backend/    NestJS — cron job, PostgreSQL, Telegram alerts  → deploy on Render
frontend/   Next.js — Bloomberg Terminal dashboard           → deploy on Vercel
```

## Quick Start (local)

### 1. Backend
```bash
cd backend
cp .env.example .env
# Edit .env — add FRED_API_KEY and optionally TELEGRAM_BOT_TOKEN
npm install
npm run start:dev
# → http://localhost:3001/api/mss/current
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env
# Set NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev
# → http://localhost:3000
```

## How to get your FRED API key (free)
1. Go to https://fred.stlouisfed.org/docs/api/api_key.html
2. Register for free
3. Copy your API key to FRED_API_KEY in backend/.env

## How to set up Telegram alerts
1. Open Telegram → search @BotFather → `/newbot`
2. Copy the bot token → TELEGRAM_BOT_TOKEN
3. Send a message to your bot
4. Open: `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. Find `chat.id` → TELEGRAM_CHAT_ID
6. Set TELEGRAM_ENABLED=true

## API Endpoints
- `GET /api/mss/current` — current MSS reading (used by KWGT widget)
- `GET /api/mss/history?days=30` — history for charts
- `GET /api/mss/health` — health check for Render

## KWGT Widget Setup
1. Install KWGT Pro on Android
2. Create widget → Add Text → Formula:
   `$tc(http("https://your-backend.onrender.com/api/mss/current"), "mss")$`
3. Set refresh interval: 30 minutes
4. See mss-app/kwgt-guide.md for full setup

## Run Unit Tests
```bash
cd backend
npm test
# → 5 spec scenarios verified + zone boundaries
```

## Deploy to Render + Vercel
1. Push to GitHub
2. Render: New → Web Service → connect repo → select `backend/` folder
3. Add env vars (FRED_API_KEY, TELEGRAM_* etc)
4. Render: New → PostgreSQL → name it `mss-db`
5. Vercel: New Project → connect repo → select `frontend/` folder
6. Add env var: NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
