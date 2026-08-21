import type { Lap } from "@/lib/db/schema";
import { formatPace } from "@/lib/format";
import { zoneFor, ZONE_COLORS, type Boundaries } from "@/lib/metrics/zones";

/** Per-km pace bar chart for a run, each bar coloured by that km's HR zone; renders nothing for short/single-lap runs. */
export function KmBars({ laps, boundaries }: { laps: Lap[]; boundaries: Boundaries }) {
  const full = laps.filter((l) => l.distanceM >= 900);
  if (full.length < 2) return null;
  // A zero-distance split would make pace Infinity and poison the min/max scale,
  // so it contributes no bar and no value to the range.
  const rows = full.map((l) => ({ l, pace: l.distanceM > 0 ? (l.movingS / l.distanceM) * 1000 : null }));
  const paces = rows.flatMap((r) => (r.pace == null ? [] : [r.pace]));
  if (paces.length === 0) return null;
  const mx = Math.max(...paces);
  const mn = Math.min(...paces);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end gap-[3px] h-16 px-[2px] border-b border-line">
        {rows.map(({ l, pace }) =>
          pace == null ? (
            <div key={l.id} className="flex-1" />
          ) : (
            <div
              key={l.id}
              style={{
                height: `${30 + ((mx - pace) / (mx - mn + 1)) * 34}px`,
                background: ZONE_COLORS[zoneFor(l.avgHr, boundaries)],
              }}
              className="flex-1 rounded-t-[3px] opacity-90"
            />
          ),
        )}
      </div>
      <div className="flex justify-between">
        <span className="k text-[10px]">pace per km</span>
        <span className="k text-[10px]">fastest {formatPace(mn)}</span>
      </div>
    </div>
  );
}
