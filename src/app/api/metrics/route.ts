import { getUser } from "@/lib/auth";
import { getMetrics, hasApiKey, type Metrics } from "@/lib/finnhub";

const SYMBOL = /^[A-Z][A-Z0-9.\-]{0,9}$/;
const MAX_SYMBOLS = 25;

export async function GET(request: Request) {
  if (!(await getUser())) return Response.json({ error: "unauthorized" }, { status: 401 });

  const raw = new URL(request.url).searchParams.get("symbols") ?? "";
  const symbols = [...new Set(raw.split(",").map((s) => s.trim().toUpperCase()))]
    .filter((s) => SYMBOL.test(s))
    .slice(0, MAX_SYMBOLS);

  if (symbols.length === 0) return Response.json({ error: "no_symbols" }, { status: 400 });
  if (!hasApiKey()) return Response.json({ error: "missing_key" }, { status: 503 });

  const results = await Promise.allSettled(symbols.map(getMetrics));
  const metrics: Record<string, Metrics> = {};
  results.forEach((r, i) => {
    if (r.status === "fulfilled") metrics[symbols[i]] = r.value;
  });

  if (Object.keys(metrics).length === 0) return Response.json({ error: "upstream" }, { status: 502 });
  return Response.json({ metrics });
}
