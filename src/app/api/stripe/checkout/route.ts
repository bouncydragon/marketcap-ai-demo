import { getUser } from "@/lib/auth";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { getProPrice, getStripe, hasStripeKey, isTestKey } from "@/lib/stripe";

/** Starts a Stripe Checkout session for the $20/month Pro plan (sandbox only). */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const missing = [!hasStripeKey() && "STRIPE_SECRET_KEY", !hasServiceRole() && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean);
  if (missing.length) return Response.json({ error: "billing_not_configured", missing }, { status: 503 });
  if (!isTestKey()) return Response.json({ error: "test_mode_only" }, { status: 403 });

  try {
    const stripe = getStripe();
    const price = await getProPrice();
    if (!price) return Response.json({ error: "price_missing" }, { status: 503 }); // run npm run stripe:setup

    const admin = createAdminClient();
    const { data: existing } = await admin.from("subscriptions").select("stripe_customer_id,status").eq("user_id", user.id).maybeSingle();
    if (existing && (existing.status === "active" || existing.status === "trialing")) {
      return Response.json({ error: "already_subscribed" }, { status: 409 });
    }

    let customerId = existing?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { supabase_user_id: user.id } });
      customerId = customer.id;
      const { error } = await admin.from("subscriptions").upsert({ user_id: user.id, stripe_customer_id: customerId, status: "incomplete" }, { onConflict: "user_id" });
      if (error) throw new Error(error.message);
    }

    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: price.id, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: { metadata: { supabase_user_id: user.id } },
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=1`,
    });
    return Response.json({ url: session.url });
  } catch (err) {
    console.error("checkout failed", err);
    return Response.json({ error: "checkout_failed" }, { status: 502 });
  }
}
