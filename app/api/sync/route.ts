import { NextResponse } from "next/server";
import { requireAthlete } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { syncRecent } from "@/lib/pipeline/syncRecent";
import { clientForAthlete } from "@/lib/strava/connection";

export const maxDuration = 60;

/** Manually re-syncs the signed-in athlete's last 30 days of Strava activity and redirects to the runs list. */
export async function POST(): Promise<NextResponse> {
  const athlete = await requireAthlete();
  const client = await clientForAthlete(db, athlete.id);
  if (!client) return NextResponse.redirect(`${env.APP_URL}/account?error=notconnected`, { status: 303 });
  const r = await syncRecent(db, athlete.id, client, 30, "manual");
  return NextResponse.redirect(`${env.APP_URL}/runs?synced=${r.processed}`, { status: 303 });
}
