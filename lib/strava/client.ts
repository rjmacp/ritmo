import { env } from "@/lib/env";
import type { StravaDetailedActivity, StravaLap, StravaSummaryActivity, StravaTokenResponse } from "./types";

/** OAuth token set for a connected Strava athlete, as stored/used by Ritmo (camelCase, `expiresAt` as a `Date`). */
export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/** Thrown when Strava responds 429 (rate limit exceeded). */
export class StravaRateLimitError extends Error {
  constructor() {
    super("Strava rate limit exceeded");
  }
}

/** Thrown when Strava responds 401, or a token exchange/refresh fails. */
export class StravaAuthError extends Error {
  constructor() {
    super("Strava authorization invalid");
  }
}

const BASE = "https://www.strava.com/api/v3";
const TOKEN_URL = "https://www.strava.com/oauth/token";
const DEAUTHORIZE_URL = "https://www.strava.com/oauth/deauthorize";

/** POSTs a grant request to Strava's OAuth token endpoint and returns the raw token response. */
async function tokenRequest(body: Record<string, string>, fetchImpl: typeof fetch): Promise<StravaTokenResponse> {
  const res = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_id: env.STRAVA_CLIENT_ID, client_secret: env.STRAVA_CLIENT_SECRET, ...body }),
  });
  if (!res.ok) throw new StravaAuthError();
  return (await res.json()) as StravaTokenResponse;
}

/** Converts Strava's snake_case token response into Ritmo's `StravaTokens` shape. */
export const toTokens = (t: StravaTokenResponse): StravaTokens => ({
  accessToken: t.access_token,
  refreshToken: t.refresh_token,
  expiresAt: new Date(t.expires_at * 1000),
});

/** Exchanges an OAuth authorization code for tokens plus the connecting athlete's id and display name. */
export async function exchangeCode(
  code: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ tokens: StravaTokens; stravaAthleteId: bigint; name: string }> {
  const t = await tokenRequest({ code, grant_type: "authorization_code" }, fetchImpl);
  return {
    tokens: toTokens(t),
    stravaAthleteId: BigInt(t.athlete?.id ?? 0),
    name: [t.athlete?.firstname, t.athlete?.lastname].filter(Boolean).join(" "),
  };
}

/** Exchanges a refresh token for a new access/refresh token pair. */
export async function refreshTokens(refreshToken: string, fetchImpl: typeof fetch = fetch): Promise<StravaTokens> {
  return toTokens(await tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" }, fetchImpl));
}

/** Thin Strava API v3 client: refreshes expired tokens before each call and maps 429/401 to typed errors. */
export class StravaClient {
  constructor(
    private tokens: StravaTokens,
    private onRefresh: (t: StravaTokens) => Promise<void>,
    private fetchImpl: typeof fetch = fetch,
  ) {}

  private async ensureFresh(): Promise<void> {
    if (this.tokens.expiresAt.getTime() - Date.now() > 60_000) return;
    this.tokens = await refreshTokens(this.tokens.refreshToken, this.fetchImpl);
    await this.onRefresh(this.tokens);
  }

  private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    await this.ensureFresh();
    const url = new URL(BASE + path);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await this.fetchImpl(url, { headers: { Authorization: `Bearer ${this.tokens.accessToken}` } });
    if (res.status === 429) throw new StravaRateLimitError();
    if (res.status === 401) throw new StravaAuthError();
    if (!res.ok) throw new Error(`Strava ${String(res.status)} for ${path}`);
    return (await res.json()) as T;
  }

  /** Lists the authenticated athlete's activities, most recent first, optionally filtered to after a given date. */
  listActivities(page = 1, perPage = 50, after?: Date): Promise<StravaSummaryActivity[]> {
    const params: Record<string, string> = { page: String(page), per_page: String(perPage) };
    if (after) params.after = String(Math.floor(after.getTime() / 1000));
    return this.get<StravaSummaryActivity[]>("/athlete/activities", params);
  }

  /** Fetches one activity's full detail. */
  getActivity(id: number | bigint): Promise<StravaDetailedActivity> {
    return this.get<StravaDetailedActivity>(`/activities/${String(id)}`);
  }

  /** Fetches one activity's laps. */
  getLaps(id: number | bigint): Promise<StravaLap[]> {
    return this.get<StravaLap[]>(`/activities/${String(id)}/laps`);
  }

  /** Revokes Ritmo's access to the athlete's Strava account. */
  async deauthorize(): Promise<void> {
    // A stale access token would make Strava ignore the revocation, leaving Ritmo
    // authorised on the athlete's account after they disconnected.
    await this.ensureFresh();
    await this.fetchImpl(DEAUTHORIZE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.tokens.accessToken}` },
    });
  }
}

/** Waits `ms` milliseconds; at 1 request/second, a full history import stays well inside Strava's 100 req / 15 min limit. */
export const throttle = (ms = 1000): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
