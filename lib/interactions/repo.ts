import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/contacts/repo";
import type { ContactInteractionRow, ConnectorSyncRow } from "@/lib/supabase/types";

export async function listInteractionsForContact(
  contactId: string,
  limit = 25
): Promise<ContactInteractionRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("contact_interactions")
    .select("*")
    .eq("contact_id", contactId)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[interactions] list failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function listInteractionsByContacts(
  contactIds: string[],
  perContact = 5
): Promise<Record<string, ContactInteractionRow[]>> {
  if (!isSupabaseConfigured() || contactIds.length === 0) return {};
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("contact_interactions")
    .select("*")
    .in("contact_id", contactIds)
    .order("occurred_at", { ascending: false });
  if (error) {
    console.error("[interactions] listByContacts failed:", error.message);
    return {};
  }
  const grouped: Record<string, ContactInteractionRow[]> = {};
  for (const row of data ?? []) {
    const arr = grouped[row.contact_id] ?? (grouped[row.contact_id] = []);
    if (arr.length < perContact) arr.push(row);
  }
  return grouped;
}

export async function getConnectorSync(provider: string): Promise<ConnectorSyncRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("connector_syncs")
    .select("*")
    .eq("provider", provider)
    .maybeSingle();
  if (error) {
    console.error("[connector_syncs] get failed:", error.message);
    return null;
  }
  return data;
}

export async function listConnectorSyncs(): Promise<ConnectorSyncRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("connector_syncs")
    .select("*")
    .order("provider");
  if (error) {
    console.error("[connector_syncs] list failed:", error.message);
    return [];
  }
  return data ?? [];
}
