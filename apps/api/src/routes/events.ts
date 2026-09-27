import { Router } from "express";
import { and, desc, eq, lt, type SQL } from "drizzle-orm";
import { db } from "../db/client";
import { events, folders, tags, tasks } from "../db/schema";
import { createEventSchema, updateEventSchema } from "../lib/validation";
import { parseBody } from "../lib/parse-body";
import { HttpError } from "../lib/http-error";

export const eventsRouter = Router();

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

// History list, newest first. Optionally scoped to one tag or task (used
// by the Tag detail screen). `before` (an event's createdAt) pages
// backwards through older events — the client re-requests with the last
// row's createdAt once it gets back a full page.
eventsRouter.get("/", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);

  const conditions: SQL[] = [];
  if (typeof req.query.tagId === "string") conditions.push(eq(events.tagId, req.query.tagId));
  if (typeof req.query.taskId === "string") conditions.push(eq(events.taskId, req.query.taskId));
  if (typeof req.query.before === "string") {
    const before = new Date(req.query.before);
    if (Number.isNaN(before.getTime())) throw new HttpError(400, "before: invalid date");
    conditions.push(lt(events.createdAt, before));
  }

  const rows = await db
    .select({
      id: events.id,
      tagId: events.tagId,
      taskId: events.taskId,
      note: events.note,
      createdAt: events.createdAt,
      tagLabel: tags.label,
      taskName: tasks.name,
      folderName: folders.name,
    })
    .from(events)
    .leftJoin(tags, eq(events.tagId, tags.id))
    .leftJoin(tasks, eq(events.taskId, tasks.id))
    .leftJoin(folders, eq(tasks.folderId, folders.id))
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

// Corrections to a logged event. createdAt stays put — it's the record of
// when the tap actually happened.
eventsRouter.patch("/:id", async (req, res) => {
  const input = parseBody(updateEventSchema, req.body);
  const [row] = await db
    .update(events)
    .set(input)
    .where(eq(events.id, req.params.id))
    .returning();
  if (!row) throw new HttpError(404, "Event not found");
  res.json(row);
});

eventsRouter.delete("/:id", async (req, res) => {
  const [row] = await db.delete(events).where(eq(events.id, req.params.id)).returning();
  if (!row) throw new HttpError(404, "Event not found");
  res.status(204).send();
});
