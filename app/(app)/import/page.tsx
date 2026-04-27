import { PageHeader } from "@/components/app/PageHeader";
import { CsvUploader } from "./CsvUploader";
import { isSupabaseConfigured } from "@/lib/contacts/repo";

export default function ImportPage() {
  return (
    <>
      <PageHeader
        title="Import contacts"
        subtitle="CSV upload with AI column mapping and dedupe"
      />
      <div className="px-8 py-7">
        <div className="mx-auto max-w-4xl space-y-5">
          {!isSupabaseConfigured() && (
            <div className="rounded-md border border-status-warm/30 bg-status-warm/5 px-4 py-3 text-xs text-status-warm">
              Supabase env vars are not set. The page will analyze your CSV, but the
              <span className="font-mono"> Import </span>
              button will not persist until <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span>,
              <span className="font-mono"> NEXT_PUBLIC_SUPABASE_ANON_KEY</span>, and
              <span className="font-mono"> SUPABASE_SERVICE_ROLE_KEY</span> are present.
            </div>
          )}
          <CsvUploader />
        </div>
      </div>
    </>
  );
}
