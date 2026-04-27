import Link from "next/link";
import { PageHeader } from "@/components/app/PageHeader";
import { ContactAvatar } from "@/components/app/ContactAvatar";
import { StatusTag } from "@/components/app/StatusTag";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ContactsFilters } from "@/components/app/ContactsFilters";
import { applyFilters, parseFiltersFromParams } from "@/lib/contacts/filters";
import { listContacts, listContactsAwaitingTopicReview } from "@/lib/contacts/repo";
import { activeTopicLabels } from "@/lib/topics/taxonomy";

function formatLastTouch(iso: string | null): string {
  if (!iso) return "Never";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 60) return "Last month";
  return `${Math.floor(days / 30)} months ago`;
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const wrappedSp = {
    get: (k: string) => sp[k] ?? null,
  };
  const filters = parseFiltersFromParams(wrappedSp);

  const [allContacts, topicLabels, awaitingReview] = await Promise.all([
    listContacts(),
    activeTopicLabels(),
    listContactsAwaitingTopicReview(),
  ]);

  const filtered = applyFilters(allContacts, filters);
  const industries = Array.from(
    new Set(allContacts.map((c) => c.industry).filter((x): x is string => Boolean(x)))
  ).sort();

  const subtitle = `${filtered.length} of ${allContacts.length} contacts${
    awaitingReview.length ? ` · ${awaitingReview.length} awaiting topic review` : ""
  }`;

  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle={subtitle}
        actions={
          <>
            {awaitingReview.length > 0 && (
              <Link
                href="/contacts/review-topics"
                className={buttonVariants({ variant: "secondary" })}
              >
                Review topics ({awaitingReview.length})
              </Link>
            )}
            <Link href="/import" className={buttonVariants()}>
              Upload CSV
            </Link>
          </>
        }
      />
      <div className="space-y-5 px-8 py-7">
        <ContactsFilters industries={industries} topics={topicLabels} />

        <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[32%]">Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Topics</TableHead>
                <TableHead>Last touch</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="border-border/40">
                  <TableCell>
                    <Link
                      href={`/contacts/${c.id}`}
                      className="flex items-center gap-3 hover:text-text-primary"
                    >
                      <ContactAvatar contact={c} />
                      <div>
                        <div className="font-medium text-text-primary">{c.full_name}</div>
                        <div className="text-[11.5px] text-text-tertiary">
                          {c.title}
                          {c.company ? ` · ${c.company}` : ""}
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusTag status={c.status} />
                  </TableCell>
                  <TableCell className="text-text-secondary">{c.industry || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.topics.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-purple/12 px-2 py-0.5 text-[10.5px] text-purple"
                        >
                          {t}
                        </span>
                      ))}
                      {c.topics.length > 3 && (
                        <span className="text-[10.5px] text-text-tertiary">
                          +{c.topics.length - 3}
                        </span>
                      )}
                      {c.topics.length === 0 && (
                        <span className="text-[10.5px] text-text-tertiary">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {formatLastTouch(c.last_touch_at)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-text-primary">
                    {Math.round(c.score)}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-text-tertiary">
                    {allContacts.length === 0
                      ? "No contacts yet. Upload a CSV to get started."
                      : "No contacts match these filters."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
