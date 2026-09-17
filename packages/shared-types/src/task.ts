/**
 * Something a tag can log an event against, e.g. "Took vitamins" or
 * "Started deep work". One task can have many tags pointing at it.
 */
export interface Task {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  name: string;
  description?: string | null;
  color?: string | null;
}

export interface UpdateTaskInput {
  name?: string;
  description?: string | null;
  color?: string | null;
}
