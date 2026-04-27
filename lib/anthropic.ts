import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

export function isDemoMode(): boolean {
  return (
    process.env.ANTHROPIC_DEMO_MODE === "true" ||
    !process.env.ANTHROPIC_API_KEY
  );
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

type AskJsonOptions<T> = {
  system: string;
  prompt: string;
  maxTokens?: number;
  fallback: T;
};

/**
 * Sends a prompt that must return a single JSON object. Falls back to the
 * provided value when ANTHROPIC_DEMO_MODE is on or the key is missing, so the
 * student team can build without burning credit.
 */
export async function askJson<T>(opts: AskJsonOptions<T>): Promise<T> {
  if (isDemoMode()) return opts.fallback;

  const response = await getClient().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const fenced = text.match(/```(?:json)?\s*([\s\S]+?)```/);
  const candidate = (fenced?.[1] ?? text).trim();

  try {
    return JSON.parse(candidate) as T;
  } catch (err) {
    console.error("[anthropic] JSON parse failed; returning fallback.", err);
    return opts.fallback;
  }
}
