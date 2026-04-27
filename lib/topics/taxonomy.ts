import "server-only";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/contacts/repo";

export type TopicEntry = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  archived_at: string | null;
  contact_count: number;
};

const SEED: Array<Omit<TopicEntry, "id" | "archived_at" | "contact_count">> = [
  { slug: "asset-management", label: "Asset Management", description: "Mutual funds, ETFs, SMAs, institutional asset managers." },
  { slug: "private-credit", label: "Private Credit", description: "Direct lending, mezzanine, distressed debt, BDCs." },
  { slug: "private-equity", label: "Private Equity", description: "Buyouts, growth equity, secondaries." },
  { slug: "hedge-funds", label: "Hedge Funds", description: "Long/short equity, multi-strategy, global macro." },
  { slug: "m-and-a", label: "M&A", description: "Mergers, acquisitions, strategic transactions." },
  { slug: "ipo-markets", label: "IPO Markets", description: "Equity capital markets, public offerings, listings." },
  { slug: "multi-asset", label: "Multi-Asset", description: "Allocation across equities, fixed income, alternatives." },
  { slug: "macro-rates", label: "Macro & Rates", description: "Interest rates, central bank policy, FX, sovereign credit." },
  { slug: "risk-compliance", label: "Risk & Compliance", description: "Model risk, regulatory exams, governance, audit." },
  { slug: "ai-in-finance", label: "AI in Finance", description: "Models, LLMs, agentic systems applied to investing & operations." },
  { slug: "esg", label: "ESG", description: "Sustainable investing, climate, social, governance." },
  { slug: "crypto-digital", label: "Crypto / Digital", description: "Digital assets, stablecoins, tokenization, DeFi." },
  { slug: "trading-tech", label: "Trading Tech", description: "Execution, market microstructure, low-latency systems." },
  { slug: "market-making", label: "Market Making", description: "Liquidity provision in equities, options, fixed income." },
];

export const SEED_TAXONOMY: TopicEntry[] = SEED.map((t, i) => ({
  ...t,
  id: `seed-${i}`,
  archived_at: null,
  contact_count: 0,
}));

export async function listTopics({ includeArchived = false } = {}): Promise<TopicEntry[]> {
  if (!isSupabaseConfigured()) return SEED_TAXONOMY;

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("topic_usage")
    .select("*")
    .order("contact_count", { ascending: false })
    .order("label", { ascending: true });

  if (error) {
    console.error("[topics] listTopics failed:", error.message);
    return SEED_TAXONOMY;
  }
  const rows = (data ?? []) as TopicEntry[];
  return includeArchived ? rows : rows.filter((r) => !r.archived_at);
}

export async function activeTopicLabels(): Promise<string[]> {
  const topics = await listTopics();
  return topics.filter((t) => !t.archived_at).map((t) => t.label);
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function addTopic({ label, description }: { label: string; description?: string }) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set the env vars in .env.local first.");
  }
  const supabase = await createServiceClient();
  const slug = slugify(label);
  const { error } = await supabase
    .from("topics_taxonomy")
    .insert({ slug, label, description: description ?? null });
  if (error) throw new Error(`Add topic failed: ${error.message}`);
  revalidatePath("/settings/taxonomy");
  revalidatePath("/contacts/by-topic");
}

export async function archiveTopic(id: string, archive: boolean) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("topics_taxonomy")
    .update({ archived_at: archive ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw new Error(`Archive topic failed: ${error.message}`);
  revalidatePath("/settings/taxonomy");
  revalidatePath("/contacts/by-topic");
}

export async function renameTopic(id: string, label: string, description?: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("topics_taxonomy")
    .update({ label, description: description ?? null })
    .eq("id", id);
  if (error) throw new Error(`Rename topic failed: ${error.message}`);
  revalidatePath("/settings/taxonomy");
}
