"use server";

import { revalidatePath } from "next/cache";
import { parseCsv } from "@/lib/csv/parse";
import { proposeColumnMap, type ColumnMap } from "@/lib/csv/detect";
import { classify, rowToCandidate, type DedupeOutcome } from "@/lib/csv/dedupe";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, listContacts } from "@/lib/contacts/repo";
import { activeTopicLabels } from "@/lib/topics/taxonomy";
import { proposeTopicsForContact } from "@/app/actions/proposeTopics";

export type CsvAnalysis = {
  filename: string;
  rowCount: number;
  headers: string[];
  proposedMap: ColumnMap;
  preview: Array<{ row: Record<string, string>; outcome: DedupeOutcome }>;
  rawCsv: string;
  counts: { new: number; update: number; duplicate: number; skip: number };
};

export async function analyzeCsv(formData: FormData): Promise<CsvAnalysis> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No file uploaded.");
  }
  const text = await file.text();
  const parsed = parseCsv(text);

  const proposedMap = await proposeColumnMap(parsed);
  const existing = await listContacts();

  const counts = { new: 0, update: 0, duplicate: 0, skip: 0 };
  const preview = parsed.rows.map((row) => {
    const candidate = rowToCandidate(row, proposedMap);
    if (!candidate) {
      counts.skip += 1;
      return {
        row,
        outcome: {
          bucket: "skip" as const,
          candidate: {
            first_name: "",
            last_name: null,
            email: null,
            company: null,
            title: null,
            phone: null,
            linkedin_url: null,
            industry: null,
            source: null,
            notes: null,
          },
          reason: "missing first name",
        },
      };
    }
    const outcome = classify(candidate, existing);
    counts[outcome.bucket] += 1;
    return { row, outcome };
  });

  return {
    filename: file.name,
    rowCount: parsed.rows.length,
    headers: parsed.headers,
    proposedMap,
    preview,
    rawCsv: text,
    counts,
  };
}

export async function commitCsv(input: {
  filename: string;
  columnMap: ColumnMap;
  rawCsv: string;
}): Promise<{ inserted: number; updated: number; skipped: number; importId: string | null }> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
  }

  const supabase = await createServiceClient();
  const parsed = parseCsv(input.rawCsv);
  const existing = await listContacts();

  const inserts: Array<ReturnType<typeof rowToCandidate>> = [];
  const updates: Array<{ id: string; patch: NonNullable<ReturnType<typeof rowToCandidate>> }> = [];
  let skipped = 0;

  for (const row of parsed.rows) {
    const candidate = rowToCandidate(row, input.columnMap);
    if (!candidate) {
      skipped += 1;
      continue;
    }
    const outcome = classify(candidate, existing);
    if (outcome.bucket === "duplicate") {
      skipped += 1;
      continue;
    }
    if (outcome.bucket === "update" && outcome.existing) {
      updates.push({ id: outcome.existing.id, patch: candidate });
    } else if (outcome.bucket === "new") {
      inserts.push(candidate);
    }
  }

  let inserted = 0;
  let insertedRows: Array<{
    id: string;
    first_name: string;
    last_name: string | null;
    company: string | null;
    title: string | null;
    industry: string | null;
  }> = [];
  if (inserts.length > 0) {
    const { data, error } = await supabase
      .from("contacts")
      .insert(
        inserts.map((c) => ({
          first_name: c!.first_name,
          last_name: c!.last_name,
          email: c!.email,
          company: c!.company,
          title: c!.title,
          phone: c!.phone,
          linkedin_url: c!.linkedin_url,
          industry: c!.industry,
          source: c!.source ?? "CSV Import",
          notes: c!.notes,
        }))
      )
      .select("id, first_name, last_name, company, title, industry");
    if (error) throw new Error(`Insert failed: ${error.message}`);
    insertedRows = data ?? [];
    inserted = insertedRows.length;
  }

  // Kick off topic proposals for newly inserted contacts.
  if (insertedRows.length > 0) {
    const taxonomy = await activeTopicLabels();
    for (const row of insertedRows) {
      try {
        const proposed = await proposeTopicsForContact(row, taxonomy);
        if (proposed.length > 0) {
          await supabase
            .from("contacts")
            .update({ proposed_topics: proposed })
            .eq("id", row.id);
        }
      } catch (err) {
        console.error(`[csv] topic proposal failed for ${row.id}:`, err);
      }
    }
  }

  let updated = 0;
  for (const u of updates) {
    const { error } = await supabase
      .from("contacts")
      .update({
        last_name: u.patch.last_name,
        company: u.patch.company,
        title: u.patch.title,
        phone: u.patch.phone,
        linkedin_url: u.patch.linkedin_url,
        industry: u.patch.industry,
        notes: u.patch.notes,
      })
      .eq("id", u.id);
    if (error) throw new Error(`Update failed: ${error.message}`);
    updated += 1;
  }

  const { data: importRow, error: importError } = await supabase
    .from("csv_imports")
    .insert({
      filename: input.filename,
      row_count: parsed.rows.length,
      column_map: input.columnMap,
      status: "completed",
      raw_csv: input.rawCsv,
      new_count: inserted,
      updated_count: updated,
      duplicate_count: skipped,
    })
    .select("id")
    .single();
  if (importError) {
    console.error("[csv] failed to log import:", importError.message);
  }

  revalidatePath("/contacts");
  revalidatePath("/contacts/by-industry");
  revalidatePath("/contacts/by-topic");
  revalidatePath("/contacts/review-topics");
  revalidatePath("/");
  return {
    inserted,
    updated,
    skipped,
    importId: importRow?.id ?? null,
  };
}
