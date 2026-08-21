import { env } from "@/lib/env";

/** Builds the Strava OAuth authorize URL for the given CSRF `state`, requesting run-history scope. */
export function authorizeUrl(state: string): string {
  const u = new URL("https://www.strava.com/oauth/authorize");
  u.searchParams.set("client_id", env.STRAVA_CLIENT_ID);
  u.searchParams.set("redirect_uri", `${env.APP_URL}/api/strava/callback`);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("approval_prompt", "auto");
  u.searchParams.set("scope", "read,activity:read_all");
  u.searchParams.set("state", state);
  return u.toString();
}
