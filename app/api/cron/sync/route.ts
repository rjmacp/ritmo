import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { stravaConnections } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { continueImport } from "@/lib/pipeline/continueImport";
import { startSyncLog } from "@/lib/pipeline/syncLog";
import { syncRecent } from "@/lib/pipeline/syncRecent";
import { safeEqual } from "@/lib/security";
import { clientForAthlete, setConnectionFields } from "@/lib/strava/connection";

/** Vercel Hobby caps serverless functions at 60 s; the import budget is sized to fit inside it. */
export const maxDuration = 60;

/** An import still `running` this long after it started is treated as stalled and marked failed. */
const STALL_MS = 24 * 60 * 60 * 1000;

/** Nightly cron sweep: fails stalled imports, resumes unfinished ones, then re-syncs the last 30 days for every connected athlete. Requires the cron bearer secret. */
export async function GET(req: Request): Promise<NextResponse> {
  if (!safeEqual(req.headers.get("authorization") ?? "", `Bearer ${env.CRON_SECRET}`))
    return new NextResponse("unauthorized", { status: 401 });
  const conns = await db.select().from(stravaConnections);
  const results: Record<string, number | string> = {};
  for (const conn of conns) {
    const { athleteId } = conn;
    const stalled =
      conn.importStatus === "running" &&
      conn.importStartedAt != null &&
      Date.now() - conn.importStartedAt.getTime() > STALL_MS;
    if (stalled) {
      await setConnectionFields(db, athleteId, { importStatus: "failed" });
      const log = await startSyncLog(db, athleteId, "import");
      await log.finish("failed", conn.importedCount, "import stalled");
      results[athleteId] = "import stalled";
      continue;
    }
    const client = await clientForAthlete(db, athleteId);
    if (!client) continue;
    try {
      const resumed = await continueImport(db, athleteId, client);
      results[athleteId] = resumed.processed + (await syncRecent(db, athleteId, client, 30, "cron")).processed;
    } catch (e) {
      results[athleteId] = e instanceof Error ? e.message : "failed";
    }
  }
  return NextResponse.json({ ok: true, results });
}
