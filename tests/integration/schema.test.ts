import { eq } from "drizzle-orm";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { athletes, activities, laps } from "@/lib/db/schema";
import { createTestDb, type TestDb } from "../helpers/db";

let db: TestDb;
let close: () => Promise<void>;
beforeAll(async () => ({ db, close } = await createTestDb()));
afterAll(() => close());

describe("schema", () => {
  it("stores an athlete, an activity and its laps", async () => {
    const [a] = await db.insert(athletes).values({ email: "athlete@example.com", name: "Ryan" }).returning();
    if (!a) throw new Error("expected inserted athlete");
    const [act] = await db
      .insert(activities)
      .values({
        athleteId: a.id,
        source: "strava",
        stravaId: 123n,
        startedAt: new Date("2026-08-19T17:02:00Z"),
        timezone: "Europe/Lisbon",
        name: "Mafra Corrida",
        type: "tempo",
        distanceM: 7410,
        movingS: 2412,
        elapsedS: 2450,
        avgPaceSPerKm: 325.5,
        avgHr: 158,
        maxHr: 183,
        avgCadence: 172,
        elevationGainM: 71,
        calories: 596,
        rawJson: { id: 123 },
      })
      .returning();
    if (!act) throw new Error("expected inserted activity");
    await db
      .insert(laps)
      .values([{ activityId: act.id, index: 1, distanceM: 1000, movingS: 347, avgHr: 126, elevationGainM: 23 }]);
    const rows = await db.select().from(laps).where(eq(laps.activityId, act.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.movingS).toBe(347);
  });

  it("enforces unique strava_id per athlete", async () => {
    const [a] = await db.select().from(athletes).limit(1);
    if (!a) throw new Error("expected seeded athlete");
    await expect(
      db.insert(activities).values({
        athleteId: a.id,
        source: "strava",
        stravaId: 123n,
        startedAt: new Date(),
        timezone: "UTC",
        name: "dup",
        type: "easy",
        distanceM: 1,
        movingS: 1,
        elapsedS: 1,
        avgPaceSPerKm: 1,
        rawJson: {},
      }),
    ).rejects.toThrow();
  });
});
