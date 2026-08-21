import { it, expect, beforeAll, afterAll } from "vitest";
import { listActivities, getActivity, monthSummary } from "@/lib/db/activities";
import { ensureAthlete } from "@/lib/db/athlete";
import { processActivity } from "@/lib/pipeline/processActivity";
import { normaliseStrava } from "@/lib/strava/normalise";
import type { StravaDetailedActivity } from "@/lib/strava/types";
import detail from "../fixtures/strava/activity-19aug.json";
import laps from "../fixtures/strava/laps-19aug.json";
import { createTestDb, type TestDb } from "../helpers/db";

let db: TestDb;
let close: () => Promise<void>;
let athleteId: string;
beforeAll(async () => {
  ({ db, close } = await createTestDb());
  athleteId = (await ensureAthlete(db, "athlete@example.com")).id;
  await processActivity(db, athleteId, normaliseStrava(detail as StravaDetailedActivity, laps));
  await processActivity(
    db,
    athleteId,
    normaliseStrava(
      {
        ...(detail as StravaDetailedActivity),
        id: 2,
        start_date: "2026-08-17T08:12:00Z",
        distance: 6500,
        moving_time: 2392,
        workout_type: null,
        average_heartrate: 144,
      },
      [],
    ),
  );
});
afterAll(() => close());

it("lists newest first with laps and filters by type", async () => {
  const all = await listActivities(db, athleteId, {});
  expect(all.map((a) => a.name)).toHaveLength(2);
  expect(all[0]!.startedAt > all[1]!.startedAt).toBe(true);
  expect(all[0]!.laps).toHaveLength(8);
  expect(await listActivities(db, athleteId, { type: "easy" })).toHaveLength(1);
});
it("gets one by id scoped to athlete", async () => {
  const [a] = await listActivities(db, athleteId, {});
  expect((await getActivity(db, athleteId, a!.id))?.id).toBe(a!.id);
  expect(await getActivity(db, "00000000-0000-0000-0000-000000000000", a!.id)).toBeNull();
});
it("summarises a month", async () => {
  expect(await monthSummary(db, athleteId, 2026, 8)).toEqual({ km: 13.9, runs: 2 });
});
