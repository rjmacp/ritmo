import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { requireAthlete } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Plan tab stub: placeholder until training plan generation lands in a later stage. */
export default async function PlanPage() {
  await requireAthlete();
  return (
    <>
      <Header kicker="Coming in a later stage" title="Plan" />
      <TabBar active="Plan" />
    </>
  );
}
