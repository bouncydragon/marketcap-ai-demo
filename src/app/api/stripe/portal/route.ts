import { getUser } from "@/lib/auth";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { getPortalConfigId, getStripe, hasStripeKey, isTestKey } from "@/lib/stripe";

/** Opens the Stripe customer portal so a subscriber can cancel or update their card. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!hasStripeKey() || !hasServiceRole()) return Response.json({ error: "billing_not_configured" }, { status: 503 });
  if (!isTestKey()) return Response.json({ error: "test_mode_only" }, { status: 403 });

  const { data } = await createAdminClient().from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (!data?.stripe_customer_id) return Response.json({ error: "no_customer" }, { status: 404 });

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      configuration: await getPortalConfigId(),
      return_url: `${new URL(request.url).origin}/billing/test`,
    });
    return Response.json({ url: session.url });
  } catch (err) {
    console.error("portal failed", err);
    return Response.json({ error: "portal_unavailable" }, { status: 502 });
  }
}
