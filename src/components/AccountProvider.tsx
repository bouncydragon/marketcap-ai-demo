"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Plan } from "@/lib/auth";

type AccountValue = {
  email: string;
  plan: Plan;
  watchlist: string[];
  /** Resolves to null on success, or an error code from the API. */
  add: (symbol: string) => Promise<string | null>;
  remove: (symbol: string) => Promise<void>;
};

const AccountContext = createContext<AccountValue | null>(null);

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used inside <AccountProvider>");
  return ctx;
}

export function AccountProvider({ email, plan, initialWatchlist, children }: { email: string; plan: Plan; initialWatchlist: string[]; children: ReactNode }) {
  const [watchlist, setWatchlist] = useState(initialWatchlist);

  const add = useCallback(async (symbol: string) => {
    try {
      const res = await fetch("/api/watchlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ symbol }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return (data.error as string) ?? "save_failed";
      setWatchlist((w) => (w.includes(symbol) ? w : [...w, symbol]));
      return null;
    } catch {
      return "network";
    }
  }, []);

  const remove = useCallback(async (symbol: string) => {
    setWatchlist((w) => w.filter((s) => s !== symbol)); // optimistic
    const res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) setWatchlist((w) => (w.includes(symbol) ? w : [...w, symbol])); // roll back
  }, []);

  const value = useMemo(() => ({ email, plan, watchlist, add, remove }), [email, plan, watchlist, add, remove]);
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}
