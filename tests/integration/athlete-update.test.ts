import { it, expect, beforeAll, afterAll } from "vitest";
import { ensureAthlete, setMaxHr } from "@/lib/db/athlete";
import { recentSyncLogs } from "@/lib/db/syncLogQueries";
import { startSyncLog } from "@/lib/pipeline/syncLog";
import { createTestDb, type TestDb } from "../helpers/db";

let db: TestDb;
let close: () => Promise<void>;
beforeAll(async () => ({ db, close } = await createTestDb()));
afterAll(() => close());

it("updates max HR and lists recent sync logs newest first", async () => {
  const a = await ensureAthlete(db, "athlete@example.com");
  await setMaxHr(db, a.id, 196);
  expect((await ensureAthlete(db, a.email)).maxHr).toBe(196);
  const l1 = await startSyncLog(db, a.id, "manual");
  await l1.finish("ok", 2);
  const l2 = await startSyncLog(db, a.id, "cron");
  await l2.finish("failed", 0, "429");
  const logs = await recentSyncLogs(db, a.id, 10);
  expect(logs.map((l) => l.kind)).toEqual(["cron", "manual"]);
  expect(logs[0]?.error).toBe("429");
});
