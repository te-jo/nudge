You are an expert full-stack engineer helping build **nudge**, a small production-quality app.

You write clean, simple, maintainable code. You prioritize clarity over unnecessary abstraction — this is an MVP, not a platform. Build the smallest useful version of each feature first.

---

## Project Overview

nudge lets a user tap an NFC tag, which logs an event against whatever task that tag is assigned to, and later browse that history.

Core loop:

1. Tap a physical NFC tag with the phone.
2. The app reads the tag's UID, resolves it to a task, and logs an event.
3. The user can browse past events (history), manage tags, and manage tasks.

The mobile app is a **thin client**. It holds no business logic beyond reading NFC hardware and rendering server state — everything else (validation, persistence, history) lives in the API.

---

## Tech Stack

- **apps/api** — Node.js, Express, TypeScript, Drizzle ORM, Postgres, deployed on Fly.io
- **apps/mobile** — React Native, Expo, TypeScript, `react-native-nfc-manager`, React Query
- **packages/shared-types** — plain TypeScript interfaces (`Tag`, `Task`, `Event`) imported by both apps, no build step

Do not introduce a new major library (state manager, ORM, UI kit, etc.) without proposing it first and explaining why it's worth the added dependency.

---

## Monorepo Layout

```txt
nudge/
  apps/
    api/            Express + Drizzle + Postgres backend
    mobile/         Expo app
  packages/
    shared-types/   Tag, Task, Event interfaces — single source of truth
  AGENTS.md
```

npm workspaces wires these together (`npm install` at the root installs everything). Never `npm install` inside a workspace directly with a version that would create a nested lockfile — run installs from the repo root.

---

## Development Philosophy

For every feature:

1. Check this file before coding.
2. If the type shape changes, update `packages/shared-types` first — the API and the app both consume it, and it should never drift.
3. Keep the implementation to the smallest slice that works end-to-end (DB → API → app screen), then iterate.
4. Avoid speculative abstraction: don't build a generic "resource" layer for three tables, don't add config options nobody asked for.
5. Prefer readable code over clever code.
6. Fix type errors and lint errors before considering a feature done.

---

## packages/shared-types

- Holds `Tag`, `Task`, `Event`, and their `Create*Input` / `Update*Input` variants.
- No build step: `main`/`types` point straight at `src/index.ts`. Both the API (via `tsx`) and Metro (via monorepo workspace resolution) consume the TypeScript source directly.
- Wire values are JSON — dates are ISO strings (`createdAt: string`), not `Date` objects. Convert at the edges (DB row → API response, API response → UI), not in shared types.
- If the API and the mobile app need different shapes for the same concept (e.g. a paginated history response), that composed type still lives here, not duplicated in both apps.

---

## apps/api

- Express routes, one router per resource (`tags`, `tasks`, `events`).
- Drizzle schema in `src/db/schema.ts` is the source of truth for table shape; `packages/shared-types` should mirror it in application-facing form (camelCase, ISO date strings).
- Validate request bodies against the shared `Create*Input`/`Update*Input` types before hitting the DB. Prefer a small runtime validator (e.g. `zod`) over hand-rolled `if` checks once payloads have more than 1-2 fields — ask before adding it if it's not already a dependency.
- Every route returns JSON; errors return `{ error: string }` with an appropriate status code, consistently.
- No secrets in the mobile app — anything sensitive (DB credentials, future API keys) stays server-side, read from environment variables.

---

## apps/mobile

- Expo Router for navigation. Screens: Home feed, Tags grid, Tag detail, History.
- The app never talks to Postgres directly — every read/write goes through `apps/api` over HTTP.
- Use React Query for all server state (fetching tags/tasks/events, mutations for logging events). No hand-rolled `useEffect` + `useState` fetch chains.
- NFC reads happen via `react-native-nfc-manager`. This requires a custom dev client (NFC isn't available in Expo Go) — see the mobile setup step for details.
- Keep screens thin: compose components, call hooks/React Query, delegate business logic to the API.

---

## TypeScript Rules

- Strict mode everywhere. Avoid `any`.
- Import domain types from `@nudge/shared-types` — never redeclare `Tag`/`Task`/`Event` locally in either app.

---

## Linting and Validation

Run before considering a feature done (commands land here as each workspace is scaffolded):

```bash
npm run typecheck
npm run lint
```

---

## Communication Style

Be concise. Explain what changed and how to test it. Flag tradeoffs and ask before adding a new dependency or deviating from this file.
