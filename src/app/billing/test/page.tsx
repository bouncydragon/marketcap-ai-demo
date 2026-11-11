import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { getAccount } from "@/lib/auth";
import { CheckoutButton, PortalButton } from "@/components/BillingButtons";
import { getProPrice, hasStripeKey, isTestKey } from "@/lib/stripe";
import { hasServiceRole } from "@/lib/supabase/admin";

export const metadata = { title: "Payment test · MarketCap" };

const CARDS = [
  { number: "4242 4242 4242 4242", note: "Succeeds" },
  { number: "4000 0025 0000 3155", note: "Asks for 3D Secure authentication" },
  { number: "4000 0000 0000 9995", note: "Declined: insufficient funds" },
  { number: "4000 0000 0000 0341", note: "Attaches, then fails on the first renewal charge" },
];

type Check = { label: string; ok: boolean; hint?: string; optional?: boolean };

async function BillingTestContent() {
  // Depends on who is signed in (and Supabase reads the clock), so render per request.
  await connection();
  const account = await getAccount();
  const isPro = account?.plan === "pro";

  let priceLabel: string | null = null;
  if (hasStripeKey() && isTestKey()) {
    try {
      const price = await getProPrice();
      if (price?.unit_amount != null) priceLabel = `$${(price.unit_amount / 100).toFixed(2)}/${price.recurring?.interval ?? "once"}`;
    } catch {
      /* shown as not found below */
    }
  }

  const checks: Check[] = [
    { label: "Stripe test key (STRIPE_SECRET_KEY)", ok: hasStripeKey() && isTestKey(), hint: hasStripeKey() ? "Must start with sk_test_" : "Add it to .env.local and restart the dev server" },
    { label: "Supabase service role key (SUPABASE_SERVICE_ROLE_KEY)", ok: hasServiceRole(), hint: "Supabase dashboard > Project Settings > API. Server-side only." },
    { label: priceLabel ? `Pro price found (${priceLabel})` : "Pro price ($20/month)", ok: Boolean(priceLabel), hint: "Run `npm run stripe:setup` once" },
    { label: "Webhook secret (STRIPE_WEBHOOK_SECRET)", ok: Boolean(process.env.STRIPE_WEBHOOK_SECRET), optional: true, hint: "Only needed so renewals and cancellations sync. The first payment syncs without it." },
  ];
  const ready = checks.filter((c) => !c.optional).every((c) => c.ok);

  return (
    <main className="pricing-shell narrow">
      <header className="pricing-head">
        <Link href="/" className="auth-brand small">
          <span className="brand-mark" aria-hidden>
            <svg width="18" height="20" viewBox="0 0 20 22"><path d="M12.5 1 2 12.5h6.2L6.5 21 18 8.5h-6.4L12.5 1Z" fill="currentColor" /></svg>
          </span>
          MarketCap
        </Link>
        <nav><Link href="/pricing">Pricing</Link><Link href="/">Dashboard</Link></nav>
      </header>

      <div className="sandbox-banner" role="note">
        <b>Sandbox mode.</b> No real money moves. Use the test cards below with any future expiry, any 3-digit CVC and any postal code.
      </div>

      <h1 className="page-h1">Payment test</h1>

      <section className="card">
        <h3>Your subscription</h3>
        <div className="sub-grid">
          <div><small>Signed in as</small><b>{account?.email}</b></div>
          <div><small>Plan</small><b><span className={`plan-badge ${isPro ? "pro" : ""}`}>{isPro ? "Pro" : "Free"}</span></b></div>
          <div><small>Status</small><b>{account?.status ?? "No subscription yet"}</b></div>
          <div>
            <small>{account?.cancelAtPeriodEnd ? "Ends on" : "Renews on"}</small>
            <b>{account?.currentPeriodEnd && isPro ? new Date(account.currentPeriodEnd).toLocaleDateString("en-US", { dateStyle: "long" }) : "—"}</b>
          </div>
        </div>
        <div className="btn-row">
          {!isPro && <CheckoutButton label="Start $20/month test subscription" />}
          {isPro && <PortalButton />}
          <Link className="btn-outline" href="/billing/test">Refresh status</Link>
        </div>
      </section>

      <section className="card">
        <h3>Setup checklist {ready ? <span className="chip ok">Ready</span> : <span className="chip warn">Action needed</span>}</h3>
        <ul className="checks">
          {checks.map((c) => (
            <li key={c.label} className={c.ok ? "ok" : c.optional ? "opt" : "bad"}>
              <i aria-hidden>{c.ok ? "✓" : c.optional ? "○" : "✕"}</i>
              <div><b>{c.label}</b>{!c.ok && c.hint && <small>{c.hint}</small>}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3>Test cards</h3>
        <table className="cards-table">
          <tbody>
            {CARDS.map((c) => (
              <tr key={c.number}><td><code>{c.number}</code></td><td>{c.note}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">
          Then check the result in the <a href="https://dashboard.stripe.com/test/subscriptions" target="_blank" rel="noopener noreferrer">Stripe test dashboard</a>.
        </p>
      </section>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="page-loading" aria-busy="true">Loading…</div>}>
      <BillingTestContent />
    </Suspense>
  );
}
