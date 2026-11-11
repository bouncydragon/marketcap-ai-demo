"use client";

import { useQuotes } from "@/components/QuotesProvider";
import { useMetrics } from "@/components/MetricsProvider";
import { usePortfolio } from "@/components/PortfolioProvider";
import { betaLabel, computeStats } from "@/lib/stats";
import { signedPct, signedUsd, usd } from "@/lib/format";
import { IconArrowDown, IconArrowUp } from "./Icons";

function Delta({ value, suffix, unit = "%" }: { value: number | null; suffix: string; unit?: string }) {
  if (value === null) return <div className="kpi-sub muted">{suffix}</div>;
  const up = value >= 0;
  return (
    <div className="kpi-sub">
      <span className={up ? "pos" : "neg"}>
        {up ? <IconArrowUp /> : <IconArrowDown />}
        {unit === "%" ? signedPct(value) : signedUsd(value)}
      </span>
      <span className="muted">{suffix}</span>
    </div>
  );
}

export function KpiRow() {
  const { quotes } = useQuotes();
  const metrics = useMetrics();
  const { positions } = usePortfolio();
  const s = computeStats(positions, quotes, metrics);

  const spyMtd = metrics.SPY?.mtd ?? null;
  const vsSpy = s.mtd !== null && spyMtd !== null ? s.mtd - spyMtd : null;
  const dash = "—";

  return (
    <div className="kpis">
      <section className="card kpi">
        <h3>Total Portfolio Value</h3>
        <div className="kpi-value">{s.live ? usd(s.value, 0) : dash}</div>
        <Delta value={s.live ? s.ytd : null} suffix="This Year" />
      </section>

      <section className="card kpi">
        <h3>Daily P/L</h3>
        <div className={`kpi-value ${s.live ? (s.dayChange >= 0 ? "pos" : "neg") : ""}`}>{s.live ? signedUsd(s.dayChange) : dash}</div>
        <Delta value={s.live ? s.dayPct : null} suffix="vs prev close" />
      </section>

      <section className="card kpi">
        <h3>Monthly Return</h3>
        <div className="kpi-value">{s.mtd !== null ? signedPct(s.mtd) : dash}</div>
        <Delta value={vsSpy} suffix="vs S&P 500" />
      </section>

      <section className="card kpi">
        <h3>Dividend Income</h3>
        <div className="kpi-value">{s.annualDividends !== null ? usd(s.annualDividends, 0) : dash}</div>
        <div className="kpi-sub muted">Est. annual</div>
      </section>

      <section className="card kpi">
        <h3>Risk Score</h3>
        <div className="kpi-value">{s.beta !== null ? s.beta.toFixed(2) : dash}</div>
        <div className="kpi-sub muted">{s.beta !== null ? betaLabel(s.beta) : "Portfolio beta"}</div>
      </section>
    </div>
  );
}
