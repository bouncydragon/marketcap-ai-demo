"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Metrics } from "@/lib/finnhub";

const MetricsContext = createContext<Record<string, Metrics>>({});
export const useMetrics = () => useContext(MetricsContext);

const REFRESH_MS = 3_600_000; // fundamentals change slowly; the server also caches for an hour

export function MetricsProvider({ symbols, children }: { symbols: string[]; children: ReactNode }) {
  const [metrics, setMetrics] = useState<Record<string, Metrics>>({});
  const key = symbols.join(",");

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch(`/api/metrics?symbols=${encodeURIComponent(key)}`, { signal: controller.signal });
        if (res.status === 503) return; // no API key: stay empty
        if (res.ok) {
          const data = await res.json();
          if (!stopped) setMetrics(data.metrics);
        }
      } catch {
        /* keep whatever we have */
      }
      if (!stopped) timer = setTimeout(load, REFRESH_MS);
    }
    load();
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [key]);

  return <MetricsContext.Provider value={metrics}>{children}</MetricsContext.Provider>;
}
