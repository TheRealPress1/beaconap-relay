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

// Title-keyword → HR topic map. Confidence 0..1. Several keywords can fire and
// we keep the highest confidence per topic. The heuristic runs in demo mode
// (no Anthropic key) so the topics here MUST line up with the active HR
// taxonomy seeded by 0006_hr_taxonomy.sql.
const TITLE_HEURISTICS: Array<[RegExp, string, number]> = [
  // Acquisition / sourcing
  [/talent\s*acquisition|recruit(?:ing|er)?|sourcing/i, "Talent Acquisition", 0.95],
  [/talent\s*strateg/i, "Talent Acquisition", 0.85],
  [/executive\s*search|executive\s*recruit/i, "Executive Search", 0.95],

  // Comp & total rewards
  [/compensation|total\s*rewards?|\brewards?\b|payroll|equity\s*plan/i, "Compensation & Benefits", 0.95],

  // Performance / promotion / talent management
  [/performance|promotion|calibration|talent\s*management/i, "Performance & Promotion", 0.85],

  // L&D
  [/l\s*&\s*d|learning|leadership\s*development|coaching/i, "L&D / Learning", 0.85],

  // Workforce planning / people ops
  [/people\s*ops|people\s*operation|workforce|organi[sz]ation\s*design|head\s*of\s*hr|head\s*of\s*human\s*resources|chief\s*human\s*resources|chief\s*people|chro\b|cpo\b/i, "Workforce Planning", 0.8],

  // DEI
  [/\bdei\b|diversity|inclusion|belonging|equity\s*&|equity\s*and/i, "DEI & Inclusion", 0.95],

  // Employer brand
  [/employer\s*brand|talent\s*brand|recruiting\s*marketing/i, "Employer Brand", 0.9],

  // HR Tech
  [/hr\s*tech|hris|workday|greenhouse|lattice|ats\b|people\s*analytics/i, "HR Tech / HRIS", 0.9],

  // Compliance & employment law
  [/compliance|employment\s*law|labor\s*law|wage\s*&\s*hour|classification/i, "Compliance & Employment Law", 0.85],

  // AI in HR
  [/ai\s*in\s*hr|hr\s*ai|automation\s*hr|llm\s*hr/i, "AI in HR", 0.8],

  // ESG / human capital reporting
  [/human\s*capital|esg|sustainab|csr|corporate\s*responsibility/i, "ESG & Human Capital", 0.8],

  // Hybrid / RTO
  [/hybrid|return.?to.?office|\brto\b|workplace\s*policy/i, "Hybrid & Return-to-Office", 0.9],
];

// Generic senior HR roles get a broader spread because the title alone doesn't
// disambiguate which sub-area they own.
const SENIOR_HR = /chro\b|chief\s*human\s*resources|chief\s*people|head\s*of\s*hr|head\s*of\s*human\s*resources/i;

function heuristicProposals(
  contact: Pick<ContactRow, "industry" | "title" | "company">,
  taxonomy: string[]
): ProposedTopic[] {
  const now = new Date().toISOString();
  const proposed = new Map<string, number>();
  const taxonomySet = new Set(taxonomy);

  if (contact.title) {
    for (const [pattern, topic, confidence] of TITLE_HEURISTICS) {
      if (pattern.test(contact.title)) {
        proposed.set(topic, Math.max(proposed.get(topic) ?? 0, confidence));
      }
    }
    // Senior HR roles: spread some confidence across Compensation +
    // Performance + Workforce so the chip review surfaces multiple options.
    if (SENIOR_HR.test(contact.title)) {
      for (const broad of ["Compensation & Benefits", "Performance & Promotion", "Workforce Planning"]) {
        proposed.set(broad, Math.max(proposed.get(broad) ?? 0, 0.65));
      }
    }
  }

  // Industry context: every contact in this CRM is an asset-management HR
  // leader, so tag with the industry context topic at low-but-meaningful
  // confidence. Helps the "by industry" view without crowding out role-
  // specific tags.
  if (taxonomySet.has("Asset Management (industry)")) {
    proposed.set("Asset Management (industry)", Math.max(proposed.get("Asset Management (industry)") ?? 0, 0.7));
  }

  // Direct industry-label match (kept for forward compatibility with future
  // industry values like "Insurance" if Michael ever expands his book).
  if (contact.industry) {
    const direct = taxonomy.find((t) => t.toLowerCase() === contact.industry!.toLowerCase());
    if (direct) proposed.set(direct, Math.max(proposed.get(direct) ?? 0, 0.9));
  }

  return Array.from(proposed.entries())
    .filter(([topic]) => taxonomySet.has(topic))
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
