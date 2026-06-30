# MDC Capital Holdings

Modern website for [MDC Capital Holdings](https://mdccapitalholdings.com) — an operating holdings company that builds, acquires, and grows small businesses and digital platforms.

Includes a **market sentiment dashboard** and **algorithmic trading intelligence layer** (research signals only — no automatic trade execution).

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4

## Getting Started

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port shown in the terminal).

## Pages

### Public
- `/` — Home
- `/strategy` — Our Strategy
- `/portfolio` — Portfolio
- `/operating-platform` — Operating Platform
- `/about` — About
- `/contact` — Contact

### Authenticated (login required)
- `/dashboard` — Market sentiment (movers, 24 hr, week, month)
- `/intelligence` — Trading intelligence dashboard (BUY / WATCH / AVOID signals)
- `/intelligence/[symbol]` — Ticker detail with technicals, value-to-risk, strategies
- `/intelligence/scanner` — Filter by strategy, score, and bias
- `/intelligence/watchlist` — Saved tickers and recommendation history
- `/intelligence/settings` — Weights, risk tolerance, filters

## Intelligence Layer

The recommendation engine combines:

- **Sentiment** — 24 hr, 1-week, and 1-month scores from your existing sentiment pipeline
- **Technical indicators** — VWAP, EMA/SMA, RSI, MACD, Bollinger Bands, ATR
- **13 strategy modules** — Opening range breakout, VWAP reversion/trend, MA crossover, gap-and-go, and more
- **Value-to-risk** — Entry zone, stop loss, upside target, and ratio

Outputs are labeled **algorithmic research, not financial advice**. No trades are executed unless paper trading is explicitly enabled later (Phase 3).

### API Routes (authenticated)

| Route | Description |
|-------|-------------|
| `GET /api/recommendations` | Universe analysis + dashboard aggregates |
| `GET /api/recommendations/[symbol]` | Single ticker recommendation |
| `GET /api/strategies/scan` | Filter by strategy, score, bias |
| `GET/POST/DELETE /api/watchlist` | Watchlist management |
| `GET /api/market-data?symbol=` | Raw market data + technicals |
| `GET /api/analyze/[symbol]` | Full analysis payload |
| `GET /api/risk-assessment?symbol=` | Value-to-risk summary |
| `GET/PUT /api/intelligence/settings` | User intelligence preferences |

## Environment Variables

Copy `.env.example` to `.env.local` for local development. On Vercel, add the same variables in **Project Settings → Environment Variables**.

| Variable | Required | Description |
|----------|----------|-------------|
| `SESSION_SECRET` | Yes | Random string for session cookies |
| `ADMIN_EMAIL` | Yes | Login email |
| `ADMIN_PASSWORD` | Yes | Login password |
| `FINNHUB_API_KEY` | Recommended | Finnhub sentiment/news |
| `ALPHA_VANTAGE_API_KEY` | Recommended | Alpha Vantage sentiment |
| `ALPACA_API_KEY` | Optional | Alpaca market data |
| `ALPACA_SECRET_KEY` | Optional | Alpaca secret |
| `ALPACA_BASE_URL` | Optional | Default: `https://data.alpaca.markets` |
| `ALPACA_DATA_FEED` | Optional | Default: `iex` |
| `DATABASE_URL` | Optional | Future Postgres (file store used now) |
| `NEXT_PUBLIC_APP_URL` | Optional | Production URL |
| `OPENAI_API_KEY` | Optional | LLM explanations (templates used by default) |

**Never commit `.env.local` or real API keys to git.**

## Editing Portfolio Companies

Portfolio companies are defined in `src/data/site.ts`. Update the `portfolioCompanies` array to add, remove, or edit companies.

## Deploy (Vercel)

```bash
npm run build
vercel deploy --prod
```

Ensure all required environment variables are set in the Vercel dashboard before deploying. Watchlist and settings persist to `data/intelligence/store.json` on the server filesystem (ephemeral on serverless — migrate to `DATABASE_URL` for production persistence).

## Disclaimer

All trading intelligence outputs are for **algorithmic research purposes only**. They do not constitute financial advice. Past performance does not guarantee future results. MDC Capital Holdings does not execute live trades through this application by default.
