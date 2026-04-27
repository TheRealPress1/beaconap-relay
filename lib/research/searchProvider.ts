import "server-only";
import type { SearchProvider } from "./types";
import { tavilyProvider } from "./tavily";
import { exaProvider } from "./exa";

export function isResearchDemoMode(): boolean {
  if (process.env.RESEARCH_DEMO_MODE === "true") return true;
  // No keys ⇒ demo. Avoids accidental free-tier exhaustion when the team
  // forgets to flip the flag locally.
  if (!process.env.TAVILY_API_KEY && !process.env.EXA_API_KEY) return true;
  return false;
}

export function getSearchProvider(): SearchProvider {
  const id = (process.env.SEARCH_PROVIDER ?? "tavily").toLowerCase();
  if (id === "exa") return exaProvider;
  return tavilyProvider;
}
