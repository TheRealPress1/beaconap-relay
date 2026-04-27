"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addTopicAction,
  archiveTopicAction,
  renameTopicAction,
} from "@/app/actions/topics";
import type { TopicEntry } from "@/lib/topics/taxonomy";

export function TaxonomyClient({
  initialTopics,
  supabaseConfigured,
}: {
  initialTopics: TopicEntry[];
  supabaseConfigured: boolean;
}) {
  const [topics, setTopics] = useState(initialTopics);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [pending, startTransition] = useTransition();

  function startEdit(t: TopicEntry) {
    setEditingId(t.id);
    setEditLabel(t.label);
    setEditDescription(t.description ?? "");
  }

  function commitAdd() {
    const label = newLabel.trim();
    if (!label) return;
    startTransition(async () => {
      try {
        await addTopicAction({ label, description: newDescription });
        toast.success(`Added "${label}"`);
        setTopics((prev) => [
          {
            id: `pending-${Date.now()}`,
            slug: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            label,
            description: newDescription || null,
            archived_at: null,
            contact_count: 0,
          },
          ...prev,
        ]);
        setNewLabel("");
        setNewDescription("");
        setAdding(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add");
      }
    });
  }

  function commitEdit(id: string) {
    const label = editLabel.trim();
    if (!label) return;
    startTransition(async () => {
      try {
        await renameTopicAction({ id, label, description: editDescription });
        toast.success(`Renamed to "${label}"`);
        setTopics((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, label, description: editDescription || null } : t
          )
        );
        setEditingId(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Rename failed");
      }
    });
  }

  function toggleArchive(t: TopicEntry) {
    const archive = !t.archived_at;
    startTransition(async () => {
      try {
        await archiveTopicAction(t.id, archive);
        setTopics((prev) =>
          prev.map((x) =>
            x.id === t.id
              ? { ...x, archived_at: archive ? new Date().toISOString() : null }
              : x
          )
        );
        toast.success(archive ? `Archived "${t.label}"` : `Restored "${t.label}"`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-5">
      {!supabaseConfigured && (
        <div className="rounded-md border border-status-warm/30 bg-status-warm/5 px-4 py-3 text-xs text-status-warm">
          Supabase env vars are not set. Edits will fail with a clear error until they are.
        </div>
      )}

      <div className="rounded-xl border border-border bg-bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Taxonomy</h2>
          {adding ? (
            <Button variant="secondary" size="sm" onClick={() => setAdding(false)}>
              <X className="mr-1 h-3.5 w-3.5" />
              Cancel
            </Button>
          ) : (
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add topic
            </Button>
          )}
        </div>

        {adding && (
          <div className="border-b border-border bg-bg-secondary px-5 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-text-secondary">Label</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Insurance"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-text-secondary">Description (optional)</Label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="What this topic covers…"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button onClick={commitAdd} disabled={pending || !newLabel.trim()} size="sm">
                Save topic
              </Button>
            </div>
          </div>
        )}

        <ul className="divide-y divide-border/40">
          {topics.map((t) => {
            const isArchived = !!t.archived_at;
            const isEditing = editingId === t.id;
            return (
              <li
                key={t.id}
                className={`flex items-start justify-between gap-4 px-5 py-4 ${
                  isArchived ? "opacity-50" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                      />
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">{t.label}</span>
                        <span className="font-mono text-[10.5px] text-text-tertiary">
                          {t.slug}
                        </span>
                        <span className="text-[10.5px] text-text-tertiary">
                          · {t.contact_count} contact{t.contact_count === 1 ? "" : "s"}
                        </span>
                      </div>
                      {t.description && (
                        <p className="mt-0.5 text-xs text-text-secondary">{t.description}</p>
                      )}
                    </>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => commitEdit(t.id)}
                      >
                        Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(t)}
                        disabled={isArchived}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleArchive(t)}
                        disabled={pending}
                      >
                        {isArchived ? (
                          <ArchiveRestore className="h-3.5 w-3.5" />
                        ) : (
                          <Archive className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
