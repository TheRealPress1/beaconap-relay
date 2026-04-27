import "server-only";
import type { ApolloEnrichment, ApolloSequenceResult } from "./types";

const APOLLO_BASE_URL = process.env.APOLLO_API_BASE_URL ?? "https://api.apollo.io";

type RawPerson = {
  id?: string;
  title?: string;
  seniority?: string;
  industry?: string;
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
  city?: string;
  state?: string;
  country?: string;
  employment_history?: Array<{
    title?: string;
    organization_name?: string;
    start_date?: string;
    end_date?: string | null;
  }>;
};

function authHeaders(): Record<string, string> {
  const key = process.env.APOLLO_API_KEY;
  if (!key) {
    throw new Error("APOLLO_API_KEY not set; flip APOLLO_DEMO_MODE=true or add a key.");
  }
  return {
    "Cache-Control": "no-cache",
    "Content-Type": "application/json",
    "X-Api-Key": key,
  };
}

export async function enrichApolloPerson(input: {
  email?: string | null;
  linkedin_url?: string | null;
  full_name?: string | null;
  company?: string | null;
}): Promise<ApolloEnrichment | null> {
  const url = new URL("/api/v1/people/match", APOLLO_BASE_URL);
  const body: Record<string, unknown> = {
    reveal_personal_emails: false,
  };
  if (input.email) body.email = input.email;
  if (input.linkedin_url) body.linkedin_url = input.linkedin_url;
  if (input.full_name) body.name = input.full_name;
  if (input.company) body.organization_name = input.company;

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Apollo enrich ${response.status}: ${text.slice(0, 200)}`);
  }
  const json = (await response.json()) as { person?: RawPerson };
  if (!json.person) return null;
  return normalize(json.person);
}

function normalize(raw: RawPerson): ApolloEnrichment {
  return {
    source_id: raw.id ?? null,
    title: raw.title ?? null,
    seniority: raw.seniority ?? null,
    industry: raw.industry ?? null,
    linkedin_url: raw.linkedin_url ?? null,
    twitter_url: raw.twitter_url ?? null,
    github_url: raw.github_url ?? null,
    city: raw.city ?? null,
    state: raw.state ?? null,
    country: raw.country ?? null,
    employment_history: (raw.employment_history ?? []).map((e) => ({
      title: e.title ?? "",
      company: e.organization_name ?? "",
      start: e.start_date ?? null,
      end: e.end_date ?? null,
    })),
  };
}

export async function pushApolloSequence(input: {
  sequence_id: string;
  contact_apollo_id?: string | null;
  email?: string | null;
}): Promise<ApolloSequenceResult> {
  const url = new URL(
    `/api/v1/emailer_campaigns/${input.sequence_id}/add_contact_ids`,
    APOLLO_BASE_URL
  );
  const body: Record<string, unknown> = {
    contact_ids: input.contact_apollo_id ? [input.contact_apollo_id] : [],
    emailer_campaign_id: input.sequence_id,
  };
  if (input.email && !input.contact_apollo_id) {
    body.contact_emails = [input.email];
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Apollo sequence push ${response.status}: ${text.slice(0, 200)}`);
  }
  const json = (await response.json()) as {
    contacts?: Array<{ id: string }>;
    message?: string;
  };
  return {
    sequence_id: input.sequence_id,
    contact_apollo_id: json.contacts?.[0]?.id ?? input.contact_apollo_id ?? null,
    status: json.contacts?.length ? "added" : "skipped",
    message: json.message ?? `Pushed to sequence ${input.sequence_id}.`,
  };
}
