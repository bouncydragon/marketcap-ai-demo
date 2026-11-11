"use client";

import { useState } from "react";
import { Rail } from "./Rail";
import { Header, type Tab } from "./Header";
import { KpiRow } from "./KpiRow";
import { PerformanceChart } from "./PerformanceChart";
import { HoldingsCard } from "./HoldingsCard";
import { AllocationCard } from "./AllocationCard";
import { MoversCard } from "./MoversCard";
import { NewsCard } from "./NewsCard";
import { TradeTicket } from "./TradeTicket";
import { WatchlistCard } from "./WatchlistCard";
import { watchSymbols } from "@/lib/market";

export function Dashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [symbol, setSymbol] = useState(watchSymbols[0]);

  return (
    <div className="app">
      <Rail />
      <main className="panel">
        <Header tab={tab} onTab={setTab} />
        <div className="page">
          <KpiRow />

          {tab === "overview" && (
            <>
              <div className="row-2">
                <PerformanceChart />
                <HoldingsCard limit={5} onViewAll={() => setTab("holdings")} />
              </div>
              <div className="row-3">
                <AllocationCard />
                <MoversCard />
                <NewsCard count={3} />
              </div>
            </>
          )}

          {tab === "holdings" && (
            <div className="row-hold">
              <HoldingsCard selected={symbol} onSelect={setSymbol} />
              <TradeTicket symbol={symbol} onSymbol={setSymbol} />
            </div>
          )}

          {tab === "watchlist" && <WatchlistCard />}

          {tab === "market" && (
            <>
              <PerformanceChart />
              <div className="row-mkt">
                <MoversCard />
                <NewsCard count={6} />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
