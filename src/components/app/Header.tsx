"use client";

import Link from "next/link";
import { useAccount } from "@/components/AccountProvider";
import { useQuotes } from "@/components/QuotesProvider";
import { IconCalendar, IconChevronDown, IconSparkle } from "./Icons";

export type Tab = "overview" | "holdings" | "watchlist" | "market";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "holdings", label: "Holdings" },
  { id: "watchlist", label: "Watchlist" },
  { id: "market", label: "Market watch" },
];

function FeedPill() {
  const { state, market } = useQuotes();
  let label = "Connecting…";
  let tone = "loading";
  if (state === "demo") [label, tone] = ["Demo data", "demo"];
  else if (state === "error") [label, tone] = ["Feed unavailable", "error"];
  else if (state === "live") [label, tone] = market?.isOpen === false ? ["Market closed", "closed"] : ["Live", "live"];
  return (
    <span className={`feed-pill ${tone}`} role="status" title={state === "demo" ? "Add FINNHUB_API_KEY to .env.local for live prices" : undefined}>
      <i />
      {label}
    </span>
  );
}

export function Header({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const { email, plan } = useAccount();
  return (
    <>
      <div className="titlebar">
        <h1>Investment</h1>
        <div className="user">
          <span className="avatar-circle" aria-hidden>{(email[0] ?? "?").toUpperCase()}</span>
          <div>
            <b className="user-email">{email}</b>
            <small>
              <span className={`plan-badge ${plan === "pro" ? "pro" : ""}`}>{plan === "pro" ? "Pro" : "Free"}</span>
              {plan !== "pro" && <> · <Link href="/pricing">Upgrade</Link></>}
            </small>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs" role="tablist" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "on" : ""} onClick={() => onTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="tool-right">
          <FeedPill />
          <label className="period">
            <IconCalendar width={18} height={18} />
            <select aria-label="Period" defaultValue="today">
              <option value="today">Today</option>
              <option disabled>This year (needs price history)</option>
            </select>
            <IconChevronDown />
          </label>
          <button className="btn-dark" aria-disabled title="AI assistant (coming soon)">
            <IconSparkle width={18} height={18} />
            Ask AI
          </button>
        </div>
      </div>
    </>
  );
}
