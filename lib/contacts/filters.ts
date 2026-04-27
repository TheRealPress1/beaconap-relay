import type { ContactStatus } from "@/lib/supabase/types";

export const STATUSES: ContactStatus[] = ["Cold", "Nurture", "Warm", "Hot"];

export type ContactFiltersValue = {
  q: string;
  industry: string;
  statuses: ContactStatus[];
  topics: string[];
};

type ParamsLike = URLSearchParams | { get(key: string): string | null };

export function parseFiltersFromParams(params: ParamsLike): ContactFiltersValue {
  const get = (k: string) => params.get(k);
  const csv = (k: string) =>
    (get(k) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  const statuses = csv("status").filter((s): s is ContactStatus =>
    STATUSES.includes(s as ContactStatus)
  );
  return {
    q: get("q") ?? "",
    industry: get("industry") ?? "",
    statuses,
    topics: csv("topic"),
  };
}

export function applyFilters<T extends {
  full_name: string;
  company: string | null;
  email: string | null;
  industry: string | null;
  status: ContactStatus;
  topics: string[];
}>(contacts: T[], filters: ContactFiltersValue): T[] {
  const q = filters.q.trim().toLowerCase();
  return contacts.filter((c) => {
    if (filters.industry && c.industry !== filters.industry) return false;
    if (filters.statuses.length > 0 && !filters.statuses.includes(c.status)) return false;
    if (filters.topics.length > 0) {
      const hits = filters.topics.every((t) => c.topics.includes(t));
      if (!hits) return false;
    }
    if (q) {
      const haystack = [
        c.full_name,
        c.company ?? "",
        c.email ?? "",
        c.industry ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
