# Changelog

## Stage 1 — Ingest (2026-08-21)

The whole ingest path, end to end: sign in, connect Strava, and every run lands in the
database and on screen without further intervention.

- **Auth** — Resend magic-link sign-in, gated to one allow-listed athlete. The middleware
  enforces the session; the sign-in form gives the same answer for any address, so it
  cannot be used to tell which one is registered.
- **Strava** — OAuth connect/disconnect (revoking on Strava on the way out), resumable
  history import with a persisted page cursor and a 24 h stall watchdog, webhook deliveries
  behind an unguessable secret path, nightly cron sweep and an on-demand manual sync. All
  of it flows through one pipeline (`lib/pipeline/processActivity`), writing each activity
  and its laps in a single transaction over Neon's WebSocket driver.
- **Screens** — Runs feed with month summary, type filters and per-km HR-zone bars; Run
  detail with laps and time in zone; Account with connection state, max HR, HR zones and a
  sync log. Plan/Trends/Records are signed-in stubs for later stages.
- **Platform** — PWA manifest and icons, CI (lint, typecheck, format, Vitest + PGlite,
  build), Playwright smoke tests, and a [deployment runbook](docs/runbook.md).
