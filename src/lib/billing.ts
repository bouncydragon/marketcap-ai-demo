import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

/**
 * Records a Stripe subscription in Supabase. This is the ONLY writer of the `subscriptions`
 * table (it uses the service role); the watchlist's row-level security reads it to decide
 * who may save stocks.
 */
export async function syncSubscription(sub: Stripe.Subscription) {
  const admin = createAdminClient();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // Find which of our users owns this Stripe customer.
  let userId: string | undefined;
  const existing = await admin.from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
  userId = existing.data?.user_id;
  if (!userId) {
    const customer = await getStripe().customers.retrieve(customerId);
    if (!customer.deleted) userId = customer.metadata?.supabase_user_id;
  }
  if (!userId) throw new Error(`No user found for Stripe customer ${customerId}`);

  const item = sub.items.data[0];
  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      status: sub.status,
      price_id: item?.price.id ?? null,
      current_period_end: item ? new Date(item.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`Could not save subscription: ${error.message}`);
  return { userId, status: sub.status };
}
