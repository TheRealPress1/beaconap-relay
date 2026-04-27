"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TONE_OPTIONS } from "@/lib/outreach/types";
import type {
  OutreachDraftRow,
  OutreachDraftStatus,
  OutreachTone,
} from "@/lib/supabase/types";

type Row = OutreachDraftRow & {
  contact_full_name: string;
  contact_company: string | null;
};

const STATUS_TONE: Record<OutreachDraftStatus, string> = {
  draft: "bg-bg-tertiary text-text-secondary",
  copied: "bg-accent-blue/12 text-accent-light",
  sent: "bg-status-success/12 text-status-success",
  archived: "bg-bg-tertiary text-text-tertiary line-through",
};

const STATUSES: OutreachDraftStatus[] = ["draft", "copied", "sent", "archived"];

export function OutreachTable({ rows }: { rows: Row[] }) {
  const [statusFilter, setStatusFilter] = useState<string>("__all");
  const [toneFilter, setToneFilter] = useState<string>("__all");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "__all" && r.status !== statusFilter) return false;
      if (toneFilter !== "__all" && r.tone !== toneFilter) return false;
      return true;
    });
  }, [rows, statusFilter, toneFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10.5px] uppercase tracking-wider text-text-tertiary">
          Filter
        </span>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "__all")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                <span className="capitalize">{s}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={toneFilter} onValueChange={(v) => setToneFilter(v ?? "__all")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All tones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All tones</SelectItem>
            {TONE_OPTIONS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-text-tertiary">
          {filtered.length} of {rows.length} drafts
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-[28%]">Contact</TableHead>
              <TableHead className="w-[34%]">Subject</TableHead>
              <TableHead>Tone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[1%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((draft) => (
              <TableRow key={draft.id} className="border-border/40">
                <TableCell>
                  <Link
                    href={`/contacts/${draft.contact_id}`}
                    className="hover:text-text-primary"
                  >
                    <div className="font-medium text-text-primary">
                      {draft.contact_full_name}
                    </div>
                    {draft.contact_company && (
                      <div className="text-[11.5px] text-text-tertiary">
                        {draft.contact_company}
                      </div>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="truncate text-sm text-text-primary">{draft.subject}</div>
                  <div className="truncate text-[11.5px] text-text-tertiary">
                    {firstLine(draft.body)}
                  </div>
                </TableCell>
                <TableCell className="capitalize text-text-secondary">{draft.tone}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                      STATUS_TONE[draft.status]
                    )}
                  >
                    {draft.status}
                  </span>
                </TableCell>
                <TableCell className="text-text-secondary">
                  {timeAgo(draft.updated_at)}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/contacts/${draft.contact_id}`}
                    className="text-text-tertiary hover:text-accent-light"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-text-tertiary">
                  No drafts match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function firstLine(s: string): string {
  const line = s.split("\n").find((l) => l.trim().length > 0) ?? "";
  return line.length > 110 ? line.slice(0, 107) + "…" : line;
}

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
