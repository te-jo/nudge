import { z } from "zod";
import type { CreateEventInput, CreateTagInput, CreateTaskInput, UpdateTagInput, UpdateTaskInput } from "@nudge/shared-types";

export const createTaskSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).nullable().optional(),
  color: z.string().min(1).nullable().optional(),
}) satisfies z.ZodType<CreateTaskInput>;

export const updateTaskSchema = createTaskSchema.partial() satisfies z.ZodType<UpdateTaskInput>;

export const createTagSchema = z.object({
  uid: z.string().min(1),
  label: z.string().min(1),
  taskId: z.uuid().nullable().optional(),
}) satisfies z.ZodType<CreateTagInput>;

export const updateTagSchema = z.object({
  label: z.string().min(1).optional(),
  taskId: z.uuid().nullable().optional(),
}) satisfies z.ZodType<UpdateTagInput>;

export const createEventSchema = z.object({
  tagId: z.uuid(),
  note: z.string().min(1).nullable().optional(),
}) satisfies z.ZodType<CreateEventInput>;
