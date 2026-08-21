import { desc, eq } from "drizzle-orm";
import { syncLog, type SyncLog } from "@/lib/db/schema";
import type { AnyDb } from "@/lib/db/types";

/** Fetches an athlete's most recent sync-log rows, newest first. */
export function recentSyncLogs(dbc: AnyDb, athleteId: string, n = 10): Promise<SyncLog[]> {
  return dbc.select().from(syncLog).where(eq(syncLog.athleteId, athleteId)).orderBy(desc(syncLog.startedAt)).limit(n);
}
