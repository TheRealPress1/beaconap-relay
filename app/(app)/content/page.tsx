import { PageHeader } from "@/components/app/PageHeader";
import { Sparkles } from "lucide-react";

export default function ContentPage() {
  return (
    <>
      <PageHeader
        title="Content Feed"
        subtitle="AI-curated content matched to your network"
      />
      <div className="px-8 py-7">
        <div className="rounded-xl border border-dashed border-border bg-bg-card/50 p-12 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-text-tertiary" />
          <h2 className="mt-4 font-display text-lg font-semibold text-text-primary">
            Coming in Phase 3
          </h2>
          <p className="mt-2 max-w-md mx-auto text-sm text-text-secondary">
            Once the research pipeline ships, this feed will surface fresh articles,
            podcasts, interviews, and LinkedIn activity matched to each contact in
            your network.
          </p>
        </div>
      </div>
    </>
  );
}
