import { PageHeader } from "@/components/app/PageHeader";
import { ContactGroupCard } from "@/components/app/ContactGroupCard";
import { listContacts } from "@/lib/contacts/repo";
import type { ContactRow } from "@/lib/supabase/types";

const UNCATEGORIZED = "Uncategorized";

export default async function ContactsByIndustryPage() {
  const contacts = await listContacts();

  const groups = new Map<string, ContactRow[]>();
  for (const c of contacts) {
    const key = c.industry?.trim() || UNCATEGORIZED;
    const arr = groups.get(key) ?? [];
    arr.push(c);
    groups.set(key, arr);
  }

  const sorted = Array.from(groups.entries())
    .map(([key, rows]) => ({
      key,
      rows: rows.slice().sort((a, b) => b.score - a.score),
    }))
    .sort((a, b) => {
      if (a.key === UNCATEGORIZED) return 1;
      if (b.key === UNCATEGORIZED) return -1;
      if (b.rows.length !== a.rows.length) return b.rows.length - a.rows.length;
      return a.key.localeCompare(b.key);
    });

  return (
    <>
      <PageHeader
        title="Contacts by industry"
        subtitle={`${groups.size} industries · ${contacts.length} contacts`}
      />
      <div className="space-y-5 px-8 py-7">
        {sorted.map(({ key, rows }) => (
          <ContactGroupCard key={key} heading={key} count={rows.length} contacts={rows} />
        ))}
      </div>
    </>
  );
}
