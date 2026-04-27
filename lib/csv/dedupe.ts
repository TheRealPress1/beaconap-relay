import "server-only";
import type { ContactField, ColumnMap } from "./fields";
import type { ContactRow } from "@/lib/supabase/types";

export type CandidateContact = {
  first_name: string;
  last_name: string | null;
  email: string | null;
  company: string | null;
  title: string | null;
  phone: string | null;
  linkedin_url: string | null;
  industry: string | null;
  source: string | null;
  notes: string | null;
};

export type DedupeBucket = "new" | "update" | "duplicate" | "skip";

export type DedupeOutcome = {
  bucket: DedupeBucket;
  reason?: string;
  candidate: CandidateContact;
  existing?: Pick<ContactRow, "id" | "full_name" | "email" | "company">;
};

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function pickField(row: Record<string, string>, map: ColumnMap, target: ContactField): string {
  for (const [header, field] of Object.entries(map)) {
    if (field === target) {
      const v = row[header];
      if (v) return v;
    }
  }
  return "";
}

function splitFullName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export function rowToCandidate(
  row: Record<string, string>,
  map: ColumnMap
): CandidateContact | null {
  let first = pickField(row, map, "first_name");
  let last = pickField(row, map, "last_name");
  const fullName = pickField(row, map, "full_name");

  if (!first && fullName) {
    const split = splitFullName(fullName);
    first = split.first;
    last = last || split.last;
  }

  if (!first) return null;

  const email = pickField(row, map, "email").toLowerCase() || null;
  return {
    first_name: first,
    last_name: last || null,
    email: email && EMAIL_RX.test(email) ? email : null,
    company: pickField(row, map, "company") || null,
    title: pickField(row, map, "title") || null,
    phone: pickField(row, map, "phone") || null,
    linkedin_url: pickField(row, map, "linkedin_url") || null,
    industry: pickField(row, map, "industry") || null,
    source: pickField(row, map, "source") || null,
    notes: pickField(row, map, "notes") || null,
  };
}

export function classify(
  candidate: CandidateContact,
  existing: ContactRow[]
): DedupeOutcome {
  const byEmail = candidate.email
    ? existing.find((c) => c.email?.toLowerCase() === candidate.email)
    : undefined;
  if (byEmail) {
    return { bucket: "update", candidate, existing: byEmail, reason: "email match" };
  }

  const candidateName = `${candidate.first_name} ${candidate.last_name ?? ""}`
    .trim()
    .toLowerCase();
  const candidateCompany = (candidate.company ?? "").toLowerCase();
  const byNameCompany = candidate.company
    ? existing.find(
        (c) =>
          c.full_name.toLowerCase() === candidateName &&
          (c.company ?? "").toLowerCase() === candidateCompany
      )
    : undefined;

  if (byNameCompany) {
    return {
      bucket: "duplicate",
      candidate,
      existing: byNameCompany,
      reason: "name + company match",
    };
  }

  return { bucket: "new", candidate };
}
