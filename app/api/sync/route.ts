import { NextResponse, after } from "next/server";
import { requireAthlete } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { syncRecent } from "@/lib/pipeline/syncRecent";
import { clientForAthlete } from "@/lib/strava/connection";

/** Manually re-syncs the signed-in athlete's last 30 days of Strava activity in the background. */
export async function POST(): Promise<NextResponse> {
  const athlete = await requireAthlete();
  const client = await clientForAthlete(db, athlete.id);
  if (!client) return NextResponse.redirect(`${env.APP_URL}/account?error=notconnected`, { status: 303 });
  // The redirect goes out immediately: a 30-day sync is minutes of throttled Strava
  // calls, far longer than a browser (or the function ceiling) will wait for.
  after(async () => {
    try {
      await syncRecent(db, athlete.id, client, 30, "manual");
    } catch (e: unknown) {
      log.error("manual sync failed", e);
    }
  });
  return NextResponse.redirect(`${env.APP_URL}/account?sync=started`, { status: 303 });
}
