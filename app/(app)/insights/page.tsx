import { PageHeader } from "@/components/app/PageHeader";
import { Sparkles } from "lucide-react";

export default function InsightsPage() {
  return (
    <>
      <PageHeader
        title="AI Insights"
        subtitle="Network intelligence and recommendations"
      />
      <div className="px-8 py-7">
        <div className="rounded-xl border border-dashed border-border bg-bg-card/50 p-12 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-text-tertiary" />
          <h2 className="mt-4 font-display text-lg font-semibold text-text-primary">
            Coming after the research pipeline
          </h2>
          <p className="mt-2 max-w-md mx-auto text-sm text-text-secondary">
            Relationship decay alerts, content performance, and network gap analysis
            will live here once Phase 3 lands.
          </p>
        </div>
      </div>
    </>
  );
}
