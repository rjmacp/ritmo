import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { requireAthlete } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Trends tab stub: placeholder until fitness trend charts land in a later stage. */
export default async function TrendsPage() {
  await requireAthlete();
  return (
    <>
      <Header kicker="Coming in a later stage" title="Trends" />
      <TabBar active="Trends" />
    </>
  );
}
