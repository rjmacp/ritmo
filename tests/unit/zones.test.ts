import { it, expect } from "vitest";
import { zoneBoundaries, zoneFor } from "@/lib/metrics/zones";

it("derives boundaries from max HR", () => {
  expect(zoneBoundaries({ maxHr: 200, hrZoneBoundaries: null })).toEqual([120, 140, 160, 180]);
});
it("prefers explicit boundaries", () => {
  expect(zoneBoundaries({ maxHr: 200, hrZoneBoundaries: [125, 145, 160, 178] })).toEqual([125, 145, 160, 178]);
});
it("falls back to defaults without max HR", () => {
  expect(zoneBoundaries({ maxHr: null, hrZoneBoundaries: null })).toEqual([125, 145, 160, 178]);
});
it("classifies HR into zones", () => {
  const b: [number, number, number, number] = [125, 145, 160, 178];
  expect(zoneFor(null, b)).toBe(0);
  expect(zoneFor(120, b)).toBe(1);
  expect(zoneFor(145, b)).toBe(2);
  expect(zoneFor(146, b)).toBe(3);
  expect(zoneFor(171, b)).toBe(4);
  expect(zoneFor(185, b)).toBe(5);
});
