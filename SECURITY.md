# Security

Report vulnerabilities privately via GitHub Security Advisories on this repository. Do not open public issues for security problems.
Secrets live only in Vercel env vars and `.env.local` (git-ignored). Strava tokens are stored server-side and never sent to the browser.

## Route protection

Route protection is per-route via `requireAthlete()`; there is no Edge middleware, because
sessions live in Postgres and the Edge runtime cannot reach them through the Node-only
WebSocket database driver. Every page and API route that needs a session calls
`requireAthlete()`, which redirects to `/signin` when there is none. The exceptions are
`/signin` and `/api/auth/*` (public), `/api/cron/sync` (bearer secret) and
`/api/strava/webhook/[secret]` (unguessable path segment, compared in constant time). Any new
route must add its own check.
