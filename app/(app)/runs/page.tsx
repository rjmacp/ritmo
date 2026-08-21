import Link from "next/link";
import { Header } from "@/components/Header";
import { RunCard } from "@/components/RunCard";
import { TabBar } from "@/components/TabBar";
import { requireAthlete } from "@/lib/auth";
import { listActivities, monthSummary } from "@/lib/db/activities";
import { db } from "@/lib/db/client";
import { ACTIVITY_TYPES, type ActivityType } from "@/lib/db/schema";
import { zoneBoundaries } from "@/lib/metrics/zones";

export const dynamic = "force-dynamic";

/** Runs feed: month summary header, type filter chips and the athlete's recent runs (or an empty state). */
export default async function RunsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const athlete = await requireAthlete();
  const t = ACTIVITY_TYPES.includes(type as ActivityType) ? (type as ActivityType) : undefined;
  const now = new Date();
  const [runs, month] = await Promise.all([
    listActivities(db, athlete.id, { type: t, limit: 30 }),
    monthSummary(db, athlete.id, now.getUTCFullYear(), now.getUTCMonth() + 1),
  ]);
  const b = zoneBoundaries(athlete);
  const initials = (athlete.name ?? athlete.email)
    .split(/[\s@.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("");
  return (
    <>
      <Header
        kicker={`${new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(now)} · ${month.km} km · ${month.runs} runs`}
        title="Runs"
        initials={initials}
        right={
          <form action="/api/sync" method="post">
            <button className="h-9 px-[14px] rounded-lg bg-white border border-line text-[13px] font-bold">Sync</button>
          </form>
        }
      />
      <div className="px-4 flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto shrink-0">
          {["all", ...ACTIVITY_TYPES.filter((x) => x !== "other" && x !== "tt")].map((x) => (
            <Link
              key={x}
              href={x === "all" ? "/runs" : `/runs?type=${x}`}
              className={`px-[14px] py-[7px] rounded-lg text-xs font-bold whitespace-nowrap border ${(t ?? "all") === x ? "hero border-transparent" : "bg-white border-line text-muted"}`}
            >
              {x.charAt(0).toUpperCase() + x.slice(1)}
            </Link>
          ))}
        </div>
        {runs.length === 0 ? (
          <div className="card p-5 flex flex-col gap-2">
            <span className="font-extrabold">No runs yet</span>
            <span className="k">
              Connect Strava on your{" "}
              <Link className="underline" href="/account">
                account
              </Link>{" "}
              page and your history will import in a minute or two.
            </span>
          </div>
        ) : (
          runs.map((a) => <RunCard key={a.id} a={a} boundaries={b} />)
        )}
      </div>
      <TabBar active="Runs" />
    </>
  );
}
