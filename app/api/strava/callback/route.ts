import { cookies } from "next/headers";
import { NextResponse, after } from "next/server";
import { requireAthlete } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { importHistory } from "@/lib/pipeline/importHistory";
import { exchangeCode } from "@/lib/strava/client";
import { saveConnection, clientForAthlete } from "@/lib/strava/connection";

/** Completes the Strava OAuth flow: validates state/scope, stores tokens, and kicks off a background history import. */
export async function GET(req: Request): Promise<NextResponse> {
  const athlete = await requireAthlete();
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const scope = url.searchParams.get("scope") ?? "";
  const jar = await cookies();
  const expected = jar.get("strava_oauth_state")?.value;
  jar.delete("strava_oauth_state");

  if (!code || !state || state !== expected) return NextResponse.redirect(`${env.APP_URL}/account?error=state`);
  if (!scope.includes("activity:read_all")) return NextResponse.redirect(`${env.APP_URL}/account?error=scope`);

  try {
    const { tokens, stravaAthleteId } = await exchangeCode(code);
    await saveConnection(db, athlete.id, tokens, stravaAthleteId);
  } catch (e: unknown) {
    log.error("strava token exchange failed", e);
    return NextResponse.redirect(`${env.APP_URL}/account?error=auth`);
  }

  after(async () => {
    try {
      const client = await clientForAthlete(db, athlete.id);
      if (client) await importHistory(db, athlete.id, client);
    } catch (e: unknown) {
      log.error("import failed", e);
    }
  });
  return NextResponse.redirect(`${env.APP_URL}/account?import=started`);
}
