export type StockMeta = { name: string; color: string };

/** Stocks the dashboard tracks. Finnhub's free tier allows ~60 calls/min, so keep this small. */
export const watchlist: Record<string, StockMeta> = {
  AAPL: { name: "Apple Inc.", color: "#111827" },
  MSFT: { name: "Microsoft", color: "#2bb8e6" },
  NVDA: { name: "Nvidia", color: "#76b900" },
  TSLA: { name: "Tesla", color: "#e5302a" },
  AMD: { name: "AMD", color: "#f2205a" },
  ADBE: { name: "Adobe", color: "#ee4b45" },
  UBER: { name: "Uber Technologies", color: "#374151" },
  KO: { name: "Coca-Cola", color: "#e8332e" },
};

export const watchSymbols = Object.keys(watchlist);

/** Benchmarks, tracked through their ETFs. */
export const benchmarks = {
  SPY: { name: "S&P 500", etf: "SPY" },
  QQQ: { name: "Nasdaq 100", etf: "QQQ" },
} as const;

export const benchmarkSymbols = Object.keys(benchmarks);

/** Everything we poll for quotes. */
export const allSymbols = [...watchSymbols, ...benchmarkSymbols];

export type Position = { symbol: string; shares: number };

/** Starter positions until portfolios are stored per user. */
export const starterPositions: Position[] = [
  { symbol: "AAPL", shares: 48 },
  { symbol: "MSFT", shares: 14 },
  { symbol: "NVDA", shares: 22 },
  { symbol: "TSLA", shares: 10 },
  { symbol: "AMD", shares: 18 },
  { symbol: "ADBE", shares: 36 },
  { symbol: "UBER", shares: 24 },
  { symbol: "KO", shares: 165 },
];
