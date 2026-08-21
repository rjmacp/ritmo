import { eq } from "drizzle-orm";
import { it, expect, beforeAll, afterAll, vi } from "vitest";
import { ensureAthlete } from "@/lib/db/athlete";
import { activities, stravaConnections, syncLog } from "@/lib/db/schema";
import { importHistory } from "@/lib/pipeline/importHistory";
import type { StravaClient } from "@/lib/strava/client";
import { saveConnection } from "@/lib/strava/connection";
import detail from "../fixtures/strava/activity-19aug.json";
import page from "../fixtures/strava/athlete-activities-page.json";
import laps from "../fixtures/strava/laps-19aug.json";
import { createTestDb, type TestDb } from "../helpers/db";

let db: TestDb;
let close: () => Promise<void>;
let athleteId: string;
beforeAll(async () => {
  ({ db, close } = await createTestDb());
  athleteId = (await ensureAthlete(db, "athlete@example.com")).id;
  await saveConnection(
    db,
    athleteId,
    { accessToken: "a", refreshToken: "r", expiresAt: new Date(Date.now() + 3600_000) },
    42n,
  );
});
afterAll(() => close());

it("pages through activities, imports only runs, and records progress", async () => {
  const getActivity = vi.fn(() => Promise.resolve(detail));
  const client = {
    listActivities: vi.fn((p: number) => Promise.resolve(p === 1 ? page : [])),
    getActivity,
    getLaps: vi.fn(() => Promise.resolve(laps)),
  } as unknown as StravaClient;

  const r = await importHistory(db, athleteId, client, { sleep: () => Promise.resolve() });
  expect(r.processed).toBe(1); // the Ride was skipped
  expect(getActivity).toHaveBeenCalledTimes(1);
  expect(await db.select().from(activities).where(eq(activities.athleteId, athleteId))).toHaveLength(1);
  const [conn] = await db.select().from(stravaConnections).where(eq(stravaConnections.athleteId, athleteId));
  expect(conn?.importStatus).toBe("done");
  expect(conn?.importedCount).toBe(1);
  const logs = await db.select().from(syncLog).where(eq(syncLog.athleteId, athleteId));
  expect(logs[0]).toMatchObject({ kind: "import", status: "ok", activitiesProcessed: 1 });
});

it("marks the import failed and logs the error when Strava throws", async () => {
  const client = {
    listActivities: vi.fn(() => Promise.reject(new Error("boom"))),
  } as unknown as StravaClient;
  await expect(importHistory(db, athleteId, client, { sleep: () => Promise.resolve() })).rejects.toThrow("boom");
  const [conn] = await db.select().from(stravaConnections).where(eq(stravaConnections.athleteId, athleteId));
  expect(conn?.importStatus).toBe("failed");
});
