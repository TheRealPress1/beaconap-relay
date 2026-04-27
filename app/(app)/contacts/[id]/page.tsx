import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { ContactAvatar } from "@/components/app/ContactAvatar";
import { StatusTag } from "@/components/app/StatusTag";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail, FileText } from "lucide-react";
import { getContactById } from "@/lib/contacts/repo";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await getContactById(id);
  if (!contact) notFound();

  return (
    <>
      <PageHeader
        title={contact.full_name}
        subtitle={`${contact.title ?? ""}${contact.company ? ` · ${contact.company}` : ""}`}
        actions={
          <>
            <Button variant="secondary" disabled>
              <FileText className="mr-2 h-4 w-4" />
              Research (Phase 3)
            </Button>
            <Button disabled>
              <Mail className="mr-2 h-4 w-4" />
              Draft outreach (Phase 4)
            </Button>
          </>
        }
      />
      <div className="px-8 py-7">
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

        <div className="mt-6 rounded-xl border border-dashed border-border bg-bg-card/50 p-8 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-text-tertiary" />
          <h3 className="mt-3 font-display text-base font-semibold text-text-primary">
            Briefing arrives in Phase 3
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            On-demand research will surface podcasts, articles, interviews, and LinkedIn
            posts about {contact.first_name} here.
          </p>
        </div>
      </div>
    </>
  );
}
