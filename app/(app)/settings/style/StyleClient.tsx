"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  addStyleAction,
  archiveStyleAction,
  updateStyleAction,
} from "@/app/actions/outreachStyle";
import type {
  OutreachStyleKind,
  OutreachStyleRow,
} from "@/lib/supabase/types";

const KIND_OPTIONS: Array<{ value: OutreachStyleKind; label: string; helper: string }> = [
  {
    value: "good_example",
    label: "Good example",
    helper: "Past email Michael liked. Claude should sound like this.",
  },
  {
    value: "bad_example",
    label: "Bad example",
    helper: "Past email Michael disliked. Claude should NOT sound like this.",
  },
  {
    value: "voice_note",
    label: "Voice note",
    helper: "Free-form rule, e.g. 'always lead with one specific compliment'.",
  },
];

const KIND_TONE: Record<OutreachStyleKind, string> = {
  good_example: "border-status-success/30 bg-status-success/5 text-status-success",
  bad_example: "border-red-500/30 bg-red-500/5 text-red-400",
  voice_note: "border-accent-blue/30 bg-accent-blue/5 text-accent-light",
};

export function StyleClient({
  initialRows,
  supabaseConfigured,
}: {
  initialRows: OutreachStyleRow[];
  supabaseConfigured: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [adding, setAdding] = useState(false);
  const [newKind, setNewKind] = useState<OutreachStyleKind>("good_example");
  const [newLabel, setNewLabel] = useState("");
  const [newBody, setNewBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editBody, setEditBody] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setNewLabel("");
    setNewBody("");
    setNewKind("good_example");
    setAdding(false);
  }

  function commitAdd() {
    if (!newLabel.trim() || !newBody.trim()) return;
    startTransition(async () => {
      try {
        await addStyleAction({ kind: newKind, label: newLabel, body: newBody });
        toast.success(`Added "${newLabel}"`);
        setRows((prev) => [
          {
            id: `pending-${Date.now()}`,
            kind: newKind,
            label: newLabel,
            body: newBody,
            archived_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add");
      }
    });
  }

  function startEdit(row: OutreachStyleRow) {
    setEditingId(row.id);
    setEditLabel(row.label);
    setEditBody(row.body);
  }

  function commitEdit(id: string) {
    if (!editLabel.trim() || !editBody.trim()) return;
    startTransition(async () => {
      try {
        await updateStyleAction({ id, label: editLabel, body: editBody });
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, label: editLabel, body: editBody } : r))
        );
        setEditingId(null);
        toast.success("Saved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  function toggleArchive(row: OutreachStyleRow) {
    const archive = !row.archived_at;
    startTransition(async () => {
      try {
        await archiveStyleAction(row.id, archive);
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? { ...r, archived_at: archive ? new Date().toISOString() : null }
              : r
          )
        );
        toast.success(archive ? "Archived" : "Restored");
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
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Voice calibration</h2>
            <p className="text-[11.5px] text-text-tertiary">
              Claude few-shots from these when drafting outreach.
            </p>
          </div>
          {adding ? (
            <Button variant="secondary" size="sm" onClick={reset}>
              <X className="mr-1 h-3.5 w-3.5" />
              Cancel
            </Button>
          ) : (
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add example
            </Button>
          )}
        </div>

        {adding && (
          <div className="border-b border-border bg-bg-secondary px-5 py-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-text-secondary">Kind</Label>
                <Select
                  value={newKind}
                  onValueChange={(v) => v && setNewKind(v as OutreachStyleKind)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KIND_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-text-tertiary">
                  {KIND_OPTIONS.find((k) => k.value === newKind)?.helper}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-text-secondary">Label</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder={
                    newKind === "voice_note"
                      ? "e.g. lead with one specific compliment"
                      : "e.g. Email to Maria, Sept 2025"
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-text-secondary">Body</Label>
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                rows={6}
                placeholder={
                  newKind === "voice_note"
                    ? "Free-form rule…"
                    : "Paste the email body here…"
                }
                className="w-full rounded-md border border-border bg-bg-tertiary px-3 py-2 text-[13px] leading-relaxed text-text-primary outline-none focus:border-accent-blue"
              />
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={commitAdd}
                disabled={pending || !newLabel.trim() || !newBody.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        )}

        <ul className="divide-y divide-border/40">
          {rows.map((row) => {
            const isEditing = editingId === row.id;
            const archived = !!row.archived_at;
            return (
              <li
                key={row.id}
                className={cn("px-5 py-4", archived && "opacity-50")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider",
                          KIND_TONE[row.kind]
                        )}
                      >
                        {row.kind.replace("_", " ")}
                      </span>
                      {isEditing ? (
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="h-7"
                        />
                      ) : (
                        <span className="text-sm font-medium text-text-primary">
                          {row.label}
                        </span>
                      )}
                    </div>
                    {isEditing ? (
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={5}
                        className="w-full rounded-md border border-border bg-bg-tertiary px-3 py-2 text-[12.5px] text-text-primary outline-none focus:border-accent-blue"
                      />
                    ) : (
                      <p className="whitespace-pre-line text-[12.5px] leading-relaxed text-text-secondary">
                        {row.body}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {isEditing ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                        <Button size="sm" disabled={pending} onClick={() => commitEdit(row.id)}>
                          Save
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(row)}
                          disabled={archived || pending}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleArchive(row)}
                          disabled={pending}
                        >
                          {archived ? (
                            <ArchiveRestore className="h-3.5 w-3.5" />
                          ) : (
                            <Archive className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
          {rows.length === 0 && (
            <li className="px-5 py-12 text-center text-sm text-text-tertiary">
              No examples yet. Add one to teach Claude Michael&apos;s voice.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
