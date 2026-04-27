"use client";

import { useCallback, useState, useTransition } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { analyzeCsv, commitCsv, type CsvAnalysis } from "@/app/actions/csv";
import { CONTACT_FIELDS, type ContactField } from "@/lib/csv/fields";

const FIELD_OPTIONS: Array<{ value: ContactField | "ignore"; label: string }> = [
  ...CONTACT_FIELDS.map((f) => ({ value: f, label: f })),
  { value: "ignore", label: "ignore" },
];

const BUCKET_BADGE = {
  new: "bg-status-success/12 text-status-success",
  update: "bg-accent-blue/12 text-accent-light",
  duplicate: "bg-bg-tertiary text-text-tertiary",
  skip: "bg-amber-500/12 text-amber-400",
};

export function CsvUploader() {
  const [analysis, setAnalysis] = useState<CsvAnalysis | null>(null);
  const [analyzing, startAnalyze] = useTransition();
  const [committing, startCommit] = useTransition();
  const [done, setDone] = useState<{ inserted: number; updated: number; skipped: number } | null>(
    null
  );

  const onDrop = useCallback((files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setDone(null);
    startAnalyze(async () => {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const result = await analyzeCsv(fd);
        setAnalysis(result);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to read CSV");
      }
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
    disabled: analyzing,
  });

  function updateMap(header: string, value: string | null) {
    if (!analysis || value == null) return;
    setAnalysis({
      ...analysis,
      proposedMap: { ...analysis.proposedMap, [header]: value as ContactField | "ignore" },
    });
  }

  function handleImport() {
    if (!analysis) return;
    startCommit(async () => {
      try {
        const result = await commitCsv({
          filename: analysis.filename,
          columnMap: analysis.proposedMap,
          rawCsv: analysis.rawCsv,
        });
        setDone({
          inserted: result.inserted,
          updated: result.updated,
          skipped: result.skipped,
        });
        setAnalysis(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Import failed");
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-status-success/30 bg-status-success/5 p-8 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-status-success" />
        <h3 className="mt-3 font-display text-lg font-semibold text-text-primary">
          Import complete
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          {done.inserted} new · {done.updated} updated · {done.skipped} skipped
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/contacts" className={buttonVariants()}>
            View contacts
          </Link>
          <Button variant="secondary" onClick={() => setDone(null)}>
            Upload another
          </Button>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div
        {...getRootProps()}
        className={cn(
          "rounded-xl border-2 border-dashed bg-bg-tertiary p-12 text-center transition-colors",
          analyzing
            ? "cursor-wait opacity-60"
            : isDragActive
              ? "cursor-pointer border-accent-blue bg-accent-blue/5"
              : "cursor-pointer border-border hover:border-border-light"
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-8 w-8 text-text-tertiary" />
        <div className="mt-3 text-sm font-medium text-text-secondary">
          {analyzing
            ? "Analyzing your CSV…"
            : isDragActive
              ? "Drop the file here"
              : "Drag & drop a .csv file here"}
        </div>
        <div className="mt-1 text-xs text-text-tertiary">or click to browse</div>
      </div>
    );
  }

  const cssCounts = analysis.counts;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-text-tertiary">
              File
            </div>
            <div className="mt-0.5 font-mono text-sm text-text-primary">
              {analysis.filename}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">
              {analysis.rowCount} rows · {analysis.headers.length} columns
            </span>
            <Sparkles className="h-3.5 w-3.5 text-accent-light" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["new", "update", "duplicate", "skip"] as const).map((bucket) => (
            <div
              key={bucket}
              className={cn(
                "rounded-md px-3 py-2",
                BUCKET_BADGE[bucket]
              )}
            >
              <div className="text-[10.5px] uppercase tracking-wider opacity-80">
                {bucket}
              </div>
              <div className="mt-0.5 font-display text-xl font-bold tabular-nums">
                {cssCounts[bucket]}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Column mapping</h3>
          <span className="text-[11px] text-text-tertiary">
            Claude proposed these. Override before importing.
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {analysis.headers.map((header) => (
            <div key={header} className="flex items-center gap-3">
              <div className="flex-1 truncate font-mono text-xs text-text-secondary">
                {header}
              </div>
              <Select
                value={analysis.proposedMap[header] ?? "ignore"}
                onValueChange={(v) => updateMap(header, v)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
        <div className="border-b border-border px-5 py-3 text-sm font-semibold text-text-primary">
          Row preview (first 12)
        </div>
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-bg-card">
              <tr className="border-b border-border text-left text-[10.5px] uppercase tracking-wider text-text-tertiary">
                <th className="px-4 py-2">Disposition</th>
                <th className="px-4 py-2">First</th>
                <th className="px-4 py-2">Last</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Company</th>
                <th className="px-4 py-2">Title</th>
              </tr>
            </thead>
            <tbody>
              {analysis.preview.slice(0, 12).map(({ outcome }, i) => (
                <tr key={i} className="border-b border-border/30 last:border-0">
                  <td className="px-4 py-2">
                    <Badge className={cn(BUCKET_BADGE[outcome.bucket], "border-0")}>
                      {outcome.bucket}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-text-primary">
                    {outcome.candidate.first_name || "—"}
                  </td>
                  <td className="px-4 py-2 text-text-secondary">
                    {outcome.candidate.last_name || "—"}
                  </td>
                  <td className="px-4 py-2 font-mono text-text-secondary">
                    {outcome.candidate.email || "—"}
                  </td>
                  <td className="px-4 py-2 text-text-secondary">
                    {outcome.candidate.company || "—"}
                  </td>
                  <td className="px-4 py-2 text-text-secondary">
                    {outcome.candidate.title || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setAnalysis(null)} disabled={committing}>
          Cancel
        </Button>
        <Button onClick={handleImport} disabled={committing}>
          {committing
            ? "Importing…"
            : `Import ${cssCounts.new + cssCounts.update} contacts`}
        </Button>
      </div>
    </div>
  );
}
