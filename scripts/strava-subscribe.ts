/**
 * One-time setup script: registers Ritmo's webhook callback URL as a Strava push subscription.
 * Run locally with env loaded, e.g. `npm run strava:subscribe` (uses `tsx --env-file=.env.local`).
 */
export {}; // top-level await requires this file to be a module

const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_WEBHOOK_VERIFY_TOKEN, NEXT_PUBLIC_APP_URL } = process.env;
const res = await fetch("https://www.strava.com/api/v3/push_subscriptions", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    client_id: STRAVA_CLIENT_ID,
    client_secret: STRAVA_CLIENT_SECRET,
    callback_url: `${NEXT_PUBLIC_APP_URL}/api/strava/webhook`,
    verify_token: STRAVA_WEBHOOK_VERIFY_TOKEN,
  }),
});
process.stdout.write(`${res.status} ${await res.text()}\n`);
