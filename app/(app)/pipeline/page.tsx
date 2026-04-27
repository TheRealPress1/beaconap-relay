import { PageHeader } from "@/components/app/PageHeader";
import { ContactAvatar } from "@/components/app/ContactAvatar";
import { listContacts } from "@/lib/contacts/repo";
import type { ContactStatus } from "@/lib/supabase/types";

const COLUMNS: { status: ContactStatus; tone: string }[] = [
  { status: "Cold", tone: "border-text-tertiary/30" },
  { status: "Nurture", tone: "border-accent-blue/40" },
  { status: "Warm", tone: "border-status-warm/40" },
  { status: "Hot", tone: "border-red-500/40" },
];

export default async function PipelinePage() {
  const contacts = await listContacts();

  return (
    <>
      <PageHeader title="Pipeline" subtitle="Relationship funnel overview" />
      <div className="px-8 py-7">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map(({ status, tone }) => {
            const items = contacts.filter((c) => c.status === status);
            return (
              <div
                key={status}
                className={`rounded-xl border ${tone} bg-bg-card p-4`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-text-primary">{status}</h3>
                  <span className="text-[11px] text-text-tertiary">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2.5 rounded-md border border-border/50 bg-bg-secondary p-2.5"
                    >
                      <ContactAvatar contact={c} size={28} />
                      <div className="min-w-0">
                        <div className="truncate text-[12.5px] font-medium text-text-primary">
                          {c.full_name}
                        </div>
                        <div className="truncate text-[11px] text-text-tertiary">
                          {c.company ?? c.industry ?? ""}
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-md border border-dashed border-border/40 px-3 py-4 text-center text-[11px] text-text-tertiary">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
