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
- **apps/mobile** — React Native, Expo (Router), TypeScript, NativeWind (Tailwind for RN), React Query, `react-native-nfc-manager`
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
  docs/
    architecture.md   hand-written: diagrams + system overview
    decisions/        ADRs (000-template.md is the template)
    generated/        produced by `npm run docs:generate` — never hand-edit
  scripts/
    generate-docs.ts  regenerates docs/generated/
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
7. If the change touched the DB schema or any API route, run `npm run docs:generate` and include the updated `docs/generated/` files in the same commit — see [Documentation](#documentation).

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
- Changing the schema or any route means `docs/generated/` is now stale — run `npm run docs:generate` before you finish. See [Documentation](#documentation).

---

## apps/mobile

```txt
apps/mobile/
  src/
    app/
      (tabs)/          Home, Tags grid, History — the tab bar
      tags/[id].tsx      Tag detail (view/edit/log/delete) — pushed, not a tab
      tags/register.tsx  Register a new tag (writes NFC + creates the Tag)
    components/         Reusable UI (Screen, Button, EventRow, TaskPicker, NewTaskField)
    lib/                api.ts (fetch wrapper), query-client.ts, nfc.ts
    hooks/               use-tasks.ts, use-tags.ts, use-events.ts (React Query)
  metro.config.js         monorepo resolution (watchFolders/nodeModulesPaths) + NativeWind
  babel.config.js          babel-preset-expo with nativewind jsxImportSource
  tailwind.config.js
```

- Scaffolded from Expo's default template (Router + TypeScript already wired); source lives under `src/`, not the repo root.
- The app never talks to Postgres directly — every read/write goes through `apps/api` over HTTP via `src/lib/api.ts` (`apiFetch`), which derives the dev API host from the Expo packager's own host IP so a physical device on the same network can reach a laptop running the API — `EXPO_PUBLIC_API_URL` overrides it.
- Use React Query for all server state (fetching tags/tasks/events, mutations for logging events) — `QueryClientProvider` is already wired in `src/app/_layout.tsx`. No hand-rolled `useEffect` + `useState` fetch chains. When state needs to be derived from a query result (e.g. an editable field seeded from server data), adjust it during render (compare against a "loaded for id" flag) rather than in a `useEffect` — see `tags/[id].tsx`.
- Keep screens thin: compose components, call hooks/React Query, delegate business logic to the API.
- **Every mutation needs a visible failure path.** A mutation that fails silently is worse than one that crashes: the user taps "Log Event Now", nothing changes on screen, and they reasonably assume it worked. So either pass `onError` at the call site — `mutate(vars, { onError: (err) => alertError("Couldn't log event", err) })`, which runs *in addition to* any handler on the hook — or wrap `mutateAsync` in try/catch. Never leave a `mutate`/`mutateAsync` call with no error path. This can't be linted, so it's on you to check.
- `expo-env.d.ts` and `.expo/types/router.d.ts` are generated by the Expo CLI (gitignored). If typecheck complains about routes or `@/global.css` that clearly exist, run `npm run start -w apps/mobile` once (let it bundle, then stop it) to regenerate them — this is needed after adding/removing route files, not just on first clone.

### NFC (`src/lib/nfc.ts`)

Tags are identified by an app-generated token written into the tag's NDEF data — **not** the tag's hardware UID. Hardware UID access is inconsistent across tag types/platforms; writing our own token is the standard, reliable pattern, and it's why the MVP spec calls for NFC read *and* write.

- `readTagToken()` — reads the token off a tag. Returns `null` if the tag has no NDEF data (never registered).
- `writeTagToken(token)` — overwrites a tag's NDEF data with a token.
- `generateTagToken()` — a fresh random token (`expo-crypto`'s `randomUUID`) for registering a new tag.

Scan flow (Home screen): read → if a token comes back, resolve it via `GET /tags/uid/:token`. Found → log the event immediately and open the tag. Not found (or blank tag) → send the user to `tags/register`, which always writes a *fresh* token on save rather than trying to reuse whatever was read — simpler than branching on "has a token but unregistered" vs. "truly blank."

NFC requires a custom dev client — it doesn't work in Expo Go, and it doesn't work in any simulator/emulator (no software NFC radio). Testing the real tap requires a physical device with a dev client build installed (`npx expo prebuild` + local Xcode/Android Studio, or EAS Build). Everything else (tasks, tags, history, manual "Log Event Now" on the Tag detail screen) works fine in Expo Go / the web build without a physical tag.

**Apple Developer Program is required for iOS NFC** — a free/personal Apple ID team cannot build with the NFC Tag Reading entitlement at all ("Personal development teams ... do not support the NFC Tag Reading capability"). This is an Apple account-tier restriction, not a build-tooling issue — it applies whether building locally or via EAS. A free personal team is sufficient for everything else (signing, installing non-NFC builds on a device).

**Local iOS dev-client build steps** (once enrolled in the paid program): `apps/mobile/app.json`'s `ios.appleTeamId` must be set to your team ID (find it in Xcode → Settings → Accounts after adding your Apple ID). Then from `apps/mobile`: `npx expo prebuild --platform ios` (always run from `apps/mobile`, never the repo root — running it elsewhere generates a stray native project using the wrong package.json's name/bundle id), then `npx expo run:ios --device "<device name>"`. Requires Homebrew + CocoaPods (`brew install cocoapods`), `xcode-select -s /Applications/Xcode.app/Contents/Developer` (not just the Command Line Tools), and the matching iOS platform installed in Xcode (Settings → Components) for whatever iOS version the test device runs.

### Styling

Use NativeWind (`className`) for everything by default. A few React Native components take props NativeWind can't reach (dynamic/animated values, or RN-specific props with no Tailwind equivalent) — use `StyleSheet`/inline styles only for those:

| Component / case | Why |
| --- | --- |
| `SafeAreaView` (from `react-native-safe-area-context`) | `className` not supported |
| `Modal` | `visible`/`transparent` props, not styling |
| `Animated.View` / animated style values | Values computed at runtime |
| Dynamic/computed styles | Not expressible as static utility classes |

Everything else stays NativeWind — don't reach for `StyleSheet` out of habit.

---

## TypeScript Rules

- Strict mode everywhere. Avoid `any`.
- Import domain types from `@nudge/shared-types` — never redeclare `Tag`/`Task`/`Event` locally in either app.

---

## Documentation

Docs live in `docs/` and come in three kinds. Only one of them is ever edited by hand without thinking about it.

### `docs/generated/` — never hand-edit

`schema.md` (Mermaid ER diagram + column tables) and `routes.md` (full route map) are produced by `scripts/generate-docs.ts` from the real source: Drizzle's table metadata and a static parse of the route files.

**Regenerate whenever you touch any of these files**, and commit the result alongside the change:

| If you changed… | Then run |
| --- | --- |
| `apps/api/src/db/schema.ts` | `npm run docs:generate` |
| anything in `apps/api/src/routes/` | `npm run docs:generate` |
| route mounts in `apps/api/src/index.ts` | `npm run docs:generate` |

It's safe to run any time — output is idempotent, so a no-op change produces no diff. If it reports a skipped section, the expected file path moved and `scripts/generate-docs.ts` needs its path constants updated. The script is type-checked via `scripts/tsconfig.json` as part of `npm run typecheck`.

A **pre-commit hook enforces this** (`.githooks/pre-commit`, wired up by the root `prepare` script on `npm install`). When a commit stages anything under `apps/api/src/db/schema.ts`, `apps/api/src/routes/`, or `apps/api/src/index.ts`, it regenerates the docs and stages the result into that same commit. Commits touching nothing else are unaffected. Two caveats worth knowing:

- It reads the **working tree**, not the staged snapshot — on a partial commit, the regenerated docs reflect everything on disk, not just what you staged.
- If `npm` isn't on the hook's PATH it warns and lets the commit through rather than blocking; `git commit --no-verify` also skips it. Either way `docs/generated/` can go stale, so re-run `npm run docs:generate` if you see that warning.

### `docs/architecture.md` — hand-written

Update it when the *shape* of the system changes, not on every schema tweak. That means: a new service or external dependency, a change to how the core scan flow works, a new deployment target, or a component moving between layers. Column-level detail belongs in `docs/generated/schema.md` — don't duplicate it here.

### `docs/decisions/` — ADRs

Write one when a decision was expensive to make or would be expensive to reverse: data model shape, a protocol, a hosting choice, a significant dependency. Copy `000-template.md` to `NNN-short-title.md`. Don't rewrite an accepted ADR to change its conclusion — add a new one and mark the old `Superseded by`. Routine coding conventions belong in this file instead.

---

## Linting and Validation

Run before considering a feature done:

```bash
npm run typecheck        # all workspaces + scripts/
npm run lint
npm run docs:generate    # if the schema or any route changed
```

`apps/mobile/eslint.config.js` layers type-aware rules on top of `eslint-config-expo`. Prefer fixing a violation over disabling the rule; if you genuinely need an escape hatch, disable it on the single line with a reason.

| Rule | Why it's on |
| --- | --- |
| `no-floating-promises` | A dropped promise swallows its rejection. Deliberate fire-and-forget calls (e.g. `queryClient.invalidateQueries`) are marked with `void` to say so out loud. |
| `no-misused-promises` | Catches an async function handed to something expecting a sync result. `checksVoidReturn.attributes` is off, since `onPress={async () => …}` is normal React and flagging it just adds noise. |
| `no-explicit-any` | Makes the "avoid `any`" rule above enforceable instead of advisory. |
| `consistent-type-imports` | `@nudge/shared-types` is types-only — `import type` keeps it erased at build time rather than becoming a runtime import Metro must resolve. |

Mechanically checkable conventions belong here, in the linter, rather than as prose in this file. Prose is for judgment calls the linter can't make — like the mutation error-handling rule above.

---

## Communication Style

Be concise. Explain what changed and how to test it. Flag tradeoffs and ask before adding a new dependency or deviating from this file.
