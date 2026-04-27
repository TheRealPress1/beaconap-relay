import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/contacts/repo";
import { ANTHROPIC_MODEL } from "@/lib/anthropic";
import { getSearchProvider, isResearchDemoMode } from "./searchProvider";
import { readCache, writeCache } from "./cache";
import { classifyFindings } from "./prompts";
import { demoBriefing } from "./demo";
import { assertDailyQuota } from "./quota";
import { listInteractionsForContact } from "@/lib/interactions/repo";
import type {
  BriefingPayload,
  PriorInteraction,
  ResearchContact,
  SearchHit,
} from "./types";
import type { ResearchRunRow } from "@/lib/supabase/types";

const PRIOR_LOOKBACK_DAYS = 90;

export type RunResult = {
  run: ResearchRunRow;
  briefing: BriefingPayload;
};

function buildQueries(contact: ResearchContact): string[] {
  const fullName = contact.full_name;
  const company = contact.company;
  const queries: string[] = [];

  if (fullName && company) queries.push(`"${fullName}" "${company}"`);
  if (fullName) {
    queries.push(`"${fullName}" podcast`);
    queries.push(`"${fullName}" interview OR Q&A`);
    queries.push(`site:linkedin.com/posts "${fullName}"`);
  }
  if (company) {
    const month = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
    queries.push(`"${company}" news ${month}`);
    if (contact.industry) queries.push(`"${company}" ${contact.industry}`);
  }
  return queries.slice(0, 6);
}

export async function runResearch(contact: ResearchContact): Promise<RunResult> {
  await assertDailyQuota();

  const supabase = isSupabaseConfigured() ? await createServiceClient() : null;
  const provider = getSearchProvider();
  const demoMode = isResearchDemoMode();
  const queries = buildQueries(contact);

  // Insert run row in 'running' state.
  let run: ResearchRunRow;
  if (supabase) {
    const { data, error } = await supabase
      .from("research_runs")
      .insert({
        contact_id: contact.id,
        status: "running",
        model: ANTHROPIC_MODEL,
        search_provider: demoMode ? "demo" : provider.id,
        query_count: queries.length,
      })
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(`research_runs insert failed: ${error?.message ?? "unknown"}`);
    }
    run = data;
  } else {
    run = stubRun(contact.id, demoMode ? "demo" : provider.id, queries.length);
  }

  try {
    const priorInteractions = await loadPriorInteractions(contact.id);
    const briefing = demoMode
      ? demoBriefing(contact)
      : await runLive(contact, queries, provider, priorInteractions);

    if (supabase) {
      const { error: upError } = await supabase
        .from("research_runs")
        .update({
          status: "done",
          finished_at: new Date().toISOString(),
          talking_points: briefing.talking_points,
        })
        .eq("id", run.id);
      if (upError) {
        console.error("[research] failed to mark run done:", upError.message);
      }

      if (briefing.findings.length > 0) {
        const { error: insertError } = await supabase
          .from("research_findings")
          .insert(
            briefing.findings.map((f) => ({
              run_id: run.id,
              contact_id: contact.id,
              kind: f.kind,
              title: f.title,
              url: f.url,
              source: f.source,
              published_at: f.published_at,
              summary: f.summary,
              talking_points: f.talking_points,
              raw_excerpt: f.raw_excerpt,
              relevance_score: f.relevance_score,
            }))
          );
        if (insertError) {
          console.error("[research] findings insert failed:", insertError.message);
        }
      }
    }

    return {
      run: { ...run, status: "done", talking_points: briefing.talking_points, finished_at: new Date().toISOString() },
      briefing,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (supabase) {
      await supabase
        .from("research_runs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error: message.slice(0, 600),
        })
        .eq("id", run.id);
    }
    throw err;
  }
}

async function runLive(
  contact: ResearchContact,
  queries: string[],
  provider: { id: string; search: (q: string) => Promise<SearchHit[]> },
  priorInteractions: PriorInteraction[]
): Promise<BriefingPayload> {
  const all: SearchHit[] = [];
  for (const query of queries) {
    let hits = await readCache(provider.id, query);
    if (!hits) {
      try {
        hits = await provider.search(query);
        await writeCache(provider.id, query, hits);
      } catch (err) {
        console.error(`[research] ${provider.id} search "${query}" failed:`, err);
        hits = [];
      }
    }
    all.push(...hits);
  }

  const deduped = dedupeByUrl(all);
  return classifyFindings(contact, deduped, priorInteractions);
}

async function loadPriorInteractions(contactId: string): Promise<PriorInteraction[]> {
  if (!isSupabaseConfigured()) return [];
  const cutoff = Date.now() - PRIOR_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const rows = await listInteractionsForContact(contactId, 8);
  return rows
    .filter((r) => new Date(r.occurred_at).getTime() >= cutoff)
    .map<PriorInteraction>((r) => ({
      occurred_at: r.occurred_at,
      source: r.source,
      title: r.title,
      summary: r.summary,
    }));
}

function dedupeByUrl(hits: SearchHit[]): SearchHit[] {
  const seen = new Set<string>();
  const out: SearchHit[] = [];
  for (const h of hits) {
    if (!h?.url) continue;
    const key = h.url.replace(/[?#].*$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(h);
  }
  return out;
}

function stubRun(contactId: string, providerId: string, queryCount: number): ResearchRunRow {
  const now = new Date().toISOString();
  return {
    id: `local-${Date.now()}`,
    contact_id: contactId,
    status: "running",
    started_at: now,
    finished_at: null,
    model: ANTHROPIC_MODEL,
    search_provider: providerId,
    query_count: queryCount,
    error: null,
    talking_points: [],
    created_at: now,
  };
}
