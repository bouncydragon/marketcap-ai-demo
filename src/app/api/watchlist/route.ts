import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FinnhubError, getQuote, hasApiKey } from "@/lib/finnhub";

const SYMBOL = /^[A-Z][A-Z0-9.\-]{0,9}$/;

/**
 * Saves a stock to the signed-in user's watchlist. The database (Row Level Security) is the real gate:
 * it only lets paying users insert, and only rows that belong to them.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { symbol?: unknown } | null;
  const symbol = typeof body?.symbol === "string" ? body.symbol.trim().toUpperCase() : "";
  if (!SYMBOL.test(symbol)) return Response.json({ error: "invalid_symbol" }, { status: 400 });

  // Only accept tickers that really exist.
  if (hasApiKey()) {
    try {
      await getQuote(symbol);
    } catch (err) {
      if (err instanceof FinnhubError && err.code === "not_found") return Response.json({ error: "unknown_symbol" }, { status: 404 });
      /* rate limit / upstream hiccup: let the save through */
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("watchlist_items").insert({ symbol }).select("symbol,created_at").single();

  if (error) {
    if (error.code === "42501") return Response.json({ error: "upgrade_required" }, { status: 402 }); // RLS: not on the paid plan
    if (error.code === "23505") return Response.json({ error: "already_saved" }, { status: 409 });
    if (error.message.includes("watchlist_limit_reached")) return Response.json({ error: "limit_reached" }, { status: 400 });
    return Response.json({ error: "save_failed" }, { status: 500 });
  }
  return Response.json({ item: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const symbol = (new URL(request.url).searchParams.get("symbol") ?? "").toUpperCase();
  if (!SYMBOL.test(symbol)) return Response.json({ error: "invalid_symbol" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("watchlist_items").delete().eq("symbol", symbol); // RLS limits this to the user's own rows
  if (error) return Response.json({ error: "delete_failed" }, { status: 500 });
  return Response.json({ ok: true });
}
