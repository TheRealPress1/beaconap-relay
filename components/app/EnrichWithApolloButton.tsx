"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function EnrichWithApolloButton({ contactId }: { contactId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleClick() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/apollo/enrich/${contactId}`, { method: "POST" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Enrich failed");
        if (!json.enrichment) {
          toast.message("No Apollo match", {
            description: "Apollo didn't return a profile for this contact.",
          });
          return;
        }
        const fields: string[] = [];
        if (json.enrichment.title) fields.push("title");
        if (json.enrichment.industry) fields.push("industry");
        if (json.enrichment.linkedin_url) fields.push("LinkedIn");
        toast.success(
          `Enriched${json.demo ? " (demo)" : ""}${fields.length ? ` — ${fields.join(", ")} updated` : ""}`
        );
        setDone(true);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Enrich failed");
      }
    });
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={handleClick}
      disabled={pending}
      title="Pull title, seniority, LinkedIn, and employment history from Apollo.io"
    >
      <Sparkles className={`mr-1.5 h-3.5 w-3.5 ${pending ? "animate-pulse" : ""}`} />
      {pending ? "Enriching…" : done ? "Enriched" : "Enrich with Apollo"}
    </Button>
  );
}
