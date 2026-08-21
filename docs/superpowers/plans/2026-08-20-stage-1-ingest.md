# Ritmo Stage 1 — Ingest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deployed Next.js app where the athlete signs in, connects Strava once, and every run (past and future) appears automatically in a Runs feed with a lap-level detail view — ending the screenshot workflow.

**Architecture:** One Next.js 15 App Router repo. Strava data enters through three doors (history import on connect, webhook on new activity, nightly cron as safety net) and all three call the same `processActivity()` pipeline, which normalises Strava's JSON and upserts `activities` + `laps` into Neon Postgres via Drizzle. Server components render the feed and detail from the DB; no client-side data fetching. Metrics, coach, plans, upload and weather are later stages — this stage lays the tables and the pipeline hook points they need.

**Tech Stack:** Next.js 15 (App Router, TypeScript, Tailwind v4), Drizzle ORM + drizzle-kit, Neon serverless Postgres (PGlite in tests), Auth.js v5 (magic link via Resend, Drizzle adapter), Vitest, Playwright (one smoke test), Vercel (hosting + cron), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-20-ritmo-design.md` (sections 3–6, 9–11; visual tokens in section 3)

## Global Constraints

- Node 20, npm. TypeScript `strict: true`. No `any` outside `raw_json` handling.
- Every table carries `athlete_id`; every query is scoped by it.
- Strava sync writes only the fields Strava provides; never overwrites athlete-entered fields (`type` override, `notes`, `training_effect_*`).
- Keep Strava's raw payload in `activities.raw_json`.
- Auth: Auth.js magic link; only `ALLOWED_EMAIL` may sign in.
- Rate limits: ≤100 Strava requests / 15 min, ≤1000 / day — import throttles to 1 request / second.
- Webhook must return 200 within 2 s; processing happens after the response.
- Visual tokens (spec §3): page `#f7f8fa`, cards white with 1 px `#e3e6eb` hairline, radius 12 px, navy hero `#16223d`→`#2c4570`, sky `#2f9ad0`/text `#1f6f9a`, tangerine `#f08a24`/text `#b85f0f`, lime `#7ab648`/text `#4f8a22`, easy grey `#7b8494`, muted text `#5f6776`, ink `#141a26`, font Manrope (800 for numerals). No shadows, no tinted fills; type pills are outline.
- Show "Powered by Strava" on the Account screen.
- **Code standards**: TypeScript `strict` + `noUncheckedIndexedAccess` + `noImplicitOverride`; ESLint with `typescript-eslint` strict-type-checked + `eslint-plugin-import` ordering; Prettier (2-space, double quotes, trailing commas, 120 cols) enforced by a pre-commit hook (husky + lint-staged) and in CI (`prettier --check`, `tsc --noEmit`). No `console.log` in committed code — use the `log` helper from `lib/log.ts`. Every exported function has a one-line JSDoc saying what it does and what it returns. Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
- **Professional repo**: README with badges, screenshots, setup and architecture; MIT `LICENSE`; `CONTRIBUTING.md`; `SECURITY.md`; `.editorconfig`; PR template; Dependabot for npm and GitHub Actions; `CHANGELOG.md` kept by stage.
- Commit after every task; push to `origin main` (public repo `rjmacp/ritmo`).

---

## File structure

```
ritmo/
  app/
    layout.tsx                      root layout: fonts, tab bar, theme tokens
    globals.css                     Tailwind + CSS variables from spec tokens
    page.tsx                        "/" → redirect to /runs (Home is Stage 4)
    (auth)/signin/page.tsx          magic-link form
    runs/page.tsx                   Runs feed (server component)
    runs/[id]/page.tsx              Run detail
    account/page.tsx                Strava connect/disconnect, max HR, sync log
    api/auth/[...nextauth]/route.ts Auth.js handlers
    api/strava/connect/route.ts     redirect to Strava OAuth
    api/strava/callback/route.ts    exchange code, store tokens, start import
    api/strava/webhook/route.ts     GET challenge, POST events
    api/strava/disconnect/route.ts  deauthorize + delete tokens
    api/sync/route.ts               manual "Sync now"
    api/cron/sync/route.ts          nightly sync (CRON_SECRET)
  components/
    TabBar.tsx  TypePill.tsx  Hero.tsx  StatRow.tsx  KmBars.tsx  RunCard.tsx  LapTable.tsx
  lib/
    env.ts                          typed env access
    auth.ts                         Auth.js config + `requireAthlete()`
    db/client.ts  db/schema.ts  db/athlete.ts
    strava/types.ts  strava/client.ts  strava/oauth.ts  strava/normalise.ts
    pipeline/processActivity.ts  pipeline/importHistory.ts  pipeline/syncRecent.ts  pipeline/syncLog.ts
    metrics/zones.ts                zone boundaries + zoneFor(hr)
    format.ts                       pace/duration formatting
  drizzle/                          generated SQL migrations
  drizzle.config.ts
  scripts/strava-subscribe.ts       one-time webhook subscription
  tests/
    helpers/db.ts                   PGlite test database
    fixtures/strava/activity-19aug.json  laps-19aug.json  athlete-activities-page.json
    unit/*.test.ts  integration/*.test.ts
  e2e/smoke.spec.ts
  .github/workflows/ci.yml
  vercel.json                       cron schedule
  public/manifest.webmanifest  public/icons/
```

---

### Task 1: Scaffold the app with tooling and design tokens

**Files:**

- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `vitest.config.ts`, `tests/unit/smoke.test.ts`, `.gitignore`, `.env.example`, `lib/env.ts`, `lib/format.ts`, `tests/unit/format.test.ts`

**Interfaces:**

- Produces: `env` object (`lib/env.ts`) with typed getters; `formatPace(secPerKm: number): string`, `formatDuration(sec: number): string`, `formatKm(metres: number): string` in `lib/format.ts`.

- [ ] **Step 1: Scaffold Next.js**

Run from `/home/rjmac/personal/repositories/ritmo`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-npm --no-turbopack
```

Accept overwriting nothing important (the repo only has `docs/` and `design/`). If it refuses because the directory is non-empty, scaffold into `/tmp/ritmo-scaffold` and copy everything except `README.md` over.

- [ ] **Step 2: Add dev dependencies and scripts**

```bash
npm i drizzle-orm @neondatabase/serverless next-auth@beta @auth/drizzle-adapter zod
npm i -D drizzle-kit vitest @vitest/coverage-v8 @electric-sql/pglite @playwright/test tsx
```

Replace the `scripts` block in `package.json` with:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest",
  "e2e": "playwright test",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "tsx lib/db/migrate.ts",
  "strava:subscribe": "tsx scripts/strava-subscribe.ts"
}
```

- [ ] **Step 3: Vitest config**

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

`tests/setup.ts`:

```ts
process.env.DATABASE_URL ??= "postgres://test";
process.env.AUTH_SECRET ??= "test-secret";
process.env.ALLOWED_EMAIL ??= "athlete@example.com";
process.env.STRAVA_CLIENT_ID ??= "1";
process.env.STRAVA_CLIENT_SECRET ??= "s";
process.env.STRAVA_WEBHOOK_VERIFY_TOKEN ??= "verify";
process.env.CRON_SECRET ??= "cron";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
```

- [ ] **Step 4: Write the failing env + format tests**

`tests/unit/format.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatPace, formatDuration, formatKm } from "@/lib/format";

describe("format", () => {
  it("formats pace as m:ss", () => {
    expect(formatPace(326)).toBe("5:26");
    expect(formatPace(365.4)).toBe("6:05");
  });
  it("formats durations under and over an hour", () => {
    expect(formatDuration(2412)).toBe("40:12");
    expect(formatDuration(5330)).toBe("1:28:50");
  });
  it("formats km to one decimal", () => {
    expect(formatKm(7410)).toBe("7.4");
    expect(formatKm(16100)).toBe("16.1");
  });
});
```

`tests/unit/env.test.ts`:

```ts
import { it, expect } from "vitest";
import { env } from "@/lib/env";

it("exposes required env vars", () => {
  expect(env.ALLOWED_EMAIL).toBe("athlete@example.com");
  expect(() => env.require("NOT_SET_VAR")).toThrow(/NOT_SET_VAR/);
});
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/format` and `@/lib/env`.

- [ ] **Step 6: Implement env and format**

`lib/env.ts`:

```ts
function require(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

export const env = {
  require,
  get DATABASE_URL() {
    return require("DATABASE_URL");
  },
  get AUTH_SECRET() {
    return require("AUTH_SECRET");
  },
  get ALLOWED_EMAIL() {
    return require("ALLOWED_EMAIL").toLowerCase();
  },
  get STRAVA_CLIENT_ID() {
    return require("STRAVA_CLIENT_ID");
  },
  get STRAVA_CLIENT_SECRET() {
    return require("STRAVA_CLIENT_SECRET");
  },
  get STRAVA_WEBHOOK_VERIFY_TOKEN() {
    return require("STRAVA_WEBHOOK_VERIFY_TOKEN");
  },
  get CRON_SECRET() {
    return require("CRON_SECRET");
  },
  get APP_URL() {
    return require("NEXT_PUBLIC_APP_URL");
  },
  get RESEND_API_KEY() {
    return require("AUTH_RESEND_KEY");
  },
  get EMAIL_FROM() {
    return process.env.EMAIL_FROM ?? "Ritmo <login@ritmo.run>";
  },
};
```

`lib/format.ts`:

```ts
export function formatPace(secPerKm: number): string {
  const s = Math.round(secPerKm);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function formatDuration(sec: number): string {
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
    : `${m}:${String(r).padStart(2, "0")}`;
}

export function formatKm(metres: number): string {
  return (metres / 1000).toFixed(1);
}
```

- [ ] **Step 7: Design tokens and root layout**

`app/globals.css`:

```css
@import "tailwindcss";

:root {
  --bg: #f7f8fa;
  --card: #ffffff;
  --line: #e3e6eb;
  --ink: #141a26;
  --muted: #5f6776;
  --navy-a: #16223d;
  --navy-b: #2c4570;
  --sky: #2f9ad0;
  --sky-text: #1f6f9a;
  --sky-hero: #7fd0f7;
  --tang: #f08a24;
  --tang-text: #b85f0f;
  --tang-hero: #ffb25c;
  --lime: #7ab648;
  --lime-text: #4f8a22;
  --lime-hero: #b5e07a;
  --easy: #7b8494;
  --red: #d9534f;
}

@theme inline {
  --color-bg: var(--bg);
  --color-card: var(--card);
  --color-line: var(--line);
  --color-ink: var(--ink);
  --color-muted: var(--muted);
  --color-sky: var(--sky);
  --color-sky-text: var(--sky-text);
  --color-tang: var(--tang);
  --color-tang-text: var(--tang-text);
  --color-lime: var(--lime);
  --color-lime-text: var(--lime-text);
  --color-easy: var(--easy);
  --color-red: var(--red);
  --font-sans: var(--font-manrope), system-ui, sans-serif;
}

body {
  background: var(--bg);
  color: var(--ink);
}

.card {
  @apply bg-card border border-line rounded-xl;
}
.hero {
  color: #fff;
  border-radius: 12px;
  background:
    radial-gradient(120% 90% at 100% 0%, rgba(127, 208, 247, 0.18) 0%, rgba(127, 208, 247, 0) 55%),
    linear-gradient(135deg, var(--navy-a) 0%, var(--navy-b) 100%);
}
.num {
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.k {
  font-size: 12px;
  color: var(--muted);
  font-weight: 500;
}
.pill {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid currentColor;
}
```

`app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Ritmo",
  description: "Your running, planned and explained.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#16223d", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="font-sans antialiased min-h-dvh">{children}</body>
    </html>
  );
}
```

`app/page.tsx`:

```tsx
import { redirect } from "next/navigation";
export default function Home() {
  redirect("/runs");
}
```

- [ ] **Step 8: `.env.example` and `.gitignore`**

`.env.example`:

```
DATABASE_URL=postgres://user:pass@host/db?sslmode=require
AUTH_SECRET=generate-with-npx-auth-secret
AUTH_RESEND_KEY=re_xxx
EMAIL_FROM=Ritmo <login@yourdomain>
ALLOWED_EMAIL=you@example.com
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_WEBHOOK_VERIFY_TOKEN=any-random-string
CRON_SECRET=any-random-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Ensure `.gitignore` contains `.env*` (but not `.env.example`), `node_modules`, `.next`, `coverage`, `playwright-report`, `test-results`.

- [ ] **Step 9: Run tests and lint**

Run: `npm test && npm run lint`
Expected: both format and env tests PASS; lint clean.

- [ ] **Step 10: Commit and push**

```bash
git add -A
git commit -m "feat: scaffold Next.js app with design tokens, env and format helpers"
git push
```

---

### Task 1b: Project hygiene — README, licence, lint/format/typecheck, hooks

**Files:**

- Create: `README.md`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `.editorconfig`, `.prettierrc`, `.prettierignore`, `eslint.config.mjs` (replace scaffold), `lib/log.ts`, `.husky/pre-commit`, `.github/pull_request_template.md`, `.github/dependabot.yml`
- Modify: `tsconfig.json`, `package.json`

- [ ] **Step 1: Strict TypeScript**

In `tsconfig.json` `compilerOptions` ensure:

```json
"strict": true,
"noUncheckedIndexedAccess": true,
"noImplicitOverride": true,
"noFallthroughCasesInSwitch": true,
"forceConsistentCasingInFileNames": true
```

and add `"tests/**/*.ts"`, `"e2e/**/*.ts"`, `"scripts/**/*.ts"` to `include`.

- [ ] **Step 2: ESLint + Prettier**

```bash
npm i -D prettier eslint-config-prettier eslint-plugin-import typescript-eslint husky lint-staged
```

`eslint.config.mjs`:

```js
import nextVitals from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: [".next/**", "node_modules/**", "drizzle/**", "coverage/**", "playwright-report/**", "design/**"] },
  ...nextVitals,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    plugins: { import: importPlugin },
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "import/order": [
        "error",
        {
          "newlines-between": "never",
          alphabetize: { order: "asc" },
          groups: ["builtin", "external", "internal", "parent", "sibling"],
        },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },
  {
    files: ["tests/**", "e2e/**"],
    rules: { "@typescript-eslint/no-non-null-assertion": "off", "@typescript-eslint/no-unsafe-assignment": "off" },
  },
  prettier,
);
```

`.prettierrc`:

```json
{ "printWidth": 120, "singleQuote": false, "trailingComma": "all", "semi": true }
```

`.prettierignore`: `.next`, `drizzle/meta`, `coverage`, `design`, `package-lock.json`.

`.editorconfig`:

```
root = true
[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

Add scripts to `package.json`:

```json
"typecheck": "tsc --noEmit",
"format": "prettier --write .",
"format:check": "prettier --check .",
"prepare": "husky"
```

and a `lint-staged` block:

```json
"lint-staged": { "*.{ts,tsx,mjs}": ["eslint --fix", "prettier --write"], "*.{json,md,css,yml}": ["prettier --write"] }
```

Run `npx husky init` and set `.husky/pre-commit` to:

```sh
npx lint-staged
npm run typecheck
```

- [ ] **Step 3: Logger**

`lib/log.ts`:

```ts
/** Structured logger; Vercel captures stdout/stderr. Use instead of console in app code. */
export const log = {
  info: (msg: string, data: Record<string, unknown> = {}) =>
    process.stdout.write(JSON.stringify({ level: "info", msg, ...data }) + "\n"),
  warn: (msg: string, data: Record<string, unknown> = {}) =>
    process.stderr.write(JSON.stringify({ level: "warn", msg, ...data }) + "\n"),
  error: (msg: string, err: unknown, data: Record<string, unknown> = {}) =>
    process.stderr.write(
      JSON.stringify({
        level: "error",
        msg,
        error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
        ...data,
      }) + "\n",
    ),
};
```

(Tasks 8–9 below use `console.error`; replace those with `log.error("import failed", e)` / `log.error("webhook failed", e)` when implementing.)

- [ ] **Step 4: README and repo documents**

`README.md` (fill the screenshot paths with PNGs exported from the design canvas into `docs/screens/`):

````markdown
# Ritmo

> Your running, planned and explained. Strava-synced training log with a built-in AI coach.

[![CI](https://github.com/rjmacp/ritmo/actions/workflows/ci.yml/badge.svg)](https://github.com/rjmacp/ritmo/actions/workflows/ci.yml)
![Node 20](https://img.shields.io/badge/node-20-339933?logo=node.js&logoColor=white)
![Next.js 15](https://img.shields.io/badge/Next.js-15-000?logo=next.js)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Ritmo syncs every run from Strava, computes the metrics free apps hide (fitness/fatigue/form, pace at easy HR, grade-adjusted pace, intensity balance) and uses Claude to plan training blocks, brief each session and review progress — with a coach persona that is honest, encouraging, and insists on running easy days easy.

| Home                           | Runs                           | Trends                             |
| ------------------------------ | ------------------------------ | ---------------------------------- |
| ![Home](docs/screens/home.png) | ![Runs](docs/screens/runs.png) | ![Trends](docs/screens/trends.png) |

## Status

Stage 1 — **Ingest** (auth, Strava sync, Runs feed, Run detail). See [build stages](docs/superpowers/specs/2026-08-20-ritmo-design.md#11-build-stages).

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Drizzle ORM · Neon Postgres · Auth.js · Vitest + Playwright · Vercel

## Getting started

```bash
git clone https://github.com/rjmacp/ritmo && cd ritmo
npm ci
cp .env.example .env.local      # fill in Neon, Resend, Strava, secrets
npm run db:migrate
npm run dev
```
````

Then sign in with `ALLOWED_EMAIL`, open **Account → Connect Strava**. Full setup (Strava app, webhook subscription, Vercel) is in [docs/runbook.md](docs/runbook.md).

## Architecture

```
Strava ──webhook/cron/import──▶ lib/strava/normalise ──▶ lib/pipeline/processActivity ──▶ Neon (Drizzle)
                                                                                               │
                                                      app/(app)/runs  ◀── server components ──┘
```

- `lib/strava` — API client, OAuth, webhook verification, normalisation
- `lib/pipeline` — the single ingest path every source uses
- `lib/metrics` — pure, framework-free metric functions
- `lib/db` — schema, migrations, queries
- `app` — routes and screens; `components` — UI

Design spec: [docs/superpowers/specs/2026-08-20-ritmo-design.md](docs/superpowers/specs/2026-08-20-ritmo-design.md) · Screens: [`design/midnight`](design/midnight)

## Scripts

| Command                                       | What it does                                          |
| --------------------------------------------- | ----------------------------------------------------- |
| `npm run dev` / `build` / `start`             | Next.js                                               |
| `npm test` · `npm run e2e`                    | Vitest (unit + PGlite integration) · Playwright smoke |
| `npm run lint` · `typecheck` · `format:check` | Quality gates (also run in CI and pre-commit)         |
| `npm run db:generate` · `db:migrate`          | Drizzle migrations                                    |
| `npm run strava:subscribe`                    | One-time webhook subscription                         |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security issues: [SECURITY.md](SECURITY.md).

## Licence

MIT © Ryan Macpherson. Powered by Strava.

````

`LICENSE`: standard MIT text, `Copyright (c) 2026 Ryan Macpherson`.

`CONTRIBUTING.md`:

```markdown
# Contributing

- Branch from `main`; open a PR. CI must be green (lint, typecheck, format, tests, build).
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
- Write the test first. Unit tests for pure code in `tests/unit`, DB-backed tests in `tests/integration` (PGlite, no external services).
- Metrics and coach validators are pure functions in `lib/metrics` / `lib/coach` — no DB or framework imports.
- Never log tokens or emails. Use `lib/log.ts`, not `console`.
- Design changes start in `design/midnight/build.py` and the spec, not in components.
````

`SECURITY.md`:

```markdown
# Security

Report vulnerabilities privately via GitHub Security Advisories on this repository. Do not open public issues for security problems.
Secrets live only in Vercel env vars and `.env.local` (git-ignored). Strava tokens are stored server-side and never sent to the browser.
```

`CHANGELOG.md`:

```markdown
# Changelog

## Unreleased — Stage 1: Ingest

- Magic-link sign-in gated to one athlete
- Strava connect, history import, webhook, nightly sync, manual sync
- Runs feed with per-km zone bars; Run detail with laps and time in zone
- Account: connection state, max HR, sync log
```

`.github/pull_request_template.md`:

```markdown
## What

## Why

## How tested

- [ ] Unit/integration tests added or updated
- [ ] `npm run lint && npm run typecheck && npm test` green locally
- [ ] Spec/CHANGELOG updated if behaviour changed
```

`.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
    groups: { minor-and-patch: { update-types: [minor, patch] } }
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
```

- [ ] **Step 5: Verify gates**

Run: `npm run format && npm run lint && npm run typecheck && npm test`
Expected: all green; `git commit` triggers the hook and passes.

- [ ] **Step 6: Commit and push**

```bash
git add -A
git commit -m "chore: project hygiene — README, licence, contributing, strict lint/format/typecheck, hooks, dependabot"
git push
```

---

### Task 2: Database schema, client and PGlite test harness

**Files:**

- Create: `lib/db/schema.ts`, `lib/db/client.ts`, `lib/db/migrate.ts`, `drizzle.config.ts`, `tests/helpers/db.ts`, `tests/integration/schema.test.ts`

**Interfaces:**

- Produces: Drizzle tables `athletes`, `stravaConnections`, `activities`, `laps`, `syncLog`, plus Auth.js tables `users`, `accounts`, `sessions`, `verificationTokens`. `db` (Neon) from `lib/db/client.ts`; `createTestDb()` returning `{ db, close }` from `tests/helpers/db.ts`. Type exports `Activity`, `NewActivity`, `Lap`, `NewLap`, `Athlete`.

- [ ] **Step 1: Write the failing schema test**

`tests/helpers/db.ts`:

```ts
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/lib/db/schema";
import path from "node:path";

export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });
  return { db, close: () => client.close() };
}
export type TestDb = Awaited<ReturnType<typeof createTestDb>>["db"];
```

`tests/integration/schema.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestDb, type TestDb } from "../helpers/db";
import { athletes, activities, laps } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

let db: TestDb;
let close: () => Promise<void>;
beforeAll(async () => ({ db, close } = await createTestDb()));
afterAll(() => close());

describe("schema", () => {
  it("stores an athlete, an activity and its laps", async () => {
    const [a] = await db.insert(athletes).values({ email: "athlete@example.com", name: "Ryan" }).returning();
    const [act] = await db
      .insert(activities)
      .values({
        athleteId: a.id,
        source: "strava",
        stravaId: 123n,
        startedAt: new Date("2026-08-19T17:02:00Z"),
        timezone: "Europe/Lisbon",
        name: "Mafra Corrida",
        type: "tempo",
        distanceM: 7410,
        movingS: 2412,
        elapsedS: 2450,
        avgPaceSPerKm: 325.5,
        avgHr: 158,
        maxHr: 183,
        avgCadence: 172,
        elevationGainM: 71,
        calories: 596,
        rawJson: { id: 123 },
      })
      .returning();
    await db
      .insert(laps)
      .values([{ activityId: act.id, index: 1, distanceM: 1000, movingS: 347, avgHr: 126, elevationGainM: 23 }]);
    const rows = await db.select().from(laps).where(eq(laps.activityId, act.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].movingS).toBe(347);
  });

  it("enforces unique strava_id per athlete", async () => {
    const [a] = await db.select().from(athletes).limit(1);
    await expect(
      db.insert(activities).values({
        athleteId: a.id,
        source: "strava",
        stravaId: 123n,
        startedAt: new Date(),
        timezone: "UTC",
        name: "dup",
        type: "easy",
        distanceM: 1,
        movingS: 1,
        elapsedS: 1,
        avgPaceSPerKm: 1,
        rawJson: {},
      }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- tests/integration/schema.test.ts`
Expected: FAIL — `@/lib/db/schema` not found.

- [ ] **Step 3: Write the schema**

`lib/db/schema.ts`:

```ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  bigint,
  jsonb,
  boolean,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ---- Auth.js tables (required by @auth/drizzle-adapter) ----
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});
export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);
export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});
export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ---- Ritmo tables ----
export const athletes = pgTable("athletes", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  maxHr: integer("max_hr"),
  restingHr: integer("resting_hr"),
  hrZoneBoundaries: jsonb("hr_zone_boundaries").$type<[number, number, number, number] | null>(),
  units: text("units").notNull().default("km"),
  seasonStartMonth: integer("season_start_month").notNull().default(1),
  seasonStartDay: integer("season_start_day").notNull().default(1),
  coachPrefs: jsonb("coach_prefs").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stravaConnections = pgTable("strava_connections", {
  athleteId: uuid("athlete_id")
    .primaryKey()
    .references(() => athletes.id, { onDelete: "cascade" }),
  stravaAthleteId: bigint("strava_athlete_id", { mode: "bigint" }).notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  importStatus: text("import_status").notNull().default("idle"), // idle | running | done | failed
  importedCount: integer("imported_count").notNull().default(0),
});

export const ACTIVITY_TYPES = ["easy", "medium", "tempo", "long", "race", "tt", "other"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athletes.id, { onDelete: "cascade" }),
    source: text("source").notNull(), // strava | upload
    stravaId: bigint("strava_id", { mode: "bigint" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    timezone: text("timezone").notNull(),
    name: text("name").notNull(),
    type: text("type").$type<ActivityType>().notNull(),
    typeOverridden: boolean("type_overridden").notNull().default(false),
    surface: text("surface"),
    distanceM: real("distance_m").notNull(),
    movingS: integer("moving_s").notNull(),
    elapsedS: integer("elapsed_s").notNull(),
    avgPaceSPerKm: real("avg_pace_s_per_km").notNull(),
    avgGapSPerKm: real("avg_gap_s_per_km"),
    avgHr: real("avg_hr"),
    maxHr: real("max_hr"),
    avgCadence: real("avg_cadence"),
    elevationGainM: real("elevation_gain_m"),
    calories: real("calories"),
    startLat: real("start_lat"),
    startLng: real("start_lng"),
    trainingEffectAerobic: real("training_effect_aerobic"),
    trainingEffectAnaerobic: real("training_effect_anaerobic"),
    notes: text("notes"),
    rawJson: jsonb("raw_json").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("activities_athlete_strava_idx").on(t.athleteId, t.stravaId),
    index("activities_athlete_started_idx").on(t.athleteId, t.startedAt),
  ],
);

export const laps = pgTable(
  "laps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    index: integer("index").notNull(),
    distanceM: real("distance_m").notNull(),
    movingS: integer("moving_s").notNull(),
    avgHr: real("avg_hr"),
    maxHr: real("max_hr"),
    avgCadence: real("avg_cadence"),
    elevationGainM: real("elevation_gain_m"),
    elevationLossM: real("elevation_loss_m"),
    gapSPerKm: real("gap_s_per_km"),
  },
  (t) => [uniqueIndex("laps_activity_index_idx").on(t.activityId, t.index)],
);

export const syncLog = pgTable("sync_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteId: uuid("athlete_id")
    .notNull()
    .references(() => athletes.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // webhook | cron | manual | import | upload
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: text("status").notNull().default("running"), // running | ok | failed
  activitiesProcessed: integer("activities_processed").notNull().default(0),
  error: text("error"),
});

export type Athlete = typeof athletes.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
export type Lap = typeof laps.$inferSelect;
export type NewLap = typeof laps.$inferInsert;
export type StravaConnection = typeof stravaConnections.$inferSelect;
```

- [ ] **Step 4: Drizzle config, client and migrator**

`drizzle.config.ts`:

```ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgres://placeholder" },
});
```

`lib/db/client.ts`:

```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { env } from "@/lib/env";

export const db = drizzle(neon(env.DATABASE_URL), { schema });
export type Db = typeof db;
```

`lib/db/migrate.ts`:

```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const sql = neon(process.env.DATABASE_URL!);
await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
process.stdout.write("migrations applied\n");
```

- [ ] **Step 5: Generate the migration**

Run: `npm run db:generate`
Expected: `drizzle/0000_*.sql` and `drizzle/meta/` created. Commit them — tests and deploys both apply them.

- [ ] **Step 6: Run the schema test**

Run: `npm test -- tests/integration/schema.test.ts`
Expected: PASS (both cases).

- [ ] **Step 7: Commit and push**

```bash
git add -A
git commit -m "feat: drizzle schema for athletes, strava connections, activities, laps, sync log; PGlite test harness"
git push
```

---

### Task 3: Auth.js magic-link sign-in gated to one email

**Files:**

- Create: `lib/auth.ts`, `lib/db/athlete.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/(auth)/signin/page.tsx`, `middleware.ts`, `tests/unit/auth.test.ts`, `tests/integration/athlete.test.ts`

**Interfaces:**

- Produces: `auth()`, `signIn`, `signOut`, `handlers` from `lib/auth.ts`; `isAllowedEmail(email: string | null | undefined): boolean`; `requireAthlete(): Promise<Athlete>` (redirects to `/signin` when unauthenticated); `ensureAthlete(dbc, email, name?)` in `lib/db/athlete.ts` returning the `Athlete` row (created on first sign-in).

- [ ] **Step 1: Write failing tests**

`tests/unit/auth.test.ts`:

```ts
import { it, expect } from "vitest";
import { isAllowedEmail } from "@/lib/auth-rules";

it("allows only the configured email, case-insensitively", () => {
  expect(isAllowedEmail("Athlete@Example.com")).toBe(true);
  expect(isAllowedEmail("other@example.com")).toBe(false);
  expect(isAllowedEmail(null)).toBe(false);
});
```

`tests/integration/athlete.test.ts`:

```ts
import { it, expect, beforeAll, afterAll } from "vitest";
import { createTestDb, type TestDb } from "../helpers/db";
import { ensureAthlete } from "@/lib/db/athlete";

let db: TestDb;
let close: () => Promise<void>;
beforeAll(async () => ({ db, close } = await createTestDb()));
afterAll(() => close());

it("creates an athlete once and returns the same row after", async () => {
  const a = await ensureAthlete(db, "athlete@example.com", "Ryan");
  const b = await ensureAthlete(db, "ATHLETE@example.com");
  expect(a.id).toBe(b.id);
  expect(b.name).toBe("Ryan");
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the pure rule and athlete repo**

`lib/auth-rules.ts` (kept separate from `lib/auth.ts` so tests don't import Next/Auth.js runtime):

```ts
import { env } from "@/lib/env";
export function isAllowedEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === env.ALLOWED_EMAIL;
}
```

`lib/db/athlete.ts`:

```ts
import { eq } from "drizzle-orm";
import { athletes, type Athlete } from "./schema";
import type { Db } from "./client";
import type { TestDb } from "@/tests/helpers/db";

export type AnyDb = Db | TestDb;

export async function ensureAthlete(dbc: AnyDb, email: string, name?: string | null): Promise<Athlete> {
  const e = email.toLowerCase();
  const existing = await dbc.select().from(athletes).where(eq(athletes.email, e)).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await dbc
    .insert(athletes)
    .values({ email: e, name: name ?? null })
    .returning();
  return created;
}
```

(`AnyDb` lets pipeline code run against Neon in prod and PGlite in tests. Add `"tests/**/*.ts"` to `tsconfig.json` `include` so the type import resolves.)

- [ ] **Step 4: Auth.js configuration**

`lib/auth.ts`:

```ts
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";
import { isAllowedEmail } from "@/lib/auth-rules";
import { ensureAthlete } from "@/lib/db/athlete";
import { env } from "@/lib/env";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Resend({ apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM })],
  pages: { signIn: "/signin", verifyRequest: "/signin?sent=1" },
  callbacks: {
    signIn: ({ user }) => isAllowedEmail(user.email),
  },
  events: {
    signIn: async ({ user }) => {
      if (user.email) await ensureAthlete(db, user.email, user.name);
    },
  },
});

export async function requireAthlete() {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");
  return ensureAthlete(db, session.user.email, session.user.name);
}
```

`app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

`middleware.ts`:

```ts
export { auth as middleware } from "@/lib/auth";
export const config = {
  matcher: ["/((?!api/strava/webhook|api/cron|api/auth|signin|manifest.webmanifest|icons|_next|favicon.ico).*)"],
};
```

(Webhook and cron routes authenticate themselves; everything else requires a session.)

- [ ] **Step 5: Sign-in page**

`app/(auth)/signin/page.tsx`:

```tsx
import { signIn } from "@/lib/auth";

export default async function SignIn({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  return (
    <main className="min-h-dvh flex flex-col justify-center px-6 gap-6">
      <div className="hero p-6 flex flex-col gap-2">
        <span className="text-xs font-bold opacity-85">RITMO</span>
        <span className="num text-3xl">Your running, planned and explained.</span>
      </div>
      {sent ? (
        <p className="card p-4">Check your inbox — the sign-in link is on its way.</p>
      ) : (
        <form
          className="card p-4 flex flex-col gap-3"
          action={async (fd) => {
            "use server";
            await signIn("resend", { email: String(fd.get("email")), redirectTo: "/runs" });
          }}
        >
          <label className="k" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required className="border border-line rounded-lg px-3 h-11" />
          <button className="h-11 rounded-lg bg-ink text-white font-extrabold">Send sign-in link</button>
        </form>
      )}
    </main>
  );
}
```

- [ ] **Step 6: Run tests and lint**

Run: `npm test && npm run lint`
Expected: PASS; lint clean.

- [ ] **Step 7: Commit and push**

```bash
git add -A
git commit -m "feat: Auth.js magic-link sign-in gated to ALLOWED_EMAIL; athlete bootstrap"
git push
```

---

### Task 4: Strava API client with token refresh and throttling

**Files:**

- Create: `lib/strava/types.ts`, `lib/strava/client.ts`, `tests/unit/strava-client.test.ts`, `tests/fixtures/strava/activity-19aug.json`, `tests/fixtures/strava/laps-19aug.json`, `tests/fixtures/strava/athlete-activities-page.json`

**Interfaces:**

- Produces: `StravaClient` class: `constructor(tokens: StravaTokens, onRefresh: (t: StravaTokens) => Promise<void>, fetchImpl = fetch)`, methods `listActivities(page, perPage, after?)`, `getActivity(id)`, `getLaps(id)`, `deauthorize()`. `StravaTokens = { accessToken, refreshToken, expiresAt: Date }`. `exchangeCode(code)` and `refreshTokens(refreshToken)` as standalone functions. `StravaRateLimitError` when Strava returns 429.

- [ ] **Step 1: Fixtures**

Create `tests/fixtures/strava/activity-19aug.json` — a trimmed DetailedActivity (fields used by normalise):

```json
{
  "id": 15000000019,
  "name": "Mafra Corrida",
  "type": "Run",
  "sport_type": "Run",
  "start_date": "2026-08-19T17:02:00Z",
  "start_date_local": "2026-08-19T18:02:00Z",
  "timezone": "(GMT+00:00) Europe/Lisbon",
  "distance": 7410.0,
  "moving_time": 2412,
  "elapsed_time": 2450,
  "average_speed": 3.072,
  "max_speed": 4.1,
  "average_heartrate": 158.0,
  "max_heartrate": 183.0,
  "has_heartrate": true,
  "average_cadence": 86.0,
  "total_elevation_gain": 71.0,
  "calories": 596.0,
  "start_latlng": [38.937, -9.327],
  "workout_type": 3,
  "athlete": { "id": 42 }
}
```

`tests/fixtures/strava/laps-19aug.json`:

```json
[
  {
    "id": 1,
    "lap_index": 1,
    "distance": 1000,
    "moving_time": 347,
    "elapsed_time": 350,
    "average_heartrate": 126,
    "max_heartrate": 140,
    "average_cadence": 85,
    "total_elevation_gain": 23
  },
  {
    "id": 2,
    "lap_index": 2,
    "distance": 1000,
    "moving_time": 331,
    "elapsed_time": 333,
    "average_heartrate": 150,
    "max_heartrate": 160,
    "average_cadence": 86,
    "total_elevation_gain": 15
  },
  {
    "id": 3,
    "lap_index": 3,
    "distance": 1000,
    "moving_time": 289,
    "elapsed_time": 290,
    "average_heartrate": 171,
    "max_heartrate": 178,
    "average_cadence": 88,
    "total_elevation_gain": 1
  },
  {
    "id": 4,
    "lap_index": 4,
    "distance": 1000,
    "moving_time": 301,
    "elapsed_time": 302,
    "average_heartrate": 174,
    "max_heartrate": 180,
    "average_cadence": 88,
    "total_elevation_gain": 0
  },
  {
    "id": 5,
    "lap_index": 5,
    "distance": 1000,
    "moving_time": 307,
    "elapsed_time": 308,
    "average_heartrate": 173,
    "max_heartrate": 183,
    "average_cadence": 87,
    "total_elevation_gain": 0
  },
  {
    "id": 6,
    "lap_index": 6,
    "distance": 1000,
    "moving_time": 369,
    "elapsed_time": 372,
    "average_heartrate": 163,
    "max_heartrate": 172,
    "average_cadence": 85,
    "total_elevation_gain": 0
  },
  {
    "id": 7,
    "lap_index": 7,
    "distance": 1000,
    "moving_time": 373,
    "elapsed_time": 375,
    "average_heartrate": 157,
    "max_heartrate": 165,
    "average_cadence": 85,
    "total_elevation_gain": 2
  },
  {
    "id": 8,
    "lap_index": 8,
    "distance": 410,
    "moving_time": 95,
    "elapsed_time": 120,
    "average_heartrate": 155,
    "max_heartrate": 160,
    "average_cadence": 84,
    "total_elevation_gain": 0
  }
]
```

`tests/fixtures/strava/athlete-activities-page.json` — two SummaryActivity entries, one Run (id 15000000019) and one Ride (id 15000000020, `"type": "Ride"`), each with the same summary fields as above minus `calories`.

- [ ] **Step 2: Write failing client tests**

`tests/unit/strava-client.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { StravaClient, StravaRateLimitError, type StravaTokens } from "@/lib/strava/client";
import activity from "../fixtures/strava/activity-19aug.json";
import laps from "../fixtures/strava/laps-19aug.json";

const fresh = (): StravaTokens => ({ accessToken: "a", refreshToken: "r", expiresAt: new Date(Date.now() + 3600_000) });
const expired = (): StravaTokens => ({ accessToken: "old", refreshToken: "r", expiresAt: new Date(Date.now() - 10) });
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("StravaClient", () => {
  it("fetches an activity with a bearer token", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe("https://www.strava.com/api/v3/activities/15000000019");
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer a");
      return json(activity);
    });
    const c = new StravaClient(fresh(), async () => {}, fetchImpl as unknown as typeof fetch);
    const a = await c.getActivity(15000000019);
    expect(a.name).toBe("Mafra Corrida");
  });

  it("refreshes an expired token before calling and reports the new tokens", async () => {
    const onRefresh = vi.fn(async () => {});
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      if (String(url).includes("/oauth/token"))
        return json({ access_token: "new", refresh_token: "r2", expires_at: Math.floor(Date.now() / 1000) + 21600 });
      return json(laps);
    });
    const c = new StravaClient(expired(), onRefresh, fetchImpl as unknown as typeof fetch);
    const l = await c.getLaps(15000000019);
    expect(l).toHaveLength(8);
    expect(onRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: "new", refreshToken: "r2" }));
  });

  it("throws StravaRateLimitError on 429", async () => {
    const fetchImpl = vi.fn(async () => json({ message: "Rate Limit Exceeded" }, 429));
    const c = new StravaClient(fresh(), async () => {}, fetchImpl as unknown as typeof fetch);
    await expect(c.getActivity(1)).rejects.toBeInstanceOf(StravaRateLimitError);
  });

  it("lists activities with paging params", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const u = new URL(String(url));
      expect(u.searchParams.get("page")).toBe("2");
      expect(u.searchParams.get("per_page")).toBe("50");
      expect(u.searchParams.get("after")).toBe("1700000000");
      return json([]);
    });
    const c = new StravaClient(fresh(), async () => {}, fetchImpl as unknown as typeof fetch);
    await c.listActivities(2, 50, new Date(1700000000 * 1000));
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test -- tests/unit/strava-client.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Types and client**

`lib/strava/types.ts`:

```ts
export interface StravaSummaryActivity {
  id: number;
  name: string;
  type: string;
  sport_type?: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  average_speed: number;
  max_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  has_heartrate?: boolean;
  average_cadence?: number;
  total_elevation_gain?: number;
  start_latlng?: [number, number] | null;
  workout_type?: number | null;
  athlete?: { id: number };
}
export interface StravaDetailedActivity extends StravaSummaryActivity {
  calories?: number;
  description?: string | null;
}
export interface StravaLap {
  id: number;
  lap_index: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  total_elevation_gain?: number;
}
export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: { id: number; firstname?: string; lastname?: string };
}
```

`lib/strava/client.ts`:

```ts
import { env } from "@/lib/env";
import type { StravaDetailedActivity, StravaLap, StravaSummaryActivity, StravaTokenResponse } from "./types";

export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}
export class StravaRateLimitError extends Error {
  constructor() {
    super("Strava rate limit exceeded");
  }
}
export class StravaAuthError extends Error {
  constructor() {
    super("Strava authorization invalid");
  }
}

const BASE = "https://www.strava.com/api/v3";
const TOKEN_URL = "https://www.strava.com/oauth/token";

async function tokenRequest(body: Record<string, string>, fetchImpl: typeof fetch): Promise<StravaTokenResponse> {
  const res = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_id: env.STRAVA_CLIENT_ID, client_secret: env.STRAVA_CLIENT_SECRET, ...body }),
  });
  if (!res.ok) throw new StravaAuthError();
  return res.json();
}

export const toTokens = (t: StravaTokenResponse): StravaTokens => ({
  accessToken: t.access_token,
  refreshToken: t.refresh_token,
  expiresAt: new Date(t.expires_at * 1000),
});

export async function exchangeCode(code: string, fetchImpl: typeof fetch = fetch) {
  const t = await tokenRequest({ code, grant_type: "authorization_code" }, fetchImpl);
  return {
    tokens: toTokens(t),
    stravaAthleteId: BigInt(t.athlete?.id ?? 0),
    name: [t.athlete?.firstname, t.athlete?.lastname].filter(Boolean).join(" "),
  };
}

export async function refreshTokens(refreshToken: string, fetchImpl: typeof fetch = fetch) {
  return toTokens(await tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" }, fetchImpl));
}

export class StravaClient {
  constructor(
    private tokens: StravaTokens,
    private onRefresh: (t: StravaTokens) => Promise<void>,
    private fetchImpl: typeof fetch = fetch,
  ) {}

  private async ensureFresh() {
    if (this.tokens.expiresAt.getTime() - Date.now() > 60_000) return;
    this.tokens = await refreshTokens(this.tokens.refreshToken, this.fetchImpl);
    await this.onRefresh(this.tokens);
  }

  private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    await this.ensureFresh();
    const url = new URL(BASE + path);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await this.fetchImpl(url, { headers: { Authorization: `Bearer ${this.tokens.accessToken}` } });
    if (res.status === 429) throw new StravaRateLimitError();
    if (res.status === 401) throw new StravaAuthError();
    if (!res.ok) throw new Error(`Strava ${res.status} for ${path}`);
    return res.json() as Promise<T>;
  }

  listActivities(page = 1, perPage = 50, after?: Date) {
    const params: Record<string, string> = { page: String(page), per_page: String(perPage) };
    if (after) params.after = String(Math.floor(after.getTime() / 1000));
    return this.get<StravaSummaryActivity[]>("/athlete/activities", params);
  }
  getActivity(id: number | bigint) {
    return this.get<StravaDetailedActivity>(`/activities/${id}`);
  }
  getLaps(id: number | bigint) {
    return this.get<StravaLap[]>(`/activities/${id}/laps`);
  }

  async deauthorize() {
    await this.fetchImpl("https://www.strava.com/oauth/deauthorize", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.tokens.accessToken}` },
    });
  }
}

/** 1 request/second keeps a full history import well inside 100 req / 15 min. */
export const throttle = (ms = 1000) => new Promise((r) => setTimeout(r, ms));
```

- [ ] **Step 5: Run tests**

Run: `npm test -- tests/unit/strava-client.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit and push**

```bash
git add -A
git commit -m "feat: Strava API client with token refresh, rate-limit errors and fixtures"
git push
```

---

### Task 5: Normalise Strava activities into Ritmo's shape

**Files:**

- Create: `lib/strava/normalise.ts`, `tests/unit/normalise.test.ts`

**Interfaces:**

- Produces: `NormalisedActivity` type and `normaliseStrava(detail: StravaDetailedActivity, laps: StravaLap[]): NormalisedActivity`; `isRun(summary): boolean`; `inferType(detail, laps): ActivityType`.

```ts
export interface NormalisedActivity {
  source: "strava" | "upload";
  stravaId: bigint | null;
  startedAt: Date;
  timezone: string;
  name: string;
  type: ActivityType;
  distanceM: number;
  movingS: number;
  elapsedS: number;
  avgPaceSPerKm: number;
  avgHr: number | null;
  maxHr: number | null;
  avgCadence: number | null;
  elevationGainM: number | null;
  calories: number | null;
  startLat: number | null;
  startLng: number | null;
  laps: Array<{
    index: number;
    distanceM: number;
    movingS: number;
    avgHr: number | null;
    maxHr: number | null;
    avgCadence: number | null;
    elevationGainM: number | null;
  }>;
  raw: unknown;
}
```

- [ ] **Step 1: Write failing tests**

`tests/unit/normalise.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { normaliseStrava, isRun, inferType } from "@/lib/strava/normalise";
import detail from "../fixtures/strava/activity-19aug.json";
import laps from "../fixtures/strava/laps-19aug.json";
import page from "../fixtures/strava/athlete-activities-page.json";

describe("normaliseStrava", () => {
  const n = normaliseStrava(detail, laps);
  it("maps core fields and derives pace", () => {
    expect(n.stravaId).toBe(15000000019n);
    expect(n.startedAt.toISOString()).toBe("2026-08-19T17:02:00.000Z");
    expect(n.timezone).toBe("Europe/Lisbon");
    expect(n.distanceM).toBe(7410);
    expect(n.avgPaceSPerKm).toBeCloseTo(325.5, 0);
    expect(n.avgHr).toBe(158);
    expect(n.avgCadence).toBe(172); // Strava reports one foot; Ritmo stores steps/min
    expect(n.startLat).toBeCloseTo(38.937);
  });
  it("maps laps 1-based with HR and climb", () => {
    expect(n.laps).toHaveLength(8);
    expect(n.laps[2]).toMatchObject({ index: 3, movingS: 289, avgHr: 171, elevationGainM: 1 });
  });
  it("keeps the raw payload", () => {
    expect((n.raw as { id: number }).id).toBe(15000000019);
  });
});

describe("isRun", () => {
  it("accepts Run and TrailRun, rejects Ride", () => {
    expect(isRun(page[0])).toBe(true);
    expect(isRun(page[1])).toBe(false);
    expect(isRun({ ...page[0], type: "Run", sport_type: "TrailRun" })).toBe(true);
  });
});

describe("inferType", () => {
  it("uses Strava workout_type when set (1 race, 2 long, 3 workout)", () => {
    expect(inferType({ ...detail, workout_type: 1 }, laps)).toBe("race");
    expect(inferType({ ...detail, workout_type: 2 }, laps)).toBe("long");
    expect(inferType({ ...detail, workout_type: 3 }, laps)).toBe("tempo");
  });
  it("falls back to distance and HR heuristics", () => {
    expect(inferType({ ...detail, workout_type: null, distance: 16100, average_heartrate: 153 }, [])).toBe("long");
    expect(inferType({ ...detail, workout_type: null, distance: 6500, average_heartrate: 144 }, [])).toBe("easy");
    expect(inferType({ ...detail, workout_type: null, distance: 9000, average_heartrate: 157 }, [])).toBe("medium");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- tests/unit/normalise.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`lib/strava/normalise.ts`:

```ts
import type { ActivityType } from "@/lib/db/schema";
import type { StravaDetailedActivity, StravaLap, StravaSummaryActivity } from "./types";

export interface NormalisedLap {
  index: number;
  distanceM: number;
  movingS: number;
  avgHr: number | null;
  maxHr: number | null;
  avgCadence: number | null;
  elevationGainM: number | null;
}
export interface NormalisedActivity {
  source: "strava" | "upload";
  stravaId: bigint | null;
  startedAt: Date;
  timezone: string;
  name: string;
  type: ActivityType;
  distanceM: number;
  movingS: number;
  elapsedS: number;
  avgPaceSPerKm: number;
  avgHr: number | null;
  maxHr: number | null;
  avgCadence: number | null;
  elevationGainM: number | null;
  calories: number | null;
  startLat: number | null;
  startLng: number | null;
  laps: NormalisedLap[];
  raw: unknown;
}

const RUN_TYPES = new Set(["Run", "TrailRun", "VirtualRun"]);
export const isRun = (a: StravaSummaryActivity) => RUN_TYPES.has(a.sport_type ?? a.type);

/** "(GMT+00:00) Europe/Lisbon" → "Europe/Lisbon" */
const tz = (s: string) => s.replace(/^\([^)]*\)\s*/, "") || "UTC";
const paceFrom = (distanceM: number, movingS: number) => (distanceM > 0 ? (movingS / distanceM) * 1000 : 0);
const cadence = (c?: number) => (c == null ? null : c * 2); // Strava: single-foot strikes/min

export function inferType(a: StravaDetailedActivity, laps: StravaLap[]): ActivityType {
  if (a.workout_type === 1) return "race";
  if (a.workout_type === 2) return "long";
  if (a.workout_type === 3) return "tempo";
  const km = a.distance / 1000;
  const hr = a.average_heartrate ?? 0;
  const hasFastBlock = laps.some(
    (l) => l.distance >= 900 && paceFrom(l.distance, l.moving_time) < paceFrom(a.distance, a.moving_time) - 30,
  );
  if (km >= 14) return "long";
  if (hasFastBlock && hr >= 150) return "tempo";
  if (hr >= 150) return "medium";
  return "easy";
}

export function normaliseStrava(a: StravaDetailedActivity, laps: StravaLap[]): NormalisedActivity {
  return {
    source: "strava",
    stravaId: BigInt(a.id),
    startedAt: new Date(a.start_date),
    timezone: tz(a.timezone),
    name: a.name,
    type: inferType(a, laps),
    distanceM: a.distance,
    movingS: a.moving_time,
    elapsedS: a.elapsed_time,
    avgPaceSPerKm: paceFrom(a.distance, a.moving_time),
    avgHr: a.average_heartrate ?? null,
    maxHr: a.max_heartrate ?? null,
    avgCadence: cadence(a.average_cadence),
    elevationGainM: a.total_elevation_gain ?? null,
    calories: a.calories ?? null,
    startLat: a.start_latlng?.[0] ?? null,
    startLng: a.start_latlng?.[1] ?? null,
    laps: [...laps]
      .sort((x, y) => x.lap_index - y.lap_index)
      .map((l) => ({
        index: l.lap_index,
        distanceM: l.distance,
        movingS: l.moving_time,
        avgHr: l.average_heartrate ?? null,
        maxHr: l.max_heartrate ?? null,
        avgCadence: cadence(l.average_cadence),
        elevationGainM: l.total_elevation_gain ?? null,
      })),
    raw: { activity: a, laps },
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/unit/normalise.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat: normalise Strava activities and laps; run filter and type inference"
git push
```

---

### Task 6: Pipeline — upsert activity and laps, honouring athlete overrides

**Files:**

- Create: `lib/pipeline/processActivity.ts`, `lib/pipeline/syncLog.ts`, `tests/integration/processActivity.test.ts`

**Interfaces:**

- Produces: `processActivity(dbc: AnyDb, athleteId: string, n: NormalisedActivity): Promise<{ activityId: string; created: boolean }>`; `deleteActivityByStravaId(dbc, athleteId, stravaId: bigint): Promise<void>`; `startSyncLog(dbc, athleteId, kind)` → `{ id, finish(status, processed, error?) }`.
- Hook point for later stages: after upsert, `processActivity` calls `afterUpsert(dbc, activityId)` — an exported no-op in Stage 1 that Stage 2 fills with metrics.

- [ ] **Step 1: Write failing tests**

`tests/integration/processActivity.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, type TestDb } from "../helpers/db";
import { ensureAthlete } from "@/lib/db/athlete";
import { activities, laps } from "@/lib/db/schema";
import { processActivity, deleteActivityByStravaId } from "@/lib/pipeline/processActivity";
import { normaliseStrava } from "@/lib/strava/normalise";
import detail from "../fixtures/strava/activity-19aug.json";
import lapsFx from "../fixtures/strava/laps-19aug.json";

let db: TestDb;
let close: () => Promise<void>;
let athleteId: string;
beforeAll(async () => {
  ({ db, close } = await createTestDb());
  athleteId = (await ensureAthlete(db, "athlete@example.com")).id;
});
afterAll(() => close());

describe("processActivity", () => {
  it("inserts an activity with its laps", async () => {
    const r = await processActivity(db, athleteId, normaliseStrava(detail, lapsFx));
    expect(r.created).toBe(true);
    const rows = await db.select().from(laps).where(eq(laps.activityId, r.activityId));
    expect(rows).toHaveLength(8);
  });

  it("is idempotent and replaces laps on re-sync", async () => {
    const r = await processActivity(db, athleteId, normaliseStrava({ ...detail, name: "Renamed" }, lapsFx.slice(0, 7)));
    expect(r.created).toBe(false);
    const [a] = await db.select().from(activities).where(eq(activities.id, r.activityId));
    expect(a.name).toBe("Renamed");
    expect(await db.select().from(laps).where(eq(laps.activityId, r.activityId))).toHaveLength(7);
  });

  it("does not overwrite athlete-entered type, notes or training effect", async () => {
    const [a] = await db.select().from(activities).where(eq(activities.athleteId, athleteId));
    await db
      .update(activities)
      .set({ type: "race", typeOverridden: true, notes: "felt great", trainingEffectAerobic: 3.7 })
      .where(eq(activities.id, a.id));
    await processActivity(db, athleteId, normaliseStrava(detail, lapsFx));
    const [after] = await db.select().from(activities).where(eq(activities.id, a.id));
    expect(after.type).toBe("race");
    expect(after.notes).toBe("felt great");
    expect(after.trainingEffectAerobic).toBe(3.7);
  });

  it("deletes by strava id", async () => {
    await deleteActivityByStravaId(db, athleteId, 15000000019n);
    expect(await db.select().from(activities).where(eq(activities.athleteId, athleteId))).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- tests/integration/processActivity.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`lib/pipeline/processActivity.ts`:

```ts
import { and, eq } from "drizzle-orm";
import { activities, laps, type NewActivity } from "@/lib/db/schema";
import type { AnyDb } from "@/lib/db/athlete";
import type { NormalisedActivity } from "@/lib/strava/normalise";

/** Stage 2 replaces this with metrics computation. Keep the signature. */
export async function afterUpsert(_dbc: AnyDb, _activityId: string): Promise<void> {}

export async function processActivity(dbc: AnyDb, athleteId: string, n: NormalisedActivity) {
  const stravaFields: Omit<NewActivity, "athleteId" | "type" | "rawJson"> = {
    source: n.source,
    stravaId: n.stravaId,
    startedAt: n.startedAt,
    timezone: n.timezone,
    name: n.name,
    distanceM: n.distanceM,
    movingS: n.movingS,
    elapsedS: n.elapsedS,
    avgPaceSPerKm: n.avgPaceSPerKm,
    avgHr: n.avgHr,
    maxHr: n.maxHr,
    avgCadence: n.avgCadence,
    elevationGainM: n.elevationGainM,
    calories: n.calories,
    startLat: n.startLat,
    startLng: n.startLng,
    updatedAt: new Date(),
  };

  const existing =
    n.stravaId == null
      ? []
      : await dbc
          .select({ id: activities.id, typeOverridden: activities.typeOverridden })
          .from(activities)
          .where(and(eq(activities.athleteId, athleteId), eq(activities.stravaId, n.stravaId)))
          .limit(1);

  let activityId: string;
  let created: boolean;
  if (existing[0]) {
    activityId = existing[0].id;
    created = false;
    await dbc
      .update(activities)
      .set({ ...stravaFields, rawJson: n.raw as object, ...(existing[0].typeOverridden ? {} : { type: n.type }) })
      .where(eq(activities.id, activityId));
    await dbc.delete(laps).where(eq(laps.activityId, activityId));
  } else {
    const [row] = await dbc
      .insert(activities)
      .values({ ...stravaFields, athleteId, type: n.type, rawJson: n.raw as object })
      .returning({ id: activities.id });
    activityId = row.id;
    created = true;
  }

  if (n.laps.length) {
    await dbc.insert(laps).values(n.laps.map((l) => ({ activityId, ...l })));
  }
  await afterUpsert(dbc, activityId);
  return { activityId, created };
}

export async function deleteActivityByStravaId(dbc: AnyDb, athleteId: string, stravaId: bigint) {
  await dbc.delete(activities).where(and(eq(activities.athleteId, athleteId), eq(activities.stravaId, stravaId)));
}
```

`lib/pipeline/syncLog.ts`:

```ts
import { eq } from "drizzle-orm";
import { syncLog } from "@/lib/db/schema";
import type { AnyDb } from "@/lib/db/athlete";

export type SyncKind = "webhook" | "cron" | "manual" | "import" | "upload";

export async function startSyncLog(dbc: AnyDb, athleteId: string, kind: SyncKind) {
  const [row] = await dbc.insert(syncLog).values({ athleteId, kind }).returning({ id: syncLog.id });
  return {
    id: row.id,
    finish: async (status: "ok" | "failed", activitiesProcessed: number, error?: string) => {
      await dbc
        .update(syncLog)
        .set({ status, activitiesProcessed, error: error ?? null, finishedAt: new Date() })
        .where(eq(syncLog.id, row.id));
    },
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/integration/processActivity.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat: activity upsert pipeline with lap replacement, override protection and sync log"
git push
```

---

### Task 7: History import and recent sync (shared by connect, manual, cron)

**Files:**

- Create: `lib/strava/connection.ts`, `lib/pipeline/importHistory.ts`, `lib/pipeline/syncRecent.ts`, `tests/integration/importHistory.test.ts`

**Interfaces:**

- Produces: `clientForAthlete(dbc, athleteId): Promise<StravaClient | null>` (loads tokens, persists refreshes); `saveConnection(dbc, athleteId, tokens, stravaAthleteId)`; `importHistory(dbc, athleteId, client, opts?: { after?: Date; kind?: SyncKind; sleep?: () => Promise<void> })` → `{ processed: number }`; `syncRecent(dbc, athleteId, client, days = 30)` → same shape. `importHistory` updates `strava_connections.import_status/imported_count` as it goes.

- [ ] **Step 1: Write failing test**

`tests/integration/importHistory.test.ts`:

```ts
import { it, expect, beforeAll, afterAll, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, type TestDb } from "../helpers/db";
import { ensureAthlete } from "@/lib/db/athlete";
import { activities, stravaConnections, syncLog } from "@/lib/db/schema";
import { saveConnection } from "@/lib/strava/connection";
import { importHistory } from "@/lib/pipeline/importHistory";
import type { StravaClient } from "@/lib/strava/client";
import page from "../fixtures/strava/athlete-activities-page.json";
import detail from "../fixtures/strava/activity-19aug.json";
import laps from "../fixtures/strava/laps-19aug.json";

let db: TestDb;
let close: () => Promise<void>;
let athleteId: string;
beforeAll(async () => {
  ({ db, close } = await createTestDb());
  athleteId = (await ensureAthlete(db, "athlete@example.com")).id;
  await saveConnection(
    db,
    athleteId,
    { accessToken: "a", refreshToken: "r", expiresAt: new Date(Date.now() + 3600_000) },
    42n,
  );
});
afterAll(() => close());

it("pages through activities, imports only runs, and records progress", async () => {
  const client = {
    listActivities: vi.fn(async (p: number) => (p === 1 ? page : [])),
    getActivity: vi.fn(async () => detail),
    getLaps: vi.fn(async () => laps),
  } as unknown as StravaClient;

  const r = await importHistory(db, athleteId, client, { sleep: async () => {} });
  expect(r.processed).toBe(1); // the Ride was skipped
  expect(client.getActivity).toHaveBeenCalledTimes(1);
  expect(await db.select().from(activities).where(eq(activities.athleteId, athleteId))).toHaveLength(1);
  const [conn] = await db.select().from(stravaConnections).where(eq(stravaConnections.athleteId, athleteId));
  expect(conn.importStatus).toBe("done");
  expect(conn.importedCount).toBe(1);
  const logs = await db.select().from(syncLog).where(eq(syncLog.athleteId, athleteId));
  expect(logs[0]).toMatchObject({ kind: "import", status: "ok", activitiesProcessed: 1 });
});

it("marks the import failed and logs the error when Strava throws", async () => {
  const client = {
    listActivities: vi.fn(async () => {
      throw new Error("boom");
    }),
  } as unknown as StravaClient;
  await expect(importHistory(db, athleteId, client, { sleep: async () => {} })).rejects.toThrow("boom");
  const [conn] = await db.select().from(stravaConnections).where(eq(stravaConnections.athleteId, athleteId));
  expect(conn.importStatus).toBe("failed");
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- tests/integration/importHistory.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement connection helpers**

`lib/strava/connection.ts`:

```ts
import { eq } from "drizzle-orm";
import { stravaConnections } from "@/lib/db/schema";
import type { AnyDb } from "@/lib/db/athlete";
import { StravaClient, type StravaTokens } from "./client";

export async function saveConnection(dbc: AnyDb, athleteId: string, tokens: StravaTokens, stravaAthleteId: bigint) {
  await dbc
    .insert(stravaConnections)
    .values({
      athleteId,
      stravaAthleteId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    })
    .onConflictDoUpdate({
      target: stravaConnections.athleteId,
      set: {
        stravaAthleteId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      },
    });
}

export async function updateTokens(dbc: AnyDb, athleteId: string, t: StravaTokens) {
  await dbc
    .update(stravaConnections)
    .set({ accessToken: t.accessToken, refreshToken: t.refreshToken, expiresAt: t.expiresAt })
    .where(eq(stravaConnections.athleteId, athleteId));
}

export async function getConnection(dbc: AnyDb, athleteId: string) {
  const [c] = await dbc.select().from(stravaConnections).where(eq(stravaConnections.athleteId, athleteId)).limit(1);
  return c ?? null;
}

export async function clientForAthlete(dbc: AnyDb, athleteId: string): Promise<StravaClient | null> {
  const c = await getConnection(dbc, athleteId);
  if (!c) return null;
  return new StravaClient({ accessToken: c.accessToken, refreshToken: c.refreshToken, expiresAt: c.expiresAt }, (t) =>
    updateTokens(dbc, athleteId, t),
  );
}

export async function deleteConnection(dbc: AnyDb, athleteId: string) {
  await dbc.delete(stravaConnections).where(eq(stravaConnections.athleteId, athleteId));
}

export async function athleteIdForStravaAthlete(dbc: AnyDb, stravaAthleteId: bigint): Promise<string | null> {
  const [c] = await dbc
    .select({ athleteId: stravaConnections.athleteId })
    .from(stravaConnections)
    .where(eq(stravaConnections.stravaAthleteId, stravaAthleteId))
    .limit(1);
  return c?.athleteId ?? null;
}
```

- [ ] **Step 4: Implement import and recent sync**

`lib/pipeline/importHistory.ts`:

```ts
import { eq, sql } from "drizzle-orm";
import { stravaConnections } from "@/lib/db/schema";
import type { AnyDb } from "@/lib/db/athlete";
import { throttle, type StravaClient } from "@/lib/strava/client";
import { isRun, normaliseStrava } from "@/lib/strava/normalise";
import { processActivity } from "./processActivity";
import { startSyncLog, type SyncKind } from "./syncLog";

export interface ImportOptions {
  after?: Date;
  kind?: SyncKind;
  sleep?: () => Promise<void>;
  perPage?: number;
}

export async function importHistory(dbc: AnyDb, athleteId: string, client: StravaClient, opts: ImportOptions = {}) {
  const sleep = opts.sleep ?? (() => throttle(1000));
  const log = await startSyncLog(dbc, athleteId, opts.kind ?? "import");
  await dbc
    .update(stravaConnections)
    .set({ importStatus: "running" })
    .where(eq(stravaConnections.athleteId, athleteId));
  let processed = 0;
  try {
    for (let page = 1; ; page++) {
      const summaries = await client.listActivities(page, opts.perPage ?? 50, opts.after);
      if (summaries.length === 0) break;
      for (const s of summaries) {
        if (!isRun(s)) continue;
        await sleep();
        const detail = await client.getActivity(s.id);
        await sleep();
        const laps = await client.getLaps(s.id);
        await processActivity(dbc, athleteId, normaliseStrava(detail, laps));
        processed++;
        await dbc
          .update(stravaConnections)
          .set({ importedCount: sql`${stravaConnections.importedCount} + 1` })
          .where(eq(stravaConnections.athleteId, athleteId));
      }
      await sleep();
    }
    await dbc
      .update(stravaConnections)
      .set({ importStatus: "done", lastSyncAt: new Date() })
      .where(eq(stravaConnections.athleteId, athleteId));
    await log.finish("ok", processed);
    return { processed };
  } catch (err) {
    await dbc
      .update(stravaConnections)
      .set({ importStatus: "failed" })
      .where(eq(stravaConnections.athleteId, athleteId));
    await log.finish("failed", processed, err instanceof Error ? err.message : String(err));
    throw err;
  }
}
```

`lib/pipeline/syncRecent.ts`:

```ts
import type { AnyDb } from "@/lib/db/athlete";
import type { StravaClient } from "@/lib/strava/client";
import { importHistory } from "./importHistory";
import type { SyncKind } from "./syncLog";

export function syncRecent(dbc: AnyDb, athleteId: string, client: StravaClient, days = 30, kind: SyncKind = "manual") {
  const after = new Date(Date.now() - days * 86_400_000);
  return importHistory(dbc, athleteId, client, { after, kind, sleep: () => new Promise((r) => setTimeout(r, 250)) });
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- tests/integration/importHistory.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit and push**

```bash
git add -A
git commit -m "feat: Strava connection store, history import with progress and 30-day recent sync"
git push
```

---

### Task 8: OAuth connect/callback/disconnect and manual sync routes

**Files:**

- Create: `lib/strava/oauth.ts`, `app/api/strava/connect/route.ts`, `app/api/strava/callback/route.ts`, `app/api/strava/disconnect/route.ts`, `app/api/sync/route.ts`, `tests/unit/oauth.test.ts`

**Interfaces:**

- Produces: `authorizeUrl(state: string): string`; routes as above. The callback kicks off `importHistory` without awaiting it (Vercel: wrap in `after()` from `next/server`) and redirects to `/account?import=started`.

- [ ] **Step 1: Failing test for the authorize URL**

`tests/unit/oauth.test.ts`:

```ts
import { it, expect } from "vitest";
import { authorizeUrl } from "@/lib/strava/oauth";

it("builds the Strava authorize URL with the right scope and callback", () => {
  const u = new URL(authorizeUrl("abc"));
  expect(u.origin + u.pathname).toBe("https://www.strava.com/oauth/authorize");
  expect(u.searchParams.get("client_id")).toBe("1");
  expect(u.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/strava/callback");
  expect(u.searchParams.get("scope")).toBe("read,activity:read_all");
  expect(u.searchParams.get("approval_prompt")).toBe("auto");
  expect(u.searchParams.get("state")).toBe("abc");
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- tests/unit/oauth.test.ts` → FAIL.

- [ ] **Step 3: Implement oauth helper and routes**

`lib/strava/oauth.ts`:

```ts
import { env } from "@/lib/env";
export function authorizeUrl(state: string) {
  const u = new URL("https://www.strava.com/oauth/authorize");
  u.searchParams.set("client_id", env.STRAVA_CLIENT_ID);
  u.searchParams.set("redirect_uri", `${env.APP_URL}/api/strava/callback`);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("approval_prompt", "auto");
  u.searchParams.set("scope", "read,activity:read_all");
  u.searchParams.set("state", state);
  return u.toString();
}
```

`app/api/strava/connect/route.ts`:

```ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAthlete } from "@/lib/auth";
import { authorizeUrl } from "@/lib/strava/oauth";

export async function GET() {
  await requireAthlete();
  const state = crypto.randomUUID();
  (await cookies()).set("strava_oauth_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
  return NextResponse.redirect(authorizeUrl(state));
}
```

`app/api/strava/callback/route.ts`:

```ts
import { NextResponse, after } from "next/server";
import { cookies } from "next/headers";
import { requireAthlete } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { exchangeCode } from "@/lib/strava/client";
import { saveConnection, clientForAthlete } from "@/lib/strava/connection";
import { importHistory } from "@/lib/pipeline/importHistory";
import { env } from "@/lib/env";
import { log } from "@/lib/log";

export async function GET(req: Request) {
  const athlete = await requireAthlete();
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const scope = url.searchParams.get("scope") ?? "";
  const jar = await cookies();
  const expected = jar.get("strava_oauth_state")?.value;
  jar.delete("strava_oauth_state");

  if (!code || !state || state !== expected) return NextResponse.redirect(`${env.APP_URL}/account?error=state`);
  if (!scope.includes("activity:read_all")) return NextResponse.redirect(`${env.APP_URL}/account?error=scope`);

  const { tokens, stravaAthleteId } = await exchangeCode(code);
  await saveConnection(db, athlete.id, tokens, stravaAthleteId);

  after(async () => {
    const client = await clientForAthlete(db, athlete.id);
    if (client) await importHistory(db, athlete.id, client).catch((e: unknown) => log.error("import failed", e));
  });
  return NextResponse.redirect(`${env.APP_URL}/account?import=started`);
}
```

`app/api/strava/disconnect/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireAthlete } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { clientForAthlete, deleteConnection } from "@/lib/strava/connection";
import { env } from "@/lib/env";

export async function POST() {
  const athlete = await requireAthlete();
  const client = await clientForAthlete(db, athlete.id);
  if (client) await client.deauthorize().catch(() => {});
  await deleteConnection(db, athlete.id);
  return NextResponse.redirect(`${env.APP_URL}/account`, { status: 303 });
}
```

`app/api/sync/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireAthlete } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { clientForAthlete } from "@/lib/strava/connection";
import { syncRecent } from "@/lib/pipeline/syncRecent";
import { env } from "@/lib/env";

export const maxDuration = 60;

export async function POST() {
  const athlete = await requireAthlete();
  const client = await clientForAthlete(db, athlete.id);
  if (!client) return NextResponse.redirect(`${env.APP_URL}/account?error=notconnected`, { status: 303 });
  const r = await syncRecent(db, athlete.id, client, 30, "manual");
  return NextResponse.redirect(`${env.APP_URL}/runs?synced=${r.processed}`, { status: 303 });
}
```

- [ ] **Step 4: Run tests and lint**

Run: `npm test && npm run lint` → PASS.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat: Strava OAuth connect/callback/disconnect and manual sync routes"
git push
```

---

### Task 9: Webhook receiver and nightly cron

**Files:**

- Create: `lib/strava/webhook.ts`, `app/api/strava/webhook/route.ts`, `app/api/cron/sync/route.ts`, `scripts/strava-subscribe.ts`, `vercel.json`, `tests/unit/webhook.test.ts`

**Interfaces:**

- Produces: `verifyChallenge(params: URLSearchParams): { ok: true; challenge: string } | { ok: false }`; `parseEvent(body: unknown): StravaWebhookEvent | null`; `handleEvent(dbc, event, clientFactory)` which processes `create`/`update` by fetching the activity and `delete` by removing it, ignoring non-activity objects.

- [ ] **Step 1: Failing tests**

`tests/unit/webhook.test.ts`:

```ts
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { verifyChallenge, parseEvent, handleEvent } from "@/lib/strava/webhook";
import { createTestDb, type TestDb } from "../helpers/db";
import { ensureAthlete } from "@/lib/db/athlete";
import { saveConnection } from "@/lib/strava/connection";
import { activities } from "@/lib/db/schema";
import type { StravaClient } from "@/lib/strava/client";
import detail from "../fixtures/strava/activity-19aug.json";
import laps from "../fixtures/strava/laps-19aug.json";

describe("verifyChallenge", () => {
  it("echoes the challenge when the verify token matches", () => {
    const p = new URLSearchParams({ "hub.mode": "subscribe", "hub.verify_token": "verify", "hub.challenge": "xyz" });
    expect(verifyChallenge(p)).toEqual({ ok: true, challenge: "xyz" });
  });
  it("rejects a wrong token", () => {
    const p = new URLSearchParams({ "hub.mode": "subscribe", "hub.verify_token": "nope", "hub.challenge": "xyz" });
    expect(verifyChallenge(p)).toEqual({ ok: false });
  });
});

describe("parseEvent", () => {
  it("accepts activity events and rejects junk", () => {
    expect(
      parseEvent({ object_type: "activity", aspect_type: "create", object_id: 15000000019, owner_id: 42, updates: {} }),
    ).toMatchObject({ objectType: "activity", aspectType: "create", objectId: 15000000019n, ownerId: 42n });
    expect(parseEvent({ nonsense: true })).toBeNull();
  });
});

describe("handleEvent", () => {
  let db: TestDb;
  let close: () => Promise<void>;
  let athleteId: string;
  beforeAll(async () => {
    ({ db, close } = await createTestDb());
    athleteId = (await ensureAthlete(db, "athlete@example.com")).id;
    await saveConnection(
      db,
      athleteId,
      { accessToken: "a", refreshToken: "r", expiresAt: new Date(Date.now() + 3600_000) },
      42n,
    );
  });
  afterAll(() => close());

  const client = {
    getActivity: vi.fn(async () => detail),
    getLaps: vi.fn(async () => laps),
  } as unknown as StravaClient;

  it("creates on create, then deletes on delete", async () => {
    await handleEvent(
      db,
      { objectType: "activity", aspectType: "create", objectId: 15000000019n, ownerId: 42n, updates: {} },
      async () => client,
    );
    expect(await db.select().from(activities).where(eq(activities.athleteId, athleteId))).toHaveLength(1);
    await handleEvent(
      db,
      { objectType: "activity", aspectType: "delete", objectId: 15000000019n, ownerId: 42n, updates: {} },
      async () => client,
    );
    expect(await db.select().from(activities).where(eq(activities.athleteId, athleteId))).toHaveLength(0);
  });

  it("ignores events for unknown owners", async () => {
    await handleEvent(
      db,
      { objectType: "activity", aspectType: "create", objectId: 1n, ownerId: 999n, updates: {} },
      async () => client,
    );
    expect(await db.select().from(activities).where(eq(activities.athleteId, athleteId))).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to verify failure** → FAIL.

- [ ] **Step 3: Implement webhook logic**

`lib/strava/webhook.ts`:

```ts
import { z } from "zod";
import { env } from "@/lib/env";
import type { AnyDb } from "@/lib/db/athlete";
import { athleteIdForStravaAthlete } from "./connection";
import { isRun, normaliseStrava } from "./normalise";
import { processActivity, deleteActivityByStravaId } from "@/lib/pipeline/processActivity";
import { startSyncLog } from "@/lib/pipeline/syncLog";
import type { StravaClient } from "./client";

export function verifyChallenge(p: URLSearchParams) {
  if (
    p.get("hub.mode") === "subscribe" &&
    p.get("hub.verify_token") === env.STRAVA_WEBHOOK_VERIFY_TOKEN &&
    p.get("hub.challenge")
  ) {
    return { ok: true as const, challenge: p.get("hub.challenge")! };
  }
  return { ok: false as const };
}

const EventSchema = z.object({
  object_type: z.enum(["activity", "athlete"]),
  aspect_type: z.enum(["create", "update", "delete"]),
  object_id: z.number(),
  owner_id: z.number(),
  updates: z.record(z.unknown()).default({}),
});
export interface StravaWebhookEvent {
  objectType: "activity" | "athlete";
  aspectType: "create" | "update" | "delete";
  objectId: bigint;
  ownerId: bigint;
  updates: Record<string, unknown>;
}

export function parseEvent(body: unknown): StravaWebhookEvent | null {
  const r = EventSchema.safeParse(body);
  if (!r.success) return null;
  return {
    objectType: r.data.object_type,
    aspectType: r.data.aspect_type,
    objectId: BigInt(r.data.object_id),
    ownerId: BigInt(r.data.owner_id),
    updates: r.data.updates,
  };
}

export async function handleEvent(
  dbc: AnyDb,
  ev: StravaWebhookEvent,
  clientFactory: (athleteId: string) => Promise<StravaClient | null>,
) {
  if (ev.objectType !== "activity") return; // athlete deauth handled by token failure on next sync
  const athleteId = await athleteIdForStravaAthlete(dbc, ev.ownerId);
  if (!athleteId) return;
  const log = await startSyncLog(dbc, athleteId, "webhook");
  try {
    if (ev.aspectType === "delete") {
      await deleteActivityByStravaId(dbc, athleteId, ev.objectId);
      await log.finish("ok", 1);
      return;
    }
    const client = await clientFactory(athleteId);
    if (!client) {
      await log.finish("failed", 0, "no connection");
      return;
    }
    const detail = await client.getActivity(ev.objectId);
    if (!isRun(detail)) {
      await log.finish("ok", 0);
      return;
    }
    const laps = await client.getLaps(ev.objectId);
    await processActivity(dbc, athleteId, normaliseStrava(detail, laps));
    await log.finish("ok", 1);
  } catch (err) {
    await log.finish("failed", 0, err instanceof Error ? err.message : String(err));
    throw err;
  }
}
```

`app/api/strava/webhook/route.ts`:

```ts
import { NextResponse, after } from "next/server";
import { db } from "@/lib/db/client";
import { verifyChallenge, parseEvent, handleEvent } from "@/lib/strava/webhook";
import { clientForAthlete } from "@/lib/strava/connection";
import { log } from "@/lib/log";

export async function GET(req: Request) {
  const r = verifyChallenge(new URL(req.url).searchParams);
  return r.ok ? NextResponse.json({ "hub.challenge": r.challenge }) : new NextResponse("forbidden", { status: 403 });
}

export async function POST(req: Request) {
  const ev = parseEvent(await req.json().catch(() => null));
  if (ev)
    after(() =>
      handleEvent(db, ev, (id) => clientForAthlete(db, id)).catch((e: unknown) => log.error("webhook failed", e)),
    );
  return new NextResponse("ok", { status: 200 }); // always 200 within 2 s
}
```

`app/api/cron/sync/route.ts`:

```ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { stravaConnections } from "@/lib/db/schema";
import { clientForAthlete } from "@/lib/strava/connection";
import { syncRecent } from "@/lib/pipeline/syncRecent";
import { env } from "@/lib/env";

export const maxDuration = 300;

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`)
    return new NextResponse("unauthorized", { status: 401 });
  const conns = await db.select({ athleteId: stravaConnections.athleteId }).from(stravaConnections);
  const results: Record<string, number | string> = {};
  for (const { athleteId } of conns) {
    const client = await clientForAthlete(db, athleteId);
    if (!client) continue;
    try {
      results[athleteId] = (await syncRecent(db, athleteId, client, 30, "cron")).processed;
    } catch (e) {
      results[athleteId] = e instanceof Error ? e.message : "failed";
    }
  }
  return NextResponse.json({ ok: true, results });
}
```

`vercel.json`:

```json
{ "crons": [{ "path": "/api/cron/sync", "schedule": "0 3 * * *" }] }
```

(Vercel cron sends `Authorization: Bearer $CRON_SECRET` automatically when `CRON_SECRET` is set in the project.)

`scripts/strava-subscribe.ts` (one-time, run locally with `.env` loaded):

```ts
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
```

- [ ] **Step 4: Run tests and lint** → PASS.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat: Strava webhook receiver, nightly cron sync, subscription script"
git push
```

---

### Task 10: HR zones helper (feed colouring) and activity queries

**Files:**

- Create: `lib/metrics/zones.ts`, `lib/db/activities.ts`, `tests/unit/zones.test.ts`, `tests/integration/activities-query.test.ts`

**Interfaces:**

- Produces: `zoneBoundaries(athlete: { maxHr: number | null; hrZoneBoundaries: [number,number,number,number] | null }): [number,number,number,number]` (defaults 60/70/80/90 % of max HR, or 125/145/160/178 when no max HR); `zoneFor(hr: number | null, b): 0|1|2|3|4|5` (0 = no HR); `ZONE_COLORS` mapping zone → CSS var. `listActivities(dbc, athleteId, { type?, limit?, before? })` returning activities with their laps; `getActivity(dbc, athleteId, id)`; `monthSummary(dbc, athleteId, year, month)` → `{ km, runs }`.

- [ ] **Step 1: Failing tests**

`tests/unit/zones.test.ts`:

```ts
import { it, expect } from "vitest";
import { zoneBoundaries, zoneFor } from "@/lib/metrics/zones";

it("derives boundaries from max HR", () => {
  expect(zoneBoundaries({ maxHr: 200, hrZoneBoundaries: null })).toEqual([120, 140, 160, 180]);
});
it("prefers explicit boundaries", () => {
  expect(zoneBoundaries({ maxHr: 200, hrZoneBoundaries: [125, 145, 160, 178] })).toEqual([125, 145, 160, 178]);
});
it("falls back to defaults without max HR", () => {
  expect(zoneBoundaries({ maxHr: null, hrZoneBoundaries: null })).toEqual([125, 145, 160, 178]);
});
it("classifies HR into zones", () => {
  const b: [number, number, number, number] = [125, 145, 160, 178];
  expect(zoneFor(null, b)).toBe(0);
  expect(zoneFor(120, b)).toBe(1);
  expect(zoneFor(145, b)).toBe(2);
  expect(zoneFor(146, b)).toBe(3);
  expect(zoneFor(171, b)).toBe(4);
  expect(zoneFor(185, b)).toBe(5);
});
```

`tests/integration/activities-query.test.ts`:

```ts
import { it, expect, beforeAll, afterAll } from "vitest";
import { createTestDb, type TestDb } from "../helpers/db";
import { ensureAthlete } from "@/lib/db/athlete";
import { processActivity } from "@/lib/pipeline/processActivity";
import { normaliseStrava } from "@/lib/strava/normalise";
import { listActivities, getActivity, monthSummary } from "@/lib/db/activities";
import detail from "../fixtures/strava/activity-19aug.json";
import laps from "../fixtures/strava/laps-19aug.json";

let db: TestDb;
let close: () => Promise<void>;
let athleteId: string;
beforeAll(async () => {
  ({ db, close } = await createTestDb());
  athleteId = (await ensureAthlete(db, "athlete@example.com")).id;
  await processActivity(db, athleteId, normaliseStrava(detail, laps));
  await processActivity(
    db,
    athleteId,
    normaliseStrava(
      {
        ...detail,
        id: 2,
        start_date: "2026-08-17T08:12:00Z",
        distance: 6500,
        moving_time: 2392,
        workout_type: null,
        average_heartrate: 144,
      },
      [],
    ),
  );
});
afterAll(() => close());

it("lists newest first with laps and filters by type", async () => {
  const all = await listActivities(db, athleteId, {});
  expect(all.map((a) => a.name)).toHaveLength(2);
  expect(all[0].startedAt > all[1].startedAt).toBe(true);
  expect(all[0].laps).toHaveLength(8);
  expect(await listActivities(db, athleteId, { type: "easy" })).toHaveLength(1);
});
it("gets one by id scoped to athlete", async () => {
  const [a] = await listActivities(db, athleteId, {});
  expect((await getActivity(db, athleteId, a.id))?.id).toBe(a.id);
  expect(await getActivity(db, "00000000-0000-0000-0000-000000000000", a.id)).toBeNull();
});
it("summarises a month", async () => {
  expect(await monthSummary(db, athleteId, 2026, 8)).toEqual({ km: 13.9, runs: 2 });
});
```

- [ ] **Step 2: Run to verify failure** → FAIL.

- [ ] **Step 3: Implement**

`lib/metrics/zones.ts`:

```ts
export type Boundaries = [number, number, number, number];
export type Zone = 0 | 1 | 2 | 3 | 4 | 5;
const DEFAULT: Boundaries = [125, 145, 160, 178];

export function zoneBoundaries(a: { maxHr: number | null; hrZoneBoundaries: Boundaries | null }): Boundaries {
  if (a.hrZoneBoundaries) return a.hrZoneBoundaries;
  if (a.maxHr) return [0.6, 0.7, 0.8, 0.9].map((f) => Math.round(a.maxHr! * f)) as Boundaries;
  return DEFAULT;
}

export function zoneFor(hr: number | null, b: Boundaries): Zone {
  if (hr == null) return 0;
  if (hr <= b[0]) return 1;
  if (hr <= b[1]) return 2;
  if (hr <= b[2]) return 3;
  if (hr <= b[3]) return 4;
  return 5;
}

export const ZONE_COLORS: Record<Zone, string> = {
  0: "var(--line)",
  1: "#d0d5de",
  2: "var(--sky)",
  3: "var(--lime)",
  4: "var(--tang)",
  5: "var(--red)",
};
```

`lib/db/activities.ts`:

```ts
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { activities, laps, type Activity, type ActivityType, type Lap } from "./schema";
import type { AnyDb } from "./athlete";

export type ActivityWithLaps = Activity & { laps: Lap[] };

export async function listActivities(
  dbc: AnyDb,
  athleteId: string,
  o: { type?: ActivityType; limit?: number; before?: Date },
): Promise<ActivityWithLaps[]> {
  const conds = [eq(activities.athleteId, athleteId)];
  if (o.type) conds.push(eq(activities.type, o.type));
  if (o.before) conds.push(lt(activities.startedAt, o.before));
  const rows = await dbc
    .select()
    .from(activities)
    .where(and(...conds))
    .orderBy(desc(activities.startedAt))
    .limit(o.limit ?? 20);
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const allLaps = await dbc
    .select()
    .from(laps)
    .where(sql`${laps.activityId} in ${ids}`)
    .orderBy(laps.index);
  return rows.map((r) => ({ ...r, laps: allLaps.filter((l) => l.activityId === r.id) }));
}

export async function getActivity(dbc: AnyDb, athleteId: string, id: string): Promise<ActivityWithLaps | null> {
  const [row] = await dbc
    .select()
    .from(activities)
    .where(and(eq(activities.athleteId, athleteId), eq(activities.id, id)))
    .limit(1);
  if (!row) return null;
  const l = await dbc.select().from(laps).where(eq(laps.activityId, id)).orderBy(laps.index);
  return { ...row, laps: l };
}

export async function monthSummary(dbc: AnyDb, athleteId: string, year: number, month: number) {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));
  const [r] = await dbc
    .select({ m: sql<number>`coalesce(sum(${activities.distanceM}), 0)`, n: sql<number>`count(*)` })
    .from(activities)
    .where(and(eq(activities.athleteId, athleteId), gte(activities.startedAt, from), lt(activities.startedAt, to)));
  return { km: Math.round(Number(r.m) / 100) / 10, runs: Number(r.n) };
}
```

- [ ] **Step 4: Run tests** → PASS.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat: HR zone helper and activity queries"
git push
```

---

### Task 11: App shell and Runs feed

**Files:**

- Create: `components/TabBar.tsx`, `components/TypePill.tsx`, `components/Header.tsx`, `components/KmBars.tsx`, `components/RunCard.tsx`, `app/runs/page.tsx`, `app/(app)/layout.tsx` (move `runs`, `account` under `(app)` so they share the tab bar)

**Interfaces:**

- Consumes: `listActivities`, `monthSummary`, `zoneBoundaries`, `zoneFor`, `ZONE_COLORS`, `formatPace/Duration/Km`, `requireAthlete`.
- Produces: `<RunCard activity boundaries />`, `<KmBars laps boundaries />`, `<TypePill type />`, `<TabBar active />`, `<Header kicker title right? avatar? />`.

- [ ] **Step 1: Components**

`components/TabBar.tsx`:

```tsx
import Link from "next/link";
const TABS = [
  { href: "/", label: "Home", d: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" },
  { href: "/plan", label: "Plan", d: "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4" },
  { href: "/runs", label: "Runs", d: "M4 17l5-5 4 4 7-8M15 8h5v5" },
  { href: "/trends", label: "Trends", d: "M3 20h18M5 16l4-6 4 3 6-8" },
  { href: "/records", label: "Records", d: "M12 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM9 13l-2 8 5-3 5 3-2-8" },
];
export function TabBar({ active }: { active: string }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 h-[60px] bg-white border-t border-line grid grid-cols-5 items-center">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`flex flex-col items-center gap-[3px] text-[10px] font-bold ${active === t.label ? "text-ink" : "text-muted"}`}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-[22px] h-[22px] fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"
          >
            <path d={t.d} />
          </svg>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
```

`components/TypePill.tsx`:

```tsx
import type { ActivityType } from "@/lib/db/schema";
const COLOR: Record<ActivityType, string> = {
  easy: "text-easy",
  medium: "text-sky-text",
  tempo: "text-tang-text",
  long: "text-lime-text",
  race: "text-ink",
  tt: "text-ink",
  other: "text-muted",
};
export function TypePill({ type }: { type: ActivityType }) {
  return <span className={`pill capitalize ${COLOR[type]}`}>{type}</span>;
}
```

`components/Header.tsx`:

```tsx
export function Header({
  kicker,
  title,
  right,
  initials,
}: {
  kicker: string;
  title: string;
  right?: React.ReactNode;
  initials?: string;
}) {
  return (
    <header className="flex items-center justify-between px-5 pt-[22px] pb-[14px]">
      <div className="flex items-center gap-3">
        {initials && (
          <a
            href="/account"
            className="w-[34px] h-[34px] rounded-full bg-ink text-white grid place-items-center text-xs font-extrabold"
          >
            {initials}
          </a>
        )}
        <div className="flex flex-col gap-[2px]">
          <span className="k">{kicker}</span>
          <span className="num text-[26px]">{title}</span>
        </div>
      </div>
      {right}
    </header>
  );
}
```

`components/KmBars.tsx`:

```tsx
import type { Lap } from "@/lib/db/schema";
import { zoneFor, ZONE_COLORS, type Boundaries } from "@/lib/metrics/zones";
import { formatPace } from "@/lib/format";

export function KmBars({ laps, boundaries }: { laps: Lap[]; boundaries: Boundaries }) {
  const full = laps.filter((l) => l.distanceM >= 900);
  if (full.length < 2) return null;
  const paces = full.map((l) => (l.movingS / l.distanceM) * 1000);
  const mx = Math.max(...paces),
    mn = Math.min(...paces);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end gap-[3px] h-16 px-[2px] border-b border-line">
        {full.map((l, i) => (
          <div
            key={l.id}
            style={{
              height: `${30 + ((mx - paces[i]) / (mx - mn + 1)) * 34}px`,
              background: ZONE_COLORS[zoneFor(l.avgHr, boundaries)],
            }}
            className="flex-1 rounded-t-[3px] opacity-90"
          />
        ))}
      </div>
      <div className="flex justify-between">
        <span className="k text-[10px]">pace per km</span>
        <span className="k text-[10px]">fastest {formatPace(mn)}</span>
      </div>
    </div>
  );
}
```

`components/RunCard.tsx`:

```tsx
import Link from "next/link";
import type { ActivityWithLaps } from "@/lib/db/activities";
import type { Boundaries } from "@/lib/metrics/zones";
import { formatDuration, formatKm, formatPace } from "@/lib/format";
import { TypePill } from "./TypePill";
import { KmBars } from "./KmBars";

const fmtDate = (d: Date, tz: string) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  })
    .format(d)
    .replace(",", " ·");

export function RunCard({ a, boundaries }: { a: ActivityWithLaps; boundaries: Boundaries }) {
  return (
    <Link href={`/runs/${a.id}`} className="card p-4 flex flex-col gap-3 shrink-0">
      <div className="flex justify-between items-center">
        <span className="k">{fmtDate(a.startedAt, a.timezone)}</span>
        <TypePill type={a.type} />
      </div>
      <span className="text-[17px] font-extrabold">{a.name}</span>
      <div className="grid grid-cols-4 gap-2">
        <Stat v={formatKm(a.distanceM)} k="km" />
        <Stat v={formatDuration(a.movingS)} k="time" />
        <Stat v={formatPace(a.avgPaceSPerKm)} k="/km" />
        <Stat v={a.avgHr ? Math.round(a.avgHr).toString() : "—"} k="avg bpm" color="text-sky-text" />
      </div>
      <KmBars laps={a.laps} boundaries={boundaries} />
      <div className="flex justify-between items-center">
        <span className="k text-[11px]">{a.elevationGainM != null ? `+${Math.round(a.elevationGainM)} m` : ""}</span>
      </div>
    </Link>
  );
}
function Stat({ v, k, color = "" }: { v: string; k: string; color?: string }) {
  return (
    <div>
      <div className={`num text-[22px] ${color}`}>{v}</div>
      <div className="k text-[10px]">{k}</div>
    </div>
  );
}
```

- [ ] **Step 2: Layout and page**

`app/(app)/layout.tsx`:

```tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="pb-[72px] max-w-[480px] mx-auto">{children}</div>;
}
```

Move `app/runs` → `app/(app)/runs` and create `app/(app)/runs/page.tsx`:

```tsx
import Link from "next/link";
import { requireAthlete } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { listActivities, monthSummary } from "@/lib/db/activities";
import { zoneBoundaries } from "@/lib/metrics/zones";
import { ACTIVITY_TYPES, type ActivityType } from "@/lib/db/schema";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { RunCard } from "@/components/RunCard";

export const dynamic = "force-dynamic";

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; synced?: string }>;
}) {
  const { type, synced } = await searchParams;
  const athlete = await requireAthlete();
  const t = ACTIVITY_TYPES.includes(type as ActivityType) ? (type as ActivityType) : undefined;
  const now = new Date();
  const [runs, month] = await Promise.all([
    listActivities(db, athlete.id, { type: t, limit: 30 }),
    monthSummary(db, athlete.id, now.getUTCFullYear(), now.getUTCMonth() + 1),
  ]);
  const b = zoneBoundaries(athlete);
  const initials = (athlete.name ?? athlete.email)
    .split(/[\s@.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
  return (
    <>
      <Header
        kicker={`${now.toLocaleString("en-GB", { month: "long" })} · ${month.km} km · ${month.runs} runs`}
        title="Runs"
        initials={initials}
        right={
          <form action="/api/sync" method="post">
            <button className="h-9 px-[14px] rounded-lg bg-white border border-line text-[13px] font-bold">Sync</button>
          </form>
        }
      />
      <div className="px-4 flex flex-col gap-3">
        {synced && (
          <p className="k">
            Synced {synced} run{synced === "1" ? "" : "s"} from Strava.
          </p>
        )}
        <div className="flex gap-2 overflow-x-auto shrink-0">
          {["all", ...ACTIVITY_TYPES.filter((x) => x !== "other" && x !== "tt")].map((x) => (
            <Link
              key={x}
              href={x === "all" ? "/runs" : `/runs?type=${x}`}
              className={`px-[14px] py-[7px] rounded-lg text-xs font-bold whitespace-nowrap border ${(t ?? "all") === x ? "hero border-transparent" : "bg-white border-line text-muted"}`}
            >
              {x[0].toUpperCase() + x.slice(1)}
            </Link>
          ))}
        </div>
        {runs.length === 0 ? (
          <div className="card p-5 flex flex-col gap-2">
            <span className="font-extrabold">No runs yet</span>
            <span className="k">
              Connect Strava on your{" "}
              <Link className="underline" href="/account">
                account
              </Link>{" "}
              page and your history will import in a minute or two.
            </span>
          </div>
        ) : (
          runs.map((a) => <RunCard key={a.id} a={a} boundaries={b} />)
        )}
      </div>
      <TabBar active="Runs" />
    </>
  );
}
```

Also move `app/page.tsx` redirect target stays `/runs`. Create stub pages `app/(app)/plan/page.tsx`, `trends/page.tsx`, `records/page.tsx` that render `<Header kicker="Coming in a later stage" title="Plan" />` + `<TabBar active="Plan" />` (same for Trends, Records) so the tab bar never 404s.

- [ ] **Step 3: Run lint and a dev build**

Run: `npm run lint && npm run build`
Expected: build succeeds (set `DATABASE_URL` etc. from `.env.example` copied to `.env.local` with a real Neon URL, or use `SKIP_ENV_VALIDATION`-style placeholders — the build does not query the DB because pages are `force-dynamic`).

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "feat: app shell with tab bar and Runs feed with per-km zone bars"
git push
```

---

### Task 12: Run detail page

**Files:**

- Create: `app/(app)/runs/[id]/page.tsx`, `components/LapTable.tsx`, `components/ZoneBar.tsx`, `tests/unit/zone-time.test.ts`, `lib/metrics/zoneTime.ts`

**Interfaces:**

- Produces: `zoneSeconds(laps, boundaries): [number,number,number,number,number]` (lap moving time attributed to the lap's average-HR zone; Stage 2 upgrades to streams). `<LapTable laps boundaries />`, `<ZoneBar seconds />`.

- [ ] **Step 1: Failing test**

`tests/unit/zone-time.test.ts`:

```ts
import { it, expect } from "vitest";
import { zoneSeconds } from "@/lib/metrics/zoneTime";
import laps from "../fixtures/strava/laps-19aug.json";
import { normaliseStrava } from "@/lib/strava/normalise";
import detail from "../fixtures/strava/activity-19aug.json";

it("attributes lap time to zones by lap avg HR", () => {
  const n = normaliseStrava(detail, laps);
  const z = zoneSeconds(
    n.laps.map((l, i) => ({
      ...l,
      id: String(i),
      activityId: "x",
      maxHr: null,
      avgCadence: null,
      elevationLossM: null,
      gapSPerKm: null,
    })),
    [125, 145, 160, 178],
  );
  expect(z.reduce((a, b) => a + b, 0)).toBe(2412);
  expect(z[3]).toBe(289 + 301 + 307 + 369); // laps 3–6 are Z4 (163–174 bpm)
});
```

- [ ] **Step 2: Run to verify failure** → FAIL.

- [ ] **Step 3: Implement**

`lib/metrics/zoneTime.ts`:

```ts
import type { Lap } from "@/lib/db/schema";
import { zoneFor, type Boundaries } from "./zones";
export function zoneSeconds(laps: Lap[], b: Boundaries): [number, number, number, number, number] {
  const out: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  for (const l of laps) {
    const z = zoneFor(l.avgHr, b);
    if (z > 0) out[z - 1] += l.movingS;
  }
  return out;
}
```

`components/ZoneBar.tsx`:

```tsx
import { ZONE_COLORS } from "@/lib/metrics/zones";
export function ZoneBar({ seconds }: { seconds: [number, number, number, number, number] }) {
  const total = seconds.reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex justify-between">
        <span className="k">Time in zone</span>
        <span className="k">{Math.round(total / 60)} min</span>
      </div>
      <div className="flex h-3 rounded-md overflow-hidden">
        {seconds.map((s, i) => (
          <div
            key={i}
            style={{ width: `${(s / total) * 100}%`, background: ZONE_COLORS[(i + 1) as 1 | 2 | 3 | 4 | 5] }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[11px] font-semibold text-muted">
        {seconds.map((s, i) => (
          <span key={i}>
            Z{i + 1} {Math.round(s / 60)}m
          </span>
        ))}
      </div>
    </div>
  );
}
```

`components/LapTable.tsx`:

```tsx
import type { Lap } from "@/lib/db/schema";
import { zoneFor, ZONE_COLORS, type Boundaries } from "@/lib/metrics/zones";
import { formatPace } from "@/lib/format";

export function LapTable({ laps, boundaries }: { laps: Lap[]; boundaries: Boundaries }) {
  const paces = laps.map((l) => (l.movingS / l.distanceM) * 1000);
  const mx = Math.max(...paces),
    mn = Math.min(...paces);
  const grid = "grid grid-cols-[28px_1fr_46px_40px_38px] gap-2 items-center";
  return (
    <div className="card p-4 flex flex-col gap-[6px]">
      <div className={`${grid} text-[11px] font-semibold text-muted`}>
        <span>km</span>
        <span />
        <span className="text-right">pace</span>
        <span className="text-right">bpm</span>
        <span className="text-right">elev</span>
      </div>
      {laps.map((l, i) => (
        <div key={l.id} className={`${grid} h-[19px]`}>
          <span className="k text-[11px]">{l.distanceM >= 900 ? l.index : (l.distanceM / 1000).toFixed(1)}</span>
          <div className="h-1 rounded bg-[#eef0f3]">
            <div
              className="h-full rounded opacity-85"
              style={{
                width: `${((mx - paces[i]) / (mx - mn + 1)) * 80 + 20}%`,
                background: ZONE_COLORS[zoneFor(l.avgHr, boundaries)],
              }}
            />
          </div>
          <span className="num text-[13px] text-right">{formatPace(paces[i])}</span>
          <span className="num text-[13px] text-right font-bold">{l.avgHr ? Math.round(l.avgHr) : "—"}</span>
          <span className="k text-[11px] text-right">
            {l.elevationGainM != null ? `+${Math.round(l.elevationGainM)}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
```

`app/(app)/runs/[id]/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAthlete } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { getActivity } from "@/lib/db/activities";
import { zoneBoundaries } from "@/lib/metrics/zones";
import { zoneSeconds } from "@/lib/metrics/zoneTime";
import { formatDuration, formatKm, formatPace } from "@/lib/format";
import { TypePill } from "@/components/TypePill";
import { LapTable } from "@/components/LapTable";
import { ZoneBar } from "@/components/ZoneBar";
import { TabBar } from "@/components/TabBar";

export const dynamic = "force-dynamic";

export default async function RunDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const athlete = await requireAthlete();
  const a = await getActivity(db, athlete.id, id);
  if (!a) notFound();
  const b = zoneBoundaries(athlete);
  const when = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: a.timezone,
  }).format(a.startedAt);
  return (
    <>
      <header className="flex items-center justify-between px-5 pt-[22px] pb-[14px]">
        <div className="flex flex-col gap-[2px]">
          <span className="k flex items-center gap-2">
            <Link href="/runs">← Runs</Link> · {when} · <TypePill type={a.type} />
          </span>
          <span className="num text-[26px]">{a.name}</span>
        </div>
      </header>
      <div className="px-4 flex flex-col gap-3">
        <div className="hero p-5 flex justify-between items-end">
          <div>
            <div className="num text-[40px]">
              {formatKm(a.distanceM)}
              <span className="text-sm font-medium opacity-85"> km</span>
            </div>
          </div>
          <div className="text-right">
            <div className="num text-[26px]">{formatDuration(a.movingS)}</div>
            <div className="text-[11px] opacity-85">time</div>
          </div>
          <div className="text-right">
            <div className="num text-[26px]">{formatPace(a.avgPaceSPerKm)}</div>
            <div className="text-[11px] opacity-85">/km</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat v={a.avgHr ? String(Math.round(a.avgHr)) : "—"} k="avg bpm" color="text-sky-text" />
          <Stat v={a.maxHr ? String(Math.round(a.maxHr)) : "—"} k="max bpm" />
          <Stat v={a.avgCadence ? String(Math.round(a.avgCadence)) : "—"} k="spm" />
        </div>
        {a.laps.length > 0 && <ZoneBar seconds={zoneSeconds(a.laps, b)} />}
        {a.laps.length > 0 && <LapTable laps={a.laps} boundaries={b} />}
      </div>
      <TabBar active="Runs" />
    </>
  );
}
function Stat({ v, k, color = "" }: { v: string; k: string; color?: string }) {
  return (
    <div className="card px-[14px] py-3 flex flex-col gap-1">
      <span className={`num text-[26px] ${color}`}>{v}</span>
      <span className="k">{k}</span>
    </div>
  );
}
```

- [ ] **Step 4: Run tests, lint, build** → PASS.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat: run detail with zone bar and lap table"
git push
```

---

### Task 13: Account page — Strava connect state, max HR, sync log

**Files:**

- Create: `app/(app)/account/page.tsx`, `app/(app)/account/actions.ts`, `lib/db/syncLogQueries.ts`, `tests/integration/athlete-update.test.ts`

**Interfaces:**

- Produces: server action `updateAthlete(formData)` setting `maxHr` (and clearing `hrZoneBoundaries` so zones re-derive); `recentSyncLogs(dbc, athleteId, n = 10)`.

- [ ] **Step 1: Failing test**

`tests/integration/athlete-update.test.ts`:

```ts
import { it, expect, beforeAll, afterAll } from "vitest";
import { createTestDb, type TestDb } from "../helpers/db";
import { ensureAthlete, setMaxHr } from "@/lib/db/athlete";
import { startSyncLog } from "@/lib/pipeline/syncLog";
import { recentSyncLogs } from "@/lib/db/syncLogQueries";

let db: TestDb;
let close: () => Promise<void>;
beforeAll(async () => ({ db, close } = await createTestDb()));
afterAll(() => close());

it("updates max HR and lists recent sync logs newest first", async () => {
  const a = await ensureAthlete(db, "athlete@example.com");
  await setMaxHr(db, a.id, 196);
  expect((await ensureAthlete(db, a.email)).maxHr).toBe(196);
  const l1 = await startSyncLog(db, a.id, "manual");
  await l1.finish("ok", 2);
  const l2 = await startSyncLog(db, a.id, "cron");
  await l2.finish("failed", 0, "429");
  const logs = await recentSyncLogs(db, a.id, 10);
  expect(logs.map((l) => l.kind)).toEqual(["cron", "manual"]);
  expect(logs[0].error).toBe("429");
});
```

- [ ] **Step 2: Run to verify failure** → FAIL.

- [ ] **Step 3: Implement**

Add to `lib/db/athlete.ts`:

```ts
export async function setMaxHr(dbc: AnyDb, athleteId: string, maxHr: number) {
  await dbc.update(athletes).set({ maxHr, hrZoneBoundaries: null }).where(eq(athletes.id, athleteId));
}
```

`lib/db/syncLogQueries.ts`:

```ts
import { desc, eq } from "drizzle-orm";
import { syncLog } from "./schema";
import type { AnyDb } from "./athlete";
export function recentSyncLogs(dbc: AnyDb, athleteId: string, n = 10) {
  return dbc.select().from(syncLog).where(eq(syncLog.athleteId, athleteId)).orderBy(desc(syncLog.startedAt)).limit(n);
}
```

`app/(app)/account/actions.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { requireAthlete } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { setMaxHr } from "@/lib/db/athlete";

export async function updateAthlete(fd: FormData) {
  const athlete = await requireAthlete();
  const maxHr = Number(fd.get("maxHr"));
  if (Number.isFinite(maxHr) && maxHr >= 120 && maxHr <= 230) await setMaxHr(db, athlete.id, Math.round(maxHr));
  revalidatePath("/account");
}
```

`app/(app)/account/page.tsx`:

```tsx
import { requireAthlete, signOut } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { getConnection } from "@/lib/strava/connection";
import { recentSyncLogs } from "@/lib/db/syncLogQueries";
import { zoneBoundaries } from "@/lib/metrics/zones";
import { updateAthlete } from "./actions";
import { TabBar } from "@/components/TabBar";

export const dynamic = "force-dynamic";

export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ import?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const athlete = await requireAthlete();
  const [conn, logs] = await Promise.all([getConnection(db, athlete.id), recentSyncLogs(db, athlete.id)]);
  const b = zoneBoundaries(athlete);
  return (
    <>
      <header className="flex items-center justify-between px-5 pt-[22px] pb-[14px]">
        <div className="flex flex-col gap-[2px]">
          <span className="k">{athlete.email}</span>
          <span className="num text-[26px]">Account</span>
        </div>
        <a href="/runs" className="w-9 h-9 rounded-lg bg-white border border-line grid place-items-center text-muted">
          ←
        </a>
      </header>
      <div className="px-4 flex flex-col gap-3">
        {sp.error && <p className="card p-3 text-red text-sm">Strava connection failed ({sp.error}). Try again.</p>}
        {sp.import === "started" && (
          <p className="card p-3 text-sm">
            Importing your Strava history — runs will appear on the Runs tab as they land.
          </p>
        )}

        <div className="hero p-4 flex items-center gap-[14px]">
          <div className="flex-1">
            <div className="font-extrabold">{conn ? "Strava connected" : "Strava not connected"}</div>
            <div className="text-xs opacity-85">
              {conn ? (
                <>
                  {conn.importStatus === "running"
                    ? `Importing… ${conn.importedCount} runs so far`
                    : conn.lastSyncAt
                      ? `Synced ${conn.lastSyncAt.toLocaleString("en-GB")} · ${conn.importedCount} runs`
                      : "Ready"}
                </>
              ) : (
                "Connect once; every run syncs automatically."
              )}
            </div>
          </div>
          {conn ? (
            <form action="/api/strava/disconnect" method="post">
              <button className="text-xs font-bold opacity-85">Disconnect</button>
            </form>
          ) : (
            <a
              href="/api/strava/connect"
              className="h-9 px-4 rounded-lg bg-white text-ink text-[13px] font-extrabold grid place-items-center"
            >
              Connect
            </a>
          )}
        </div>

        <span className="k px-[6px]">Athlete</span>
        <form action={updateAthlete} className="card px-4 py-1">
          <label className="flex items-center justify-between min-h-11 border-b border-line">
            <span className="font-semibold">Max heart rate</span>
            <span className="flex items-center gap-2">
              <input
                name="maxHr"
                type="number"
                defaultValue={athlete.maxHr ?? ""}
                placeholder="e.g. 196"
                className="w-20 text-right border border-line rounded-lg px-2 h-8"
              />
              <button className="text-xs font-bold">Save</button>
            </span>
          </label>
          <div className="flex items-center justify-between min-h-11">
            <span className="font-semibold">HR zones</span>
            <span className="text-muted text-[13px] font-semibold">{b.join(" · ")}</span>
          </div>
        </form>

        <span className="k px-[6px]">Sync log</span>
        <div className="card px-4 py-1">
          {logs.length === 0 && <div className="min-h-11 flex items-center k">No syncs yet</div>}
          {logs.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between min-h-11 border-b border-line last:border-0 text-[13px]"
            >
              <span className="font-semibold capitalize">{l.kind}</span>
              <span className={l.status === "failed" ? "text-red" : "text-muted"}>
                {l.status === "failed" ? (l.error ?? "failed") : `${l.activitiesProcessed} runs`} ·{" "}
                {l.startedAt.toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/signin" });
          }}
        >
          <button className="k underline">Sign out</button>
        </form>
        <div className="flex justify-center text-[11px] text-muted font-semibold py-2">Powered by Strava</div>
      </div>
      <TabBar active="" />
    </>
  );
}
```

- [ ] **Step 4: Run tests, lint, build** → PASS.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat: account page with Strava connection, max HR and sync log"
git push
```

---

### Task 14: PWA manifest, CI, Playwright smoke, deployment runbook

**Files:**

- Create: `public/manifest.webmanifest`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `.github/workflows/ci.yml`, `playwright.config.ts`, `e2e/smoke.spec.ts`, `docs/runbook.md`

- [ ] **Step 1: Manifest and icons**

`public/manifest.webmanifest`:

```json
{
  "name": "Ritmo",
  "short_name": "Ritmo",
  "start_url": "/runs",
  "display": "standalone",
  "background_color": "#f7f8fa",
  "theme_color": "#16223d",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

Generate icons (navy square with a white "R" in Manrope 800) with a quick script, or ImageMagick:

```bash
magick -size 512x512 xc:"#16223d" -fill white -font Manrope-ExtraBold -pointsize 300 -gravity center -annotate 0 "R" public/icons/icon-512.png
magick public/icons/icon-512.png -resize 192x192 public/icons/icon-192.png
```

(If Manrope isn't installed for ImageMagick, use `-font DejaVu-Sans-Bold`; the icon is a placeholder until a real mark exists.)

- [ ] **Step 2: CI**

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run format:check
      - run: npm test
      - run: npm run build
        env:
          DATABASE_URL: postgres://ci:ci@localhost/ci
          AUTH_SECRET: ci
          AUTH_RESEND_KEY: ci
          ALLOWED_EMAIL: ci@example.com
          STRAVA_CLIENT_ID: "1"
          STRAVA_CLIENT_SECRET: ci
          STRAVA_WEBHOOK_VERIFY_TOKEN: ci
          CRON_SECRET: ci
          NEXT_PUBLIC_APP_URL: http://localhost:3000
```

- [ ] **Step 3: Playwright smoke (sign-in page renders, protected route redirects)**

`playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/signin",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
```

`e2e/smoke.spec.ts`:

```ts
import { test, expect } from "@playwright/test";
test("unauthenticated /runs redirects to sign-in", async ({ page }) => {
  await page.goto("/runs");
  await expect(page).toHaveURL(/\/signin/);
  await expect(page.getByRole("button", { name: /send sign-in link/i })).toBeVisible();
});
test("webhook challenge answers with the right token", async ({ request }) => {
  const r = await request.get(
    "/api/strava/webhook?hub.mode=subscribe&hub.verify_token=" +
      process.env.STRAVA_WEBHOOK_VERIFY_TOKEN +
      "&hub.challenge=abc",
  );
  expect(r.status()).toBe(200);
  expect(await r.json()).toEqual({ "hub.challenge": "abc" });
});
```

Run locally: `npx playwright install chromium && npm run e2e` → both PASS (needs `.env.local` with a reachable `DATABASE_URL`; the sign-in page itself does not query the DB).

- [ ] **Step 4: Runbook**

`docs/runbook.md`:

```markdown
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
```

- [ ] **Step 5: Run everything**

Run: `npm run lint && npm test && npm run build`
Expected: all green. Push and confirm the GitHub Action passes.

- [ ] **Step 6: Commit and push**

```bash
git add -A
git commit -m "feat: PWA manifest, CI workflow, Playwright smoke, deployment runbook"
git push
```

---

## Self-review

**Spec coverage (Stage 1 scope):** skeleton ✔ (T1), auth magic link + ALLOWED_EMAIL ✔ (T3), Strava connect ✔ (T8), history import with progress ✔ (T7/T13), webhook with deletes ✔ (T9), nightly cron + token refresh ✔ (T4/T9), manual sync ✔ (T8), sync_log + Account display ✔ (T6/T13), raw_json kept ✔ (T6), override protection ✔ (T6), Runs feed with type filter and per-km zone bars ✔ (T11), Run detail with laps and zone bar ✔ (T12), "Powered by Strava" ✔ (T13), PWA manifest ✔, CI ✔, Playwright smoke ✔ (T14), Vercel cron schedule ✔ (T9), Drizzle migrations in build ✔ (runbook). Deliberately deferred to Stage 2+: GAP, weather, best efforts, fitness/fatigue, planned-session match, Home screen, Calendar, upload (hook point `afterUpsert` left for Stage 2).

**Standards:** Task 1b establishes strict TS, ESLint strict-type-checked, Prettier, husky/lint-staged, README/LICENSE/CONTRIBUTING/SECURITY/CHANGELOG, PR template and Dependabot; CI runs lint, typecheck, format check, tests and build.

**Placeholder scan:** none — every step has code. Icon generation notes a placeholder _asset_, which is intended.

**Type consistency:** `AnyDb` defined in T3 and used in T6–T13; `NormalisedActivity` shape in T5 matches `processActivity` in T6 and `NewActivity` columns in T2; `StravaClient` methods used by T7/T9 match T4; `Boundaries`/`zoneFor`/`ZONE_COLORS` in T10 used by T11/T12; `ActivityWithLaps` from T10 consumed by `RunCard` in T11. `requireAthlete` returns `Athlete` whose `hrZoneBoundaries` typing matches `zoneBoundaries()` input.
