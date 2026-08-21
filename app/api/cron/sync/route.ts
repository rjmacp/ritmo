import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { stravaConnections } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { syncRecent } from "@/lib/pipeline/syncRecent";
import { clientForAthlete } from "@/lib/strava/connection";

export const maxDuration = 300;

/** Nightly cron sweep: re-syncs the last 30 days of Strava activity for every connected athlete. Requires the cron bearer secret. */
export async function GET(req: Request): Promise<NextResponse> {
  if (req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`)
    return new NextResponse("unauthorized", { status: 401 });
  const conns = await db.select({ athleteId: stravaConnections.athleteId }).from(stravaConnections);
  const results: Record<string, number | string> = {};
  for (const { athleteId } of conns) {
    const client = await clientForAthlete(db, athleteId);
    if (!client) continue;
    try {
      results[athleteId] = (await syncRecent(db, athleteId, client, 30, "cron")).processed;
    } catch (e) {
      results[athleteId] = e instanceof Error ? e.message : "failed";
    }
  }
  return NextResponse.json({ ok: true, results });
}
