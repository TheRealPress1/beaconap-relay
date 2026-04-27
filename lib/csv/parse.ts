import "server-only";
import Papa from "papaparse";

export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
};

export function parseCsv(text: string): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
    dynamicTyping: false,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`CSV parse failed: ${result.errors[0].message}`);
  }

  const headers = result.meta.fields ?? [];
  const rows = result.data.map((row) => {
    const cleaned: Record<string, string> = {};
    for (const key of headers) {
      const value = row[key];
      cleaned[key] = (value ?? "").toString().trim();
    }
    return cleaned;
  });
  return { headers, rows };
}
