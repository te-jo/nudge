/**
 * A physical NFC tag registered to the app.
 * `uid` is the hardware UID read off the chip and must be unique.
 * A tag can be assigned to a task (what tapping it should log) or left
 * unassigned until the user configures it.
 */
export interface Tag {
  id: string;
  uid: string;
  label: string;
  taskId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagInput {
  uid: string;
  label: string;
  taskId?: string | null;
}

export interface UpdateTagInput {
  label?: string;
  taskId?: string | null;
}
