import { NextResponse, after } from "next/server";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { safeEqual } from "@/lib/security";
import { clientForAthlete } from "@/lib/strava/connection";
import { verifyChallenge, parseEvent, handleEvent } from "@/lib/strava/webhook";

/** The unguessable path segment keeps the endpoint off the public URL space; a wrong one is indistinguishable from a missing route. */
interface Ctx {
  params: Promise<{ secret: string }>;
}

/** True when the URL's secret segment matches `STRAVA_WEBHOOK_SECRET`. */
async function pathAllowed(ctx: Ctx): Promise<boolean> {
  const { secret } = await ctx.params;
  return safeEqual(secret, env.STRAVA_WEBHOOK_SECRET);
}

/** Handles Strava's one-time webhook subscription verification handshake. */
export async function GET(req: Request, ctx: Ctx): Promise<NextResponse> {
  if (!(await pathAllowed(ctx))) return new NextResponse("not found", { status: 404 });
  const r = verifyChallenge(new URL(req.url).searchParams);
  return r.ok ? NextResponse.json({ "hub.challenge": r.challenge }) : new NextResponse("forbidden", { status: 403 });
}

/** Accepts a Strava webhook delivery, always responding 200 immediately and processing the event after the response is sent. */
export async function POST(req: Request, ctx: Ctx): Promise<NextResponse> {
  if (!(await pathAllowed(ctx))) return new NextResponse("not found", { status: 404 });
  const ev = parseEvent(await req.json().catch(() => null));
  if (ev)
    after(() =>
      handleEvent(db, ev, (id) => clientForAthlete(db, id)).catch((e: unknown) => log.error("webhook failed", e)),
    );
  return new NextResponse("ok", { status: 200 }); // always 200 within 2 s
}
