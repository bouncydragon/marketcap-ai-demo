import type Stripe from "stripe";
import { syncSubscription } from "@/lib/billing";
import { getStripe, hasStripeKey } from "@/lib/stripe";
import { hasServiceRole } from "@/lib/supabase/admin";

/**
 * Stripe calls this when a subscription is created, renewed, changed or cancelled. The request is
 * trusted only if its signature verifies against STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !hasStripeKey() || !hasServiceRole()) return Response.json({ error: "webhook_not_configured" }, { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "missing_signature" }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return Response.json({ error: "invalid_signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const id = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          await syncSubscription(await stripe.subscriptions.retrieve(id));
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
    }
  } catch (err) {
    console.error("webhook handler failed", event.type, err);
    return Response.json({ error: "handler_failed" }, { status: 500 }); // Stripe will retry
  }
  return Response.json({ received: true });
}
