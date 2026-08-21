import { eq } from "drizzle-orm";
import { syncLog } from "@/lib/db/schema";
import type { AnyDb } from "@/lib/db/types";

/** The kind of run that produced a {@link syncLog} row. */
export type SyncKind = "webhook" | "cron" | "manual" | "import" | "upload";

/** Opens a sync-log row for an in-progress webhook/cron/manual/import/upload run and returns a handle to finish it. */
export async function startSyncLog(
  dbc: AnyDb,
  athleteId: string,
  kind: SyncKind,
): Promise<{
  id: string;
  finish: (status: "ok" | "failed", activitiesProcessed: number, error?: string) => Promise<void>;
}> {
  const [row] = await dbc.insert(syncLog).values({ athleteId, kind }).returning();
  if (!row) throw new Error("failed to create sync log");
  return {
    id: row.id,
    finish: async (status: "ok" | "failed", activitiesProcessed: number, error?: string) => {
      await dbc
        .update(syncLog)
        .set({ status, activitiesProcessed, error: error ?? null, finishedAt: new Date() })
        .where(eq(syncLog.id, row.id));
    },
  };
}
