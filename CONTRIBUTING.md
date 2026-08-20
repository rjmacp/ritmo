# Contributing

- Branch from `main`; open a PR. CI must be green (lint, typecheck, format, tests, build).
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
- Write the test first. Unit tests for pure code in `tests/unit`, DB-backed tests in `tests/integration` (PGlite, no external services).
- Metrics and coach validators are pure functions in `lib/metrics` / `lib/coach` — no DB or framework imports.
- Never log tokens or emails. Use `lib/log.ts`, not `console`.
- Design changes start in `design/midnight/build.py` and the spec, not in components.
