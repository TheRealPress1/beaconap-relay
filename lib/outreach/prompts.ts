import "server-only";
import { askJson } from "@/lib/anthropic";
import { demoDraft, isOutreachDemoMode } from "./demo";
import type { DraftInputs, DraftPayload } from "./types";

const SYSTEM = `You are Michael Sands, founder of BeaconAP. You write personalized outreach emails to senior people in capital markets and finance. Your house style:
- One specific, recent reference per email — never two greetings, never paragraphs of throat-clearing.
- Crisp sentences, plain words, no jargon for jargon's sake.
- 90–160 words in the body. Subject line under 70 characters.
- A single light call-to-action at the end. Never demand a meeting, never link Calendly.
- Never invent quotes, statistics, dates, or events you can't ground in the provided briefing.
- Use the contact's first name only.

Return STRICT JSON only — no prose, no markdown — with this shape:

{
  "subject": "string",
  "body": "string (use \\n for newlines)",
  "used_findings": [{ "id": "string", "title": "string", "url": "string|null" }]
}

Rules:
- Pick AT MOST two findings from the briefing to ground the email. Reference them naturally — don't list them like a bibliography.
- "used_findings" must contain only finding ids you actually referenced.
- If no briefing findings are useful, fall back to the contact's industry/topics and write a tighter, lower-confidence note.`;

const TONE_GUIDANCE: Record<DraftInputs["tone"], string> = {
  warm: "Tone: warm. Lead with care, reference shared context, sign off conversationally.",
  professional: "Tone: professional. Direct and businesslike, no slang, no exclamation marks.",
  curious: "Tone: curious. Open with a real question that you genuinely want their answer to.",
  provocative: "Tone: provocative. Stake a clear contrarian view in the first sentence — but disagree with the consensus, never with the reader.",
};

export async function generateDraft(input: DraftInputs): Promise<DraftPayload> {
  const fallback = demoDraft(input);
  if (isOutreachDemoMode()) return fallback;

  const userMessage = `${TONE_GUIDANCE[input.tone]}\n\nContact:\n${JSON.stringify({
    name: input.contact.full_name,
    company: input.contact.company,
    title: input.contact.title,
    industry: input.contact.industry,
    topics: input.contact.topics,
  })}\n\nBriefing:\n${JSON.stringify({
    talking_points: input.briefing?.talking_points ?? [],
    findings: (input.briefing?.findings ?? []).map((f) => ({
      id: f.id,
      kind: f.kind,
      title: f.title,
      url: f.url,
      source: f.source,
      summary: f.summary,
      angle: f.talking_points[0] ?? null,
    })),
  })}\n\n${formatStyleExamples(input.styleExamples)}\n\nWrite the email now.`;

  const result = await askJson<DraftPayload>({
    system: SYSTEM,
    prompt: userMessage,
    maxTokens: 1500,
    fallback,
  });

  return normalize(result, fallback);
}

function formatStyleExamples(examples: DraftInputs["styleExamples"]): string {
  if (!examples.length) return "";
  const good = examples.filter((e) => e.kind === "good_example");
  const bad = examples.filter((e) => e.kind === "bad_example");
  const notes = examples.filter((e) => e.kind === "voice_note");

  const lines: string[] = ["Voice calibration:"];
  if (good.length) {
    lines.push("Past emails Michael liked (sound like these):");
    good.forEach((e) => lines.push(`--- ${e.label} ---\n${e.body}`));
  }
  if (bad.length) {
    lines.push("Past emails Michael disliked (don't sound like these):");
    bad.forEach((e) => lines.push(`--- ${e.label} ---\n${e.body}`));
  }
  if (notes.length) {
    lines.push("Voice rules:");
    notes.forEach((e) => lines.push(`- ${e.label}: ${e.body}`));
  }
  return lines.join("\n\n");
}

function normalize(result: DraftPayload, fallback: DraftPayload): DraftPayload {
  if (typeof result?.subject !== "string" || !result.subject.trim()) {
    return fallback;
  }
  if (typeof result?.body !== "string" || !result.body.trim()) {
    return fallback;
  }
  return {
    subject: result.subject.trim().slice(0, 140),
    body: result.body.trim(),
    used_findings: Array.isArray(result.used_findings)
      ? result.used_findings.filter(
          (f): f is DraftPayload["used_findings"][number] =>
            !!f && typeof f.id === "string" && typeof f.title === "string"
        )
      : [],
  };
}
