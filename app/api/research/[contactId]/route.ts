import { NextResponse } from "next/server";
import { getContactById } from "@/lib/contacts/repo";
import { runResearch } from "@/lib/research/pipeline";
import { getLatestBriefing } from "@/lib/research/repo";
import type { ResearchContact } from "@/lib/research/types";

// Live pipeline can take ~30s in non-demo mode (provider + Claude classification).
export const maxDuration = 60;

type RouteContext = { params: Promise<{ contactId: string }> };

function toResearchContact(c: NonNullable<Awaited<ReturnType<typeof getContactById>>>): ResearchContact {
  return {
    id: c.id,
    full_name: c.full_name,
    first_name: c.first_name,
    last_name: c.last_name,
    company: c.company,
    title: c.title,
    industry: c.industry,
    topics: c.topics ?? [],
  };
}

export async function POST(_req: Request, ctx: RouteContext) {
  const { contactId } = await ctx.params;
  const contact = await getContactById(contactId);
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  try {
    const result = await runResearch(toResearchContact(contact));
    return NextResponse.json({
      run: result.run,
      briefing: result.briefing,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Research failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { contactId } = await ctx.params;
  const contact = await getContactById(contactId);
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }
  const latest = await getLatestBriefing(toResearchContact(contact), { fallbackToDemo: false });
  if (!latest) {
    return NextResponse.json({ run: null, briefing: null });
  }
  return NextResponse.json(latest);
}
