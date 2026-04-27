import type { ReactNode } from "react";
import { Sidebar } from "@/components/app/Sidebar";

// All authenticated pages read live state (contacts, taxonomy, drafts, runs,
// connector_syncs). Disable static prerender so DB writes — including raw SQL
// pasted into Supabase — are reflected on the next page load instead of
// requiring a redeploy.
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      <main className="ml-60 min-h-screen">{children}</main>
    </div>
  );
}
