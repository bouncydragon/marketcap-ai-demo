import { getUser } from "@/lib/auth";
import { FinnhubError, getMarketNews, hasApiKey } from "@/lib/finnhub";

const CATEGORIES = new Set(["general", "forex", "crypto", "merger"]);

export async function GET(request: Request) {
  if (!(await getUser())) return Response.json({ error: "unauthorized" }, { status: 401 });

  const category = new URL(request.url).searchParams.get("category") ?? "general";
  if (!CATEGORIES.has(category)) return Response.json({ error: "bad_category" }, { status: 400 });
  if (!hasApiKey()) return Response.json({ error: "missing_key" }, { status: 503 });

  try {
    return Response.json({ news: await getMarketNews(category) });
  } catch (err) {
    const rateLimited = err instanceof FinnhubError && err.code === "rate_limited";
    return Response.json({ error: rateLimited ? "rate_limited" : "upstream" }, { status: rateLimited ? 429 : 502 });
  }
}
