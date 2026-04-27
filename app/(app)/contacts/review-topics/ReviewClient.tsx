"use client";

import { useState, useTransition } from "react";
import { Check, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContactAvatar } from "@/components/app/ContactAvatar";
import { StatusTag } from "@/components/app/StatusTag";
import { cn } from "@/lib/utils";
import {
  approveProposedTopics,
  dismissProposedTopics,
  proposeTopicsForAll,
} from "@/app/actions/proposeTopics";
import type { ContactRow } from "@/lib/supabase/types";

const HIGH_CONFIDENCE = 0.8;

type ContactSelection = Record<string, Set<string>>;

export function ReviewClient({
  initialContacts,
  supabaseConfigured,
}: {
  initialContacts: ContactRow[];
  supabaseConfigured: boolean;
}) {
  const [contacts, setContacts] = useState<ContactRow[]>(initialContacts);
  // For each contact, track which proposed topics are SELECTED for approval.
  // Default: all are pre-selected, CEO unticks the ones to reject.
  const [selection, setSelection] = useState<ContactSelection>(() => {
    const map: ContactSelection = {};
    for (const c of initialContacts) {
      map[c.id] = new Set(c.proposed_topics?.map((t) => t.topic) ?? []);
    }
    return map;
  });
  const [pending, startTransition] = useTransition();

  if (contacts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-bg-card/50 p-12 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-text-tertiary" />
        <h3 className="mt-3 font-display text-lg font-semibold text-text-primary">
          No topics awaiting review
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          Topic proposals appear here after a CSV import or when you regenerate them.
        </p>
        {supabaseConfigured && (
          <Button
            className="mt-5"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  const r = await proposeTopicsForAll();
                  toast.success(`Proposed topics for ${r.updated} contacts`);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed");
                }
              })
            }
          >
            Regenerate proposals for all
          </Button>
        )}
      </div>
    );
  }

  function toggle(contactId: string, topic: string) {
    setSelection((prev) => {
      const set = new Set(prev[contactId] ?? []);
      if (set.has(topic)) set.delete(topic);
      else set.add(topic);
      return { ...prev, [contactId]: set };
    });
  }

  function approveOne(contact: ContactRow) {
    const accepted = Array.from(selection[contact.id] ?? []);
    startTransition(async () => {
      try {
        await approveProposedTopics(contact.id, accepted);
        setContacts((prev) => prev.filter((c) => c.id !== contact.id));
        toast.success(`Saved ${accepted.length} topic${accepted.length === 1 ? "" : "s"} for ${contact.full_name}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Approve failed");
      }
    });
  }

  function dismissOne(contact: ContactRow) {
    startTransition(async () => {
      try {
        await dismissProposedTopics(contact.id);
        setContacts((prev) => prev.filter((c) => c.id !== contact.id));
        toast.success(`Dismissed proposals for ${contact.full_name}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Dismiss failed");
      }
    });
  }

  function bulkAcceptHighConfidence() {
    startTransition(async () => {
      let count = 0;
      for (const c of contacts) {
        const high = (c.proposed_topics ?? [])
          .filter((t) => t.confidence >= HIGH_CONFIDENCE)
          .map((t) => t.topic);
        if (high.length === 0) continue;
        try {
          await approveProposedTopics(c.id, high);
          count += 1;
        } catch (err) {
          console.error(err);
        }
      }
      setContacts((prev) =>
        prev.filter(
          (c) =>
            (c.proposed_topics ?? []).filter((t) => t.confidence < HIGH_CONFIDENCE).length > 0
        )
      );
      toast.success(`Auto-accepted ${count} contact${count === 1 ? "" : "s"} (≥${HIGH_CONFIDENCE})`);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {contacts.length} contact{contacts.length === 1 ? "" : "s"} awaiting topic review.
        </p>
        <Button onClick={bulkAcceptHighConfidence} disabled={pending} variant="secondary">
          Auto-accept high-confidence (≥{HIGH_CONFIDENCE})
        </Button>
      </div>

      <div className="space-y-3">
        {contacts.map((contact) => {
          const selected = selection[contact.id] ?? new Set<string>();
          return (
            <div
              key={contact.id}
              className="rounded-xl border border-border bg-bg-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ContactAvatar contact={contact} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">
                        {contact.full_name}
                      </span>
                      <StatusTag status={contact.status} />
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {contact.title}
                      {contact.company ? ` · ${contact.company}` : ""}
                      {contact.industry ? ` · ${contact.industry}` : ""}
                    </div>
                    {contact.topics?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {contact.topics.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-bg-tertiary px-2 py-0.5 text-[10.5px] text-text-secondary"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => dismissOne(contact)}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    disabled={pending || selected.size === 0}
                    onClick={() => approveOne(contact)}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Save {selected.size}
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(contact.proposed_topics ?? []).map((t) => {
                  const isSelected = selected.has(t.topic);
                  return (
                    <button
                      key={t.topic}
                      type="button"
                      onClick={() => toggle(contact.id, t.topic)}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        isSelected
                          ? "border-accent-blue/40 bg-accent-blue/12 text-accent-light"
                          : "border-border bg-bg-tertiary text-text-tertiary hover:text-text-secondary"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-3.5 w-3.5 items-center justify-center rounded-full border",
                          isSelected
                            ? "border-accent-blue bg-accent-blue text-white"
                            : "border-border-light"
                        )}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                      </span>
                      {t.topic}
                      <span className="font-mono text-[10.5px] tabular-nums opacity-70">
                        {Math.round(t.confidence * 100)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
