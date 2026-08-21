# Ritmo runbook — Stage 1

## One-time setup

1. **Neon**: create project `ritmo`, copy the pooled connection string → `DATABASE_URL`.
2. **Resend**: create API key → `AUTH_RESEND_KEY`; verify a sending domain or use `onboarding@resend.dev` for testing → `EMAIL_FROM`.
3. **Strava app**: https://www.strava.com/settings/api → create app. Authorization Callback Domain = your Vercel domain (no scheme). Copy Client ID/Secret → `STRAVA_CLIENT_ID/SECRET`.
4. **Vercel**: import the GitHub repo, framework Next.js. Add every var from `.env.example` (generate `AUTH_SECRET` with `npx auth secret`, random strings for `STRAVA_WEBHOOK_VERIFY_TOKEN` and `CRON_SECRET`, `NEXT_PUBLIC_APP_URL=https://<your-domain>`). Build command: `npm run db:migrate && next build`.
5. Deploy. Sign in with `ALLOWED_EMAIL`, go to Account → Connect Strava. History import starts; watch the Account page.
6. **Webhook**: locally, with `.env.local` filled, run `npm run strava:subscribe` once. Strava calls `GET /api/strava/webhook` to verify, then sends events on every new run.

## Day to day

- New run → Strava → webhook → appears on Runs within a minute or two.
- Missed one? Account → Sync (re-pulls 30 days). Nightly cron does the same at 03:00.
- Sync log on Account shows the last 10 jobs and any error (429 = rate limit, 401 = reconnect Strava).

## Local dev

`cp .env.example .env.local`, fill values, `npm run db:migrate`, `npm run dev`. For webhooks locally use `vercel dev` + a tunnel, or just use Sync.
