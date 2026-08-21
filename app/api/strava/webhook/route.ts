import { NextResponse, after } from "next/server";
import { db } from "@/lib/db/client";
import { log } from "@/lib/log";
import { clientForAthlete } from "@/lib/strava/connection";
import { verifyChallenge, parseEvent, handleEvent } from "@/lib/strava/webhook";

/** Handles Strava's one-time webhook subscription verification handshake. */
export function GET(req: Request): NextResponse {
  const r = verifyChallenge(new URL(req.url).searchParams);
  return r.ok ? NextResponse.json({ "hub.challenge": r.challenge }) : new NextResponse("forbidden", { status: 403 });
}

/** Accepts a Strava webhook delivery, always responding 200 immediately and processing the event after the response is sent. */
export async function POST(req: Request): Promise<NextResponse> {
  const ev = parseEvent(await req.json().catch(() => null));
  if (ev)
    after(() =>
      handleEvent(db, ev, (id) => clientForAthlete(db, id)).catch((e: unknown) => log.error("webhook failed", e)),
    );
  return new NextResponse("ok", { status: 200 }); // always 200 within 2 s
}
