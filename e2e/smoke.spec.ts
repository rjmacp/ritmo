import { test, expect } from "@playwright/test";
test("unauthenticated /runs redirects to sign-in", async ({ page }) => {
  await page.goto("/runs");
  await expect(page).toHaveURL(/\/signin/);
  await expect(page.getByRole("button", { name: /send sign-in link/i })).toBeVisible();
});
test("webhook challenge answers with the right token", async ({ request }) => {
  const token = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN ?? "";
  test.skip(!token, "STRAVA_WEBHOOK_VERIFY_TOKEN not set");
  const r = await request.get(`/api/strava/webhook?hub.mode=subscribe&hub.verify_token=${token}&hub.challenge=abc`);
  expect(r.status()).toBe(200);
  expect(await r.json()).toEqual({ "hub.challenge": "abc" });
});
