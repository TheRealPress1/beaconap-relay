import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/contacts/repo";
import type {
  OutreachDraftRow,
  OutreachStyleRow,
} from "@/lib/supabase/types";

export async function listLatestDrafts(limit = 50): Promise<OutreachDraftRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("outreach_drafts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[outreach] listLatestDrafts failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getLatestDraftForContact(
  contactId: string
): Promise<OutreachDraftRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("outreach_drafts")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[outreach] getLatestDraftForContact failed:", error.message);
    return null;
  }
  return data;
}

export async function getDraft(id: string): Promise<OutreachDraftRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("outreach_drafts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[outreach] getDraft failed:", error.message);
    return null;
  }
  return data;
}

export async function listStyleExamples({
  includeArchived = false,
}: { includeArchived?: boolean } = {}): Promise<OutreachStyleRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("outreach_style")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[outreach] listStyleExamples failed:", error.message);
    return [];
  }
  const rows = data ?? [];
  return includeArchived ? rows : rows.filter((r) => !r.archived_at);
}
