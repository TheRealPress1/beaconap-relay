import { PageHeader } from "@/components/app/PageHeader";
import { listLatestDrafts } from "@/lib/outreach/repo";
import { listContacts } from "@/lib/contacts/repo";
import { OutreachTable } from "./OutreachTable";

export default async function OutreachPage() {
  const [drafts, contacts] = await Promise.all([listLatestDrafts(100), listContacts()]);
  const byId = new Map(contacts.map((c) => [c.id, c]));

  const rows = drafts.map((d) => {
    const c = byId.get(d.contact_id);
    return {
      ...d,
      contact_full_name: c?.full_name ?? "Unknown contact",
      contact_company: c?.company ?? null,
    };
  });

  const sentToday = drafts.filter(
    (d) =>
      d.status === "sent" &&
      d.sent_at &&
      Date.now() - new Date(d.sent_at).getTime() < 24 * 60 * 60 * 1000
  ).length;
  const inDraft = drafts.filter((d) => d.status === "draft").length;

  return (
    <>
      <PageHeader
        title="Outreach"
        subtitle={`${drafts.length} draft${drafts.length === 1 ? "" : "s"} · ${inDraft} in draft · ${sentToday} sent today`}
      />
      <div className="px-8 py-7">
        <OutreachTable rows={rows} />
      </div>
    </>
  );
}
