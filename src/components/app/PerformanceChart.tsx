"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuotes } from "@/components/QuotesProvider";
import { useMetrics } from "@/components/MetricsProvider";
import { usePortfolio } from "@/components/PortfolioProvider";
import { computeStats } from "@/lib/stats";
import { signedPct } from "@/lib/format";
import { InfoTip } from "./InfoTip";

const NOTE = "Today\u2019s % change vs previous close, built from live price updates since you opened this page.";

const PAD = { top: 16, right: 20, bottom: 34, left: 52 };

type Pt = { t: number; port: number; spy: number | null; qqq: number | null };

const sign = (n: number | null) => (n === null ? "" : n >= 0 ? "pos" : "neg");

export function PerformanceChart() {
  const { quotes, history } = useQuotes();
  const metrics = useMetrics();
  const { positions } = usePortfolio();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const stats = computeStats(positions, quotes, metrics);

  // % change vs previous close, built from real price updates seen since the page opened.
  const points: Pt[] = useMemo(() => {
    const held = positions.filter((p) => p.shares > 0);
    if (!stats.live || held.length === 0 || stats.prevValue <= 0) return [];
    const base = history[held[0].symbol] ?? [];
    const n = base.length;
    if (n === 0) return [];
    const at = (sym: string, i: number) => {
      const h = history[sym];
      const j = h ? h.length - n + i : -1;
      return j >= 0 ? h[j] : null;
    };
    const bench = (sym: string, i: number) => {
      const q = quotes[sym];
      const tick = at(sym, i);
      return q && tick && q.prevClose ? (tick.p / q.prevClose - 1) * 100 : null;
    };
    const out: Pt[] = [];
    // Anchor at the day's open so the line has a starting point.
    const openOf = (sym: string) => {
      const q = quotes[sym];
      return q && q.prevClose ? (q.open / q.prevClose - 1) * 100 : null;
    };
    out.push({ t: base[0].t - 15 * 60_000, port: (stats.openValue / stats.prevValue - 1) * 100, spy: openOf("SPY"), qqq: openOf("QQQ") });
    for (let i = 0; i < n; i++) {
      let value = 0;
      let ok = true;
      for (const p of held) {
        const tick = at(p.symbol, i);
        if (!tick) { ok = false; break; }
        value += p.shares * tick.p;
      }
      if (!ok) continue;
      out.push({ t: base[i].t, port: (value / stats.prevValue - 1) * 100, spy: bench("SPY", i), qqq: bench("QQQ", i) });
    }
    return out;
  }, [positions, history, quotes, stats.live, stats.prevValue, stats.openValue]);

  const geo = useMemo(() => {
    if (!size.w || !size.h || points.length < 2) return null;
    const iw = size.w - PAD.left - PAD.right;
    const ih = size.h - PAD.top - PAD.bottom;
    const t0 = points[0].t;
    const t1 = Math.max(points[points.length - 1].t, t0 + 1);
    const vals = points.flatMap((p) => [p.port, p.spy, p.qqq]).filter((v): v is number => v !== null);
    let lo = Math.min(...vals, 0);
    let hi = Math.max(...vals, 0);
    if (hi - lo < 0.6) { hi += 0.3; lo -= 0.3; }
    const pad = (hi - lo) * 0.1;
    lo -= pad; hi += pad;
    const x = (t: number) => PAD.left + ((t - t0) / (t1 - t0)) * iw;
    const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * ih;
    const path = (pick: (p: Pt) => number | null) =>
      points.reduce((d, p) => {
        const v = pick(p);
        return v === null ? d : `${d}${d ? "L" : "M"}${x(p.t).toFixed(1)} ${y(v).toFixed(1)}`;
      }, "");
    const step = (hi - lo) / 5;
    // Only as many time labels as fit without touching (about 72px each).
    const nx = Math.max(2, Math.min(6, Math.floor(iw / 72)));
    return {
      iw, ih, x, y,
      yTicks: Array.from({ length: 6 }, (_, i) => lo + step * i),
      xTicks: Array.from({ length: nx }, (_, i) => t0 + ((t1 - t0) * i) / (nx - 1)),
      port: path((p) => p.port), spy: path((p) => p.spy), qqq: path((p) => p.qqq),
    };
  }, [points, size]);

  const last = points[points.length - 1];
  const idx = hover ?? points.length - 1;
  const cur = points[idx];

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!geo) return;
    const mx = e.clientX - e.currentTarget.getBoundingClientRect().left;
    let best = 0;
    let bd = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(geo.x(p.t) - mx);
      if (d < bd) [bd, best] = [d, i];
    });
    setHover(best);
  };

  const spyAlpha = last && last.spy !== null ? last.port - last.spy : null;
  const fmtTime = (t: number) => new Date(t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <section className="card perf">
      <header>
        <div className="title-row">
          <h3>Performance Vs Benchmarks</h3>
          <InfoTip label="About this chart">{NOTE}</InfoTip>
        </div>
        <div className="chips">
          {spyAlpha !== null && <span className="chip">Alpha {signedPct(spyAlpha)}</span>}
          {stats.beta !== null && <span className="chip">Beta {stats.beta.toFixed(2)}</span>}
        </div>
      </header>

      <div className="legend">
        <span><i className="sw port" />Portfolio <b className={sign(last?.port ?? null)}>{last ? signedPct(last.port) : "—"}</b></span>
        <span><i className="sw spy" />S&amp;P 500 <b className={sign(last?.spy ?? null)}>{last?.spy != null ? signedPct(last.spy) : "—"}</b></span>
        <span><i className="sw qqq" />Nasdaq <b className={sign(last?.qqq ?? null)}>{last?.qqq != null ? signedPct(last.qqq) : "—"}</b></span>
      </div>

      <div className="perf-area" ref={wrapRef}>
        {geo && cur ? (
          <svg viewBox={`0 0 ${size.w} ${size.h}`} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Portfolio performance versus S&P 500 and Nasdaq today">
            {geo.yTicks.map((v, i) => (
              <g key={i}>
                <line x1={PAD.left} x2={size.w - PAD.right} y1={geo.y(v)} y2={geo.y(v)} className={Math.abs(v) < 0.001 ? "zero" : "grid"} />
                <text className="axis" x={PAD.left - 12} y={geo.y(v) + 4} textAnchor="end">{v >= 0 ? "+" : ""}{v.toFixed(1)}%</text>
              </g>
            ))}
            {geo.xTicks.map((t, i) => (
              <text key={i} className="axis" x={geo.x(t)} y={size.h - 10} textAnchor="middle">{fmtTime(t)}</text>
            ))}
            <path d={geo.qqq} className="ln qqq" />
            <path d={geo.spy} className="ln spy" />
            <path d={geo.port} className="ln port" />
            {hover !== null && <line x1={geo.x(cur.t)} x2={geo.x(cur.t)} y1={PAD.top} y2={PAD.top + geo.ih} className="cursor" />}
            <circle cx={geo.x(cur.t)} cy={geo.y(cur.port)} r={7} className="dot" />
          </svg>
        ) : (
          <div className="chart-empty">{stats.live ? "Collecting live prices… the lines build as updates arrive." : "Waiting for live prices…"}</div>
        )}
        {geo && cur && hover !== null && (
          <div className="tooltip" style={{ left: Math.min(Math.max(geo.x(cur.t), 110), size.w - 110), top: Math.max(geo.y(cur.port) - 92, 4) }}>
            <small>{new Date(cur.t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</small>
            <span><em>Portfolio</em><b>{signedPct(cur.port)}</b></span>
            <span><em>S&amp;P 500</em><b>{cur.spy !== null ? signedPct(cur.spy) : "—"}</b></span>
          </div>
        )}
      </div>
      <p className="chart-note">{NOTE}</p>
    </section>
  );
}
