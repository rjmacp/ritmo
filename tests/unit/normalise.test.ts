import { describe, it, expect } from "vitest";
import { normaliseStrava, isRun, inferType } from "@/lib/strava/normalise";
import type { StravaDetailedActivity, StravaSummaryActivity } from "@/lib/strava/types";
import detail from "../fixtures/strava/activity-19aug.json";
import page from "../fixtures/strava/athlete-activities-page.json";
import laps from "../fixtures/strava/laps-19aug.json";

const detailTyped = detail as StravaDetailedActivity;
const pageTyped = page as StravaSummaryActivity[];

describe("normaliseStrava", () => {
  const n = normaliseStrava(detailTyped, laps);
  it("maps core fields and derives pace", () => {
    expect(n.stravaId).toBe(15000000019n);
    expect(n.startedAt.toISOString()).toBe("2026-08-19T17:02:00.000Z");
    expect(n.timezone).toBe("Europe/Lisbon");
    expect(n.distanceM).toBe(7410);
    expect(n.avgPaceSPerKm).toBeCloseTo(325.5, 0);
    expect(n.avgHr).toBe(158);
    expect(n.avgCadence).toBe(172); // Strava reports one foot; Ritmo stores steps/min
    expect(n.startLat).toBeCloseTo(38.937);
  });
  it("maps laps 1-based with HR and climb", () => {
    expect(n.laps).toHaveLength(8);
    expect(n.laps[2]).toMatchObject({ index: 3, movingS: 289, avgHr: 171, elevationGainM: 1 });
  });
  it("keeps the raw payload", () => {
    const raw = n.raw as { activity: { id: number }; laps: unknown[] };
    expect(raw.activity.id).toBe(15000000019);
    expect(raw.laps).toHaveLength(8);
  });
});

describe("isRun", () => {
  it("accepts Run and TrailRun, rejects Ride", () => {
    expect(isRun(pageTyped[0]!)).toBe(true);
    expect(isRun(pageTyped[1]!)).toBe(false);
    expect(isRun({ ...pageTyped[0]!, type: "Run", sport_type: "TrailRun" })).toBe(true);
  });
});

describe("inferType", () => {
  it("uses Strava workout_type when set (1 race, 2 long, 3 workout)", () => {
    expect(inferType({ ...detailTyped, workout_type: 1 }, laps)).toBe("race");
    expect(inferType({ ...detailTyped, workout_type: 2 }, laps)).toBe("long");
    expect(inferType({ ...detailTyped, workout_type: 3 }, laps)).toBe("tempo");
  });
  it("falls back to distance and HR heuristics", () => {
    expect(inferType({ ...detailTyped, workout_type: null, distance: 16100, average_heartrate: 153 }, [])).toBe("long");
    expect(inferType({ ...detailTyped, workout_type: null, distance: 6500, average_heartrate: 144 }, [])).toBe("easy");
    expect(inferType({ ...detailTyped, workout_type: null, distance: 9000, average_heartrate: 157 }, [])).toBe(
      "medium",
    );
  });
});
