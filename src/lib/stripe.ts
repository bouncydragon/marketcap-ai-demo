import Stripe from "stripe";

/** Price lookup key; created by `npm run stripe:setup`, so no price ID needs to live in env. */
export const PRO_LOOKUP_KEY = "marketcap_pro_monthly";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(key);
  return client;
}

export const hasStripeKey = () => Boolean(process.env.STRIPE_SECRET_KEY);

/** This build is sandbox-only: live keys are refused everywhere payments are created. */
export const isTestKey = () => (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");

let priceCache: Stripe.Price | null = null;

/** The $20/month Pro price, found by lookup key. Returns null until the setup script has run. */
export async function getProPrice(): Promise<Stripe.Price | null> {
  if (priceCache) return priceCache;
  const res = await getStripe().prices.list({ lookup_keys: [PRO_LOOKUP_KEY], active: true, limit: 1 });
  priceCache = res.data[0] ?? null;
  return priceCache;
}

/** Customer-portal configuration created by the setup script (falls back to Stripe's default). */
export async function getPortalConfigId(): Promise<string | undefined> {
  const res = await getStripe().billingPortal.configurations.list({ active: true, limit: 20 });
  return res.data.find((c) => c.metadata?.app === "marketcap")?.id;
}
