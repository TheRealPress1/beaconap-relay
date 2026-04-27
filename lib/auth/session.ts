import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export const SESSION_COOKIE = "beaconap_session";

export type SessionData = {
  authenticated?: true;
  loggedInAt?: number;
};

function getSessionOptions(): SessionOptions {
  const password = process.env.BEACONAP_SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error(
      "BEACONAP_SESSION_SECRET must be set to a string of at least 32 characters."
    );
  }
  return {
    cookieName: SESSION_COOKIE,
    password,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await getSession();
    return session.authenticated === true;
  } catch {
    return false;
  }
}

export function verifyPassphrase(provided: string): boolean {
  const expected = process.env.BEACONAP_PASSPHRASE;
  if (!expected) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  // crypto.timingSafeEqual via length-padded comparison
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a[i] ^ b[i];
  }
  return mismatch === 0;
}
