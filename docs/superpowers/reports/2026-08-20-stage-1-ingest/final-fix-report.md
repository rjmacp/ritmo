# Final fix wave — implementation report

Branch `main`, base `e3a725a`, head `436f1e0`. Eight commits, one per brief group, each
pushed and CI-green on its own. Gates run locally before every commit:
`npm run lint && npm run typecheck && npm run format:check && npm test && npm run build`.

Test suite grew from 41 to 59 tests (15 → 17 files); all green.

## 1. Resumable history import — `c31e9db` _feat: resumable history import with cursor and watchdog_

- **Schema**: `strava_connections.import_cursor_page integer not null default 1` and
  `import_started_at timestamptz null`; migration `drizzle/0001_nasty_vision.sql`
  (generated with `npm run db:generate`).
- **`lib/pipeline/importHistory.ts`** rewritten: `ImportOptions.maxActivities` (default 25,
  exported as `DEFAULT_MAX_ACTIVITIES`) and `startPage`; returns `{ processed, done }`.
  Bookkeeping (`importStatus`, `importedCount`, `importStartedAt`, `importCursorPage`) only
  when `kind === "import"`. A fresh pass (`startPage === 1`) resets `importedCount` and
  stamps `importStartedAt`. A finished pass (empty page) sets `importStatus = "done"`,
  `importCursorPage = 1`, `lastSyncAt = now`; an exhausted budget leaves `running` and
  returns `done: false`. Throttling unchanged.
- **Detail worth flagging**: the cursor is _page_-granular, so the budget is enforced at
  page boundaries — a page that has been started is always finished. Breaking mid-page
  without an offset column would make a resume replay the same partial page forever and
  never advance (invocation N and N+1 would both stop on the same 25 activities).
  `perPage` is therefore capped at the budget, so one invocation imports at most one
  budget-sized page beyond the threshold. This is documented in the function's JSDoc.
- **`lib/pipeline/continueImport.ts`**: `continueImport(dbc, athleteId, client)` resumes
  from `importCursorPage` when status is `running`, otherwise returns
  `{ processed: 0, done: true }`.
- **Watchdog** in `app/api/cron/sync/route.ts`: any connection `running` with
  `importStartedAt` older than 24 h is set to `failed` and gets a `sync_log` row
  (`kind: "import"`, `status: "failed"`, `error: "import stalled"`). Otherwise the cron
  calls `continueImport` then `syncRecent`, summing both into the per-athlete result.
- **`app/api/strava/callback/route.ts`**: `maxDuration = 60`; the `after()` import uses the
  default budget. **New `app/api/strava/import/route.ts`**: `requireAthlete` →
  `continueImport` inside `after()` → 303 to `/account?import=started`.
- **Account page**: `running` copy is now
  "Importing… N runs so far — continues automatically" with a **Continue now** button
  posting to `/api/strava/import`.
- **Tests** (`tests/integration/importHistory.test.ts`, 6 tests): budget exhaustion
  persists cursor 2 / status `running` / count 2; `continueImport` resumes at the cursor
  (asserting page 1 is never re-fetched), finishes, resets the cursor to 1 and sets
  `done`/`lastSyncAt`; `continueImport` is a no-op once done; a `kind: "cron"` pass leaves
  `importStatus`/`importCursorPage`/`importedCount` untouched. Existing expectations
  updated for the new `{ processed, done }` shape.

## 2. Webhook secret path — `c5ccb57` _fix: secret webhook path; route-level security tests_

- New env `STRAVA_WEBHOOK_SECRET` in `lib/env.ts`, `.env.example`, `tests/setup.ts`,
  `.github/workflows/ci.yml` and the runbook.
- Route moved to `app/api/strava/webhook/[secret]/route.ts` (`git mv`, history preserved).
  Both GET and POST return **404** unless the segment matches, compared with
  `crypto.timingSafeEqual` on equal-length buffers via `safeEqual(a, b)` in
  `lib/security.ts`. The cron bearer check uses the same helper.
- `scripts/strava-subscribe.ts` registers `${APP_URL}/api/strava/webhook/${SECRET}`;
  `e2e/smoke.spec.ts` hits the secret path and skips when either env var is missing;
  `middleware.ts` matcher already excluded the `api/strava/webhook` prefix, which still
  covers the nested path, so it is unchanged (per brief).
- **Tests**: `tests/unit/security.test.ts` (3 tests, incl. unequal lengths and multi-byte
  UTF-8) and `tests/integration/routes.test.ts` (8 tests) which calls the exported handlers
  with `new Request(...)`, backing `@/lib/db/client` with PGlite and stubbing `@/lib/auth`
  and `next/headers`: webhook GET wrong secret → 404, right secret + wrong token → 403,
  both right → 200 with the challenge; webhook POST wrong secret → 404; cron without bearer
  → 401, with bearer → 200; callback state mismatch → `?error=state`, missing scope →
  `?error=scope`.

## 3. Middleware authorisation — `2fc1f66` _fix: enforce session in middleware; gate stub pages_

- `lib/auth.ts`: `callbacks.authorized: ({ auth }) => !!auth?.user`. Matcher unchanged.
- `plan`, `trends`, `records` pages now `await requireAthlete()` and export
  `dynamic = "force-dynamic"` (they were statically prerendered).
- **Verified against a real server**, not just unit tests: `next build` + `next start`,
  then `GET /runs` → 307 to `/signin?callbackUrl=…`, `GET /plan` → 307 likewise,
  `GET /api/strava/webhook/wrong…` → 404, `…/<right secret>` → 200,
  `GET /api/cron/sync` → 401. This also confirmed the new `ws` dependency does not break
  the Edge middleware bundle (it is not bundled into it).

## 4. Transactions — `5060fb9` _feat: neon-serverless driver with withTx for atomic pipeline writes_

- `npm i ws`, `npm i -D @types/ws`. `lib/db/client.ts` now uses
  `drizzle-orm/neon-serverless` with `Pool` from `@neondatabase/serverless`, setting
  `neonConfig.webSocketConstructor = ws` when `typeof WebSocket === "undefined"`. The `db`
  export name is unchanged.
- `lib/db/types.ts`: `AnyDb = NeonDatabase<typeof schema> | PgliteDatabase<typeof schema>`
  plus `withTx<T>(dbc, fn)`. The union has no callable `transaction` signature, so the
  handle is narrowed through a small local `TxCapable` interface rather than `any`.
- `lib/pipeline/processActivity.ts`: activity upsert + lap upsert/prune + `afterUpsert` all
  run inside `withTx`. New optional `opts.afterUpsert` override exists so tests can inject
  a failing post-write step.
- `lib/db/migrate.ts` keeps neon-http (documented). Driver change documented in the runbook,
  including that `ws` is a **runtime** dependency.
- **Tests**: `tests/integration/processActivity.test.ts` gains a rollback test — a rejecting
  `afterUpsert` leaves the previous 8 laps and the previous name intact. All five existing
  tests still pass, including the concurrent-upsert one (PGlite handles the nested calls).

## 5. Sync reuse defects — `19f56a9` _fix: scope import bookkeeping to imports; async manual sync_

- Import bookkeeping scoped to `kind === "import"` (implemented in group 1, covered by the
  `kind: "cron"` test there). `lastSyncAt` is deliberately still written for every completed
  pass, import or not — it is the "last synced" display value, not import bookkeeping.
- `app/api/sync/route.ts`: `syncRecent` moved inside `after()`, 303 to
  `/account?sync=started`, `maxDuration` removed. Account renders
  "Sync started — refresh in a minute." for that param.
- Runs page no longer accepts or renders `?synced=`.
- `setConnectionFields(dbc, athleteId, patch)` added to `lib/strava/connection.ts` (typed
  with `PgUpdateSetSource<typeof stravaConnections>` so `sql` increments still work) and is
  now the only place that updates that table; `updateTokens`, `importHistory` and the cron
  watchdog all go through it. **Deviation**: the helper had to land in the group-1 commit
  because the rewritten `importHistory` depends on it; group 5's commit converts the
  remaining call sites.

## 6. Correctness one-liners — `c1003d7` _fix: lap table zero-distance guard; deauthorize refresh_

- `components/LapTable.tsx` / `components/KmBars.tsx`: pace is
  `distanceM > 0 ? movingS / distanceM * 1000 : null`; `mx`/`mn` come from non-null paces
  only. LapTable renders "—" and an empty bar track for a null-pace lap; KmBars renders a
  flex spacer instead of a bar and returns `null` when no valid pace remains.
- `lib/strava/client.ts`: `deauthorize()` calls `await this.ensureFresh()` first.
- `app/api/strava/disconnect/route.ts`: revocation is attempted, failures are logged, the
  local connection is **always** deleted, and a failure redirects with `?warn=revoke`;
  Account shows "Could not revoke on Strava — remove Ritmo at strava.com/settings/apps".
- **Tests**: `tests/unit/strava-client.test.ts` gains three — 401 → `StravaAuthError`, a
  rejected refresh → `StravaAuthError`, and `deauthorize()` on an expired token hitting
  `/oauth/token` first and then posting `/oauth/deauthorize` with the _new_ bearer.

## 7. Public face — `436f1e0` _docs: screenshots, changelog, runbook caveats_

- `docs/screens/{home,runs,trends}.png` rendered from `design/midnight/{Main,Runs,Trends}.dc.html`
  exactly as specified (support.js / `<x-dc>` / `<helmet>` / trailing `data-dc-script` block
  stripped into a temp file, then headless Chrome at 390×930). The README table is now
  captioned "Design mockups (Stage 1 ships Runs and Account; Home/Trends arrive in later
  stages)". Previously all three images were broken links.
- `CHANGELOG.md` collapsed to a single "Stage 1 — Ingest (2026-08-21)" section covering the
  whole stage including this fix wave.
- `package.json`: `"build": "next build"` (unchanged) plus `"vercel-build"` =
  `npm run db:migrate:prod && next build`, where `db:migrate:prod` is the
  `VERCEL_ENV==='production'` guard from the brief. Verified locally:
  `VERCEL_ENV=preview npm run db:migrate:prod` prints `skip migrate (non-production)` and
  exits 0.
- `docs/runbook.md`: Vercel Hobby 60 s ceiling and the import budget it sizes, the
  `vercel-build` ruling and why previews never migrate production, cron schedules being UTC
  (03:00 UTC = 04:00 Lisbon in summer), the webhook secret path, and the driver change.
- `app/api/cron/sync/route.ts`: `maxDuration = 60` with a JSDoc line explaining why.

## 8. a11y / UX — `cca57e2` _fix: account a11y; sign-in error message_

- Account back link: `aria-label="Back to runs"` and visible "← Runs" text matching the
  detail page. The max-HR Save `<button>` moved out of the `<label>`, which is now paired
  to the input via `htmlFor`/`id` (clicking the label text used to submit the form).
- `app/api/strava/connect/route.ts`: OAuth state cookie gets
  `secure: process.env.NODE_ENV === "production"`.
- `app/(auth)/signin/actions.ts`: a non-allowed email no longer throws — it redirects to
  `/signin?sent=1` exactly as an allowed one does. Sign-in copy is now "If that address is
  registered, a sign-in link is on its way."

## Gates and CI

| Gate                   | Result                                                      |
| ---------------------- | ----------------------------------------------------------- |
| `npm run lint`         | clean                                                       |
| `npm run typecheck`    | clean                                                       |
| `npm run format:check` | clean                                                       |
| `npm test`             | 17 files, 59 tests, all passing                             |
| `npm run build`        | success (only the pre-existing `jose` Edge-runtime warning) |

CI on GitHub Actions is green for all eight pushes; the head commit `436f1e0` is run
[**32454911765**](https://github.com/rjmacp/ritmo/actions/runs/32454911765) — **success**.
Earlier commits: 32453700129, 32454009906, 32454384861, 32454518280, 32454579565,
32454701763, 32454791747 — all success.

## Nothing was skipped

Every item in the brief is implemented. Two things the reviewer should look at deliberately:

1. **Page-granular budget** (group 1) — the budget is checked at page boundaries, not
   mid-page, for the resume-progress reason explained above. Only `importCursorPage` is
   persisted, so a mid-page stop cannot be resumed accurately.
2. **`setConnectionFields` landed in the group-1 commit** rather than group 5's, because
   the rewritten `importHistory` uses it.

Also noted, outside this wave's scope: the open Dependabot PR
(`dependabot/npm_and_yarn/minor-and-patch-479fbeca4e`) has a failing CI run. It is on its
own branch and predates this work; `main` is unaffected.

## 9. Follow-up ruling — `6e4f03e` _fix: drop Edge middleware; per-route session checks only_

The scoped re-review caught that group 3's fix was the wrong fix. `middleware.ts` re-exported
`auth` from `lib/auth.ts`, which is wired to the Drizzle adapter and therefore **database**
sessions — so the `authorized` callback added in `2fc1f66` would have had to read the session
table from Next's Edge runtime, through the `neon-serverless` + `ws` driver that group 4
introduced. `ws` is Node-only, so on Vercel that would fail for precisely the authenticated
requests the callback was meant to let through.

Per the controller's ruling:

- **Deleted `middleware.ts`** entirely and removed `callbacks.authorized` from `lib/auth.ts`.
  The build no longer emits a middleware bundle (`middleware-manifest.json` is now empty).
- **Audited every route** for a per-route check. All six `app/**/page.tsx` under `(app)` and
  all five session-bearing `app/api/**/route.ts` already call `requireAthlete()` after this
  wave, so nothing had to be added. The deliberate exceptions are `/signin` and
  `/api/auth/*` (public), `/api/cron/sync` (bearer secret), `/api/strava/webhook/[secret]`
  (secret path segment) and `app/page.tsx` (a bare `redirect("/runs")` into a protected page).
- **Documented** in `docs/runbook.md` (new "Route protection" section) and `SECURITY.md`:
  route protection is per-route via `requireAthlete()`; there is no Edge middleware because
  sessions live in Postgres — and any new route must add its own check. The changelog's auth
  bullet no longer claims the middleware enforces the session.

**Verification.** Against `next build` + `next start` (a stale server from the earlier
group-3 check was still holding the port and had to be killed first — the first run of these
checks was reading the old build):

| Request                                                 | Result          |
| ------------------------------------------------------- | --------------- |
| `GET /`                                                 | 307 → `/runs`   |
| `GET /runs`, `/plan`, `/trends`, `/records`, `/account` | 307 → `/signin` |
| `POST /api/sync`                                        | 307 → `/signin` |
| `GET /signin`                                           | 200             |
| `GET /api/strava/webhook/<wrong>`                       | 404             |
| `GET /api/strava/webhook/<right>`                       | 200             |
| `GET /api/cron/sync` (no bearer)                        | 401             |

The Playwright smoke suite also passes against that server — both tests, including
"unauthenticated /runs redirects to sign-in", which `requireAthlete()`'s redirect satisfies
on its own. (It was run with a throwaway config pointed at the running server, since port
3000 was occupied by an unrelated project; the config was deleted immediately and the tree is
clean.)

Gates all green again: lint, typecheck, format:check, 17 files / 59 tests, build. CI run
[**32456071728**](https://github.com/rjmacp/ritmo/actions/runs/32456071728) on `6e4f03e` —
**success**. New head is `6e4f03e`; nine commits on top of `e3a725a`.
