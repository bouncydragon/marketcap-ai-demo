# MarketCap

A stock investing dashboard with live prices, market news, a portfolio view and a private, paid watchlist. Built with Next.js, Supabase and Stripe (sandbox).

## Features

- **Dashboard:** portfolio value, daily P/L, monthly return, estimated dividends and a beta-based risk score, all computed from live quotes.
- **Performance vs benchmarks:** today's % change for your portfolio against the S&P 500 and Nasdaq (via SPY and QQQ), built from live price updates.
- **Holdings, allocation, top movers and market news** from Finnhub.
- **Paper-trading ticket:** positions are saved in the browser (no real orders).
- **Accounts:** email and password sign-in with Supabase Auth.
- **Watchlist:** a private list of up to 10 stocks per user. Saving requires the Pro plan, enforced by Postgres row-level security rather than only in the UI.
- **Pricing and billing:** Free and Pro ($20/month) plans, Stripe Checkout and the customer portal, with a sandbox test page at `/billing/test`.
- **Light and dark themes**, responsive down to small phones.

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Supabase (Auth, Postgres, RLS) · Stripe · Finnhub market data.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

### Environment variables

| Variable | Where to get it |
| --- | --- |
| `FINNHUB_API_KEY` | [finnhub.io/dashboard](https://finnhub.io/dashboard) (free tier works) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase: Project Settings, API |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page. **Secret**: server only, it bypasses row-level security |
| `STRIPE_SECRET_KEY` | Stripe **test** key (`sk_test_…`). Live keys are refused |
| `STRIPE_WEBHOOK_SECRET` | From `stripe listen` (optional locally; see below) |

Never commit `.env.local`. It is git-ignored.

### Database

Apply the SQL in [`supabase/migrations`](supabase/migrations) to your Supabase project, in order (SQL editor, or the Supabase CLI). It creates `subscriptions` and `watchlist_items` with row-level security. Turn off **Confirm email** under Authentication, Sign In / Providers, Email if you want sign-up to work without an inbox while testing.

### Stripe sandbox

```bash
npm run stripe:setup   # creates the $20/month product, price and customer portal (test mode only)
npm run check:setup    # read-only check that your keys work
```

Sign up, then open `/billing/test` and pay with `4242 4242 4242 4242` (any future expiry, any CVC). The first payment is recorded when Stripe redirects back. To keep renewals and cancellations in sync, forward webhooks and set `STRIPE_WEBHOOK_SECRET`:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run stripe:setup` | Create the Stripe test product and price |
| `npm run check:setup` | Verify Stripe and Supabase keys |

## Notes and limits

- Finnhub's free tier allows about 60 calls a minute, so prices poll every 15 seconds, the watchlist polls every 30, and the watchlist is capped at 10 stocks. Historical candles are not on the free tier, so charts are built from live updates.
- Data routes require a signed-in user so the market-data key can't be drained by anonymous traffic.
- Billing is sandbox-only by design. Taking real payments needs a deliberate change (live keys, a registered webhook endpoint, and removing the test-key guard).
