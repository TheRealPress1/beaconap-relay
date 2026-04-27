"use server";

import { revalidatePath } from "next/cache";
import { askJson } from "@/lib/anthropic";
import { activeTopicLabels } from "@/lib/topics/taxonomy";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, listContacts } from "@/lib/contacts/repo";
import type { ContactRow, ProposedTopic } from "@/lib/supabase/types";

type ProposalForContact = {
  contactId: string;
  proposed: ProposedTopic[];
};

const INDUSTRY_HEURISTICS: Record<string, string[]> = {
  "asset management": ["Asset Management", "Multi-Asset"],
  "private credit": ["Private Credit", "M&A"],
  "private equity": ["Private Equity", "M&A"],
  "hedge funds": ["Hedge Funds", "Risk & Compliance"],
  "market making": ["Market Making", "Trading Tech"],
  "investment banking": ["M&A", "IPO Markets"],
  "venture capital": ["Private Equity"],
  "real estate": ["Private Equity"],
  "insurance": ["Risk & Compliance", "Multi-Asset"],
  "fintech": ["AI in Finance", "Crypto / Digital"],
  "crypto": ["Crypto / Digital"],
};

const TITLE_HEURISTICS: Array<[RegExp, string]> = [
  [/risk|compliance|audit|regul/i, "Risk & Compliance"],
  [/esg|sustainab|climate/i, "ESG"],
  [/m&a|merger|acquisition/i, "M&A"],
  [/macro|rates|fixed.income|fx/i, "Macro & Rates"],
  [/ai|machine.learning|data.science/i, "AI in Finance"],
  [/trading|execution|market.maker/i, "Trading Tech"],
  [/multi.?asset|allocation/i, "Multi-Asset"],
];

function heuristicProposals(
  contact: Pick<ContactRow, "industry" | "title">,
  taxonomy: string[]
): ProposedTopic[] {
  const now = new Date().toISOString();
  const proposed = new Map<string, number>();

  if (contact.industry) {
    const matched = INDUSTRY_HEURISTICS[contact.industry.toLowerCase()] ?? [];
    matched.forEach((t, idx) => proposed.set(t, Math.max(proposed.get(t) ?? 0, idx === 0 ? 0.9 : 0.7)));
    // Direct industry → topic match by label
    const direct = taxonomy.find((t) => t.toLowerCase() === contact.industry!.toLowerCase());
    if (direct) proposed.set(direct, 0.95);
  }
  if (contact.title) {
    for (const [pattern, topic] of TITLE_HEURISTICS) {
      if (pattern.test(contact.title)) {
        proposed.set(topic, Math.max(proposed.get(topic) ?? 0, 0.75));
      }
    }
  }

  return Array.from(proposed.entries())
    .filter(([topic]) => taxonomy.includes(topic))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([topic, confidence]) => ({
      topic,
      confidence,
      source: "heuristic" as const,
      proposed_at: now,
    }));
}

const SYSTEM = `You are a financial-services CRM topic tagger. Pick up to 3 topics from the controlled vocabulary that best describe a contact's professional focus. Confidence is 0.0-1.0. Return JSON only.`;

export async function proposeTopicsForContact(
  contact: Pick<ContactRow, "id" | "first_name" | "last_name" | "company" | "title" | "industry">,
  taxonomyOverride?: string[]
): Promise<ProposedTopic[]> {
  const taxonomy = taxonomyOverride ?? (await activeTopicLabels());
  const fallback = heuristicProposals(contact, taxonomy);

  const prompt = `Allowed topics: ${JSON.stringify(taxonomy)}\nContact:\n${JSON.stringify({
    name: `${contact.first_name} ${contact.last_name ?? ""}`.trim(),
    company: contact.company,
    title: contact.title,
    industry: contact.industry,
  })}\n\nReturn JSON: { "topics": [{ "topic": "<allowed-label>", "confidence": 0..1 }] } with up to 3 entries. Topics must come from the allowed list verbatim. No prose.`;

  const result = await askJson<{ topics: Array<{ topic: string; confidence: number }> }>({
    system: SYSTEM,
    prompt,
    maxTokens: 400,
    fallback: { topics: fallback.map(({ topic, confidence }) => ({ topic, confidence })) },
  });

  const now = new Date().toISOString();
  return (result.topics ?? [])
    .filter((t) => taxonomy.includes(t.topic))
    .slice(0, 3)
    .map((t) => ({
      topic: t.topic,
      confidence: Math.max(0, Math.min(1, t.confidence ?? 0)),
      source: "claude" as const,
      proposed_at: now,
    }));
}

export async function proposeTopicsForAll(): Promise<{ updated: number }> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Topic proposals require a real database.");
  }
  const supabase = await createServiceClient();
  const taxonomy = await activeTopicLabels();
  const contacts = await listContacts();

  const proposals: ProposalForContact[] = [];
  for (const c of contacts) {
    if (c.proposed_topics?.length) continue; // already has pending review
    const proposed = await proposeTopicsForContact(c, taxonomy);
    if (proposed.length > 0) proposals.push({ contactId: c.id, proposed });
  }

  for (const p of proposals) {
    const { error } = await supabase
      .from("contacts")
      .update({ proposed_topics: p.proposed })
      .eq("id", p.contactId);
    if (error) {
      console.error(`[topics] update failed for ${p.contactId}:`, error.message);
    }
  }

  revalidatePath("/contacts/review-topics");
  revalidatePath("/contacts");
  revalidatePath("/");
  return { updated: proposals.length };
}

export async function approveProposedTopics(
  contactId: string,
  acceptedTopics: string[]
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = await createServiceClient();
  const { data: existing, error: fetchError } = await supabase
    .from("contacts")
    .select("topics")
    .eq("id", contactId)
    .single();
  if (fetchError || !existing) {
    throw new Error(`Contact not found: ${fetchError?.message ?? contactId}`);
  }

  const merged = Array.from(
    new Set([...(existing.topics ?? []), ...acceptedTopics.filter(Boolean)])
  );

  const { error } = await supabase
    .from("contacts")
    .update({ topics: merged, proposed_topics: [] })
    .eq("id", contactId);
  if (error) throw new Error(`Approve failed: ${error.message}`);

  revalidatePath("/contacts/review-topics");
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/");
}

export async function dismissProposedTopics(contactId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("contacts")
    .update({ proposed_topics: [] })
    .eq("id", contactId);
  if (error) throw new Error(`Dismiss failed: ${error.message}`);
  revalidatePath("/contacts/review-topics");
}
