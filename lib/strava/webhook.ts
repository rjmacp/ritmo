import { z } from "zod";
import type { AnyDb } from "@/lib/db/types";
import { env } from "@/lib/env";
import { processActivity, deleteActivityByStravaId } from "@/lib/pipeline/processActivity";
import { startSyncLog } from "@/lib/pipeline/syncLog";
import type { StravaClient } from "./client";
import { athleteIdForStravaAthlete } from "./connection";
import { isRun, normaliseStrava } from "./normalise";

/** Validates a Strava webhook subscription-verification GET request, returning the challenge to echo when the verify token matches. */
export function verifyChallenge(p: URLSearchParams): { ok: true; challenge: string } | { ok: false } {
  const challenge = p.get("hub.challenge");
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === env.STRAVA_WEBHOOK_VERIFY_TOKEN && challenge) {
    return { ok: true, challenge };
  }
  return { ok: false };
}

const EventSchema = z.object({
  object_type: z.enum(["activity", "athlete"]),
  aspect_type: z.enum(["create", "update", "delete"]),
  object_id: z.number(),
  owner_id: z.number(),
  updates: z.record(z.string(), z.unknown()).default({}),
});

/** A validated, camelCase Strava webhook event, as produced by {@link parseEvent}. */
export interface StravaWebhookEvent {
  objectType: "activity" | "athlete";
  aspectType: "create" | "update" | "delete";
  objectId: bigint;
  ownerId: bigint;
  updates: Record<string, unknown>;
}

/** Parses and validates a raw webhook POST body, returning `null` if it doesn't match Strava's event shape. */
export function parseEvent(body: unknown): StravaWebhookEvent | null {
  const r = EventSchema.safeParse(body);
  if (!r.success) return null;
  return {
    objectType: r.data.object_type,
    aspectType: r.data.aspect_type,
    objectId: BigInt(r.data.object_id),
    ownerId: BigInt(r.data.owner_id),
    updates: r.data.updates,
  };
}

/** Applies a validated webhook event: fetches and upserts the activity on create/update, deletes it on delete; ignores non-activity objects and unknown owners. */
export async function handleEvent(
  dbc: AnyDb,
  ev: StravaWebhookEvent,
  clientFactory: (athleteId: string) => Promise<StravaClient | null>,
): Promise<void> {
  if (ev.objectType !== "activity") return; // athlete deauth handled by token failure on next sync
  const athleteId = await athleteIdForStravaAthlete(dbc, ev.ownerId);
  if (!athleteId) return;
  const log = await startSyncLog(dbc, athleteId, "webhook");
  try {
    if (ev.aspectType === "delete") {
      await deleteActivityByStravaId(dbc, athleteId, ev.objectId);
      await log.finish("ok", 1);
      return;
    }
    const client = await clientFactory(athleteId);
    if (!client) {
      await log.finish("failed", 0, "no connection");
      return;
    }
    const detail = await client.getActivity(ev.objectId);
    if (!isRun(detail)) {
      await log.finish("ok", 0);
      return;
    }
    const laps = await client.getLaps(ev.objectId);
    await processActivity(dbc, athleteId, normaliseStrava(detail, laps));
    await log.finish("ok", 1);
  } catch (err) {
    await log.finish("failed", 0, err instanceof Error ? err.message : String(err));
    throw err;
  }
}
