import { redirect } from "next/navigation";

/** Root route: redirects straight to the runs feed. */
export default function Home() {
  redirect("/runs");
}
