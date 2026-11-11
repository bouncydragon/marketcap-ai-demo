"use client";

import { useState } from "react";
import { useQuotes } from "@/components/QuotesProvider";
import { useMetrics } from "@/components/MetricsProvider";
import { usePortfolio } from "@/components/PortfolioProvider";
import { computeStats } from "@/lib/stats";
import { usd } from "@/lib/format";
const TOTAL_STRIPES = 56;
/** Distinct hues that read on both light and dark backgrounds (brand colours like Apple's black don't). */
const PALETTE = ["#6366f1", "#14b8a6", "#f59e0b", "#ec4899", "#3b82f6", "#84cc16", "#a855f7", "#ef4444"];

export function AllocationCard() {
  const { quotes } = useQuotes();
  const metrics = useMetrics();
  const { positions } = usePortfolio();
  const [active, setActive] = useState<string | null>(null);
  const s = computeStats(positions, quotes, metrics);

  // Each holding gets a share of the stripes proportional to its weight.
  const groups = s.rows.map((r, gi) => {
    const count = Math.max(1, Math.round((r.weight / 100) * TOTAL_STRIPES));
    return { ...r, count, gi };
  });
  const top = s.rows[0];
  const top3 = s.rows.slice(0, 3).reduce((a, r) => a + r.weight, 0);
  const shown = groups.find((g) => g.symbol === active) ?? groups[0];

  const centre = shown ? groups.filter((g) => g.gi < shown.gi).reduce((a, g) => a + g.count, 0) + shown.count / 2 : 0;

  return (
    <section className="card alloc">
      <header>
        <h3>Allocation</h3>
        <span className="chip">Today</span>
      </header>
      <div className="alloc-value">{s.live ? usd(s.value) : "—"}</div>

      <div className="stripes-wrap" onPointerLeave={() => setActive(null)}>
        {s.live && shown && (() => {
          const at = (centre / groups.reduce((a, g) => a + g.count, 0)) * 100; // % across the chart
          // Keep the label inside the card: pin it to an edge when its bar is near that edge.
          const edge = at < 22 ? "left" : at > 78 ? "right" : "mid";
          return (
            <>
              <span className={`alloc-badge ${edge}`} style={edge === "mid" ? { left: `${at}%` } : undefined}>
                {shown.symbol} {shown.weight.toFixed(1)}%
              </span>
              <i className="alloc-line" style={{ left: `${at}%` }} />
            </>
          );
        })()}
        <div className="stripes" aria-label="Portfolio allocation by holding">
          {groups.map((g) => (
            <div key={g.symbol} className={`sgroup${shown?.symbol === g.symbol ? " on" : ""}`} onPointerEnter={() => setActive(g.symbol)} style={{ flex: g.count }}>
              {Array.from({ length: g.count }, (_, i) => (
                <i key={i} style={{ height: `${38 + ((i * 29 + g.gi * 17) % 52)}%`, ["--c" as string]: PALETTE[g.gi % PALETTE.length] }} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="tiles">
        <div><small>Positions</small><b>{s.rows.length || "—"}</b></div>
        <div><small>Largest</small><b>{top ? `${top.symbol} ${top.weight.toFixed(0)}%` : "—"}</b></div>
        <div><small>Top 3</small><b>{s.rows.length ? `${top3.toFixed(0)}%` : "—"}</b></div>
      </div>
    </section>
  );
}
