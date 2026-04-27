"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/contacts/repo";
import type { OutreachStyleKind } from "@/lib/supabase/types";

function ensureConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Style examples can't be persisted yet.");
  }
}

export async function addStyleAction(input: {
  kind: OutreachStyleKind;
  label: string;
  body: string;
}): Promise<void> {
  ensureConfigured();
  const label = input.label?.trim();
  const body = input.body?.trim();
  if (!label || !body) throw new Error("Label and body are required.");

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("outreach_style")
    .insert({ kind: input.kind, label, body });
  if (error) throw new Error(`Add style failed: ${error.message}`);

  revalidatePath("/settings/style");
}

export async function archiveStyleAction(id: string, archive: boolean): Promise<void> {
  ensureConfigured();
  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("outreach_style")
    .update({ archived_at: archive ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw new Error(`Archive style failed: ${error.message}`);
  revalidatePath("/settings/style");
}

export async function updateStyleAction(input: {
  id: string;
  label: string;
  body: string;
}): Promise<void> {
  ensureConfigured();
  const label = input.label?.trim();
  const body = input.body?.trim();
  if (!label || !body) throw new Error("Label and body are required.");

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("outreach_style")
    .update({ label, body })
    .eq("id", input.id);
  if (error) throw new Error(`Update style failed: ${error.message}`);
  revalidatePath("/settings/style");
}
