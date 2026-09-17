import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { tags } from "../db/schema";
import { createTagSchema, updateTagSchema } from "../lib/validation";
import { parseBody } from "../lib/parse-body";
import { HttpError } from "../lib/http-error";

export const tagsRouter = Router();

tagsRouter.get("/", async (_req, res) => {
  const rows = await db.select().from(tags).orderBy(tags.createdAt);
  res.json(rows);
});

// Resolves a scanned NFC UID to its registered tag. The mobile app hits
// this right after a tap, before it knows the tag's internal id.
tagsRouter.get("/uid/:uid", async (req, res) => {
  const [row] = await db.select().from(tags).where(eq(tags.uid, req.params.uid));
  if (!row) throw new HttpError(404, "Tag not registered");
  res.json(row);
});

tagsRouter.get("/:id", async (req, res) => {
  const [row] = await db.select().from(tags).where(eq(tags.id, req.params.id));
  if (!row) throw new HttpError(404, "Tag not found");
  res.json(row);
});

tagsRouter.post("/", async (req, res) => {
  const input = parseBody(createTagSchema, req.body);
  const [row] = await db.insert(tags).values(input).returning();
  res.status(201).json(row);
});

tagsRouter.patch("/:id", async (req, res) => {
  const input = parseBody(updateTagSchema, req.body);
  const [row] = await db
    .update(tags)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(tags.id, req.params.id))
    .returning();
  if (!row) throw new HttpError(404, "Tag not found");
  res.json(row);
});

tagsRouter.delete("/:id", async (req, res) => {
  const [row] = await db.delete(tags).where(eq(tags.id, req.params.id)).returning();
  if (!row) throw new HttpError(404, "Tag not found");
  res.status(204).send();
});
