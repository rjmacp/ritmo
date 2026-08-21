import type { AnyDb } from "@/lib/db/types";
import type { StravaClient } from "@/lib/strava/client";
import { getConnection } from "@/lib/strava/connection";
import { importHistory, type ImportResult } from "./importHistory";

/** Resumes a history import that is still `running`, picking up at the persisted cursor page; a no-op for any other status. */
export async function continueImport(dbc: AnyDb, athleteId: string, client: StravaClient): Promise<ImportResult> {
  const conn = await getConnection(dbc, athleteId);
  if (conn?.importStatus !== "running") return { processed: 0, done: true };
  return importHistory(dbc, athleteId, client, { kind: "import", startPage: conn.importCursorPage });
}
