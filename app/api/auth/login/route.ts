import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, verifyPassphrase } from "@/lib/auth/session";

const Body = z.object({ passphrase: z.string().min(1).max(512) });

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!verifyPassphrase(parsed.data.passphrase)) {
    return NextResponse.json({ error: "Incorrect passphrase" }, { status: 401 });
  }

  const session = await getSession();
  session.authenticated = true;
  session.loggedInAt = Date.now();
  await session.save();

  return NextResponse.json({ ok: true });
}
