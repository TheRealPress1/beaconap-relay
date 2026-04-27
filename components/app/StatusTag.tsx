import { cn } from "@/lib/utils";
import type { ContactStatus } from "@/lib/supabase/types";

const STYLE: Record<ContactStatus, string> = {
  Hot: "bg-red-500/12 text-red-400",
  Warm: "bg-amber-500/12 text-amber-400",
  Nurture: "bg-accent-blue/12 text-accent-light",
  Cold: "bg-bg-tertiary text-text-tertiary",
};

export function StatusTag({ status }: { status: ContactStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        STYLE[status]
      )}
    >
      {status}
    </span>
  );
}
