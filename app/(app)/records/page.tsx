import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { requireAthlete } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Records tab stub: placeholder until personal-best tracking lands in a later stage. */
export default async function RecordsPage() {
  await requireAthlete();
  return (
    <>
      <Header kicker="Coming in a later stage" title="Records" />
      <TabBar active="Records" />
    </>
  );
}
