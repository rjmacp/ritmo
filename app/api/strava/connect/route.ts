import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAthlete } from "@/lib/auth";
import { authorizeUrl } from "@/lib/strava/oauth";

/** Starts the Strava OAuth flow: stores a CSRF state cookie and redirects the athlete to Strava's authorize page. */
export async function GET(): Promise<NextResponse> {
  await requireAthlete();
  const state = crypto.randomUUID();
  (await cookies()).set("strava_oauth_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
  return NextResponse.redirect(authorizeUrl(state));
}
