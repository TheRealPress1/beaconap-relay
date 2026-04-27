"use server";

import { revalidatePath } from "next/cache";
import { generateDraft } from "@/lib/outreach/prompts";
import { listStyleExamples } from "@/lib/outreach/repo";
import { getContactById, isSupabaseConfigured } from "@/lib/contacts/repo";
import { getLatestBriefing } from "@/lib/research/repo";
import { createServiceClient } from "@/lib/supabase/server";
import type {
  OutreachDraftRow,
  OutreachDraftStatus,
  OutreachTone,
} from "@/lib/supabase/types";
import type { DraftInputs } from "@/lib/outreach/types";

export async function draftOutreachAction(input: {
  contactId: string;
  tone: OutreachTone;
  runId?: string;
}): Promise<OutreachDraftRow> {
  const contact = await getContactById(input.contactId);
  if (!contact) throw new Error("Contact not found");

  const researchContact = {
    id: contact.id,
    full_name: contact.full_name,
    first_name: contact.first_name,
    last_name: contact.last_name,
    company: contact.company,
    title: contact.title,
    industry: contact.industry,
    topics: contact.topics ?? [],
  };

  const latest = await getLatestBriefing(researchContact, { fallbackToDemo: true });
  const styleExamples = await listStyleExamples();

  const draftInputs: DraftInputs = {
    contact: {
      id: contact.id,
      full_name: contact.full_name,
      first_name: contact.first_name,
      company: contact.company,
      title: contact.title,
      industry: contact.industry,
      topics: contact.topics ?? [],
    },
    briefing: latest
      ? {
          talking_points: latest.briefing.talking_points,
          findings: latest.briefing.findings.map((f, idx) => ({
            id: `f-${idx}`,
            kind: f.kind,
            title: f.title,
            url: f.url,
            source: f.source,
            summary: f.summary,
            talking_points: f.talking_points,
          })),
        }
      : null,
    tone: input.tone,
    styleExamples: styleExamples.map((s) => ({
      kind: s.kind,
      label: s.label,
      body: s.body,
    })),
  };

  const payload = await generateDraft(draftInputs);

  if (!isSupabaseConfigured()) {
    return synthesizeDraft({
      contactId: contact.id,
      runId: input.runId ?? null,
      tone: input.tone,
      payload,
    });
  }

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("outreach_drafts")
    .insert({
      contact_id: contact.id,
      run_id: input.runId ?? null,
      tone: input.tone,
      status: "draft",
      subject: payload.subject,
      body: payload.body,
      used_findings: payload.used_findings,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Draft persist failed: ${error?.message ?? "unknown"}`);
  }

  revalidatePath("/outreach");
  revalidatePath(`/contacts/${contact.id}`);
  return data;
}

export async function markDraftStatusAction(input: {
  draftId: string;
  status: OutreachDraftStatus;
  via?: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = await createServiceClient();
  const sentNow = ["sent", "copied"].includes(input.status);

  const { data, error } = await supabase
    .from("outreach_drafts")
    .update({
      status: input.status,
      sent_at: sentNow ? new Date().toISOString() : null,
      sent_via: input.via ?? null,
    })
    .eq("id", input.draftId)
    .select("contact_id")
    .single();
  if (error) throw new Error(`Status update failed: ${error.message}`);

  if (data && input.status === "sent") {
    await supabase
      .from("contacts")
      .update({ last_touch_at: new Date().toISOString() })
      .eq("id", data.contact_id);
    revalidatePath(`/contacts/${data.contact_id}`);
  }
  revalidatePath("/outreach");
  revalidatePath("/");
}

export async function updateDraftTextAction(input: {
  draftId: string;
  subject: string;
  body: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("outreach_drafts")
    .update({ subject: input.subject, body: input.body })
    .eq("id", input.draftId);
  if (error) throw new Error(`Draft edit failed: ${error.message}`);
  revalidatePath("/outreach");
}

function synthesizeDraft(input: {
  contactId: string;
  runId: string | null;
  tone: OutreachTone;
  payload: { subject: string; body: string; used_findings: OutreachDraftRow["used_findings"] };
}): OutreachDraftRow {
  const now = new Date().toISOString();
  return {
    id: `local-${Date.now()}`,
    contact_id: input.contactId,
    run_id: input.runId,
    tone: input.tone,
    status: "draft",
    subject: input.payload.subject,
    body: input.payload.body,
    used_findings: input.payload.used_findings,
    sent_at: null,
    sent_via: null,
    created_at: now,
    updated_at: now,
  };
}
