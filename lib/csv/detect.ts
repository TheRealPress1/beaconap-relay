import "server-only";
import { askJson } from "@/lib/anthropic";
import { CONTACT_FIELDS, type ColumnMap, type ContactField } from "./fields";

export { CONTACT_FIELDS };
export type { ColumnMap, ContactField };

const NORMALIZE_RULES: Array<[RegExp, ContactField]> = [
  [/^(first[\s_-]?name|fname|given[\s_-]?name)$/i, "first_name"],
  [/^(last[\s_-]?name|lname|surname|family[\s_-]?name)$/i, "last_name"],
  [/^(full[\s_-]?name|name|contact[\s_-]?name)$/i, "full_name"],
  [/^(e[\s_-]?mail|email[\s_-]?address|work[\s_-]?email)$/i, "email"],
  [/^(company|organization|organisation|account|employer|firm)$/i, "company"],
  [/^(title|job[\s_-]?title|role|position)$/i, "title"],
  [/^(phone|mobile|telephone|cell)$/i, "phone"],
  [/^(linked[\s_-]?in|linkedin[\s_-]?url|profile)$/i, "linkedin_url"],
  [/^(industry|sector|vertical)$/i, "industry"],
  [/^(source|lead[\s_-]?source|origin)$/i, "source"],
  [/^(notes?|comments?|memo)$/i, "notes"],
];

export function heuristicColumnMap(headers: string[]): ColumnMap {
  const map: ColumnMap = {};
  for (const header of headers) {
    const trimmed = header.trim();
    let matched: ContactField | null = null;
    for (const [pattern, field] of NORMALIZE_RULES) {
      if (pattern.test(trimmed)) {
        matched = field;
        break;
      }
    }
    map[header] = matched ?? "ignore";
  }
  return map;
}

const SYSTEM_PROMPT = `You are a CSV-to-CRM column mapper. Given headers and sample rows, decide which contact field each header maps to. Allowed fields: ${CONTACT_FIELDS.join(", ")}, or "ignore" if a column has no clear contact-field equivalent. Return JSON only.`;

export async function proposeColumnMap(parsed: {
  headers: string[];
  rows: Record<string, string>[];
}): Promise<ColumnMap> {
  const heuristics = heuristicColumnMap(parsed.headers);
  const allMapped = parsed.headers.every((h) => heuristics[h] !== "ignore");
  if (allMapped) return heuristics;

  const samples = parsed.rows.slice(0, 5);
  const prompt = `Headers: ${JSON.stringify(parsed.headers)}\nSample rows: ${JSON.stringify(
    samples
  )}\n\nReturn JSON: { "<header>": "<field|ignore>", ... } using only the allowed fields. No prose.`;

  return askJson<ColumnMap>({
    system: SYSTEM_PROMPT,
    prompt,
    maxTokens: 600,
    fallback: heuristics,
  });
}
