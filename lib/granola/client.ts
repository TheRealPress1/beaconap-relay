import "server-only";
import type { GranolaListResult, GranolaMeeting } from "./types";

const GRANOLA_BASE_URL = process.env.GRANOLA_API_BASE_URL ?? "https://api.granola.ai/v1";

type RawMeeting = {
  id: string;
  title?: string;
  name?: string;
  occurred_at?: string;
  startedAt?: string;
  duration_minutes?: number;
  duration?: number;
  attendees?: Array<{ email?: string; name?: string }>;
  participants?: Array<{ email?: string; name?: string }>;
  summary?: { markdown?: string; text?: string } | string;
  transcript?: string;
};

function authHeaders(): Record<string, string> {
  const key = process.env.GRANOLA_API_KEY;
  if (!key) {
    throw new Error("GRANOLA_API_KEY not set; flip GRANOLA_DEMO_MODE=true or add a key.");
  }
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

function normalize(raw: RawMeeting): GranolaMeeting {
  const summary =
    typeof raw.summary === "string"
      ? raw.summary
      : raw.summary?.markdown ?? raw.summary?.text ?? undefined;

  return {
    id: raw.id,
    title: raw.title ?? raw.name ?? "Untitled meeting",
    occurred_at: raw.occurred_at ?? raw.startedAt ?? new Date().toISOString(),
    duration_minutes: raw.duration_minutes ?? raw.duration,
    attendees: raw.attendees ?? raw.participants ?? [],
    summary,
    transcript: raw.transcript,
  };
}

/**
 * List meetings since a cursor. The exact endpoint shape may differ from
 * Granola's current API — keep this as the only place to update if the live
 * call fails at handoff. Demo mode lives in lib/granola/demo.ts.
 */
export async function listGranolaMeetings(opts?: {
  cursor?: string | null;
  limit?: number;
}): Promise<GranolaListResult> {
  const url = new URL("/meetings", GRANOLA_BASE_URL);
  if (opts?.cursor) url.searchParams.set("cursor", opts.cursor);
  url.searchParams.set("limit", String(opts?.limit ?? 25));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Granola ${response.status}: ${text.slice(0, 200)}`);
  }

  const json = (await response.json()) as { meetings?: RawMeeting[]; next_cursor?: string };
  return {
    meetings: (json.meetings ?? []).map(normalize),
    next_cursor: json.next_cursor,
  };
}
