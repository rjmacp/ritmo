import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import type { AnyDb } from "@/lib/db/types";
import { activities, laps, type Activity, type ActivityType, type Lap } from "./schema";

/** An activity row joined with its laps, ordered by lap index. */
export type ActivityWithLaps = Activity & { laps: Lap[] };

/** Lists an athlete's activities newest-first (optionally filtered by type/before, capped by limit), each with its laps. */
export async function listActivities(
  dbc: AnyDb,
  athleteId: string,
  o: { type?: ActivityType; limit?: number; before?: Date },
): Promise<ActivityWithLaps[]> {
  const conds = [eq(activities.athleteId, athleteId)];
  if (o.type) conds.push(eq(activities.type, o.type));
  if (o.before) conds.push(lt(activities.startedAt, o.before));
  const rows = await dbc
    .select()
    .from(activities)
    .where(and(...conds))
    .orderBy(desc(activities.startedAt))
    .limit(o.limit ?? 20);
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const allLaps = await dbc.select().from(laps).where(inArray(laps.activityId, ids)).orderBy(laps.index);
  return rows.map((r) => ({ ...r, laps: allLaps.filter((l) => l.activityId === r.id) }));
}

/** Fetches a single activity (with laps) by id, scoped to the given athlete; null if missing or owned by another athlete. */
export async function getActivity(dbc: AnyDb, athleteId: string, id: string): Promise<ActivityWithLaps | null> {
  const [row] = await dbc
    .select()
    .from(activities)
    .where(and(eq(activities.athleteId, athleteId), eq(activities.id, id)))
    .limit(1);
  if (!row) return null;
  const l = await dbc.select().from(laps).where(eq(laps.activityId, id)).orderBy(laps.index);
  return { ...row, laps: l };
}

/** Total distance (km, rounded to one decimal) and run count for an athlete in the given calendar month. */
export async function monthSummary(
  dbc: AnyDb,
  athleteId: string,
  year: number,
  month: number,
): Promise<{ km: number; runs: number }> {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));
  const rows = await dbc
    .select({
      m: sql<string>`coalesce(sum(${activities.distanceM}), 0)`,
      n: sql<string>`count(*)`,
    })
    .from(activities)
    .where(and(eq(activities.athleteId, athleteId), gte(activities.startedAt, from), lt(activities.startedAt, to)));
  const r = rows[0] ?? { m: "0", n: "0" };
  return { km: Math.round(Number(r.m) / 100) / 10, runs: Number(r.n) };
}
