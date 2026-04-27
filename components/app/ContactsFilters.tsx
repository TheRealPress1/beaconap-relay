"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContactStatus } from "@/lib/supabase/types";
import {
  STATUSES,
  parseFiltersFromParams,
  type ContactFiltersValue,
} from "@/lib/contacts/filters";

const STATUS_TONE: Record<ContactStatus, string> = {
  Hot: "border-red-500/40 bg-red-500/12 text-red-400",
  Warm: "border-amber-500/40 bg-amber-500/12 text-amber-400",
  Nurture: "border-accent-blue/40 bg-accent-blue/12 text-accent-light",
  Cold: "border-text-tertiary/30 bg-bg-tertiary text-text-secondary",
};

export function ContactsFilters({
  industries,
  topics,
}: {
  industries: string[];
  topics: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const initial = parseFiltersFromParams(params);
  const [q, setQ] = useState(initial.q);

  useEffect(() => {
    setQ(initial.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  function pushFilters(next: ContactFiltersValue) {
    const sp = new URLSearchParams();
    if (next.q.trim()) sp.set("q", next.q.trim());
    if (next.industry) sp.set("industry", next.industry);
    if (next.statuses.length > 0) sp.set("status", next.statuses.join(","));
    if (next.topics.length > 0) sp.set("topic", next.topics.join(","));
    const qs = sp.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  }

  function toggleStatus(status: ContactStatus) {
    const has = initial.statuses.includes(status);
    pushFilters({
      ...initial,
      statuses: has
        ? initial.statuses.filter((s) => s !== status)
        : [...initial.statuses, status],
    });
  }

  function toggleTopic(topic: string) {
    const has = initial.topics.includes(topic);
    pushFilters({
      ...initial,
      topics: has ? initial.topics.filter((t) => t !== topic) : [...initial.topics, topic],
    });
  }

  function setIndustry(value: string | null) {
    pushFilters({ ...initial, industry: !value || value === "__all" ? "" : value });
  }

  function commitSearch() {
    if (q.trim() === initial.q) return;
    pushFilters({ ...initial, q });
  }

  function clearAll() {
    setQ("");
    startTransition(() => router.replace(pathname));
  }

  const hasFilters =
    initial.q || initial.industry || initial.statuses.length > 0 || initial.topics.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={commitSearch}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitSearch();
              }
            }}
            placeholder="Search name, company, email…"
            className="pl-8"
          />
        </div>

        <Select value={initial.industry || "__all"} onValueChange={setIndustry}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All industries</SelectItem>
            {industries.map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          {STATUSES.map((s) => {
            const active = initial.statuses.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? STATUS_TONE[s]
                    : "border-border bg-transparent text-text-tertiary hover:text-text-secondary"
                )}
              >
                {s}
              </button>
            );
          })}
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            disabled={pending}
            className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-tertiary hover:bg-bg-hover hover:text-text-secondary"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {topics.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10.5px] uppercase tracking-wider text-text-tertiary">
            Topics
          </span>
          {topics.map((t) => {
            const active = initial.topics.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTopic(t)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "border-purple/40 bg-purple/12 text-purple"
                    : "border-border bg-transparent text-text-tertiary hover:text-text-secondary"
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { parseFiltersFromParams, applyFilters } from "@/lib/contacts/filters";
export type { ContactFiltersValue } from "@/lib/contacts/filters";
