"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Mail,
  RefreshCw,
  Rocket,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  draftOutreachAction,
  markDraftStatusAction,
  updateDraftTextAction,
} from "@/app/actions/outreach";
import { TONE_OPTIONS } from "@/lib/outreach/types";
import type { OutreachDraftRow, OutreachTone } from "@/lib/supabase/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactEmail: string | null;
  contactFirstName: string;
  initialDraft: OutreachDraftRow | null;
};

export function OutreachDraftModal({
  open,
  onOpenChange,
  contactId,
  contactEmail,
  contactFirstName,
  initialDraft,
}: Props) {
  const [draft, setDraft] = useState<OutreachDraftRow | null>(initialDraft);
  const [tone, setTone] = useState<OutreachTone>(initialDraft?.tone ?? "warm");
  const [subject, setSubject] = useState(initialDraft?.subject ?? "");
  const [body, setBody] = useState(initialDraft?.body ?? "");
  const [sequenceId, setSequenceId] = useState("");
  const [generating, startGenerate] = useTransition();
  const [persisting, startPersist] = useTransition();
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!initialDraft) {
      generate(tone);
    } else {
      setDraft(initialDraft);
      setSubject(initialDraft.subject);
      setBody(initialDraft.body);
      setTone(initialDraft.tone);
      setDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialDraft?.id]);

  function generate(nextTone: OutreachTone) {
    startGenerate(async () => {
      try {
        const next = await draftOutreachAction({ contactId, tone: nextTone });
        setDraft(next);
        setSubject(next.subject);
        setBody(next.body);
        setTone(next.tone);
        setDirty(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Draft failed");
      }
    });
  }

  async function persistEdits(): Promise<OutreachDraftRow | null> {
    if (!draft) return null;
    if (!dirty) return draft;
    if (!draft.id.startsWith("local-")) {
      try {
        await updateDraftTextAction({ draftId: draft.id, subject, body });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
        return draft;
      }
    }
    const updated = { ...draft, subject, body };
    setDraft(updated);
    setDirty(false);
    return updated;
  }

  function handleCopy() {
    startPersist(async () => {
      const text = `Subject: ${subject}\n\n${body}`;
      await navigator.clipboard.writeText(text);
      toast.success("Copied subject + body to clipboard");
      const saved = await persistEdits();
      if (saved && !saved.id.startsWith("local-")) {
        await markDraftStatusAction({ draftId: saved.id, status: "copied", via: "clipboard" });
      }
    });
  }

  function handleMailto() {
    if (!contactEmail) {
      toast.error("Contact has no email on file. Add one to use the Gmail link.");
      return;
    }
    startPersist(async () => {
      const saved = await persistEdits();
      const url = `mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      window.open(url, "_self");
      if (saved && !saved.id.startsWith("local-")) {
        await markDraftStatusAction({ draftId: saved.id, status: "copied", via: "mailto" });
      }
    });
  }

  function handleSave() {
    startPersist(async () => {
      const saved = await persistEdits();
      if (saved) toast.success("Draft saved");
    });
  }

  function handleMarkSent() {
    startPersist(async () => {
      const saved = await persistEdits();
      if (!saved) return;
      if (saved.id.startsWith("local-")) {
        toast.error("Connect Supabase to track sent drafts.");
        return;
      }
      try {
        await markDraftStatusAction({ draftId: saved.id, status: "sent", via: "manual" });
        toast.success(`Marked sent — ${contactFirstName}'s last touch updated`);
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  function handlePushApollo() {
    startPersist(async () => {
      const saved = await persistEdits();
      if (!saved) return;
      if (saved.id.startsWith("local-")) {
        toast.error("Connect Supabase to push to Apollo.");
        return;
      }
      try {
        const res = await fetch("/api/apollo/sequence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            draftId: saved.id,
            sequenceId: sequenceId.trim() || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Apollo push failed");
        toast.success(json.message ?? `Pushed to sequence ${json.sequence_id}`);
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Apollo push failed");
      }
    });
  }

  const used = draft?.used_findings ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-light" />
            Draft outreach to {contactFirstName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-text-tertiary">Tone</Label>
              <Select
                value={tone}
                onValueChange={(v) => {
                  if (!v) return;
                  const next = v as OutreachTone;
                  setTone(next);
                  if (next !== draft?.tone) generate(next);
                }}
                disabled={generating || persisting}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => generate(tone)}
                disabled={generating}
              >
                <RefreshCw className={`mr-1 h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
                Regenerate
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-text-tertiary">Subject</Label>
              <Input
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setDirty(true);
                }}
                disabled={generating}
                placeholder={generating ? "Drafting…" : ""}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-text-tertiary">Body</Label>
              <textarea
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setDirty(true);
                }}
                disabled={generating}
                rows={14}
                placeholder={generating ? "Drafting…" : ""}
                className="w-full rounded-md border border-border bg-bg-tertiary px-3 py-2 text-[13px] leading-relaxed text-text-primary outline-none focus:border-accent-blue"
              />
            </div>
          </div>

          <aside className="rounded-lg border border-border/60 bg-bg-secondary p-4">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-wider text-text-tertiary">
              Citations
            </h3>
            {used.length === 0 ? (
              <p className="mt-2 text-xs text-text-tertiary">
                No findings cited yet. Try a different tone or refresh research first.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {used.map((f, i) => (
                  <li key={`${f.id}-${i}`} className="text-xs text-text-secondary">
                    <span className="text-text-primary">{f.title}</span>
                    {f.url && (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 inline-flex items-center gap-0.5 text-accent-light hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {draft?.status && (
              <div className="mt-4 border-t border-border/60 pt-3 text-xs">
                <span className="text-text-tertiary">Status: </span>
                <span className="font-medium text-text-primary capitalize">{draft.status}</span>
                {draft.sent_via && (
                  <span className="text-text-tertiary"> · via {draft.sent_via}</span>
                )}
              </div>
            )}
          </aside>
        </div>

        <div className="mt-2 rounded-md border border-border/60 bg-bg-secondary px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-[10.5px] uppercase tracking-wider text-text-tertiary">
              Apollo sequence
            </Label>
            <Input
              value={sequenceId}
              onChange={(e) => setSequenceId(e.target.value)}
              placeholder="Sequence id (or set APOLLO_DEFAULT_SEQUENCE_ID)"
              className="h-8 flex-1 min-w-[200px]"
              disabled={generating || persisting}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={handlePushApollo}
              disabled={generating || persisting || !draft}
            >
              <Rocket className="mr-1 h-3.5 w-3.5" />
              Push to Apollo
            </Button>
          </div>
        </div>

        <DialogFooter className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={handleSave} disabled={generating || persisting || !draft}>
            <Check className="mr-1 h-3.5 w-3.5" />
            Save draft
          </Button>
          <Button variant="secondary" size="sm" onClick={handleCopy} disabled={generating || !subject || !body}>
            <Copy className="mr-1 h-3.5 w-3.5" />
            Copy
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMailto}
            disabled={generating || !contactEmail}
            title={contactEmail ? "" : "Contact has no email on file"}
          >
            <Mail className="mr-1 h-3.5 w-3.5" />
            Open in Gmail
          </Button>
          <Button size="sm" onClick={handleMarkSent} disabled={generating || persisting || !draft}>
            <Send className="mr-1 h-3.5 w-3.5" />
            Mark sent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
