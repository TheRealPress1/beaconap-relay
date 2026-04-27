import { PageHeader } from "@/components/app/PageHeader";
import { ContactGroupCard } from "@/components/app/ContactGroupCard";
import { listContacts } from "@/lib/contacts/repo";
import { activeTopicLabels } from "@/lib/topics/taxonomy";
import type { ContactRow } from "@/lib/supabase/types";

const UNTAGGED = "Untagged";

export default async function ContactsByTopicPage() {
  const [contacts, topicLabels] = await Promise.all([listContacts(), activeTopicLabels()]);

  const groups = new Map<string, ContactRow[]>();
  for (const t of topicLabels) groups.set(t, []);
  groups.set(UNTAGGED, []);

  for (const c of contacts) {
    if (c.topics.length === 0) {
      groups.get(UNTAGGED)!.push(c);
      continue;
    }
    for (const t of c.topics) {
      const arr = groups.get(t) ?? [];
      arr.push(c);
      groups.set(t, arr);
    }
  }

  const sorted = Array.from(groups.entries())
    .filter(([, rows]) => rows.length > 0)
    .map(([key, rows]) => ({
      key,
      rows: rows.slice().sort((a, b) => b.score - a.score),
    }))
    .sort((a, b) => {
      if (a.key === UNTAGGED) return 1;
      if (b.key === UNTAGGED) return -1;
      if (b.rows.length !== a.rows.length) return b.rows.length - a.rows.length;
      return a.key.localeCompare(b.key);
    });

  return (
    <>
      <PageHeader
        title="Contacts by topic"
        subtitle={`${sorted.length} active topics · ${contacts.length} contacts`}
      />
      <div className="space-y-5 px-8 py-7">
        {sorted.map(({ key, rows }) => (
          <ContactGroupCard key={key} heading={key} count={rows.length} contacts={rows} />
        ))}
      </div>
    </>
  );
}
