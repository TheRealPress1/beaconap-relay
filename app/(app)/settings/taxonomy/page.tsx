import { PageHeader } from "@/components/app/PageHeader";
import { listTopics } from "@/lib/topics/taxonomy";
import { isSupabaseConfigured } from "@/lib/contacts/repo";
import { TaxonomyClient } from "./TaxonomyClient";

export default async function TaxonomyPage() {
  const topics = await listTopics({ includeArchived: true });
  const configured = isSupabaseConfigured();

  return (
    <>
      <PageHeader
        title="Topic taxonomy"
        subtitle={`${topics.filter((t) => !t.archived_at).length} active topics · ${
          topics.filter((t) => t.archived_at).length
        } archived`}
      />
      <div className="px-8 py-7">
        <div className="mx-auto max-w-3xl">
          <TaxonomyClient initialTopics={topics} supabaseConfigured={configured} />
        </div>
      </div>
    </>
  );
}
