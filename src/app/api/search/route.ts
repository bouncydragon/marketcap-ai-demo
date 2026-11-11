import { getUser } from "@/lib/auth";
import { FinnhubError, hasApiKey, searchSymbols } from "@/lib/finnhub";

export async function GET(request: Request) {
  if (!(await getUser())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (q.length < 1 || q.length > 30) return Response.json({ results: [] });
  if (!hasApiKey()) return Response.json({ error: "missing_key" }, { status: 503 });
  try {
    return Response.json({ results: await searchSymbols(q) });
  } catch (err) {
    const rl = err instanceof FinnhubError && err.code === "rate_limited";
    return Response.json({ error: rl ? "rate_limited" : "upstream" }, { status: rl ? 429 : 502 });
  }
}
