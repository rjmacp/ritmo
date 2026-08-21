# SDD ledger — plan: docs/superpowers/plans/2026-08-20-stage-1-ingest.md

Spec: docs/superpowers/specs/2026-08-20-ritmo-design.md (read; binding authority)

## Setup rulings

- Ruling: implement directly on `main`, no worktree — the user explicitly asked to "keep committing to main so the process is saved" (public repo rjmacp/ritmo); pushes after each task are therefore authorised — cost if wrong: a broken main visible publicly, recoverable by revert.
- Ruling: `AnyDb` must NOT import from `tests/` (plan T3 does so). Define it in `lib/db/types.ts` as a union of `NeonHttpDatabase<typeof schema>` and `PgliteDatabase<typeof schema>` (PGlite is a devDependency; type-only import is fine) — why: production code must not depend on test helpers — cost if wrong: a type-only coupling, trivial to change.

## Pre-flight conflict scan

| Pair / task   | Produces vs consumes                                                                     | Finding                                                                                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T1 ↔ T1b      | scaffold eslint config vs replacement eslint.config.mjs                                  | T1b replaces; T1 must not hand-edit scaffold lint. OK                                                                                                                                                                          |
| T2 ↔ T3       | Auth.js tables (users/accounts/sessions/verificationTokens) vs DrizzleAdapter args       | names match. OK                                                                                                                                                                                                                |
| T2 ↔ T6       | NewActivity columns vs processActivity stravaFields                                      | every field in stravaFields exists in schema (source, stravaId, startedAt, timezone, name, distanceM, movingS, elapsedS, avgPaceSPerKm, avgHr, maxHr, avgCadence, elevationGainM, calories, startLat, startLng, updatedAt). OK |
| T3 ↔ T6–T13   | AnyDb type                                                                               | see ruling above (moved to lib/db/types.ts)                                                                                                                                                                                    |
| T4 ↔ T7/T9    | StravaClient.listActivities/getActivity/getLaps/deauthorize; throttle                    | used identically. OK                                                                                                                                                                                                           |
| T5 ↔ T6       | NormalisedActivity/NormalisedLap                                                         | lap fields {index,distanceM,movingS,avgHr,maxHr,avgCadence,elevationGainM} match laps insert (NewLap has extra nullable cols). OK                                                                                              |
| T7 ↔ T8/T9    | saveConnection/clientForAthlete/deleteConnection/athleteIdForStravaAthlete/getConnection | all defined in T7 connection.ts. OK                                                                                                                                                                                            |
| T10 ↔ T11/T12 | Boundaries/zoneFor/ZONE_COLORS/listActivities/getActivity/monthSummary/ActivityWithLaps  | consistent. OK                                                                                                                                                                                                                 |
| T11           | moves app/runs → app/(app)/runs; T1 page.tsx redirects to /runs                          | route unchanged. OK                                                                                                                                                                                                            |
| T12 test      | constructs Lap objects with all nullable cols                                            | matches schema incl. elevationLossM/gapSPerKm. OK                                                                                                                                                                              |
| T13 ↔ T3      | setMaxHr added to lib/db/athlete.ts                                                      | OK                                                                                                                                                                                                                             |
| T14 CI        | typecheck/format:check scripts from T1b                                                  | OK                                                                                                                                                                                                                             |
| T1 self       | env.RESEND_API_KEY reads AUTH_RESEND_KEY                                                 | consistent with .env.example. OK                                                                                                                                                                                               |
| T8 self       | callback uses `after` from next/server (Next 15)                                         | OK; implementer should verify Next version ≥15.1                                                                                                                                                                               |

Scan result: one ruling (AnyDb), no other conflicts.

## Task log

- Task 1+1b: dispatched (BASE 7ee3918, implementer sonnet)
- Task 1+1b: implemented (commits 338c255, b4e1743; pushed). Ruling: keep Next pinned at 15.5.x rather than @latest (16) — spec says Next.js 15; upgrade is a later chore — cost if wrong: a planned major upgrade later. Ruling: `tests/unit/smoke.test.ts` not needed (format/env tests cover) — cost: none. Note: 3 npm audit highs inherited from Next 15 deps (postcss/sharp) — defer to Next 16 upgrade.
- Task 1+1b: review dispatched (sonnet) on review-7ee3918..b4e1743.diff
- Task 1+1b: review → Needs fixes (Important: missing JSDoc on exports; no-console allowlist). Ruling: `no-console: "error"` with no allowlist — the global constraint ("use lib/log.ts, no console") outranks the plan snippet's allowlist — cost if wrong: slightly stricter lint, trivially relaxed. Minor deferred: manifest 404 until T14 (expected); import/order internal-regex fragility; npm audit highs (Next 15 deps).
- Task 1+1b: fix round 1/5 dispatched (resume implementer) — JSDoc, no-console, engines, prune SVGs.
- Task 1+1b: fix round 1/5 (7 addressed, 0 open; commits b4e1743..5c38838)
- Task 1+1b: complete (commits 7ee3918..5c38838, review clean)
- Task 2: dispatched (BASE 5c38838, implementer sonnet)
- Task 2: implemented (70821ba; pushed). Ruling: tsconfig target ES2020 (BigInt literals) and env.DATABASE_URL in migrate.ts — both required by our own lint/TS settings — cost: none.
- Task 2: complete (commits 5c38838..70821ba, review clean). Minor (deferred): StravaConnection type exported (useful); generated drizzle files lack trailing newline (excluded from prettier via drizzle/meta? sql not — watch format:check on regen).
- Task 3: dispatched (BASE 70821ba, implementer sonnet)
- Task 3: implemented (ccbe457; pushed). Note: build needs a well-formed DATABASE_URL (neon() validates) — CI env uses postgres://ci:ci@localhost/ci which is well-formed; Edge-runtime jose warning from next-auth is benign.
- Task 3: complete (commits 70821ba..ccbe457, review clean). Minor (deferred): ensureAthlete select-then-insert race (use onConflict); middleware DB-session round-trip latency (consider JWT strategy later); signin action error UX.
- Task 4: dispatched (BASE ccbe457, implementer sonnet)
- Task 4: implemented (00bae43; pushed). Ruling: `npm run lint` (next lint) skips tests/**; change the lint script to `eslint .` in Task 14 so CI covers tests — cost if wrong: CI slightly slower.
- Task 4: complete (commits ccbe457..00bae43, review clean). Minor (deferred): no test for 401→StravaAuthError or deauthorize(); deauthorize doesn't ensureFresh first.
- Task 5: dispatched (BASE 00bae43, implementer haiku)
- Task 5: implemented (df2d15f). Ruling: raw_json must include laps (`raw: { activity, laps }`) per spec 'keep everything Strava sends'; the brief's test assertion on raw.id was the defect, amended — cost if wrong: slightly larger raw_json rows. Pre-review fix dispatched (resume implementer).
- Task 5: complete (commits 00bae43..a2a5209, review clean). Minor (deferred): NormalisedLap JSDoc copy-paste; inferType fast-block branch untested; no test for missing optional fields.
- Task 6: dispatched (BASE a2a5209, implementer sonnet)
- Task 6: implemented (0eb5207; pushed). Review: Approved with 2 Important flags. Ruling: fix the insert race now via onConflictDoUpdate (CASE on type_overridden) — cost if wrong: a more complex statement. Ruling: parked — non-atomic lap delete+insert (neon-http has no transactions; AnyDb union hides batch) — real, deferred to Stage 2 (consider neon websocket driver or batch behind an interface). Minor (deferred): syncLog untested; delete test doesn't assert laps cascade; trainingEffectAnaerobic/surface not asserted.
- Task 6: fix round 1/5 dispatched (resume implementer) — race-free upsert + concurrency test.
- Task 6: fix round 1/5 implemented (844f5d1; pushed) — upsert for activities AND laps (implementer found the same race on laps); re-review dispatched (sonnet).
- Task 6: fix round 1/5 (2 addressed, 0 open; commits 0eb5207..844f5d1). Note: `created` flag via pre-check select (xmax didn't type-check) — cosmetic. Minor (deferred): different-data concurrent syncs could lose a lap (non-transactional prune); avgGapSPerKm intentionally not in stravaFields (Stage 2 computes it).
- Task 6: complete (commits a2a5209..844f5d1, review clean, 1 parked: non-atomic lap replacement)
- Task 7: dispatched (BASE 844f5d1, implementer sonnet)
- Task 7: implemented (41b0170; pushed); review dispatched.
- Task 7: complete (commits 844f5d1..41b0170, review clean). Minor (deferred): four repeated stravaConnections updates (helper); no mid-import-failure test.
- Task 8: dispatched (BASE 41b0170, implementer sonnet)
- Task 8: implemented (d783c75; pushed); review dispatched.
- Task 8: review → Needs fixes (Important: uncaught exchangeCode/saveConnection → 500). Minor (deferred): CSRF relies on Auth.js sameSite=lax default — add comment/hardening if multi-user. Fix round 1/5 dispatched (resume implementer).
- Task 8: fix round 1/5 implemented (72fcad0; pushed); re-review dispatched (haiku).
- Task 8: fix round 1/5 (2 addressed, 0 open; commits d783c75..72fcad0)
- Task 8: complete (commits 41b0170..72fcad0, review clean)
- Task 9: dispatched (BASE 72fcad0, implementer sonnet)
- Task 9: implemented (d3d44ed; pushed); review dispatched.
- Task 9: complete (commits 72fcad0..d3d44ed, review clean). Ruling: an `update` event that turns a run into a non-run leaves the prior run row in place (accepted; rare, Stage 5 cleanup could remove) — cost if wrong: a stale row until re-sync. Minor (deferred): JSDoc on cron maxDuration; no route-level tests for webhook/cron; cron secret compare not constant-time (consider timingSafeEqual in final pass).
- Task 10: dispatched (BASE d3d44ed, implementer sonnet)
- Task 10: implemented (52012cb; pushed); review dispatched.
- Task 10: complete (commits d3d44ed..52012cb, review clean). Minor (deferred): zoneBoundaries truthy check on maxHr 0.
- Task 11: dispatched (BASE 52012cb, implementer sonnet)
- Task 11: implemented (37474e3; pushed); review dispatched.
- Task 11: review → Needs fixes (Important: UTC month label mismatch — plan-mandated; ruled: fix). Minor (deferred): empty elevation span. Fix round 1/5 dispatched (resume implementer).
- Task 11: fix round 1/5 implemented (ea5383c; pushed); re-review dispatched (haiku).
- Task 11: fix round 1/5 (3 addressed, 0 open; commits 37474e3..ea5383c)
- Task 11: complete (commits 52012cb..ea5383c, review clean)
- Task 12: dispatched (BASE ea5383c, implementer sonnet)
- Task 12: implemented (266d733; pushed); review dispatched.
- Task 12: complete (commits ea5383c..266d733, review clean). Minor (deferred): Stat helper duplicated (page vs RunCard) — extract if a 3rd use appears; LapTable div-grid lacks table roles (a11y debt, codebase-wide).
- Task 13: dispatched (BASE 266d733, implementer sonnet)
- Task 13: implemented (8ac01a3; pushed); review dispatched.
- Task 13: complete (commits 266d733..8ac01a3, review clean). Minor (deferred): back link needs aria-label; duplicated failed check; label wraps Save button.
- Task 14: dispatched (BASE 8ac01a3, implementer sonnet) — carries ruling: lint script → `eslint .`
- Task 14: implemented (f5940f4; pushed; CI green run 32436369627; e2e verified on alt port). Review dispatched.
- Task 14: controller checks — CI success on main; icons valid PNG; no stray env/port config; Dependabot PR (eslint 10) opened, leave for later.
- Task 14: review → Needs fixes (Important, plan-mandated: Playwright process doesn't load .env.local → webhook smoke sends 'undefined'). Ruling: load .env.local via process.loadEnvFile in playwright.config.ts; skip test without token — cost if wrong: none. Minor (deferred): no committed icon generator. Fix round 1/5 dispatched (resume implementer).
- Task 14: fix round 1/5 implemented (e3a725a; pushed; CI success 32452471365); re-review dispatched.
- Task 14: fix round 1/5 (1 addressed, 0 open; commits f5940f4..e3a725a)
- Task 14: complete (commits 8ac01a3..e3a725a, review clean)
- ALL TASKS COMPLETE. Final whole-branch review dispatched (opus) on review-7ee3918..e3a725a.diff with final-review-triage.md.
- FINAL REVIEW (opus): 2 Critical (history import killed by after()/maxDuration → stuck "running"; unauthenticated webhook POST can delete rows), 8 Important (middleware authorises nothing; transactions; import bookkeeping corrupted by syncRecent; sync route sync/timeout; LapTable /0; deauthorize no refresh; no route tests; README broken screenshot links), minors + triage.
- Rulings for the fix wave (see final-fix-brief.md): resumable import with cursor + 24h watchdog + Continue button; webhook moved under a secret path segment (`STRAVA_WEBHOOK_SECRET`, timingSafeEqual) — cost if wrong: one more env var; keep middleware and add `authorized` callback plus requireAthlete on stub pages (defence in depth) — cost: per-request session lookup; switch driver to neon-serverless + `withTx` now, before Stage 2 metrics writes — cost: a `ws` dep and WebSocket pool; local disconnect always succeeds even if Strava revoke fails (warn banner) — cost: possible lingering authorization, surfaced to user; build command split into `build` vs `vercel-build` that migrates only when VERCEL_ENV=production — cost: must set Vercel build command; cron maxDuration 60 (Hobby ceiling); sign-in action no longer throws on non-allowed email (no enumeration); README screenshots rendered from design mocks and labelled as mockups.
- Final fix wave dispatched (opus) as ONE dispatch per process.
- Final fix wave implemented (e3a725a..436f1e0, 8 commits; CI 32454911765 success; 59 tests). Note: budget enforced per page with perPage capped to budget (acceptable). Scoped re-review dispatched (sonnet).
- Final fix wave re-review: all 8 groups ADDRESSED; one likely new Critical interaction: Edge middleware + DB sessions + neon-serverless/ws. Ruling: delete middleware.ts and the authorized callback; rely on requireAthlete() per route (all pages/routes now gated) — why: no Edge DB access, smallest safe change; cost if wrong: a new unprotected route added later without requireAthlete is exposed (mitigate with the runbook note + a test that greps routes for requireAthlete in Stage 2). Deviation: a second, targeted fix dispatch beyond the single fix wave — justified by severity; ledgered. Out-of-scope (deferred): import budget counts runs not pages; Dependabot branch CI failing; middleware bundle size (moot once deleted).
- Middleware fix implemented (6e4f03e; pushed; CI 32456071728 success; smoke 2/2). Controller check: middleware.ts gone; every app/(app) page calls requireAthlete. Scoped re-review dispatched (haiku).
- Middleware fix re-review: ADDRESSED, no breakage. STAGE 1 COMPLETE at 6e4f03e (30 commits since plan). Ruling: no finishing-a-development-branch merge step — work was done on main at the user's request; ledger + reports committed to docs/superpowers/reports for the record.
