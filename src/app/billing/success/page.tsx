import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { getUser } from "@/lib/auth";
import { syncSubscription } from "@/lib/billing";
import { getStripe, hasStripeKey } from "@/lib/stripe";
import { hasServiceRole } from "@/lib/supabase/admin";

export const metadata = { title: "Payment · MarketCap" };

type Outcome = { kind: "ok" } | { kind: "pending" } | { kind: "error"; message: string };

/**
 * Where Stripe Checkout sends the customer back. We verify the session directly with Stripe and
 * record the subscription now, so access works even before the webhook arrives.
 */
async function confirm(sessionId: string, userId: string): Promise<Outcome> {
  if (!hasStripeKey() || !hasServiceRole()) return { kind: "error", message: "Billing isn't fully configured on the server." };
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
    // A user may only claim a checkout session that was created for them.
    if (session.client_reference_id !== userId) return { kind: "error", message: "This checkout session doesn't belong to your account." };
    if (session.status !== "complete" || !session.subscription) return { kind: "pending" };
    await syncSubscription(session.subscription as Stripe.Subscription);
    return { kind: "ok" };
  } catch (err) {
    console.error("billing success sync failed", err);
    return { kind: "error", message: "We couldn't confirm the payment. If you were charged, it will appear shortly." };
  }
}

async function SuccessContent({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  // Depends on who is signed in (and Supabase reads the clock), so render per request.
  await connection();
  const user = await getUser();
  if (!user) redirect("/login?next=/pricing");
  const { session_id } = await searchParams;
  if (!session_id || !session_id.startsWith("cs_")) redirect("/pricing");

  const outcome = await confirm(session_id, user.id);

  return (
    <main className="auth-shell">
      <div className="auth-card center">
        {outcome.kind === "ok" && (
          <>
            <div className="big-check" aria-hidden>✓</div>
            <h1>You&rsquo;re on Pro</h1>
            <p className="muted">Payment received. You can now save stocks to your watchlist.</p>
            <Link className="btn-primary block" href="/">Go to dashboard</Link>
            <Link className="auth-foot-link" href="/billing/test">Back to the payment test page</Link>
          </>
        )}
        {outcome.kind === "pending" && (
          <>
            <h1>Payment processing</h1>
            <p className="muted">Stripe hasn&rsquo;t finished yet. Refresh in a moment.</p>
            <Link className="btn-outline block" href={`/billing/success?session_id=${session_id}`}>Refresh</Link>
          </>
        )}
        {outcome.kind === "error" && (
          <>
            <h1>Something went wrong</h1>
            <p className="form-msg err">{outcome.message}</p>
            <Link className="btn-outline block" href="/billing/test">Open the payment test page</Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  return (
    <Suspense fallback={<div className="page-loading" aria-busy="true">Loading…</div>}>
      <SuccessContent searchParams={searchParams} />
    </Suspense>
  );
}
