import "server-only";
import { askJson } from "@/lib/anthropic";
import type { ResearchFindingKind } from "@/lib/supabase/types";
import type { BriefingPayload, Finding, ResearchContact, SearchHit } from "./types";

const SYSTEM = `You are a senior research analyst preparing a one-page client briefing for a CEO who is about to send personalized outreach. The CEO works in capital markets and finance consulting.

You will receive:
- A contact (name, company, title, industry, topics they care about).
- 5–25 raw search results (title, URL, source domain, publish date if available, short excerpt).

Return STRICT JSON only — no prose, no markdown — with this exact shape:

{
  "talking_points": ["string", "string", "string"],
  "findings": [
    {
      "kind": "podcast" | "article" | "interview" | "linkedin_post" | "other",
      "title": "string (use the original title; trim noisy site suffixes)",
      "url": "string (the canonical URL)",
      "source": "string (publication name)",
      "published_at": "ISO 8601 string or null",
      "summary": "2–3 sentence factual summary",
      "talking_points": ["1–2 talking points the CEO can use", ...],
      "raw_excerpt": "string or null (≤220 chars, only if it adds value)",
      "relevance_score": 0..1
    }
  ]
}

Rules:
- Drop any result that's clearly not about the contact or their company. Better to return fewer high-quality findings than to pad.
- "talking_points" at the TOP of the JSON are the CEO's openers — make them specific, recent, and reference findings they can cite.
- Classify "kind":
  - podcast: any audio show or podcast episode (Spotify, Apple Podcasts, Bloomberg Radio, etc.)
  - interview: long-form Q&A formatted articles, including conference fireside chats
  - linkedin_post: linkedin.com/posts or pulse URLs
  - article: news, op-eds, blog posts, magazine pieces
  - other: company press releases, generic profile pages, anything that doesn't fit above
- Score relevance 0–1: 1.0 = clearly about the contact directly; 0.7 = about their company; 0.4 = sector context; below 0.3 you should usually drop.
- If a date isn't available, use null. Do not guess.
- Return at most 12 findings, sorted by relevance_score descending.`;

export async function classifyFindings(
  contact: ResearchContact,
  hits: SearchHit[]
): Promise<BriefingPayload> {
  const fallback = heuristicBriefing(contact, hits);

  const prompt = `Contact:\n${JSON.stringify({
    name: contact.full_name,
    company: contact.company,
    title: contact.title,
    industry: contact.industry,
    topics: contact.topics,
  })}\n\nSearch results:\n${JSON.stringify(
    hits.slice(0, 25).map((h) => ({
      title: h.title,
      url: h.url,
      source: h.source,
      published_at: h.published_at,
      excerpt: h.excerpt?.slice(0, 600),
    }))
  )}\n\nReturn the JSON briefing now.`;

  const result = await askJson<BriefingPayload>({
    system: SYSTEM,
    prompt,
    maxTokens: 4000,
    fallback,
  });

  return normalize(result);
}

function normalize(payload: BriefingPayload): BriefingPayload {
  const talking = (payload.talking_points ?? []).filter((s) => typeof s === "string" && s.trim().length > 0);
  const findings = (payload.findings ?? [])
    .filter((f) => f && typeof f.title === "string" && KIND_SET.has(f.kind))
    .map<Finding>((f) => ({
      kind: f.kind,
      title: f.title.trim(),
      url: f.url ?? null,
      source: f.source ?? null,
      published_at: f.published_at ?? null,
      summary: f.summary ?? null,
      talking_points: Array.isArray(f.talking_points) ? f.talking_points.filter(Boolean) : [],
      raw_excerpt: f.raw_excerpt ?? null,
      relevance_score: clamp(f.relevance_score ?? 0.5, 0, 1),
    }))
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 12);
  return { talking_points: talking.slice(0, 6), findings };
}

const KIND_SET = new Set<ResearchFindingKind>([
  "podcast",
  "article",
  "interview",
  "linkedin_post",
  "other",
]);

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function heuristicBriefing(contact: ResearchContact, hits: SearchHit[]): BriefingPayload {
  const findings = hits.slice(0, 12).map<Finding>((h) => ({
    kind: heuristicKind(h.url, h.title),
    title: h.title,
    url: h.url,
    source: h.source ?? null,
    published_at: h.published_at ?? null,
    summary: h.excerpt?.slice(0, 280) ?? null,
    talking_points: [],
    raw_excerpt: h.excerpt?.slice(0, 220) ?? null,
    relevance_score: typeof h.score === "number" ? h.score : 0.55,
  }));

  return {
    talking_points: [
      `Open with something specific from a recent ${contact.industry ?? "industry"} story tied to ${contact.first_name}.`,
      `Reference ${contact.company ?? "their firm"}'s most recent move and ask how it changes their priorities.`,
      `Tie it back to ${contact.topics[0] ?? "your shared interests"} so it doesn't read as a cold ping.`,
    ],
    findings,
  };
}

function heuristicKind(url: string, title: string): ResearchFindingKind {
  const u = url.toLowerCase();
  const t = title.toLowerCase();
  if (u.includes("linkedin.com/posts") || u.includes("linkedin.com/pulse")) return "linkedin_post";
  if (u.includes("podcast") || u.includes("spotify.com") || u.includes("apple.com/podcasts") || t.includes("podcast")) {
    return "podcast";
  }
  if (t.includes("interview") || t.includes("q&a") || t.includes(" q & a") || t.includes("fireside")) {
    return "interview";
  }
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "interview";
  return "article";
}
