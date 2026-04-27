import Link from "next/link";
import { ContactAvatar } from "./ContactAvatar";
import { StatusTag } from "./StatusTag";
import type { ContactRow } from "@/lib/supabase/types";

export function ContactGroupCard({
  heading,
  count,
  contacts,
}: {
  heading: string;
  count: number;
  contacts: ContactRow[];
}) {
  return (
    <section className="rounded-xl border border-border bg-bg-card">
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold text-text-primary">{heading}</h2>
        <span className="text-[11px] text-text-tertiary">
          {count} contact{count === 1 ? "" : "s"}
        </span>
      </header>
      <ul className="divide-y divide-border/40">
        {contacts.map((c) => (
          <li key={c.id}>
            <Link
              href={`/contacts/${c.id}`}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-bg-hover"
            >
              <ContactAvatar contact={c} size={32} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-text-primary">
                    {c.full_name}
                  </span>
                  <StatusTag status={c.status} />
                </div>
                <div className="truncate text-xs text-text-tertiary">
                  {c.title}
                  {c.company ? ` · ${c.company}` : ""}
                </div>
              </div>
              <span className="font-mono text-xs text-text-tertiary tabular-nums">
                {Math.round(c.score)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
