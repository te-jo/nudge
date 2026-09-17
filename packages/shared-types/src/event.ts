/**
 * A logged tap. `taskId` is a snapshot of the tag's task at tap time, so
 * history stays accurate even if a tag gets reassigned to a different
 * task later.
 */
export interface Event {
  id: string;
  tagId: string;
  taskId: string | null;
  note: string | null;
  createdAt: string;
}

export interface CreateEventInput {
  tagId: string;
  note?: string | null;
}

/** History list items are usually rendered with their task/tag names, not just ids. */
export interface EventWithRelations extends Event {
  tagLabel: string;
  taskName: string | null;
}
