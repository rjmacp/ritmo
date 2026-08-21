import { NextResponse } from "next/server";
import { requireAthlete } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { clientForAthlete, deleteConnection } from "@/lib/strava/connection";

/** Revokes Ritmo's Strava authorization (best-effort) and deletes the athlete's stored connection. */
export async function POST(): Promise<NextResponse> {
  const athlete = await requireAthlete();
  const client = await clientForAthlete(db, athlete.id);
  if (client) await client.deauthorize().catch(() => undefined);
  await deleteConnection(db, athlete.id);
  return NextResponse.redirect(`${env.APP_URL}/account`, { status: 303 });
}
