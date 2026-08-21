/** HR zone boundary tuple: [z1/z2, z2/z3, z3/z4, z4/z5] cut points, in bpm. */
export type Boundaries = [number, number, number, number];
/** HR zone: 0 = no HR data, 1 (lowest effort) through 5 (highest). */
export type Zone = 0 | 1 | 2 | 3 | 4 | 5;
const DEFAULT: Boundaries = [125, 145, 160, 178];

/** Resolves an athlete's HR zone boundaries: explicit override, else derived from max HR (60/70/80/90%), else a generic default. */
export function zoneBoundaries(a: { maxHr: number | null; hrZoneBoundaries: Boundaries | null }): Boundaries {
  if (a.hrZoneBoundaries) return a.hrZoneBoundaries;
  const max = a.maxHr;
  if (max) return [0.6, 0.7, 0.8, 0.9].map((f) => Math.round(max * f)) as Boundaries;
  return DEFAULT;
}

/** Classifies a heart rate into a zone (0 when `hr` is null) given a set of boundaries. */
export function zoneFor(hr: number | null, b: Boundaries): Zone {
  if (hr == null) return 0;
  if (hr <= b[0]) return 1;
  if (hr <= b[1]) return 2;
  if (hr <= b[2]) return 3;
  if (hr <= b[3]) return 4;
  return 5;
}

/** CSS colour (variable or literal) to render each HR zone with in the feed. */
export const ZONE_COLORS: Record<Zone, string> = {
  0: "var(--line)",
  1: "#d0d5de",
  2: "var(--sky)",
  3: "var(--lime)",
  4: "var(--tang)",
  5: "var(--red)",
};
