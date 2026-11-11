"use client";

import { useState } from "react";

const MESSAGES: Record<string, string> = {
  unauthorized: "Please sign in first.",
  billing_not_configured: "Billing isn't set up yet. Add STRIPE_SECRET_KEY and SUPABASE_SERVICE_ROLE_KEY to .env.local and restart.",
  price_missing: "The $20/month price doesn't exist yet. Run `npm run stripe:setup` once.",
  test_mode_only: "This build only accepts Stripe test keys (sk_test_…).",
  already_subscribed: "You're already on the Pro plan.",
  no_customer: "No billing account found yet.",
  portal_unavailable: "The billing portal isn't available. Run `npm run stripe:setup`, then try again.",
  checkout_failed: "Couldn't start checkout. Please try again.",
};

function useRedirectAction(endpoint: string) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.url === "string") {
        window.location.href = data.url; // Stripe-hosted page
        return;
      }
      setError(MESSAGES[data.error] ?? "Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(false);
  };
  return { busy, error, run };
}

export function CheckoutButton({ label = "Upgrade to Pro", className = "btn-primary" }: { label?: string; className?: string }) {
  const { busy, error, run } = useRedirectAction("/api/stripe/checkout");
  return (
    <>
      <button className={className} onClick={run} disabled={busy}>{busy ? "Redirecting to Stripe…" : label}</button>
      {error && <p className="form-msg err" role="alert">{error}</p>}
    </>
  );
}

export function PortalButton({ label = "Manage subscription", className = "btn-outline" }: { label?: string; className?: string }) {
  const { busy, error, run } = useRedirectAction("/api/stripe/portal");
  return (
    <>
      <button className={className} onClick={run} disabled={busy}>{busy ? "Opening…" : label}</button>
      {error && <p className="form-msg err" role="alert">{error}</p>}
    </>
  );
}
