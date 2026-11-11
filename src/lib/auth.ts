import { createClient } from "@/lib/supabase/server";

/** Returns the verified signed-in user, or null. Use in route handlers and server components. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export type Plan = "free" | "pro";

export type Account = {
  email: string;
  plan: Plan;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

/** Loads the signed-in user's plan from their own subscription row (RLS: they can only see theirs). */
export async function getAccount(): Promise<Account | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("subscriptions").select("status,current_period_end,cancel_at_period_end").maybeSingle();
  const active = data?.status === "active" || data?.status === "trialing";
  return {
    email: user.email ?? "",
    plan: active ? "pro" : "free",
    status: data?.status ?? null,
    currentPeriodEnd: data?.current_period_end ?? null,
    cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
  };
}
