"use client";

import { useState } from "react";
import { useQuotes } from "@/components/QuotesProvider";
import { usePortfolio } from "@/components/PortfolioProvider";
import { usd } from "@/lib/format";
import { watchSymbols, watchlist } from "@/lib/market";
import { IconChevronDown, IconInfo } from "./Icons";

type Props = { symbol: string; onSymbol: (s: string) => void };

export function TradeTicket({ symbol, onSymbol }: Props) {
  const { quotes } = useQuotes();
  const { sharesOf, trade } = usePortfolio();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [unit, setUnit] = useState<"shares" | "usd">("shares");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const price = quotes[symbol]?.price;
  const num = parseFloat(amount);
  const valid = Number.isFinite(num) && num > 0;
  const shares = !valid || !price ? 0 : unit === "shares" ? num : num / price;
  const total = price ? shares * price : 0;
  const held = sharesOf(symbol);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!price) return;
    // Whole shares only for share-based orders; dollar orders may buy fractions.
    const qty = unit === "shares" ? Math.floor(shares) : Math.round(shares * 1e4) / 1e4;
    const error = trade(symbol, side, qty);
    if (error) return setMessage({ ok: false, text: error });
    setMessage({ ok: true, text: `Paper ${side === "buy" ? "bought" : "sold"} ${qty} ${symbol} at ${usd(price)}.` });
    setAmount("");
  };

  return (
    <section className="card ticket">
      <div className="seg2" role="tablist" aria-label="Order side">
        {(["buy", "sell"] as const).map((s) => (
          <button key={s} role="tab" aria-selected={side === s} className={side === s ? "on" : ""} onClick={() => { setSide(s); setMessage(null); }}>
            {s === "buy" ? "Buy" : "Sell"}
          </button>
        ))}
      </div>

      <form className="ticket-inner" onSubmit={submit}>
        <div className="seg3" role="tablist" aria-label="Order type">
          <button type="button" role="tab" aria-selected className="on">Market</button>
          <button type="button" role="tab" aria-disabled title="Paper trading supports market orders only">Limit</button>
          <button type="button" role="tab" aria-disabled title="Paper trading supports market orders only">Stop</button>
        </div>

        <label className="field">
          <span className="label">Stock <IconInfo /></span>
          <div className="select-wrap">
            <select value={symbol} onChange={(e) => { onSymbol(e.target.value); setMessage(null); }}>
              {watchSymbols.map((s) => (
                <option key={s} value={s}>{s} · {watchlist[s].name}</option>
              ))}
            </select>
            <IconChevronDown />
          </div>
        </label>

        <label className="field">
          <span className="label">Amount <IconInfo /></span>
          <div className="amount-row">
            <input inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => { setAmount(e.target.value.replace(/[^0-9.]/g, "")); setMessage(null); }} />
            <select aria-label="Unit" value={unit} onChange={(e) => setUnit(e.target.value as "shares" | "usd")}>
              <option value="shares">Shares</option>
              <option value="usd">USD</option>
            </select>
          </div>
        </label>

        <dl className="ticket-rows">
          <div><dt>Market price</dt><dd>{price ? usd(price) : "—"}</dd></div>
          <div><dt>You hold</dt><dd>{held} {symbol}</dd></div>
          <div className="total"><dt>Estimated total</dt><dd>{usd(total)} <em>USD</em></dd></div>
        </dl>

        <button className={`btn-trade ${side}`} disabled={!price || !valid}>
          {side === "buy" ? "Buy" : "Sell"} {symbol}
        </button>

        <p className={`ticket-note${message ? (message.ok ? " ok" : " err") : ""}`} role="status">
          {message ? message.text : "Paper trading: no real orders are placed. Positions are saved in this browser."}
        </p>
      </form>
    </section>
  );
}
