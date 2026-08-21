import { describe, it, expect, beforeAll, vi } from "vitest";
import { ensureAthlete } from "@/lib/db/athlete";
import type { Athlete } from "@/lib/db/schema";
import type { TestDb } from "../helpers/db";

// Route handlers are exercised directly with `new Request(...)`: the db is a PGlite
// instance standing in for `@/lib/db/client`, and the session/cookie edges are stubbed.
const mocks = vi.hoisted(() => ({
  athlete: null as Athlete | null,
  stateCookie: undefined as string | undefined,
}));

vi.mock("@/lib/db/client", async () => {
  const { createTestDb } = await import("../helpers/db");
  const { db } = await createTestDb();
  return { db };
});

vi.mock("@/lib/auth", () => ({ requireAthlete: () => Promise.resolve(mocks.athlete) }));

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        name === "strava_oauth_state" && mocks.stateCookie ? { value: mocks.stateCookie } : undefined,
      set: () => undefined,
      delete: () => undefined,
    }),
}));

const { GET: webhookGET, POST: webhookPOST } = await import("@/app/api/strava/webhook/[secret]/route");
const { GET: cronGET } = await import("@/app/api/cron/sync/route");
const { GET: callbackGET } = await import("@/app/api/strava/callback/route");

const SECRET = "hooksecret"; // matches tests/setup.ts
const ctx = (secret: string) => ({ params: Promise.resolve({ secret }) });
const webhookUrl = (secret: string, query = "") => `http://localhost:3000/api/strava/webhook/${secret}${query}`;

beforeAll(async () => {
  const { db } = (await import("@/lib/db/client")) as unknown as { db: TestDb };
  mocks.athlete = await ensureAthlete(db, "athlete@example.com");
});

describe("GET /api/strava/webhook/[secret]", () => {
  const challenge = "?hub.mode=subscribe&hub.verify_token=verify&hub.challenge=abc";

  it("404s on a wrong secret, before looking at the verify token", async () => {
    const res = await webhookGET(new Request(webhookUrl("wrong", challenge)), ctx("wrong"));
    expect(res.status).toBe(404);
  });

  it("403s on the right secret with a wrong verify token", async () => {
    const q = "?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=abc";
    const res = await webhookGET(new Request(webhookUrl(SECRET, q)), ctx(SECRET));
    expect(res.status).toBe(403);
  });

  it("echoes the challenge when secret and token are both right", async () => {
    const res = await webhookGET(new Request(webhookUrl(SECRET, challenge)), ctx(SECRET));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ "hub.challenge": "abc" });
  });
});

describe("POST /api/strava/webhook/[secret]", () => {
  it("404s on a wrong secret", async () => {
    const req = new Request(webhookUrl("wrong"), {
      method: "POST",
      body: JSON.stringify({ object_type: "activity", aspect_type: "create", object_id: 1, owner_id: 42 }),
    });
    const res = await webhookPOST(req, ctx("wrong"));
    expect(res.status).toBe(404);
    expect(await res.text()).toBe("not found");
  });
});

describe("GET /api/cron/sync", () => {
  it("401s without the bearer secret", async () => {
    const res = await cronGET(new Request("http://localhost:3000/api/cron/sync"));
    expect(res.status).toBe(401);
  });

  it("200s with the bearer secret", async () => {
    const res = await cronGET(
      new Request("http://localhost:3000/api/cron/sync", { headers: { authorization: "Bearer cron" } }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, results: {} });
  });
});

describe("GET /api/strava/callback", () => {
  it("redirects with ?error=state when the state does not match the cookie", async () => {
    mocks.stateCookie = "expected";
    const res = await callbackGET(new Request("http://localhost:3000/api/strava/callback?code=c&state=other"));
    expect(res.headers.get("location")).toContain("/account?error=state");
  });

  it("redirects with ?error=scope when activity:read_all was not granted", async () => {
    mocks.stateCookie = "expected";
    const url = "http://localhost:3000/api/strava/callback?code=c&state=expected&scope=read,activity:read";
    const res = await callbackGET(new Request(url));
    expect(res.headers.get("location")).toContain("/account?error=scope");
  });
});
