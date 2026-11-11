// Read-only diagnostic: confirms the server-side keys in .env.local actually work.
//
//   npm run check:setup
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const need = ["STRIPE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
const missing = need.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Missing in .env.local:", missing.join(", "));
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const price = (await stripe.prices.list({ lookup_keys: ["marketcap_pro_monthly"], active: true, limit: 1 })).data[0];
console.log("Stripe test mode:     ", process.env.STRIPE_SECRET_KEY.startsWith("sk_test_") ? "yes" : "NO (live key!)");
console.log("Stripe Pro price:     ", price ? `${price.id}  $${price.unit_amount / 100}/${price.recurring.interval}` : "NOT FOUND (run npm run stripe:setup)");

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { count, error } = await admin.from("subscriptions").select("*", { count: "exact", head: true });
console.log("Supabase service role:", error ? `FAILED (${error.message})` : `ok (${count} subscription rows)`);

const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
const res = await anon.from("subscriptions").select("*");
console.log("Signed-out access:    ", res.error ? `blocked (${res.error.code})` : `LEAK: returned ${res.data.length} rows`);
