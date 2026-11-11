"use client";

import { useEffect, useState } from "react";
import type { NewsItem } from "@/lib/finnhub";

const REFRESH_MS = 300_000;

type State = { status: "loading" | "ok" | "unavailable" | "error"; items: NewsItem[] };

function ago(ts: number) {
  const mins = Math.max(0, Math.round((Date.now() - ts * 1000) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  return h < 48 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

/** Only ever link to http(s) URLs coming from the feed. */
const safeHref = (u: string) => (/^https?:\/\//i.test(u) ? u : undefined);

export function NewsCard({ count = 3 }: { count?: number }) {
  const [state, setState] = useState<State>({ status: "loading", items: [] });

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch("/api/news?category=general", { signal: controller.signal });
        if (res.status === 503) return !stopped && setState({ status: "unavailable", items: [] });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (!stopped) setState({ status: "ok", items: data.news as NewsItem[] });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        if (!stopped) setState((s) => (s.items.length ? s : { status: "error", items: [] }));
      }
      if (!stopped) timer = setTimeout(load, REFRESH_MS);
    }
    load();
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const items = state.items.filter((n) => n.headline).slice(0, count);

  return (
    <section className="card news">
      <header>
        <h3>Market Intelligence</h3>
        <span className="chip">{items[0] ? ago(items[0].datetime) : "Live"}</span>
      </header>

      <div className="news-list">
        {state.status === "loading" && <p className="muted small">Loading headlines…</p>}
        {state.status === "unavailable" && <p className="muted small">Add your Finnhub key to see market headlines.</p>}
        {state.status === "error" && <p className="muted small">Headlines are unavailable right now.</p>}
        {items.map((n) => (
          <a key={n.id} className="news-item" href={safeHref(n.url)} target="_blank" rel="noopener noreferrer">
            <small>{(n.source || "News").toUpperCase()}</small>
            <b>{n.headline}</b>
          </a>
        ))}
      </div>
    </section>
  );
}
