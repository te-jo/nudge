import { z } from "zod";
import type {
  CreateEventInput,
  CreateFolderInput,
  CreateTagInput,
  CreateTaskInput,
  UpdateEventInput,
  UpdateFolderInput,
  UpdateTagInput,
  UpdateTaskInput,
} from "@nudge/shared-types";

export const createFolderSchema = z.object({
  name: z.string().min(1),
}) satisfies z.ZodType<CreateFolderInput>;

export const updateFolderSchema = createFolderSchema.partial() satisfies z.ZodType<UpdateFolderInput>;

export const createTaskSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).nullable().optional(),
  color: z.string().min(1).nullable().optional(),
  folderId: z.uuid().nullable().optional(),
}) satisfies z.ZodType<CreateTaskInput>;

export const updateTaskSchema = createTaskSchema.partial() satisfies z.ZodType<UpdateTaskInput>;

export const createTagSchema = z.object({
  uid: z.string().min(1),
  label: z.string().min(1),
  taskId: z.uuid().nullable().optional(),
  spot: z.string().min(1).nullable().optional(),
}) satisfies z.ZodType<CreateTagInput>;

export const updateTagSchema = z.object({
  label: z.string().min(1).optional(),
  taskId: z.uuid().nullable().optional(),
  spot: z.string().min(1).nullable().optional(),
}) satisfies z.ZodType<UpdateTagInput>;

export const createEventSchema = z.object({
  tagId: z.uuid(),
  note: z.string().min(1).nullable().optional(),
}) satisfies z.ZodType<CreateEventInput>;

// `events` has no updatedAt, so an empty patch would reach Drizzle with an
// empty set clause and throw. Reject it as a 400 instead.
export const updateEventSchema = z
  .object({
    note: z.string().min(1).nullable().optional(),
    taskId: z.uuid().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "provide at least one field to update",
  }) satisfies z.ZodType<UpdateEventInput>;
