"use client";

import { useQuotes } from "@/components/QuotesProvider";
import { signedPct, usd } from "@/lib/format";
import { benchmarks, watchSymbols, watchlist } from "@/lib/market";

function MoverRow({ symbol }: { symbol: string }) {
  const { quotes } = useQuotes();
  const q = quotes[symbol];
  const up = (q?.changePercent ?? 0) >= 0;
  return (
    <li className="mover">
      <span><b>{symbol}</b><small>{watchlist[symbol].name}</small></span>
      <em className={`pl ${up ? "pos" : "neg"}`}>{q ? signedPct(q.changePercent) : "—"}</em>
    </li>
  );
}

export function MoversCard() {
  const { quotes } = useQuotes();
  const ranked = watchSymbols.filter((s) => quotes[s]).sort((a, b) => quotes[b].changePercent - quotes[a].changePercent);
  const gainers = ranked.filter((s) => quotes[s].changePercent > 0).slice(0, 3);
  const losers = ranked.filter((s) => quotes[s].changePercent < 0).reverse().slice(0, 3);

  return (
    <section className="card movers">
      <header>
        <h3>Top Movers</h3>
        <span className="chip">Today</span>
      </header>

      <div className="mv-cols">
        <div>
          <h4 className="pos">GAINERS</h4>
          <ul>{gainers.map((s) => <MoverRow key={s} symbol={s} />)}{ranked.length > 0 && gainers.length === 0 && <li className="none">None today</li>}</ul>
        </div>
        <div>
          <h4 className="neg">LOSERS</h4>
          <ul>{losers.map((s) => <MoverRow key={s} symbol={s} />)}{ranked.length > 0 && losers.length === 0 && <li className="none">None today</li>}</ul>
        </div>
      </div>
      {ranked.length === 0 && <p className="muted small">Waiting for live prices…</p>}

      <h4 className="bm-title">Benchmarks</h4>
      <ul className="bm">
        {Object.entries(benchmarks).map(([sym, b]) => {
          const q = quotes[sym];
          const up = (q?.changePercent ?? 0) >= 0;
          return (
            <li key={sym}>
              <span className="bm-name"><i>{sym[0]}</i>{b.name} <small>({b.etf})</small></span>
              <span className="bm-px">{q ? usd(q.price) : "—"}<small className={up ? "pos" : "neg"}>{q ? signedPct(q.changePercent) : ""}</small></span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
