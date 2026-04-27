import "server-only";
import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/contacts/repo";
import type { SearchHit } from "./types";

const CACHE_TTL_HOURS = 24;

function hashQuery(provider: string, query: string): string {
  return createHash("sha1").update(`${provider}::${query}`).digest("hex");
}

export async function readCache(provider: string, query: string): Promise<SearchHit[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("search_cache")
    .select("results, cached_at")
    .eq("query_hash", hashQuery(provider, query))
    .eq("provider", provider)
    .maybeSingle();
  if (error || !data) return null;
  const ageMs = Date.now() - new Date(data.cached_at).getTime();
  if (ageMs > CACHE_TTL_HOURS * 60 * 60 * 1000) return null;
  return data.results as SearchHit[];
}

export async function writeCache(provider: string, query: string, results: SearchHit[]): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("search_cache")
    .upsert(
      {
        query_hash: hashQuery(provider, query),
        provider,
        results,
        cached_at: new Date().toISOString(),
      },
      { onConflict: "query_hash,provider" }
    );
  if (error) {
    console.error("[research-cache] upsert failed:", error.message);
  }
}
