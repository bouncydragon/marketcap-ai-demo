import { connection } from "next/server";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/app/Dashboard";
import { AccountProvider } from "@/components/AccountProvider";
import { MetricsProvider } from "@/components/MetricsProvider";
import { PortfolioProvider } from "@/components/PortfolioProvider";
import { QuotesProvider } from "@/components/QuotesProvider";
import { getAccount } from "@/lib/auth";
import { allSymbols, watchSymbols } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";

async function DashboardContent() {
  // Depends on who is signed in (and Supabase reads the clock), so render per request.
  await connection();
  const account = await getAccount();
  if (!account) redirect("/login");

  // Row Level Security means this query can only ever return the signed-in user's own rows.
  const supabase = await createClient();
  const { data } = await supabase.from("watchlist_items").select("symbol").order("created_at", { ascending: true });

  return (
    <AccountProvider email={account.email} plan={account.plan} initialWatchlist={(data ?? []).map((r) => r.symbol)}>
      <QuotesProvider symbols={allSymbols}>
        <MetricsProvider symbols={[...watchSymbols, "SPY"]}>
          <PortfolioProvider>
            <Dashboard />
          </PortfolioProvider>
        </MetricsProvider>
      </QuotesProvider>
    </AccountProvider>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="page-loading" aria-busy="true">Loading…</div>}>
      <DashboardContent />
    </Suspense>
  );
}
