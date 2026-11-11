import { getUser } from "@/lib/auth";
import { FinnhubError, getMarketStatus, getQuote, hasApiKey, type Quote } from "@/lib/finnhub";

const SYMBOL = /^[A-Z][A-Z0-9.\-]{0,9}$/;
const MAX_SYMBOLS = 25;

export async function GET(request: Request) {
  if (!(await getUser())) return Response.json({ error: "unauthorized" }, { status: 401 });

  const raw = new URL(request.url).searchParams.get("symbols") ?? "";
  const symbols = [...new Set(raw.split(",").map((s) => s.trim().toUpperCase()))]
    .filter((s) => SYMBOL.test(s))
    .slice(0, MAX_SYMBOLS);

  if (symbols.length === 0) {
    return Response.json({ error: "no_symbols" }, { status: 400 });
  }
  if (!hasApiKey()) {
    return Response.json({ error: "missing_key" }, { status: 503 });
  }

  const [results, status] = await Promise.all([
    Promise.allSettled(symbols.map(getQuote)),
    getMarketStatus().catch(() => null),
  ]);

  const quotes: Record<string, Quote> = {};
  const failed: string[] = [];
  let rateLimited = false;
  results.forEach((r, i) => {
    if (r.status === "fulfilled") quotes[symbols[i]] = r.value;
    else {
      failed.push(symbols[i]);
      if (r.reason instanceof FinnhubError && r.reason.code === "rate_limited") rateLimited = true;
    }
  });

  if (Object.keys(quotes).length === 0) {
    return Response.json({ error: rateLimited ? "rate_limited" : "upstream", failed }, { status: rateLimited ? 429 : 502 });
  }

  return Response.json({ quotes, failed, status, fetchedAt: Date.now() });
}
