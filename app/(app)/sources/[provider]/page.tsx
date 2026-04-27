import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { CheckCircle2, Circle, Mail, Mic, Send, FileText } from "lucide-react";

type SourceMeta = {
  name: string;
  description: string;
  icon: typeof Mail;
  envKey: string;
  configured: boolean;
  demoMode: boolean;
  ctaHref?: string;
  ctaLabel?: string;
  phase: string;
};

function getSourceMeta(provider: string): SourceMeta | null {
  switch (provider) {
    case "csv":
      return {
        name: "CSV Import",
        description:
          "Upload a CSV of clients or leads. Claude maps your columns, dedupes against existing contacts, and assigns starter topics.",
        icon: FileText,
        envKey: "—",
        configured: true,
        demoMode: false,
        ctaHref: "/import",
        ctaLabel: "Open CSV upload",
        phase: "Phase 1 — shipped",
      };
    case "gmail":
      return {
        name: "Gmail",
        description:
          "Send drafts directly from BeaconAP and capture replies as Timeline events. Connect via Google OAuth.",
        icon: Mail,
        envKey: "GOOGLE_OAUTH_CLIENT_ID",
        configured: Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID),
        demoMode: process.env.EMAIL_DEMO_MODE === "true",
        phase: "Phase 6",
      };
    case "granola":
      return {
        name: "Granola",
        description:
          "Pull meeting transcripts and summaries from Granola. Notes attach to contacts and feed the research prompts.",
        icon: Mic,
        envKey: "GRANOLA_API_KEY",
        configured: Boolean(process.env.GRANOLA_API_KEY),
        demoMode: process.env.GRANOLA_DEMO_MODE === "true",
        phase: "Phase 5",
      };
    case "apollo":
      return {
        name: "Apollo.io",
        description:
          "Enrich contact details (title, seniority, employment history) and push outreach drafts into Apollo sequences.",
        icon: Send,
        envKey: "APOLLO_API_KEY",
        configured: Boolean(process.env.APOLLO_API_KEY),
        demoMode: process.env.APOLLO_DEMO_MODE === "true",
        phase: "Phase 5",
      };
    default:
      return null;
  }
}

export default async function SourceSettingsPage({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const { provider } = await params;
  const meta = getSourceMeta(provider);
  if (!meta) notFound();
  const Icon = meta.icon;

  const status = meta.configured
    ? meta.demoMode
      ? { label: "Configured · demo mode on", color: "text-status-warm", IconC: Circle }
      : { label: "Live", color: "text-status-success", IconC: CheckCircle2 }
    : { label: "Awaiting key from CEO", color: "text-text-tertiary", IconC: Circle };

  return (
    <>
      <PageHeader
        title={meta.name}
        subtitle={`Source · ${meta.phase}`}
        actions={
          meta.ctaHref && meta.ctaLabel ? (
            <Link href={meta.ctaHref} className={buttonVariants()}>
              {meta.ctaLabel}
            </Link>
          ) : null
        }
      />
      <div className="px-8 py-7">
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-bg-tertiary text-text-secondary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-text-primary">
                {meta.name}
              </h2>
              <div className={`flex items-center gap-1.5 text-xs ${status.color}`}>
                <status.IconC className="h-3.5 w-3.5" />
                {status.label}
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-text-secondary">{meta.description}</p>
          {meta.envKey !== "—" && (
            <div className="mt-5 rounded-md border border-border/60 bg-bg-secondary px-4 py-3 font-mono text-xs text-text-secondary">
              env · <span className="text-text-primary">{meta.envKey}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
