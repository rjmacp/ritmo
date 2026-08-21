import { it, expect } from "vitest";
import { authorizeUrl } from "@/lib/strava/oauth";

it("builds the Strava authorize URL with the right scope and callback", () => {
  const u = new URL(authorizeUrl("abc"));
  expect(u.origin + u.pathname).toBe("https://www.strava.com/oauth/authorize");
  expect(u.searchParams.get("client_id")).toBe("1");
  expect(u.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/strava/callback");
  expect(u.searchParams.get("scope")).toBe("read,activity:read_all");
  expect(u.searchParams.get("approval_prompt")).toBe("auto");
  expect(u.searchParams.get("state")).toBe("abc");
});
