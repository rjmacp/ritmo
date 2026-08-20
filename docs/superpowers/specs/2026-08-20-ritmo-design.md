# Ritmo — Design Spec

**Date:** 2026-08-20
**Status:** Draft for review
**Replaces:** `hm-dashboard.html` MVP (static HTML, hand-edited via Claude chat)

## 1. Purpose

Ritmo is a personal running-training web app. It syncs runs from Strava
automatically, computes training metrics, and uses Claude as a built-in coach
to plan training blocks, plan each week, brief sessions, debrief runs and
review progress. Training is organised as **blocks** (multi-week periods with
a focus) that end in a **benchmark** (a time trial or race) used to measure
whether the block worked.

Current workflow being replaced: screenshot Garmin/Strava → paste into Claude
chat → Claude rewrites an HTML dashboard → Claude plans runs in chat.

### Goals
- Zero manual data entry for the normal case (run → watch → Strava → Ritmo).
- Coach plans are structured data the app tracks adherence against.
- Honest, encouraging coaching that prioritises **sticking to the plan** over
  running harder than prescribed.
- Year-over-year visibility of best times per distance.
- Phone-first UI; installable as a PWA.

### Non-goals (v1)
- Social features (segments, leaderboards, clubs, routes).
- Free-form chat with the coach.
- Multi-user sign-up (data model is multi-user ready; auth is single-user).
- Per-second streams, GAP, running power, VO2max estimates.
- Native mobile builds.

## 2. Decisions made

| Topic | Decision | Why |
|---|---|---|
| Data ingest | Strava API sync (webhook + nightly cron); FIT/GPX/TCX upload fallback | Removes screenshots; Garmin has no individual API but everything flows to Strava |
| Coach | Built-in, calling Claude API with structured output | Removes the last manual step; plans become data |
| Users | Single athlete now, `athlete_id` on every table | Multi-user later is an auth change, not a migration |
| Hosting | Next.js on Vercel (Hobby) + Neon Postgres (free tier) | One repo, one mental model; ~€0/month; no card/overage risk |
| Organising concept | Training blocks ending in benchmarks; races are benchmarks, not the centre | Matches how the athlete actually trains |
| Name | **Ritmo** (Portuguese for pace/rhythm) | Local word, product-like, not taken by a major running app |

Cost expectation: hosting €0; Claude calls well under €2/month (weekly plan +
per-run debrief on Sonnet; optional Opus for block planning/reviews).

## 3. Screens

Bottom tab bar: **Home · Plan · Activities · Trends · Records**. Settings via
header icon. Sign-in and first-run Onboarding are separate.

| Screen | Purpose | Content |
|---|---|---|
| **Home** | What do I do today? | Today's/next planned session (tap → pre-session brief); last run with plan-vs-actual verdict and debrief; "Add Garmin stats?" prompt on latest run; block progress (week n/N, days to benchmark); adherence streak (sessions at prescribed effort); new-PB badges; sync status / warnings; weekly review card on Sundays |
| **Plan** | The current block | Week-by-week calendar (session targets shown as ranges, e.g. "6–7 km easy") with planned sessions and actuals overlaid; adherence per week; "Plan next week" / "Plan next block" actions with free-text note; session rationale inline; Insights history (debriefs, reviews); past blocks. **Editable**: hold a session to open the Move sheet — move to another day (days that would break a rule are shown disabled, with the reason), swap with another session, skip, or mark a date range unavailable (travel/illness); a one-line coach note explains the knock-on, and "Re-plan week" hands the constraint to the coach |
| **Activities** | What I've done | Filterable list (type, surface, date); detail: laps table (time, pace, elev, HR), HR-zone bar, relative effort, best efforts found, matched planned session + verdict, debrief; Edit sheet (type, surface, notes, Garmin-only fields: aerobic/anaerobic Training Effect); planned-session override; Upload FIT/GPX/TCX entry point |
| **Trends** | Am I getting fitter? | Selectable range; charts: pace, avg HR, aerobic efficiency (easy runs), cadence, weekly volume, weekly zone distribution, fitness/fatigue/form; benchmark markers on timeline |
| **Records** | Best times & benchmarks | **Best times**: per distance (1, 2, 5, 10, 15, 21.1 km) a row per season with best + delta vs previous season, all-time highlighted, small season-best-over-years chart, tap to expand top-3 with 🥇🥈🥉 and `est*` flags; each links to its activity. **Benchmarks**: TT/race results over time, block-over-block comparison. **Predictions**: Riegel/VDOT estimates for 5k/10k/HM as a range |
| **Settings** | Config | Strava connect/disconnect + "Powered by Strava"; sync log (last 10); max HR, resting HR, zone boundaries; units; season start (month/day, default 1 Jan); coach prefs (days/week, long-run day, block length, auto-debrief on/off, model for block planning); profile |
| **Sign in** | Gate | Email magic link (Auth.js); single allowed email via env |
| **Onboarding** | First run | Connect Strava → import history (progress) → set max HR → define first block & benchmark |

Visual direction — **"Graphite"** (chosen 2026-08-20 from 14 candidates; see
`design/`): light theme, off-white `#f3f3f1` base, white borderless tiles with
soft shadow and 22 px radius, charcoal→graphite gradient hero
(`#23272e`→`#4b535e`) for today's session with a form ring, black primary
buttons, floating pill tab bar, Manrope (800 for numerals). Colour is reserved
for data: steel `#5b7ba8` (HR, fitness, medium), amber `#e0a830` (load,
fatigue, tempo), green `#2f9d6b` (on target, form, long), red `#d9534f`
(Z5 / too hard), grey `#8a929c` (easy). Reference feel: Apple Health tiles ×
Oura calm, kept deliberately unfussy.

## 4. Architecture

Single Next.js (App Router, TypeScript) repo on Vercel.

```
Browser (PWA, mobile-first)
   │  server components; client components for charts/forms
   ▼
Next.js app ── route handlers ──┬── /api/strava/*    OAuth callback, webhook receiver
   │                            ├── /api/upload      FIT/GPX/TCX fallback
   │                            ├── /api/coach/*     plan / insight generation (Claude)
   │                            └── /api/cron/*      nightly sync, recompute, weekly review
   ▼
Neon Postgres via Drizzle ORM
```

Module layout:

```
lib/strava/      client, oauth, webhook verification, normalise()
lib/upload/      fit/gpx/tcx parsers → same normalised shape
lib/pipeline/    process(normalisedActivity): upsert → metrics → match → PBs → load
lib/metrics/     pure functions: zones, load, fitness, efficiency, bestEfforts, predictions, adherence
lib/coach/       contextBuilder, planner, insights, validator, prompts/ (versioned)
lib/db/          drizzle schema + migrations
app/             routes & screens
```

Principles:
- `lib/metrics` and `lib/coach/validator` are pure and framework-free; tested
  against the 21 MVP runs as fixtures.
- Everything Strava sends is kept as `raw_json` so metrics can be recomputed
  when formulas change.
- Coach output is always schema-validated; nothing free-text is stored
  unvalidated.
- Auth: Auth.js magic link; `ALLOWED_EMAIL` env. All queries scoped by
  `athlete_id`.

## 5. Data model

All tables have `athlete_id`. Times stored UTC, with the activity's local
timezone alongside.

**athletes** — id, email, name, max_hr, resting_hr, hr_zone_boundaries
(4 thresholds → 5 zones; default 60/70/80/90 % max HR), units,
season_start_month, season_start_day, coach_prefs JSON (days_per_week,
long_run_day, block_length_weeks, auto_debrief, block_model), created_at

**strava_connections** — athlete_id, strava_athlete_id, access_token,
refresh_token, expires_at, last_sync_at

**activities** — id, athlete_id, source (`strava`|`upload`), strava_id
(unique, nullable), started_at, timezone, name, type
(`easy`|`medium`|`tempo`|`long`|`race`|`tt`|`other`), surface, distance_m,
moving_s, elapsed_s, avg_pace_s_per_km, avg_hr, max_hr, avg_cadence,
elevation_gain_m, calories, training_effect_aerobic (nullable),
training_effect_anaerobic (nullable), notes, raw_json

**laps** — activity_id, index, distance_m, moving_s, avg_hr,
elevation_gain_m

**best_efforts** — activity_id, distance_label (`1k`,`2k`,`5k`,`10k`,`15k`,
`hm`), elapsed_s, start_lap, estimated (bool). Computed by us (rolling best
over laps; exact from streams if later fetched).

**activity_metrics** — activity_id, relative_effort, zone_seconds[5],
aerobic_efficiency, decoupling_pct

**blocks** — athlete_id, name, focus, start_date, end_date, target_total_km,
benchmark_distance_label, benchmark_date, benchmark_activity_id (nullable),
status (`planned`|`active`|`done`)

**block_weeks** — block_id, week_no, start_date, target_km, focus

**planned_sessions** — block_week_id, date, type, target_distance_min_km,
target_distance_max_km, target_pace_s_per_km (nullable), target_hr_zone
(nullable), suggested_route_id (nullable), description, rationale,
athlete_edited (bool), actual_activity_id (nullable), verdict
(`on_target`|`short`|`over`|`too_hard`|`missed`|null). Distance is always a
range; a single figure from the coach is widened to ±15 % (min ±1 km) on save.

**routes** — athlete_id, name, distance_km, elevation_gain_m, surface,
times_run, last_run_at, sample_activity_id. Detected from history by
clustering activities on start location + distance (±3 %) + elevation; the
athlete can rename, merge or hide. The coach is given the route list and asked
to plan in route-sized sessions where sensible.

**athlete_unavailability** — athlete_id, start_date, end_date, reason
(`travel`|`illness`|`other`), note. Fed to the coach context and the validator;
planned sessions may not land inside a range.

**plan_edits** — planned_session_id, edited_at, kind
(`move`|`swap`|`skip`|`restore`), from_date, to_date, note. Audit trail, and
shown to the coach so it knows which deviations were the athlete's choice.

**coach_runs** — athlete_id, block_id (nullable), kind
(`plan_block`|`plan_week`|`debrief`|`brief`|`review`), requested_at,
athlete_note, context_json, response_json, model, prompt_version,
tokens_in, tokens_out, status, error

**daily_load** — athlete_id, date, load, fitness, fatigue, form

**sync_log** — athlete_id, kind (`webhook`|`cron`|`manual`|`import`|`upload`),
started_at, finished_at, status, activities_processed, error

Derived, not stored: Records (best_efforts grouped by distance and season),
plan adherence per week, race predictions.

Rules:
- Strava sync writes only the fields Strava provides; athlete-entered fields
  (TE, notes, type overrides) are never overwritten.
- Upload dedupes against existing activities by start time ±2 min and
  **enriches** rather than duplicates.
- Planned→actual matching: same date, closest type then distance; athlete
  can override on the activity screen.

## 6. Strava sync & upload

**Connect**: "Connect Strava" → OAuth (`activity:read_all`) → callback stores
tokens → history import job pages `/athlete/activities` (runs only), fetches
detail + laps per activity, runs the pipeline. Progress shown in onboarding.

**Webhook** (`/api/strava/webhook`): verifies subscription challenge; on
`create`/`update`/`delete` events returns 200 immediately, then processes.
Honours deletes.

**Nightly cron** (`/api/cron/sync`, secret-protected): refresh tokens near
expiry; re-pull last 30 days; recompute `daily_load`; mark blocks `done` past
end date; Sunday: generate weekly review.

**Manual "Sync now"** on Home → same code path, kind `manual`.

**Pipeline** (same for all sources):
`normalise → upsert activity + laps → bestEfforts → zones/relativeEffort →
match planned session + verdict → detect new PBs → update daily_load →
(optional) debrief`

**Upload** (`/api/upload`): FIT via `fit-file-parser`, GPX/TCX via XML parse
→ normalised shape with TE when present → pipeline with source `upload`.

**Failure handling**: every job writes `sync_log`; Settings shows last 10;
Home shows a warning badge for failed sync or re-auth required.

**Strava compliance**: "Powered by Strava" mark, no redistribution, honour
deletes, stay under rate limits (100/15 min, 1000/day).

## 7. Derived metrics (`lib/metrics`)

- **HR zones**: 5 zones from boundaries; per activity seconds-in-zone from
  laps weighted by lap avg HR; weekly roll-up.
- **Relative effort (load)**: Σ over laps of `minutes × zone_weight`
  (weights 1–5). Target calibration: easy hour ≈ 60–70, 5 km TT ≈ 90–110.
- **Fitness / fatigue / form**: fitness = 42-day EWA of daily load, fatigue =
  7-day EWA, form = fitness − fatigue. Stored in `daily_load`; recomputed from
  the affected date forward after each sync and nightly.
- **Aerobic efficiency**: `speed (m/min) ÷ avg HR`, charted for easy runs;
  **decoupling** = efficiency second half vs first half (cardiac drift flag).
- **Best efforts**: rolling fastest 1/2/5/10/15/21.1 km per activity;
  interpolated across laps → `estimated=true`.
- **Predictions**: Riegel `t2 = t1 × (d2/d1)^1.06` from latest benchmark and
  best recent effort (shown as range); VDOT training paces for coach targets.
- **Adherence**: per week sessions completed/planned, km actual vs target;
  per session verdict. **Effort decides the verdict, distance is a range**:
  `on_target` if avg HR is within the target zone (or pace within target) and
  distance is inside [min, max]; `too_hard` if HR exceeds the zone regardless
  of distance; `short`/`over` only when distance falls outside the range by
  more than 10 %. Running 6.5 km on a favourite loop against a "6–7 km" plan
  is on target. **Headline metric: sessions at prescribed effort.**
- **Adherence streak**: consecutive sessions with verdict `on_target`.

## 8. Coach (`lib/coach`)

One context builder feeds five modes. All calls use a JSON-schema tool for
output; responses validated before storage; every call logged to
`coach_runs`.

**Context** (compact, token-bounded): athlete profile & prefs; last 8–12
weeks summary (weekly km, load, zone mix, long-run progression); today's
fitness/fatigue/form + 7-day trend; benchmark history & predictions; current
block plan vs actual; athlete note.

| Mode | Trigger | Output |
|---|---|---|
| `plan_block` | Plan screen, start of cycle / after benchmark | `{name, focus, weeks[{week_no, target_km, focus, sessions[{date, type, distance_min_km, distance_max_km, route_id?, pace_target?, hr_zone?, description, rationale}]}], benchmark{date, distance}, notes_to_athlete}` |
| `plan_week` | Plan screen, weekly or on demand | Same shape, one week; adjusts rather than restarts; replaces only future sessions |
| `debrief` | Auto on sync (toggle) | `{summary, bullets[], verdict, suggested_adjustment?}` — leads with effort-vs-plan |
| `brief` | Tap today's session on Home (cached per session) | `{summary, target_paces, hr_ceiling, focus, warmup, if_then[]}` |
| `review` | Cron Sunday; block end | Longer narrative: efficiency/load/adherence trends, what improved, what didn't, benchmark expectation; block-end version compares TT to previous and proposes next focus |

**Manual edits** (Plan → Move sheet): the sheet also exposes the session's
target (type, distance range, zone) for direct editing — a plan is the coach's
suggestion, the athlete owns it. Edits set `athlete_edited` and are shown to
the coach in later context. Moving, swapping or skipping a session
is a direct write to `planned_sessions` plus a `plan_edits` row — no coach call
needed. The validator runs on the *edited* week: target days that would violate
a rule (hard days back-to-back, inside an unavailable range, within 2 days of
the benchmark) are disabled in the picker with the reason. A short
deterministic explanation ("keeps 48 h after Saturday's medium run") is built
from the validator result, not from Claude. "Re-plan week" calls `plan_week`
with the unavailability and the athlete's edits as hard constraints. The
weekly review treats athlete-moved sessions as adherent if completed on the
new date.

**Validator (code, not prompt faith)** — rejects plans with: weekly km +>10 %
vs previous week; long run >35 % of weekly km; two hard days back-to-back;
hard session within 2 days of benchmark; session inside an
`athlete_unavailability` range. On
failure: re-ask once with violations listed, then surface error; never store
a bad plan.

**Persona** (`lib/coach/prompts/persona.md`, versioned, shared by all modes):
- **Honest**: names the number when a run was too hard, volume is behind, or
  a benchmark didn't improve. Never inflates.
- **Encouraging**: every shortfall comes with the next concrete step;
  highlights genuine progress even in a bad week; never shames a miss.
- **Motivating**: links today's session to the goal; celebrates milestones.
- **Discipline over heroics**: *the plan is the goal*. Praise running to the
  prescribed effort, including slower than capable. Harder-than-planned is a
  deviation to correct, not an achievement ("you'll bank more by keeping this
  easy", never "nice pace!" on an easy day). Pre-session brief states the HR
  ceiling and a fallback ("if you see 150, walk 30 s").
- **Ranges, not prescriptions**: distances are given as ranges and, where a
  known route fits, named ("your 6.5 km Mafra loop, easy"). Never penalise
  running a sensible route that lands inside or just past the range.
- **Tone rules**: second person, short, specific; no reasonless platitudes;
  no diagnosis — persistent pain → "see a physio" and back off.

**Models**: Sonnet default for all modes; Opus optional (setting) for
`plan_block` and `review`. Prompts versioned in-repo; `prompt_version`
recorded per run.

## 9. Testing

- Vitest: `lib/metrics`, `lib/coach/validator`, `lib/strava/normalise`,
  `lib/upload` parsers — fixtures = the 21 MVP runs + one FIT file.
- Route handlers tested with a mocked Strava client and mocked Claude client;
  one recorded real Claude response per mode as fixture.
- Playwright smoke: sign-in → Home → Activities detail.
- CI (GitHub Action) runs lint + tests on PR and `main`.

## 10. Deployment

- GitHub repo `ritmo` → Vercel Git integration: preview per PR, production
  on `main`.
- Neon Postgres; Drizzle migrations run in the build step.
- Vercel Cron: nightly sync 03:00 Europe/Lisbon; weekly review Sunday 20:00.
- Env secrets: `STRAVA_CLIENT_ID/SECRET`, `STRAVA_WEBHOOK_VERIFY_TOKEN`,
  `ANTHROPIC_API_KEY`, `AUTH_SECRET`, `ALLOWED_EMAIL`, `CRON_SECRET`,
  `DATABASE_URL`, email provider key for magic links.
- PWA manifest + icons for home-screen install.

## 11. Build stages

1. **Ingest** — skeleton, auth, Strava connect, history import, Activities
   list/detail. *Replaces screenshots.*
2. **Insight** — metrics, Trends, Records (season/all-time, year-over-year),
   route detection. *Replaces the dashboard.*
3. **Coach** — blocks, block/week planner, validator, Plan screen, adherence
   verdicts. *Replaces Claude chat.*
4. **Feedback** — debrief, brief, weekly/block review, Home cards, streak,
   PWA polish.
5. **Fallbacks** — FIT/GPX/TCX upload, Garmin manual fields, enrichment
   dedupe.

Each stage gets its own implementation plan.

## 12. Open questions (to resolve during stage planning, not blocking)

- Email provider for magic links (Resend free tier is the default choice).
- Whether to fetch HR streams in stage 2 for exact best efforts and zone
  time, or defer.
- Charting library: hand-rolled SVG (as MVP) vs Recharts — decide in stage 2.
