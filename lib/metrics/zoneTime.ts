import type { Lap } from "@/lib/db/schema";
import { zoneFor, type Boundaries } from "./zones";

/** Sums each lap's moving time into the HR zone (1-5) of that lap's average heart rate; zone-0 (no HR) laps are excluded. */
export function zoneSeconds(laps: Lap[], b: Boundaries): [number, number, number, number, number] {
  const out: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  for (const l of laps) {
    switch (zoneFor(l.avgHr, b)) {
      case 1:
        out[0] += l.movingS;
        break;
      case 2:
        out[1] += l.movingS;
        break;
      case 3:
        out[2] += l.movingS;
        break;
      case 4:
        out[3] += l.movingS;
        break;
      case 5:
        out[4] += l.movingS;
        break;
    }
  }
  return out;
}
