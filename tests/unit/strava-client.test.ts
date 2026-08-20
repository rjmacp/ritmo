import { describe, it, expect, vi } from "vitest";
import { StravaClient, StravaRateLimitError, type StravaTokens } from "@/lib/strava/client";
import activity from "../fixtures/strava/activity-19aug.json";
import laps from "../fixtures/strava/laps-19aug.json";

const fresh = (): StravaTokens => ({ accessToken: "a", refreshToken: "r", expiresAt: new Date(Date.now() + 3600_000) });
const expired = (): StravaTokens => ({ accessToken: "old", refreshToken: "r", expiresAt: new Date(Date.now() - 10) });
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const noRefresh = () => Promise.resolve();

describe("StravaClient", () => {
  it("fetches an activity with a bearer token", async () => {
    const fetchImpl = vi.fn((url: string | URL, init?: RequestInit) => {
      expect(String(url)).toBe("https://www.strava.com/api/v3/activities/15000000019");
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer a");
      return Promise.resolve(json(activity));
    });
    const c = new StravaClient(fresh(), noRefresh, fetchImpl as unknown as typeof fetch);
    const a = await c.getActivity(15000000019);
    expect(a.name).toBe("Mafra Corrida");
  });

  it("refreshes an expired token before calling and reports the new tokens", async () => {
    const onRefresh = vi.fn(() => Promise.resolve());
    const fetchImpl = vi.fn((url: string | URL) => {
      if (String(url).includes("/oauth/token")) {
        return Promise.resolve(
          json({ access_token: "new", refresh_token: "r2", expires_at: Math.floor(Date.now() / 1000) + 21600 }),
        );
      }
      return Promise.resolve(json(laps));
    });
    const c = new StravaClient(expired(), onRefresh, fetchImpl as unknown as typeof fetch);
    const l = await c.getLaps(15000000019);
    expect(l).toHaveLength(8);
    expect(onRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: "new", refreshToken: "r2" }));
  });

  it("throws StravaRateLimitError on 429", async () => {
    const fetchImpl = vi.fn(() => Promise.resolve(json({ message: "Rate Limit Exceeded" }, 429)));
    const c = new StravaClient(fresh(), noRefresh, fetchImpl);
    await expect(c.getActivity(1)).rejects.toBeInstanceOf(StravaRateLimitError);
  });

  it("lists activities with paging params", async () => {
    const fetchImpl = vi.fn((url: string | URL) => {
      const u = new URL(String(url));
      expect(u.searchParams.get("page")).toBe("2");
      expect(u.searchParams.get("per_page")).toBe("50");
      expect(u.searchParams.get("after")).toBe("1700000000");
      return Promise.resolve(json([]));
    });
    const c = new StravaClient(fresh(), noRefresh, fetchImpl as unknown as typeof fetch);
    await c.listActivities(2, 50, new Date(1700000000 * 1000));
  });
});
