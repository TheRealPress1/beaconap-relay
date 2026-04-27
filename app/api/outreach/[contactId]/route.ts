import { NextResponse } from "next/server";
import { z } from "zod";
import { draftOutreachAction } from "@/app/actions/outreach";
import { getLatestDraftForContact } from "@/lib/outreach/repo";

export const maxDuration = 60;

const Body = z.object({
  tone: z.enum(["warm", "professional", "curious", "provocative"]).default("warm"),
  runId: z.string().uuid().optional(),
});

type RouteContext = { params: Promise<{ contactId: string }> };

export async function POST(req: Request, ctx: RouteContext) {
  const { contactId } = await ctx.params;
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const draft = await draftOutreachAction({
      contactId,
      tone: parsed.data.tone,
      runId: parsed.data.runId,
    });
    return NextResponse.json({ draft });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Draft failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { contactId } = await ctx.params;
  const draft = await getLatestDraftForContact(contactId);
  return NextResponse.json({ draft });
}
