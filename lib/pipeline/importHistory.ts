import { sql } from "drizzle-orm";
import { stravaConnections } from "@/lib/db/schema";
import type { AnyDb } from "@/lib/db/types";
import { throttle, type StravaClient } from "@/lib/strava/client";
import { setConnectionFields } from "@/lib/strava/connection";
import { isRun, normaliseStrava } from "@/lib/strava/normalise";
import { processActivity } from "./processActivity";
import { startSyncLog, type SyncKind } from "./syncLog";

/** How many runs one {@link importHistory} invocation will import before handing back to the caller. */
export const DEFAULT_MAX_ACTIVITIES = 25;

/** Options controlling an {@link importHistory} run. */
export interface ImportOptions {
  after?: Date;
  kind?: SyncKind;
  sleep?: () => Promise<void>;
  perPage?: number;
  /** Stop after roughly this many runs so one invocation fits inside a serverless time limit (default 25). */
  maxActivities?: number;
  /** Strava page to resume from, i.e. the persisted `importCursorPage` (default 1). */
  startPage?: number;
}

/** Outcome of one {@link importHistory} invocation: how many runs it imported and whether the athlete's history is fully caught up. */
export interface ImportResult {
  processed: number;
  done: boolean;
}

/**
 * Pages through an athlete's Strava activities (newest first) and imports only runs, stopping once
 * the per-invocation budget is spent so the caller can resume later from `importCursorPage`.
 *
 * The cursor is page-granular, so the budget is checked at page boundaries: a page that has been
 * started is always finished (otherwise a resume would replay the same partial page forever and
 * never advance). `perPage` is therefore capped at the budget.
 */
export async function importHistory(
  dbc: AnyDb,
  athleteId: string,
  client: StravaClient,
  opts: ImportOptions = {},
): Promise<ImportResult> {
  const sleep = opts.sleep ?? (() => throttle(1000));
  const kind = opts.kind ?? "import";
  const isImport = kind === "import";
  const budget = opts.maxActivities ?? DEFAULT_MAX_ACTIVITIES;
  const perPage = Math.min(opts.perPage ?? 50, budget);
  const startPage = opts.startPage ?? 1;

  const log = await startSyncLog(dbc, athleteId, kind);
  if (isImport) {
    await setConnectionFields(dbc, athleteId, {
      importStatus: "running",
      // A fresh full import (rather than a resume) restarts the counters.
      ...(startPage === 1 ? { importedCount: 0, importStartedAt: new Date() } : {}),
    });
  }

  let processed = 0;
  let done = false;
  try {
    for (let page = startPage; ; page++) {
      const summaries = await client.listActivities(page, perPage, opts.after);
      if (summaries.length === 0) {
        done = true;
        break;
      }
      for (const s of summaries) {
        if (!isRun(s)) continue;
        await sleep();
        const detail = await client.getActivity(s.id);
        await sleep();
        const laps = await client.getLaps(s.id);
        await processActivity(dbc, athleteId, normaliseStrava(detail, laps));
        processed++;
        if (isImport) {
          await setConnectionFields(dbc, athleteId, {
            importedCount: sql`${stravaConnections.importedCount} + 1`,
          });
        }
      }
      if (isImport) await setConnectionFields(dbc, athleteId, { importCursorPage: page + 1 });
      if (processed >= budget) break;
      await sleep();
    }
    // A budget-exhausted pass leaves importStatus "running" and the cursor where it got to.
    if (done) {
      await setConnectionFields(dbc, athleteId, {
        lastSyncAt: new Date(),
        ...(isImport ? { importStatus: "done" as const, importCursorPage: 1 } : {}),
      });
    }
    await log.finish("ok", processed);
    return { processed, done };
  } catch (err) {
    if (isImport) await setConnectionFields(dbc, athleteId, { importStatus: "failed" });
    await log.finish("failed", processed, err instanceof Error ? err.message : String(err));
    throw err;
  }
}
