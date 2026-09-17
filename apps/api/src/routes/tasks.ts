import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { tasks } from "../db/schema";
import { createTaskSchema, updateTaskSchema } from "../lib/validation";
import { parseBody } from "../lib/parse-body";
import { HttpError } from "../lib/http-error";

export const tasksRouter = Router();

tasksRouter.get("/", async (_req, res) => {
  const rows = await db.select().from(tasks).orderBy(tasks.createdAt);
  res.json(rows);
});

tasksRouter.get("/:id", async (req, res) => {
  const [row] = await db.select().from(tasks).where(eq(tasks.id, req.params.id));
  if (!row) throw new HttpError(404, "Task not found");
  res.json(row);
});

tasksRouter.post("/", async (req, res) => {
  const input = parseBody(createTaskSchema, req.body);
  const [row] = await db.insert(tasks).values(input).returning();
  res.status(201).json(row);
});

tasksRouter.patch("/:id", async (req, res) => {
  const input = parseBody(updateTaskSchema, req.body);
  const [row] = await db
    .update(tasks)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(tasks.id, req.params.id))
    .returning();
  if (!row) throw new HttpError(404, "Task not found");
  res.json(row);
});

tasksRouter.delete("/:id", async (req, res) => {
  const [row] = await db.delete(tasks).where(eq(tasks.id, req.params.id)).returning();
  if (!row) throw new HttpError(404, "Task not found");
  res.status(204).send();
});
