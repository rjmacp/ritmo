# Final-review fix wave — Stage 1 (single dispatch)

Repo: /home/rjmac/personal/repositories/ritmo (Next.js 15.5, TS strict, Drizzle, Neon, Auth.js v5 beta, Vitest + PGlite, Playwright). Work on `main`, commit in logical Conventional-Commit chunks (one per numbered group below is ideal), `git push` after each, and confirm CI green at the end (`gh run watch`). All gates must stay green: `npm run lint && npm run typecheck && npm run format:check && npm test && npm run build` (fake env: values from `tests/setup.ts`, `DATABASE_URL=postgres://ci:ci@localhost/ci`). No `console`; one-line JSDoc on exports; no `any`; `AnyDb` from `@/lib/db/types`; production code never imports `tests/`.

Rulings (controller) are final — implement as written. Cite the final review's file:line references when in doubt; they are accurate at HEAD `e3a725a`.

## 1. Critical — resumable history import (`feat: resumable history import with cursor and watchdog`)

- Schema: add to `strava_connections`: `importCursorPage integer not null default 1`, `importStartedAt timestamptz null`. Generate a new drizzle migration (`npm run db:generate`) and commit it.
- `lib/pipeline/importHistory.ts`: add `ImportOptions.maxActivities?: number` (default 25) and `opts.startPage?` ; the loop processes at most `maxActivities` runs per invocation, persisting `importCursorPage` after each completed page; when a full pass finishes (empty page) set `importStatus = "done"`, `importCursorPage = 1`, `lastSyncAt = now`. If the budget is exhausted mid-way, leave `importStatus = "running"` and return `{ processed, done: false }`; otherwise `{ processed, done: true }`. Keep the throttling. Bookkeeping (`importStatus`, `importedCount`, `importStartedAt`) happens ONLY when `kind === "import"` (see #5).
- New `lib/pipeline/continueImport.ts`: `continueImport(dbc, athleteId, client)` — if `importStatus === "running"`, call `importHistory` from `importCursorPage` with the default budget; exported with JSDoc.
- Watchdog: in the cron route, for any connection with `importStatus === "running"` and `importStartedAt` older than 24 h with no progress, mark `importStatus = "failed"` and write a `sync_log` row (kind `import`, status failed, error "import stalled"). Otherwise the cron calls `continueImport` first, then `syncRecent`.
- Callback route: set `export const maxDuration = 60;` and start the import with the default budget inside `after()`; the Account page copy for `running` becomes "Importing… N runs so far — continues automatically" and shows a "Continue now" button posting to a new `POST /api/strava/import` route (requireAthlete → `continueImport` inside `after()` → 303 to `/account`).
- Tests (PGlite): budget exhaustion persists cursor and status `running`; a second call resumes from the cursor and completes; full pass resets cursor and sets `done`. Keep existing import tests passing (update expectations where the contract changed).

## 2. Critical — webhook secret path (`fix: secret webhook path; route-level security tests`)

- New env `STRAVA_WEBHOOK_SECRET` (add to `lib/env.ts`, `.env.example`, `tests/setup.ts`, CI env in `.github/workflows/ci.yml`, runbook). Move the route to `app/api/strava/webhook/[secret]/route.ts`; both GET and POST return 404 unless the `secret` param equals `env.STRAVA_WEBHOOK_SECRET` compared with `crypto.timingSafeEqual` on equal-length buffers (helper `safeEqual(a, b)` in `lib/security.ts`, with JSDoc and a unit test). Use the same helper for the cron bearer check.
- `scripts/strava-subscribe.ts` registers `${APP_URL}/api/strava/webhook/${STRAVA_WEBHOOK_SECRET}`; `middleware.ts` matcher excludes `api/strava/webhook` (prefix still correct); `e2e/smoke.spec.ts` hits the secret path (skip if either env var missing); runbook updated.
- Route-level tests (Vitest, calling the exported handlers with `new Request(...)`, DB via PGlite where needed, Strava client stubbed): webhook GET wrong secret → 404, right secret wrong token → 403, right both → 200 with challenge; webhook POST wrong secret → 404; cron GET without bearer → 401, with bearer → 200; `/api/strava/callback` state mismatch → redirect `?error=state`, missing scope → `?error=scope` (mock `requireAthlete` via `vi.mock("@/lib/auth")`).

## 3. Important — middleware actually authorises (`fix: enforce session in middleware; gate stub pages`)

- `lib/auth.ts`: add `callbacks.authorized: ({ auth }) => !!auth?.user` so `middleware.ts` redirects unauthenticated requests to `/signin`. Keep the matcher.
- Add `await requireAthlete()` to `app/(app)/plan/page.tsx`, `trends/page.tsx`, `records/page.tsx` and mark them `dynamic = "force-dynamic"`.

## 4. Important — transactions (`feat: neon-serverless driver with withTx for atomic pipeline writes`)

- `npm i ws && npm i -D @types/ws`. `lib/db/client.ts`: switch to `drizzle-orm/neon-serverless` with `Pool` from `@neondatabase/serverless`; set `neonConfig.webSocketConstructor = ws` when `typeof WebSocket === "undefined"`. Keep `db` export name.
- `lib/db/types.ts`: `AnyDb = NeonDatabase<typeof schema> | PgliteDatabase<typeof schema>`; add `export async function withTx<T>(dbc: AnyDb, fn: (tx: AnyDb) => Promise<T>): Promise<T>` that calls `dbc.transaction(fn)` (cast the tx handle to `AnyDb`). JSDoc.
- `lib/pipeline/processActivity.ts`: wrap activity upsert + lap upsert/prune + `afterUpsert` in `withTx`. Existing tests must still pass (PGlite supports transactions); add one test that a failure inside `afterUpsert` (temporarily injected via a test-only override hook param, e.g. optional `opts.afterUpsert`) rolls back the lap changes.
- `lib/db/migrate.ts` may keep neon-http (migrations are fine over HTTP) — or switch; either is acceptable. Document the driver change in the runbook (Vercel Node runtime; `ws` required locally).

## 5. Important — sync reuse defects (`fix: scope import bookkeeping to imports; async manual sync`)

- `importHistory`: import bookkeeping only for `kind === "import"` (see #1). On a fresh full import (`startPage === 1` and kind import) reset `importedCount = 0` and set `importStartedAt = now`.
- `app/api/sync/route.ts`: run `syncRecent` inside `after()`, redirect 303 to `/account?sync=started`; Account shows a "Sync started — refresh in a minute" notice for that param; remove `maxDuration = 60` if no longer needed. Runs page no longer receives `?synced=`; delete that branch.
- Extract a `setConnectionFields(dbc, athleteId, patch)` helper in `lib/strava/connection.ts` and use it for the repeated `stravaConnections` updates.

## 6. Important — correctness one-liners (`fix: lap table zero-distance guard; deauthorize refresh`)

- `components/LapTable.tsx` and `components/KmBars.tsx`: paces computed with a guard (`distanceM > 0 ? movingS / distanceM * 1000 : null`); rows with null pace render "—" and no bar; `mx/mn` computed over non-null paces only; if fewer than 1 valid pace, render without bars.
- `lib/strava/client.ts`: `deauthorize()` calls `await this.ensureFresh()` first. `app/api/strava/disconnect/route.ts`: attempt deauthorize; on failure log and still delete locally (ruling: local disconnect must always succeed), but pass `?warn=revoke` so Account can show "Could not revoke on Strava — remove Ritmo at strava.com/settings/apps". Unit test for `deauthorize` refreshing and for the 401 → `StravaAuthError` path.

## 7. Important — public face (`docs: screenshots, changelog, runbook caveats`)

- `docs/screens/home.png`, `runs.png`, `trends.png`: render from the design mocks — for each of `design/midnight/Main.dc.html`, `Runs.dc.html`, `Trends.dc.html`: strip `<script src="./support.js"></script>`, `<x-dc>`, `</x-dc>`, `<helmet>`, `</helmet>` and the trailing `<script data-dc-script…>…</script>` block into a temp HTML file, then `google-chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars --window-size=390,930 --screenshot=<out> file://<tmp>` (Chrome is at /usr/bin/google-chrome). Label the README table "Design mockups (Stage 1 ships Runs and Account; Home/Trends arrive in later stages)".
- `CHANGELOG.md`: collapse to one "Stage 1 — Ingest (2026-08-21)" section listing what shipped, including this fix wave.
- `docs/runbook.md`: Vercel Hobby 60 s function ceiling (cron `maxDuration` set to 60); build command ruling: set `"build": "next build"` and add `"vercel-build": "npm run db:migrate:prod && next build"` where `db:migrate:prod` is `node -e "process.exit(process.env.VERCEL_ENV==='production'?0:1)" && tsx lib/db/migrate.ts || echo 'skip migrate (non-production)'` — document that previews never migrate production. Note cron is UTC (03:00 UTC = 04:00 Lisbon in summer).
- `app/api/cron/sync/route.ts`: `maxDuration = 60`, JSDoc on it.

## 8. Promoted a11y/UX one-liners (`fix: account a11y; sign-in error message`)

- `app/(app)/account/page.tsx`: back link gets `aria-label="Back to runs"` and visible "Runs" text like the detail page; move the Save `<button>` outside the `<label>` (use `htmlFor`/`id`); add `secure: process.env.NODE_ENV === "production"` to the OAuth state cookie in `app/api/strava/connect/route.ts`.
- `app/(auth)/signin/actions.ts`: on a non-allowed email, do NOT throw — redirect to `/signin?sent=1` exactly as for an allowed one (no enumeration oracle); update the sign-in page copy to "If that address is registered, a sign-in link is on its way."

## Report

Append a "Final fix wave" section to `/home/rjmac/personal/repositories/ritmo/.superpowers/sdd/2026-08-20-stage-1-ingest/final-fix-report.md` (create it): per group, what changed, covering tests and their output, commit SHAs, CI run id and result, anything you could not do and why. Reply with ONLY: **Status:**; commit list; one-line gate summary incl. CI; concerns; report path.
