import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/contacts/repo";

const DEFAULT_LIMIT = 50;

function getLimit(): number {
  const raw = process.env.MAX_RESEARCH_PER_DAY;
  const n = raw ? Number.parseInt(raw, 10) : DEFAULT_LIMIT;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_LIMIT;
}

/**
 * Throws if today's research_runs count is at or above MAX_RESEARCH_PER_DAY.
 * Cheap safety net so an accidental loop doesn't burn the CEO's Anthropic
 * or Tavily budget overnight.
 */
export async function assertDailyQuota(): Promise<void> {
  if (!isSupabaseConfigured()) return; // seed-only mode never persists runs
  const limit = getLimit();
  const supabase = await createServiceClient();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("research_runs")
    .select("*", { count: "exact", head: true })
    .gte("started_at", startOfDay.toISOString());

  if (error) {
    console.error("[quota] count check failed:", error.message);
    return; // fail open — better than blocking the CEO on a transient DB error
  }

  if ((count ?? 0) >= limit) {
    throw new Error(
      `Daily research budget exhausted (${count}/${limit}). Adjust MAX_RESEARCH_PER_DAY or wait until tomorrow.`
    );
  }
}
