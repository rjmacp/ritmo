import { eq } from "drizzle-orm";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ensureAthlete } from "@/lib/db/athlete";
import { activities, laps } from "@/lib/db/schema";
import { processActivity, deleteActivityByStravaId } from "@/lib/pipeline/processActivity";
import { normaliseStrava } from "@/lib/strava/normalise";
import type { StravaDetailedActivity } from "@/lib/strava/types";
import detail from "../fixtures/strava/activity-19aug.json";
import lapsFx from "../fixtures/strava/laps-19aug.json";
import { createTestDb, type TestDb } from "../helpers/db";

const detailTyped = detail as StravaDetailedActivity;

let db: TestDb;
let close: () => Promise<void>;
let athleteId: string;
beforeAll(async () => {
  ({ db, close } = await createTestDb());
  athleteId = (await ensureAthlete(db, "athlete@example.com")).id;
});
afterAll(() => close());

describe("processActivity", () => {
  it("inserts an activity with its laps", async () => {
    const r = await processActivity(db, athleteId, normaliseStrava(detailTyped, lapsFx));
    expect(r.created).toBe(true);
    const rows = await db.select().from(laps).where(eq(laps.activityId, r.activityId));
    expect(rows).toHaveLength(8);
  });

  it("is idempotent and replaces laps on re-sync", async () => {
    const r = await processActivity(
      db,
      athleteId,
      normaliseStrava({ ...detailTyped, name: "Renamed" }, lapsFx.slice(0, 7)),
    );
    expect(r.created).toBe(false);
    const [a] = await db.select().from(activities).where(eq(activities.id, r.activityId));
    expect(a!.name).toBe("Renamed");
    expect(await db.select().from(laps).where(eq(laps.activityId, r.activityId))).toHaveLength(7);
  });

  it("does not overwrite athlete-entered type, notes or training effect", async () => {
    const [a] = await db.select().from(activities).where(eq(activities.athleteId, athleteId));
    await db
      .update(activities)
      .set({ type: "race", typeOverridden: true, notes: "felt great", trainingEffectAerobic: 3.7 })
      .where(eq(activities.id, a!.id));
    await processActivity(db, athleteId, normaliseStrava(detailTyped, lapsFx));
    const [after] = await db.select().from(activities).where(eq(activities.id, a!.id));
    expect(after!.type).toBe("race");
    expect(after!.notes).toBe("felt great");
    expect(after!.trainingEffectAerobic).toBe(3.7);
  });

  it("is race-free when two concurrent upserts create the same activity", async () => {
    const newStravaId = 15000000099n;
    const n = normaliseStrava({ ...detailTyped, id: Number(newStravaId) }, lapsFx);
    const [r1, r2] = await Promise.all([processActivity(db, athleteId, n), processActivity(db, athleteId, n)]);
    expect(r1.activityId).toBe(r2.activityId);
    const rows = await db.select().from(activities).where(eq(activities.stravaId, newStravaId));
    expect(rows).toHaveLength(1);
    expect(await db.select().from(laps).where(eq(laps.activityId, r1.activityId))).toHaveLength(8);
    await deleteActivityByStravaId(db, athleteId, newStravaId);
  });

  it("rolls back the lap changes when afterUpsert fails", async () => {
    const r = await processActivity(db, athleteId, normaliseStrava(detailTyped, lapsFx));
    const before = await db.select().from(laps).where(eq(laps.activityId, r.activityId));
    expect(before).toHaveLength(8);
    await expect(
      processActivity(db, athleteId, normaliseStrava({ ...detailTyped, name: "Rolled back" }, lapsFx.slice(0, 3)), {
        afterUpsert: () => Promise.reject(new Error("metrics blew up")),
      }),
    ).rejects.toThrow("metrics blew up");
    expect(await db.select().from(laps).where(eq(laps.activityId, r.activityId))).toHaveLength(8);
    const [a] = await db.select().from(activities).where(eq(activities.id, r.activityId));
    expect(a!.name).not.toBe("Rolled back");
  });

  it("deletes by strava id", async () => {
    await deleteActivityByStravaId(db, athleteId, 15000000019n);
    expect(await db.select().from(activities).where(eq(activities.athleteId, athleteId))).toHaveLength(0);
  });
});
