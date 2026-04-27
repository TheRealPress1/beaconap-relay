import {
  Mail,
  MessageSquare,
  Mic,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";
import type {
  ContactInteractionRow,
  InteractionKind,
  InteractionSource,
} from "@/lib/supabase/types";

type IconLike = ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number }>;

const KIND_META: Record<
  InteractionKind,
  { icon: IconLike; tone: string; label: string }
> = {
  meeting: { icon: Mic, tone: "text-purple", label: "Meeting" },
  email: { icon: Mail, tone: "text-accent-light", label: "Email" },
  call: { icon: Phone, tone: "text-amber-400", label: "Call" },
  enrichment: { icon: Sparkles, tone: "text-status-success", label: "Enrichment" },
  note: { icon: MessageSquare, tone: "text-text-secondary", label: "Note" },
};

const SOURCE_LABEL: Record<InteractionSource, string> = {
  granola: "Granola",
  apollo: "Apollo.io",
  gmail: "Gmail",
  outlook: "Outlook",
  manual: "Manual",
};

export function InteractionTimeline({
  interactions,
  contactFirstName,
}: {
  interactions: ContactInteractionRow[];
  contactFirstName: string;
}) {
  if (interactions.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-bg-card/50 p-8 text-center">
        <Send className="mx-auto h-5 w-5 text-text-tertiary" />
        <h3 className="mt-2 font-display text-base font-semibold text-text-primary">
          No interactions yet
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          Sync Granola or push a draft through Apollo to populate {contactFirstName}'s
          timeline.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-bg-card">
      <header className="border-b border-border px-6 py-4">
        <h2 className="font-display text-base font-semibold text-text-primary">
          Timeline
        </h2>
        <p className="text-xs text-text-tertiary">
          {interactions.length} interaction{interactions.length === 1 ? "" : "s"} from your
          connected sources
        </p>
      </header>
      <ol className="divide-y divide-border/40">
        {interactions.map((row) => {
          const meta = KIND_META[row.kind];
          const Icon = meta.icon;
          return (
            <li key={row.id} className="flex gap-4 px-6 py-4">
              <div className="flex flex-col items-center pt-0.5">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-tertiary",
                    meta.tone
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-text-tertiary">
                  <span className="rounded-md bg-bg-tertiary px-1.5 py-0.5 font-medium uppercase tracking-wider">
                    {meta.label}
                  </span>
                  <span>·</span>
                  <span>{SOURCE_LABEL[row.source]}</span>
                  <span>·</span>
                  <span>{formatTimestamp(row.occurred_at)}</span>
                </div>
                {row.title && (
                  <h4 className="mt-1 text-sm font-medium text-text-primary">
                    {row.title}
                  </h4>
                )}
                {row.summary && (
                  <p className="mt-1 whitespace-pre-line text-[12.5px] leading-relaxed text-text-secondary">
                    {row.summary}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function formatTimestamp(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}
