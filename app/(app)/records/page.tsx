import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";

/** Records tab stub: placeholder until personal-best tracking lands in a later stage. */
export default function RecordsPage() {
  return (
    <>
      <Header kicker="Coming in a later stage" title="Records" />
      <TabBar active="Records" />
    </>
  );
}
