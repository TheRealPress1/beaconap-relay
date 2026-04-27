import type { BriefingPayload, ResearchContact } from "./types";

/**
 * Canned briefings used when RESEARCH_DEMO_MODE=true so the team can demo
 * without paying for Tavily/Exa or Anthropic. The shape mirrors the live
 * pipeline's output exactly.
 */
export function demoBriefing(contact: ResearchContact): BriefingPayload {
  const company = contact.company ?? "their firm";
  const title = contact.title ?? "their role";
  const first = contact.first_name;
  const industry = contact.industry ?? "their sector";

  return {
    talking_points: [
      `${first} just spoke on a Bloomberg podcast about how AI is reshaping ${industry.toLowerCase()} due diligence — leads naturally into your work on agentic outreach.`,
      `${company} announced a leadership reshuffle that puts ${first} on the strategy committee — congratulate and ask what's now in scope.`,
      `Their recent FT op-ed pushed back on the consensus view in ${industry} — referenceable as a thoughtful contrarian take.`,
    ],
    findings: [
      {
        kind: "podcast",
        title: `Odd Lots: How ${company} thinks about AI in ${industry}`,
        url: "https://www.bloomberg.com/news/audio/odd-lots-demo",
        source: "Bloomberg Odd Lots",
        published_at: daysAgo(11),
        summary: `${first} discusses how ${company} is operationalizing LLMs across the deal team and what that means for ${industry.toLowerCase()} workflows.`,
        talking_points: [
          `Open with their model-risk framing — they emphasized human-in-the-loop guardrails for any external-facing AI.`,
          `Ask whether the framework they described scales beyond ${industry.toLowerCase()} into adjacent verticals.`,
        ],
        raw_excerpt: `"We don't deploy any model that the partners can't trace back to its inputs in under thirty seconds." — ${first} ${contact.last_name ?? ""}`.trim(),
        relevance_score: 0.94,
      },
      {
        kind: "article",
        title: `${company} hires from ${pickPeer(industry)} for new AI strategy lead`,
        url: "https://www.ft.com/content/demo-ai-strategy",
        source: "Financial Times",
        published_at: daysAgo(4),
        summary: `${company} is doubling down on its AI bench, signalling appetite for the kind of capability ${first}'s team has been pushing internally.`,
        talking_points: [
          `Mention the hire by name and ask if ${first}'s mandate now spans portfolio AI tooling.`,
        ],
        raw_excerpt: null,
        relevance_score: 0.86,
      },
      {
        kind: "interview",
        title: `${first} ${contact.last_name ?? ""}: "${industry} is in its first honest year of LLM ROI"`,
        url: "https://www.institutionalinvestor.com/article/demo-interview",
        source: "Institutional Investor",
        published_at: daysAgo(28),
        summary: `Long-form Q&A where ${first} pushes back on hype and details which AI experiments at ${company} actually moved the P&L.`,
        talking_points: [
          `Reference the "ROI honesty" framing — fits your value-prop narrative around measurable outcomes.`,
        ],
        raw_excerpt: null,
        relevance_score: 0.81,
      },
      {
        kind: "linkedin_post",
        title: `${first}'s post on ${pickTopic(contact.topics)} (167 reactions)`,
        url: `https://www.linkedin.com/posts/${slugifyName(first, contact.last_name)}-demo`,
        source: "LinkedIn",
        published_at: daysAgo(2),
        summary: `${first} shared a take on ${pickTopic(contact.topics).toLowerCase()} that's currently getting traction with ${industry.toLowerCase()} peers.`,
        talking_points: [
          `Drop a thoughtful reply on the post itself before reaching out — keeps the touch warm but visible.`,
        ],
        raw_excerpt: `"The thing nobody is admitting in ${industry.toLowerCase()} right now is that we're still pricing risk like it's 2019."`,
        relevance_score: 0.88,
      },
      {
        kind: "article",
        title: `Why ${title.toLowerCase()}s like ${first} are rethinking ${industry.toLowerCase()} due diligence`,
        url: "https://www.bloomberg.com/news/articles/demo-due-diligence",
        source: "Bloomberg",
        published_at: daysAgo(19),
        summary: `Industry overview piece quoting ${first} alongside three peers on how the workflow is being rebuilt around AI co-pilots.`,
        talking_points: [
          `Useful as a sanity check — they're publicly aligned with the stack you're proposing.`,
        ],
        raw_excerpt: null,
        relevance_score: 0.74,
      },
    ],
  };
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

function pickPeer(industry: string): string {
  const peers: Record<string, string> = {
    "asset management": "BlackRock",
    "private credit": "Apollo",
    "private equity": "KKR",
    "hedge funds": "Citadel",
    "market making": "Jane Street",
  };
  return peers[industry.toLowerCase()] ?? "a top-tier peer";
}

function pickTopic(topics: string[]): string {
  return topics[0] ?? "AI in Finance";
}

function slugifyName(first: string, last: string | null): string {
  return `${first}-${last ?? ""}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
