import "server-only";
import type { SearchHit, SearchProvider } from "./types";

const TAVILY_URL = "https://api.tavily.com/search";

type TavilyResult = {
  title: string;
  url: string;
  content?: string;
  score?: number;
  published_date?: string;
  raw_content?: string;
};

type TavilyResponse = {
  results?: TavilyResult[];
};

async function tavilySearch(query: string): Promise<SearchHit[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not set; flip RESEARCH_DEMO_MODE=true or add a key.");
  }

  const response = await fetch(TAVILY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: 8,
      include_answer: false,
      include_raw_content: false,
    }),
    // Search results don't need cache
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Tavily ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as TavilyResponse;
  return (data.results ?? []).map<SearchHit>((r) => ({
    title: r.title,
    url: r.url,
    source: deriveSource(r.url),
    published_at: r.published_date ?? null,
    excerpt: r.content,
    score: typeof r.score === "number" ? clamp(r.score, 0, 1) : undefined,
  }));
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function deriveSource(url: string): string | undefined {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export const tavilyProvider: SearchProvider = {
  id: "tavily",
  search: tavilySearch,
};
