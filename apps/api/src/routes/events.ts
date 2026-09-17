import { Router } from "express";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { db } from "../db/client";
import { events, tags, tasks } from "../db/schema";
import { createEventSchema } from "../lib/validation";
import { parseBody } from "../lib/parse-body";
import { HttpError } from "../lib/http-error";

export const eventsRouter = Router();

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

// History list, newest first. Optionally scoped to one tag or task (used
// by the Tag detail screen). Pagination beyond `limit` is handled when we
// build out the History screen properly.
eventsRouter.get("/", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);

  const conditions: SQL[] = [];
  if (typeof req.query.tagId === "string") conditions.push(eq(events.tagId, req.query.tagId));
  if (typeof req.query.taskId === "string") conditions.push(eq(events.taskId, req.query.taskId));

  const rows = await db
    .select({
      id: events.id,
      tagId: events.tagId,
      taskId: events.taskId,
      note: events.note,
      createdAt: events.createdAt,
      tagLabel: tags.label,
      taskName: tasks.name,
    })
    .from(events)
    .leftJoin(tags, eq(events.tagId, tags.id))
    .leftJoin(tasks, eq(events.taskId, tasks.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(events.createdAt))
    .limit(limit);

  res.json(rows);
});

// Logs a tap. Only `tagId` comes from the client — the task is snapshotted
// server-side from the tag's current assignment.
eventsRouter.post("/", async (req, res) => {
  const input = parseBody(createEventSchema, req.body);

  const [tag] = await db.select().from(tags).where(eq(tags.id, input.tagId));
  if (!tag) throw new HttpError(404, "Tag not found");

  const [row] = await db
    .insert(events)
    .values({ tagId: tag.id, taskId: tag.taskId, note: input.note ?? null })
    .returning();

  res.status(201).json(row);
});
