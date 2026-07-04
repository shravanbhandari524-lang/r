# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Freshers' Quiz Challenge" — a live, single-session quiz web app run during a college orientation. One admin starts a timed quiz; many participants register (no login), answer, auto-save, and submit. The leaderboard ranks everyone. Built on an Emergent Agent "nextjs + mongo + shadcn" base template (see `.emergent/`).

## Commands

Package manager is **yarn** (1.22). There is no lint script and no JS test runner configured.

- `yarn dev` — dev server on `0.0.0.0:3000` (capped to 512 MB heap; webpack poll-based watch, see `next.config.js`)
- `yarn build` / `yarn start` — standalone production build / run (`output: 'standalone'`)
- `python3 backend_test.py` — the only real test suite: a 25-step E2E `requests`-based walk of every API endpoint, run against the **deployed preview** (`BASE_URL` at the top of the file, hardcoded `ADMIN_TOKEN`). It is not a localhost test; it mutates the live DB (registers a participant, adds/deletes a question). Requires Python `requests`.

`tests/` is empty (just `__init__.py`); `test_reports/pytest/.gitkeep` is a placeholder, no pytest tests exist.

## Architecture

### Everything routes through one catch-all API
All backend logic lives in `app/api/[[...path]]/route.js` — a single `handle(request, method, pathParts)` function that pattern-matches `path` + `method` manually. **To add or change an endpoint, edit `handle()` there** — there is no per-route file structure. `GET/POST/PUT/DELETE` exports all just delegate to `handle()` with the method and `params.path`.

Path segments are matched in order: bare paths (`'quiz'`) checked first, then parameterized ones (`pathParts[0] === 'participants' && pathParts.length === 2`). Mind this order when adding routes — a new route can shadow or be shadowed by an earlier match.

### MongoDB connection
`getDb()` caches a single `MongoClient` at module scope (`cachedClient`). `uri` comes from `MONGO_URL`, db from `DB_NAME` (default `freshers_quiz`). `mongodb` is in `serverExternalPackages` (Next 15 rename of `experimental.serverComponentsExternalPackages`) so it isn't bundled into the server edge bundle.

### Auto-seeding runs on every request
`ensureSeed(db)` is called at the top of `handle()` for *every* API call. It idempotently creates the `quiz` doc (`id: 'main'`, `status: 'idle'`, 10-minute duration) and inserts the 10 `SEED_QUESTIONS` if the `questions` collection is empty, then (best-effort) creates indexes. Keep any new seed/index logic idempotent — it runs constantly.

### Collections
`quiz` (single doc, `id:'main'`), `questions` (4-option MCQs with `correct_index` + `order`), `participants`, `responses` (one per participant: `answers` map + `marked` array + `submitted` flag), `results` (computed score/percentage/time). Public question fetches strip `correct_index` via projection — **never return `correct_index` to the participant client**; only the admin endpoints include it.

### Quiz lifecycle
`status`: `idle → running → ended`. Admin sets running via `admin/quiz/start` (writes `started_at`); client timers are **server-synced**: deadline = `quiz.started_at + duration_minutes`, polled every 500ms (`QuizView` in `app/page.js`). Do not compute the deadline from local clock — always from server `started_at`. Auto-submit fires when `remaining === 0`. Submit is idempotent (returns existing `result` if already scored) and guarded client-side by `submittedRef`.

### Two clients
- `app/page.js` — participant flow. A single `App()` component switches `view` state (`loading|landing|register|waiting|quiz|results|leaderboard`). Participant id is persisted in `localStorage` under `fq_participant_id`; on load the app resumes the right view by checking `participants/{pid}` for a result and `quiz.status`. Copy/cut/paste/contextmenu and `beforeunload` are blocked during the quiz.
- `app/admin/page.js` — admin dashboard (questions CRUD, bulk CSV/JSON upload, quiz start/end/reset, duration/title, results + CSV export). Token in `localStorage` under `fq_admin_token`, sent as `Authorization: Bearer <token>`.

### Auth (know its limits)
Hardcoded in `route.js`: `ADMIN_USER='admin'`, `ADMIN_PASS='pass7890'`, `ADMIN_TOKEN = base64('admin:pass7890')`. `isAdmin()` checks `Authorization: Bearer <token>`. All `admin/*` routes except `admin/login` require it. There is no participant auth — replay protection is via USN uniqueness on register + the per-response `submitted` flag + the idempotent submit. This is deliberate simplification for a one-night event; don't add a real auth system unless asked.

## Conventions

- Path alias `@/*` → repo root (`jsconfig.json`); components imported as `@/components/ui/...`, lib as `@/lib/...`.
- UI is shadcn/ui (Radix primitives) in `components/ui/` + Tailwind. `lib/utils.js` exports `cn()` (clsx + tailwind-merge). Custom glass surfaces use the `.glass` / `.glass-strong` classes in `app/globals.css` — this is a dark-only theme (`<html className="dark">`), no light-mode support.
- Toasts via `sonner` (`toast.success/error`), already wired in `app/layout.js`.
- IDs are UUIDv4 (`uuid`), not Mongo `_id` — all queries filter by `id`, and responses project out `_id`.
- `data-testid` values, where they exist, are centralized in `lib/constants/testIds/` (kebab-case `<feature>-<element>`; required by the Emergent qabot testing agent's matcher and the `emergent(kebab-case-testid)` lint rule). The existing files are template stubs (auth/home), not exhaustive — add testids as you build interactive UI the qabot should verify.

## Environment

`.env` (committed): `MONGO_URL` (Atlas connection string, includes DB), `DB_NAME`, `NEXT_PUBLIC_BASE_URL` (the Emergent preview origin), `CORS_ORIGINS` (defaults to `*` via `next.config.js` headers). Note: `.env` is tracked in git for this template — rotate the Atlas password if reused outside the sandbox.
