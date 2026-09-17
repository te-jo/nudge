import type { ZodType } from "zod";
import { HttpError } from "./http-error";

export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`).join(", ");
    throw new HttpError(400, message);
  }
  return result.data;
}
