import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/contacts/repo";
import { demoBriefing } from "./demo";
import type { BriefingPayload, ResearchContact } from "./types";
import type {
  ResearchFindingRow,
  ResearchRunRow,
} from "@/lib/supabase/types";

export type LatestBriefing = {
  run: ResearchRunRow;
  briefing: BriefingPayload;
};

/**
 * Load the most recent done run + findings for a contact. Returns null if
 * no run has been completed yet (or, in seed-only mode, falls back to
 * demoBriefing(contact) so contact pages always render with content).
 */
export async function getLatestBriefing(
  contact: ResearchContact,
  { fallbackToDemo = true } = {}
): Promise<LatestBriefing | null> {
  if (!isSupabaseConfigured()) {
    if (!fallbackToDemo) return null;
    return synthesizeDemoLatest(contact);
  }

  const supabase = await createServiceClient();
  const { data: run, error: runError } = await supabase
    .from("research_runs")
    .select("*")
    .eq("contact_id", contact.id)
    .eq("status", "done")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (runError) {
    console.error("[research] latest run lookup failed:", runError.message);
    return null;
  }
  if (!run) return null;

  const { data: findings, error: findingError } = await supabase
    .from("research_findings")
    .select("*")
    .eq("run_id", run.id)
    .order("relevance_score", { ascending: false });

  if (findingError) {
    console.error("[research] findings lookup failed:", findingError.message);
  }

  return {
    run,
    briefing: {
      talking_points: run.talking_points ?? [],
      findings: (findings ?? []).map(toFinding),
    },
  };
}

function toFinding(f: ResearchFindingRow) {
  return {
    kind: f.kind,
    title: f.title,
    url: f.url,
    source: f.source,
    published_at: f.published_at,
    summary: f.summary,
    talking_points: f.talking_points ?? [],
    raw_excerpt: f.raw_excerpt,
    relevance_score: Number(f.relevance_score),
  };
}

function synthesizeDemoLatest(contact: ResearchContact): LatestBriefing {
  const now = new Date().toISOString();
  const briefing = demoBriefing(contact);
  return {
    run: {
      id: `demo-${contact.id}`,
      contact_id: contact.id,
      status: "done",
      started_at: now,
      finished_at: now,
      model: "demo",
      search_provider: "demo",
      query_count: 0,
      error: null,
      talking_points: briefing.talking_points,
      created_at: now,
    },
    briefing,
  };
}
