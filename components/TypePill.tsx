import type { ActivityType } from "@/lib/db/schema";

const COLOR: Record<ActivityType, string> = {
  easy: "text-easy",
  medium: "text-sky-text",
  tempo: "text-tang-text",
  long: "text-lime-text",
  race: "text-ink",
  tt: "text-ink",
  other: "text-muted",
};

/** Outline pill labelling an activity's coach-facing type (easy, tempo, long, ...). */
export function TypePill({ type }: { type: ActivityType }) {
  return <span className={`pill capitalize ${COLOR[type]}`}>{type}</span>;
}
