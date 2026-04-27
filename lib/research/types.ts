import type { ResearchFindingKind } from "@/lib/supabase/types";

export type SearchHit = {
  title: string;
  url: string;
  source?: string;
  published_at?: string | null;
  excerpt?: string;
  /** Relevance score reported by the provider, normalized 0-1 if available. */
  score?: number;
};

export type SearchProvider = {
  id: "tavily" | "exa" | "demo";
  search(query: string): Promise<SearchHit[]>;
};

export type Finding = {
  kind: ResearchFindingKind;
  title: string;
  url: string | null;
  source: string | null;
  published_at: string | null;
  summary: string | null;
  talking_points: string[];
  raw_excerpt: string | null;
  relevance_score: number;
};

export type BriefingPayload = {
  talking_points: string[];
  findings: Finding[];
};

export type ResearchContact = {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string | null;
  company: string | null;
  title: string | null;
  industry: string | null;
  topics: string[];
};

/** A prior interaction (e.g. a Granola meeting) we want Claude to acknowledge
 *  in the briefing without re-surfacing as a "new" finding. */
export type PriorInteraction = {
  occurred_at: string;
  source: string;
  title: string | null;
  summary: string | null;
};
