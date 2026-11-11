import type { Metrics, Quote } from "./finnhub";
import type { Position } from "./market";

export type HoldingRow = {
  symbol: string;
  shares: number;
  price: number;
  prevClose: number;
  open: number;
  value: number;
  dayChange: number; // dollars
  dayPct: number;
  weight: number; // percent of portfolio
};

export type Stats = {
  /** True once every held position has a live quote. */
  live: boolean;
  rows: HoldingRow[];
  value: number;
  prevValue: number;
  openValue: number;
  dayChange: number;
  dayPct: number;
  ytd: number | null;
  mtd: number | null;
  beta: number | null;
  annualDividends: number | null;
};

/** Value-weighted average of a metric over the positions that have it. */
function weighted(rows: HoldingRow[], metrics: Record<string, Metrics>, pick: (m: Metrics) => number | null) {
  let num = 0;
  let den = 0;
  for (const r of rows) {
    const v = metrics[r.symbol] ? pick(metrics[r.symbol]) : null;
    if (v === null) continue;
    num += r.value * v;
    den += r.value;
  }
  return den ? num / den : null;
}

export function computeStats(positions: Position[], quotes: Record<string, Quote>, metrics: Record<string, Metrics>): Stats {
  const held = positions.filter((p) => p.shares > 0);
  const live = held.length > 0 && held.every((p) => quotes[p.symbol]);

  const rows: HoldingRow[] = live
    ? held.map((p) => {
        const q = quotes[p.symbol];
        return {
          symbol: p.symbol,
          shares: p.shares,
          price: q.price,
          prevClose: q.prevClose,
          open: q.open,
          value: p.shares * q.price,
          dayChange: p.shares * q.change,
          dayPct: q.changePercent,
          weight: 0,
        };
      })
    : [];

  const value = rows.reduce((s, r) => s + r.value, 0);
  for (const r of rows) r.weight = value ? (r.value / value) * 100 : 0;
  rows.sort((a, b) => b.value - a.value);

  const prevValue = rows.reduce((s, r) => s + r.shares * r.prevClose, 0);
  const openValue = rows.reduce((s, r) => s + r.shares * r.open, 0);
  const dayChange = value - prevValue;

  const withDiv = rows.filter((r) => metrics[r.symbol]?.dividendPerShare != null);
  return {
    live,
    rows,
    value,
    prevValue,
    openValue,
    dayChange,
    dayPct: prevValue ? (dayChange / prevValue) * 100 : 0,
    ytd: weighted(rows, metrics, (m) => m.ytd),
    mtd: weighted(rows, metrics, (m) => m.mtd),
    beta: weighted(rows, metrics, (m) => m.beta),
    annualDividends: withDiv.length ? withDiv.reduce((s, r) => s + r.shares * (metrics[r.symbol].dividendPerShare ?? 0), 0) : null,
  };
}

export const betaLabel = (b: number) => (b < 0.8 ? "Low beta" : b <= 1.2 ? "Moderate beta" : "High beta");
