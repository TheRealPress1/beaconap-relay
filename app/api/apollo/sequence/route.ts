import { NextResponse } from "next/server";
import { z } from "zod";
import { pushDraftToApolloSequenceAction } from "@/app/actions/apollo";

export const maxDuration = 60;

const Body = z.object({
  draftId: z.string().min(1),
  sequenceId: z.string().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const result = await pushDraftToApolloSequenceAction(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Apollo sequence push failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
