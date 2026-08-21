import type { AnyDb } from "@/lib/db/types";
import type { StravaClient } from "@/lib/strava/client";
import { importHistory } from "./importHistory";
import type { SyncKind } from "./syncLog";

/** Imports an athlete's activities from the last `days` days (default 30); used by manual re-sync and the cron sweep. */
export function syncRecent(
  dbc: AnyDb,
  athleteId: string,
  client: StravaClient,
  days = 30,
  kind: SyncKind = "manual",
): Promise<{ processed: number }> {
  const after = new Date(Date.now() - days * 86_400_000);
  return importHistory(dbc, athleteId, client, { after, kind, sleep: () => new Promise((r) => setTimeout(r, 250)) });
}
