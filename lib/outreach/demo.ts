import "server-only";
import type { DraftInputs, DraftPayload } from "./types";

export function isOutreachDemoMode(): boolean {
  if (process.env.OUTREACH_DEMO_MODE === "true") return true;
  if (!process.env.ANTHROPIC_API_KEY) return true;
  return false;
}

const TONE_OPENERS: Record<DraftInputs["tone"], (first: string, company: string) => string> = {
  warm: (first, company) =>
    `${first}, hope you're well — saw something this week that made me think of you and ${company}.`,
  professional: (first, company) =>
    `${first}, a quick note as ${company} navigates the next quarter.`,
  curious: (first, company) =>
    `${first}, one question I keep returning to about how ${company} is approaching the moment:`,
  provocative: (first, company) =>
    `${first}, candidly: I think the consensus take on ${company}'s position is wrong, and you're one of the few who could correct me.`,
};

const TONE_SIGNOFFS: Record<DraftInputs["tone"], string> = {
  warm: "Worth fifteen minutes either way?",
  professional: "Happy to share the underlying brief if useful.",
  curious: "Genuinely keen to hear how you'd frame it.",
  provocative: "Tell me where I'm wrong.",
};

export function demoDraft(input: DraftInputs): DraftPayload {
  const first = input.contact.first_name;
  const company = input.contact.company ?? "your firm";
  const opener = TONE_OPENERS[input.tone](first, company);
  const signoff = TONE_SIGNOFFS[input.tone];

  const findings = input.briefing?.findings ?? [];
  const top = findings.slice(0, 2);

  const findingLines = top.map((f) => {
    const source = f.source ? ` (${f.source})` : "";
    return `- "${f.title}"${source} — ${f.summary ?? "worth your read"}`;
  });

  const subjectFromFinding = top[0]?.title ?? `${first} — quick thought`;
  const subject = trimSubject(deriveSubject(input.tone, first, subjectFromFinding));

  const body = [
    opener,
    "",
    `Two things from this week's research that struck me:`,
    ...findingLines,
    "",
    `${input.briefing?.talking_points[0] ?? `Curious whether this lines up with how you and the team at ${company} are thinking about it.`}`,
    "",
    signoff,
    "",
    "— Michael",
  ].join("\n");

  return {
    subject,
    body,
    used_findings: top.map((f) => ({ id: f.id, title: f.title, url: f.url })),
  };
}

function deriveSubject(tone: DraftInputs["tone"], first: string, anchor: string): string {
  switch (tone) {
    case "professional":
      return `Following up — ${shortPhrase(anchor)}`;
    case "curious":
      return `${first} — a question on ${shortPhrase(anchor)}`;
    case "provocative":
      return `${first}, the consensus on this is wrong`;
    case "warm":
    default:
      return `Saw this and thought of you — ${shortPhrase(anchor)}`;
  }
}

function shortPhrase(s: string): string {
  const cleaned = s.replace(/[—–:].*$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.slice(0, 57) + "…";
}

function trimSubject(s: string): string {
  return s.length > 90 ? s.slice(0, 87) + "…" : s;
}
