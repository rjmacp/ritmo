# Ritmo runbook — Stage 1

## One-time setup

1. **Neon**: create project `ritmo`, copy the pooled connection string → `DATABASE_URL`.
2. **Resend**: create API key → `AUTH_RESEND_KEY`; verify a sending domain or use `onboarding@resend.dev` for testing → `EMAIL_FROM`.
3. **Strava app**: https://www.strava.com/settings/api → create app. Authorization Callback Domain = your Vercel domain (no scheme). Copy Client ID/Secret → `STRAVA_CLIENT_ID/SECRET`.
4. **Vercel**: import the GitHub repo, framework Next.js. Add every var from `.env.example`
   (generate `AUTH_SECRET` with `npx auth secret`, random strings for
   `STRAVA_WEBHOOK_VERIFY_TOKEN`, `STRAVA_WEBHOOK_SECRET` and `CRON_SECRET`,
   `NEXT_PUBLIC_APP_URL=https://<your-domain>`). Leave the build command on the default —
   Vercel runs the `vercel-build` script, which is `npm run db:migrate:prod && next build`.
   `db:migrate:prod` migrates only when `VERCEL_ENV=production` and otherwise prints
   `skip migrate (non-production)` and carries on, so **preview deploys never migrate the
   production database**. `npm run build` stays a plain `next build` for local and CI use.
5. Deploy. Sign in with `ALLOWED_EMAIL`, go to Account → Connect Strava. History import starts; watch the Account page.
6. **Webhook**: the callback lives at `/api/strava/webhook/$STRAVA_WEBHOOK_SECRET` — an unguessable
   path segment is the only credential Strava can carry, so treat `STRAVA_WEBHOOK_SECRET` like a
   password (any random URL-safe string; rotate by changing the var and re-running the subscribe
   script). A wrong segment returns 404, not 403. Locally, with `.env.local` filled, run
   `npm run strava:subscribe` once; Strava GETs that URL to verify the `hub.verify_token`, then
   POSTs events on every new run.

## Database driver

The app talks to Neon over the **WebSocket** driver (`drizzle-orm/neon-serverless` + `Pool`), not
neon-http: the ingest pipeline wraps each activity's writes in a real transaction, which HTTP
cannot do. Vercel's Node.js runtime (and local Node 20) has no global `WebSocket`, so
`lib/db/client.ts` sets `neonConfig.webSocketConstructor = ws` — the `ws` package is a **runtime
dependency**, not a dev one. Migrations (`lib/db/migrate.ts`) stay on neon-http; they are a single
batch and need no session.

## Day to day

- New run → Strava → webhook → appears on Runs within a minute or two.
- Missed one? Account → Sync (re-pulls 30 days, in the background — the page comes straight
  back with "Sync started"). The nightly cron does the same at **03:00 UTC**, which is 04:00
  in Lisbon during summer time and 03:00 in winter; Vercel cron schedules are always UTC.
- Sync log on Account shows the last 10 jobs and any error (429 = rate limit, 401 = reconnect Strava).

## Timeouts and the import budget

Vercel's Hobby plan caps a serverless function at **60 s**, so every long-running route sets
`maxDuration = 60` and no single invocation tries to do the whole job:

- A history import processes ~25 runs per invocation, persisting `import_cursor_page` on
  `strava_connections` as it goes. What is left is picked up by the nightly cron, or
  immediately by **Account → Continue now** (`POST /api/strava/import`).
- If an import sits in `running` for more than 24 h the cron marks it `failed` and writes an
  "import stalled" row to the sync log; reconnect Strava to start a fresh one.
- Manual sync and the webhook both hand off to `after()`, so the HTTP response is immediate.

## Local dev

`cp .env.example .env.local`, fill values, `npm run db:migrate`, `npm run dev`. For webhooks locally use `vercel dev` + a tunnel, or just use Sync. `npm run e2e` reads `.env.local` automatically.
