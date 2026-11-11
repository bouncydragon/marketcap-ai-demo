// One-time sandbox setup: creates the "MarketCap Pro" product, its $20/month price and a customer-portal
// configuration in your Stripe TEST account. Safe to re-run (it finds existing objects first).
//
//   npm run stripe:setup
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is missing from .env.local");
  process.exit(1);
}
if (!key.startsWith("sk_test_")) {
  console.error("Refusing to run: this project is sandbox-only and STRIPE_SECRET_KEY is not a test key (sk_test_...).");
  process.exit(1);
}

const stripe = new Stripe(key);
const LOOKUP_KEY = "marketcap_pro_monthly";

// Product + price
let price = (await stripe.prices.list({ lookup_keys: [LOOKUP_KEY], active: true, limit: 1 })).data[0];
if (price) {
  console.log(`Price already exists: ${price.id} ($${(price.unit_amount / 100).toFixed(2)}/${price.recurring?.interval})`);
} else {
  const product = await stripe.products.create({
    name: "MarketCap Pro",
    description: "Save stocks to your watchlist.",
    metadata: { app: "marketcap" },
  });
  price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: 2000,
    recurring: { interval: "month" },
    lookup_key: LOOKUP_KEY,
    metadata: { app: "marketcap" },
  });
  console.log(`Created product ${product.id} and price ${price.id} ($20.00/month)`);
}

// Customer portal (cancel, update card, invoices)
const configs = await stripe.billingPortal.configurations.list({ active: true, limit: 20 });
if (configs.data.some((c) => c.metadata?.app === "marketcap")) {
  console.log("Customer portal configuration already exists.");
} else {
  const cfg = await stripe.billingPortal.configurations.create({
    business_profile: { headline: "Manage your MarketCap subscription" },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
    },
    metadata: { app: "marketcap" },
  });
  console.log(`Created customer portal configuration ${cfg.id}`);
}
console.log("Stripe sandbox is ready.");
