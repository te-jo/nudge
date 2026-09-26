---
name: add-api-resource
description: Add or change a resource end to end across the nudge monorepo — shared types, Drizzle schema and migration, Express routes with zod validation, React Query hooks, and regenerated docs. Use when adding a new table or endpoint, adding a field to an existing one, or when a change needs to flow from the database through to a mobile screen.
---

# Adding or changing a resource, end to end

A resource in nudge touches four places. Do them in this order — types first means the compiler tells you everywhere else that needs updating.

## 1. Shared types — `packages/shared-types/src/`

Start here. Both apps consume these, and they should never drift.

- One file per domain concept (`tag.ts`, `task.ts`, `event.ts`), re-exported from `index.ts`.
- Define the entity plus its `Create*Input` / `Update*Input` variants.
- **Wire values are JSON**: dates are ISO strings (`createdAt: string`), never `Date`. Convert at the edges.
- Composed read-models (e.g. `EventWithRelations`, an event joined with its tag/task names) live here too — not duplicated in the app.

## 2. Database — `apps/api/src/db/schema.ts`

Add the `pgTable` and its `relations`. Conventions in this repo:

- `id: uuid("id").primaryKey().defaultRandom()`
- snake_case column names, camelCase TS properties
- `timestamp(..., { withTimezone: true }).notNull().defaultNow()` for timestamps
- Be deliberate about `onDelete`. Existing choices: deleting a tag **cascades** to its events; deleting a task **sets null** on referencing rows so history survives.

Then generate and apply the migration:

```bash
npm run db:generate -w apps/api    # writes SQL into apps/api/drizzle/
npm run db:migrate  -w apps/api    # applies to the DATABASE_URL in apps/api/.env
```

Read the generated SQL before applying it — it's short, and it's the last chance to catch a wrong FK or a missing constraint.

## 3. API — `apps/api/src/`

- **Validation** (`lib/validation.ts`): a zod schema per input, tied to the shared type so they can't drift:
  ```ts
  export const createThingSchema = z.object({ … }) satisfies z.ZodType<CreateThingInput>;
  ```
- **Router** (`routes/<resource>.ts`): one router per resource, `export const <name>Router = Router()`.
  - Parse bodies with `parseBody(schema, req.body)` — it throws `HttpError(400, …)` with a readable message.
  - Throw `HttpError(404, "… not found")` for misses; the central handler in `index.ts` formats every error as `{ error: string }`.
  - Express 5 forwards rejected promises to the error handler automatically — no try/catch wrapper needed in handlers.
- **Mount it** in `index.ts`: `app.use("/things", thingsRouter)`.

Route ordering note: multi-segment literals like `/uid/:uid` don't collide with `/:id`, since those match different segment counts.

## 4. Mobile — `apps/mobile/src/`

- **Hooks** (`hooks/use-<resource>.ts`): React Query only, no `useEffect` fetch chains. Queries keyed `["things"]` / `["things", id]`; mutations invalidate with `void queryClient.invalidateQueries({ queryKey: ["things"] })` (the `void` is required by the lint rule and marks it deliberately fire-and-forget).
- **Every mutation needs a visible failure path** — pass `onError` at the call site or wrap `mutateAsync` in try/catch. A silent failure looks identical to success to the user. This can't be linted; it's on you.
- Screens stay thin: compose components, call hooks, let the API hold the logic.

## 5. Regenerate docs and verify

```bash
npm run docs:generate    # required whenever schema or routes changed
npm run typecheck        # all workspaces + scripts/
npm run lint
```

The pre-commit hook regenerates docs too, but running it yourself keeps the diff reviewable before you commit.

## Testing it for real

The API is verifiable without the app — start it and use curl:

```bash
npm run dev:api
curl localhost:3000/things
curl -X POST localhost:3000/things -H "Content-Type: application/json" -d '{…}'
```

Check the request log line the server prints for each call (method, path, status, duration). Clean up any rows you create — the dev database is a real Neon instance, not a throwaway.
