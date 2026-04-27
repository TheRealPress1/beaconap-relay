import { NextResponse } from "next/server";
import { enrichContactAction } from "@/app/actions/apollo";

export const maxDuration = 60;

type RouteContext = { params: Promise<{ contactId: string }> };

export async function POST(_req: Request, ctx: RouteContext) {
  const { contactId } = await ctx.params;
  try {
    const result = await enrichContactAction(contactId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Apollo enrich failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
