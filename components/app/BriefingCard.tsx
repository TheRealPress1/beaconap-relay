"use client";

import { useState, useTransition } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Headphones,
  Mail,
  MessageSquareText,
  Quote,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { OutreachDraftModal } from "./OutreachDraftModal";
import type { OutreachDraftRow } from "@/lib/supabase/types";

function Linkedin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type {
  BriefingPayload,
  Finding,
} from "@/lib/research/types";
import type { ResearchFindingKind } from "@/lib/supabase/types";

type Props = {
  contactId: string;
  contactFirstName: string;
  contactEmail: string | null;
  initialBriefing: BriefingPayload | null;
  initialRunMeta: {
    started_at: string;
    finished_at: string | null;
    search_provider: string | null;
    finding_count: number;
  } | null;
  initialDraft: OutreachDraftRow | null;
  demoMode: boolean;
};

type IconLike = React.ComponentType<React.SVGProps<SVGSVGElement> & { strokeWidth?: number }>;

const SECTION_META: Record<
  ResearchFindingKind,
  { label: string; icon: IconLike; tone: string }
> = {
  podcast: { label: "Podcasts", icon: Headphones, tone: "text-purple" },
  article: { label: "Articles", icon: BookOpen, tone: "text-accent-light" },
  interview: { label: "Interviews", icon: MessageSquareText, tone: "text-amber-400" },
  linkedin_post: { label: "LinkedIn", icon: Linkedin, tone: "text-status-success" },
  other: { label: "Other", icon: Sparkles, tone: "text-text-secondary" },
};

const SECTION_ORDER: ResearchFindingKind[] = [
  "podcast",
  "article",
  "interview",
  "linkedin_post",
  "other",
];

export function BriefingCard({
  contactId,
  contactFirstName,
  contactEmail,
  initialBriefing,
  initialRunMeta,
  initialDraft,
  demoMode,
}: Props) {
  const [briefing, setBriefing] = useState<BriefingPayload | null>(initialBriefing);
  const [meta, setMeta] = useState(initialRunMeta);
  const [pending, startTransition] = useTransition();
  const [draftOpen, setDraftOpen] = useState(false);

  function refresh() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/research/${contactId}`, { method: "POST" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Research failed");
        }
        const data = (await res.json()) as {
          briefing: BriefingPayload;
          run: {
            started_at: string;
            finished_at: string | null;
            search_provider: string | null;
          };
        };
        setBriefing(data.briefing);
        setMeta({
          started_at: data.run.started_at,
          finished_at: data.run.finished_at,
          search_provider: data.run.search_provider,
          finding_count: data.briefing.findings.length,
        });
        toast.success(
          `Briefing refreshed — ${data.briefing.findings.length} findings`
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Research failed");
      }
    });
  }

  const grouped = groupFindings(briefing?.findings ?? []);

  return (
    <section className="rounded-xl border border-border bg-bg-card">
      <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-light" />
            <h2 className="font-display text-base font-semibold text-text-primary">
              Briefing on {contactFirstName}
            </h2>
            {demoMode && (
              <span className="rounded-full bg-status-warm/12 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-status-warm">
                Demo mode
              </span>
            )}
          </div>
          {meta && (
            <p className="mt-1 text-xs text-text-tertiary">
              Last updated {formatTimestamp(meta.finished_at ?? meta.started_at)} ·
              {" "}
              {meta.search_provider ?? "demo"} · {meta.finding_count} finding
              {meta.finding_count === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={refresh} disabled={pending} size="sm" variant="secondary">
            {pending ? (
              <>
                <Sparkles className="mr-1.5 h-3.5 w-3.5 animate-pulse" />
                Researching…
              </>
            ) : (
              <>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                {briefing ? "Refresh research" : "Research"}
              </>
            )}
          </Button>
          <Button
            onClick={() => setDraftOpen(true)}
            disabled={pending || !briefing}
            size="sm"
          >
            <Mail className="mr-1.5 h-3.5 w-3.5" />
            Draft outreach
          </Button>
        </div>
      </header>

      <OutreachDraftModal
        open={draftOpen}
        onOpenChange={setDraftOpen}
        contactId={contactId}
        contactEmail={contactEmail}
        contactFirstName={contactFirstName}
        initialDraft={initialDraft}
      />

      {pending && !briefing ? (
        <BriefingSkeleton />
      ) : briefing ? (
        <div className="px-6 py-5 space-y-6">
          {briefing.talking_points.length > 0 && (
            <TalkingPointsPanel points={briefing.talking_points} />
          )}
          <div className="space-y-3">
            {SECTION_ORDER.map((kind) => {
              const items = grouped[kind] ?? [];
              if (items.length === 0) return null;
              return <FindingSection key={kind} kind={kind} items={items} />;
            })}
          </div>
        </div>
      ) : (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-text-secondary">
            No briefing yet. Click <span className="font-medium">Research</span>{" "}
            to surface podcasts, articles, interviews, and LinkedIn activity for{" "}
            {contactFirstName}.
          </p>
        </div>
      )}
    </section>
  );
}

function TalkingPointsPanel({ points }: { points: string[] }) {
  return (
    <div className="rounded-lg border border-accent-blue/20 bg-accent-blue/5 px-4 py-3">
      <div className="mb-2 flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-accent-light">
        <Quote className="h-3 w-3" />
        Talking points
      </div>
      <ul className="space-y-1.5">
        {points.map((p, i) => (
          <li key={i} className="text-sm leading-relaxed text-text-primary">
            <span className="mr-2 text-text-tertiary">{i + 1}.</span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FindingSection({
  kind,
  items,
}: {
  kind: ResearchFindingKind;
  items: Finding[];
}) {
  const [open, setOpen] = useState(true);
  const meta = SECTION_META[kind];
  const Icon = meta.icon;

  return (
    <div className="rounded-lg border border-border/60 bg-bg-secondary">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
      >
        <Icon className={cn("h-4 w-4", meta.tone)} strokeWidth={1.8} />
        <span className="text-sm font-semibold text-text-primary">
          {meta.label}
        </span>
        <span className="text-[11px] text-text-tertiary">{items.length}</span>
        <span className="ml-auto text-text-tertiary">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
      </button>
      {open && (
        <ul className="divide-y divide-border/40 border-t border-border/60">
          {items.map((finding, i) => (
            <FindingRow key={`${finding.url ?? finding.title}-${i}`} finding={finding} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FindingRow({ finding }: { finding: Finding }) {
  return (
    <li className="px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11.5px] text-text-tertiary">
            {finding.source && (
              <span className="rounded-md bg-bg-tertiary px-1.5 py-0.5">
                {finding.source}
              </span>
            )}
            {finding.published_at && (
              <span>{formatTimestamp(finding.published_at)}</span>
            )}
            <span className="ml-auto font-mono tabular-nums">
              {Math.round(finding.relevance_score * 100)}%
            </span>
          </div>
          <h4 className="mt-1 text-sm font-medium leading-snug text-text-primary">
            {finding.url ? (
              <a
                href={finding.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent-light"
              >
                {finding.title}
                <ExternalLink className="ml-1 inline-block h-3 w-3 align-baseline" />
              </a>
            ) : (
              finding.title
            )}
          </h4>
          {finding.summary && (
            <p className="mt-1 text-[12.5px] text-text-secondary">{finding.summary}</p>
          )}
          {finding.raw_excerpt && (
            <p className="mt-1.5 border-l-2 border-border-light pl-2 text-[12px] italic text-text-tertiary">
              {finding.raw_excerpt}
            </p>
          )}
          {finding.talking_points.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {finding.talking_points.map((p, i) => (
                <li key={i} className="text-[12px] text-text-secondary">
                  · {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

function BriefingSkeleton() {
  return (
    <div className="space-y-4 px-6 py-5">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

function groupFindings(findings: Finding[]) {
  const grouped: Partial<Record<ResearchFindingKind, Finding[]>> = {};
  for (const f of findings) {
    if (!grouped[f.kind]) grouped[f.kind] = [];
    grouped[f.kind]!.push(f);
  }
  return grouped;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}
