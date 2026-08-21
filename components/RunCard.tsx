import Link from "next/link";
import type { ActivityWithLaps } from "@/lib/db/activities";
import { formatDuration, formatKm, formatPace } from "@/lib/format";
import type { Boundaries } from "@/lib/metrics/zones";
import { KmBars } from "./KmBars";
import { TypePill } from "./TypePill";

const fmtDate = (d: Date, tz: string) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  })
    .format(d)
    .replace(",", " ·");

/** Feed card summarising one run: date/type, headline stats and its per-km zone bars. */
export function RunCard({ a, boundaries }: { a: ActivityWithLaps; boundaries: Boundaries }) {
  return (
    <Link href={`/runs/${a.id}`} className="card p-4 flex flex-col gap-3 shrink-0">
      <div className="flex justify-between items-center">
        <span className="k">{fmtDate(a.startedAt, a.timezone)}</span>
        <TypePill type={a.type} />
      </div>
      <span className="text-[17px] font-extrabold">{a.name}</span>
      <div className="grid grid-cols-4 gap-2">
        <Stat v={formatKm(a.distanceM)} k="km" />
        <Stat v={formatDuration(a.movingS)} k="time" />
        <Stat v={formatPace(a.avgPaceSPerKm)} k="/km" />
        <Stat v={a.avgHr != null ? Math.round(a.avgHr).toString() : "—"} k="avg bpm" color="text-sky-text" />
      </div>
      <KmBars laps={a.laps} boundaries={boundaries} />
      <div className="flex justify-between items-center">
        <span className="k text-[11px]">{a.elevationGainM != null ? `+${Math.round(a.elevationGainM)} m` : ""}</span>
      </div>
    </Link>
  );
}

function Stat({ v, k, color = "" }: { v: string; k: string; color?: string }) {
  return (
    <div>
      <div className={`num text-[22px] ${color}`}>{v}</div>
      <div className="k text-[10px]">{k}</div>
    </div>
  );
}
