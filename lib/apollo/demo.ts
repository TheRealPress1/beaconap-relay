import "server-only";
import type { ApolloEnrichment, ApolloSequenceResult } from "./types";

export function isApolloDemoMode(): boolean {
  if (process.env.APOLLO_DEMO_MODE === "true") return true;
  if (!process.env.APOLLO_API_KEY) return true;
  return false;
}

const ENRICHMENT_TEMPLATES: Record<string, Partial<ApolloEnrichment>> = {
  "asset management": {
    seniority: "C-Suite",
    industry: "Investment Management",
    employment_history: [
      { title: "Managing Director", company: "BlackRock", start: "2019-04", end: null },
      { title: "Vice President", company: "Goldman Sachs", start: "2014-08", end: "2019-03" },
    ],
  },
  "private credit": {
    seniority: "Partner",
    industry: "Private Capital",
    employment_history: [
      { title: "Partner — Private Credit", company: "Apollo Global", start: "2021-09", end: null },
      { title: "Director", company: "Carlyle", start: "2016-06", end: "2021-08" },
    ],
  },
  "hedge funds": {
    seniority: "Director",
    industry: "Hedge Funds",
    employment_history: [
      { title: "Head of Risk Modeling", company: "Bridgewater", start: "2020-01", end: null },
    ],
  },
  "market making": {
    seniority: "VP",
    industry: "Capital Markets",
    employment_history: [
      { title: "Head of Equities Tech", company: "Citadel Securities", start: "2022-02", end: null },
    ],
  },
};

export function demoEnrichment(input: {
  industry: string | null;
  email: string | null;
  full_name: string;
  company: string | null;
  title: string | null;
}): ApolloEnrichment {
  const key = (input.industry ?? "").toLowerCase();
  const template = ENRICHMENT_TEMPLATES[key] ?? {};
  const slug = input.full_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  return {
    source_id: `apollo-demo-${slug}`,
    title: input.title ?? template.industry ? `${template.industry ?? "Senior"} leader` : null,
    seniority: template.seniority ?? "Director",
    industry: template.industry ?? input.industry,
    linkedin_url: `https://www.linkedin.com/in/${slug}-demo`,
    twitter_url: null,
    github_url: null,
    city: "New York",
    state: "NY",
    country: "United States",
    employment_history: template.employment_history ?? [],
  };
}

export function demoSequencePush(sequenceId: string): ApolloSequenceResult {
  return {
    sequence_id: sequenceId,
    contact_apollo_id: `apollo-demo-${Date.now()}`,
    status: "added",
    message: `(demo) Added to Apollo sequence ${sequenceId}.`,
  };
}
