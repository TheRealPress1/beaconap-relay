"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  Building2,
  FileText,
  LayoutGrid,
  ListChecks,
  LogOut,
  Mail,
  Mic,
  Send,
  Settings,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  count?: number;
  dotColor?: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

function allHrefs(): string[] {
  return SECTIONS.flatMap((s) => s.items.map((i) => i.href));
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  // Defer to a more specific item if one matches.
  const more = allHrefs().some(
    (other) =>
      other !== href &&
      other.startsWith(`${href}/`) &&
      (pathname === other || pathname.startsWith(`${other}/`))
  );
  return !more;
}

const SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutGrid },
      { href: "/contacts", label: "Contacts", icon: Users },
      { href: "/contacts/by-industry", label: "By industry", icon: Building2 },
      { href: "/contacts/by-topic", label: "By topic", icon: Tag },
      { href: "/contacts/review-topics", label: "Review topics", icon: ListChecks },
      { href: "/pipeline", label: "Pipeline", icon: Activity },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/content", label: "Content Feed", icon: BookOpen },
      { href: "/insights", label: "AI Insights", icon: Sparkles },
    ],
  },
  {
    label: "Connected Sources",
    items: [
      { href: "/sources/csv", label: "CSV Import", icon: FileText, dotColor: "var(--green)" },
      { href: "/sources/gmail", label: "Gmail", icon: Mail, dotColor: "var(--text-tertiary)" },
      { href: "/sources/granola", label: "Granola", icon: Mic, dotColor: "var(--text-tertiary)" },
      { href: "/sources/apollo", label: "Apollo.io", icon: Send, dotColor: "var(--amber)" },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/settings", label: "API Settings", icon: Settings },
      { href: "/settings/taxonomy", label: "Topic taxonomy", icon: Tag },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-bg-secondary px-4 py-6">
      <div className="mb-9 flex items-center gap-2.5 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-blue text-white">
          <span className="font-display text-sm font-semibold">B</span>
        </div>
        <div className="leading-tight">
          <div className="font-display text-base font-semibold tracking-tight text-text-primary">
            BeaconAP
          </div>
          <div className="text-[9.5px] font-medium uppercase tracking-[1.5px] text-text-tertiary">
            Relationship Intelligence
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-6">
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[1.2px] text-text-tertiary">
              {section.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[13.5px] font-normal transition-colors",
                      active
                        ? "bg-accent-blue/12 font-medium text-accent-light"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    )}
                  >
                    {active && (
                      <span className="absolute -left-4 top-1.5 bottom-1.5 w-0.5 rounded-r-sm bg-accent-blue" />
                    )}
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                    <span className="flex-1">{item.label}</span>
                    {item.count !== undefined && (
                      <span className="rounded-full bg-bg-tertiary px-1.5 py-0.5 text-[11px] font-semibold text-text-tertiary">
                        {item.count}
                      </span>
                    )}
                    {item.dotColor && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: item.dotColor }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <SidebarFooter />
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="mt-auto border-t border-border pt-4">
      <div className="flex items-center gap-2.5 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2563eb] text-xs font-semibold text-white">
          MS
        </div>
        <div className="flex-1 leading-tight">
          <div className="text-[13px] font-medium text-text-primary">Michael Sands</div>
          <div className="text-[11px] text-text-tertiary">Founder · BeaconAP</div>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            aria-label="Sign out"
            className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </form>
      </div>
    </div>
  );
}
