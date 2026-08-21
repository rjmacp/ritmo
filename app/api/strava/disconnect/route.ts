import { NextResponse } from "next/server";
import { requireAthlete } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { clientForAthlete, deleteConnection } from "@/lib/strava/connection";

/** Revokes Ritmo's Strava authorization (best-effort) and deletes the athlete's stored connection. */
export async function POST(): Promise<NextResponse> {
  const athlete = await requireAthlete();
  const client = await clientForAthlete(db, athlete.id);
  let revoked = true;
  if (client) {
    // Disconnecting locally must always succeed — a Strava outage or an already-dead
    // token cannot be allowed to strand the athlete in a connected state.
    revoked = await client.deauthorize().then(
      () => true,
      (e: unknown) => {
        log.error("strava deauthorize failed", e, { athleteId: athlete.id });
        return false;
      },
    );
  }
  await deleteConnection(db, athlete.id);
  return NextResponse.redirect(`${env.APP_URL}/account${revoked ? "" : "?warn=revoke"}`, { status: 303 });
}
