import { eq, sql } from "drizzle-orm";
import { stravaConnections } from "@/lib/db/schema";
import type { AnyDb } from "@/lib/db/types";
import { throttle, type StravaClient } from "@/lib/strava/client";
import { isRun, normaliseStrava } from "@/lib/strava/normalise";
import { processActivity } from "./processActivity";
import { startSyncLog, type SyncKind } from "./syncLog";

/** Options controlling an {@link importHistory} run. */
export interface ImportOptions {
  after?: Date;
  kind?: SyncKind;
  sleep?: () => Promise<void>;
  perPage?: number;
}

/** Pages through an athlete's Strava activities (newest first), imports only runs, and tracks progress/status on `strava_connections` and `sync_log`. */
export async function importHistory(
  dbc: AnyDb,
  athleteId: string,
  client: StravaClient,
  opts: ImportOptions = {},
): Promise<{ processed: number }> {
  const sleep = opts.sleep ?? (() => throttle(1000));
  const log = await startSyncLog(dbc, athleteId, opts.kind ?? "import");
  await dbc
    .update(stravaConnections)
    .set({ importStatus: "running" })
    .where(eq(stravaConnections.athleteId, athleteId));
  let processed = 0;
  try {
    for (let page = 1; ; page++) {
      const summaries = await client.listActivities(page, opts.perPage ?? 50, opts.after);
      if (summaries.length === 0) break;
      for (const s of summaries) {
        if (!isRun(s)) continue;
        await sleep();
        const detail = await client.getActivity(s.id);
        await sleep();
        const laps = await client.getLaps(s.id);
        await processActivity(dbc, athleteId, normaliseStrava(detail, laps));
        processed++;
        await dbc
          .update(stravaConnections)
          .set({ importedCount: sql`${stravaConnections.importedCount} + 1` })
          .where(eq(stravaConnections.athleteId, athleteId));
      }
      await sleep();
    }
    await dbc
      .update(stravaConnections)
      .set({ importStatus: "done", lastSyncAt: new Date() })
      .where(eq(stravaConnections.athleteId, athleteId));
    await log.finish("ok", processed);
    return { processed };
  } catch (err) {
    await dbc
      .update(stravaConnections)
      .set({ importStatus: "failed" })
      .where(eq(stravaConnections.athleteId, athleteId));
    await log.finish("failed", processed, err instanceof Error ? err.message : String(err));
    throw err;
  }
}
