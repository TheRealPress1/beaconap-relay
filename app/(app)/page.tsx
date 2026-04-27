import Link from "next/link";
import { Activity, Send, Sparkles, Users } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import {
  listContacts,
  listContactsAwaitingTopicReview,
} from "@/lib/contacts/repo";

const TOP_N = 5;

function topCounts(values: string[]): Array<{ label: string; count: number }> {
  const map = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N);
}

export default async function DashboardPage() {
  const [contacts, awaitingReview] = await Promise.all([
    listContacts(),
    listContactsAwaitingTopicReview(),
  ]);
  const total = contacts.length;
  const hot = contacts.filter((c) => c.status === "Hot").length;
  const warm = contacts.filter((c) => c.status === "Warm").length;
  const overdue = contacts.filter((c) => {
    if (!c.last_touch_at) return c.status !== "Cold";
    const days = (Date.now() - new Date(c.last_touch_at).getTime()) / (1000 * 60 * 60 * 24);
    return days > 30;
  }).length;

  const topIndustries = topCounts(
    contacts.map((c) => c.industry).filter((x): x is string => Boolean(x))
  );
  const topTopics = topCounts(contacts.flatMap((c) => c.topics));
  const maxIndustry = topIndustries[0]?.count ?? 1;
  const maxTopic = topTopics[0]?.count ?? 1;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`${today} · ${overdue} contacts due for outreach`}
      />
      <div className="px-8 py-7">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Network size"
            value={total}
            change="Active CRM contacts"
            changeDirection="neutral"
            icon={Users}
            accentColor="accent"
          />
          <StatCard
            label="Hot relationships"
            value={hot}
            change={total ? `${Math.round((hot / total) * 100)}% of network` : "—"}
            changeDirection="up"
            icon={Activity}
            accentColor="green"
          />
          <StatCard
            label="Warm pipeline"
            value={warm}
            change="Building momentum"
            changeDirection="neutral"
            icon={Send}
            accentColor="amber"
          />
          <StatCard
            label="Need outreach"
            value={overdue}
            change="30+ days since last touch"
            changeDirection="down"
            icon={Sparkles}
            accentColor="purple"
          />
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DistributionPanel
            title="Top industries"
            href="/contacts/by-industry"
            entries={topIndustries}
            max={maxIndustry}
            tone="accent"
          />
          <DistributionPanel
            title="Top topics"
            href="/contacts/by-topic"
            entries={topTopics}
            max={maxTopic}
            tone="purple"
            emptyHint="Topics will appear after you approve some via Review topics."
          />
        </div>

        {awaitingReview.length > 0 && (
          <Link
            href="/contacts/review-topics"
            className="mt-5 flex items-center justify-between rounded-xl border border-status-warm/30 bg-status-warm/5 px-5 py-4 transition-colors hover:bg-status-warm/10"
          >
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                {awaitingReview.length} contact
                {awaitingReview.length === 1 ? "" : "s"} awaiting topic review
              </h3>
              <p className="mt-0.5 text-xs text-text-secondary">
                Claude proposed topics for these. Approve or dismiss to keep your taxonomy
                clean.
              </p>
            </div>
            <span className="rounded-md bg-status-warm/20 px-2.5 py-1 text-xs font-medium text-status-warm">
              Review →
            </span>
          </Link>
        )}

        <div className="mt-5 rounded-xl border border-border bg-bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Welcome back, Michael.
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Upload a CSV of your latest leads to get started, or jump into a contact to
            pull fresh research and draft an outreach email. The research pipeline is{" "}
            {process.env.RESEARCH_DEMO_MODE === "true" ? (
              <span className="text-status-warm">running in demo mode</span>
            ) : (
              <span className="text-status-success">live</span>
            )}
            .
          </p>
        </div>
      </div>
    </>
  );
}

function DistributionPanel({
  title,
  href,
  entries,
  max,
  tone,
  emptyHint,
}: {
  title: string;
  href: string;
  entries: Array<{ label: string; count: number }>;
  max: number;
  tone: "accent" | "purple";
  emptyHint?: string;
}) {
  const barColor = tone === "accent" ? "bg-accent-blue" : "bg-purple";
  return (
    <div className="rounded-xl border border-border bg-bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <Link href={href} className="text-xs text-text-tertiary hover:text-text-secondary">
          View all →
        </Link>
      </div>
      <div className="space-y-2.5 p-5">
        {entries.length === 0 ? (
          <p className="text-xs text-text-tertiary">{emptyHint ?? "No data yet."}</p>
        ) : (
          entries.map((e) => (
            <div key={e.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-primary">{e.label}</span>
                <span className="font-mono text-text-tertiary tabular-nums">{e.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${(e.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
