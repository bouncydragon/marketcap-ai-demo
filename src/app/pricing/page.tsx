import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { getAccount } from "@/lib/auth";
import { CheckoutButton, PortalButton } from "@/components/BillingButtons";

export const metadata = { title: "Pricing · MarketCap" };

const FREE = ["Live dashboard and market data", "Portfolio value and benchmark chart", "Market news feed", "Paper-trading ticket"];
const PRO = ["Everything in Free", "Save stocks to your personal watchlist", "Up to 10 saved stocks, private to you", "Cancel anytime from the billing portal"];

async function PricingContent({ searchParams }: { searchParams: Promise<{ canceled?: string }> }) {
  // Depends on who is signed in (and Supabase reads the clock), so render per request.
  await connection();
  const { canceled } = await searchParams;
  const account = await getAccount();
  const isPro = account?.plan === "pro";

  return (
    <main className="pricing-shell">
      <header className="pricing-head">
        <Link href="/" className="auth-brand small">
          <span className="brand-mark" aria-hidden>
            <svg width="18" height="20" viewBox="0 0 20 22"><path d="M12.5 1 2 12.5h6.2L6.5 21 18 8.5h-6.4L12.5 1Z" fill="currentColor" /></svg>
          </span>
          MarketCap
        </Link>
        <nav>{account ? <Link href="/">Dashboard</Link> : <Link href="/login">Sign in</Link>}</nav>
      </header>

      <section className="pricing-hero">
        <h1>Simple pricing</h1>
        <p>Browse the market for free. Upgrade when you want a watchlist of your own.</p>
        {canceled && <p className="form-msg info" role="status">Checkout canceled. You haven&rsquo;t been charged.</p>}
      </section>

      <div className="plans">
        <section className="plan card">
          <h2>Free</h2>
          <div className="price"><b>$0</b><span>/month</span></div>
          <p className="plan-desc">Everything you need to follow the market.</p>
          <ul>
            {FREE.map((f) => <li key={f}><i className="tick">✓</i>{f}</li>)}
            <li className="off"><i className="tick">–</i>Save stocks to a watchlist</li>
          </ul>
          {!account ? (
            <Link className="btn-outline block" href="/login?mode=signup">Get started</Link>
          ) : (
            <button className="btn-outline block" disabled>{isPro ? "Included in Pro" : "Your current plan"}</button>
          )}
        </section>

        <section className="plan card featured">
          <span className="ribbon">Most popular</span>
          <h2>Pro</h2>
          <div className="price"><b>$20</b><span>/month</span></div>
          <p className="plan-desc">Build a watchlist that&rsquo;s yours alone.</p>
          <ul>
            {PRO.map((f) => <li key={f}><i className="tick">✓</i>{f}</li>)}
          </ul>
          {!account && <Link className="btn-primary block" href="/login?mode=signup&next=/pricing">Sign up to upgrade</Link>}
          {account && !isPro && <CheckoutButton className="btn-primary block" label="Upgrade for $20/month" />}
          {account && isPro && (
            <>
              <button className="btn-primary block" disabled>Your current plan</button>
              <PortalButton className="btn-outline block" />
            </>
          )}
        </section>
      </div>

      <p className="pricing-foot">
        Payments run in Stripe&rsquo;s sandbox. <Link href="/billing/test">Open the payment test page</Link>
      </p>
    </main>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<{ canceled?: string }> }) {
  return (
    <Suspense fallback={<div className="page-loading" aria-busy="true">Loading…</div>}>
      <PricingContent searchParams={searchParams} />
    </Suspense>
  );
}
