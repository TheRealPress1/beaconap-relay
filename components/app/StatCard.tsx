import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  change?: string;
  changeDirection?: "up" | "down" | "neutral";
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  accentColor: "accent" | "green" | "amber" | "purple";
};

const ACCENT_BAR: Record<StatCardProps["accentColor"], string> = {
  accent: "bg-accent-blue",
  green: "bg-status-success",
  amber: "bg-status-warm",
  purple: "bg-purple",
};

const ACCENT_BG: Record<StatCardProps["accentColor"], string> = {
  accent: "bg-accent-blue/12 text-accent-light",
  green: "bg-status-success/12 text-status-success",
  amber: "bg-status-warm/12 text-status-warm",
  purple: "bg-purple/12 text-purple",
};

export function StatCard({ label, value, change, changeDirection, icon: Icon, accentColor }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-bg-card p-5">
      <span className={cn("absolute inset-x-0 top-0 h-0.5", ACCENT_BAR[accentColor])} />
      <div
        className={cn(
          "mb-3 flex h-9 w-9 items-center justify-center rounded-md",
          ACCENT_BG[accentColor]
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </div>
      <div className="text-[11.5px] font-medium uppercase tracking-[0.8px] text-text-tertiary">
        {label}
      </div>
      <div className="mt-1 font-display text-3xl font-bold tracking-tight text-text-primary">
        {value}
      </div>
      {change && (
        <div
          className={cn(
            "mt-1.5 text-[11.5px] font-medium",
            changeDirection === "up" && "text-status-success",
            changeDirection === "down" && "text-red-400",
            changeDirection === "neutral" && "text-text-tertiary"
          )}
        >
          {change}
        </div>
      )}
    </div>
  );
}
