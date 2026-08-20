import type { ActivityType } from "@/lib/db/schema";
import type { StravaDetailedActivity, StravaLap, StravaSummaryActivity } from "./types";

/** Normalized activity with derived fields and structured laps. */
export interface NormalisedLap {
  index: number;
  distanceM: number;
  movingS: number;
  avgHr: number | null;
  maxHr: number | null;
  avgCadence: number | null;
  elevationGainM: number | null;
}

/** Normalized activity with derived fields and structured laps. */
export interface NormalisedActivity {
  source: "strava" | "upload";
  stravaId: bigint | null;
  startedAt: Date;
  timezone: string;
  name: string;
  type: ActivityType;
  distanceM: number;
  movingS: number;
  elapsedS: number;
  avgPaceSPerKm: number;
  avgHr: number | null;
  maxHr: number | null;
  avgCadence: number | null;
  elevationGainM: number | null;
  calories: number | null;
  startLat: number | null;
  startLng: number | null;
  laps: NormalisedLap[];
  raw: unknown;
}

const RUN_TYPES = new Set(["Run", "TrailRun", "VirtualRun"]);

/** Check if activity is a run. */
export const isRun = (a: StravaSummaryActivity) => RUN_TYPES.has(a.sport_type ?? a.type);

/** "(GMT+00:00) Europe/Lisbon" → "Europe/Lisbon" */
const tz = (s: string) => s.replace(/^\([^)]*\)\s*/, "") || "UTC";

const paceFrom = (distanceM: number, movingS: number) => (distanceM > 0 ? (movingS / distanceM) * 1000 : 0);

const cadence = (c?: number) => (c == null ? null : c * 2); // Strava: single-foot strikes/min

/** Infer activity type from Strava data: workout_type flag, distance, and HR. */
export function inferType(a: StravaDetailedActivity, laps: StravaLap[]): ActivityType {
  if (a.workout_type === 1) return "race";
  if (a.workout_type === 2) return "long";
  if (a.workout_type === 3) return "tempo";
  const km = a.distance / 1000;
  const hr = a.average_heartrate ?? 0;
  const hasFastBlock = laps.some(
    (l) => l.distance >= 900 && paceFrom(l.distance, l.moving_time) < paceFrom(a.distance, a.moving_time) - 30,
  );
  if (km >= 14) return "long";
  if (hasFastBlock && hr >= 150) return "tempo";
  if (hr >= 150) return "medium";
  return "easy";
}

/** Normalize Strava activity and laps into Ritmo shape. */
export function normaliseStrava(a: StravaDetailedActivity, laps: StravaLap[]): NormalisedActivity {
  return {
    source: "strava",
    stravaId: BigInt(a.id),
    startedAt: new Date(a.start_date),
    timezone: tz(a.timezone),
    name: a.name,
    type: inferType(a, laps),
    distanceM: a.distance,
    movingS: a.moving_time,
    elapsedS: a.elapsed_time,
    avgPaceSPerKm: paceFrom(a.distance, a.moving_time),
    avgHr: a.average_heartrate ?? null,
    maxHr: a.max_heartrate ?? null,
    avgCadence: cadence(a.average_cadence),
    elevationGainM: a.total_elevation_gain ?? null,
    calories: a.calories ?? null,
    startLat: a.start_latlng?.[0] ?? null,
    startLng: a.start_latlng?.[1] ?? null,
    laps: [...laps]
      .sort((x, y) => x.lap_index - y.lap_index)
      .map((l) => ({
        index: l.lap_index,
        distanceM: l.distance,
        movingS: l.moving_time,
        avgHr: l.average_heartrate ?? null,
        maxHr: l.max_heartrate ?? null,
        avgCadence: cadence(l.average_cadence),
        elevationGainM: l.total_elevation_gain ?? null,
      })),
    raw: a,
  };
}
