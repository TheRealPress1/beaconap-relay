import { NextResponse } from "next/server";
import { syncGranolaAction } from "@/app/actions/granola";

export const maxDuration = 60;

export async function POST() {
  try {
    const result = await syncGranolaAction();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Granola sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
