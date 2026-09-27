import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { folders } from "../db/schema";
import { createFolderSchema, updateFolderSchema } from "../lib/validation";
import { parseBody } from "../lib/parse-body";
import { HttpError } from "../lib/http-error";

export const foldersRouter = Router();

foldersRouter.get("/", async (_req, res) => {
  const rows = await db.select().from(folders).orderBy(folders.createdAt);
  res.json(rows);
});

foldersRouter.get("/:id", async (req, res) => {
  const [row] = await db.select().from(folders).where(eq(folders.id, req.params.id));
  if (!row) throw new HttpError(404, "Folder not found");
  res.json(row);
});

foldersRouter.post("/", async (req, res) => {
  const input = parseBody(createFolderSchema, req.body);
  const [row] = await db.insert(folders).values(input).returning();
  res.status(201).json(row);
});

foldersRouter.patch("/:id", async (req, res) => {
  const input = parseBody(updateFolderSchema, req.body);
  const [row] = await db
    .update(folders)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(folders.id, req.params.id))
    .returning();
  if (!row) throw new HttpError(404, "Folder not found");
  res.json(row);
});

// Tasks in this folder are kept — their folder_id is set to null by the FK.
foldersRouter.delete("/:id", async (req, res) => {
  const [row] = await db.delete(folders).where(eq(folders.id, req.params.id)).returning();
  if (!row) throw new HttpError(404, "Folder not found");
  res.status(204).send();
});
