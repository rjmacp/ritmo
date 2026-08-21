import { eq } from "drizzle-orm";
import { it, expect, beforeAll, afterAll, describe, vi } from "vitest";
import { ensureAthlete } from "@/lib/db/athlete";
import { activities, stravaConnections, syncLog } from "@/lib/db/schema";
import { continueImport } from "@/lib/pipeline/continueImport";
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
  expect(r).toEqual({ processed: 1, done: true });
  expect(getActivity).toHaveBeenCalledTimes(1);
  expect(await db.select().from(activities).where(eq(activities.athleteId, athleteId))).toHaveLength(1);
  const [conn] = await db.select().from(stravaConnections).where(eq(stravaConnections.athleteId, athleteId));
  expect(conn?.importStatus).toBe("done");
  expect(conn?.importedCount).toBe(1); // the Ride was skipped
  expect(conn?.importCursorPage).toBe(1);
  expect(conn?.importStartedAt).toBeInstanceOf(Date);
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

describe("resumable imports", () => {
  const runSummary = (id: number) => ({ ...page[0], id });
  /** A Strava client stub serving fixed pages of run summaries, keyed by page number. */
  const clientForPages = (pages: Record<number, ReturnType<typeof runSummary>[]>) => {
    const listActivities = vi.fn((p: number) => Promise.resolve(pages[p] ?? []));
    const client = {
      listActivities,
      getActivity: vi.fn((id: number) => Promise.resolve({ ...detail, id })),
      getLaps: vi.fn(() => Promise.resolve(laps)),
    } as unknown as StravaClient;
    return { client, listActivities };
  };

  let id: string;
  beforeAll(async () => {
    id = (await ensureAthlete(db, "resumer@example.com")).id;
    await saveConnection(
      db,
      id,
      { accessToken: "a", refreshToken: "r", expiresAt: new Date(Date.now() + 3600_000) },
      43n,
    );
  });

  it("stops at the budget, persisting the cursor and leaving the import running", async () => {
    const { client } = clientForPages({ 1: [runSummary(101), runSummary(102)], 2: [runSummary(103)] });
    const r = await importHistory(db, id, client, { maxActivities: 2, sleep: () => Promise.resolve() });
    expect(r).toEqual({ processed: 2, done: false });
    const [conn] = await db.select().from(stravaConnections).where(eq(stravaConnections.athleteId, id));
    expect(conn?.importStatus).toBe("running");
    expect(conn?.importCursorPage).toBe(2);
    expect(conn?.importedCount).toBe(2);
    expect(await db.select().from(activities).where(eq(activities.athleteId, id))).toHaveLength(2);
  });

  it("resumes from the cursor on the next call and finishes the pass", async () => {
    const { client, listActivities } = clientForPages({ 1: [runSummary(101), runSummary(102)], 2: [runSummary(103)] });
    const r = await continueImport(db, id, client);
    expect(r).toEqual({ processed: 1, done: true });
    // page 1 is never re-fetched: the resume starts at the persisted cursor
    expect(listActivities).not.toHaveBeenCalledWith(1, expect.anything(), undefined);
    const [conn] = await db.select().from(stravaConnections).where(eq(stravaConnections.athleteId, id));
    expect(conn?.importStatus).toBe("done");
    expect(conn?.importCursorPage).toBe(1);
    expect(conn?.importedCount).toBe(3);
    expect(conn?.lastSyncAt).toBeInstanceOf(Date);
    expect(await db.select().from(activities).where(eq(activities.athleteId, id))).toHaveLength(3);
  });

  it("is a no-op once the import is done", async () => {
    const { client, listActivities } = clientForPages({});
    const r = await continueImport(db, id, client);
    expect(r).toEqual({ processed: 0, done: true });
    expect(listActivities).not.toHaveBeenCalled();
  });

  it("leaves import bookkeeping alone for non-import kinds", async () => {
    await db
      .update(stravaConnections)
      .set({ importStatus: "running", importCursorPage: 7, importedCount: 3 })
      .where(eq(stravaConnections.athleteId, id));
    const { client } = clientForPages({ 1: [runSummary(104)] });
    const r = await importHistory(db, id, client, { kind: "cron", sleep: () => Promise.resolve() });
    expect(r).toEqual({ processed: 1, done: true });
    const [conn] = await db.select().from(stravaConnections).where(eq(stravaConnections.athleteId, id));
    expect(conn?.importStatus).toBe("running");
    expect(conn?.importCursorPage).toBe(7);
    expect(conn?.importedCount).toBe(3);
  });
});
