"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { starterPositions, type Position } from "@/lib/market";
import { useStoredString } from "@/lib/use-stored-string";

const STORAGE_KEY = "marketcap.positions.v1";

type PortfolioValue = {
  positions: Position[];
  sharesOf: (symbol: string) => number;
  /** Paper trade: adjusts the saved position. Returns an error message, or null on success. */
  trade: (symbol: string, side: "buy" | "sell", shares: number) => string | null;
};

const PortfolioContext = createContext<PortfolioValue | null>(null);

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used inside <PortfolioProvider>");
  return ctx;
}

function parse(raw: string | null): Position[] {
  if (!raw) return starterPositions;
  try {
    const parsed = JSON.parse(raw) as Position[];
    if (Array.isArray(parsed)) return parsed.filter((p) => p && typeof p.symbol === "string" && p.shares >= 0);
  } catch {
    /* corrupted value: fall back to starter positions */
  }
  return starterPositions;
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [raw, save] = useStoredString(STORAGE_KEY);
  const positions = useMemo(() => parse(raw), [raw]);

  const sharesOf = useCallback((symbol: string) => positions.find((p) => p.symbol === symbol)?.shares ?? 0, [positions]);

  const trade = useCallback(
    (symbol: string, side: "buy" | "sell", shares: number) => {
      if (!Number.isFinite(shares) || shares <= 0) return "Enter a quantity greater than zero.";
      const held = sharesOf(symbol);
      if (side === "sell" && shares > held) return `You only hold ${held} ${symbol}.`;
      const delta = side === "buy" ? shares : -shares;
      const exists = positions.some((p) => p.symbol === symbol);
      const next = exists
        ? positions.map((p) => (p.symbol === symbol ? { ...p, shares: Math.round((p.shares + delta) * 1e6) / 1e6 } : p))
        : [...positions, { symbol, shares }];
      save(JSON.stringify(next));
      return null;
    },
    [positions, sharesOf, save],
  );

  const value = useMemo(() => ({ positions, sharesOf, trade }), [positions, sharesOf, trade]);
  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}
