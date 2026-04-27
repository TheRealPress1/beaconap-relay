"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { getContactById, isSupabaseConfigured } from "@/lib/contacts/repo";
import { enrichApolloPerson, pushApolloSequence } from "@/lib/apollo/client";
import {
  demoEnrichment,
  demoSequencePush,
  isApolloDemoMode,
} from "@/lib/apollo/demo";
import type { ApolloEnrichment } from "@/lib/apollo/types";

export type ApolloEnrichResult = {
  enrichment: ApolloEnrichment | null;
  demo: boolean;
};

export async function enrichContactAction(
  contactId: string
): Promise<ApolloEnrichResult> {
  const contact = await getContactById(contactId);
  if (!contact) throw new Error("Contact not found");

  const demo = isApolloDemoMode();
  let enrichment: ApolloEnrichment | null;

  if (demo) {
    enrichment = demoEnrichment({
      industry: contact.industry,
      email: contact.email,
      full_name: contact.full_name,
      company: contact.company,
      title: contact.title,
    });
  } else {
    enrichment = await enrichApolloPerson({
      email: contact.email,
      linkedin_url: contact.linkedin_url,
      full_name: contact.full_name,
      company: contact.company,
    });
  }

  if (!enrichment) {
    return { enrichment: null, demo };
  }

  if (isSupabaseConfigured()) {
    const supabase = await createServiceClient();
    const updates: {
      title?: string;
      industry?: string;
      linkedin_url?: string;
      updated_at: string;
    } = { updated_at: new Date().toISOString() };
    if (enrichment.title && !contact.title) updates.title = enrichment.title;
    if (enrichment.industry && !contact.industry) updates.industry = enrichment.industry;
    if (enrichment.linkedin_url && !contact.linkedin_url) {
      updates.linkedin_url = enrichment.linkedin_url;
    }

    if (Object.keys(updates).length > 1) {
      const { error: updateError } = await supabase
        .from("contacts")
        .update(updates)
        .eq("id", contact.id);
      if (updateError) {
        console.error("[apollo] contact update failed:", updateError.message);
      }
    }

    const { error: interactionError } = await supabase
      .from("contact_interactions")
      .upsert(
        {
          contact_id: contact.id,
          kind: "enrichment" as const,
          source: "apollo" as const,
          source_id: enrichment.source_id ?? `apollo-${contact.id}-${Date.now()}`,
          occurred_at: new Date().toISOString(),
          title: "Enriched with Apollo.io",
          summary: summarizeEnrichment(enrichment),
          raw: enrichment as unknown as Record<string, unknown>,
        },
        { onConflict: "source,source_id" }
      );
    if (interactionError) {
      console.error("[apollo] interaction upsert failed:", interactionError.message);
    }
  }

  revalidatePath(`/contacts/${contact.id}`);
  revalidatePath("/contacts");
  return { enrichment, demo };
}

function summarizeEnrichment(e: ApolloEnrichment): string {
  const parts: string[] = [];
  if (e.title) parts.push(e.title);
  if (e.seniority) parts.push(`Seniority: ${e.seniority}`);
  if (e.city || e.country) parts.push([e.city, e.country].filter(Boolean).join(", "));
  if (e.employment_history.length > 0) {
    const recent = e.employment_history
      .slice(0, 2)
      .map((h) => `${h.title} @ ${h.company}`)
      .join("; ");
    parts.push(`History: ${recent}`);
  }
  return parts.join(" · ");
}

export type ApolloSequencePushInput = {
  draftId: string;
  sequenceId?: string;
};

export async function pushDraftToApolloSequenceAction(
  input: ApolloSequencePushInput
): Promise<{ status: string; message: string; sequence_id: string }> {
  const sequenceId =
    input.sequenceId?.trim() || process.env.APOLLO_DEFAULT_SEQUENCE_ID || "";
  if (!sequenceId) {
    throw new Error(
      "No sequence id. Set APOLLO_DEFAULT_SEQUENCE_ID or provide one in the modal."
    );
  }

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Cannot persist sequence push.");
  }

  const supabase = await createServiceClient();
  const { data: draft, error: draftError } = await supabase
    .from("outreach_drafts")
    .select("id, contact_id")
    .eq("id", input.draftId)
    .maybeSingle();
  if (draftError || !draft) throw new Error("Draft not found");

  const contact = await getContactById(draft.contact_id);
  if (!contact) throw new Error("Contact not found");

  const demo = isApolloDemoMode();
  const result = demo
    ? demoSequencePush(sequenceId)
    : await pushApolloSequence({
        sequence_id: sequenceId,
        email: contact.email,
      });

  await supabase
    .from("outreach_drafts")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      sent_via: `apollo:${sequenceId}`,
    })
    .eq("id", draft.id);

  await supabase
    .from("contacts")
    .update({ last_touch_at: new Date().toISOString() })
    .eq("id", contact.id);

  await supabase.from("contact_interactions").insert({
    contact_id: contact.id,
    kind: "email" as const,
    source: "apollo" as const,
    source_id: `apollo-seq-${sequenceId}-${Date.now()}`,
    occurred_at: new Date().toISOString(),
    title: `Apollo sequence: ${sequenceId}`,
    summary: result.message,
    raw: { sequence_id: sequenceId, draft_id: draft.id, demo },
  });

  revalidatePath("/outreach");
  revalidatePath(`/contacts/${contact.id}`);
  return {
    status: result.status,
    message: result.message,
    sequence_id: result.sequence_id,
  };
}
