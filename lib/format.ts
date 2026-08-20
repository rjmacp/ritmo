/** Formats a pace in seconds-per-km as `m:ss`. */
export function formatPace(secPerKm: number): string {
  const s = Math.round(secPerKm);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Formats a duration in seconds as `m:ss`, or `h:mm:ss` once it exceeds an hour. */
export function formatDuration(sec: number): string {
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
    : `${m}:${String(r).padStart(2, "0")}`;
}

/** Formats a distance in metres as kilometres to one decimal place. */
export function formatKm(metres: number): string {
  return (metres / 1000).toFixed(1);
}
