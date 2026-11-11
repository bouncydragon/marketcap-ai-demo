"use client";

import { useQuotes } from "@/components/QuotesProvider";
import { useMetrics } from "@/components/MetricsProvider";
import { usePortfolio } from "@/components/PortfolioProvider";
import { computeStats } from "@/lib/stats";
import { signedPct, usd } from "@/lib/format";
import { watchlist } from "@/lib/market";
import { IconArrowRight, IconUpload } from "./Icons";

type Props = {
  /** Overview shows the top few; the Holdings tab shows everything. */
  limit?: number;
  selected?: string;
  onSelect?: (symbol: string) => void;
  onViewAll?: () => void;
};

function exportCsv(rows: ReturnType<typeof computeStats>["rows"]) {
  const lines = [["Symbol", "Name", "Shares", "Price", "Value", "Weight %", "Day change %"]];
  for (const r of rows) {
    lines.push([r.symbol, watchlist[r.symbol]?.name ?? r.symbol, String(r.shares), r.price.toFixed(2), r.value.toFixed(2), r.weight.toFixed(2), r.dayPct.toFixed(2)]);
  }
  const csv = lines.map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `marketcap-holdings-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function HoldingsCard({ limit, selected, onSelect, onViewAll }: Props) {
  const { quotes } = useQuotes();
  const metrics = useMetrics();
  const { positions } = usePortfolio();
  const stats = computeStats(positions, quotes, metrics);
  const rows = limit ? stats.rows.slice(0, limit) : stats.rows;
  const full = !limit;

  return (
    <section className={`card holdings${full ? " full" : ""}`}>
      <header>
        <h3>Holdings</h3>
        {full ? (
          <button className="link-btn" onClick={() => exportCsv(stats.rows)} disabled={!stats.live}>
            <IconUpload width={16} height={16} /> Export CSV
          </button>
        ) : (
          <button className="link-btn" onClick={onViewAll}>
            View All <IconArrowRight />
          </button>
        )}
      </header>

      <div className="htable" role="table" aria-label="Holdings">
        <div className="hr hh" role="row">
          <span role="columnheader" className="c-asset">Asset</span>
          {full && <span role="columnheader" className="r c-shares">Shares</span>}
          <span role="columnheader" className="r c-price">Price</span>
          {full && <span role="columnheader" className="r c-value">Value</span>}
          <span role="columnheader" className="c c-weight">Weight</span>
          <span role="columnheader" className="r c-pl">P/L</span>
        </div>
        {!stats.live && <div className="empty-row">Waiting for live prices…</div>}
        {rows.map((r) => {
          const up = r.dayPct >= 0;
          const meta = watchlist[r.symbol];
          return (
            <button key={r.symbol} role="row" className={`hr hrow${selected === r.symbol ? " sel" : ""}`} aria-selected={selected === r.symbol} onClick={() => onSelect?.(r.symbol)}>
              <span className="asset c-asset">
                <i style={{ background: meta?.color ?? "#667085" }}>{r.symbol[0]}</i>
                <span><b>{r.symbol}</b><small>{meta?.name ?? r.symbol}</small></span>
              </span>
              {full && <span className="r c-shares">{r.shares}</span>}
              <span className="r c-price">{usd(r.price)}</span>
              {full && <span className="r c-value">{usd(r.value, 0)}</span>}
              <span className="weight c-weight">
                <em>{r.weight.toFixed(0)}%</em>
                <span className="bar"><i style={{ width: `${Math.min(100, r.weight)}%` }} /></span>
              </span>
              <span className="r c-pl"><em className={`pl ${up ? "pos" : "neg"}`}>{signedPct(r.dayPct)}</em></span>
              {full && <span className="c-meta">{r.shares} sh · {usd(r.value, 0)}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
