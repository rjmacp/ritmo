import { eq } from "drizzle-orm";
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { ensureAthlete } from "@/lib/db/athlete";
import { activities } from "@/lib/db/schema";
import type { StravaClient } from "@/lib/strava/client";
import { saveConnection } from "@/lib/strava/connection";
import { verifyChallenge, parseEvent, handleEvent } from "@/lib/strava/webhook";
import detail from "../fixtures/strava/activity-19aug.json";
import laps from "../fixtures/strava/laps-19aug.json";
import { createTestDb, type TestDb } from "../helpers/db";

describe("verifyChallenge", () => {
  it("echoes the challenge when the verify token matches", () => {
    const p = new URLSearchParams({ "hub.mode": "subscribe", "hub.verify_token": "verify", "hub.challenge": "xyz" });
    expect(verifyChallenge(p)).toEqual({ ok: true, challenge: "xyz" });
  });
  it("rejects a wrong token", () => {
    const p = new URLSearchParams({ "hub.mode": "subscribe", "hub.verify_token": "nope", "hub.challenge": "xyz" });
    expect(verifyChallenge(p)).toEqual({ ok: false });
  });
});

describe("parseEvent", () => {
  it("accepts activity events and rejects junk", () => {
    expect(
      parseEvent({ object_type: "activity", aspect_type: "create", object_id: 15000000019, owner_id: 42, updates: {} }),
    ).toMatchObject({ objectType: "activity", aspectType: "create", objectId: 15000000019n, ownerId: 42n });
    expect(parseEvent({ nonsense: true })).toBeNull();
  });
});

describe("handleEvent", () => {
  let db: TestDb;
  let close: () => Promise<void>;
  let athleteId: string;
  beforeAll(async () => {
    ({ db, close } = await createTestDb());
    athleteId = (await ensureAthlete(db, "athlete@example.com")).id;
    await saveConnection(
      db,
      athleteId,
      { accessToken: "a", refreshToken: "r", expiresAt: new Date(Date.now() + 3600_000) },
      42n,
    );
  });
  afterAll(() => close());

  const client = {
    getActivity: vi.fn(() => Promise.resolve(detail)),
    getLaps: vi.fn(() => Promise.resolve(laps)),
  } as unknown as StravaClient;

  it("creates on create, then deletes on delete", async () => {
    await handleEvent(
      db,
      { objectType: "activity", aspectType: "create", objectId: 15000000019n, ownerId: 42n, updates: {} },
      () => Promise.resolve(client),
    );
    expect(await db.select().from(activities).where(eq(activities.athleteId, athleteId))).toHaveLength(1);
    await handleEvent(
      db,
      { objectType: "activity", aspectType: "delete", objectId: 15000000019n, ownerId: 42n, updates: {} },
      () => Promise.resolve(client),
    );
    expect(await db.select().from(activities).where(eq(activities.athleteId, athleteId))).toHaveLength(0);
  });

  it("ignores events for unknown owners", async () => {
    await handleEvent(
      db,
      { objectType: "activity", aspectType: "create", objectId: 1n, ownerId: 999n, updates: {} },
      () => Promise.resolve(client),
    );
    expect(await db.select().from(activities).where(eq(activities.athleteId, athleteId))).toHaveLength(0);
  });
});
