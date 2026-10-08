/**
 * A physical NFC tag registered to the app.
 * `uid` is the hardware UID read off the chip and must be unique.
 * A tag can be assigned to a task (what tapping it should log) or left
 * unassigned until the user configures it.
 *
 * `spot` places the tag on one of the fixed spots drawn in a room (e.g.
 * "kitchen.fridge"). The list of spots lives in the mobile app; at most one
 * tag sits on a spot at a time.
 */
export interface Tag {
  id: string;
  uid: string;
  label: string;
  taskId: string | null;
  spot: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagInput {
  uid: string;
  label: string;
  taskId?: string | null;
  spot?: string | null;
}

export interface UpdateTagInput {
  label?: string;
  taskId?: string | null;
  spot?: string | null;
}
