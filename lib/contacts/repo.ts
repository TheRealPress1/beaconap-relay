import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { SEED_CONTACTS } from "@/lib/data/seed";
import type { ContactRow } from "@/lib/supabase/types";

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function listContacts(): Promise<ContactRow[]> {
  if (!isSupabaseConfigured()) {
    return SEED_CONTACTS;
  }
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("score", { ascending: false });
  if (error) {
    console.error("[contacts] listContacts failed:", error.message);
    return SEED_CONTACTS;
  }
  return data ?? [];
}

export async function getContactById(id: string): Promise<ContactRow | null> {
  if (!isSupabaseConfigured()) {
    return SEED_CONTACTS.find((c) => c.id === id) ?? null;
  }
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[contacts] getContactById failed:", error.message);
    return null;
  }
  return data;
}

export async function countContacts(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return SEED_CONTACTS.length;
  }
  const supabase = await createServiceClient();
  const { count, error } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

export async function listContactsAwaitingTopicReview(): Promise<ContactRow[]> {
  const all = await listContacts();
  return all.filter((c) => (c.proposed_topics?.length ?? 0) > 0);
}
