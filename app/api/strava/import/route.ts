import { NextResponse, after } from "next/server";
import { requireAthlete } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { continueImport } from "@/lib/pipeline/continueImport";
import { clientForAthlete } from "@/lib/strava/connection";

/** Vercel Hobby caps serverless functions at 60 s; the import budget is sized to fit inside it. */
export const maxDuration = 60;

/** "Continue now" on the Account page: resumes a paused history import in the background and returns to Account. */
export async function POST(): Promise<NextResponse> {
  const athlete = await requireAthlete();
  after(async () => {
    try {
      const client = await clientForAthlete(db, athlete.id);
      if (client) await continueImport(db, athlete.id, client);
    } catch (e: unknown) {
      log.error("import resume failed", e);
    }
  });
  return NextResponse.redirect(`${env.APP_URL}/account?import=started`, { status: 303 });
}
