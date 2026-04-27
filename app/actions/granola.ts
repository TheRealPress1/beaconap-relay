"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, listContacts } from "@/lib/contacts/repo";
import { listGranolaMeetings } from "@/lib/granola/client";
import { DEMO_MEETINGS, isGranolaDemoMode } from "@/lib/granola/demo";
import type { GranolaMeeting } from "@/lib/granola/types";
import type { InteractionSource } from "@/lib/supabase/types";

const PROVIDER: InteractionSource = "granola";
const RATE_LIMIT_SECONDS = 60;

export type GranolaSyncResult = {
  total_meetings: number;
  matched_contacts: number;
  inserted: number;
  skipped: number;
  cursor: string | null;
  demo: boolean;
};

export async function syncGranolaAction(): Promise<GranolaSyncResult> {
  const demo = isGranolaDemoMode();

  if (!isSupabaseConfigured()) {
    return {
      total_meetings: DEMO_MEETINGS.length,
      matched_contacts: 0,
      inserted: 0,
      skipped: DEMO_MEETINGS.length,
      cursor: null,
      demo,
    };
  }

  const supabase = await createServiceClient();

  const { data: existingSync } = await supabase
    .from("connector_syncs")
    .select("*")
    .eq("provider", PROVIDER)
    .maybeSingle();

  if (existingSync?.last_synced_at) {
    const sinceLast = Date.now() - new Date(existingSync.last_synced_at).getTime();
    if (existingSync.status === "running") {
      throw new Error("A Granola sync is already running.");
    }
    if (sinceLast < RATE_LIMIT_SECONDS * 1000) {
      const wait = Math.ceil((RATE_LIMIT_SECONDS * 1000 - sinceLast) / 1000);
      throw new Error(`Granola was synced recently. Try again in ${wait}s.`);
    }
  }

  await supabase
    .from("connector_syncs")
    .upsert(
      {
        provider: PROVIDER,
        status: "running",
        error: null,
      },
      { onConflict: "provider" }
    );

  try {
    const meetings = demo
      ? DEMO_MEETINGS
      : (await listGranolaMeetings({ cursor: existingSync?.last_cursor })).meetings;

    const contacts = await listContacts();
    const byEmail = new Map<string, string>();
    for (const c of contacts) {
      if (c.email) byEmail.set(c.email.toLowerCase(), c.id);
    }

    let inserted = 0;
    let skipped = 0;
    const matchedContactIds = new Set<string>();

    for (const meeting of meetings) {
      const matches = matchAttendeesToContacts(meeting, byEmail);
      if (matches.length === 0) {
        skipped += 1;
        continue;
      }

      for (const contactId of matches) {
        matchedContactIds.add(contactId);
        const sourceId = `${meeting.id}:${contactId}`;
        const { error } = await supabase
          .from("contact_interactions")
          .upsert(
            {
              contact_id: contactId,
              kind: "meeting" as const,
              source: PROVIDER,
              source_id: sourceId,
              occurred_at: meeting.occurred_at,
              title: meeting.title,
              summary: meeting.summary ?? null,
              raw: { meeting_id: meeting.id, attendees: meeting.attendees },
            },
            { onConflict: "source,source_id" }
          );
        if (!error) {
          inserted += 1;
        }
      }
    }

    const cursor = demo ? null : meetings[meetings.length - 1]?.id ?? existingSync?.last_cursor ?? null;
    await supabase
      .from("connector_syncs")
      .upsert(
        {
          provider: PROVIDER,
          status: "done",
          last_synced_at: new Date().toISOString(),
          last_cursor: cursor,
          matched_count: matchedContactIds.size,
          inserted_count: inserted,
          error: null,
        },
        { onConflict: "provider" }
      );

    revalidatePath("/sources/granola");
    revalidatePath("/contacts");
    matchedContactIds.forEach((id) => revalidatePath(`/contacts/${id}`));

    return {
      total_meetings: meetings.length,
      matched_contacts: matchedContactIds.size,
      inserted,
      skipped,
      cursor,
      demo,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from("connector_syncs")
      .upsert(
        { provider: PROVIDER, status: "failed", error: message.slice(0, 500) },
        { onConflict: "provider" }
      );
    throw err;
  }
}

function matchAttendeesToContacts(
  meeting: GranolaMeeting,
  byEmail: Map<string, string>
): string[] {
  const ids = new Set<string>();
  for (const attendee of meeting.attendees ?? []) {
    if (!attendee.email) continue;
    const id = byEmail.get(attendee.email.toLowerCase());
    if (id) ids.add(id);
  }
  return Array.from(ids);
}
