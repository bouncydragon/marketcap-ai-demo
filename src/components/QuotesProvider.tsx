"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { MarketStatus, Quote } from "@/lib/finnhub";

export type FeedState = "loading" | "live" | "demo" | "error";
export type Tick = { t: number; p: number };

type QuotesValue = {
  quotes: Record<string, Quote>;
  /** Prices observed while this page has been open (Finnhub's free tier has no candle history). */
  history: Record<string, Tick[]>;
  market: MarketStatus | null;
  state: FeedState;
  updatedAt: number | null;
};

const empty: QuotesValue = { quotes: {}, history: {}, market: null, state: "loading", updatedAt: null };
const QuotesContext = createContext<QuotesValue>(empty);

export const useQuotes = () => useContext(QuotesContext);

const POLL_MS = 15_000; // 10 symbols per poll stays under Finnhub's free-tier rate limit
const MAX_TICKS = 720; // ~3 hours at 15s

export function QuotesProvider({ symbols, children }: { symbols: string[]; children: ReactNode }) {
  const [value, setValue] = useState<QuotesValue>(empty);
  const key = symbols.join(",");

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    let stopped = false;

    async function tick() {
      if (stopped) return;
      if (document.hidden) return schedule(); // don't burn quota in background tabs
      controller = new AbortController();
      try {
        const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(key)}`, { signal: controller.signal });
        if (res.status === 503) {
          setValue((v) => ({ ...v, state: "demo" })); // no API key configured
          return; // nothing to poll
        }
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        const quotes = data.quotes as Record<string, Quote>;
        const at = data.fetchedAt as number;
        setValue((v) => {
          const history = { ...v.history };
          for (const [sym, q] of Object.entries(quotes)) {
            const prev = history[sym] ?? [];
            history[sym] = [...prev, { t: at, p: q.price }].slice(-MAX_TICKS);
          }
          return { quotes: { ...v.quotes, ...quotes }, history, market: data.status, state: "live", updatedAt: at };
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setValue((v) => ({ ...v, state: v.updatedAt ? v.state : "error" })); // keep last good data
      }
      schedule();
    }
    function schedule() {
      if (!stopped) timer = setTimeout(tick, POLL_MS);
    }
    const onVisible = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        tick();
      }
    };

    tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [key]);

  return <QuotesContext.Provider value={value}>{children}</QuotesContext.Provider>;
}
