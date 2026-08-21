import { it, expect } from "vitest";
import { zoneSeconds } from "@/lib/metrics/zoneTime";
import { normaliseStrava } from "@/lib/strava/normalise";
import type { StravaDetailedActivity } from "@/lib/strava/types";
import detail from "../fixtures/strava/activity-19aug.json";
import laps from "../fixtures/strava/laps-19aug.json";

it("attributes lap time to zones by lap avg HR", () => {
  const n = normaliseStrava(detail as StravaDetailedActivity, laps);
  const z = zoneSeconds(
    n.laps.map((l, i) => ({
      ...l,
      id: String(i),
      activityId: "x",
      maxHr: null,
      avgCadence: null,
      elevationLossM: null,
      gapSPerKm: null,
    })),
    [125, 145, 160, 178],
  );
  expect(z.reduce((a, b) => a + b, 0)).toBe(2412);
  expect(z[3]).toBe(289 + 301 + 307 + 369); // laps 3–6 are Z4 (163–174 bpm)
});
