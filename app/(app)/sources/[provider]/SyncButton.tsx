"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  endpoint: string;
  label?: string;
};

export function SyncButton({ endpoint, label = "Sync now" }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const res = await fetch(endpoint, { method: "POST" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Sync failed");
        const detail =
          typeof json.matched_contacts === "number"
            ? `${json.matched_contacts} contact${json.matched_contacts === 1 ? "" : "s"} matched, ${json.inserted} interaction${json.inserted === 1 ? "" : "s"} stored`
            : "Synced";
        toast.success(`${detail}${json.demo ? " (demo)" : ""}`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Sync failed");
      }
    });
  }

  return (
    <Button onClick={handleClick} disabled={pending} size="sm">
      <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Syncing…" : label}
    </Button>
  );
}
