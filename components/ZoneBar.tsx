import { ZONE_COLORS } from "@/lib/metrics/zones";

/** Stacked bar summarising an activity's time spent in each HR zone (1-5), with a per-zone minute breakdown below. */
export function ZoneBar({ seconds }: { seconds: [number, number, number, number, number] }) {
  const total = seconds.reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex justify-between">
        <span className="k">Time in zone</span>
        <span className="k">{Math.round(total / 60)} min</span>
      </div>
      <div className="flex h-3 rounded-md overflow-hidden">
        {seconds.map((s, i) => (
          <div
            key={i}
            style={{ width: `${(s / total) * 100}%`, background: ZONE_COLORS[(i + 1) as 1 | 2 | 3 | 4 | 5] }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[11px] font-semibold text-muted">
        {seconds.map((s, i) => (
          <span key={i}>
            Z{i + 1} {Math.round(s / 60)}m
          </span>
        ))}
      </div>
    </div>
  );
}
