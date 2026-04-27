import type {
  OutreachTone,
  OutreachUsedFinding,
} from "@/lib/supabase/types";

export type DraftPayload = {
  subject: string;
  body: string;
  used_findings: OutreachUsedFinding[];
};

export type DraftInputs = {
  contact: {
    id: string;
    full_name: string;
    first_name: string;
    company: string | null;
    title: string | null;
    industry: string | null;
    topics: string[];
  };
  briefing: {
    talking_points: string[];
    findings: Array<{
      id: string;
      kind: string;
      title: string;
      url: string | null;
      source: string | null;
      summary: string | null;
      talking_points: string[];
    }>;
  } | null;
  tone: OutreachTone;
  styleExamples: Array<{ kind: string; label: string; body: string }>;
};

export const TONE_OPTIONS: Array<{ value: OutreachTone; label: string; helper: string }> = [
  { value: "warm", label: "Warm", helper: "Friendly opener, relationship-first" },
  { value: "professional", label: "Professional", helper: "Crisp, business-formal" },
  { value: "curious", label: "Curious", helper: "Lead with a question, seek their take" },
  { value: "provocative", label: "Provocative", helper: "Sharp opinion, stake a claim" },
];
