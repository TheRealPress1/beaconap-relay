import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Mail,
  Mic,
  Send,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { SyncButton } from "./SyncButton";
import { getConnectorSync } from "@/lib/interactions/repo";
import { isGranolaDemoMode, DEMO_MEETINGS } from "@/lib/granola/demo";
import { isApolloDemoMode } from "@/lib/apollo/demo";
import type { ComponentType, SVGProps } from "react";

type IconLike = ComponentType<SVGProps<SVGSVGElement>>;

type Provider =
  | { kind: "csv" }
  | {
      kind: "granola" | "apollo" | "gmail";
      apiKeyEnv: string;
      configured: boolean;
      demoMode: boolean;
      description: string;
      icon: IconLike;
      name: string;
      phase: string;
    };

function load(provider: string): Provider | null {
  switch (provider) {
    case "csv":
      return { kind: "csv" };
    case "granola":
      return {
        kind: "granola",
        name: "Granola",
        icon: Mic,
        phase: "Phase 5 — shipped",
        apiKeyEnv: "GRANOLA_API_KEY",
        configured: Boolean(process.env.GRANOLA_API_KEY),
        demoMode: isGranolaDemoMode(),
        description:
          "Pull meeting summaries from Granola, attach them to matching contacts by email, and feed them into the research briefing prompts.",
      };
    case "apollo":
      return {
        kind: "apollo",
        name: "Apollo.io",
        icon: Send,
        phase: "Phase 5 — shipped",
        apiKeyEnv: "APOLLO_API_KEY",
        configured: Boolean(process.env.APOLLO_API_KEY),
        demoMode: isApolloDemoMode(),
        description:
          "Enrich contact details (title, seniority, employment history, LinkedIn) and push outreach drafts into Apollo sequences.",
      };
    case "gmail":
      return {
        kind: "gmail",
        name: "Gmail",
        icon: Mail,
        phase: "Phase 6",
        apiKeyEnv: "GOOGLE_OAUTH_CLIENT_ID",
        configured: Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID),
        demoMode: process.env.EMAIL_DEMO_MODE === "true",
        description:
          "Send drafts directly from BeaconAP and capture replies as timeline events. Connect via Google OAuth (arrives in Phase 6).",
      };
    default:
      return null;
  }
}

function statusFor(p: Exclude<Provider, { kind: "csv" }>): {
  label: string;
  color: string;
  Icon: IconLike;
} {
  if (p.configured && !p.demoMode) {
    return { label: "Live", color: "text-status-success", Icon: CheckCircle2 };
  }
  if (p.demoMode) {
    return {
      label: p.configured ? "Configured · demo on" : "Demo mode (no key)",
      color: "text-status-warm",
      Icon: AlertCircle,
    };
  }
  return { label: "Awaiting key", color: "text-text-tertiary", Icon: Circle };
}

export default async function SourceSettingsPage({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const { provider } = await params;
  const data = load(provider);
  if (!data) notFound();

  if (data.kind === "csv") {
    return (
      <>
        <PageHeader
          title="CSV Import"
          subtitle="Source · Phase 1 — shipped"
          actions={
            <Link href="/import" className={buttonVariants()}>
              Open CSV upload
            </Link>
          }
        />
        <div className="px-8 py-7">
          <div className="rounded-xl border border-border bg-bg-card p-6">
            <h2 className="font-display text-lg font-semibold text-text-primary">
              CSV Import
            </h2>
            <p className="mt-3 text-sm text-text-secondary">
              Upload a CSV of clients or leads. Claude maps your columns, dedupes against
              existing contacts, and assigns starter topics.
            </p>
          </div>
        </div>
      </>
    );
  }

  const status = statusFor(data);
  const Icon = data.icon;
  const sync = data.kind === "granola" ? await getConnectorSync("granola") : null;

  return (
    <>
      <PageHeader title={data.name} subtitle={`Source · ${data.phase}`} />
      <div className="space-y-5 px-8 py-7">
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-bg-tertiary text-text-secondary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-text-primary">
                  {data.name}
                </h2>
                <div className={`flex items-center gap-1.5 text-xs ${status.color}`}>
                  <status.Icon className="h-3.5 w-3.5" />
                  {status.label}
                </div>
              </div>
            </div>
            {data.kind === "granola" && (
              <SyncButton endpoint="/api/granola/sync" label="Sync now" />
            )}
          </div>
          <p className="mt-4 text-sm text-text-secondary">{data.description}</p>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <EnvRow label="API key env" value={data.apiKeyEnv} />
            <EnvRow
              label="Demo flag"
              value={`${data.kind.toUpperCase()}_DEMO_MODE`}
            />
          </div>
        </div>

        {data.kind === "granola" && (
          <>
            <SyncStatusCard sync={sync} />
            {data.demoMode && <GranolaDemoPreview />}
          </>
        )}

        {data.kind === "apollo" && <ApolloConfigCard />}
      </div>
    </>
  );
}

function EnvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-bg-secondary px-4 py-3">
      <div className="text-[10.5px] uppercase tracking-wider text-text-tertiary">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-xs text-text-primary">{value}</div>
    </div>
  );
}

function SyncStatusCard({
  sync,
}: {
  sync: Awaited<ReturnType<typeof getConnectorSync>>;
}) {
  if (!sync) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-bg-card/50 px-6 py-5 text-sm text-text-secondary">
        No syncs run yet. Click <span className="font-medium">Sync now</span> to attach
        the latest Granola meetings to your contacts.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card px-6 py-5">
      <h3 className="text-sm font-semibold text-text-primary">Last sync</h3>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4">
        <div>
          <dt className="text-[10.5px] uppercase tracking-wider text-text-tertiary">
            Status
          </dt>
          <dd className="mt-0.5 capitalize text-text-primary">{sync.status}</dd>
        </div>
        <div>
          <dt className="text-[10.5px] uppercase tracking-wider text-text-tertiary">
            Ran
          </dt>
          <dd className="mt-0.5 text-text-primary">
            {sync.last_synced_at ? formatTimestamp(sync.last_synced_at) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[10.5px] uppercase tracking-wider text-text-tertiary">
            Matched
          </dt>
          <dd className="mt-0.5 font-mono tabular-nums text-text-primary">
            {sync.matched_count} contacts
          </dd>
        </div>
        <div>
          <dt className="text-[10.5px] uppercase tracking-wider text-text-tertiary">
            Stored
          </dt>
          <dd className="mt-0.5 font-mono tabular-nums text-text-primary">
            {sync.inserted_count} interactions
          </dd>
        </div>
      </dl>
      {sync.error && (
        <p className="mt-3 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-400">
          {sync.error}
        </p>
      )}
    </div>
  );
}

function GranolaDemoPreview() {
  return (
    <div className="rounded-xl border border-border bg-bg-card">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-sm font-semibold text-text-primary">
          Demo meetings ({DEMO_MEETINGS.length})
        </h3>
        <p className="text-[11.5px] text-text-tertiary">
          A &quot;Sync now&quot; call in demo mode will create one interaction per
          matching contact for each of these.
        </p>
      </div>
      <ul className="divide-y divide-border/40">
        {DEMO_MEETINGS.map((m) => (
          <li key={m.id} className="px-6 py-3">
            <div className="text-sm font-medium text-text-primary">{m.title}</div>
            <div className="mt-0.5 text-[11.5px] text-text-tertiary">
              {formatTimestamp(m.occurred_at)} · {m.attendees.length} attendees
            </div>
            {m.summary && (
              <p className="mt-1 line-clamp-2 text-[12.5px] text-text-secondary">
                {m.summary}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ApolloConfigCard() {
  const defaultSequence = process.env.APOLLO_DEFAULT_SEQUENCE_ID;
  return (
    <div className="rounded-xl border border-border bg-bg-card px-6 py-5">
      <h3 className="text-sm font-semibold text-text-primary">Sequence push</h3>
      <p className="mt-1 text-[12.5px] text-text-secondary">
        Outreach drafts can be pushed to an Apollo sequence from the draft modal. Set a
        default sequence id below or pass one per draft.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <EnvRow label="Default sequence env" value="APOLLO_DEFAULT_SEQUENCE_ID" />
        <EnvRow
          label="Currently set"
          value={defaultSequence ? defaultSequence : "—"}
        />
      </div>
    </div>
  );
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
