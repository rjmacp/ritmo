import { and, eq } from "drizzle-orm";
import { activities, laps, type NewActivity } from "@/lib/db/schema";
import type { AnyDb } from "@/lib/db/types";
import type { NormalisedActivity } from "@/lib/strava/normalise";

/** Stage 2 replaces this with metrics computation. Keep the signature. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
export async function afterUpsert(_dbc: AnyDb, _activityId: string): Promise<void> {}

/** Inserts or updates an activity (and replaces its laps) from a normalised Strava/upload payload, preserving athlete-entered overrides. */
export async function processActivity(
  dbc: AnyDb,
  athleteId: string,
  n: NormalisedActivity,
): Promise<{ activityId: string; created: boolean }> {
  const stravaFields: Omit<NewActivity, "athleteId" | "type" | "rawJson"> = {
    source: n.source,
    stravaId: n.stravaId,
    startedAt: n.startedAt,
    timezone: n.timezone,
    name: n.name,
    distanceM: n.distanceM,
    movingS: n.movingS,
    elapsedS: n.elapsedS,
    avgPaceSPerKm: n.avgPaceSPerKm,
    avgHr: n.avgHr,
    maxHr: n.maxHr,
    avgCadence: n.avgCadence,
    elevationGainM: n.elevationGainM,
    calories: n.calories,
    startLat: n.startLat,
    startLng: n.startLng,
    updatedAt: new Date(),
  };

  const existing =
    n.stravaId == null
      ? []
      : await dbc
          .select({ id: activities.id, typeOverridden: activities.typeOverridden })
          .from(activities)
          .where(and(eq(activities.athleteId, athleteId), eq(activities.stravaId, n.stravaId)))
          .limit(1);

  let activityId: string;
  let created: boolean;
  if (existing[0]) {
    activityId = existing[0].id;
    created = false;
    await dbc
      .update(activities)
      .set({
        ...stravaFields,
        rawJson: n.raw,
        ...(existing[0].typeOverridden ? {} : { type: n.type }),
      })
      .where(eq(activities.id, activityId));
    await dbc.delete(laps).where(eq(laps.activityId, activityId));
  } else {
    const [row] = await dbc
      .insert(activities)
      .values({ ...stravaFields, athleteId, type: n.type, rawJson: n.raw })
      .returning();
    if (!row) throw new Error("failed to insert activity");
    activityId = row.id;
    created = true;
  }

  if (n.laps.length) {
    await dbc.insert(laps).values(n.laps.map((l) => ({ activityId, ...l })));
  }
  await afterUpsert(dbc, activityId);
  return { activityId, created };
}

/** Deletes an athlete's activity (and its laps, via cascade) by its Strava id. */
export async function deleteActivityByStravaId(dbc: AnyDb, athleteId: string, stravaId: bigint): Promise<void> {
  await dbc.delete(activities).where(and(eq(activities.athleteId, athleteId), eq(activities.stravaId, stravaId)));
}
