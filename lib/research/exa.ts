import "server-only";
import type { SearchHit, SearchProvider } from "./types";

const EXA_URL = "https://api.exa.ai/search";

type ExaResult = {
  title: string;
  url: string;
  publishedDate?: string;
  text?: string;
  score?: number;
  highlights?: string[];
};

type ExaResponse = {
  results?: ExaResult[];
};

async function exaSearch(query: string): Promise<SearchHit[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error("EXA_API_KEY is not set; flip RESEARCH_DEMO_MODE=true or add a key.");
  }

  const response = await fetch(EXA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query,
      numResults: 8,
      contents: { text: { maxCharacters: 400 } },
      type: "auto",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Exa ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as ExaResponse;
  return (data.results ?? []).map<SearchHit>((r) => ({
    title: r.title,
    url: r.url,
    source: deriveSource(r.url),
    published_at: r.publishedDate ?? null,
    excerpt: r.text ?? r.highlights?.join(" • "),
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

export const exaProvider: SearchProvider = {
  id: "exa",
  search: exaSearch,
};
