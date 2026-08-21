import Link from "next/link";
import { TabBar } from "@/components/TabBar";
import { requireAthlete } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { recentSyncLogs } from "@/lib/db/syncLogQueries";
import { zoneBoundaries } from "@/lib/metrics/zones";
import { getConnection } from "@/lib/strava/connection";
import { signOutAction, updateAthlete } from "./actions";

export const dynamic = "force-dynamic";

/** Account page: Strava connect/disconnect state, max HR editor with derived HR zones, recent sync log, sign-out. */
export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ import?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const athlete = await requireAthlete();
  const [conn, logs] = await Promise.all([getConnection(db, athlete.id), recentSyncLogs(db, athlete.id)]);
  const b = zoneBoundaries(athlete);
  return (
    <>
      <header className="flex items-center justify-between px-5 pt-[22px] pb-[14px]">
        <div className="flex flex-col gap-[2px]">
          <span className="k">{athlete.email}</span>
          <span className="num text-[26px]">Account</span>
        </div>
        <Link
          href="/runs"
          className="w-9 h-9 rounded-lg bg-white border border-line grid place-items-center text-muted"
        >
          ←
        </Link>
      </header>
      <div className="px-4 flex flex-col gap-3">
        {sp.error && <p className="card p-3 text-red text-sm">Strava connection failed ({sp.error}). Try again.</p>}
        {sp.import === "started" && (
          <p className="card p-3 text-sm">
            Importing your Strava history — runs will appear on the Runs tab as they land.
          </p>
        )}

        <div className="hero p-4 flex items-center gap-[14px]">
          <div className="flex-1">
            <div className={`font-extrabold ${conn ? "text-lime" : ""}`}>
              {conn ? "Strava connected" : "Strava not connected"}
            </div>
            <div className="text-xs opacity-85">
              {conn ? (
                <>
                  {conn.importStatus === "running"
                    ? `Importing… ${conn.importedCount} runs so far — continues automatically`
                    : conn.lastSyncAt
                      ? `Synced ${conn.lastSyncAt.toLocaleString("en-GB")} · ${conn.importedCount} runs`
                      : "Ready"}
                </>
              ) : (
                "Connect once; every run syncs automatically."
              )}
            </div>
          </div>
          {conn ? (
            <div className="flex flex-col items-end gap-1">
              {conn.importStatus === "running" && (
                <form action="/api/strava/import" method="post">
                  <button className="h-9 px-4 rounded-lg bg-white text-ink text-[13px] font-extrabold grid place-items-center">
                    Continue now
                  </button>
                </form>
              )}
              <form action="/api/strava/disconnect" method="post">
                <button className="text-xs font-bold opacity-85">Disconnect</button>
              </form>
            </div>
          ) : (
            <a
              href="/api/strava/connect"
              className="h-9 px-4 rounded-lg bg-white text-ink text-[13px] font-extrabold grid place-items-center"
            >
              Connect
            </a>
          )}
        </div>

        <span className="k px-[6px]">Athlete</span>
        <form action={updateAthlete} className="card px-4 py-1">
          <label className="flex items-center justify-between min-h-11 border-b border-line">
            <span className="font-semibold">Max heart rate</span>
            <span className="flex items-center gap-2">
              <input
                name="maxHr"
                type="number"
                defaultValue={athlete.maxHr ?? ""}
                placeholder="e.g. 196"
                className="w-20 text-right border border-line rounded-lg px-2 h-8"
              />
              <button className="text-xs font-bold">Save</button>
            </span>
          </label>
          <div className="flex items-center justify-between min-h-11">
            <span className="font-semibold">HR zones</span>
            <span className="text-muted text-[13px] font-semibold">{b.join(" · ")}</span>
          </div>
        </form>

        <span className="k px-[6px]">Sync log</span>
        <div className="card px-4 py-1">
          {logs.length === 0 && <div className="min-h-11 flex items-center k">No syncs yet</div>}
          {logs.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between min-h-11 border-b border-line last:border-0 text-[13px]"
            >
              <span className="font-semibold capitalize">{l.kind}</span>
              <span className={l.status === "failed" ? "text-red" : "text-muted"}>
                {l.status === "failed" ? (l.error ?? "failed") : `${l.activitiesProcessed} runs`} ·{" "}
                {l.startedAt.toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>

        <form action={signOutAction}>
          <button className="k underline">Sign out</button>
        </form>
        <div className="flex justify-center text-[11px] text-muted font-semibold py-2">Powered by Strava</div>
      </div>
      <TabBar active="" />
    </>
  );
}
