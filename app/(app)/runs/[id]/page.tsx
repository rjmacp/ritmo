import Link from "next/link";
import { notFound } from "next/navigation";
import { LapTable } from "@/components/LapTable";
import { TabBar } from "@/components/TabBar";
import { TypePill } from "@/components/TypePill";
import { ZoneBar } from "@/components/ZoneBar";
import { requireAthlete } from "@/lib/auth";
import { getActivity } from "@/lib/db/activities";
import { db } from "@/lib/db/client";
import { formatDuration, formatKm, formatPace } from "@/lib/format";
import { zoneSeconds } from "@/lib/metrics/zoneTime";
import { zoneBoundaries } from "@/lib/metrics/zones";

export const dynamic = "force-dynamic";

/** Run detail page: headline stats, HR zone breakdown and per-lap table for one of the athlete's own activities. */
export default async function RunDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const athlete = await requireAthlete();
  const a = await getActivity(db, athlete.id, id);
  if (!a) notFound();
  const b = zoneBoundaries(athlete);
  const when = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: a.timezone,
  }).format(a.startedAt);
  return (
    <>
      <header className="flex items-center justify-between px-5 pt-[22px] pb-[14px]">
        <div className="flex flex-col gap-[2px]">
          <span className="k flex items-center gap-2">
            <Link href="/runs">← Runs</Link> · {when} · <TypePill type={a.type} />
          </span>
          <span className="num text-[26px]">{a.name}</span>
        </div>
      </header>
      <div className="px-4 flex flex-col gap-3">
        <div className="hero p-5 flex justify-between items-end">
          <div>
            <div className="num text-[40px]">
              {formatKm(a.distanceM)}
              <span className="text-sm font-medium opacity-85"> km</span>
            </div>
          </div>
          <div className="text-right">
            <div className="num text-[26px]">{formatDuration(a.movingS)}</div>
            <div className="text-[11px] opacity-85">time</div>
          </div>
          <div className="text-right">
            <div className="num text-[26px]">{formatPace(a.avgPaceSPerKm)}</div>
            <div className="text-[11px] opacity-85">/km</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat v={a.avgHr != null ? String(Math.round(a.avgHr)) : "—"} k="avg bpm" color="text-sky-text" />
          <Stat v={a.maxHr != null ? String(Math.round(a.maxHr)) : "—"} k="max bpm" />
          <Stat v={a.avgCadence != null ? String(Math.round(a.avgCadence)) : "—"} k="spm" />
        </div>
        {a.laps.length > 0 && <ZoneBar seconds={zoneSeconds(a.laps, b)} />}
        {a.laps.length > 0 && <LapTable laps={a.laps} boundaries={b} />}
      </div>
      <TabBar active="Runs" />
    </>
  );
}

function Stat({ v, k, color = "" }: { v: string; k: string; color?: string }) {
  return (
    <div className="card px-[14px] py-3 flex flex-col gap-1">
      <span className={`num text-[26px] ${color}`}>{v}</span>
      <span className="k">{k}</span>
    </div>
  );
}
