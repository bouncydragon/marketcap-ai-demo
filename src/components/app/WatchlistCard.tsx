"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import type { Quote } from "@/lib/finnhub";
import { signedPct, usd } from "@/lib/format";
import { watchlist as known } from "@/lib/market";
import { IconSearch } from "./Icons";

const LIMIT = 10;
const POLL_MS = 30_000; // slower than the main feed: keeps total calls inside the free tier

const ERRORS: Record<string, string> = {
  upgrade_required: "Saving stocks is a Pro feature.",
  already_saved: "That stock is already on your watchlist.",
  limit_reached: `Your watchlist is full (${LIMIT} stocks). Remove one to add another.`,
  unknown_symbol: "We couldn't find that ticker.",
  invalid_symbol: "Enter a valid ticker, like AAPL.",
  network: "Network error. Please try again.",
};

type Match = { symbol: string; name: string };

function useWatchQuotes(symbols: string[]) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const key = symbols.join(",");

  useEffect(() => {
    if (!key) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(key)}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (!stopped) setQuotes((q) => ({ ...q, ...data.quotes }));
        }
      } catch {
        /* keep last prices */
      }
      if (!stopped) timer = setTimeout(load, POLL_MS);
    }
    load();
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [key]);

  return quotes;
}

export function WatchlistCard() {
  const { plan, watchlist, add, remove } = useAccount();
  const quotes = useWatchQuotes(watchlist);
  const isPro = plan === "pro";

  const [text, setText] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  // Debounced symbol search.
  useEffect(() => {
    const q = text.trim();
    if (!isPro || q.length < 1) return;
    const id = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (id === seq.current) setMatches(data.results ?? []);
      } catch {
        /* suggestions are optional */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [text, isPro]);

  const submit = async (symbol: string) => {
    const s = symbol.trim().toUpperCase();
    if (!s) return;
    setBusy(true);
    setError(null);
    const err = await add(s);
    setBusy(false);
    if (err) return setError(ERRORS[err] ?? "Couldn't save that stock. Please try again.");
    setText("");
    setMatches([]);
  };

  const shown = text.trim() ? matches : [];

  return (
    <section className="card wl">
      <header>
        <h3>My Watchlist</h3>
        <span className="chip">{watchlist.length}/{LIMIT}</span>
      </header>

      {!isPro ? (
        <div className="lock" role="note">
          <b>Saving stocks is part of the Pro plan</b>
          <span>Upgrade for $20/month to build a private watchlist.</span>
          <Link className="btn-primary sm" href="/pricing">See plans</Link>
        </div>
      ) : (
        <form className="wl-add" onSubmit={(e) => { e.preventDefault(); submit(text); }}>
          <label className="search-box">
            <IconSearch />
            <input value={text} onChange={(e) => { setText(e.target.value); if (!e.target.value.trim()) setMatches([]); setError(null); }} placeholder="Search stocks…" aria-label="Add a stock to your watchlist" maxLength={30} />
          </label>
          <button className="btn-primary sm" disabled={busy || !text.trim()}>{busy ? "Saving…" : "Add"}</button>
          {shown.length > 0 && (
            <ul className="suggest" role="listbox">
              {shown.map((m) => (
                <li key={m.symbol}>
                  <button type="button" onClick={() => submit(m.symbol)} disabled={watchlist.includes(m.symbol)}>
                    <b>{m.symbol}</b><span>{m.name}</span>
                    {watchlist.includes(m.symbol) && <em>Saved</em>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
      )}
      {error && <p className="form-msg err" role="alert">{error}{error === ERRORS.upgrade_required && <> <Link href="/pricing">See plans</Link></>}</p>}

      {watchlist.length === 0 ? (
        <p className="empty-row">{isPro ? "Nothing here yet. Search above to save your first stock." : "Your saved stocks will appear here."}</p>
      ) : (
        <ul className="wl-list">
          {watchlist.map((s) => {
            const q = quotes[s];
            const up = (q?.changePercent ?? 0) >= 0;
            return (
              <li key={s} className="wl-row">
                <span className="asset wl-asset">
                  <i style={{ background: known[s]?.color ?? "#5b6475" }}>{s[0]}</i>
                  <span><b>{s}</b><small>{known[s]?.name ?? "Saved stock"}</small></span>
                </span>
                <span className="wl-px">{q ? usd(q.price) : "—"}</span>
                <span className="wl-chg"><em className={`pl ${q ? (up ? "pos" : "neg") : ""}`}>{q ? signedPct(q.changePercent) : "—"}</em></span>
                <button className="x-btn" onClick={() => remove(s)} aria-label={`Remove ${s} from watchlist`} title="Remove">✕</button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
