import { PageHeader } from "@/components/app/PageHeader";
import {
  isSupabaseConfigured,
  listContactsAwaitingTopicReview,
} from "@/lib/contacts/repo";
import { ReviewClient } from "./ReviewClient";

export default async function ReviewTopicsPage() {
  const contacts = await listContactsAwaitingTopicReview();
  const configured = isSupabaseConfigured();

  return (
    <>
      <PageHeader
        title="Review topic suggestions"
        subtitle="Claude proposes, you approve"
      />
      <div className="px-8 py-7">
        <div className="mx-auto max-w-4xl">
          {!configured && (
            <div className="mb-5 rounded-md border border-status-warm/30 bg-status-warm/5 px-4 py-3 text-xs text-status-warm">
              Supabase env vars are not set. Approvals won&apos;t persist; this page is rendering
              from <span className="font-mono">lib/data/seed.ts</span> for layout review only.
            </div>
          )}
          <ReviewClient initialContacts={contacts} supabaseConfigured={configured} />
        </div>
      </div>
    </>
  );
}
