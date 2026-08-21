import type { Lap } from "@/lib/db/schema";
import { formatPace } from "@/lib/format";
import { zoneFor, ZONE_COLORS, type Boundaries } from "@/lib/metrics/zones";

/** Per-lap table: distance, a pace bar coloured by that lap's HR zone, pace, average HR and elevation gain. */
export function LapTable({ laps, boundaries }: { laps: Lap[]; boundaries: Boundaries }) {
  // A zero-distance lap (a paused/manual split) would make pace Infinity and poison
  // the whole min/max scale, so it gets no pace and no bar.
  const rows = laps.map((l) => ({ l, pace: l.distanceM > 0 ? (l.movingS / l.distanceM) * 1000 : null }));
  const paces = rows.flatMap((r) => (r.pace == null ? [] : [r.pace]));
  const mx = paces.length ? Math.max(...paces) : 0;
  const mn = paces.length ? Math.min(...paces) : 0;
  const grid = "grid grid-cols-[28px_1fr_46px_40px_38px] gap-2 items-center";
  return (
    <div className="card p-4 flex flex-col gap-[6px]">
      <div className={`${grid} text-[11px] font-semibold text-muted`}>
        <span>km</span>
        <span />
        <span className="text-right">pace</span>
        <span className="text-right">bpm</span>
        <span className="text-right">elev</span>
      </div>
      {rows.map(({ l, pace }) => (
        <div key={l.id} className={`${grid} h-[19px]`}>
          <span className="k text-[11px]">{l.distanceM >= 900 ? l.index : (l.distanceM / 1000).toFixed(1)}</span>
          <div className="h-1 rounded bg-[#eef0f3]">
            {pace != null && (
              <div
                className="h-full rounded opacity-85"
                style={{
                  width: `${((mx - pace) / (mx - mn + 1)) * 80 + 20}%`,
                  background: ZONE_COLORS[zoneFor(l.avgHr, boundaries)],
                }}
              />
            )}
          </div>
          <span className="num text-[13px] text-right">{pace != null ? formatPace(pace) : "—"}</span>
          <span className="num text-[13px] text-right font-bold">{l.avgHr != null ? Math.round(l.avgHr) : "—"}</span>
          <span className="k text-[11px] text-right">
            {l.elevationGainM != null ? `+${Math.round(l.elevationGainM)}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
