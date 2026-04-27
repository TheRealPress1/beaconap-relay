import { notFound } from "next/navigation";
import { Mail } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { ContactAvatar } from "@/components/app/ContactAvatar";
import { StatusTag } from "@/components/app/StatusTag";
import { BriefingCard } from "@/components/app/BriefingCard";
import { Button } from "@/components/ui/button";
import { getContactById } from "@/lib/contacts/repo";
import { getLatestBriefing } from "@/lib/research/repo";
import { isResearchDemoMode } from "@/lib/research/searchProvider";
import type { ResearchContact } from "@/lib/research/types";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await getContactById(id);
  if (!contact) notFound();

  const researchContact: ResearchContact = {
    id: contact.id,
    full_name: contact.full_name,
    first_name: contact.first_name,
    last_name: contact.last_name,
    company: contact.company,
    title: contact.title,
    industry: contact.industry,
    topics: contact.topics ?? [],
  };

  const latest = await getLatestBriefing(researchContact, { fallbackToDemo: false });
  const demoMode = isResearchDemoMode();

  return (
    <>
      <PageHeader
        title={contact.full_name}
        subtitle={`${contact.title ?? ""}${contact.company ? ` · ${contact.company}` : ""}`}
        actions={
          <Button disabled>
            <Mail className="mr-2 h-4 w-4" />
            Draft outreach (Phase 4)
          </Button>
        }
      />
      <div className="px-8 py-7 space-y-6">
        <div className="flex items-start gap-6 rounded-xl border border-border bg-bg-card p-6">
          <ContactAvatar contact={contact} size={72} />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <StatusTag status={contact.status} />
              {contact.industry && (
                <span className="rounded-full bg-bg-tertiary px-2.5 py-0.5 text-[11px] text-text-secondary">
                  {contact.industry}
                </span>
              )}
              {contact.topics?.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full bg-purple/12 px-2.5 py-0.5 text-[11px] text-purple"
                >
                  {topic}
                </span>
              ))}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div>
                <dt className="text-[10.5px] uppercase tracking-wider text-text-tertiary">
                  Email
                </dt>
                <dd className="mt-0.5 text-text-primary">{contact.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[10.5px] uppercase tracking-wider text-text-tertiary">
                  Source
                </dt>
                <dd className="mt-0.5 text-text-primary">{contact.source ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[10.5px] uppercase tracking-wider text-text-tertiary">
                  Score
                </dt>
                <dd className="mt-0.5 font-mono tabular-nums text-text-primary">
                  {Math.round(contact.score)} / 100
                </dd>
              </div>
              <div>
                <dt className="text-[10.5px] uppercase tracking-wider text-text-tertiary">
                  Engagement
                </dt>
                <dd className="mt-0.5 font-mono tabular-nums text-text-primary">
                  {Math.round(contact.engagement)} / 100
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <BriefingCard
          contactId={contact.id}
          contactFirstName={contact.first_name}
          initialBriefing={latest?.briefing ?? null}
          initialRunMeta={
            latest
              ? {
                  started_at: latest.run.started_at,
                  finished_at: latest.run.finished_at,
                  search_provider: latest.run.search_provider,
                  finding_count: latest.briefing.findings.length,
                }
              : null
          }
          demoMode={demoMode}
        />
      </div>
    </>
  );
}
