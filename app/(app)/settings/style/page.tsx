import { PageHeader } from "@/components/app/PageHeader";
import { listStyleExamples } from "@/lib/outreach/repo";
import { isSupabaseConfigured } from "@/lib/contacts/repo";
import { StyleClient } from "./StyleClient";

export default async function StylePage() {
  const rows = await listStyleExamples({ includeArchived: true });
  const configured = isSupabaseConfigured();

  return (
    <>
      <PageHeader
        title="Outreach voice"
        subtitle={`${rows.filter((r) => !r.archived_at).length} active example${rows.length === 1 ? "" : "s"} · ${rows.filter((r) => r.archived_at).length} archived`}
      />
      <div className="px-8 py-7">
        <div className="mx-auto max-w-3xl">
          <StyleClient initialRows={rows} supabaseConfigured={configured} />
        </div>
      </div>
    </>
  );
}
