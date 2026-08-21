import { and, eq, notInArray, sql } from "drizzle-orm";
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

  let activityId: string;
  let created: boolean;
  if (n.stravaId == null) {
    // Upload source: no natural key to conflict on, always insert.
    const [row] = await dbc
      .insert(activities)
      .values({ ...stravaFields, athleteId, type: n.type, rawJson: n.raw })
      .returning();
    if (!row) throw new Error("failed to insert activity");
    activityId = row.id;
    created = true;
  } else {
    // `created` is a display-only flag: it's determined by a pre-check select,
    // so under a true race between two inserts for the same key it may read
    // `true` for both callers. That's cosmetic only — the upsert below is a
    // single atomic statement (ON CONFLICT DO UPDATE), so it never throws a
    // duplicate-key error and never creates two rows for the same key, unlike
    // the select-then-insert this replaces. (`.returning({ id, created })`
    // with a `(xmax = 0)` sql expression doesn't type-check against the
    // AnyDb union — TS falls back to the zero-arg `.returning()` overload
    // common to both drivers — so we can't read `created` off the same
    // statement.)
    const existing = await dbc
      .select({ id: activities.id })
      .from(activities)
      .where(and(eq(activities.athleteId, athleteId), eq(activities.stravaId, n.stravaId)))
      .limit(1);
    created = existing.length === 0;

    // Single upsert on the (athleteId, stravaId) unique index: race-free against
    // concurrent webhook deliveries for the same activity (no select-then-insert gap).
    const [row] = await dbc
      .insert(activities)
      .values({ ...stravaFields, athleteId, type: n.type, rawJson: n.raw })
      .onConflictDoUpdate({
        target: [activities.athleteId, activities.stravaId],
        set: {
          ...stravaFields,
          rawJson: n.raw,
          // keep an athlete-overridden type; otherwise take Strava's inferred type
          type: sql`CASE WHEN ${activities.typeOverridden} THEN ${activities.type} ELSE excluded.type END`,
        },
      })
      .returning();
    if (!row) throw new Error("failed to upsert activity");
    activityId = row.id;
  }

  // Replace laps via upsert-then-prune rather than delete-then-insert: a blind
  // delete+insert isn't safe against a second concurrent call for the same
  // activity (both would race to insert the same (activityId, index) rows and
  // one would hit the unique-index violation). Upserting is idempotent under
  // concurrent identical writes, and the prune step removes any lap indices
  // that no longer exist in the new set (e.g. re-sync with fewer laps).
  if (n.laps.length) {
    await dbc
      .insert(laps)
      .values(n.laps.map((l) => ({ activityId, ...l })))
      .onConflictDoUpdate({
        target: [laps.activityId, laps.index],
        set: {
          distanceM: sql`excluded.distance_m`,
          movingS: sql`excluded.moving_s`,
          avgHr: sql`excluded.avg_hr`,
          maxHr: sql`excluded.max_hr`,
          avgCadence: sql`excluded.avg_cadence`,
          elevationGainM: sql`excluded.elevation_gain_m`,
          elevationLossM: sql`excluded.elevation_loss_m`,
          gapSPerKm: sql`excluded.gap_s_per_km`,
        },
      });
    await dbc.delete(laps).where(
      and(
        eq(laps.activityId, activityId),
        notInArray(
          laps.index,
          n.laps.map((l) => l.index),
        ),
      ),
    );
  } else {
    await dbc.delete(laps).where(eq(laps.activityId, activityId));
  }

  await afterUpsert(dbc, activityId);
  return { activityId, created };
}

/** Deletes an athlete's activity (and its laps, via cascade) by its Strava id. */
export async function deleteActivityByStravaId(dbc: AnyDb, athleteId: string, stravaId: bigint): Promise<void> {
  await dbc.delete(activities).where(and(eq(activities.athleteId, athleteId), eq(activities.stravaId, stravaId)));
}
