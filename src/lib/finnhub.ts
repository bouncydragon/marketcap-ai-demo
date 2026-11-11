/**
 * Server-only Finnhub client. The API key never leaves the server: browsers call
 * our /api routes, which call Finnhub. Responses are cached in memory so many
 * viewers (and the 10s client poll) stay well inside the free tier's ~60 calls/min.
 */

const BASE = "https://finnhub.io/api/v1";

export type Quote = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  /** Unix seconds of the last trade */
  timestamp: number;
};

export type MarketStatus = { isOpen: boolean; session: string | null };

export type NewsItem = {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: number;
  related: string;
};

export class FinnhubError extends Error {
  constructor(
    public code: "missing_key" | "rate_limited" | "upstream" | "not_found",
    message: string,
  ) {
    super(message);
  }
}

type CacheEntry<T> = { expires: number; value?: T; pending?: Promise<T> };
const cache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();
  if (hit?.value !== undefined && hit.expires > now) return hit.value;
  if (hit?.pending) return hit.pending; // coalesce concurrent requests
  const pending = load()
    .then((value) => {
      cache.set(key, { expires: Date.now() + ttlMs, value });
      return value;
    })
    .catch((err) => {
      cache.delete(key);
      throw err;
    });
  cache.set(key, { expires: 0, pending });
  return pending;
}

// Accept the canonical name, or NEXT_FINNHUB_KEY. Neither is NEXT_PUBLIC_, so both stay server-side.
const apiKey = () => process.env.FINNHUB_API_KEY || process.env.NEXT_FINNHUB_KEY;

async function finnhub<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = apiKey();
  if (!key) throw new FinnhubError("missing_key", "FINNHUB_API_KEY is not set");
  const url = `${BASE}${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, {
    headers: { "X-Finnhub-Token": key },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 429) throw new FinnhubError("rate_limited", "Finnhub rate limit reached");
  if (!res.ok) throw new FinnhubError("upstream", `Finnhub responded ${res.status}`);
  return (await res.json()) as T;
}

export const hasApiKey = () => Boolean(apiKey());

export function getQuote(symbol: string): Promise<Quote> {
  return cached(`quote:${symbol}`, 10_000, async () => {
    const q = await finnhub<{ c: number; d: number | null; dp: number | null; h: number; l: number; o: number; pc: number; t: number }>(
      "/quote",
      { symbol },
    );
    // Finnhub answers 200 with all zeros for unknown symbols.
    if (!q.c && !q.pc) throw new FinnhubError("not_found", `No quote for ${symbol}`);
    return {
      symbol,
      price: q.c,
      change: q.d ?? 0,
      changePercent: q.dp ?? 0,
      high: q.h,
      low: q.l,
      open: q.o,
      prevClose: q.pc,
      timestamp: q.t,
    };
  });
}

export type Metrics = {
  symbol: string;
  beta: number | null;
  /** Month-to-date price return, percent */
  mtd: number | null;
  /** Year-to-date price return, percent */
  ytd: number | null;
  dividendPerShare: number | null;
  /** In millions of USD */
  marketCap: number | null;
  pe: number | null;
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Slow-moving fundamentals: cached for an hour so they barely touch the rate limit. */
export function getMetrics(symbol: string): Promise<Metrics> {
  return cached(`metrics:${symbol}`, 3_600_000, async () => {
    const r = await finnhub<{ metric?: Record<string, unknown> }>("/stock/metric", { symbol, metric: "all" });
    const m = r.metric ?? {};
    return {
      symbol,
      beta: num(m.beta),
      mtd: num(m.monthToDatePriceReturnDaily),
      ytd: num(m.yearToDatePriceReturnDaily),
      dividendPerShare: num(m.dividendPerShareAnnual),
      marketCap: num(m.marketCapitalization),
      pe: num(m.peTTM),
    };
  });
}

export function getMarketStatus(): Promise<MarketStatus> {
  return cached("market-status", 60_000, async () => {
    const s = await finnhub<{ isOpen: boolean; session: string | null }>("/stock/market-status", { exchange: "US" });
    return { isOpen: Boolean(s.isOpen), session: s.session ?? null };
  });
}

export function getMarketNews(category = "general"): Promise<NewsItem[]> {
  return cached(`news:${category}`, 120_000, async () => {
    const items = await finnhub<NewsItem[]>("/news", { category });
    return items.slice(0, 30);
  });
}

export type SymbolMatch = { symbol: string; name: string };

/** US-listed common stocks and ETFs matching a query; cached briefly to protect the rate limit. */
export function searchSymbols(query: string): Promise<SymbolMatch[]> {
  const q = query.trim().toUpperCase();
  return cached(`search:${q}`, 60_000, async () => {
    const r = await finnhub<{ result?: { symbol: string; description: string; type: string }[] }>("/search", { q });
    return (r.result ?? [])
      .filter((m) => /^[A-Z][A-Z0-9\-]{0,9}$/.test(m.symbol) && (m.type === "Common Stock" || m.type === "ETP"))
      .slice(0, 8)
      .map((m) => ({ symbol: m.symbol, name: m.description }));
  });
}
